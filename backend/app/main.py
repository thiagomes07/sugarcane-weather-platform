from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.api.routes import health, locations, weather, insights, news, quotation
from app.api.middlewares.error_handler import error_handler_middleware

# Configurar logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerenciar lifecycle da aplicação"""
    # Startup
    logger.info("Iniciando aplicação...")
    await connect_to_mongo()
    yield
    # Shutdown
    logger.info("Encerrando aplicação...")
    await close_mongo_connection()

# Criar aplicação
app = FastAPI(
    title="Cana Data API",
    description="Sistema de monitoramento climático para produtores de cana-de-açúcar",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de erro
app.middleware("http")(error_handler_middleware)

# Rotas
# Health check (sem prefixo)
app.include_router(health.router, tags=["Health"])

# Rotas com prefixo /api/v1
app.include_router(
    locations.router,
    prefix=f"/api/{settings.API_VERSION}",
    tags=["Locations"]
)
app.include_router(
    weather.router,
    prefix=f"/api/{settings.API_VERSION}",
    tags=["Weather"]
)
app.include_router(
    insights.router,
    prefix=f"/api/{settings.API_VERSION}",
    tags=["Insights"]
)
app.include_router(
    news.router,
    prefix=f"/api/{settings.API_VERSION}",
    tags=["News"]
)

app.include_router(
    quotation.router,
    prefix=f"/api/{settings.API_VERSION}",
    tags=["Quotation"]
)

app.include_router(
    quotation.router,
    tags=["Quotation (Root)"]
)

@app.get("/")
async def root():
    return {
        "message": "Cana Data API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "weather": "/api/v1/weather",
            "locations": "/api/v1/locations/search",
            "insights": "/api/v1/insights",
            "news": "/api/v1/news",
            "quotation": "/quotation or /api/v1/quotation"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )