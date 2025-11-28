from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class InsightsService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.insights
    
    async def create_insight(self, insight_data: Dict) -> str:
        """Cria novo insight"""
        insight_data["created_at"] = datetime.utcnow()
        insight_data["updated_at"] = datetime.utcnow()
        insight_data["reactions"] = {"helpful": 0, "tried": 0}
        
        # Converter location para GeoJSON
        if "location" in insight_data:
            loc = insight_data["location"]
            insight_data["location"]["coordinates"] = {
                "type": "Point",
                "coordinates": [loc["lon"], loc["lat"]]
            }
        
        result = await self.collection.insert_one(insight_data)
        return str(result.inserted_id)
    
    async def get_insights(
        self, 
        location: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict:
        """Lista insights com paginação"""
        query = {}
        if location:
            query["location.name"] = {"$regex": location, "$options": "i"}
        
        total = await self.collection.count_documents(query)
        cursor = self.collection.find(query).sort("created_at", -1).skip(offset).limit(limit)
        
        insights = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            insights.append(doc)
        
        return {
            "insights": insights,
            "pagination": {
                "total": total,
                "limit": limit,
                "offset": offset,
                "pages": (total + limit - 1) // limit
            }
        }
    
    async def get_nearby_insights(
        self,
        lat: float,
        lon: float,
        radius_km: int = 100,
        limit: int = 20
    ) -> List[Dict]:
        """Busca insights próximos usando geolocalização"""
        query = {
            "location.coordinates": {
                "$near": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [lon, lat]
                    },
                    "$maxDistance": radius_km * 1000  # converter km para metros
                }
            }
        }
        
        cursor = self.collection.find(query).limit(limit)
        insights = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            insights.append(doc)
        
        return insights
