/**
 * Types para NewsAPI (feed de notícias do agronegócio)
 */

export interface NewsSource {
  id: string | null;
  name: string; // "G1", "Reuters", etc
}

export interface NewsArticle {
  source: NewsSource;
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null; // URL da imagem de capa
  publishedAt: string; // ISO timestamp
  content: string | null; // conteúdo parcial (truncado)
}

// Resposta da NewsAPI
export interface NewsAPIResponse {
  status: 'ok' | 'error';
  totalResults: number;
  articles: NewsArticle[];
  code?: string; // em caso de erro
  message?: string;
}

// Artigo processado para exibição
export interface ProcessedNewsArticle {
  id: string; // hash da URL
  title: string;
  description: string;
  url: string;
  image: string | null;
  source: string;
  publishedAt: Date;
  timeAgo: string; // "2 horas atrás"
}

// Query para buscar notícias
export interface NewsQuery {
  q: string; // query de busca
  language?: string; // "pt"
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
  pageSize?: number; // 1-100
  page?: number;
}

// Estado do componente NewsFeed
export interface NewsFeedState {
  articles: ProcessedNewsArticle[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}