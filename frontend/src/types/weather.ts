/**
 * Types para dados climáticos do OpenWeather API
 * Baseado na resposta real da API (current + forecast 5 dias)
 */

export interface WeatherCondition {
  id: number;
  main: string; // "Clear", "Rain", "Clouds", etc
  description: string; // "céu limpo", "chuva moderada"
  icon: string; // "01d", "10n", etc
}

export interface MainWeatherData {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number; // hPa
  humidity: number; // %
  sea_level?: number;
  grnd_level?: number;
}

export interface Wind {
  speed: number; // m/s
  deg: number; // direção em graus
  gust?: number;
}

export interface Clouds {
  all: number; // % de cobertura
}

export interface Rain {
  "1h"?: number; // mm na última hora
  "3h"?: number; // mm nas últimas 3 horas
}

export interface Snow {
  "1h"?: number;
  "3h"?: number;
}

export interface Sys {
  type?: number;
  id?: number;
  country: string; // "BR"
  sunrise: number; // timestamp UNIX
  sunset: number; // timestamp UNIX
}

// Dados climáticos atuais (current weather)
export interface CurrentWeather {
  coord: {
    lat: number;
    lon: number;
  };
  weather: WeatherCondition[];
  base: string;
  main: MainWeatherData;
  visibility: number; // metros
  wind: Wind;
  clouds: Clouds;
  rain?: Rain;
  snow?: Snow;
  dt: number; // timestamp UNIX
  sys: Sys;
  timezone: number; // deslocamento em segundos
  id: number;
  name: string; // nome da cidade
  cod: number; // código de resposta HTTP
}

// Item de previsão (forecast)
export interface ForecastItem {
  dt: number; // timestamp UNIX
  main: MainWeatherData;
  weather: WeatherCondition[];
  clouds: Clouds;
  wind: Wind;
  visibility: number;
  pop: number; // probabilidade de precipitação (0-1)
  rain?: Rain;
  snow?: Snow;
  sys: {
    pod: string; // "d" (day) ou "n" (night)
  };
  dt_txt: string; // "2025-11-29 12:00:00"
}

export interface ForecastCity {
  id: number;
  name: string;
  coord: {
    lat: number;
    lon: number;
  };
  country: string;
  population: number;
  timezone: number;
  sunrise: number;
  sunset: number;
}

export interface ForecastResponse {
  cod: string;
  message: number;
  cnt: number; // número de timestamps
  list: ForecastItem[];
  city: ForecastCity;
}

// Análise específica para cana-de-açúcar
export interface SugarcaneAnalysis {
  overallStatus: "ideal" | "good" | "attention" | "critical";
  statusMessage: string;
  details: {
    temperature: {
      status: "ideal" | "good" | "attention" | "critical";
      message: string;
      value: number;
      range: string;
    };
    humidity: {
      status: "ideal" | "good" | "attention" | "critical";
      message: string;
      value: number;
      range: string;
    };
    rainfall: {
      status: "ideal" | "good" | "attention" | "critical";
      message: string;
      value: number;
      range: string;
    };
    wind: {
      status: "ideal" | "good" | "attention" | "critical";
      message: string;
      value: number;
      range: string;
    };
  };
  recommendations: string[];
  phase: "planting" | "growing" | "ripening" | "harvest";
  phaseMessage: string;
}

// Alerta climático
export interface WeatherAlert {
  sender_name: string;
  event: string; // "Heat Wave", "Frost", etc
  start: number; // timestamp
  end: number;
  description: string;
  tags: string[];
}

// Resposta completa do backend (agregada)
export interface WeatherResponse {
  location: {
    name: string;
    state?: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: CurrentWeather;
  forecast: ForecastResponse;
  alerts?: WeatherAlert[];
  sugarcane_analysis: SugarcaneAnalysis;
  cached: boolean;
  cached_at?: string; // ISO timestamp
  expires_at?: string;
}

// Dados processados para exibição no frontend
export interface ProcessedWeatherData {
  location: string; // "Ribeirão Preto, SP, Brasil"
  current: {
    temp: number;
    feelsLike: number;
    condition: string;
    conditionDescription: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    pressure: number;
    visibility: number;
    cloudCoverage: number;
    sunrise: Date;
    sunset: Date;
    rainfall24h: number;
  };
  forecast: {
    date: Date;
    tempMin: number;
    tempMax: number;
    condition: string;
    icon: string;
    pop: number; // probabilidade de chuva
    rainfall: number;
  }[];
  sugarcaneAnalysis: SugarcaneAnalysis;
  alerts: WeatherAlert[];
  lastUpdate: Date;
}
