/**
 * Cliente HTTP Axios com interceptors para Rate Limiting
 * Implementa a estratégia de resiliência da Seção 7 da documentação
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { env } from "@/config/env";
import {
  ERROR_CODES,
  getErrorMessage,
  getErrorCodeFromStatus,
  isAPIError,
  type APIError,
  type ErrorCode,
} from "@/lib/constants/errors";

// ============================================
// TIPOS CUSTOMIZADOS
// ============================================

export interface RateLimitError extends Error {
  isRateLimit: true;
  retryAfter: number; // segundos
  endpoint: string;
  response?: {
    status: 429;
    data: APIError;
  };
}

export interface CustomAxiosError extends AxiosError {
  isRateLimit?: boolean;
  retryAfter?: number;
}

// ============================================
// CONSTANTES
// ============================================

const RATE_LIMIT_STORAGE_KEY = "rateLimitCooldown";
const RATE_LIMIT_EVENT = "rateLimit";

// ============================================
// INSTÂNCIA AXIOS
// ============================================

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 30000, // 30 segundos
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Verifica se está em cooldown antes de fazer a requisição
    const cooldown = getCooldownFromStorage();

    if (cooldown && new Date() < cooldown.expiresAt) {
      const remainingSeconds = Math.ceil(
        (cooldown.expiresAt.getTime() - Date.now()) / 1000
      );

      console.warn(
        `[API] Requisição bloqueada - Cooldown ativo por mais ${remainingSeconds}s`
      );

      // Cria erro customizado de rate limit
      const error: RateLimitError = new Error(
        `Rate limit ativo. Aguarde ${remainingSeconds}s.`
      ) as RateLimitError;
      error.isRateLimit = true;
      error.retryAfter = remainingSeconds;
      error.endpoint = config.url || "unknown";

      return Promise.reject(error);
    }

    // Log de debug (apenas em desenvolvimento)
    if (env.isDevelopment) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================

apiClient.interceptors.response.use(
  // Sucesso: retorna resposta normalmente
  (response) => {
    if (env.isDevelopment) {
      console.log(`[API] ✓ ${response.config.url} - ${response.status}`);
    }
    return response;
  },

  // Erro: processa rate limiting e outros erros
  (error: AxiosError<APIError>) => {
    const status = error.response?.status;
    const endpoint = error.config?.url || "unknown";

    // ============================================
    // TRATAMENTO DE RATE LIMITING (429)
    // ============================================
    if (status === 429) {
      const apiError = error.response?.data;
      const retryAfter = apiError?.error?.retry_after || 60; // padrão 60s

      console.warn(
        `[API] Rate limit em ${endpoint} - Retry after: ${retryAfter}s`
      );

      // Salva cooldown no localStorage
      saveCooldownToStorage(retryAfter);

      // Emite evento para componentes reagirem
      dispatchRateLimitEvent(retryAfter, endpoint);

      // Mostra toast persistente
      toast.error(`Limite de requisições atingido. Aguarde ${retryAfter}s.`, {
        duration: retryAfter * 1000,
        icon: "⏱️",
        description: endpoint,
      });

      // Cria erro customizado
      const rateLimitError: RateLimitError = new Error(
        getErrorMessage(ERROR_CODES.RATE_LIMIT_EXCEEDED)
      ) as RateLimitError;
      rateLimitError.isRateLimit = true;
      rateLimitError.retryAfter = retryAfter;
      rateLimitError.endpoint = endpoint;
      rateLimitError.response = {
        status: 429,
        data: apiError!,
      };

      return Promise.reject(rateLimitError);
    }

    // ============================================
    // OUTROS ERROS HTTP
    // ============================================

    // Erro de rede (sem resposta do servidor)
    if (!error.response) {
      if (!navigator.onLine) {
        toast.error("Sem conexão com a internet");
      } else if (error.code === "ECONNABORTED") {
        toast.error("Tempo de requisição excedido");
      } else {
        toast.error("Erro de conexão com o servidor");
      }
      return Promise.reject(error);
    }

    // Erro com resposta do servidor
    const errorCode = getErrorCodeFromStatus(status || 500);
    const message =
      error.response.data?.error?.message || getErrorMessage(errorCode);

    // Log detalhado em desenvolvimento
    if (env.isDevelopment) {
      console.error("[API] Error:", {
        endpoint,
        status,
        errorCode,
        message,
        data: error.response.data,
      });
    }

    // Mostra toast baseado no tipo de erro
    switch (status) {
      case 400:
        toast.error(`Requisição inválida: ${message}`);
        break;
      case 404:
        toast.error("Recurso não encontrado");
        break;
      case 500:
        toast.error("Erro no servidor. Tente novamente.");
        break;
      case 503:
        toast.error("Serviço temporariamente indisponível");
        break;
      default:
        if (status && status >= 400) {
          toast.error(message);
        }
    }

    return Promise.reject(error);
  }
);

// ============================================
// GERENCIAMENTO DE COOLDOWN (LOCALSTORAGE)
// ============================================

interface CooldownData {
  expiresAt: Date;
  retryAfter: number;
  timestamp: number;
}

/**
 * Salva cooldown no localStorage
 */
