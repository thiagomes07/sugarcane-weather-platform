# Documentação do Backend - Sistema de Clima para Produtores de Cana-de-Açúcar

## Setup Local

### 1. Clonar repositório
```bash
git clone <repo-url>
cd cana-data/backend
```

### 2. Criar ambiente virtual
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

### 3. Instalar dependências
```bash
pip install -r requirements.txt
```

### 4. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Editar .env conforme necessário
```

### 5. Executar aplicação
```bash
uvicorn app.main:app --reload
```

Acesse: http://localhost:8000/docs

## Docker

### Desenvolvimento
```bash
docker build -t cana-data-backend .
docker run -p 8000:8000 cana-data-backend
```

### Com Docker Compose (requer MongoDB)
```bash
docker compose up
```

## Documentação da API

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 1. Visão Geral

O backend é uma API RESTful desenvolvida em **Python com FastAPI** que atua como camada de inteligência entre o frontend e APIs externas, fornecendo:

- **Normalização e enriquecimento de dados climáticos** contextualizados para cultivo de cana-de-açúcar
- **Cache inteligente** para otimizar requisições e reduzir latência
- **Sistema de compartilhamento de insights** entre produtores rurais
- **Autocomplete de cidades** para melhor experiência do usuário

---

## 2. Justificativa Técnica

### 2.1 Por que Backend?

Embora seja tecnicamente viável consumir APIs diretamente no frontend, o backend agrega valor através de:

**Inteligência de Negócio**
- Interpretação dos dados climáticos no contexto agrícola específico
- Geração automática de recomendações baseadas em limiares científicos
- Análise de múltiplos fatores simultaneamente

**Agregação de Dados**
- Combinação de múltiplas fontes (Open-Meteo, geolocalização, insights comunitários)
- Transformação de dados brutos em informações acionáveis
- Normalização de formatos diversos

**Cache Compartilhado**
- Memória de curta duração beneficia todos os usuários simultaneamente
- Redução de chamadas redundantes às APIs externas
- Melhor performance percebida pelo usuário

**Segurança e Controle de Tráfego**
- Proteção de chaves de API (NewsAPI)
- Validação e sanitização de dados antes de persistir
- **Rate limiting centralizado via Nginx** para proteger APIs externas e recursos do servidor

**Evolução da Plataforma**
- Sistema evolui de consulta climática para **fórum de conhecimento** entre produtores
- Base sólida para features futuras (alertas, ML, integrações)

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
- Geopy/Nominatim (geocoding)
```

---

## 4. Arquitetura de Diretórios

```
backend/
├── app/
│   ├── main.py                    # Entry point da aplicação
│   ├── config.py                  # Configurações e variáveis de ambiente
│   ├── dependencies.py            # Injeção de dependências
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── weather.py         # Rotas de clima
│   │   │   ├── locations.py       # Rotas de autocomplete
│   │   │   ├── insights.py        # Rotas de insights compartilhados
│   │   │   └── health.py          # Health check
│   │   └── middlewares/
│   │       └── error_handler.py   # Tratamento global de erros
│   │
│   ├── core/
│   │   ├── cache.py               # Sistema de cache em memória
│   │   └── sugarcane_analyzer.py  # Lógica de análise para cana
│   │
│   ├── models/
│   │   ├── weather.py             # Modelos de dados climáticos
│   │   ├── location.py            # Modelos de localização
│   │   └── insight.py             # Modelos de insights
│   │
│   ├── services/
│   │   ├── open_meteo.py          # Integração com Open-Meteo
│   │   ├── geocoding.py           # Serviço de geocoding
│   │   └── insights_service.py    # Lógica de insights
│   │
│   └── database/
│       └── mongodb.py             # Conexão e operações MongoDB
│
├── nginx/
│   └── nginx.conf                 # Configuração Nginx
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── README.md
```

---

## 5. Nginx - Reverse Proxy e Rate Limiting

### 5.1 Papel do Nginx

O Nginx atua como camada de entrada para todo tráfego, fornecendo:

- **Reverse Proxy**: Distribui requisições entre réplicas do FastAPI
- **Load Balancing**: Algoritmo least_conn para distribuição eficiente
- **Rate Limiting**: Controla taxa de requisições por IP para proteger recursos
- **SSL/TLS Termination**: Gerencia certificados HTTPS (produção)
- **Compressão**: Gzip para reduzir payload de resposta
- **Health Checks**: Remove automaticamente instâncias não-responsivas

