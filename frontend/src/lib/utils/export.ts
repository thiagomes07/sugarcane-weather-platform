/**
 * ============================================
 * UTILITÁRIOS DE EXPORTAÇÃO (PDF e CSV)
 * ============================================
 * 
 * Arquivo: src/lib/utils/export.ts
 * 
 * Funções para exportar dados em PDF e CSV
 * Usa jsPDF + html2canvas para PDF
 * Usa padrão CSV nativo para CSV
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { WeatherResponse } from '@/types/weather';
import type { Insight } from '@/types/insight';
import type { ProcessedNewsArticle } from '@/types/news';
import type { QuotationData } from '@/types/quotation';

// ============================================
// INTERFACES
// ============================================

export interface ExportOptions {
  filename?: string;
  includeMetadata?: boolean;
  includeTimestamp?: boolean;
}

export interface ExportData {
  weatherData?: WeatherResponse;
  insights?: Insight[];
  news?: ProcessedNewsArticle[];
  quotation?: QuotationData[];
  location?: string;
}

// ============================================
// EXPORTAÇÃO CSV
// ============================================

/**
 * Exporta dados climáticos em CSV
 */
export function exportWeatherToCSV(
  weather: WeatherResponse,
  options: ExportOptions = {}
): void {
  const { filename = 'clima.csv', includeTimestamp = true } = options;

  const data = [];
  
  // Header
  data.push(['=== DADOS CLIMÁTICOS ===']);
  if (includeTimestamp) {
    data.push([`Exportado em: ${new Date().toLocaleString('pt-BR')}`]);
  }
  data.push([`Localização: ${weather.location.name}, ${weather.location.state || ''} ${weather.location.country}`]);
  data.push([]);

  // Clima atual
  data.push(['CLIMA ATUAL']);
  data.push(['Temperatura (°C)', weather.current.main.temp]);
  data.push(['Sensação Térmica (°C)', weather.current.main.feels_like]);
  data.push(['Temperatura Mínima (°C)', weather.current.main.temp_min]);
  data.push(['Temperatura Máxima (°C)', weather.current.main.temp_max]);
  data.push(['Umidade (%)', weather.current.main.humidity]);
  data.push(['Pressão (hPa)', weather.current.main.pressure]);
  data.push(['Velocidade do Vento (m/s)', weather.current.wind.speed]);
  data.push(['Direção do Vento (°)', weather.current.wind.deg]);
  data.push(['Visibilidade (m)', weather.current.visibility]);
  data.push(['Cobertura de Nuvens (%)', weather.current.clouds.all]);
  data.push(['Condição', weather.current.weather[0].main]);
  data.push(['Descrição', weather.current.weather[0].description]);
  if (weather.current.rain?.['1h']) {
    data.push(['Chuva na última hora (mm)', weather.current.rain['1h']]);
  }
  data.push([]);

  // Previsão
  data.push(['PREVISÃO (5 DIAS)']);
  data.push(['Data', 'Temp. Mín', 'Temp. Máx', 'Condição', 'Chuva (mm)', 'Prob. Chuva']);
  weather.forecast.list.slice(0, 40).forEach((item, index) => {
    if (index % 8 === 0) { // a cada 24h (8 períodos de 3h)
      const date = new Date(item.dt * 1000);
      data.push([
        date.toLocaleDateString('pt-BR'),
        item.main.temp_min.toFixed(1),
        item.main.temp_max.toFixed(1),
        item.weather[0].main,
        (item.rain?.['3h'] || 0).toFixed(1),
        (item.pop * 100).toFixed(0) + '%',
      ]);
    }
  });
  data.push([]);

  // Análise para cana-de-açúcar
  data.push(['ANÁLISE PARA CANA-DE-AÇÚCAR']);
  data.push(['Status Geral', weather.sugarcane_analysis.overallStatus]);
  data.push(['Mensagem', weather.sugarcane_analysis.statusMessage]);
  data.push(['Fase de Cultivo', weather.sugarcane_analysis.phase]);
  data.push([]);
  data.push(['DETALHES DA ANÁLISE']);
  data.push(['Fator', 'Status', 'Valor', 'Mensagem']);
  data.push([
    'Temperatura',
    weather.sugarcane_analysis.details.temperature.status,
    weather.sugarcane_analysis.details.temperature.value + '°C',
    weather.sugarcane_analysis.details.temperature.message,
  ]);
  data.push([
    'Umidade',
    weather.sugarcane_analysis.details.humidity.status,
    weather.sugarcane_analysis.details.humidity.value + '%',
    weather.sugarcane_analysis.details.humidity.message,
  ]);
  data.push([
    'Precipitação',
    weather.sugarcane_analysis.details.rainfall.status,
    weather.sugarcane_analysis.details.rainfall.value + 'mm',
    weather.sugarcane_analysis.details.rainfall.message,
  ]);
  data.push([
    'Vento',
    weather.sugarcane_analysis.details.wind.status,
    weather.sugarcane_analysis.details.wind.value + 'm/s',
    weather.sugarcane_analysis.details.wind.message,
  ]);
  data.push([]);
  data.push(['RECOMENDAÇÕES']);
  weather.sugarcane_analysis.recommendations.forEach((rec) => {
    data.push([rec]);
  });

  downloadCSV(data, filename);
}

