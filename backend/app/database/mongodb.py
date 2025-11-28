from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

mongodb = MongoDB()

async def connect_to_mongo():
    """Conecta ao MongoDB"""
    try:
        mongodb.client = AsyncIOMotorClient(settings.MONGODB_URL)
        mongodb.db = mongodb.client[settings.MONGODB_DB_NAME]
        
        # Criar índices
        await mongodb.db.insights.create_index([("location.coordinates", "2dsphere")])
        await mongodb.db.insights.create_index([("created_at", -1)])
        await mongodb.db.insights.create_index([("tags", 1)])
        await mongodb.db.insights.create_index([("location.name", 1), ("created_at", -1)])
        
        logger.info("Conectado ao MongoDB com sucesso")
    except Exception as e:
        logger.error(f"Erro ao conectar ao MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Fecha conexão com MongoDB"""
    if mongodb.client:
        mongodb.client.close()
        logger.info("Conexão com MongoDB fechada")

def get_database() -> AsyncIOMotorDatabase:
    return mongodb.db
