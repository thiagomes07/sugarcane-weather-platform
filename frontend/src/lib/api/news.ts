/**
 * API de Notícias - NewsAPI (agronegócio e cana-de-açúcar)
 * Rate limit: 100 req/dia (plano gratuito)
 * Mitigação: Cache de 1 hora no TanStack Query
 */

import axios from 'axios';
import { env } from '@/config/env';
import { retryWithBackoff } from '@/lib/utils/retry';
import type { NewsAPIResponse, NewsArticle, ProcessedNewsArticle } from '@/types/news';

// ============================================
// CONSTANTES
// ============================================

const NEWS_API_BASE_URL = 'https://newsapi.org/v2';
const DEFAULT_PAGE_SIZE = 10;
const NEWS_CATEGORIES = {
  AGRIBUSINESS: 'agronegócio OR agricultura OR "cana-de-açúcar"',
  SUGARCANE: '"cana-de-açúcar" OR "canavial" OR "usina de açúcar"',
  WEATHER: 'clima OR meteorologia AND agricultura',
} as const;

// ============================================
// INTERFACES
// ============================================

export interface GetNewsParams {
  query?: string;
  category?: keyof typeof NEWS_CATEGORIES;
  pageSize?: number;
  page?: number;
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
}

// ============================================
// CLIENTE SEPARADO (NewsAPI não passa pelo backend)
// ============================================

const newsClient = axios.create({
  baseURL: NEWS_API_BASE_URL,
  timeout: 15000,
});

// ============================================
// ENDPOINTS
// ============================================

/**
 * Busca notícias do agronegócio
 * 
 * Cache recomendado: 1 hora (TanStack Query)
 * Rate limit: 100 req/dia
 * 
 * @throws Error - Se API key inválida ou quota excedida
 */
export async function getNews(
  params: GetNewsParams = {}
): Promise<ProcessedNewsArticle[]> {
  const {
    query,
    category = 'AGRIBUSINESS',
    pageSize = DEFAULT_PAGE_SIZE,
    page = 1,
    sortBy = 'publishedAt',
  } = params;
  
  // Constrói query
  const searchQuery = query || NEWS_CATEGORIES[category];
  
  try {
    const response = await retryWithBackoff(
      () =>
        newsClient.get<NewsAPIResponse>('/everything', {
          params: {
            q: searchQuery,
            language: 'pt',
            sortBy,
            pageSize,
            page,
            apiKey: env.newsApiKey,
          },
        }),
      {
        maxRetries: 2,
        initialDelay: 2000,
        onRetry: (error, attempt) => {
          console.log(`[News] Tentativa ${attempt} de busca de notícias`);
        },
      }
    );
    
    // Processa artigos
    return processNewsArticles(response.data.articles);
  } catch (error) {
    console.error('[News] Erro ao buscar notícias:', error);
    
    // Se falhar, retorna array vazio (não bloqueia a experiência)
    return [];
  }
}

/**
 * Busca notícias por categoria específica
 */
export async function getNewsByCategory(
  category: keyof typeof NEWS_CATEGORIES,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<ProcessedNewsArticle[]> {
  return getNews({ category, pageSize });
}

/**
 * Busca headlines (top stories)
 */
export async function getTopHeadlines(
  country: string = 'br',
  category: string = 'business'
): Promise<ProcessedNewsArticle[]> {
  try {
    const response = await retryWithBackoff(
      () =>
        newsClient.get<NewsAPIResponse>('/top-headlines', {
          params: {
            country,
            category,
            apiKey: env.newsApiKey,
          },
        }),
      { maxRetries: 2 }
    );
    
    return processNewsArticles(response.data.articles);
  } catch (error) {
    console.error('[News] Erro ao buscar headlines:', error);
    return [];
  }
}

// ============================================
// PROCESSAMENTO
// ============================================

/**
 * Processa artigos brutos da NewsAPI
 */
function processNewsArticles(articles: NewsArticle[]): ProcessedNewsArticle[] {
  return articles
    .filter(isValidArticle)
    .map((article, index) => ({
      id: generateArticleId(article, index),
      title: sanitizeTitle(article.title),
      description: article.description || extractDescription(article.content),
      url: article.url,
      image: article.urlToImage,
      source: article.source.name,
      publishedAt: new Date(article.publishedAt),
      timeAgo: formatTimeAgo(new Date(article.publishedAt)),
    }));
}

/**
 * Valida se artigo tem dados mínimos necessários
 */
function isValidArticle(article: NewsArticle): boolean {
  return !!(
    article.title &&
    article.url &&
    article.publishedAt &&
    !article.title.includes('[Removed]') // NewsAPI remove alguns artigos
  );
}

/**
 * Gera ID único para o artigo (hash da URL)
 */
function generateArticleId(article: NewsArticle, index: number): string {
  // Simples hash da URL
  const hash = article.url
    .split('')
    .reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);
  
  return `${Math.abs(hash)}-${index}`;
}

/**
 * Sanitiza título (remove caracteres especiais, trunca se muito longo)
 */
function sanitizeTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 200); // Max 200 chars
}

/**
 * Extrai descrição do conteúdo se description não existir
 */
function extractDescription(content: string | null): string {
  if (!content) return '';
  
  // Remove "... [+X chars]" do final (NewsAPI trunca)
  const cleaned = content.replace(/\s*\[\+\d+ chars\]\s*$/, '');
  
  // Pega primeiras 150 caracteres
  return cleaned.slice(0, 150) + (cleaned.length > 150 ? '...' : '');
}

/**
 * Formata tempo relativo (ex: "2 horas atrás")
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMinutes < 1) return 'agora';
  if (diffMinutes < 60) return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} atrás`;
  if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
  if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
  
  // Mais de 7 dias: mostra data
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

// ============================================
// CACHE LOCAL (OPCIONAL)
// ============================================

const NEWS_CACHE_KEY = 'newsCache';
const CACHE_DURATION_MS = 3600000; // 1 hora

interface NewsCache {
  data: ProcessedNewsArticle[];
  timestamp: number;
}

/**
 * Salva notícias no cache do localStorage
 */
export function cacheNews(articles: ProcessedNewsArticle[]): void {
  try {
    const cache: NewsCache = {
      data: articles,
      timestamp: Date.now(),
    };
    localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('[News] Erro ao salvar cache:', error);
  }
}

/**
 * Recupera notícias do cache (se não expirou)
 */
export function getCachedNews(): ProcessedNewsArticle[] | null {
  try {
    const cached = localStorage.getItem(NEWS_CACHE_KEY);
    if (!cached) return null;
    
    const parsed: NewsCache = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;
    
    if (age > CACHE_DURATION_MS) {
      localStorage.removeItem(NEWS_CACHE_KEY);
      return null;
    }
    
    return parsed.data;
  } catch (error) {
    console.error('[News] Erro ao ler cache:', error);
    return null;
  }
}

/**
 * Limpa cache de notícias
 */
export function clearNewsCache(): void {
  localStorage.removeItem(NEWS_CACHE_KEY);
}