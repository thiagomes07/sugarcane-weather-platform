/**
 * Types para sistema de insights/fórum colaborativo
 * Onde produtores compartilham conhecimento sobre cultivo
 */

export interface InsightAuthor {
  name: string;
  role?: string; // "Produtor", "Agrônomo", etc (opcional)
}

export interface InsightLocation {
  name: string; // "Ribeirão Preto"
  state?: string;
  country: string;
  lat: number;
  lon: number;
}

// Snapshot das condições climáticas no momento do insight
export interface InsightWeatherSnapshot {
  temperature: number;
  humidity: number;
  condition: string; // "Céu limpo", "Chuva"
  rainfall_24h: number; // mm
  timestamp: string; // ISO timestamp
}

export interface Insight {
  id: string;
  author: InsightAuthor;
  location: InsightLocation;
  weather_snapshot: InsightWeatherSnapshot;
  content: string; // 10-1000 caracteres
  tags: string[]; // max 5 tags
  created_at: string; // ISO timestamp
  updated_at?: string;
  likes?: number; // futuro: sistema de curtidas
}

// Para criação de novo insight (POST)
export interface CreateInsightRequest {
  author: {
    name: string;
    role?: string;
  };
  location: {
    name: string;
    state?: string;
    country: string;
    lat: number;
    lon: number;
  };
  weather_snapshot: {
    temperature: number;
    humidity: number;
    condition: string;
    rainfall_24h: number;
  };
  content: string;
  tags: string[];
}

// Resposta da API ao criar insight
export interface CreateInsightResponse {
  success: boolean;
  insight: Insight;
  message: string;
}

// Listagem de insights (GET)
export interface ListInsightsQuery {
  location?: string; // filtrar por nome da localização
  tags?: string[]; // filtrar por tags
  limit?: number; // paginação
  offset?: number;
  sort?: 'recent' | 'popular'; // ordenação
}

export interface ListInsightsResponse {
  insights: Insight[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Estado do formulário (validação Zod)
export interface InsightFormData {
  authorName: string; // 2-100 caracteres
  authorRole?: string;
  content: string; // 10-1000 caracteres
  tags: string[]; // 0-5 tags, cada uma 2-30 chars
}

// Filtros da UI
export interface InsightFilters {
  selectedTags: string[];
  sortBy: 'recent' | 'popular';
  searchQuery: string;
}

// Erro específico de rate limiting
export interface InsightRateLimitError {
  error: {
    code: 'RATE_LIMIT_EXCEEDED';
    message: string;
    retry_after: number; // segundos
  };
}