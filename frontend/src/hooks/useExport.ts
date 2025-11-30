/**
 * ============================================
 * HOOK: useExport
 * ============================================
 * 
 * Arquivo: src/hooks/useExport.ts
 * 
 * Hook para gerenciar exportação de dados
 * Encapsula lógica e reduz boilerplate
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  exportWeatherToCSV,
  exportInsightsToCSV,
  exportNewsToCSV,
  exportQuotationToCSV,
  exportAllToCSV,
  exportPageToPDF,
  generateFilename,
  type ExportData,
} from '@/lib/utils/export';
import type { WeatherResponse } from '@/types/weather';
import type { Insight } from '@/types/insight';
import type { ProcessedNewsArticle } from '@/types/news';
import type { QuotationData } from '@/types/quotation';

interface UseExportOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function useExport(options: UseExportOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback(
    (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Erro ao exportar dados';
      setError(message);
      if (options.onError) {
        options.onError(message);
      } else {
        toast.error(message);
      }
    },
    [options]
  );

  const handleSuccess = useCallback(
    (message: string) => {
      setError(null);
      if (options.onSuccess) {
        options.onSuccess(message);
      } else {
        toast.success(message);
      }
    },
    [options]
  );

  // ============================================
  // CSV
  // ============================================

  const exportWeatherAsCSV = useCallback(
    async (weatherData: WeatherResponse, filename?: string) => {
      setIsLoading(true);
      try {
        exportWeatherToCSV(weatherData, {
          filename: filename || generateFilename('clima', 'csv'),
          includeTimestamp: true,
        });
        handleSuccess('Dados climáticos exportados com sucesso!');
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, handleSuccess]
  );

  const exportInsightsAsCSV = useCallback(
    async (insights: Insight[], filename?: string) => {
      setIsLoading(true);
      try {
        exportInsightsToCSV(insights, {
          filename: filename || generateFilename('insights', 'csv'),
          includeTimestamp: true,
        });
        handleSuccess('Insights exportados com sucesso!');
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, handleSuccess]
  );

  const exportNewsAsCSV = useCallback(
    async (news: ProcessedNewsArticle[], filename?: string) => {
      setIsLoading(true);
      try {
        exportNewsToCSV(news, {
          filename: filename || generateFilename('noticias', 'csv'),
          includeTimestamp: true,
        });
        handleSuccess('Notícias exportadas com sucesso!');
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, handleSuccess]
  );

  const exportQuotationAsCSV = useCallback(
    async (quotation: QuotationData[], filename?: string) => {
      setIsLoading(true);
      try {
        exportQuotationToCSV(quotation, {
          filename: filename || generateFilename('cotacao-cana', 'csv'),
          includeTimestamp: true,
        });
        handleSuccess('Cotação exportada com sucesso!');
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, handleSuccess]
  );

  const exportAllAsCSV = useCallback(
    async (
      data: ExportData,
      filename?: string
    ) => {
      setIsLoading(true);
      try {
        exportAllToCSV(data, {
          filename: filename || generateFilename('relatorio-completo', 'csv'),
          includeTimestamp: true,
        });
        handleSuccess('Relatório completo exportado em CSV!');
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, handleSuccess]
  );

  // ============================================
  // PDF
  // ============================================

  const exportPageAsPDF = useCallback(
    async (elementId?: string, filename?: string) => {
      setIsLoading(true);
      try {
        await exportPageToPDF(elementId || 'main', {
          filename: filename || generateFilename('relatorio', 'pdf'),
          includeTimestamp: true,
        });
        handleSuccess('Página exportada em PDF com sucesso!');
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, handleSuccess]
  );

  return {
    isLoading,
    error,
    exportWeatherAsCSV,
    exportInsightsAsCSV,
    exportNewsAsCSV,
    exportQuotationAsCSV,
    exportAllAsCSV,
    exportPageAsPDF,
  };
}