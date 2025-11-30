/**
 * ============================================
 * COMPONENTE: BOTÕES DE EXPORTAÇÃO
 * ============================================
 * 
 * Arquivo: src/components/shared/ExportButtons.tsx
 * 
 * Componente com botões para exportar dados em PDF e CSV
 * Integra-se facilmente na página principal
 */

'use client';

import { useState } from 'react';
import { Download, FileText, File, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

interface ExportButtonsProps {
  weatherData?: WeatherResponse;
  insights?: Insight[];
  news?: ProcessedNewsArticle[];
  quotation?: QuotationData[];
  location?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'floating';
}

export function ExportButtons({
  weatherData,
  insights,
  news,
  quotation,
  location,
  className,
  variant = 'default',
}: ExportButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hasData = weatherData || insights?.length || news?.length || quotation?.length;

  if (!hasData) {
    return null;
  }

  // ============================================
  // HANDLERS DE EXPORTAÇÃO
  // ============================================

  const handleExportCSV = async (type: 'clima' | 'insights' | 'noticias' | 'cotacao' | 'completo') => {
    setIsLoading(true);
    try {
      switch (type) {
        case 'clima':
          if (weatherData) {
            exportWeatherToCSV(weatherData, {
              filename: generateFilename('clima', 'csv'),
              includeTimestamp: true,
            });
            toast.success('Dados climáticos exportados com sucesso!');
          }
          break;
        case 'insights':
          if (insights?.length) {
            exportInsightsToCSV(insights, {
              filename: generateFilename('insights', 'csv'),
              includeTimestamp: true,
            });
            toast.success('Insights exportados com sucesso!');
          }
          break;
        case 'noticias':
          if (news?.length) {
            exportNewsToCSV(news, {
              filename: generateFilename('noticias', 'csv'),
              includeTimestamp: true,
            });
            toast.success('Notícias exportadas com sucesso!');
          }
          break;
        case 'cotacao':
          if (quotation?.length) {
            exportQuotationToCSV(quotation, {
              filename: generateFilename('cotacao-cana', 'csv'),
              includeTimestamp: true,
            });
            toast.success('Cotação exportada com sucesso!');
          }
          break;
        case 'completo':
          exportAllToCSV(
            { weatherData, insights, news, quotation, location },
            {
              filename: generateFilename('relatorio-completo', 'csv'),
              includeTimestamp: true,
            }
          );
          toast.success('Relatório completo exportado em CSV!');
          break;
      }
      setIsOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao exportar dados'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async (type: 'visual' | 'dados') => {
    setIsLoading(true);
    try {
      if (type === 'visual') {
        await exportPageToPDF('main', {
          filename: generateFilename('relatorio-visual', 'pdf'),
          includeTimestamp: true,
        });
        toast.success('Página exportada em PDF com sucesso!');
      } else {
        // PDF de dados estruturados (futuro)
        toast.info('Funcionalidade em desenvolvimento');
      }
      setIsOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao exportar para PDF'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDERIZAÇÃO
  // ============================================

  if (variant === 'compact') {
    return (
      <div className={cn('flex gap-2', className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportCSV('completo')}
          disabled={isLoading}
          className="gap-2"
          title="Exportar todos os dados em CSV"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <File className="h-4 w-4" />
          )}
          CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportPDF('visual')}
          disabled={isLoading}
          className="gap-2"
          title="Exportar página em PDF"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          PDF
        </Button>
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={cn('fixed bottom-6 right-6 z-40', className)}>
        <div className="relative">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            disabled={isLoading}
            size="lg"
            className="gap-2 rounded-full shadow-lg hover:shadow-xl transition-all"
            title="Exportar dados"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            Exportar
          </Button>

          {isOpen && (
            <div className="absolute bottom-16 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[280px]">
              <ExportMenu
                onSelectCSV={handleExportCSV}
                onSelectPDF={handleExportPDF}
                hasWeather={!!weatherData}
                hasInsights={!!insights?.length}
                hasNews={!!news?.length}
                hasQuotation={!!quotation?.length}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant (inline)
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative group">
        {/* Botão CSV */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportCSV('completo')}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <File className="h-4 w-4" />
          )}
          Exportar CSV
        </Button>

        {/* Menu dropdown (hidden) */}
        <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[220px]">
          <ExportMenu
            onSelectCSV={handleExportCSV}
            onSelectPDF={handleExportPDF}
            hasWeather={!!weatherData}
            hasInsights={!!insights?.length}
            hasNews={!!news?.length}
            hasQuotation={!!quotation?.length}
            isLoading={isLoading}
            compact
          />
        </div>
      </div>

      {/* Botão PDF */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExportPDF('visual')}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Exportar PDF
      </Button>
    </div>
  );
}

// ============================================
// SUBMENU DE EXPORTAÇÃO
// ============================================

interface ExportMenuProps {
  onSelectCSV: (type: 'clima' | 'insights' | 'noticias' | 'cotacao' | 'completo') => void;
  onSelectPDF: (type: 'visual' | 'dados') => void;
  hasWeather: boolean;
  hasInsights: boolean;
  hasNews: boolean;
  hasQuotation: boolean;
  isLoading: boolean;
  compact?: boolean;
}

function ExportMenu({
  onSelectCSV,
  onSelectPDF,
  hasWeather,
  hasInsights,
  hasNews,
  hasQuotation,
  isLoading,
  compact = false,
}: ExportMenuProps) {
  const itemClass = 'block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="space-y-1">
      <div>
        <p className="text-xs font-semibold text-gray-600 px-3 py-2">Exportar em CSV:</p>
        {hasWeather && (
          <button
            onClick={() => onSelectCSV('clima')}
            disabled={isLoading}
            className={itemClass}
            title="Exportar dados climáticos e análise para cana"
          >
            🌡️ Dados Climáticos
          </button>
        )}
        {hasInsights && (
          <button
            onClick={() => onSelectCSV('insights')}
            disabled={isLoading}
            className={itemClass}
            title="Exportar insights da comunidade"
          >
            💬 Insights
          </button>
        )}
        {hasNews && (
          <button
            onClick={() => onSelectCSV('noticias')}
            disabled={isLoading}
            className={itemClass}
            title="Exportar notícias"
          >
            📰 Notícias
          </button>
        )}
        {hasQuotation && (
          <button
            onClick={() => onSelectCSV('cotacao')}
            disabled={isLoading}
            className={itemClass}
            title="Exportar cotação da cana"
          >
            💹 Cotação
          </button>
        )}
        <button
          onClick={() => onSelectCSV('completo')}
          disabled={isLoading}
          className={cn(itemClass, 'bg-primary/5 font-medium text-primary')}
          title="Exportar todos os dados em um arquivo CSV único"
        >
          ✓ Relatório Completo
        </button>
      </div>

      <div className="border-t border-gray-200 pt-1">
        <p className="text-xs font-semibold text-gray-600 px-3 py-2">Exportar em PDF:</p>
        <button
          onClick={() => onSelectPDF('visual')}
          disabled={isLoading}
          className={cn(itemClass, 'bg-primary/5 font-medium text-primary')}
          title="Exportar página visual como PDF"
        >
          📄 Página Visual
        </button>
      </div>
    </div>
  );
}