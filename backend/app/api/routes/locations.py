from fastapi import APIRouter, Query, HTTPException
from app.services.geocoding import geocoding_service
from app.models.location import LocationSearchResponse
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/locations/search", response_model=LocationSearchResponse)
async def search_locations(
    q: str = Query(..., min_length=3, description="Termo de busca"),
    limit: int = Query(5, ge=1, le=10, description="Número de sugestões")
):
    """Autocomplete de cidades"""
    try:
        suggestions = geocoding_service.search_locations(q, limit)
        return {"suggestions": suggestions}
    except Exception as e:
        logger.error(f"Erro ao buscar localizações: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "GEOCODING_ERROR",
                "message": "Erro ao buscar localizações",
                "details": str(e)
            }
        )


@router.get("/locations/reverse")
async def reverse_geocode(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude")
):
    """
    Geocoding reverso: converte coordenadas em endereço
    Útil quando o usuário permite geolocalização do navegador
    """
    try:
        logger.info(f"[ReverseGeocode] Buscando endereço para {lat}, {lon}")
        
        # Chama serviço de geocoding reverso
        location = geocoding_service.reverse_geocode(lat, lon)
        
        if not location:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "LOCATION_NOT_FOUND",
                    "message": "Nenhuma localização encontrada para essas coordenadas"
                }
            )
        
        logger.info(f"[ReverseGeocode] ✓ Localização encontrada: {location['name']}")
        
        return {
            "location": location,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao fazer geocoding reverso: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "GEOCODING_ERROR",
                "message": "Erro ao buscar localização",
                "details": str(e)
            }
        )