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

Aplicação web construída com **Next.js 14+ usando Static Site Generation (SSG)** que oferece:

- **Consulta climática inteligente** com autocomplete de localização e dados contextualizados para cultivo de cana-de-açúcar
- **Fórum de conhecimento colaborativo** onde produtores compartilham insights e práticas
- **Feed de notícias** do agronegócio integrado com NewsAPI
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

**Nossa realidade:** Toda interação dinâmica (clima, insights, notícias) ocorre via API calls client-side após carregamento inicial. Não há rotas protegidas nem necessidade de computação server-side em runtime.

### 2.2 Por que S3 (sem CloudFront)?

**S3 Simples:**
- Hospedagem de site estático nativa do AWS
- Custo irrisório para MVP (~$0.50-$2/mês)
- Alta disponibilidade (99.99% SLA)
- Setup minimalista: bucket + política pública

**CloudFront seria útil para:**
- Latência global reduzida (CDN em edge locations)
- Invalidação de cache
- HTTPS customizado

**Decisão:** Para o MVP validando o produto, S3 puro é suficiente. CloudFront pode ser adicionado posteriormente sem refatoração do código.

### 2.3 Por que Docker Compose se o Front é Estático?

**Justificativa:**
- Atende requisito do desafio: "aplicação deve funcionar com `docker compose up`"
- Facilita validação do avaliador com ambiente reproduzível
- Permite testar integração front-back localmente

**Separação Dev vs Produção:**
- **Desenvolvimento (Docker Compose):** Frontend roda `npm run dev` em container para integração local
- **Produção:** Build SSG → Upload para S3 (sem container)

Docker Compose é ferramenta de desenvolvimento, não de deploy do frontend em produção.

---

## 3. Stack Tecnológica

```
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui (componentes base)
- React Hook Form + Zod (validação)
- TanStack Query (cache e estado assíncrono)
- Axios (HTTP client)
- Lucide Icons
- React Hot Toast (notificações)
- Recharts (gráficos)
```

---

## 4. Arquitetura de Diretórios

```
frontend/
├── public/
│   ├── robots.txt              # SEO - configuração para crawlers
│   ├── sitemap.xml             # SEO - mapa do site
│   └── images/
│       ├── logo.svg
│       └── og-image.jpg        # Open Graph para redes sociais
│
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout com meta tags SEO
│   │   ├── page.tsx            # Página inicial
│   │   ├── not-found.tsx       # 404 customizada
│   │   └── globals.css         # Estilos globais + Tailwind
│   │
│   ├── components/
│   │   ├── ui/                 # Shadcn/ui (button, card, input, badge, skeleton, toast)
│   │   ├── layout/             # Header, Footer, Container
│   │   ├── weather/            # LocationSearch, WeatherCard, SugarcaneAnalysis, 
│   │   │                       # WeatherMetrics, ForecastChart, WeatherSkeleton
│   │   ├── insights/           # InsightsList, InsightCard, InsightForm, 
│   │   │                       # InsightFilters, EmptyState
│   │   ├── news/               # NewsFeed, NewsCard, NewsSkeleton
│   │   └── shared/             # LoadingSpinner, ErrorMessage, StatusBadge, RateLimitWarning
│   │
│   ├── lib/
│   │   ├── api/                # client.ts, weather.ts, locations.ts, 
│   │   │                       # insights.ts, news.ts
│   │   ├── utils/              # format.ts, weather.ts, validation.ts, retry.ts
│   │   └── constants/          # weather.ts, sugarcane.ts, errors.ts
│   │
│   ├── hooks/                  # useWeather, useLocations, useInsights, 
│   │                           # useNews, useDebounce, useRateLimitHandler
│   │
│   ├── types/                  # weather.ts, location.ts, insight.ts, news.ts
│   │
│   └── config/
│       └── env.ts              # Validação de variáveis de ambiente
│
├── .env.local
├── next.config.js              # output: 'export' para SSG
├── tailwind.config.js
├── tsconfig.json
└── Dockerfile
```

