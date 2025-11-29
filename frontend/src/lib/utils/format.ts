/**
 * Utilitários de Formatação
 * Funções para formatar datas, números, clima, etc em PT-BR
 */

// ============================================
// FORMATAÇÃO DE DATA E HORA
// ============================================

/**
 * Formata data completa em PT-BR
 * Ex: "29 de novembro de 2025"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formata data curta
 * Ex: "29/11/2025"
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata hora
 * Ex: "14:30"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata data e hora completa
 * Ex: "29/11/2025 às 14:30"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return `${formatDateShort(d)} às ${formatTime(d)}`;
}

/**
 * Formata dia da semana
 * Ex: "Sexta-feira, 29 de novembro"
 */
export function formatWeekday(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Formata timestamp relativo
 * Ex: "há 2 horas", "há 3 dias", "há 1 mês"
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  
  if (seconds < 60) return 'agora';
  if (minutes < 60) return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  if (hours < 24) return `há ${hours} hora${hours > 1 ? 's' : ''}`;
  if (days < 30) return `há ${days} dia${days > 1 ? 's' : ''}`;
  if (months < 12) return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  return `há ${years} ano${years > 1 ? 's' : ''}`;
}

/**
 * Formata duração em segundos para formato legível
 * Ex: "2m 30s", "1h 15m"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}

// ============================================
// FORMATAÇÃO DE TEMPERATURA
// ============================================

/**
 * Formata temperatura em °C
 * Ex: "28°C", "28.5°C"
 */
export function formatTemperature(temp: number, decimals: number = 0): string {
  return `${temp.toFixed(decimals)}°C`;
}

/**
 * Formata range de temperatura
 * Ex: "24°C - 32°C"
 */
export function formatTemperatureRange(min: number, max: number): string {
  return `${formatTemperature(min)} - ${formatTemperature(max)}`;
}

// ============================================
// FORMATAÇÃO DE NÚMEROS
// ============================================

/**
 * Formata porcentagem
 * Ex: "65%", "65.5%"
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formata número com separadores de milhar
 * Ex: "1.234", "1.234.567"
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formata número compacto (K, M, B)
 * Ex: "1.2K", "1.5M"
 */
export function formatCompactNumber(value: number): string {
  const absValue = Math.abs(value);
  
  if (absValue < 1000) return value.toString();
  if (absValue < 1000000) return `${(value / 1000).toFixed(1)}K`;
  if (absValue < 1000000000) return `${(value / 1000000).toFixed(1)}M`;
  return `${(value / 1000000000).toFixed(1)}B`;
}

// ============================================
// FORMATAÇÃO DE CLIMA
// ============================================

/**
 * Formata precipitação (chuva)
 * Ex: "12mm", "12.5mm"
 */
export function formatRainfall(mm: number, decimals: number = 1): string {
  return `${mm.toFixed(decimals)}mm`;
}

/**
 * Formata velocidade do vento
 * Ex: "4.5 m/s", "16 km/h"
 */
export function formatWindSpeed(
  ms: number,
  unit: 'ms' | 'kmh' = 'ms',
  decimals: number = 1
): string {
  if (unit === 'kmh') {
    const kmh = ms * 3.6;
    return `${kmh.toFixed(decimals)} km/h`;
  }
  return `${ms.toFixed(decimals)} m/s`;
}

/**
 * Formata pressão atmosférica
 * Ex: "1013 hPa"
 */
export function formatPressure(hpa: number): string {
  return `${Math.round(hpa)} hPa`;
}

/**
 * Formata visibilidade
 * Ex: "10 km", "500 m"
 */
export function formatVisibility(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Formata índice UV
 * Ex: "UV 5", "UV 10+"
 */
export function formatUVIndex(uv: number): string {
  return uv >= 11 ? 'UV 11+' : `UV ${Math.round(uv)}`;
}

// ============================================
// FORMATAÇÃO DE COORDENADAS
// ============================================

/**
 * Formata coordenadas geográficas
 * Ex: "23.5505°S, 46.6333°O"
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'L' : 'O';
  
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
}

// ============================================
// FORMATAÇÃO DE DISTÂNCIA
// ============================================

/**
 * Formata distância
 * Ex: "1.5 km", "500 m"
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

// ============================================
// FORMATAÇÃO DE ÁREA
// ============================================

/**
 * Formata área (para propriedades rurais)
 * Ex: "150 hectares", "2.5 alqueires"
 */
export function formatArea(
  value: number,
  unit: 'ha' | 'alq' | 'm2' = 'ha'
): string {
  const units = {
    ha: 'hectare',
    alq: 'alqueire',
    m2: 'm²',
  };
  
  const unitLabel = units[unit];
  const pluralLabel = value > 1 && unit !== 'm2' ? `${unitLabel}s` : unitLabel;
  
  return `${formatNumber(value, 1)} ${pluralLabel}`;
}

// ============================================
// SANITIZAÇÃO
// ============================================

/**
 * Remove caracteres especiais de strings
 */
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/\s+/g, ' '); // Remove espaços múltiplos
}

/**
 * Trunca texto com reticências
 * Ex: "Texto muito long..." (max 20 chars)
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitaliza primeira letra
 * Ex: "olá mundo" → "Olá mundo"
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitaliza cada palavra (Title Case)
 * Ex: "olá mundo" → "Olá Mundo"
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}