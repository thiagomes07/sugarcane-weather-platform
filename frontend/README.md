# Documentação do Frontend - Sistema de Clima para Produtores de Cana-de-Açúcar

## Setup Local

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção (SSG)
npm run build

# Docker (requisito do desafio)
docker compose up --build
```

Acesse: http://localhost:3000

---

## 1. Visão Geral

Aplicação web construída com **Next.js 15+ usando Static Site Generation (SSG)** que oferece:

- **Consulta climática inteligente** com autocomplete de localização e dados contextualizados para cultivo de cana-de-açúcar
- **Fórum de conhecimento colaborativo** onde produtores compartilham insights e práticas
- **Feed de notícias** do agronegócio via backend proxy
- **Cotação da cana-de-açúcar** (Campo vs Esteira)
- **Exportação de dados** em CSV e PDF
- **Resiliência a rate limiting** com retry inteligente e feedback ao usuário

---

## 2. Decisões Arquiteturais

### 2.1 Por que SSG (Static Site Generation)?

**Performance e SEO:**
- Páginas HTML pré-renderizadas servidas diretamente = carregamento instantâneo (~500ms)
- Conteúdo indexável por motores de busca sem necessidade de SSR
- Meta tags, sitemap e robots.txt gerados no build
- Core Web Vitals otimizados (LCP < 2.5s)

**Custo e Simplicidade:**
- Site estático hospedável em S3 por ~$0.50/mês
- Sem servidor Node.js rodando 24/7
- Deploy = sync de arquivos estáticos

**Quando SSR seria necessário:**
- Rotas protegidas com verificação de tokens no servidor
- Conteúdo que muda a cada request baseado no usuário
- API routes que necessitam segredos server-side

**Nossa realidade:** Toda interação dinâmica (clima, insights, notícias, cotação) ocorre via API calls client-side após carregamento inicial.

### 2.2 Deployments

**Desenvolvimento (Docker Compose):**
- Frontend roda `npm run dev` em container para integração local
- Hot reload habilitado
- Acesso via `http://localhost:3000`

**Produção:**
- Build SSG → Upload para S3
- Sem container em produção
- Deploy atual: http://cana-data-frontend.s3-website-us-east-1.amazonaws.com/

---

## 3. Stack Tecnológica

```
- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS v4
- Shadcn/ui (componentes base)
- React Hook Form + Zod (validação)
- TanStack Query (cache e estado assíncrono)
- Axios (HTTP client)
- Lucide Icons
- Sonner (toast notifications)
- Recharts (gráficos)
- jsPDF + html2canvas (exportação PDF)
```

---

## 4. Arquitetura de Diretórios

```
frontend/
├── public/
│   ├── robots.txt              # SEO - configuração para crawlers
│   ├── sitemap.xml             # SEO - mapa do site
│   ├── manifest.json           # PWA manifest
│   └── images/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout com meta tags SEO
│   │   ├── page.tsx            # Página inicial (dashboard)
│   │   ├── not-found.tsx       # 404 customizada
│   │   ├── providers.tsx       # TanStack Query Provider
│   │   └── globals.css         # Estilos globais + Tailwind v4
│   │
│   ├── components/
│   │   ├── ui/                 # Shadcn/ui base components
│   │   ├── layout/             # Header, Footer, Container
│   │   ├── weather/            # LocationSearch, WeatherCard, SugarcaneAnalysis, 
│   │   │                       # WeatherMetrics, ForecastChart, WeatherSkeleton
│   │   ├── insights/           # InsightsList, InsightCard, InsightForm, 
│   │   │                       # InsightFilters, EmptyState
│   │   ├── news/               # NewsFeed, NewsCard, NewsSkeleton
│   │   ├── quotation/          # SugarcaneQuotation
│   │   └── shared/             # LoadingSpinner, ErrorMessage, StatusBadge, 
│   │                           # RateLimitWarning, ExportButtons
│   │
│   ├── lib/
│   │   ├── api/                # HTTP clients (client.ts, weather.ts, locations.ts, 
│   │   │                       # insights.ts, news.ts, quotation.ts)
│   │   ├── utils/              # format.ts, weather.ts, validation.ts, retry.ts, export.ts
│   │   └── constants/          # weather.ts, sugarcane.ts, errors.ts
│   │
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useWeather.ts       # Dados climáticos
│   │   ├── useLocations.ts     # Autocomplete de localização
│   │   ├── useInsights.ts      # CRUD de insights
│   │   ├── useNews.ts          # Feed de notícias
│   │   ├── useQuotation.ts     # Cotação da cana
│   │   ├── useDebounce.ts      # Debounce para inputs
│   │   ├── useExport.ts        # Exportação CSV/PDF
│   │   └── useRateLimitHandler.ts  # Controle de rate limiting
│   │
│   ├── types/                  # TypeScript interfaces
│   │   ├── weather.ts
│   │   ├── location.ts
│   │   ├── insight.ts
│   │   ├── news.ts
│   │   └── quotation.ts
│   │
│   └── config/
│       └── env.ts              # Validação de variáveis de ambiente
│
├── .env.local                  # Variáveis de ambiente (local)
├── next.config.ts              # output: 'export' para SSG
├── tailwind.config.js          # Tailwind v4 config
├── tsconfig.json
└── Dockerfile
```