### 5.2 Configuração de Rate Limiting

**Zonas de limite definidas:**

```nginx
# 10MB de memória = ~160k IPs rastreados
limit_req_zone $binary_remote_addr zone=general:10m rate=30r/m;
limit_req_zone $binary_remote_addr zone=weather:10m rate=20r/m;
limit_req_zone $binary_remote_addr zone=insights:10m rate=15r/m;
```

**Aplicação por endpoint:**

- **Geral** (`/api/v1/*`): 30 requisições/minuto por IP
- **Weather** (`/api/v1/weather`): 20 req/min (protege Open-Meteo)
- **Insights** (`/api/v1/insights`): 15 req/min (protege MongoDB)
- **Burst**: Permite até 5 requisições além do limite com delay

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

### 5.3 Upstream e Balanceamento

```nginx
upstream fastapi_backend {
    least_conn;  # Distribui para servidor com menos conexões ativas
    server fastapi_1:8000 max_fails=3 fail_timeout=30s;
    server fastapi_2:8000 max_fails=3 fail_timeout=30s;
}
```

- **Health Check**: A cada 30s via `/health`
- **Failover**: Após 3 falhas consecutivas, instância fica inativa por 30s
- **Retry**: Requisições falhas são automaticamente redirecionadas para instância saudável

---

## 6. API Endpoints

### 6.1 Autocomplete de Localização

#### `GET /api/v1/locations/search`

**Rate Limit:** 30 requisições/minuto por IP

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

**Erros:**
- `400`: Query string muito curta (< 3 caracteres)
- `429`: Rate limit excedido
- `500`: Erro no serviço de geocoding

---

### 6.2 Dados Climáticos Enriquecidos

#### `GET /api/v1/weather`

**Rate Limit:** 20 requisições/minuto por IP

Retorna dados climáticos atuais com análise contextualizada para cultivo de cana-de-açúcar.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `lat` | float | Sim | Latitude (-90 a 90) |
| `lon` | float | Sim | Longitude (-180 a 180) |
| `location_name` | string | Sim | Nome da localização |

**Response (200):**
```json
{
  "location": {
    "name": "Ribeirão Preto",
    "lat": -21.1704,
    "lon": -47.8103,
    "timezone": "America/Sao_Paulo"
  },
  "current_weather": {
    "temperature": 28.5,
    "humidity": 65,
    "precipitation": 0,
    "wind_speed": 12.5,
    "wind_direction": 180,
    "cloud_cover": 40,
    "pressure": 1013,
    "uv_index": 7,
    "condition": "Parcialmente nublado",
    "timestamp": "2025-11-28T14:30:00"
  },
  "sugarcane_analysis": {
    "overall_status": "favorable",
    "growth_stage_recommendation": "Fase vegetativa favorável",
    "factors": [
      {
        "parameter": "temperature",
        "status": "ideal",
        "message": "Temperatura ideal para crescimento vegetativo (21-34°C)",
        "recommendation": "Condições ótimas para fotossíntese e desenvolvimento"
      }
    ],
    "alerts": []
  },
  "forecast_summary": {
    "next_7_days": {
      "avg_temperature": 27.3,
      "total_precipitation": 15.5,
      "rainy_days": 2
    }
  },
  "cached": false
}
```

**Erros:**
- `400`: Coordenadas inválidas
- `404`: Localização não encontrada
- `429`: Rate limit excedido
- `500`: Erro ao buscar dados climáticos
- `503`: API Open-Meteo indisponível

---

### 6.3 Compartilhamento de Insights

#### `POST /api/v1/insights`

**Rate Limit:** 15 requisições/minuto por IP

Permite que produtores compartilhem observações e práticas sobre suas plantações.

**Request Body:**
```json
{
  "author_name": "João Silva",
  "location": {
    "name": "Ribeirão Preto",
    "lat": -21.1704,
    "lon": -47.8103
  },
  "weather_snapshot": {
    "temperature": 29.5,
    "humidity": 60,
    "condition": "Ensolarado"
  },
  "content": "Aplicamos cobertura morta hoje. Com essa temperatura e baixa umidade, observamos redução significativa na perda de água do solo.",
  "tags": ["manejo", "irrigação", "cobertura"]
}
```

