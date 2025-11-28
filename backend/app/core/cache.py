from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class WeatherCache:
    def __init__(self, ttl_minutes: int = 30):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = timedelta(minutes=ttl_minutes)
    
    def _generate_key(self, lat: float, lon: float) -> str:
        """Gera chave única arredondando coordenadas para 2 decimais (~1km)"""
        rounded_lat = round(lat, 2)
        rounded_lon = round(lon, 2)
        return f"weather:{rounded_lat}:{rounded_lon}"
    
    def get(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        key = self._generate_key(lat, lon)
        if key in self._cache:
            entry = self._cache[key]
            if datetime.now() < entry['expires_at']:
                logger.info(f"Cache HIT: {key}")
                return entry['data']
            else:
                del self._cache[key]
                logger.info(f"Cache EXPIRED: {key}")
        return None
    
    def set(self, lat: float, lon: float, data: Dict[str, Any]):
        key = self._generate_key(lat, lon)
        self._cache[key] = {
            'data': data,
            'expires_at': datetime.now() + self.ttl,
            'created_at': datetime.now()
        }
        logger.info(f"Cache SET: {key}")
    
    def clear_expired(self):
        """Remove entradas expiradas"""
        now = datetime.now()
        expired_keys = [
            k for k, v in self._cache.items() 
            if now >= v['expires_at']
        ]
        for key in expired_keys:
            del self._cache[key]
        if expired_keys:
            logger.info(f"Cleared {len(expired_keys)} expired cache entries")

# Instância global
weather_cache = WeatherCache()
