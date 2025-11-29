# 🌾 CanaData - Sistema de Monitoramento Climático para Cana-de-Açúcar

<div align="center">

![CanaData Banner](https://img.shields.io/badge/CanaData-Sistema%20Clim%C3%A1tico-2D5F2E?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTcgMjBoMTAiLz48cGF0aCBkPSJNMTAgMjBjNS41LTIuNS43LTE1IDctMTV6Ii8+PHBhdGggZD0iTTE3LjUgNUMxNiAxMiAxMiAxNyA3IDIwYy0xLjUtMS41LTQtNC00LTQiLz48L3N2Zz4=)

**Plataforma web que democratiza o acesso a informações climáticas para produtores rurais de cana-de-açúcar**

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)

[🌐 Demo Frontend](http://seu-deploy-frontend.com) • [🔧 API Docs](http://seu-backend.com/docs)

</div>

---

## 📋 Sobre o Projeto

O **CanaData** é uma solução moderna que conecta **produtores de cana-de-açúcar** a dados climáticos inteligentes, resolvendo a carência de **digitalização e informação rápida** no setor agrícola brasileiro. 

### 🎯 Problema
Produtores rurais enfrentam dificuldades para acessar informações climáticas **contextualizadas** para suas culturas, impactando decisões críticas sobre irrigação, colheita e manejo.

### ✨ Solução
Plataforma web com:
- 🌦️ **Dados climáticos em tempo real** via Open-Meteo API
- 🎯 **Análise contextualizada** para cultivo de cana-de-açúcar (temperatura, umidade, precipitação, vento)
- 🤝 **Fórum colaborativo** onde produtores compartilham insights e práticas
- 📰 **Feed de notícias** do agronegócio brasileiro
- ⚡ **Sistema de resiliência** com rate limiting e retry inteligente

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────┐
│  Frontend (Next.js 14 - SSG)                │
│  • TypeScript + Tailwind CSS               │
│  • TanStack Query (cache inteligente)      │
│  • Resiliência a rate limiting             │
│  └─ http://localhost:3000                  │
│                                             │
├─────────────────────────────────────────────┤
│  Nginx (Reverse Proxy)                     │
│  • Load Balancer (2 réplicas FastAPI)      │
│  • Rate Limiting por IP/endpoint           │
│  └─ http://localhost:8000                  │
│       ▼                    ▼                │
│  FastAPI #1            FastAPI #2           │
│  (Port 8001)          (Port 8002)           │
│       ▼                    ▼                │
│  MongoDB (Port 27017)                       │
│  • Persistência de insights comunitários   │
└─────────────────────────────────────────────┘
```

### 🔑 Decisões Técnicas

**Frontend - Next.js 14 (SSG)**
- ✅ Performance: Páginas pré-renderizadas = carregamento instantâneo (~500ms)
- ✅ SEO nativo: Indexação completa sem SSR
- ✅ Custo: Deploy estático em S3 (~$0.50/mês)
- ✅ Experiência: Cache inteligente com TanStack Query (30min alinhado com backend)

**Backend - FastAPI + Python**
- ✅ Inteligência de negócio: Análise climática contextualizada para cana
- ✅ Agregação de dados: Open-Meteo + Geocoding + Insights comunitários
- ✅ Cache compartilhado: Reduz 70% de chamadas à API externa
- ✅ Rate Limiting (Nginx): Proteção contra abuso (20 req/min clima, 15 req/min insights)

**Infraestrutura - Docker Compose**
- ✅ Reprodutibilidade: Ambiente idêntico entre dev/staging
- ✅ Alta disponibilidade: Load balancer + 2 réplicas FastAPI + health checks
- ✅ Escalabilidade simulada: Pronto para autoscaling real (ECS/K8s)

---

## 🚀 Quick Start

### 📦 Pré-requisitos

- **Docker Engine** 20.10+ e **Docker Compose** V2+
- **4GB RAM** disponível
- **Portas livres:** 3000, 8000, 8001, 8002, 27017

### ⚙️ 1. Configuração

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/sugarcane-weather-platform.git
cd sugarcane-weather-platform

# Configure variáveis de ambiente
cp .env.example .env

# Edite o arquivo (OPCIONAL: adicione NewsAPI key para feed de notícias)
nano .env
```

**Variáveis importantes:**
```bash
NEWSAPI_KEY=your_key_here  # Opcional: obter em https://newsapi.org/
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 🐳 2. Execute com Docker Compose

```bash
# Build e start (primeira vez)
docker compose up --build

# Ou em background
docker compose up -d --build
```

**Aguarde ~30 segundos** para inicialização completa (MongoDB + health checks).

### 🌐 3. Acesse a Aplicação

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Interface web principal |
| **Backend API** | http://localhost:8000 | Gateway Nginx (load balanced) |
| **API Docs** | http://localhost:8000/docs | Swagger UI interativa |

### 🛑 Parar o Projeto

```bash
docker compose stop              # Pausa (mantém dados)
docker compose down              # Remove containers
docker compose down -v           # Remove containers + volumes (⚠️ apaga banco!)
```

---

## 📊 Funcionalidades

### 🌦️ Consulta Climática Inteligente
- **Autocomplete** de cidades com debounce (300ms) para evitar rate limiting
- **Dados em tempo real** da Open-Meteo API (temperatura, umidade, vento, precipitação)
- **Análise contextualizada** para cana-de-açúcar:
  - ✅ Temperatura ideal: 25-33°C
  - ✅ Umidade ideal: 60-80%
  - ⚠️ Alertas críticos: geada, estresse térmico, doenças fúngicas
- **Previsão 5 dias** com gráficos interativos (Recharts)
- **Cache de 30 minutos** (frontend + backend)

### 🤝 Fórum Colaborativo
- **Compartilhamento de insights** entre produtores
- **Snapshot climático** no momento da publicação
- **Busca geoespacial** (insights próximos até 500km)
- **Sistema de tags** para organização
- **Scroll infinito** com throttling (2s entre requests)

### 📰 Feed de Notícias
- Integração com **NewsAPI**
- Filtro: agronegócio + cana-de-açúcar
- Cache de **1 hora** (economiza quota API)
- Fallback silencioso (não bloqueia experiência principal)

### 🛡️ Resiliência e Performance
- **Rate Limiting** inteligente:
  - Weather: 20 req/min
  - Insights: 15 req/min
  - Locations: 30 req/min
- **Retry automático** com exponential backoff
- **Cooldown tracking** com persistência em localStorage
- **Health checks** a cada 30s (Nginx + FastAPI)
- **Failover automático** entre réplicas

---

## 🔧 Comandos Úteis

```bash
# Ver logs em tempo real
docker compose logs -f
docker compose logs -f frontend    # Apenas frontend
docker compose logs -f nginx       # Apenas Nginx

# Rebuild de serviço específico
docker compose up -d --build frontend

# Executar shell em container
docker compose exec frontend sh
docker compose exec fastapi_1 sh
docker compose exec mongodb mongosh

# Ver status dos serviços
docker compose ps

# Monitorar recursos
docker stats
```

---

## 📂 Estrutura do Projeto

```
sugarcane-weather-platform/
├── backend/                    # FastAPI (Python 3.11+)
│   ├── app/
│   │   ├── api/routes/        # weather, locations, insights, health
│   │   ├── core/              # cache, sugarcane_analyzer
│   │   ├── services/          # open_meteo, geocoding, insights
│   │   ├── models/            # Pydantic schemas
│   │   └── database/          # MongoDB connection
│   ├── nginx/
│   │   └── nginx.conf         # Rate limiting + load balancer
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                   # Next.js 14 (TypeScript)
│   ├── src/
│   │   ├── app/               # App Router (layout, page)
│   │   ├── components/        # weather, insights, news, shared, ui
│   │   ├── hooks/             # useWeather, useInsights, useDebounce
│   │   ├── lib/api/           # Axios client + endpoints
│   │   ├── lib/utils/         # format, retry, validation
│   │   └── types/             # TypeScript definitions
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yaml         # Orquestração completa
├── .env.example
└── README.md
```

---

## 🌍 Deploy em Produção

### Frontend (AWS S3)
```bash
cd frontend
npm run build              # Gera build estático em /out
aws s3 sync out/ s3://seu-bucket --delete
```

### Backend (EC2 + Docker Compose)
```bash
# Na EC2, executar:
docker compose -f docker-compose.prod.yml up -d

# Nginx expõe porta 80/443 (com SSL via Certbot)
```

**Diferenças Dev vs Produção:**
- ✅ MongoDB com autenticação
- ✅ HTTPS via Certbot (Let's Encrypt)
- ✅ Rate limiting mais restritivo
- ✅ Logs estruturados (JSON)
- ✅ Backups automáticos

---

## 🧪 Testando a API

### Via Swagger UI (recomendado)
Acesse http://localhost:8000/docs e teste interativamente.

### Via cURL
```bash
# Health Check
curl http://localhost:8000/health

# Buscar localização
curl "http://localhost:8000/api/v1/locations/search?q=ribeirao"

# Consultar clima
curl "http://localhost:8000/api/v1/weather?lat=-21.17&lon=-47.81&location_name=Ribeirão%20Preto"

# Listar insights
curl "http://localhost:8000/api/v1/insights?location=Ribeirão%20Preto"
```

---

## 🚧 Melhorias Futuras

### Funcionalidades
- [ ] Autenticação JWT (perfis de usuário)
- [ ] PWA para instalação mobile
- [ ] Sistema de notificações push (alertas críticos)
- [ ] Histórico climático (séries temporais)
- [ ] Export de relatórios em PDF

### Performance
- [ ] Redis para cache distribuído
- [ ] CloudFront (CDN) na frente do S3
- [ ] Request batching para otimizar rate limits
- [ ] Service Worker (cache offline)

### Infraestrutura
- [ ] CI/CD com GitHub Actions
- [ ] Testes automatizados (80%+ cobertura)
- [ ] Monitoramento com Prometheus/Grafana
- [ ] Autoscaling real (ECS Fargate)

---

## 📄 Licença

Este projeto foi desenvolvido como parte de um desafio técnico para a empresa **Canac**.

---

## 👨‍💻 Desenvolvedor

<div align="center">
  <table>
    <tr>
      <td align="center" width="200">
        <img src="https://media.licdn.com/dms/image/v2/D4D03AQHh3rHCD36uKA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1711828725384?e=1766016000&v=beta&t=iLJCng1Xa-5zVB_ZWXaIQAl6Sin9XARkGziuFr-S23Y" width="120px;" alt="Foto de Thiago Volcati" style="border-radius:50%"/>
        <br />
        <b>Thiago Gomes</b>
        <br />
        <sub>Engenheiro de Software Fullstack</sub>
        <br /><br />
        <a href="https://github.com/thiagomes07">
          <img src="https://img.shields.io/badge/GitHub-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
        </a>
        <br />
        <a href="https://www.linkedin.com/in/thiagogomesalmeida/">
          <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
        </a>
      </td>
      <td align="left" valign="top" width="400">
        <br />
        <h3>🎯 Sobre</h3>
        <p>
          Desenvolvedor fullstack apaixonado por criar soluções que <strong>impactam positivamente o mundo real</strong>. 
          Este projeto demonstra expertise em:
        </p>
        <ul>
          <li>🎨 <strong>Frontend moderno:</strong> Next.js 14, TypeScript, Tailwind CSS</li>
          <li>🔧 <strong>Backend robusto:</strong> FastAPI, Python, MongoDB</li>
          <li>🐋 <strong>DevOps:</strong> Docker, Nginx, Load Balancing</li>
          <li>☁️ <strong>Cloud:</strong> AWS (EC2, S3, IAM)</li>
          <li>📊 <strong>Arquitetura:</strong> Cache, Rate Limiting</li>
          <li>♿ <strong>Boas práticas:</strong> Clean Code, Documentação, Acessibilidade</li>
        </ul>
        <br />
        <p>
          💬 <strong>Aberto a oportunidades e colaborações!</strong>
        </p>
      </td>
    </tr>
  </table>
</div>

---

<div align="center">

**🌾 CanaData** - Democratizando acesso à informação climática no agronegócio brasileiro

Feito com ❤️ usando Next.js, FastAPI e muita dedicação

</div>