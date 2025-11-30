/**
 * Utilitários de Retry com Exponential Backoff
 * Implementa estratégia de recuperação automática de falhas de rede
 */

import { isNetworkError } from "@/lib/constants/errors";

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number; // ms
  maxDelay?: number; // ms
  backoffFactor?: number;
  shouldRetry?: (error: unknown, attemptNumber: number) => boolean;
  onRetry?: (error: unknown, attemptNumber: number, delayMs: number) => void;
}

/**
 * Estratégia de retry com exponential backoff
 * Padrão: 3 tentativas com delays de 1s, 2s, 4s
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Se não deve retentar, lança o erro imediatamente
      if (!shouldRetry(error, attempt)) {
        throw error;
      }

      // Se chegou no máximo de tentativas, lança o erro
      if (attempt === maxRetries) {
        throw error;
      }

      // Calcula delay com exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );

      // Callback de notificação
      onRetry?.(error, attempt + 1, delay);

      // Aguarda antes de tentar novamente
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Decisão padrão sobre quando retentar
 * NÃO retenta rate limiting (429) - isso é tratado no interceptor
 * Retenta apenas erros de rede/timeout
 */
function defaultShouldRetry(error: unknown): boolean {
  // Nunca retenta rate limiting (tratado no interceptor)
  if (isRateLimitError(error)) {
    return false;
  }

  // Retenta erros de rede
  if (isNetworkError(error)) {
    return true;
  }

  // Retenta timeout
  if (isTimeoutError(error)) {
    return true;
  }

  // Retenta 503 (serviço indisponível)
  if (isServiceUnavailable(error)) {
    return true;
  }

  // Não retenta outros erros (400, 404, etc)
  return false;
}

/**
 * Type guards para identificar tipos de erro
 */
function isRateLimitError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as any).response === "object" &&
    (error as any).response?.status === 429
  );
}

function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.toLowerCase().includes("timeout") ||
      error.name === "TimeoutError"
    );
  }
  return false;
}

function isServiceUnavailable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as any).response === "object" &&
    (error as any).response?.status === 503
  );
}

/**
 * Helper para aguardar
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry específico para rate limiting (usando Retry-After header)
 * Esta função é usada internamente quando detectamos 429
 */
export async function retryAfterRateLimit<T>(
  fn: () => Promise<T>,
  retryAfterSeconds: number
): Promise<T> {
  const delayMs = retryAfterSeconds * 1000;

  console.log(
    `[Retry] Aguardando ${retryAfterSeconds}s devido a rate limit...`
  );

  await sleep(delayMs);

  return fn();
}

/**
 * Wrapper para adicionar timeout a qualquer promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(timeoutError || new Error("Request timeout")),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Retry com jitter (aleatoriedade) para evitar thundering herd
 * Útil quando múltiplas instâncias estão fazendo retry simultaneamente
 */
export async function retryWithJitter<T>(
  fn: () => Promise<T>,
  options: RetryOptions & { jitter?: number } = {}
): Promise<T> {
  const { jitter = 0.1, ...retryOptions } = options;

  return retryWithBackoff(fn, {
    ...retryOptions,
    onRetry: (error, attempt, delay) => {
      // Adiciona variação aleatória ao delay (±jitter%)
      const jitteredDelay = delay * (1 + (Math.random() * 2 - 1) * jitter);
      options.onRetry?.(error, attempt, jitteredDelay);
    },
  });
}

/**
 * Executa múltiplas promises com retry individual
 */
export async function retryAll<T>(
  promises: (() => Promise<T>)[],
  options: RetryOptions = {}
): Promise<T[]> {
  return Promise.all(promises.map((fn) => retryWithBackoff(fn, options)));
}

/**
 * Executa promises em lote com limite de concorrência
 * Útil para evitar sobrecarga do servidor
 */
export async function batchWithRetry<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  options: RetryOptions & { concurrency?: number } = {}
): Promise<R[]> {
  const { concurrency = 5, ...retryOptions } = options;
  const results: R[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((item) => retryWithBackoff(() => fn(item), retryOptions))
    );
    results.push(...batchResults);
  }

  return results;
}