**Response (201):**
```json
{
  "id": "674832abc1234567890def12",
  "created_at": "2025-11-28T14:30:00Z",
  "message": "Insight compartilhado com sucesso!"
}
```

**Erros:**
- `400`: Dados inválidos ou incompletos
- `403`: Usuário não consultou clima desta localização
- `429`: Rate limit excedido
- `500`: Erro ao salvar no banco de dados

---

#### `GET /api/v1/insights`

**Rate Limit:** 15 requisições/minuto por IP

Lista insights recentes compartilhados pela comunidade.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `location` | string | Não | Filtrar por nome da localização |
| `limit` | int | Não | Resultados por página (default: 20, máx: 50) |
| `offset` | int | Não | Paginação (default: 0) |

**Response (200):**
```json
{
  "insights": [
    {
      "id": "674832abc...",
      "author_name": "João Silva",
      "location": {
        "name": "Ribeirão Preto",
        "state": "São Paulo"
      },
      "content": "Aplicamos cobertura morta hoje...",
      "tags": ["manejo", "irrigação"],
      "created_at": "2025-11-28T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 0,
    "pages": 8
  }
}
```

---

#### `GET /api/v1/insights/nearby`

**Rate Limit:** 15 requisições/minuto por IP

Retorna insights de localizações próximas (consulta geoespacial).

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `lat` | float | Sim | Latitude de referência |
| `lon` | float | Sim | Longitude de referência |
| `radius_km` | int | Não | Raio de busca em km (default: 100, máx: 500) |
| `limit` | int | Não | Máximo de resultados (default: 20) |

**Response (200):**
```json
{
  "insights": [
    {
      "id": "674832abc...",
      "author_name": "Maria Santos",
      "location": {
        "name": "Sertãozinho",
        "state": "São Paulo"
      },
      "distance_km": 15.3,
      "content": "Chuva de 40mm ontem...",
      "created_at": "2025-11-27T10:15:00Z"
    }
  ],
  "search_center": {
    "lat": -21.1704,
    "lon": -47.8103,
    "radius_km": 100
  }
}
```

---

### 6.4 Health Check

#### `GET /health`

**Rate Limit:** Não aplicado (necessário para monitoramento)

Verifica o status da aplicação e dependências.

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

### 7.1 Parâmetros Críticos e Limiares

A análise climática considera os seguintes fatores críticos para o cultivo:

**Temperatura:**
- **Ideal**: 21-34°C (crescimento vegetativo ótimo)
- **Atenção**: 15-21°C ou 34-38°C (crescimento reduzido)
- **Crítico**: < 15°C (paralisação) ou > 38°C (estresse térmico)

**Umidade Relativa:**
- **Ideal**: 60-85%
- **Atenção**: 50-60% ou 85-90%
- **Crítico**: < 50% (estresse hídrico) ou > 90% (risco de doenças fúngicas)

**Precipitação:**
- **Ideal**: 100-150mm/mês
- **Atenção**: Sem chuva por 7+ dias com temp > 30°C
- **Crítico**: > 100mm em 24h (encharcamento)

**Vento:**
- **Normal**: < 40 km/h
- **Atenção**: 40-60 km/h
- **Crítico**: > 60 km/h (risco de acamamento)

**Índice UV:**
- **Favorável**: > 6 (fotossíntese intensa)

### 7.2 Exemplos de Recomendações Geradas

**Cenário 1: Temperatura 32°C + Umidade 55% + 10 dias sem chuva**
```
Status: warning
Recomendação: "Considerar irrigação imediata. Temperatura elevada + 
baixa umidade + período prolongado sem chuva aumenta evapotranspiração."
```

**Cenário 2: Umidade 92% + Temperatura 25°C**
```
Status: attention
Recomendação: "Risco elevado de ferrugem e outras doenças fúngicas. 
Monitorar folhas e considerar aplicação preventiva de fungicidas."
```

**Cenário 3: Vento 65 km/h**
```
Status: critical
Recomendação: "Alerta: Risco iminente de acamamento. 
Vistoriar áreas expostas e considerar tutoramentos emergenciais."
```

---

## 8. Sistema de Cache

### 8.1 Estratégia

O cache em memória reduz chamadas às APIs externas quando múltiplos usuários consultam a mesma região:

