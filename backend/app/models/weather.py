from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class CurrentWeather(BaseModel):
    temperature: float
    humidity: float
    precipitation: float
    wind_speed: float
    wind_direction: int
    cloud_cover: int
    pressure: int
    uv_index: Optional[float] = None
    condition: str
    timestamp: datetime

class AnalysisFactor(BaseModel):
    parameter: str
    status: Literal["ideal", "good", "attention", "warning", "critical"]
    message: str
    recommendation: str

class Alert(BaseModel):
    severity: Literal["info", "warning", "critical"]
    message: str

class SugarcaneAnalysis(BaseModel):
    overall_status: Literal["favorable", "attention", "unfavorable"]
    growth_stage_recommendation: str
    factors: list[AnalysisFactor]
    alerts: list[Alert]

class ForecastSummary(BaseModel):
    next_7_days: dict

class WeatherResponse(BaseModel):
    location: dict
    current_weather: CurrentWeather
    sugarcane_analysis: SugarcaneAnalysis
    forecast_summary: ForecastSummary
    cached: bool
