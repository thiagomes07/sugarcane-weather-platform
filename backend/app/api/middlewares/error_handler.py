from fastapi import Request, status
from fastapi.responses import JSONResponse
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

async def error_handler_middleware(request: Request, call_next):
    """Middleware global para tratamento de erros"""
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(f"Erro não tratado: {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Erro interno do servidor",
                    "details": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )