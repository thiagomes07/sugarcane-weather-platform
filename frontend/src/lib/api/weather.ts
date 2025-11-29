/**
 * API de Clima - Endpoints do OpenWeather via backend
 * Rate limit: 1 req/s com burst de 20 (Nginx)
 */

import { get } from "./client";
import { retryWithBackoff } from "@/lib/utils/retry";
import type { WeatherResponse } from "@/types/weather";

// ============================================
// INTERFACES DE REQUEST
// ============================================

export interface GetWeatherParams {
  lat: number;
  lon: number;
  location_name: string; // Nome para cache no backend
}

// ============================================
// ENDPOINTS
// ============================================

/**
 * Busca dados climáticos completos (current + forecast + análise)
 *
 * Rate limit: 1 req/s, burst 20
 * Cache backend: 30 minutos
 * Timeout: 30s
 *
 * @throws RateLimitError - Se atingir rate limit (429)
 * @throws AxiosError - Se erro de rede/servidor
 */
export async function getWeather(
  params: GetWeatherParams
): Promise<WeatherResponse> {
  // Validação básica
  if (!isValidLatLon(params.lat, params.lon)) {
    throw new Error(
      "Coordenadas inválidas. Latitude deve estar entre -90 e 90, longitude entre -180 e 180."
    );
  }

  if (!params.location_name || params.location_name.trim().length === 0) {
    throw new Error("Nome da localização é obrigatório.");
  }

  // Query params
  const queryParams = new URLSearchParams({
    lat: params.lat.toString(),
    lon: params.lon.toString(),
    location_name: params.location_name,
  });

  // Faz requisição com retry automático (exceto 429)
  return retryWithBackoff(
    () => get<WeatherResponse>(`/api/v1/weather?${queryParams}`),
    {
      maxRetries: 2,
      initialDelay: 1000,
      onRetry: (error, attempt, delay) => {
        console.log(`[Weather] Tentativa ${attempt} após ${delay}ms`);
      },
    }
  );
}

/**
 * Busca apenas previsão (sem current weather)
 * Útil para atualização incremental
 */
export async function getForecast(
  lat: number,
  lon: number
): Promise<WeatherResponse["forecast"]> {
  if (!isValidLatLon(lat, lon)) {
    throw new Error("Coordenadas inválidas.");
  }

  const queryParams = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
  });

  return retryWithBackoff(
    () =>
      get<WeatherResponse["forecast"]>(
        `/api/v1/weather/forecast?${queryParams}`
      ),
    {
      maxRetries: 2,
      initialDelay: 1000,
    }
  );
}

/**
 * Busca apenas dados atuais (sem forecast)
 * Útil para polling de temperatura em tempo real
 */
export async function getCurrentWeather(
  lat: number,
  lon: number
): Promise<WeatherResponse["current"]> {
  if (!isValidLatLon(lat, lon)) {
    throw new Error("Coordenadas inválidas.");
  }

  const queryParams = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
  });

  return retryWithBackoff(
    () =>
      get<WeatherResponse["current"]>(`/api/v1/weather/current?${queryParams}`),
    {
      maxRetries: 2,
      initialDelay: 1000,
    }
  );
}

// ============================================
// HELPERS
// ============================================

/**
 * Valida coordenadas geográficas
 */
function isValidLatLon(lat: number, lon: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * Formata coordenadas para display
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";

  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(
    4
  )}°${lonDir}`;
}

/**
 * Calcula distância aproximada entre duas coordenadas (Haversine)
 * Útil para verificar se o usuário está próximo de uma localização salva
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distância em km
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
