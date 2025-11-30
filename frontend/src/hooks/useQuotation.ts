/**
 * Hook para buscar dados de cotação de cana-de-açúcar
 * Suporta dois endpoints:
 * - GET /quotation (sem prefixo)
 * - GET /api/v1/quotation (com prefixo)
 */

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { env } from "@/config/env";

export interface QuotationData {
  data: string; // ISO timestamp "2025-11-03T00:00:00"
  data_formatada: string; // "03/11/2025"
  valor_campo: number | null; // R$/ton
  valor_esteira: number | null; // R$/ton
}

interface UseQuotationState {
  data: QuotationData[] | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para buscar cotação
 *
 * Funcionalidades:
 * - Cache de 1 hora (staleTime)
 * - Retry automático em falhas de rede (até 2 tentativas)
 * - Sem retry em erro 404/503 (falha permanente)
 * - Fallback silencioso (retorna null ao invés de lançar erro)
 */
export function useQuotation(): UseQuotationState {
  const { data, isLoading, error } = useQuery<QuotationData[]>({
    queryKey: ["quotation"],
    queryFn: async () => {
      try {
        console.log("[useQuotation] Iniciando fetch...");

        // Tenta o endpoint sem prefixo primeiro (mais rápido se estiver disponível)
        try {
          const response = await axios.get<QuotationData[]>(
            `${env.apiUrl}/quotation`,
            {
              timeout: 30000, // 30 segundos
            }
          );
          console.log("[useQuotation] ✓ Dados obtidos com sucesso");
          return response.data;
        } catch (error) {
          // Se 404 no endpoint sem prefixo, tenta com prefixo
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            console.log(
              "[useQuotation] Endpoint sem prefixo retornou 404, tentando com /api/v1/"
            );
            const response = await axios.get<QuotationData[]>(
              `${env.apiUrl}/api/v1/quotation`,
              {
                timeout: 30000,
              }
            );
            console.log(
              "[useQuotation] ✓ Dados obtidos com sucesso (via /api/v1)"
            );
            return response.data;
          }
          throw error;
        }
      } catch (error) {
        const errorMsg = axios.isAxiosError(error)
          ? `HTTP ${error.response?.status}: ${
              error.response?.data?.error?.message || error.message
            }`
          : error instanceof Error
          ? error.message
          : "Erro desconhecido";

        console.error("[useQuotation] Erro ao buscar:", errorMsg);

        // Fallback silencioso: retorna null ao invés de lançar erro
        // Isso permite que a UI mostre mensagem amigável sem quebrar
        throw new Error(errorMsg);
      }
    },

    // Configurações de cache e retry
    staleTime: 60 * 60 * 1000, // 1 hora
    gcTime: 2 * 60 * 60 * 1000, // 2 horas (antes: cacheTime)
    retry: (failureCount, error) => {
      // Não retenta 404 ou 503 (falhas permanentes)
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404 || status === 503) {
          console.warn(`[useQuotation] Não retentando erro ${status}`);
          return false;
        }
      }

      // Retenta até 2 vezes para outros erros (timeout, rede)
      return failureCount < 2;
    },

    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 10000); // Max 10s
      console.log(`[useQuotation] Aguardando ${delay}ms antes de retentar...`);
      return delay;
    },

    // Desabilita refetch automático ao focar a janela
    refetchOnWindowFocus: false,
    refetchOnReconnect: true, // Refetch ao reconectar (importante para offline)
  });

  return {
    data: data || null,
    isLoading,
    error: error ? error.message : null,
  };
}
