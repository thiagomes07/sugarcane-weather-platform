from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.insight import InsightCreate, InsightResponse, InsightListResponse
from app.services.insights_service import InsightsService
from app.database.mongodb import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def get_insights_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> InsightsService:
    return InsightsService(db)

@router.post("/insights", status_code=201)
async def create_insight(
    insight: InsightCreate,
    service: InsightsService = Depends(get_insights_service)
):
    """Criar novo insight"""
    try:
        insight_id = await service.create_insight(insight.dict())
        return {
            "id": insight_id,
            "message": "Insight compartilhado com sucesso!"
        }
    except Exception as e:
        logger.error(f"Erro ao criar insight: {e}")
        raise HTTPException(status_code=500, detail="Erro ao salvar insight")
    
@router.get("/insights")
async def list_insights(
    location: str = Query(None),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    service: InsightsService = Depends(get_insights_service)
):
    """Listar insights"""
    try:
        return await service.get_insights(location, limit, offset)
    except Exception as e:
        logger.error(f"Erro ao listar insights: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar insights")

@router.get("/insights/nearby")
async def get_nearby_insights(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_km: int = Query(100, ge=1, le=500),
    limit: int = Query(20, ge=1, le=50),
    service: InsightsService = Depends(get_insights_service)
):
    """Buscar insights próximos"""
    try:
        insights = await service.get_nearby_insights(lat, lon, radius_km, limit)
        return {
        "insights": insights,
        "search_center": {"lat": lat, "lon": lon, "radius_km": radius_km}
        }
    except Exception as e:
        logger.error(f"Erro ao buscar insights próximos: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar insights")