function saveCooldownToStorage(retryAfterSeconds: number): void {
  const expiresAt = new Date(Date.now() + retryAfterSeconds * 1000);

  const data: CooldownData = {
    expiresAt,
    retryAfter: retryAfterSeconds,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(
      RATE_LIMIT_STORAGE_KEY,
      JSON.stringify({
        ...data,
        expiresAt: expiresAt.toISOString(),
      })
    );
  } catch (error) {
    console.error("[API] Erro ao salvar cooldown:", error);
  }
}

/**
 * Recupera cooldown do localStorage
 */
function getCooldownFromStorage(): CooldownData | null {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const expiresAt = new Date(parsed.expiresAt);

    // Se já expirou, limpa e retorna null
    if (expiresAt <= new Date()) {
      localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
      return null;
    }

    return {
      expiresAt,
      retryAfter: parsed.retryAfter,
      timestamp: parsed.timestamp,
    };
  } catch (error) {
    console.error("[API] Erro ao ler cooldown:", error);
    return null;
  }
}

/**
 * Limpa cooldown do localStorage
 */
export function clearCooldown(): void {
  localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
}

/**
 * Retorna tempo restante de cooldown em segundos
 */
export function getRemainingCooldown(): number {
  const cooldown = getCooldownFromStorage();
  if (!cooldown) return 0;

  const remaining = Math.ceil(
    (cooldown.expiresAt.getTime() - Date.now()) / 1000
  );
  return Math.max(0, remaining);
}

// ============================================
// EVENTOS DE RATE LIMITING
// ============================================

/**
 * Emite evento customizado para componentes React escutarem
 */
function dispatchRateLimitEvent(retryAfter: number, endpoint: string): void {
  const event = new CustomEvent(RATE_LIMIT_EVENT, {
    detail: { retryAfter, endpoint, timestamp: Date.now() },
  });
  window.dispatchEvent(event);
}

/**
 * Hook para escutar eventos de rate limiting
 */
export function onRateLimitEvent(
  callback: (data: {
    retryAfter: number;
    endpoint: string;
    timestamp: number;
  }) => void
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail);
  };

  window.addEventListener(RATE_LIMIT_EVENT, handler);

  // Retorna função de cleanup
  return () => window.removeEventListener(RATE_LIMIT_EVENT, handler);
}

// ============================================
// TYPE GUARDS
// ============================================

export function isRateLimitError(error: unknown): error is RateLimitError {
  return (
    typeof error === "object" &&
    error !== null &&
    "isRateLimit" in error &&
    (error as RateLimitError).isRateLimit === true
  );
}

export function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error);
}

// ============================================
// HELPERS DE REQUISIÇÃO
// ============================================

/**
 * Wrapper genérico para GET requests
 */
export async function get<T>(url: string, config = {}): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

/**
 * Wrapper genérico para POST requests
 */
export async function post<T, D = any>(
  url: string,
  data?: D,
  config = {}
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

/**
 * Wrapper genérico para PUT requests
 */
export async function put<T, D = any>(
  url: string,
  data?: D,
  config = {}
): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

/**
 * Wrapper genérico para DELETE requests
 */
export async function del<T>(url: string, config = {}): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}
