/**
 * Hook para busca de localizações (autocomplete)
 * Rate limit: 5 req/s com burst de 10
 * Mitigação: Debounce de 300ms
 */

import { useQuery } from '@tanstack/react-query';
import { searchLocations } from '@/lib/api/locations';
import type { LocationSearchResponse } from '@/types/location';
import { useDebounce } from './useDebounce';
import { isRateLimitError } from '@/lib/api/client';
import { useRateLimitHandler } from './useRateLimitHandler';

interface UseLocationsOptions {
  query: string;
  limit?: number;
  debounceDelay?: number;
  enabled?: boolean;
}

export function useLocations(options: UseLocationsOptions) {
  const {
    query,
    limit = 10,
    debounceDelay = 300,
    enabled = true,
  } = options;

  const { handleRateLimitError } = useRateLimitHandler();
  const debouncedQuery = useDebounce(query, debounceDelay);

  // Validação: mínimo 2 caracteres
  const isValidQuery = debouncedQuery.trim().length >= 2;

  return useQuery<LocationSearchResponse>({
    queryKey: ['locations', debouncedQuery, limit],
    queryFn: async () => {
      if (!isValidQuery) {
        return { suggestions: [], query: debouncedQuery, count: 0 };
      }

      try {
        return await searchLocations({
          q: debouncedQuery,
          limit,
        });
      } catch (error) {
        // Se for rate limit, dispara o handler
        if (isRateLimitError(error)) {
          const retryAfter = (error as any).retryAfter || 60;
          handleRateLimitError(retryAfter);
        }
        throw error;
      }
    },
    enabled: enabled && isValidQuery,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error) => {
      // Não retenta rate limiting
      if (isRateLimitError(error)) return false;
      // Retenta até 2 vezes para outros erros
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000),
  });
}

/**
 * Hook para buscar localizações recentes do localStorage
 */
export function useRecentLocations() {
  return useQuery({
    queryKey: ['recentLocations'],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem('recentLocations');
        if (!stored) return [];

        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('[useRecentLocations] Erro ao ler localStorage:', error);
        return [];
      }
    },
    staleTime: Infinity, // Nunca fica stale (só atualiza manualmente)
    gcTime: Infinity,
  });
}