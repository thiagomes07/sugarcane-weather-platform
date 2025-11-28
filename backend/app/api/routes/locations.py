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
