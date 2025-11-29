/**
 * API de Insights - Fórum colaborativo de produtores
 * Rate limit: POST 10 req/min (burst 5), GET 1 req/s (burst 20)
 */

import { get, post } from './client';
import { retryWithBackoff } from '@/lib/utils/retry';
import type {
  Insight,
  CreateInsightRequest,
  CreateInsightResponse,
  ListInsightsQuery,
  ListInsightsResponse,
} from '@/types/insight';

// ============================================
// ENDPOINTS
// ============================================

/**
 * Lista insights de uma localização
 * 
 * Rate limit: 1 req/s, burst 20
 * Cache recomendado: 5 minutos no TanStack Query
 * 
 * @throws RateLimitError - Se atingir rate limit (429)
 */
export async function getInsights(
  query: ListInsightsQuery = {}
): Promise<ListInsightsResponse> {
  const {
    location,
    tags,
    limit = 20,
    offset = 0,
    sort = 'recent',
  } = query;
  
  // Constrói query params
  const params = new URLSearchParams();
  if (location) params.append('location', location);
  if (tags && tags.length > 0) {
    tags.forEach((tag) => params.append('tags', tag));
  }
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());
  params.append('sort', sort);
  
  return retryWithBackoff(
    () => get<ListInsightsResponse>(`/api/v1/insights?${params}`),
    {
      maxRetries: 2,
      initialDelay: 1000,
    }
  );
}

/**
 * Cria novo insight
 * 
 * Rate limit: 10 req/min, burst 5 (mais restritivo!)
 * Validação: Zod no frontend + backend
 * 
 * @throws RateLimitError - Se atingir rate limit (429)
 * @throws ValidationError - Se dados inválidos (400)
 */
export async function createInsight(
  data: CreateInsightRequest
): Promise<CreateInsightResponse> {
  // Validação básica
  validateInsightData(data);
  
  // NÃO usa retry aqui - se falhar na criação, melhor não tentar novamente
  // (evita duplicatas)
  return post<CreateInsightResponse, CreateInsightRequest>(
    '/api/v1/insights',
    data
  );
}

/**
 * Busca insight por ID
 */
export async function getInsightById(id: string): Promise<Insight> {
  if (!id || id.trim().length === 0) {
    throw new Error('ID do insight é obrigatório.');
  }
  
  return retryWithBackoff(
    () => get<Insight>(`/api/v1/insights/${id}`),
    { maxRetries: 2 }
  );
}

/**
 * Atualiza insight (futuro - requer autenticação)
 */
export async function updateInsight(
  id: string,
  data: Partial<CreateInsightRequest>
): Promise<Insight> {
  if (!id || id.trim().length === 0) {
    throw new Error('ID do insight é obrigatório.');
  }
  
  return post<Insight, Partial<CreateInsightRequest>>(
    `/api/v1/insights/${id}`,
    data
  );
}

/**
 * Deleta insight (futuro - requer autenticação)
 */
export async function deleteInsight(id: string): Promise<void> {
  if (!id || id.trim().length === 0) {
    throw new Error('ID do insight é obrigatório.');
  }
  
  await post(`/api/v1/insights/${id}/delete`);
}

// ============================================
// VALIDAÇÃO
// ============================================

function validateInsightData(data: CreateInsightRequest): void {
  // Autor
  if (!data.author?.name || data.author.name.trim().length < 2) {
    throw new Error('Nome do autor deve ter pelo menos 2 caracteres.');
  }
  if (data.author.name.length > 100) {
    throw new Error('Nome do autor não pode ter mais de 100 caracteres.');
  }
  
  // Localização
  if (!data.location?.name || data.location.name.trim().length === 0) {
    throw new Error('Nome da localização é obrigatório.');
  }
  if (
    typeof data.location.lat !== 'number' ||
    typeof data.location.lon !== 'number'
  ) {
    throw new Error('Coordenadas da localização são obrigatórias.');
  }
  
  // Conteúdo
  if (!data.content || data.content.trim().length < 10) {
    throw new Error('Conteúdo deve ter pelo menos 10 caracteres.');
  }
  if (data.content.length > 1000) {
    throw new Error('Conteúdo não pode ter mais de 1000 caracteres.');
  }
  
  // Tags
  if (data.tags && data.tags.length > 5) {
    throw new Error('Máximo de 5 tags permitidas.');
  }
  if (data.tags) {
    for (const tag of data.tags) {
      if (tag.length < 2 || tag.length > 30) {
        throw new Error('Cada tag deve ter entre 2 e 30 caracteres.');
      }
    }
  }
  
  // Weather snapshot
  if (!data.weather_snapshot) {
    throw new Error('Dados climáticos são obrigatórios.');
  }
  if (
    typeof data.weather_snapshot.temperature !== 'number' ||
    typeof data.weather_snapshot.humidity !== 'number'
  ) {
    throw new Error('Temperatura e umidade são obrigatórias.');
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Extrai tags únicas de uma lista de insights
 */
export function extractUniqueTags(insights: Insight[]): string[] {
  const tagsSet = new Set<string>();
  
  insights.forEach((insight) => {
    insight.tags.forEach((tag) => tagsSet.add(tag));
  });
  
  return Array.from(tagsSet).sort();
}

/**
 * Filtra insights por tags (client-side)
 */
export function filterInsightsByTags(
  insights: Insight[],
  selectedTags: string[]
): Insight[] {
  if (selectedTags.length === 0) return insights;
  
  return insights.filter((insight) =>
    selectedTags.some((tag) => insight.tags.includes(tag))
  );
}

/**
 * Ordena insights (client-side)
 */
export function sortInsights(
  insights: Insight[],
  sortBy: 'recent' | 'popular'
): Insight[] {
  const sorted = [...insights];
  
  if (sortBy === 'recent') {
    sorted.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } else if (sortBy === 'popular') {
    // Futuro: ordenar por likes
    sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }
  
  return sorted;
}

/**
 * Formata conteúdo do insight (sanitização básica)
 */
export function sanitizeContent(content: string): string {
  return content
    .trim()
    .replace(/\s+/g, ' ') // Remove espaços múltiplos
    .replace(/<[^>]*>/g, ''); // Remove HTML (básico)
}

/**
 * Valida tag
 */
export function isValidTag(tag: string): boolean {
  return (
    tag.length >= 2 &&
    tag.length <= 30 &&
    /^[a-zA-Z0-9\u00C0-\u017F\s-]+$/.test(tag) // Letras, números, acentos, hífens
  );
}

/**
 * Normaliza tag (lowercase, sem espaços extras)
 */
export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
}