---

## 5. Fluxos Principais

### 5.1 Consulta Climática

```
1. Usuário digita cidade → Debounce 300ms → GET /api/v1/locations/search?q=...
   - Rate limit: 5 req/s com burst de 10
   - Se 429: Aguarda 2s → Retry automático
2. Exibe dropdown com sugestões (nome, estado, país)
3. Usuário seleciona → GET /api/v1/weather?lat=...&lon=...&location_name=...
   - Rate limit: 1 req/s com burst de 20
   - Se 429: Toast "Muitas consultas. Aguarde alguns segundos..." → Retry após 3s
4. Durante loading: Skeleton screens nas seções
5. Sucesso: Renderiza WeatherCard + Metrics + SugarcaneAnalysis + Forecast + Insights
6. Habilita botão "Compartilhar Insight"
7. Erro: ErrorMessage com "Tentar Novamente"
```

### 5.2 Compartilhamento de Insights

```
1. Pré-requisito: Clima consultado (botão habilitado)
2. Modal abre com localização e clima pré-preenchidos (readonly)
3. Usuário preenche: Nome, Conteúdo (10-1000 chars), Tags (max 5)
4. Validação em tempo real (Zod)
5. Submit → POST /api/v1/insights
   - Rate limit: 10 req/min com burst de 5
   - Se 429: Toast "Limite de publicações atingido. Aguarde 1 minuto." → Desabilita botão por 60s
6. Sucesso: Modal fecha + Toast + Lista atualiza (cache invalidado)
7. Erro: Toast + formulário mantém dados
```

### 5.3 Visualização de Insights

```
1. Carregamento automático após consulta de clima
2. GET /api/v1/insights?location=...&limit=20
   - Rate limit: 1 req/s (compartilhado com endpoints gerais)
3. Cards ordenados por data (mais recentes primeiro)
4. Cada card: autor, localização, snapshot climático, conteúdo, tags, data
5. Scroll infinito: Carrega +20 ao chegar no final
   - Throttling: Mínimo 2s entre requests de paginação
6. Filtros: Por tags e ordenação
7. Estado vazio: "Seja o primeiro a compartilhar..."
```

### 5.4 Feed de Notícias

```
1. Carregamento automático no mount da página
2. NewsAPI: q="agronegócio OR cana-de-açúcar", language=pt
3. Cache de 1 hora (TanStack Query)
4. Grid de cards: imagem, título, fonte, data, link externo
5. Erro: Seção desaparece silenciosamente (não bloqueia experiência principal)
```

---

## 6. Gerenciamento de Estado

### 6.1 Estado do Servidor (TanStack Query)

```typescript
// Cache automático de requisições
useQuery({
  queryKey: ['weather', lat, lon],
  queryFn: () => fetchWeather(lat, lon),
  staleTime: 30 * 60 * 1000, // 30 minutos (alinhado com cache do backend)
  retry: (failureCount, error) => {
    // Não retenta 429 automaticamente via TanStack Query
    if (error.response?.status === 429) return false;
    return failureCount < 2;
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

**Queries principais:**
- `['weather', lat, lon]` - Dados climáticos (30min cache)
- `['insights', location]` - Insights por localização (5min cache)
- `['news']` - Notícias (1h cache)

### 6.2 Estado Local (React useState)

- Localização selecionada
- Estado de modais/drawers
- Query de busca (autocomplete)
- **Cooldown de rate limiting** (timestamp do último 429)

### 6.3 Formulários (React Hook Form + Zod)

- Validação em tempo real
- Type-safety completa
- Mensagens de erro customizadas

---

## 7. Tratamento de Rate Limiting

### 7.1 Limites Implementados no Backend (Nginx)

| Endpoint | Rate Limit | Burst | Uso Frontend |
|----------|-----------|-------|--------------|
| `/api/v1/locations/search` | 5 req/s | 10 | Autocomplete (debounce 300ms mitiga) |
| `/api/v1/weather` | 1 req/s | 20 | Consulta clima (usuário interage) |
| `/api/v1/insights` (POST) | 10 req/min | 5 | Compartilhar insight (ação deliberada) |
| `/api/v1/insights` (GET) | 1 req/s | 20 | Listar/paginar insights |

### 7.2 Estratégias de Mitigação Client-Side

**1. Debouncing (Autocomplete)**
```typescript
const debouncedSearch = useDebounce(searchTerm, 300);
// 300ms = usuário precisa digitar 3+ caracteres/seg para atingir 5 req/s
```

**2. Throttling (Scroll Infinito)**
```typescript
const handleScroll = useCallback(
  throttle(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, 2000), // Mínimo 2s entre requisições de paginação
  [hasNextPage, isFetchingNextPage]
);
```

**3. Cooldown Tracking**
```typescript
const [rateLimitCooldown, setRateLimitCooldown] = useState<Date | null>(null);