---

## 5. Variáveis de Ambiente

```bash
# .env.local (desenvolvimento)
NEXT_PUBLIC_API_URL=http://localhost:8000

# .env (produção)
NEXT_PUBLIC_API_URL=http://ec2-xx-xxx-xxx-xx.compute.amazonaws.com:8000
```

**Nota:** A chave do NewsAPI não é mais necessária no frontend, pois o backend faz o proxy das requisições.

---

## 6. Fluxos Principais

### 6.1 Consulta Climática

```
1. Usuário digita cidade → Debounce 300ms → GET /api/v1/locations/search?q=...
   - Validação mínima: 3 caracteres
   - Rate limit: 5 req/s com burst de 10
   - Se 429: Aguarda 2s → Retry automático
   
2. Exibe dropdown com sugestões (nome, estado, país)

3. Usuário seleciona → GET /api/v1/weather?lat=...&lon=...&location_name=...
   - Rate limit: 1 req/s com burst de 20
   - Se 429: Toast "Muitas consultas. Aguarde..." → Retry após 3s
   
4. Durante loading: Skeleton screens nas seções

5. Sucesso: Renderiza:
   - WeatherCard (temperatura, condição, sensação térmica)
   - WeatherMetrics (umidade, vento, pressão, visibilidade)
   - SugarcaneAnalysis (análise agronômica completa)
   - ForecastChart (gráficos de temperatura e precipitação)
   - SugarcaneQuotation (cotação Campo vs Esteira)
   - InsightsList (insights da comunidade para essa localização)
   - NewsFeed (notícias do agronegócio)
   
6. Habilita botão "Compartilhar Insight"

7. Erro: ErrorMessage com "Tentar Novamente"
```

### 6.2 Compartilhamento de Insights

```
1. Pré-requisito: Clima consultado (botão habilitado)

2. Modal abre com localização e clima pré-preenchidos (readonly)

3. Usuário preenche:
   - Nome (2-100 caracteres)
   - Função (opcional)
   - Conteúdo (10-1000 caracteres)
   - Tags (máximo 5)
   
4. Validação em tempo real (Zod)

5. Submit → POST /api/v1/insights
   - Rate limit: 10 req/min com burst de 5
   - Se 429: Toast "Limite atingido. Aguarde 1 minuto." → Desabilita botão por 60s
   
6. Sucesso: Modal fecha + Toast + Lista atualiza (cache invalidado)

7. Erro: Toast + formulário mantém dados
```

### 6.3 Visualização de Insights

```
1. Carregamento automático após consulta de clima

2. GET /api/v1/insights?location=...&limit=20
   - Rate limit: 1 req/s (compartilhado com endpoints gerais)
   
3. Cards ordenados por data (mais recentes primeiro)

4. Cada card mostra:
   - Avatar do autor (iniciais com cor)
   - Nome e função
   - Localização e data
   - Conteúdo do insight
   - Tags
   - Snapshot climático (temperatura, umidade, condição)
   
5. Scroll infinito: Carrega +20 ao chegar no final
   - Throttling: Mínimo 2s entre requests de paginação
   
6. Filtros: Por tags e ordenação (recentes/populares)

7. Estado vazio: "Seja o primeiro a compartilhar..."
```

### 6.4 Feed de Notícias

```
1. Carregamento automático no mount da página

2. Backend proxy: GET /api/v1/news?category=SUGARCANE&page_size=6
   - Cache backend: 1 hora
   
3. Grid de cards:
   - Imagem (thumbnail)
   - Fonte
   - Título
   - Descrição (opcional)
   - Data relativa ("2 horas atrás")
   - Link externo
   
4. Erro: Seção desaparece silenciosamente (não bloqueia experiência principal)
```

### 6.5 Cotação da Cana-de-Açúcar

```
1. Carregamento automático após consulta de clima

2. GET /quotation ou GET /api/v1/quotation
   - Tenta endpoint sem prefixo primeiro
   - Se 404: Tenta com /api/v1/
   - Cache backend: 1 hora
   
3. Exibe gráfico LineChart:
   - Últimos 10 fechamentos
   - Linha verde escura: Campo (R$/ton)
   - Linha verde clara: Esteira (R$/ton)
   
4. Cards de estatísticas:
   - Última cotação Campo
   - Última cotação Esteira
   - Variação percentual (período)
   - Diferença Campo vs Esteira
   
5. Tooltip customizado ao hover no gráfico

6. Link para fonte dos dados (Notícias Agrícolas)
```

