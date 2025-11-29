/**
 * Hooks para sistema de insights/fórum
 * Listagem: useInfiniteQuery (scroll infinito)
 * Criação: useMutation com tratamento de rate limit
 */

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getInsights,
  createInsight,
  type CreateInsightRequest,
} from '@/lib/api/insights';
import type {
  ListInsightsQuery,
  ListInsightsResponse,
  CreateInsightResponse,
} from '@/types/insight';
import { isRateLimitError } from '@/lib/api/client';
import { useRateLimitHandler } from './useRateLimitHandler';

interface UseInsightsOptions {
  location?: string;
  tags?: string[];
  sort?: 'recent' | 'popular';
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook para listar insights com paginação infinita
 */
export function useInsights(options: UseInsightsOptions = {}) {
  const {
    location,
    tags,
    sort = 'recent',
    limit = 20,
    enabled = true,
  } = options;

  const { handleRateLimitError } = useRateLimitHandler();

  return useInfiniteQuery<ListInsightsResponse>({
    queryKey: ['insights', location, tags, sort, limit],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        return await getInsights({
          location,
          tags,
          sort,
          limit,
          offset: pageParam as number,
        });
      } catch (error) {
        if (isRateLimitError(error)) {
          const retryAfter = (error as any).retryAfter || 60;
          handleRateLimitError(retryAfter);
        }
        throw error;
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more) return undefined;
      return lastPage.offset + lastPage.limit;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (isRateLimitError(error)) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook para criar novo insight
 * Rate limit: 10 req/min com burst de 5
 */
export function useCreateInsight() {
  const queryClient = useQueryClient();
  const { handleRateLimitError, isInCooldown, remainingSeconds } =
    useRateLimitHandler();

  return useMutation<CreateInsightResponse, Error, CreateInsightRequest>({
    mutationFn: async (data) => {
      // Bloqueia se estiver em cooldown
      if (isInCooldown) {
        throw new Error(
          `Aguarde ${remainingSeconds}s antes de publicar novamente.`
        );
      }

      try {
        return await createInsight(data);
      } catch (error) {
        // Tratamento especial para rate limit
        if (isRateLimitError(error)) {
          const retryAfter = (error as any).retryAfter || 60;
          handleRateLimitError(retryAfter);

          toast.error(
            `Limite de publicações atingido. Aguarde ${retryAfter}s.`,
            {
              duration: retryAfter * 1000,
              icon: '⏱️',
            }
          );

          throw new Error(`Rate limit: aguarde ${retryAfter}s`);
        }
        throw error;
      }
    },
    onSuccess: (response) => {
      // Invalida cache de insights para forçar reload
      queryClient.invalidateQueries({ queryKey: ['insights'] });

      toast.success('Insight publicado com sucesso!', {
        description: 'Sua contribuição foi adicionada à comunidade.',
        duration: 5000,
      });
    },
    onError: (error) => {
      // Erros de rate limit já foram tratados no mutationFn
      if (!error.message.startsWith('Rate limit')) {
        toast.error('Erro ao publicar insight', {
          description: error.message,
          duration: 5000,
        });
      }
    },
  });
}

/**
 * Hook para filtrar insights no client-side
 * (alternativa ao fazer refetch com novos parâmetros)
 */
export function useInsightsFilter(insights: any[], selectedTags: string[]) {
  if (selectedTags.length === 0) return insights;

  return insights.filter((insight) =>
    selectedTags.some((tag) => insight.tags.includes(tag))
  );
}

/**
 * Hook para extrair todas as tags únicas dos insights
 */
export function useInsightsTags(insights: any[]): string[] {
  const tagsSet = new Set<string>();

  insights.forEach((insight) => {
    insight.tags.forEach((tag: string) => tagsSet.add(tag));
  });

  return Array.from(tagsSet).sort();
}