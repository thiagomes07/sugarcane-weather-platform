/**
 * API client para cotação de cana-de-açúcar
 * Endpoints:
 * - GET /quotation
 * - GET /api/v1/quotation
 */

import { apiClient } from "./client";
import { retryWithBackoff } from "@/lib/utils/retry";
import type { QuotationData } from "@/types/quotation";

/**
 * Busca dados de cotação de cana-de-açúcar
 *
 * Endpoints tentados:
 * 1. /quotation (sem prefixo)
 * 2. /api/v1/quotation (com prefixo)
 *
 * Cache backend: 1 hora
 * Rate limit: Sem limite específico
 */
export async function getSugarcaneQuotation(): Promise<QuotationData[]> {
  return retryWithBackoff(
    async () => {
      try {
        console.log("[API] Buscando cotação em /quotation");

        // Tenta endpoint sem prefixo
        try {
          const response = await apiClient.get<QuotationData[]>("/quotation");
          console.log("[API] ✓ Cotação obtida de /quotation");
          return response.data;
        } catch (error) {
          // Se 404, tenta com prefixo
          if (
            typeof error === "object" &&
            error !== null &&
            "response" in error &&
            (error as any).response?.status === 404
          ) {
            console.log(
              "[API] /quotation retornou 404, tentando /api/v1/quotation"
            );
            const response = await apiClient.get<QuotationData[]>(
              "/api/v1/quotation"
            );
            console.log("[API] ✓ Cotação obtida de /api/v1/quotation");
            return response.data;
          }
          throw error;
        }
      } catch (error) {
        console.error("[API] Erro ao buscar cotação:", error);
        throw error;
      }
    },
    {
      maxRetries: 2,
      initialDelay: 1000,
      onRetry: (attempt, delay) => {
        console.log(
          `[API] Tentativa ${attempt} de busca de cotação (aguardando ${delay}ms)`
        );
      },
    }
  );
}

/**
 * Formata valor monetário em R$/ton
 */
export function formatPrice(value: number | null | undefined): string {
  if (!value) return "N/A";
  return `R$ ${value.toFixed(2)}`;
}

/**
 * Calcula variação percentual entre dois valores
 */
export function calculateVariation(
  oldValue: number | null | undefined,
  newValue: number | null | undefined
): number | null {
  if (!oldValue || !newValue || oldValue === 0) return null;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Formata variação percentual para display
 */
export function formatVariation(variation: number | null): string {
  if (variation === null) return "N/A";
  const sign = variation >= 0 ? "+" : "";
  return `${sign}${variation.toFixed(1)}%`;
}

/**
 * Formata data "03/11/2025" para display amigável
 */
export function formatQuotationDate(dateStr: string): string {
  try {
    const [day, month, year] = dateStr.split("/");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
