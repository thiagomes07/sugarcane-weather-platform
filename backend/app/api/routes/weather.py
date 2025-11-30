from fastapi import APIRouter, Query, HTTPException
from app.services.open_meteo import open_meteo_service
from app.core.cache import weather_cache
from app.core.sugarcane_analyzer import SugarcaneAnalyzer
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Função auxiliar para mapear códigos WMO do OpenMeteo para ícones do OpenWeather
def map_wmo_to_icon(code: int, is_day: int = 1) -> str:
    # 0: Clear sky
    if code == 0: return "01d" if is_day else "01n"
    # 1, 2, 3: Mainly clear, partly cloudy, and overcast
    if code in [1, 2, 3]: return "02d" if code == 1 else ("03d" if code == 2 else "04d")
    # 45, 48: Fog
    if code in [45, 48]: return "50d"
    # 51-55, 61-65, 80-82: Rain/Drizzle
    if code in [51, 53, 55, 61, 63, 65, 80, 81, 82]: return "10d"
    # 95, 96, 99: Thunderstorm
    if code in [95, 96, 99]: return "11d"
    return "03d" # Default

@router.get("/weather")
async def get_weather(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    location_name: str = Query(...)
):
    """Retorna dados climáticos enriquecidos"""
    
    # Verificar cache (Mantenha sua lógica de cache aqui)
    cached_data = weather_cache.get(lat, lon)
    if cached_data:
        cached_data["cached"] = True
        return cached_data
    
    try:
        # Buscar dados da API
        raw_data = await open_meteo_service.get_current_weather(lat, lon)
        
        current = raw_data.get("current", {})
        daily = raw_data.get("daily", {})
        
        # Dados auxiliares
        is_day = 1 # Simplificação, idealmente calcular baseado na hora
        wmo_code = current.get("weather_code", 0)
        
        # Mapeamento Estrutural para simular OpenWeatherMap (Necessário para o Frontend)
        weather_structure = {
            "coord": {"lat": lat, "lon": lon},
            "weather": [{
                "id": 800, # Dummy ID
                "main": "Clear" if wmo_code == 0 else "Clouds", # Simplificado
                "description": "Condição atual",
                "icon": map_wmo_to_icon(wmo_code, is_day)
            }],
            "base": "stations",
            "main": {
                "temp": current.get("temperature_2m", 0),
                "feels_like": current.get("temperature_2m", 0), # OpenMeteo free não tem feels_like direto no current
                "temp_min": daily.get("temperature_2m_min", [0])[0],
                "temp_max": daily.get("temperature_2m_max", [0])[0],
                "pressure": current.get("pressure_msl", 1013),
                "humidity": current.get("relative_humidity_2m", 0),
            },
            "visibility": 10000, # OpenMeteo não manda visibility no endpoint simples, hardcoded para não quebrar
            "wind": {
                "speed": current.get("wind_speed_10m", 0) / 3.6, # Convertendo km/h para m/s se necessário, ou ajuste no front
                "deg": current.get("wind_direction_10m", 0)
            },
            "clouds": {
                "all": current.get("cloud_cover", 0)
            },
            "rain": {
                "1h": current.get("precipitation", 0)
            },
            "dt": int(datetime.utcnow().timestamp()),
            "sys": {
                "country": "BR", # Pode vir do geocoding, aqui fixo ou extraído do location_name
                "sunrise": int(datetime.fromisoformat(daily.get("sunrise", [datetime.now().isoformat()])[0]).timestamp()),
                "sunset": int(datetime.fromisoformat(daily.get("sunset", [datetime.now().isoformat()])[0]).timestamp())
            },
            "timezone": raw_data.get("utc_offset_seconds", -10800),
            "id": 0,
            "name": location_name,
            "cod": 200
        }
        
        # Calcular UV (média das próximas 6h)
        hourly = raw_data.get("hourly", {})
        uv_val = 0
        if "uv_index" in hourly and hourly["uv_index"]:
            uv_val = sum(hourly["uv_index"][:6]) / 6
            # Injeta UV em algum lugar que o front leia ou apenas no weather_data simplificado para análise
        
        # Dados para análise interna (SugarcaneAnalyzer usa chaves simples)
        analyzer_data = {
            "temperature": current.get("temperature_2m", 0),
            "humidity": current.get("relative_humidity_2m", 0),
            "precipitation": current.get("precipitation", 0),
            "wind_speed": current.get("wind_speed_10m", 0),
            "uv_index": uv_val
        }
        
        # Análise para cana-de-açúcar
        analysis = SugarcaneAnalyzer.analyze(analyzer_data)
        
        # Previsão (Forecast) - Mantém estrutura para o gráfico
        forecast_list = []
        # Precisaríamos converter o daily do OpenMeteo para a lista de 3h do OpenWeather
        # Para simplificar e não quebrar o gráfico, vamos criar um mock baseado no daily
        for i in range(len(daily.get("time", []))):
            forecast_list.append({
                "dt": int(datetime.fromisoformat(daily["time"][i]).timestamp()),
                "main": {
                    "temp": daily["temperature_2m_max"][i],
                    "temp_min": daily["temperature_2m_min"][i],
                    "temp_max": daily["temperature_2m_max"][i],
                    "humidity": 60 # Mock
                },
                "weather": [{"main": "Rain" if daily["precipitation_sum"][i] > 0 else "Clear", "icon": "01d"}],
                "clouds": {"all": 0},
                "wind": {"speed": 10, "deg": 0},
                "visibility": 10000,
                "pop": 0.5 if daily["precipitation_sum"][i] > 0 else 0,
                "rain": {"3h": daily["precipitation_sum"][i]},
                "sys": {"pod": "d"},
                "dt_txt": f"{daily['time'][i]} 12:00:00"
            })

        forecast_response = {
            "cod": "200",
            "message": 0,
            "cnt": len(forecast_list),
            "list": forecast_list,
            "city": {
                "id": 0,
                "name": location_name,
                "coord": {"lat": lat, "lon": lon},
                "country": "BR",
                "population": 0,
                "timezone": raw_data.get("utc_offset_seconds", 0),
                "sunrise": weather_structure["sys"]["sunrise"],
                "sunset": weather_structure["sys"]["sunset"]
            }
        }
        
        # Montar resposta final com a chave "current" (não current_weather)
        response = {
            "location": {
                "name": location_name,
                "lat": lat,
                "lon": lon,
                "timezone": raw_data.get("timezone", "America/Sao_Paulo")
            },
            # AQUI ESTÁ A CORREÇÃO PRINCIPAL: Chave "current" com estrutura complexa
            "current": weather_structure, 
            "sugarcane_analysis": analysis,
            "forecast": forecast_response, # Frontend espera "forecast" completo, não "forecast_summary"
            "cached": False
        }
        
        # Salvar no cache
        weather_cache.set(lat, lon, response)
        
        return response
        
    except Exception as e:
        logger.error(f"Erro ao buscar dados climáticos: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "WEATHER_API_ERROR",
                "message": "Não foi possível obter dados climáticos",
                "details": str(e)
            }
        )