/**
 * Exporta insights em CSV
 */
export function exportInsightsToCSV(
  insights: Insight[],
  options: ExportOptions = {}
): void {
  const { filename = 'insights.csv', includeTimestamp = true } = options;

  const data = [];

  // Header
  data.push(['=== INSIGHTS DA COMUNIDADE ===']);
  if (includeTimestamp) {
    data.push([`Exportado em: ${new Date().toLocaleString('pt-BR')}`]);
  }
  data.push([`Total de Insights: ${insights.length}`]);
  data.push([]);

  // Dados
  data.push([
    'Autor',
    'Função',
    'Localização',
    'Data',
    'Conteúdo',
    'Tags',
    'Temperatura',
    'Umidade',
    'Condição Climática',
  ]);

  insights.forEach((insight) => {
    data.push([
      insight.author.name,
      insight.author.role || '-',
      `${insight.location.name}, ${insight.location.state || ''} ${insight.location.country}`,
      new Date(insight.created_at).toLocaleString('pt-BR'),
      insight.content,
      insight.tags.join('; '),
      insight.weather_snapshot.temperature + '°C',
      insight.weather_snapshot.humidity + '%',
      insight.weather_snapshot.condition,
    ]);
  });

  downloadCSV(data, filename);
}

/**
 * Exporta notícias em CSV
 */
export function exportNewsToCSV(
  news: ProcessedNewsArticle[],
  options: ExportOptions = {}
): void {
  const { filename = 'noticias.csv', includeTimestamp = true } = options;

  const data = [];

  data.push(['=== NOTÍCIAS DO AGRONEGÓCIO ===']);
  if (includeTimestamp) {
    data.push([`Exportado em: ${new Date().toLocaleString('pt-BR')}`]);
  }
  data.push([`Total de Notícias: ${news.length}`]);
  data.push([]);

  data.push(['Fonte', 'Data', 'Título', 'Descrição', 'URL']);

  news.forEach((article) => {
    data.push([
      article.source,
      article.publishedAt.toLocaleString('pt-BR'),
      article.title,
      article.description,
      article.url,
    ]);
  });

  downloadCSV(data, filename);
}

/**
 * Exporta cotação em CSV
 */
export function exportQuotationToCSV(
  quotation: QuotationData[],
  options: ExportOptions = {}
): void {
  const { filename = 'cotacao-cana.csv', includeTimestamp = true } = options;

  const data = [];

  data.push(['=== COTAÇÃO DE CANA-DE-AÇÚCAR ===']);
  if (includeTimestamp) {
    data.push([`Exportado em: ${new Date().toLocaleString('pt-BR')}`]);
  }
  data.push([]);

  data.push(['Data', 'Campo (R$/ton)', 'Esteira (R$/ton)', 'Diferença (R$/ton)']);

  quotation.forEach((item) => {
    const diff =
      item.valor_campo && item.valor_esteira
        ? (item.valor_esteira - item.valor_campo).toFixed(2)
        : '-';

    data.push([
      item.data_formatada,
      item.valor_campo ? item.valor_campo.toFixed(2) : '-',
      item.valor_esteira ? item.valor_esteira.toFixed(2) : '-',
      diff,
    ]);
  });

  downloadCSV(data, filename);
}

