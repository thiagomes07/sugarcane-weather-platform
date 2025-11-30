from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class GeocodingService:
    def __init__(self):
        self.geolocator = Nominatim(user_agent="cana-clima/1.0")
    
    def search_locations(self, query: str, limit: int = 5) -> List[Dict]:
        """Busca localizações por nome (forward geocoding)"""
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
                    "country": address.get("country", "Brasil"),
                    "lat": loc.latitude,
                    "lon": loc.longitude,
                    "display_name": loc.address
                })
            
            return results
            
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.error(f"Erro ao buscar localização: {e}")
            raise
    
    def reverse_geocode(self, lat: float, lon: float) -> Optional[Dict]:
        """Geocoding reverso: coordenadas → endereço (reverse geocoding)"""
        try:
            logger.info(f"[GeocodingService] Iniciando reverse geocoding para {lat}, {lon}")
            
            # Faz requisição reversa ao Nominatim
            location = self.geolocator.reverse(
                f"{lat}, {lon}",
                language="pt-BR"
            )
            
            if not location:
                logger.warning(f"[GeocodingService] Nenhuma localização encontrada para {lat}, {lon}")
                return None
            
            # Extrai informações do endereço
            address = location.raw.get("address", {})
            
            result = {
                "name": address.get("city") or address.get("town") or address.get("village") or "Localização desconhecida",
                "state": address.get("state"),
                "country": address.get("country", "Brasil"),
                "lat": location.latitude,
                "lon": location.longitude,
                "display_name": location.address
            }
            
            logger.info(f"[GeocodingService] ✓ Localização reversa encontrada: {result['name']}, {result['state']}")
            return result
            
        except GeocoderTimedOut:
            logger.error("[GeocodingService] Timeout ao fazer geocoding reverso")
            raise Exception("Tempo esgotado ao buscar localização")
        except GeocoderServiceError as e:
            logger.error(f"[GeocodingService] Erro do serviço de geocoding: {e}")
            raise Exception("Erro ao buscar localização")
        except Exception as e:
            logger.error(f"[GeocodingService] Erro desconhecido: {e}")
            raise Exception(f"Erro ao buscar localização: {str(e)}")

# Instância global
geocoding_service = GeocodingService()