/**
 * Hook para busca de localizações (autocomplete)
 * Rate limit: 5 req/s com burst de 10
 * Mitigação: Debounce de 300ms
 * 
 * ✅ Validação: Mínimo 3 caracteres (server-side exige isso)
 */

import { useQuery } from '@tanstack/react-query';
import { searchLocations } from '@/lib/api/locations';
import type { LocationSearchResponse } from '@/types/location';
import { useDebounce } from './useDebounce';
import { isRateLimitError } from '@/lib/api/client';
import { useRateLimitHandler } from './useRateLimitHandler';
import { toast } from 'sonner';

interface UseLocationsOptions {
  query: string;
  limit?: number;
  debounceDelay?: number;
  enabled?: boolean;
}

// ✅ Constante de validação (deve bater com o backend)
const MIN_QUERY_LENGTH = 3;

export function useLocations(options: UseLocationsOptions) {
  const {
    query,
    limit = 10,
    debounceDelay = 300,
    enabled = true,
  } = options;

  const { handleRateLimitError } = useRateLimitHandler();
  const debouncedQuery = useDebounce(query, debounceDelay);

  // ✅ Validação: mínimo 3 caracteres (evita 422 do backend)
  const isValidQuery = debouncedQuery.trim().length >= MIN_QUERY_LENGTH;

  return useQuery<LocationSearchResponse>({
    queryKey: ['locations', debouncedQuery, limit],
    queryFn: async () => {
      // Se query inválida, retorna vazio ao invés de fazer requisição
      if (!isValidQuery) {
        console.log('[useLocations] Query muito curta, retornando vazio');
        return { 
          suggestions: [], 
          query: debouncedQuery, 
          count: 0 
        };
      }

      try {
        console.log(`[useLocations] Buscando: "${debouncedQuery}"`);
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
        
        // ✅ Tratamento específico de erro 422
        if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          (error as any).response?.status === 422
        ) {
          console.warn('[useLocations] Query inválida (422):', debouncedQuery);
          toast.error('Digite pelo menos 3 caracteres para buscar');
          // Retorna vazio ao invés de lançar erro
          return { suggestions: [], query: debouncedQuery, count: 0 };
        }
        
        throw error;
      }
    },

    // ✅ Só busca se query é válida (economiza requisições)
    enabled: enabled && isValidQuery,

    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error) => {
      // Não retenta 422 ou 429
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const status = (error as any).response?.status;
        if (status === 422 || status === 429) {
          console.warn(`[useLocations] Não retentando erro ${status}`);
          return false;
        }
      }

      // Retenta até 2 vezes para outros erros
      return failureCount < 2;
    },

    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000),
  });
}