/**
 * Exporta todos os dados em CSV consolidado
 */
export function exportAllToCSV(
  exportData: ExportData,
  options: ExportOptions = {}
): void {
  const { filename = 'relatorio-completo.csv', includeTimestamp = true } = options;

  const data = [];

  // Cabeçalho geral
  data.push(['=== RELATÓRIO COMPLETO - CLIMA CANA ===']);
  if (includeTimestamp) {
    data.push([`Exportado em: ${new Date().toLocaleString('pt-BR')}`]);
  }
  if (exportData.location) {
    data.push([`Localização: ${exportData.location}`]);
  }
  data.push([]);

  // Seção 1: Clima
  if (exportData.weatherData) {
    data.push(['=== DADOS CLIMÁTICOS ===']);
    data.push(['Temperatura (°C)', exportData.weatherData.current.main.temp]);
    data.push(['Umidade (%)', exportData.weatherData.current.main.humidity]);
    data.push(['Pressão (hPa)', exportData.weatherData.current.main.pressure]);
    data.push(['Vento (m/s)', exportData.weatherData.current.wind.speed]);
    data.push(['Condição', exportData.weatherData.current.weather[0].main]);
    data.push(['Status Cana', exportData.weatherData.sugarcane_analysis.overallStatus]);
    data.push([]);
  }

  // Seção 2: Insights
  if (exportData.insights && exportData.insights.length > 0) {
    data.push(['=== INSIGHTS ===']);
    data.push([`Total: ${exportData.insights.length}`]);
    data.push([]);
    data.push(['Autor', 'Data', 'Resumo do Conteúdo']);
    exportData.insights.slice(0, 10).forEach((insight) => {
      const resumo = insight.content.substring(0, 100) + (insight.content.length > 100 ? '...' : '');
      data.push([
        insight.author.name,
        new Date(insight.created_at).toLocaleDateString('pt-BR'),
        resumo,
      ]);
    });
    if (exportData.insights.length > 10) {
      data.push([`... e mais ${exportData.insights.length - 10} insights`]);
    }
    data.push([]);
  }

  // Seção 3: Notícias
  if (exportData.news && exportData.news.length > 0) {
    data.push(['=== NOTÍCIAS ===']);
    data.push([`Total: ${exportData.news.length}`]);
    data.push([]);
    data.push(['Fonte', 'Título']);
    exportData.news.slice(0, 10).forEach((article) => {
      data.push([article.source, article.title]);
    });
    if (exportData.news.length > 10) {
      data.push([`... e mais ${exportData.news.length - 10} notícias`]);
    }
    data.push([]);
  }

  // Seção 4: Cotação
  if (exportData.quotation && exportData.quotation.length > 0) {
    data.push(['=== COTAÇÃO RECENTE ===']);
    const lastQuote = exportData.quotation[0];
    data.push(['Data', lastQuote.data_formatada]);
    data.push(['Campo (R$/ton)', lastQuote.valor_campo?.toFixed(2) || '-']);
    data.push(['Esteira (R$/ton)', lastQuote.valor_esteira?.toFixed(2) || '-']);
  }

  downloadCSV(data, filename);
}

// ============================================
// EXPORTAÇÃO PDF
// ============================================

/**
 * Exporta a página inteira como PDF (captura visual)
 * Corrigido para suportar cores modernas do Tailwind v4
 */
