a# Documentação do Backend - Sistema de Clima para Produtores de Cana-de-Açúcar

## Setup e Execução

### Docker Compose (Recomendado)

O backend roda integrado ao frontend e MongoDB via Docker Compose:

```bash
# Na raiz do projeto
docker-compose up --build
```

**Serviços iniciados:**
- Backend (FastAPI): http://localhost:8000
- Frontend (Next.js): http://localhost:3000
- MongoDB: localhost:27017
- Nginx (reverse proxy + rate limiting)

**Documentação interativa:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Produção

Sistema deployado e disponível:
- **API Base**: http://98.94.92.42:8000
- **Documentação**: http://98.94.92.42:8000/docs

---

## 1. Visão Geral

O backend é uma API RESTful em **Python com FastAPI** que integra múltiplas fontes de dados agrícolas:

- **Dados climáticos** contextualizados para cultivo de cana-de-açúcar (Open-Meteo)
- **Notícias do setor** (NewsAPI)
- **Cotações de cana** via scraping (NoticiasAgrícolas)
- **Autocomplete de cidades** (Nominatim/OpenStreetMap)
- **Sistema de compartilhamento de insights** entre produtores (MongoDB)
- **Cache inteligente** para otimizar requisições

---

## 2. Justificativa Técnica

### 2.1 Por que Backend?

Embora seja tecnicamente viável consumir APIs diretamente no frontend, o backend agrega valor através de:

**Inteligência de Negócio**
- Interpretação de dados climáticos no contexto agrícola específico
- Geração automática de recomendações baseadas em limiares científicos

**Agregação de Dados**
- Múltiplas fontes consolidadas em respostas estruturadas
- Transformação de dados brutos em informações acionáveis

**Cache Compartilhado**
- Beneficia todos os usuários simultaneamente
- Redução de chamadas redundantes às APIs externas

**Segurança**
- Proteção de chaves de API (NewsAPI)
- Rate limiting centralizado via Nginx
- Validação e sanitização de dados

---

## 3. Stack Tecnológica

```
- Python 3.11+
- FastAPI (framework web assíncrono)
- Uvicorn (ASGI server)
- Nginx (reverse proxy, load balancer, rate limiting)
- MongoDB (armazenamento de insights)
- Motor (driver async para MongoDB)
- Pydantic (validação de dados)
- HTTPX (cliente HTTP assíncrono)
- BeautifulSoup4 (scraping de cotações)
- Geopy/Nominatim (geocoding)
```

---

## 4. Arquitetura de Diretórios