### 6.6 Exportação de Dados

```
1. Botões de exportação disponíveis:
   - Desktop: Compact variant (topo da página)
   - Mobile: Floating variant (canto inferior direito)
   
2. Opções de exportação:
   CSV:
   - Dados climáticos
   - Insights
   - Notícias
   - Cotação
   - Relatório completo (todos os dados)
   
   PDF:
   - Página visual (captura da tela com html2canvas)
   
3. Fluxo CSV:
   - Gera arquivo com separador vírgula
   - Encoding UTF-8 com BOM (compatibilidade Excel)
   - Inclui timestamp e metadados
   - Download automático via Blob
   
4. Fluxo PDF:
   - Captura elemento HTML com html2canvas (scale: 2)
   - Gera jsPDF (formato A4)
   - Quebra de página automática se necessário
   - Download automático
   
5. Loading state durante exportação

6. Toast de sucesso/erro
```

---

## 7. Gerenciamento de Estado

### 7.1 Estado do Servidor (TanStack Query)

```typescript
// Cache automático de requisições
useQuery({
  queryKey: ['weather', lat, lon],
  queryFn: () => fetchWeather(lat, lon),
  staleTime: 30 * 60 * 1000, // 30 minutos (alinhado com cache do backend)
  retry: (failureCount, error) => {
    if (error.response?.status === 429) return false; // Não retenta 429
    return failureCount < 2;
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

**Queries principais:**
- `['weather', lat, lon]` - Dados climáticos (30min cache)
- `['insights', location]` - Insights por localização (5min cache)
- `['news']` - Notícias (1h cache)
- `['quotation']` - Cotação da cana (1h cache)

### 7.2 Estado Local (React useState)

- Localização selecionada
- Estado de modais/drawers
- Query de busca (autocomplete)
- Cooldown de rate limiting (timestamp do último 429)

### 7.3 Formulários (React Hook Form + Zod)

```typescript
// Schema de validação
const createInsightSchema = z.object({
  authorName: z.string().min(2).max(100),
  authorRole: z.string().max(50).optional(),
  content: z.string().min(10).max(1000),
  tags: z.array(z.string().min(2).max(30)).max(5),
});
```

---

## 8. Tratamento de Rate Limiting

### 8.1 Limites Implementados no Backend (Nginx)

| Endpoint | Rate Limit | Burst | Uso Frontend |
|----------|-----------|-------|--------------|
| `/api/v1/locations/search` | 5 req/s | 10 | Autocomplete (debounce 300ms mitiga) |
| `/api/v1/weather` | 1 req/s | 20 | Consulta clima |
| `/api/v1/insights` (POST) | 10 req/min | 5 | Compartilhar insight |
| `/api/v1/insights` (GET) | 1 req/s | 20 | Listar/paginar insights |
| `/api/v1/news` | Sem limite | - | Feed de notícias (cache backend 1h) |
| `/quotation` | Sem limite | - | Cotação (cache backend 1h) |

### 8.2 Estratégias de Mitigação Client-Side

**1. Debouncing (Autocomplete)**
```typescript
const debouncedSearch = useDebounce(searchTerm, 300);
// 300ms = usuário precisa digitar 3+ caracteres/seg para atingir 5 req/s
```

**2. Throttling (Scroll Infinito)**
```typescript
const handleScroll = throttle(() => {
  if (hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }
}, 2000); // Mínimo 2s entre requisições
```

**3. Cooldown Tracking**
```typescript
const { isInCooldown, remainingSeconds } = useRateLimitHandler();

// Desabilita botão durante cooldown
<Button disabled={isInCooldown}>
  {isInCooldown ? `Aguarde ${remainingSeconds}s` : 'Publicar'}
</Button>
```

**4. Retry com Exponential Backoff**
```typescript
async function retryWithBackoff<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || Math.pow(2, i);
        await sleep(retryAfter * 1000);
        continue;
      }
      throw error;
    }
  }
}
```

### 8.3 Resposta a Erro 429

**Estrutura do Erro do Backend:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Muitas requisições. Tente novamente em alguns segundos.",
    "retry_after": 60
  }
}
```

**Tratamento no Frontend:**
- Toast com duração customizada (retry_after * 1000ms)
- Badge visual "Aguardando cooldown" com contador regressivo
- Botão desabilitado durante cooldown
- Persistência no localStorage (sincronização entre abas)

---

## 9. Identidade Visual

### 9.1 Paleta de Cores