export async function exportPageToPDF(
  elementId: string = 'root',
  options: ExportOptions = {}
): Promise<void> {
  const { filename = 'relatorio.pdf', includeTimestamp = true } = options;

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Elemento com ID "${elementId}" não encontrado`);
    }

    // Clone o elemento para manipular estilos sem afetar a página
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.position = 'fixed';
    clonedElement.style.top = '0';
    clonedElement.style.left = '0';
    clonedElement.style.width = element.offsetWidth + 'px';
    clonedElement.style.height = element.offsetHeight + 'px';
    clonedElement.style.backgroundColor = '#ffffff';
    
    // Adiciona ao DOM temporariamente
    document.body.appendChild(clonedElement);

    // Aguarda um pouco para garantir que os estilos foram aplicados
    await new Promise(resolve => setTimeout(resolve, 100));

    // Captura a página com configurações otimizadas
    const canvas = await html2canvas(clonedElement, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      // Configurações importantes para compatibilidade
      foreignObjectRendering: true,
      imageTimeout: 0,
      ignoreElements: (element: Element) => {
        // Ignora scripts e styles
        if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
          return true;
        }
        return false;
      },
    });

    // Remove o clone
    document.body.removeChild(clonedElement);

    const imgData = canvas.toDataURL('image/png');
    
    // Cria PDF com tamanho A4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 10; // Margem de 5mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Adiciona imagem ao PDF (com quebra de página se necessário)
    pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, imgHeight);
    heightLeft -= pageHeight - 10;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 5, position + 5, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Adiciona metadata
    if (includeTimestamp) {
      pdf.setProperties({
        title: 'Clima Cana - Relatório',
        author: 'Clima Cana',
        subject: 'Relatório Climático e Agrícola',
        creator: 'Clima Cana Platform',
      });
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error(`Falha ao exportar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Exporta dados estruturados em PDF (tabelas e texto)
 * Melhor para dados tabulares
 */
export async function exportDataToPDF(
  data: {
    title: string;
    sections: Array<{
      heading: string;
      rows: string[][];
    }>;
  },
  options: ExportOptions = {}
): Promise<void> {
  const { filename = 'relatorio-dados.pdf', includeTimestamp = true } = options;

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let yPosition = 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;

    // Título
    pdf.setFontSize(16);
    pdf.text(data.title, margin, yPosition);
    yPosition += 12;

    // Timestamp
    if (includeTimestamp) {
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text(`Exportado em: ${new Date().toLocaleString('pt-BR')}`, margin, yPosition);
      yPosition += 8;
      pdf.setTextColor(0);
    }

    yPosition += 5;

    // Seções
    data.sections.forEach((section) => {
      // Verifica se precisa de nova página
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 15;
      }

      // Heading da seção
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text(section.heading, margin, yPosition);
      yPosition += 10;

      // Tabela
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');

      section.rows.forEach((row) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 15;
        }

        // Quebra de linhas longas
        const lines = pdf.splitTextToSize(row.join(' | '), contentWidth - 5);
        lines.forEach((line: string) => {
          pdf.text(line, margin + 5, yPosition);
          yPosition += 5;
        });
      });

      yPosition += 8;
    });

    pdf.save(filename);
  } catch (error) {
    console.error('Erro ao gerar PDF de dados:', error);
    throw new Error(`Falha ao exportar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Baixa arquivo CSV
 */
function downloadCSV(data: (string | number)[][], filename: string): void {
  try {
    // Converte para CSV (com escape para valores com vírgula)
    const csv = data
      .map((row) =>
        row
          .map((cell) => {
            const stringCell = String(cell);
            // Se contém vírgula, aspas ou quebra de linha, envolve em aspas
            if (stringCell.includes(',') || stringCell.includes('"') || stringCell.includes('\n')) {
              return `"${stringCell.replace(/"/g, '""')}"`;
            }
            return stringCell;
          })
          .join(',')
      )
      .join('\n');

    // Cria blob
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
    
    // Baixa
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Erro ao baixar CSV:', error);
    throw new Error(`Falha ao exportar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Helper para gerar nome de arquivo com timestamp
 */
export function generateFilename(prefix: string, format: 'csv' | 'pdf'): string {
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${prefix}-${timestamp}.${format}`;
}