from fastapi import APIRouter, Depends
from app.database.mongodb import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Health check endpoint"""
    try:
        # Testar conexão com MongoDB
        await db.command("ping")
        db_status = "connected"
    except:
        db_status = "disconnected"
    
    is_healthy = db_status == "connected"
    
    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": db_status,
            "cache": "operational"
        },
        "version": "1.0.0"
    }, 200 if is_healthy else 503
