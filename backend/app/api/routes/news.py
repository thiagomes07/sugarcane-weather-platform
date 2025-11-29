from fastapi import APIRouter, Query, HTTPException
from app.config import settings
import httpx
import logging
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter()
logger = logging.getLogger(__name__)

# Cache em memória (1 hora)
_news_cache = {
    "data": None,
    "timestamp": None,
    "category": None
}

CACHE_TTL_MINUTES = 60
NEWS_CATEGORIES = {
    "AGRIBUSINESS": 'agronegócio OR agricultura OR "cana-de-açúcar"',
    "SUGARCANE": '"cana-de-açúcar" OR "canavial" OR "usina de açúcar"',
    "WEATHER": "clima OR meteorologia AND agricultura",
}

@router.get("/news")
async def get_news(
    category: str = Query("AGRIBUSINESS", description="Categoria de notícias"),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("publishedAt", regex="^(relevancy|popularity|publishedAt)$")
):
    """
    Proxy para NewsAPI - Evita bloqueio CORS em produção
    
    Rate limit: 100 req/dia da NewsAPI
    Cache: 1 hora para economizar quota
    """
    
    # Verifica cache
    now = datetime.utcnow()
    if (
        _news_cache["data"] is not None
        and _news_cache["category"] == category
        and _news_cache["timestamp"] is not None
        and (now - _news_cache["timestamp"]).total_seconds() < CACHE_TTL_MINUTES * 60
    ):
        logger.info(f"[News] Cache HIT para categoria {category}")
        return {
            **_news_cache["data"],
            "cached": True,
            "cached_at": _news_cache["timestamp"].isoformat()
        }
    
    # Valida categoria
    if category not in NEWS_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_CATEGORY",
                "message": f"Categoria inválida. Use: {', '.join(NEWS_CATEGORIES.keys())}"
            }
        )
    
    # Busca query da categoria
    search_query = NEWS_CATEGORIES[category]
    
    # Requisição à NewsAPI (server-side - SEM CORS)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://newsapi.org/v2/everything",
                params={
                    "q": search_query,
                    "language": "pt",
                    "sortBy": sort_by,
                    "pageSize": page_size,
                    "apiKey": settings.NEWSAPI_KEY
                },
                timeout=15.0
            )
            
            if response.status_code == 401:
                logger.error("[News] NewsAPI key inválida")
                raise HTTPException(
                    status_code=503,
                    detail={
                        "code": "NEWS_API_ERROR",
                        "message": "Serviço de notícias temporariamente indisponível"
                    }
                )
            
            if response.status_code == 429:
                logger.error("[News] Quota da NewsAPI excedida")
                raise HTTPException(
                    status_code=429,
                    detail={
                        "code": "NEWS_API_QUOTA_EXCEEDED",
                        "message": "Limite diário de notícias excedido",
                        "retry_after": 3600
                    }
                )
            
            response.raise_for_status()
            data = response.json()
            
            # Processa artigos (remove [Removed])
            articles = [
                article for article in data.get("articles", [])
                if article.get("title") and "[Removed]" not in article["title"]
            ]
            
            result = {
                "articles": articles,
                "total_results": len(articles),
                "category": category,
                "cached": False
            }
            
            # Atualiza cache
            _news_cache["data"] = result
            _news_cache["timestamp"] = now
            _news_cache["category"] = category
            
            logger.info(f"[News] Busca realizada: {len(articles)} artigos (categoria: {category})")
            return result
            
    except httpx.TimeoutException:
        logger.error("[News] Timeout ao buscar notícias")
        raise HTTPException(
            status_code=504,
            detail={
                "code": "NEWS_API_TIMEOUT",
                "message": "Timeout ao buscar notícias"
            }
        )
    except httpx.HTTPError as e:
        logger.error(f"[News] Erro HTTP: {e}")
        raise HTTPException(
            status_code=503,
            detail={
                "code": "NEWS_API_ERROR",
                "message": "Erro ao buscar notícias"
            }
        )


@router.get("/news/top-headlines")
async def get_top_headlines(
    country: str = Query("br", regex="^[a-z]{2}$"),
    category: str = Query("business", regex="^(business|technology|science)$")
):
    """
    Top headlines do Brasil (business/tech/science)
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://newsapi.org/v2/top-headlines",
                params={
                    "country": country,
                    "category": category,
                    "apiKey": settings.NEWSAPI_KEY
                },
                timeout=15.0
            )
            
            response.raise_for_status()
            data = response.json()
            
            articles = [
                article for article in data.get("articles", [])
                if article.get("title") and "[Removed]" not in article["title"]
            ]
            
            return {
                "articles": articles,
                "total_results": len(articles),
                "country": country,
                "category": category
            }
            
    except Exception as e:
        logger.error(f"[News Headlines] Erro: {e}")
        raise HTTPException(status_code=503, detail="Erro ao buscar headlines")