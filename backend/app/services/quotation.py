"""
Serviço de Scraping de Cotação de Cana-de-Açúcar
Fonte: https://www.noticiasagricolas.com.br/cotacoes/sucroenergetico/acucar-preco-da-cana-basica-pr
"""

import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Any
import logging
from datetime import datetime
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

class QuotationCache(ABC):
    """Interface para cache de cotação"""
    
    @abstractmethod
    async def get(self) -> List[Dict[str, Any]] | None:
        pass
    
    @abstractmethod
    async def set(self, data: List[Dict[str, Any]]) -> None:
        pass


class InMemoryQuotationCache(QuotationCache):
    """Cache em memória (simples, sem persistência)"""
    
    def __init__(self):
        self.data: List[Dict[str, Any]] | None = None
        self.timestamp: datetime | None = None
        self.ttl_seconds = 3600  # 1 hora
    
    async def get(self) -> List[Dict[str, Any]] | None:
        if self.data is None or self.timestamp is None:
            return None
        
        age_seconds = (datetime.now() - self.timestamp).total_seconds()
        if age_seconds > self.ttl_seconds:
            logger.info("[QuotationCache] Cache expirado")
            self.data = None
            self.timestamp = None
            return None
        
        logger.info(f"[QuotationCache] Cache HIT (idade: {age_seconds:.0f}s)")
        return self.data
    
    async def set(self, data: List[Dict[str, Any]]) -> None:
        self.data = data
        self.timestamp = datetime.now()
        logger.info(f"[QuotationCache] Dados cacheados ({len(data)} registros)")


class QuotationScraper:
    """Scraper para cotação de cana-de-açúcar"""
    
    URL = "https://www.noticiasagricolas.com.br/cotacoes/sucroenergetico/acucar-preco-da-cana-basica-pr"
    
    # Headers padrão (identifica como navegador legítimo)
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    }
    
    async def scrape(self) -> List[Dict[str, Any]]:
        """
        Faz scraping da página de cotação
        
        Retorna lista de dicts com:
        - data: ISO timestamp
        - data_formatada: "dd/mm/aaaa"
        - valor_campo: float (R$/ton)
        - valor_esteira: float (R$/ton)
        """
        try:
            logger.info(f"[Scraper] Iniciando scraping: {self.URL}")
            
            # Requisição HTTP
            async with httpx.AsyncClient(headers=self.HEADERS, timeout=30.0) as client:
                response = await client.get(self.URL)
                response.raise_for_status()
                html = response.text
            
            logger.info(f"[Scraper] Página obtida ({len(html)} bytes)")
            
            # Parse HTML
            soup = BeautifulSoup(html, "html.parser")
            blocos = soup.find_all("div", class_="cotacao")
            logger.info(f"[Scraper] Blocos encontrados: {len(blocos)}")
            
            registros = []
            
            for bloco in blocos:
                try:
                    registro = self._parse_bloco(bloco)
                    if registro:
                        registros.append(registro)
                except Exception as e:
                    logger.warning(f"[Scraper] Erro ao parsear bloco: {e}")
                    continue
            
            logger.info(f"[Scraper] Registros válidos: {len(registros)}")
            
            # Retorna apenas os 10 mais recentes
            return sorted(registros, key=lambda x: x['data'], reverse=True)[:10]
            
        except httpx.TimeoutException:
            logger.error("[Scraper] Timeout ao buscar página")
            raise Exception("Timeout ao acessar fonte de dados")
        except httpx.HTTPError as e:
            logger.error(f"[Scraper] Erro HTTP: {e}")
            raise Exception(f"Erro ao acessar página: {e}")
        except Exception as e:
            logger.error(f"[Scraper] Erro desconhecido: {e}")
            raise
    
    def _parse_bloco(self, bloco) -> Dict[str, Any] | None:
        """Parse um bloco individual de cotação"""
        
        # Extrai data
        info = bloco.find("div", class_="info")
        if not info:
            return None
        
        fechamento_div = info.find("div", class_="fechamento")
        if not fechamento_div:
            return None
        
        fechamento_str = fechamento_div.get_text(strip=True)
        
        # Remove prefixo "Fechamento: "
        data_str = fechamento_str.replace("Fechamento: ", "")
        
        # Parse data
        try:
            data_obj = datetime.strptime(data_str, "%d/%m/%Y")
        except ValueError:
            logger.warning(f"Data inválida: {data_str}")
            return None
        
        # Parse tabela
        tabela = bloco.find("table", class_="cot-fisicas")
        if not tabela:
            return None
        
        try:
            linhas = tabela.find("tbody").find_all("tr")
        except AttributeError:
            return None
        
        valor_campo = None
        valor_esteira = None
        
        for tr in linhas:
            tds = tr.find_all("td")
            if len(tds) < 2:
                continue
            
            tipo = tds[0].get_text(strip=True).lower()
            valor_str = tds[1].get_text(strip=True)
            
            if not valor_str:
                continue
            
            try:
                # Converte "129,50" para 129.5
                valor_num = float(valor_str.replace(".", "").replace(",", "."))
            except ValueError:
                continue
            
            if "campo" in tipo:
                valor_campo = valor_num
            elif "esteira" in tipo:
                valor_esteira = valor_num
        
        # Retorna se houver pelo menos um valor
        if valor_campo is None and valor_esteira is None:
            return None
        
        return {
            "data": data_obj.isoformat(),
            "data_formatada": data_str,
            "valor_campo": valor_campo,
            "valor_esteira": valor_esteira,
        }


class QuotationService:
    """Serviço de cotação com cache"""
    
    def __init__(self):
        self.scraper = QuotationScraper()
        self.cache = InMemoryQuotationCache()
    
    async def get_sugarcane_quotation(self) -> List[Dict[str, Any]]:
        """
        Obtém cotação de cana (com cache)
        
        1. Verifica cache em memória
        2. Se expirado/vazio, faz novo scraping
        3. Armazena em cache
        """
        
        # Tenta cache primeiro
        cached = await self.cache.get()
        if cached:
            return cached
        
        # Cache miss: faz scraping
        logger.info("[QuotationService] Cache miss - iniciando scraping")
        data = await self.scraper.scrape()
        
        # Armazena no cache
        await self.cache.set(data)
        
        return data


# Instância global do serviço
quotation_service = QuotationService()