```
backend/
├── app/
│   ├── main.py                    # Entry point
│   ├── config.py                  # Configurações
│   ├── dependencies.py            # Injeção de dependências
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── weather.py         # Clima (Open-Meteo)
│   │   │   ├── locations.py       # Autocomplete (Nominatim)
│   │   │   ├── insights.py        # Comunidade (MongoDB)
│   │   │   ├── news.py            # Notícias (NewsAPI)
│   │   │   ├── quotation.py       # Cotações (Scraping)
│   │   │   └── health.py          # Health check
│   │   └── middlewares/
│   │       └── error_handler.py   # Tratamento global de erros
│   │
│   ├── core/
│   │   ├── cache.py               # Sistema de cache em memória
│   │   └── sugarcane_analyzer.py  # Análise agrícola
│   │
│   ├── models/
│   │   ├── weather.py
│   │   ├── location.py
│   │   ├── insight.py
│   │   └── ...
│   │
│   ├── services/
│   │   ├── open_meteo.py          # Integração Open-Meteo
│   │   ├── geocoding.py           # Geocoding via Nominatim
│   │   ├── insights_service.py    # Lógica de insights
│   │   ├── quotation.py           # Scraping de cotações
│   │   └── ...
│   │
│   └── database/
│       └── mongodb.py             # Conexão MongoDB
│
├── nginx/
│   └── nginx.conf                 # Rate limiting & load balancing
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

## 5. Nginx - Reverse Proxy e Rate Limiting

O Nginx atua como camada de entrada, fornecendo:

- **Reverse Proxy**: Distribui requisições entre réplicas do FastAPI
- **Load Balancing**: Algoritmo least_conn
- **Rate Limiting**: Proteção por IP (30 req/min geral, 20 weather, 15 insights)
- **Health Checks**: Remove instâncias não-responsivas
- **Compressão**: Gzip para reduzir payload

**Resposta ao exceder limite:**
```json
HTTP 429 Too Many Requests
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Muitas requisições. Tente novamente em alguns instantes.",
    "retry_after": 60
  }
}
```

---

## 6. API Endpoints

### 6.1 Autocomplete de Localização

#### `GET /api/v1/locations/search`
**Fonte:** Nominatim (OpenStreetMap)

Retorna sugestões de cidades conforme o usuário digita.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `q` | string | Sim | Termo de busca (mínimo 3 caracteres) |
| `limit` | int | Não | Número de sugestões (default: 5, máx: 10) |

**Response (200):**
```json
{
  "suggestions": [
    {
      "name": "São Paulo",
      "state": "São Paulo",
      "country": "Brazil",
      "lat": -23.5505,
      "lon": -46.6333,
      "display_name": "São Paulo, São Paulo, Brasil"
    }
  ]
}
```

---

#### `GET /api/v1/locations/reverse`
**Fonte:** Nominatim (OpenStreetMap)

Geocoding reverso: converte coordenadas em localização (geolocalização do navegador).

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório |
|-----------|------|-------------|
| `lat` | float | Sim |
| `lon` | float | Sim |

---

### 6.2 Dados Climáticos Enriquecidos

#### `GET /api/v1/weather`
**Fonte:** Open-Meteo API (gratuita, sem key necessária)

Retorna dados climáticos atuais com análise contextualizada para cana-de-açúcar.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório |
|-----------|------|-------------|
| `lat` | float | Sim |
| `lon` | float | Sim |
| `location_name` | string | Sim |

**Response (200):**
```json
{
  "location": {
    "name": "Ribeirão Preto",
    "lat": -21.1704,
    "lon": -47.8103,
    "timezone": "America/Sao_Paulo"
  },
  "current": {
    "temperature": 28.5,
    "humidity": 65,
    "wind_speed": 12.5,
    "condition": "Parcialmente nublado",
    "timestamp": "2025-11-30T14:30:00"
  },
  "sugarcane_analysis": {
    "overall_status": "favorable",
    "growth_stage_recommendation": "Fase vegetativa favorável",
    "factors": [
      {
        "parameter": "temperature",
        "status": "ideal",
        "message": "Temperatura ideal para crescimento (21-34°C)",
        "recommendation": "Condições ótimas para fotossíntese"
      }
    ],
    "alerts": []
  },
  "forecast": {...},
  "cached": false
}
```

**Cache:** 30 minutos (coordenadas arredondadas para 2 decimais ≈ 1km)

---

### 6.3 Compartilhamento de Insights

#### `POST /api/v1/insights`
**Persistência:** MongoDB

Produtores compartilham observações sobre suas plantações.

**Request Body:**
```json
{
  "author": {
    "name": "João Silva",
    "role": "Produtor"
  },
  "location": {
    "name": "Ribeirão Preto",
    "lat": -21.1704,
    "lon": -47.8103
  },
  "weather_snapshot": {
    "temperature": 29.5,
    "humidity": 60,
    "precipitation": 0,
    "condition": "Ensolarado"
  },
  "content": "Aplicamos cobertura morta hoje. Com essa temperatura e baixa umidade, observamos redução significativa na perda de água.",
  "tags": ["manejo", "irrigação"]
}
```

---

#### `GET /api/v1/insights`
**Persistência:** MongoDB

Lista insights recentes com paginação.

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `location` | string | Filtrar por nome da localização |
| `limit` | int | Resultados por página (default: 20, máx: 50) |
| `offset` | int | Paginação (default: 0) |

---

#### `GET /api/v1/insights/nearby`
**Persistência:** MongoDB (geoespacial)

Retorna insights de localizações próximas.

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `lat` | float | Latitude de referência |
| `lon` | float | Longitude de referência |
| `radius_km` | int | Raio de busca (default: 100, máx: 500) |
| `limit` | int | Máximo de resultados (default: 20) |

---

### 6.4 Notícias do Setor

#### `GET /api/v1/news`
**Fonte:** NewsAPI

Proxy para notícias agrícolas em português. Evita bloqueio CORS em produção.

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `category` | string | AGRIBUSINESS, SUGARCANE ou WEATHER (default: AGRIBUSINESS) |
| `page_size` | int | Quantidade de artigos (default: 10, máx: 100) |
| `sort_by` | string | relevancy, popularity ou publishedAt (default: publishedAt) |

**Response:**
```json
{
  "articles": [
    {
      "title": "Preços do açúcar sobem no mercado internacional",
      "description": "...",
      "url": "...",
      "publishedAt": "2025-11-30T12:00:00Z",
      "source": {"name": "Portal Agrícola"}
    }
  ],
  "total_results": 42,
  "cached": false,
  "category": "AGRIBUSINESS"
}
```

**Cache:** 1 hora (economiza quota de 100 req/dia da NewsAPI)

---

#### `GET /api/v1/news/top-headlines`
**Fonte:** NewsAPI

Top headlines do Brasil por categoria.

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `country` | string | Código do país (default: br) |
| `category` | string | business, technology ou science |

---

### 6.5 Cotação de Cana-de-Açúcar

#### `GET /api/v1/quotation` ou `GET /quotation`
**Fonte:** NoticiasAgrícolas (scraping)

Cotação da cana-de-açúcar (Campo vs Esteira) - últimas 10 cotações.

**Response:**
```json
[
  {
    "data": "2025-11-28T00:00:00",
    "data_formatada": "28/11/2025",
    "valor_campo": 129.5,
    "valor_esteira": 144.64
  },
  ...
]
```

**Cache:** 1 hora em memória

**Observação:** Scraping robusto com retry automático e tratamento de erros de parsing.

---

### 6.6 Health Check

#### `GET /health`
**Rate Limit:** Não aplicado (monitoramento)

Verifica status da aplicação e dependências.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-28T14:30:00Z",
  "services": {
    "database": "connected",
    "cache": "operational"
  },
  "version": "1.0.0"
}
```