const isInCooldown = rateLimitCooldown && new Date() < rateLimitCooldown;

// Desabilita botão de submit durante cooldown
<Button disabled={isInCooldown || isSubmitting}>
  {isInCooldown ? `Aguarde ${remainingSeconds}s` : 'Publicar'}
</Button>
```

**4. Retry com Exponential Backoff**
```typescript
// lib/utils/retry.ts
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || Math.pow(2, i) * initialDelay;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 7.3 Resposta a Erro 429

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
```typescript
// lib/api/client.ts - Interceptor Axios
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.data.error?.retry_after || 60;
      
      toast.error(
        `Limite de requisições atingido. Aguarde ${retryAfter}s.`,
        { duration: retryAfter * 1000 }
      );
      
      // Armazena timestamp para cooldown UI
      const cooldownUntil = new Date(Date.now() + retryAfter * 1000);
      localStorage.setItem('rateLimitCooldown', cooldownUntil.toISOString());
      
      return Promise.reject({
        ...error,
        isRateLimit: true,
        retryAfter
      });
    }
    return Promise.reject(error);
  }
);
```

**Componente de Aviso:**
```typescript
// components/shared/RateLimitWarning.tsx
export function RateLimitWarning({ retryAfter }: { retryAfter: number }) {
  const [remaining, setRemaining] = useState(retryAfter);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  if (remaining === 0) return null;
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-center">
        <ClockIcon className="h-5 w-5 text-yellow-400 mr-3" />
        <p className="text-sm text-yellow-700">
          Aguarde <strong>{remaining}s</strong> para fazer nova requisição
        </p>
      </div>
    </div>
  );
}
```

### 7.4 Hook Customizado

```typescript
// hooks/useRateLimitHandler.ts
export function useRateLimitHandler() {
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);
  
  useEffect(() => {
    const stored = localStorage.getItem('rateLimitCooldown');
    if (stored) {
      const date = new Date(stored);
      if (date > new Date()) {
        setCooldownUntil(date);
      } else {
        localStorage.removeItem('rateLimitCooldown');
      }
    }
  }, []);
  
  const isInCooldown = cooldownUntil && new Date() < cooldownUntil;
  const remainingSeconds = isInCooldown 
    ? Math.ceil((cooldownUntil.getTime() - Date.now()) / 1000)
    : 0;
  
  const handleRateLimitError = (retryAfter: number) => {
    const until = new Date(Date.now() + retryAfter * 1000);
    setCooldownUntil(until);
    localStorage.setItem('rateLimitCooldown', until.toISOString());
  };
  
  return {
    isInCooldown,
    remainingSeconds,
    handleRateLimitError
  };
}
```

---

## 8. Identidade Visual

### 8.1 Paleta de Cores

```
Primárias:
- Verde Cana: #2D5F2E
- Verde Claro: #4A8F4C
- Amarelo Colheita: #F5A623

Status:
- Ideal: #27AE60
- Atenção: #FFA940
- Crítico: #E74C3C
- Rate Limit: #FFA940 (laranja)

Backgrounds:
- Branco: #FFFFFF
- Cinza Claro: #F8F9FA
```

