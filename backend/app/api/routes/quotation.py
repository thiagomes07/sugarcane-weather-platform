"""
Rota para cotação de cana-de-açúcar
Scraping de https://www.noticiasagricolas.com.br
"""

from fastapi import APIRouter, HTTPException
from app.services.quotation import quotation_service
from typing import List, Dict, Any
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/quotation")
async def get_quotation():
    """
    Retorna a cotação da cana-de-açúcar (Campo vs Esteira)
    
    Rate limit: Sem limite específico (operação rara, em cache 1 hora)
    Cache: 1 hora no backend
    
    Resposta:
    [
        {
            "data": "2025-11-03T00:00:00",
            "data_formatada": "03/11/2025",
            "valor_campo": 129.5,
            "valor_esteira": 144.64
        },
        ...
    ]
    """
    try:
        logger.info("[Quotation] Iniciando busca de cotação")
        data = await quotation_service.get_sugarcane_quotation()
        logger.info(f"[Quotation] Cotação obtida com sucesso: {len(data)} registros")
        return data
    except Exception as e:
        logger.error(f"[Quotation] Erro ao buscar cotação: {e}")
        raise HTTPException(
            status_code=503,
            detail={
                "error": {
                    "code": "QUOTATION_SCRAPING_ERROR",
                    "message": "Não foi possível obter a cotação da cana-de-açúcar no momento.",
                    "details": str(e)
                }
            }
        )