---

## 7. Lógica de Negócio - Análise para Cana-de-Açúcar

### 7.1 Parâmetros Críticos

**Temperatura:**
- Ideal: 21-34°C
- Crítico: < 15°C ou > 38°C

**Umidade Relativa:**
- Ideal: 60-85%
- Crítico: < 50% (estresse) ou > 90% (doenças fúngicas)

**Vento:**
- Normal: < 40 km/h
- Crítico: > 60 km/h (risco de acamamento)

**UV Index:**
- Favorável: > 6 (fotossíntese intensa)

### 7.2 Recomendações Automáticas

A API gera recomendações contextualizadas baseadas em múltiplos fatores:

- Alertas críticos (acamamento, estresse térmico)
- Avisos (doenças, irrigação)
- Recomendações operacionais

---

## 8. Sistema de Cache

### 8.1 Estratégia

| Recurso | TTL | Granularidade |
|---------|-----|---------------|
| Weather | 30 min | ~1km (2 decimais) |
| News | 1 hora | Por categoria |
| Quotation | 1 hora | Global |

**Limpeza:** Job periódico a cada 5 minutos remove entradas expiradas.

**Indicador:** Campo `"cached": true/false` em cada resposta.

---

## 9. Banco de Dados - MongoDB

### 9.1 Schema da Collection `insights`