- **Chave**: Coordenadas arredondadas para 2 decimais (~1km de granularidade)
- **TTL**: 30 minutos para dados climáticos
- **Formato**: `weather:{lat}:{lon}` → Ex: `weather:-21.17:-47.81`
- **Limpeza**: Job periódico a cada 5 minutos remove entradas expiradas

### 8.2 Benefícios

- **Performance**: Resposta instantânea para localizações populares
- **Economia**: Redução de ~70% nas chamadas à Open-Meteo em horários de pico
- **Proteção**: Combinado com rate limiting do Nginx, previne sobrecarga das APIs externas
- **Resiliência**: Tolerância a falhas temporárias da API externa

### 8.3 Indicador de Cache

Cada resposta inclui o campo `"cached": true/false` para transparência.

---

## 9. Banco de Dados - MongoDB

### 9.1 Schema da Collection `insights`

```javascript
{
  "_id": ObjectId("674832abc1234567890def12"),
  "author_name": "João Silva",
  "location": {
    "name": "Ribeirão Preto",
    "state": "São Paulo",
    "coordinates": {
      "type": "Point",
      "coordinates": [-47.8103, -21.1704]  // [longitude, latitude] - GeoJSON
    }
  },
  "weather_snapshot": {
    "temperature": 29.5,
    "humidity": 60,
    "precipitation": 0,
    "condition": "Ensolarado",
    "timestamp": ISODate("2025-11-28T14:30:00Z")
  },
  "content": "Aplicamos cobertura morta hoje...",
  "tags": ["manejo", "irrigação", "cobertura"],
  "reactions": {
    "helpful": 12,
    "tried": 5
  },
  "created_at": ISODate("2025-11-28T14:30:00Z"),
  "updated_at": ISODate("2025-11-28T14:30:00Z")
}
```

### 9.2 Índices

```javascript
// Consultas geoespaciais (insights nearby)
db.insights.createIndex({ "location.coordinates": "2dsphere" })

// Ordenação cronológica (listagem)
db.insights.createIndex({ "created_at": -1 })

// Busca por tags
db.insights.createIndex({ "tags": 1 })

// Filtro por localização + ordenação
db.insights.createIndex({ "location.name": 1, "created_at": -1 })
```

---

## 10. Tratamento de Erros

### 10.1 Estrutura Padrão de Erro

Todos os erros seguem o mesmo formato:

```json
{
  "error": {
    "code": "WEATHER_API_ERROR",
    "message": "Não foi possível obter dados climáticos no momento",
    "details": "Timeout ao conectar com api.open-meteo.com",
    "timestamp": "2025-11-28T14:30:00Z"
  }
}
```

### 10.2 Códigos de Erro

| Código | HTTP Status | Descrição |
|--------|-------------|-----------|
| `LOCATION_NOT_FOUND` | 404 | Localização não encontrada no geocoding |
| `WEATHER_API_ERROR` | 500 | Erro ao buscar dados climáticos |
| `WEATHER_API_TIMEOUT` | 504 | Timeout na API Open-Meteo |
| `INVALID_COORDINATES` | 400 | Coordenadas fora do intervalo válido |
| `DATABASE_ERROR` | 500 | Erro ao acessar MongoDB |
| `VALIDATION_ERROR` | 400 | Dados de entrada inválidos |
| `RATE_LIMIT_EXCEEDED` | 429 | Limite de requisições excedido (Nginx) |
| `INSIGHT_FORBIDDEN` | 403 | Usuário não consultou clima desta localização |

---

## 11. Integração com Open-Meteo

### 11.1 Dados Solicitados

A API consome os seguintes parâmetros da Open-Meteo:

**Current Weather:**
- `temperature_2m`, `relative_humidity_2m`, `precipitation`
- `weather_code`, `cloud_cover`, `pressure_msl`
- `wind_speed_10m`, `wind_direction_10m`

**Hourly (últimas 24h):**
- `temperature_2m`, `precipitation`, `uv_index`

**Daily (próximos 7 dias):**
- `temperature_2m_max`, `temperature_2m_min`
- `precipitation_sum`, `precipitation_hours`

### 11.2 Timeout e Retry

- **Timeout**: 10 segundos
- **Retry**: Não há retry automático (cache mitiga falhas temporárias)
- **Fallback**: Em caso de erro, retorna último valor em cache se disponível
- **Proteção**: Rate limiting do Nginx previne burst de requisições à API externa

