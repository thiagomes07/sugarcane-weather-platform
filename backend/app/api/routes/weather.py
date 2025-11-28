from fastapi import APIRouter, Query, HTTPException
from app.services.open_meteo import open_meteo_service
from app.core.cache import weather_cache
from app.core.sugarcane_analyzer import SugarcaneAnalyzer
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/weather")
async def get_weather(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    location_name: str = Query(...)
):
    """Retorna dados climáticos enriquecidos"""
    
    # Verificar cache
    cached_data = weather_cache.get(lat, lon)
    if cached_data:
        cached_data["cached"] = True
        return cached_data
    
    try:
        # Buscar dados da API
        raw_data = await open_meteo_service.get_current_weather(lat, lon)
        
        # Processar dados
        current = raw_data.get("current", {})
        weather_data = {
            "temperature": current.get("temperature_2m", 0),
            "humidity": current.get("relative_humidity_2m", 0),
            "precipitation": current.get("precipitation", 0),
            "wind_speed": current.get("wind_speed_10m", 0),
            "wind_direction": current.get("wind_direction_10m", 0),
            "cloud_cover": current.get("cloud_cover", 0),
            "pressure": current.get("pressure_msl", 0),
            "condition": "Parcialmente nublado",  # Mapear weather_code
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Calcular UV index (média das próximas 6h)
        hourly = raw_data.get("hourly", {})
        if "uv_index" in hourly and hourly["uv_index"]:
            weather_data["uv_index"] = sum(hourly["uv_index"][:6]) / 6
        
        # Análise para cana-de-açúcar
        analysis = SugarcaneAnalyzer.analyze(weather_data)
        
        # Previsão
        daily = raw_data.get("daily", {})
        forecast = {
            "next_7_days": {
                "avg_temperature": sum(daily.get("temperature_2m_max", [0]*7)) / 7,
                "total_precipitation": sum(daily.get("precipitation_sum", [0]*7)),
                "rainy_days": len([p for p in daily.get("precipitation_sum", []) if p > 0])
            }
        }
        
        response = {
            "location": {
                "name": location_name,
                "lat": lat,
                "lon": lon,
                "timezone": raw_data.get("timezone", "America/Sao_Paulo")
            },
            "current_weather": weather_data,
            "sugarcane_analysis": analysis,
            "forecast_summary": forecast,
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
