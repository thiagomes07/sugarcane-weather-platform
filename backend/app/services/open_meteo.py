import httpx
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class OpenMeteoService:
    BASE_URL = "https://api.open-meteo.com/v1"
    
    async def get_current_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        """Busca dados climáticos da Open-Meteo API"""
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "precipitation",
                "weather_code",
                "cloud_cover",
                "pressure_msl",
                "wind_speed_10m",
                "wind_direction_10m"
            ],
            "hourly": ["temperature_2m", "precipitation", "uv_index"],
            "daily": [
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "precipitation_hours",
                "sunrise", "sunset"
            ],
            "timezone": "auto",
            "forecast_days": 7
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/forecast",
                    params=params,
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException:
            logger.error(f"Timeout ao buscar dados climáticos para {lat}, {lon}")
            raise
        except httpx.HTTPError as e:
            logger.error(f"Erro HTTP ao buscar dados climáticos: {e}")
            raise

open_meteo_service = OpenMeteoService()