```javascript
{
  "_id": ObjectId("..."),
  "author": {
    "name": "João Silva",
    "role": "Produtor"
  },
  "location": {
    "name": "Ribeirão Preto",
    "state": "São Paulo",
    "coordinates": {
      "type": "Point",
      "coordinates": [-47.8103, -21.1704]  // GeoJSON
    }
  },
  "weather_snapshot": {...},
  "content": "...",
  "tags": ["manejo", "irrigação"],
  "reactions": {"helpful": 12, "tried": 5},
  "created_at": ISODate("..."),
  "updated_at": ISODate("...")
}
```

### 9.2 Índices

```javascript
db.insights.createIndex({ "location.coordinates": "2dsphere" })
db.insights.createIndex({ "created_at": -1 })
db.insights.createIndex({ "tags": 1 })
db.insights.createIndex({ "location.name": 1, "created_at": -1 })
```

---

## 10. Tratamento de Erros

Todos os erros seguem o mesmo formato:

```json
{
  "error": {
    "code": "WEATHER_API_ERROR",
    "message": "Descrição do erro",
    "details": "Detalhes técnicos",
    "timestamp": "2025-11-30T14:30:00Z"
  }
}
```

| Código | HTTP Status | Descrição |
|--------|-------------|-----------|
| `LOCATION_NOT_FOUND` | 404 | Localização não encontrada |
| `WEATHER_API_ERROR` | 500 | Erro ao buscar dados climáticos |
| `INVALID_COORDINATES` | 400 | Coordenadas inválidas |
| `DATABASE_ERROR` | 500 | Erro MongoDB |
| `VALIDATION_ERROR` | 400 | Dados inválidos |
| `RATE_LIMIT_EXCEEDED` | 429 | Limite de requisições excedido |
| `NEWS_API_QUOTA_EXCEEDED` | 429 | Quota da NewsAPI atingida |

---

## 11. Variáveis de Ambiente

```bash
# Application
ENV=development
DEBUG=True
API_VERSION=v1

# Server
HOST=0.0.0.0
PORT=8000

# MongoDB
MONGODB_URL=mongodb://mongodb:27017/sugarcane
MONGODB_DB_NAME=sugarcane

# Cache
CACHE_TTL_MINUTES=30

# External APIs
NEWSAPI_KEY=your_key_here

# CORS
CORS_ORIGINS=http://localhost:3000,https://your-domain.com

# Rate Limiting (configurado em nginx.conf)
RATE_LIMIT_PER_MINUTE=60
```

---

## 12. Arquitetura de Deploy

```
┌────────────────────────────────────┐
│  EC2 t2.micro (Free Tier)          │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Nginx (Port 80/443)         │  │
│  │  - Reverse Proxy             │  │
│  │  - Load Balancer (least_conn)│  │
│  │  - Rate Limiting             │  │
│  └──────────────────────────────┘  │
│       ▼              ▼              │
│  ┌─────────────┐ ┌──────────────┐  │
│  │ FastAPI #1  │ │ FastAPI #2   │  │
│  └─────────────┘ └──────────────┘  │
│       ▼              ▼              │
│  ┌──────────────────────────────┐  │
│  │  MongoDB (Port 27017)        │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

**Fluxo de requisição:**
Cliente → Nginx (rate limit) → Load balancing (least_conn) → FastAPI (cache check) → MongoDB/Open-Meteo/NewsAPI → Response

---

## 13. Documentação Automática da API

FastAPI gera documentação interativa:

- **Swagger UI**: `/docs`
- **ReDoc**: `/redoc`
- **OpenAPI JSON**: `/openapi.json`

---

## 14. Melhorias Futuras

- Migrar cache para Redis distribuído
- Autoscaling real (ECS Fargate)
- Autenticação JWT para insights
- Notificações push para alertas
- Machine Learning para previsões personalizadas
- Integração com imagens de satélite (NDVI)
- CI/CD com GitHub Actions
- Monitoramento com Prometheus/Grafana

---

**Versão:** 1.0.1  
**Última atualização:** Dezembro 2025  
**Produção:** http://98.94.92.42:8000/docs