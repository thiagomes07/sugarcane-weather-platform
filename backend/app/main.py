from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.api.routes import health, locations, weather, insights
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
    title="Cana Clima API",
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
app.include_router(health.router, tags=["Health"])
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

@app.get("/")
async def root():
    return {
        "message": "Cana Clima API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