### 8.2 Tipografia

```
Font: Inter (Google Fonts)

H1: 2.5rem / Bold
H2: 2rem / Semibold
H3: 1.5rem / Semibold
Body: 1rem / Regular
Small: 0.875rem / Regular
```

### 8.3 Componentes

**Cards:** Shadow sutil, border-radius 12px, hover aumenta elevação  
**Inputs:** Focus ring 2px na cor primária, ícones internos  
**Badges:** Formato pill, cores semânticas  
**Skeleton:** Gradiente animado (shimmer effect)  
**Toasts:** Top-right, auto-dismiss 5s (exceto rate limit), tipos: success/error/info/loading/warning  
**Rate Limit Badge:** Laranja com ícone de relógio

### 8.4 Responsividade

```
Mobile (< 768px): 1 coluna, menu hamburger
Tablet (768-1024px): 2 colunas
Desktop (> 1024px): 3 colunas (clima + insights + notícias)
```

---

## 9. Tratamento de Estados

### 9.1 Loading States

**Skeleton Screens (preferencial):** Mantém layout, gradiente animado  
**Spinners:** Apenas em ações de usuário (submit)  
**Toast loading:** "Buscando dados climáticos..."  
**Cooldown Timer:** Contador regressivo em botões durante rate limit

### 9.2 Empty States

- Ilustração + mensagem amigável
- CTA para ação (ex: "Compartilhar Insight")

### 9.3 Error States

**Erro Genérico:**
- Ícone + título + mensagem clara
- Botão "Tentar Novamente" (refetch)
- Toast de erro

**Erro 429 (Rate Limit):**
- Toast laranja com duração customizada (retry_after)
- Badge visual "Aguardando cooldown" com contador
- Botão desabilitado com texto "Aguarde Xs"
- Não exibe botão "Tentar Novamente" durante cooldown

### 9.4 Toast Messages

```typescript
// Sucesso
toast.success('Insight publicado!')

// Erro genérico
toast.error('Falha ao carregar. Tente novamente.')

// Loading
toast.loading('Salvando...')

// Rate Limit (duração customizada)
toast.error(
  'Limite de requisições atingido. Aguarde 60s.',
  { 
    duration: 60000,
    icon: '⏱️'
  }
)
```

---

## 10. Integrações de APIs

### 10.1 Backend (FastAPI)

**Base URL:** `process.env.NEXT_PUBLIC_API_URL`

**Endpoints consumidos:**
- `GET /api/v1/locations/search?q=...` - Autocomplete (5 req/s)
- `GET /api/v1/weather?lat=...&lon=...&location_name=...` - Clima (1 req/s)
- `POST /api/v1/insights` - Criar insight (10 req/min)
- `GET /api/v1/insights?location=...&limit=20` - Listar insights (1 req/s)

**Tratamento de erros:**
```typescript
// Interceptor global no Axios
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorData = error.response?.data?.error;
    
    switch (status) {
      case 429:
        // Rate limit - Ver seção 7.3
        handleRateLimitError(errorData);
        break;
        
      case 400:
        toast.error(errorData?.message || 'Dados inválidos');
        break;
        
      case 404:
        toast.error('Recurso não encontrado');
        break;
        
      case 500:
        toast.error('Erro no servidor. Tente novamente.');
        break;
        
      case 503:
        toast.error('Serviço temporariamente indisponível');
        break;
        
      default:
        if (!navigator.onLine) {
          toast.error('Sem conexão com a internet');
        } else {
          toast.error('Erro inesperado. Tente novamente.');
        }
    }
    
    return Promise.reject(error);
  }
);
```

**Retry automático em falhas de rede:**
- TanStack Query: 2 tentativas com backoff exponencial
- Não retenta 429 (aguarda cooldown)

### 10.2 NewsAPI

**Endpoint:** `https://newsapi.org/v2/everything`

**Configuração:**
```typescript
{
  q: 'agronegócio OR "cana-de-açúcar"',
  language: 'pt',
  sortBy: 'publishedAt',
  pageSize: 10
}
```

