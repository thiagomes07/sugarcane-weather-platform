from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

class GeocodingService:
    def __init__(self):
        self.geolocator = Nominatim(user_agent="cana-clima/1.0")
    
    def search_locations(self, query: str, limit: int = 5) -> List[Dict]:
        """Busca localizações por nome"""
        try:
            locations = self.geolocator.geocode(
                query,
                exactly_one=False,
                limit=limit,
                addressdetails=True,
                language="pt-BR"
            )
            
            if not locations:
                return []
            
            results = []
            for loc in locations:
                address = loc.raw.get("address", {})
                results.append({
                    "name": address.get("city") or address.get("town") or address.get("village") or loc.address.split(",")[0],
                    "state": address.get("state"),
                    "country": address.get("country", "Brazil"),
                    "lat": loc.latitude,
                    "lon": loc.longitude,
                    "display_name": loc.address
                })
            
            return results
            
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.error(f"Erro ao buscar localização: {e}")
            raise

geocoding_service = GeocodingService()
