/**
 * API de Notícias - PROXY via Backend (resolve CORS)
 * Backend faz requisição server-side para NewsAPI
 * Cache: 1 hora no backend
 */

import { get } from "./client";
import { retryWithBackoff } from "@/lib/utils/retry";
import type { NewsArticle, ProcessedNewsArticle } from "@/types/news";

// ============================================
// INTERFACES
// ============================================

export interface GetNewsParams {
  category?: "AGRIBUSINESS" | "SUGARCANE" | "WEATHER";
  pageSize?: number;
  sortBy?: "relevancy" | "popularity" | "publishedAt";
}

interface BackendNewsResponse {
  articles: NewsArticle[];
  total_results: number;
  category: string;
  cached: boolean;
  cached_at?: string;
}

// ============================================
// ENDPOINTS (USA BACKEND PROXY)
// ============================================

/**
 * Busca notícias via proxy do backend
 *
 * ✅ Funciona em localhost, EC2, S3 (sem CORS)
 * Cache backend: 1 hora
 * Rate limit: 100 req/dia (NewsAPI)
 */
export async function getNews(
  params: GetNewsParams = {}
): Promise<ProcessedNewsArticle[]> {
  const {
    category = "AGRIBUSINESS",
    pageSize = 10,
    sortBy = "publishedAt",
  } = params;

  try {
    const response = await retryWithBackoff(
      () =>
        get<BackendNewsResponse>("/api/v1/news", {
          params: {
            category,
            page_size: pageSize,
            sort_by: sortBy,
          },
        }),
      {
        maxRetries: 2,
        initialDelay: 2000,
      }
    );

    return processNewsArticles(response.articles);
  } catch (error) {
    console.error("[News] Erro ao buscar via backend:", error);

    // Fallback: tenta cache local
    const cached = getCachedNews();
    if (cached) {
      console.log("[News] Usando cache local como fallback");
      return cached;
    }

    return [];
  }
}

/**
 * Busca headlines via backend
 */
export async function getTopHeadlines(
  country: string = "br",
  category: string = "business"
): Promise<ProcessedNewsArticle[]> {
  try {
    const response = await get<BackendNewsResponse>(
      "/api/v1/news/top-headlines",
      {
        params: { country, category },
      }
    );

    return processNewsArticles(response.articles);
  } catch (error) {
    console.error("[News Headlines] Erro:", error);
    return [];
  }
}

// ============================================
// PROCESSAMENTO
// ============================================

function processNewsArticles(articles: NewsArticle[]): ProcessedNewsArticle[] {
  return articles.filter(isValidArticle).map((article, index) => ({
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

function isValidArticle(article: NewsArticle): boolean {
  return !!(
    article.title &&
    article.url &&
    article.publishedAt &&
    !article.title.includes("[Removed]")
  );
}

function generateArticleId(article: NewsArticle, index: number): string {
  const hash = article.url
    .split("")
    .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
  return `${Math.abs(hash)}-${index}`;
}

function sanitizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ").slice(0, 200);
}

function extractDescription(content: string | null): string {
  if (!content) return "";
  const cleaned = content.replace(/\s*\[\+\d+ chars\]\s*$/, "");
  return cleaned.slice(0, 150) + (cleaned.length > 150 ? "..." : "");
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "agora";
  if (diffMinutes < 60)
    return `${diffMinutes} minuto${diffMinutes > 1 ? "s" : ""} atrás`;
  if (diffHours < 24)
    return `${diffHours} hora${diffHours > 1 ? "s" : ""} atrás`;
  if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? "s" : ""} atrás`;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

// ============================================
// CACHE LOCAL (FALLBACK)
// ============================================

const NEWS_CACHE_KEY = "newsCache";
const CACHE_DURATION_MS = 3600000; // 1 hora

interface NewsCache {
  data: ProcessedNewsArticle[];
  timestamp: number;
}

export function cacheNews(articles: ProcessedNewsArticle[]): void {
  try {
    const cache: NewsCache = {
      data: articles,
      timestamp: Date.now(),
    };
    localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("[News] Erro ao salvar cache:", error);
  }
}

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
    console.error("[News] Erro ao ler cache:", error);
    return null;
  }
}

export function clearNewsCache(): void {
  localStorage.removeItem(NEWS_CACHE_KEY);
}
