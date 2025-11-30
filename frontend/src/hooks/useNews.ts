/**
 * Hook para buscar notícias do agronegócio
 * Cache: 1 hora (para economizar quota do NewsAPI - 100 req/dia)
 * Fallback: se falhar, retorna array vazio sem bloquear a UI
 */

import { useQuery } from '@tanstack/react-query';
import { getNews } from '@/lib/api/news';
import type { ProcessedNewsArticle } from '@/types/news';

interface UseNewsOptions {
  query?: string;
  category?: 'AGRIBUSINESS' | 'SUGARCANE' | 'WEATHER';
  pageSize?: number;
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
  enabled?: boolean;
}

export function useNews(options: UseNewsOptions = {}) {
  const {
    query,
    category = 'AGRIBUSINESS',
    pageSize = 10,
    sortBy = 'publishedAt',
    enabled = true,
  } = options;

  return useQuery<ProcessedNewsArticle[]>({
    queryKey: ['news', query, category, pageSize, sortBy],
    queryFn: async () => {
      try {
        return await getNews({
          category,
          pageSize,
          sortBy,
        });
      } catch (error) {
        // Falha silenciosa: retorna array vazio
        console.error('[useNews] Erro ao buscar notícias:', error);
        return [];
      }
    },
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hora
    gcTime: 2 * 60 * 60 * 1000, // 2 horas
    retry: 1, // Tenta apenas 1 vez (NewsAPI tem quota limitada)
    retryDelay: 5000, // 5 segundos entre tentativas
  });
}

/**
 * Hook para headlines (top stories)
 */
export function useTopHeadlines(
  country: string = 'br',
  category: string = 'business',
  enabled: boolean = true
) {
  return useQuery<ProcessedNewsArticle[]>({
    queryKey: ['headlines', country, category],
    queryFn: async () => {
      try {
        const { getTopHeadlines } = await import('@/lib/api/news');
        return await getTopHeadlines(country, category);
      } catch (error) {
        console.error('[useTopHeadlines] Erro:', error);
        return [];
      }
    },
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hora
    gcTime: 2 * 60 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook para cache local de notícias (localStorage)
 */
export function useCachedNews() {
  return useQuery<ProcessedNewsArticle[] | null>({
    queryKey: ['cachedNews'],
    queryFn: async () => {
      try {
        const { getCachedNews } = await import('@/lib/api/news');
        return getCachedNews();
      } catch (error) {
        console.error('[useCachedNews] Erro:', error);
        return null;
      }
    },
    staleTime: Infinity, // Nunca fica stale
    gcTime: Infinity,
  });
}