**Rate limit:** 100 req/dia (plano gratuito) - mitigado com cache de 1h  
**Fallback:** Se falhar, seção desaparece silenciosamente

---

## 11. Otimizações

### 11.1 Next.js Nativo

- **Image:** Lazy loading, formatos modernos (WebP), responsive
- **Font:** Inter self-hosted, preload automático
- **Code Splitting:** Componentes pesados carregados sob demanda

### 11.2 Performance

- **Bundle inicial:** Target < 200KB (gzipped)
- **Debounce:** 300ms no autocomplete (previne rate limit)
- **Throttle:** 2s no scroll infinito (previne rate limit)
- **Cache:** TanStack Query alinhado com TTL do backend (30min)

### 11.3 Rate Limiting Client-Side

**Prevenção:**
1. Debounce em campos de busca
2. Throttle em eventos de scroll
3. Desabilitar botões após submit (cooldown)
4. Cache agressivo para evitar requisições redundantes

**Recuperação:**
1. Retry automático com backoff exponencial
2. UI feedback durante cooldown
3. Persistência do estado de cooldown (localStorage)
4. Mensagens claras sobre tempo de espera

### 11.4 SEO

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
- `public/robots.txt` - Configuração para crawlers
- `public/sitemap.xml` - Mapa do site
- `public/images/og-image.jpg` - Open Graph

---

## 12. Acessibilidade

**WCAG 2.1 AA:**
- Contraste de cores ≥ 4.5:1
- Navegação completa via teclado
- Labels claros em formulários
- ARIA roles em componentes dinâmicos
- HTML semântico (`<main>`, `<nav>`, `<article>`)
- **Anúncio de rate limiting** via aria-live para leitores de tela

---

## 13. Experiência Mobile

**Layout Mobile:**
1. Campo de busca (fixo no topo)
2. Clima atual
3. Análise para cana (colapsável)
4. Insights
5. Notícias (tabs ou bottom sheet)

**Touch:**
- Botões ≥ 44x44px
- Feedback visual ao tocar
- Pull-to-refresh nos insights (com throttling de 3s)

---

## 14. Configuração Next.js

```javascript
// next.config.js
const nextConfig = {
  output: 'export',           // SSG
  images: { unoptimized: true }, // S3 sem servidor de imagens
  trailingSlash: true,        // URLs terminam com / para S3
};
```

---

## 15. Variáveis de Ambiente

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_NEWS_API_KEY=your_key

# .env.production
NEXT_PUBLIC_API_URL=http://ec2-xx-xxx-xxx-xx.compute.amazonaws.com:8000
NEXT_PUBLIC_NEWS_API_KEY=your_key
```

## 16. Melhorias Futuras

### 16.1 Funcionalidades
- PWA para instalação mobile
- Dark mode
- Perfis de usuário com autenticação JWT
- Histórico de localizações recentes
- Sistema de notificações push (alertas críticos)
- Export de relatórios em PDF

### 16.2 Performance
- Service Worker para cache offline
- Preload de localizações populares
- **Request batching** para otimizar rate limits

### 16.3 Rate Limiting Avançado
- **Client-side token bucket** para simulação local de limites
- **Request queue** com priorização (clima > insights > notícias)
- **Adaptive throttling** baseado em histórico de 429s
- Dashboard de uso de API (quantos requests restam)

### 16.4 SEO Avançado
- Blog com artigos (Next.js + MDX)
- Páginas estáticas para regiões produtoras

### 16.5 Infraestrutura
- CloudFront na frente do S3 (CDN global)
- Monitoramento com Sentry (tracking de 429s)
- CI/CD com GitHub Actions
- Testes automatizados (Jest + Testing Library)
- **Smoke tests** para verificar rate limits após deploy

---

**Versão:** 1.0.0  
**Última atualização:** Novembro 2025  
**Stack:** Next.js 14+ | TypeScript | Tailwind CSS | TanStack Query