```
Primárias:
- Verde Cana: #2D5F2E
- Verde Claro: #4A8F4C
- Amarelo Colheita: #F5A623

Status:
- Ideal: #27AE60
- Atenção: #FFA940
- Crítico: #E74C3C
- Rate Limit: #FFA940

Backgrounds:
- Branco: #FFFFFF
- Cinza Claro: #F8F9FA
```

### 9.2 Tipografia

```
Font: Inter (Google Fonts)

H1: 2.5rem / Bold
H2: 2rem / Semibold
H3: 1.5rem / Semibold
Body: 1rem / Regular
Small: 0.875rem / Regular
```

### 9.3 Responsividade

```
Mobile (< 768px): 1 coluna, menu hamburger
Tablet (768-1024px): 2 colunas
Desktop (> 1024px): 3 colunas (clima + insights + notícias)
```

---

## 10. Otimizações

### 10.1 Performance

- **Bundle inicial:** < 200KB (gzipped)
- **Code Splitting:** Componentes pesados carregados sob demanda
- **Image:** Lazy loading, formatos modernos (WebP), responsive
- **Font:** Inter self-hosted, preload automático

### 10.2 Rate Limiting Client-Side

**Prevenção:**
1. Debounce em campos de busca (300ms)
2. Throttle em eventos de scroll (2s)
3. Desabilitar botões após submit (cooldown)
4. Cache agressivo (TanStack Query) para evitar requisições redundantes

**Recuperação:**
1. Retry automático com backoff exponencial
2. UI feedback durante cooldown (contador regressivo)
3. Persistência do estado de cooldown (localStorage + sincronização entre abas)
4. Mensagens claras sobre tempo de espera

### 10.3 SEO

**Meta Tags no Root Layout:**
```typescript
export const metadata = {
  title: 'Clima Cana | Monitoramento Climático para Cana-de-Açúcar',
  description: 'Plataforma de clima contextualizado...',
  keywords: ['clima', 'cana-de-açúcar', 'agricultura'],
  openGraph: { ... },
  robots: { index: true, follow: true },
}
```

**Arquivos SEO:**
- `public/robots.txt`
- `public/sitemap.xml`
- `public/manifest.json` (PWA)

---

## 11. Configuração Next.js

```javascript
// next.config.ts
const nextConfig = {
  output: 'export',                    // SSG
  images: { unoptimized: true },       // S3 sem servidor de imagens
  trailingSlash: true,                 // URLs terminam com / para S3
  reactCompiler: true,                 // React Compiler (otimizações)
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};
```

---

## 12. Funcionalidades Principais

### 12.1 Dashboard Climático
- Busca de localização com autocomplete (mínimo 3 caracteres)
- Geolocalização automática via navegador
- Dados climáticos atuais e previsão de 5 dias
- Análise específica para cultivo de cana-de-açúcar
- Recomendações agronômicas baseadas nas condições atuais

### 12.2 Fórum de Insights
- Compartilhamento de experiências e práticas
- Snapshot climático no momento da publicação
- Sistema de tags para categorização
- Filtros por localização, tags e ordenação
- Scroll infinito com paginação

### 12.3 Feed de Notícias
- Notícias do agronegócio via backend proxy
- Cache de 1 hora no backend
- Cards com imagem, título, fonte e data
- Link externo para matéria completa

### 12.4 Cotação da Cana
- Últimos 10 fechamentos (Campo vs Esteira)
- Gráfico interativo com Recharts
- Estatísticas: variação, média, máx/mín
- Diferença Campo vs Esteira (prêmio)
- Fonte: Notícias Agrícolas (web scraping backend)

### 12.5 Exportação de Dados
- CSV: Clima, Insights, Notícias, Cotação ou Relatório Completo
- PDF: Captura visual da página (html2canvas + jsPDF)
- Botões adaptativos: Compact (desktop) e Floating (mobile)

---

## 13. Melhorias Futuras

### 13.1 Funcionalidades
- PWA completo (instalação mobile)
- Dark mode
- Perfis de usuário com autenticação JWT
- Histórico de localizações favoritas
- Sistema de notificações push (alertas críticos)
- Export de relatórios personalizados

### 13.2 Performance
- Service Worker para cache offline
- Preload de localizações populares
- Request batching para otimizar rate limits
- Server-side rendering (SSR) para páginas dinâmicas

### 13.3 Rate Limiting Avançado
- Client-side token bucket para simulação local de limites
- Request queue com priorização
- Adaptive throttling baseado em histórico de 429s
- Dashboard de uso de API

---

**Versão:** 1.0.0  
**Última atualização:** Dezembro 2025  
**Stack:** Next.js 15+ | TypeScript | Tailwind CSS v4 | TanStack Query