from pydantic import BaseModel, Field
from typing import Optional, List 
from datetime import datetime

class WeatherSnapshot(BaseModel):
    temperature: float
    humidity: float
    precipitation: float = 0
    condition: str
    timestamp: Optional[datetime] = None

class InsightLocation(BaseModel):
    name: str
    lat: float
    lon: float
    state: Optional[str] = None
    country: Optional[str] = "Brasil" 

# --- NOVO: Modelo para o Autor ---
class InsightAuthor(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    role: Optional[str] = Field(None, max_length=50)

class InsightCreate(BaseModel):
    author: InsightAuthor 
    location: InsightLocation
    weather_snapshot: WeatherSnapshot
    content: str = Field(..., min_length=10, max_length=1000)
    tags: list[str] = Field(default_factory=list, max_length=5)

class InsightResponse(BaseModel):
    id: str
    author: InsightAuthor
    location: dict
    weather_snapshot: dict
    content: str
    tags: list[str]
    created_at: datetime
    reactions: dict = {"helpful": 0, "tried": 0}

class InsightListResponse(BaseModel):
    insights: list[InsightResponse]
    pagination: dict