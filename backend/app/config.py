from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Application
    ENV: str = "development"
    DEBUG: bool = True
    API_VERSION: str = "v1"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017/sugarcane"
    MONGODB_DB_NAME: str = "sugarcane"
    
    # Cache
    CACHE_TTL_MINUTES: int = 30
    
    # External APIs
    NEWSAPI_KEY: str = ""
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()