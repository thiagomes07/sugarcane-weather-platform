/**
 * Constantes para clima (traduções, ícones, categorias)
 * Baseado nos códigos da OpenWeather API
 */

// Mapa de condições climáticas (OpenWeather main → PT-BR)
// Mapa de condições climáticas (Chave em Inglês -> Valor em PT-BR)
export const WEATHER_CONDITIONS: Record<string, string> = {
  // Principais
  'Clear': 'Céu Limpo',
  'Clouds': 'Nublado',
  'Rain': 'Chuva',
  'Drizzle': 'Garoa',
  'Thunderstorm': 'Tempestade',
  'Snow': 'Neve',
  'Mist': 'Névoa',
  'Fog': 'Nevoeiro',
  'Haze': 'Neblina',
  
  // Variações e Outros
  'Smoke': 'Fumaça',
  'Dust': 'Poeira',
  'Sand': 'Areia',
  'Ash': 'Cinzas',
  'Squall': 'Rajada de Vento',
  'Tornado': 'Tornado',
};

// Descrições detalhadas (OpenWeather description → PT-BR)
export const WEATHER_DESCRIPTIONS: Record<string, string> = {
  'clear sky': 'céu limpo',
  'few clouds': 'poucas nuvens',
  'scattered clouds': 'nuvens dispersas',
  'broken clouds': 'nuvens quebradas',
  'overcast clouds': 'nublado',
  'light rain': 'chuva leve',
  'moderate rain': 'chuva moderada',
  'heavy intensity rain': 'chuva forte',
  'very heavy rain': 'chuva muito forte',
  'extreme rain': 'chuva extrema',
  'light intensity drizzle': 'garoa leve',
  'drizzle': 'garoa',
  'heavy intensity drizzle': 'garoa forte',
  'thunderstorm with light rain': 'tempestade com chuva leve',
  'thunderstorm with rain': 'tempestade com chuva',
  'thunderstorm with heavy rain': 'tempestade com chuva forte',
  'light thunderstorm': 'tempestade leve',
  'thunderstorm': 'tempestade',
  'heavy thunderstorm': 'tempestade forte',
  'mist': 'névoa',
  'fog': 'nevoeiro',
};

// Ícones do OpenWeather → Emoji/Lucide icon name
export const WEATHER_ICONS: Record<string, string> = {
  '01d': 'sun', // céu limpo (dia)
  '01n': 'moon', // céu limpo (noite)
  '02d': 'cloud-sun', // poucas nuvens (dia)
  '02n': 'cloud-moon', // poucas nuvens (noite)
  '03d': 'cloud', // nuvens dispersas
  '03n': 'cloud',
  '04d': 'cloudy', // nublado
  '04n': 'cloudy',
  '09d': 'cloud-drizzle', // garoa
  '09n': 'cloud-drizzle',
  '10d': 'cloud-rain', // chuva (dia)
  '10n': 'cloud-rain', // chuva (noite)
  '11d': 'cloud-lightning', // tempestade
  '11n': 'cloud-lightning',
  '13d': 'snowflake', // neve
  '13n': 'snowflake',
  '50d': 'cloud-fog', // névoa
  '50n': 'cloud-fog',
};

// Direções de vento (graus → texto)
export const WIND_DIRECTIONS: Record<string, string> = {
  N: 'Norte',
  NNE: 'Norte-Nordeste',
  NE: 'Nordeste',
  ENE: 'Leste-Nordeste',
  E: 'Leste',
  ESE: 'Leste-Sudeste',
  SE: 'Sudeste',
  SSE: 'Sul-Sudeste',
  S: 'Sul',
  SSW: 'Sul-Sudoeste',
  SW: 'Sudoeste',
  WSW: 'Oeste-Sudoeste',
  W: 'Oeste',
  WNW: 'Oeste-Noroeste',
  NW: 'Noroeste',
  NNW: 'Norte-Noroeste',
};

// Converte graus de direção do vento para texto
export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return WIND_DIRECTIONS[directions[index]] || 'Desconhecido';
}

// Categorias de temperatura
export const TEMPERATURE_CATEGORIES = {
  FREEZING: { max: 0, label: 'Congelante', color: 'text-blue-600' },
  COLD: { max: 15, label: 'Frio', color: 'text-blue-500' },
  MILD: { max: 25, label: 'Ameno', color: 'text-green-500' },
  WARM: { max: 32, label: 'Quente', color: 'text-yellow-500' },
  HOT: { max: 38, label: 'Muito Quente', color: 'text-orange-500' },
  EXTREME: { max: Infinity, label: 'Extremo', color: 'text-red-600' },
} as const;

export function getTemperatureCategory(temp: number) {
  for (const [key, value] of Object.entries(TEMPERATURE_CATEGORIES)) {
    if (temp <= value.max) {
      return { key, ...value };
    }
  }
  return { key: 'EXTREME', ...TEMPERATURE_CATEGORIES.EXTREME };
}

// Categorias de umidade
export const HUMIDITY_CATEGORIES = {
  VERY_LOW: { max: 30, label: 'Muito Baixa', color: 'text-red-500' },
  LOW: { max: 50, label: 'Baixa', color: 'text-yellow-500' },
  MODERATE: { max: 70, label: 'Moderada', color: 'text-green-500' },
  HIGH: { max: 85, label: 'Alta', color: 'text-blue-500' },
  VERY_HIGH: { max: Infinity, label: 'Muito Alta', color: 'text-blue-700' },
} as const;

export function getHumidityCategory(humidity: number) {
  for (const [key, value] of Object.entries(HUMIDITY_CATEGORIES)) {
    if (humidity <= value.max) {
      return { key, ...value };
    }
  }
  return { key: 'VERY_HIGH', ...HUMIDITY_CATEGORIES.VERY_HIGH };
}

// Intensidade de chuva (mm/h)
export const RAINFALL_INTENSITY = {
  NONE: { max: 0.1, label: 'Sem Chuva', color: 'text-gray-400' },
  LIGHT: { max: 2.5, label: 'Chuva Leve', color: 'text-blue-400' },
  MODERATE: { max: 7.6, label: 'Chuva Moderada', color: 'text-blue-500' },
  HEAVY: { max: 50, label: 'Chuva Forte', color: 'text-blue-700' },
  EXTREME: { max: Infinity, label: 'Chuva Extrema', color: 'text-red-600' },
} as const;

export function getRainfallIntensity(mm: number) {
  for (const [key, value] of Object.entries(RAINFALL_INTENSITY)) {
    if (mm <= value.max) {
      return { key, ...value };
    }
  }
  return { key: 'EXTREME', ...RAINFALL_INTENSITY.EXTREME };
}

// Velocidade do vento (m/s → categorias Beaufort)
export const WIND_CATEGORIES = {
  CALM: { max: 0.5, label: 'Calmo', color: 'text-gray-400' },
  LIGHT: { max: 3.3, label: 'Vento Leve', color: 'text-green-500' },
  MODERATE: { max: 7.9, label: 'Vento Moderado', color: 'text-yellow-500' },
  FRESH: { max: 13.8, label: 'Vento Fresco', color: 'text-orange-500' },
  STRONG: { max: 20.7, label: 'Vento Forte', color: 'text-red-500' },
  GALE: { max: Infinity, label: 'Ventania', color: 'text-red-700' },
} as const;

export function getWindCategory(speed: number) {
  for (const [key, value] of Object.entries(WIND_CATEGORIES)) {
    if (speed <= value.max) {
      return { key, ...value };
    }
  }
  return { key: 'GALE', ...WIND_CATEGORIES.GALE };
}

// UV Index (futuro: se adicionar UV na API)
export const UV_CATEGORIES = {
  LOW: { max: 2, label: 'Baixo', color: 'text-green-500' },
  MODERATE: { max: 5, label: 'Moderado', color: 'text-yellow-500' },
  HIGH: { max: 7, label: 'Alto', color: 'text-orange-500' },
  VERY_HIGH: { max: 10, label: 'Muito Alto', color: 'text-red-500' },
  EXTREME: { max: Infinity, label: 'Extremo', color: 'text-purple-600' },
} as const;

// Status geral (combinado)
export type WeatherStatus = 'ideal' | 'good' | 'attention' | 'critical';

export const STATUS_CONFIG: Record<WeatherStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  ideal: {
    label: 'Ideal',
    color: 'text-status-ideal',
    bgColor: 'bg-status-ideal/10',
    borderColor: 'border-status-ideal',
  },
  good: {
    label: 'Bom',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
  },
  attention: {
    label: 'Atenção',
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/10',
    borderColor: 'border-status-warning',
  },
  critical: {
    label: 'Crítico',
    color: 'text-status-critical',
    bgColor: 'bg-status-critical/10',
    borderColor: 'border-status-critical',
  },
};