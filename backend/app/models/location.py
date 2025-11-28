from pydantic import BaseModel, Field
from typing import Optional

class LocationSuggestion(BaseModel):
    name: str
    state: Optional[str] = None
    country: str
    lat: float
    lon: float
    display_name: str

class LocationSearchResponse(BaseModel):
    suggestions: list[LocationSuggestion]

class Location(BaseModel):
    name: str
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    state: Optional[str] = None
