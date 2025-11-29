/**
 * Constantes de erros e mensagens amigáveis
 * Centraliza todas as mensagens de erro da aplicação
 */

// Códigos de erro do backend (matches com FastAPI)
export const ERROR_CODES = {
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Validação
  INVALID_COORDINATES: 'INVALID_COORDINATES',
  INVALID_LOCATION: 'INVALID_LOCATION',
  INVALID_INSIGHT_DATA: 'INVALID_INSIGHT_DATA',
  CONTENT_TOO_SHORT: 'CONTENT_TOO_SHORT',
  CONTENT_TOO_LONG: 'CONTENT_TOO_LONG',
  TOO_MANY_TAGS: 'TOO_MANY_TAGS',
  
  // Recursos não encontrados
  LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
  WEATHER_DATA_NOT_AVAILABLE: 'WEATHER_DATA_NOT_AVAILABLE',
  
  // Serviços externos
  OPENWEATHER_API_ERROR: 'OPENWEATHER_API_ERROR',
  GEOCODING_SERVICE_ERROR: 'GEOCODING_SERVICE_ERROR',
  NEWS_API_ERROR: 'NEWS_API_ERROR',
  
  // Rede
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Genérico
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Mensagens de erro amigáveis (user-facing)
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Você fez muitas requisições. Por favor, aguarde alguns segundos e tente novamente.',
  
  // Validação
  INVALID_COORDINATES: 'Coordenadas geográficas inválidas. Por favor, selecione uma localização válida.',
  INVALID_LOCATION: 'Localização inválida. Tente buscar novamente.',
  INVALID_INSIGHT_DATA: 'Dados do insight estão incompletos ou inválidos.',
  CONTENT_TOO_SHORT: 'O conteúdo do insight deve ter pelo menos 10 caracteres.',
  CONTENT_TOO_LONG: 'O conteúdo do insight não pode ter mais de 1000 caracteres.',
  TOO_MANY_TAGS: 'Você pode adicionar no máximo 5 tags.',
  
  // Recursos não encontrados
  LOCATION_NOT_FOUND: 'Nenhuma localização encontrada com esse nome. Tente buscar de outra forma.',
  WEATHER_DATA_NOT_AVAILABLE: 'Dados climáticos não disponíveis para essa localização no momento.',
  
  // Serviços externos
  OPENWEATHER_API_ERROR: 'Serviço de clima temporariamente indisponível. Tente novamente em alguns minutos.',
  GEOCODING_SERVICE_ERROR: 'Serviço de busca de localizações temporariamente indisponível.',
  NEWS_API_ERROR: 'Não foi possível carregar as notícias. Tente novamente mais tarde.',
  
  // Rede
  NETWORK_ERROR: 'Sem conexão com a internet. Verifique sua conexão e tente novamente.',
  TIMEOUT_ERROR: 'A requisição demorou muito tempo. Verifique sua conexão e tente novamente.',
  
  // Genérico
  INTERNAL_SERVER_ERROR: 'Erro no servidor. Nossa equipe foi notificada. Tente novamente em alguns minutos.',
  UNKNOWN_ERROR: 'Algo deu errado. Por favor, tente novamente.',
};

// Mensagens de sucesso
export const SUCCESS_MESSAGES = {
  INSIGHT_CREATED: 'Insight compartilhado com sucesso!',
  WEATHER_LOADED: 'Dados climáticos carregados',
  LOCATION_FOUND: 'Localização encontrada',
} as const;

// HTTP Status Code → ErrorCode mapping
export const HTTP_TO_ERROR_CODE: Record<number, ErrorCode> = {
  400: ERROR_CODES.INVALID_LOCATION,
  404: ERROR_CODES.LOCATION_NOT_FOUND,
  429: ERROR_CODES.RATE_LIMIT_EXCEEDED,
  500: ERROR_CODES.INTERNAL_SERVER_ERROR,
  503: ERROR_CODES.OPENWEATHER_API_ERROR,
};

// Helpers para tratamento de erros
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

export function getErrorCodeFromStatus(status: number): ErrorCode {
  return HTTP_TO_ERROR_CODE[status] || ERROR_CODES.UNKNOWN_ERROR;
}

export function isRateLimitError(code?: string): boolean {
  return code === ERROR_CODES.RATE_LIMIT_EXCEEDED;
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('network') ||
           error.message.toLowerCase().includes('fetch') ||
           !navigator.onLine;
  }
  return false;
}

// Tipo para estrutura de erro da API
export interface APIError {
  error: {
    code: ErrorCode;
    message: string;
    details?: string;
    retry_after?: number; // para rate limiting
  };
}

// Type guard
export function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as APIError).error === 'object' &&
    'code' in (error as APIError).error
  );
}