---

## 12. Variáveis de Ambiente

```bash
# Application
ENV=development
DEBUG=True
API_VERSION=v1

# Server
HOST=0.0.0.0
PORT=8000

# MongoDB
MONGODB_URL=mongodb://localhost:27017/sugarcane
MONGODB_DB_NAME=sugarcane

# Cache
CACHE_TTL_MINUTES=30

# External APIs
NEWSAPI_KEY=your_newsapi_key_here

# CORS (Frontend URLs permitidas)
CORS_ORIGINS=http://localhost:3000,https://your-s3-bucket.s3.amazonaws.com

# Nginx (gerenciado via nginx.conf)
# Rate limits definidos em: nginx/nginx.conf
```

---

## 13. Arquitetura de Deploy

### 13.1 Estrutura na EC2 Free Tier

```
┌────────────────────────────────────────────────┐
│          EC2 t2.micro Instance                 │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │      Docker Compose Stack                │  │
│  │                                           │  │
│  │  ┌─────────────────────────────────────┐ │  │
│  │  │  Nginx (Port 80/443)                │ │  │
│  │  │  - Reverse Proxy                    │ │  │
│  │  │  - Load Balancer (least_conn)       │ │  │
│  │  │  - Rate Limiting (por IP)           │ │  │
│  │  │  - Health Checks (/health)          │ │  │
│  │  └─────────────────────────────────────┘ │  │
│  │              ▼          ▼                 │  │
│  │  ┌───────────────┐  ┌───────────────┐   │  │
│  │  │  FastAPI #1   │  │  FastAPI #2   │   │  │
│  │  │  (Port 8001)  │  │  (Port 8002)  │   │  │
│  │  └───────────────┘  └───────────────┘   │  │
│  │              ▼          ▼                 │  │
│  │  ┌─────────────────────────────────────┐ │  │
│  │  │  MongoDB (Port 27017)               │ │  │
│  │  │  - Persistência de insights         │ │  │
│  │  └─────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

### 13.2 Fluxo de Requisição

```
Cliente → Nginx (rate limit check) → Upstream selection (least_conn) 
→ FastAPI instance (cache check) → MongoDB/Open-Meteo → Response
```

### 13.3 Balanceamento e Alta Disponibilidade

- **Estratégia**: Least connections (Nginx)
- **Réplicas**: 2 instâncias do FastAPI (portas 8001 e 8002)
- **Health Check**: Endpoint `/health` verificado a cada 30s
- **Failover**: Instância não-responsiva removida automaticamente do pool
- **Rate Limiting**: Aplicado antes do balanceamento para proteger todos os recursos

**Justificativa**: Simula autoscaling dentro das limitações da Free Tier, garantindo disponibilidade sem custos adicionais. O Nginx gerencia tanto o tráfego quanto a proteção contra abuso, atuando como gateway único para toda a infraestrutura.

---

## 14. Documentação Automática da API

FastAPI gera documentação interativa automaticamente:

- **Swagger UI**: `http://seu-backend:8000/docs`
- **ReDoc**: `http://seu-backend:8000/redoc`
- **OpenAPI JSON**: `http://seu-backend:8000/openapi.json`

Permite testar todos os endpoints diretamente no navegador.

---

## 15. Melhorias Futuras

### 15.1 Escalabilidade e Performance
- Migrar cache para Redis distribuído
- Implementar autoscaling real (ECS Fargate)
- CDN para assets estáticos
- Compressão de respostas (gzip/brotli)
- Rate limiting adaptativo baseado em comportamento

### 15.2 Funcionalidades
- Autenticação JWT para insights (perfis de usuário)
- Sistema de reações (👍 útil, ✅ testei)
- Notificações push para alertas críticos
- API de histórico climático (séries temporais)

### 15.3 Inteligência e Dados
- Machine Learning para previsões personalizadas
- Integração com imagens de satélite (NDVI)
- Dashboard analítico com métricas agregadas
- Marketplace de insumos agrícolas

### 15.4 Qualidade
- Testes automatizados (80%+ cobertura)
- CI/CD com GitHub Actions
- Monitoramento com Prometheus/Grafana
- Logs estruturados (ELK Stack)

---

**Versão:** 1.0.0  
**Última atualização:** Novembro 2025