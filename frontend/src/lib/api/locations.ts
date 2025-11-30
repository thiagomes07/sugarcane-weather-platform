/**
 * API de Localização - Geocoding/Autocomplete
 * Rate limit: 5 req/s com burst de 10 (Nginx)
 */

import { get } from "./client";
import { retryWithBackoff } from "@/lib/utils/retry";
import type {
  LocationSearchResponse,
  LocationSearchResult,
} from "@/types/location";

// ============================================
// CONSTANTES
// ============================================

const MIN_QUERY_LENGTH = 2;
const RECENT_LOCATIONS_KEY = "recentLocations";
const MAX_RECENT_LOCATIONS = 5;

// ============================================
// INTERFACES
// ============================================

export interface SearchLocationsParams {
  q: string;
  limit?: number;
}

interface ReverseGeocodeResponse {
  location: LocationSearchResult;
  success: boolean;
}

// ============================================
// ENDPOINTS
// ============================================

/**
 * Busca localizações por nome (autocomplete)
 * Rate limit: 5 req/s, burst 10
 */
export async function searchLocations(
  params: SearchLocationsParams
): Promise<LocationSearchResponse> {
  const { q, limit = 10 } = params;

  if (!q || q.trim().length < MIN_QUERY_LENGTH) {
    throw new Error(
      `Query deve ter pelo menos ${MIN_QUERY_LENGTH} caracteres.`
    );
  }

  const sanitizedQuery = q.trim();
  const queryParams = new URLSearchParams({
    q: sanitizedQuery,
    limit: limit.toString(),
  });

  return retryWithBackoff(
    () =>
      get<LocationSearchResponse>(`/api/v1/locations/search?${queryParams}`),
    {
      maxRetries: 2,
      initialDelay: 500,
      onRetry: (attempt) => {
        console.log(
          `[Locations] Tentativa ${attempt} de busca por "${sanitizedQuery}"`
        );
      },
    }
  );
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<LocationSearchResult | null> {
  if (!isValidCoordinates(lat, lon)) {
    throw new Error("Coordenadas inválidas.");
  }

  const queryParams = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
  });

  try {
    const response = await retryWithBackoff(
      () =>
        get<ReverseGeocodeResponse>(`/api/v1/locations/reverse?${queryParams}`),
      { maxRetries: 2, initialDelay: 1000 }
    );

    return response.location;
  } catch (error) {
    console.error("[Locations] Erro em geocoding reverso:", error);
    return null;
  }
}

// ============================================
// LOCALIZAÇÕES RECENTES (LOCALSTORAGE)
// ============================================

export interface RecentLocation {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
  display_name: string;
  searched_at: string;
}

export function saveRecentLocation(
  location: Omit<RecentLocation, "searched_at">
): void {
  try {
    const recents = getRecentLocations();

    const filtered = recents.filter(
      (loc) =>
        !(
          Math.abs(loc.lat - location.lat) < 0.001 &&
          Math.abs(loc.lon - location.lon) < 0.001
        )
    );

    const updated: RecentLocation[] = [
      { ...location, searched_at: new Date().toISOString() },
      ...filtered,
    ].slice(0, MAX_RECENT_LOCATIONS);

    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("[Locations] Erro ao salvar localização recente:", error);
  }
}

export function getRecentLocations(): RecentLocation[] {
  try {
    const stored = localStorage.getItem(RECENT_LOCATIONS_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[Locations] Erro ao ler localizações recentes:", error);
    return [];
  }
}

export function clearRecentLocations(): void {
  localStorage.removeItem(RECENT_LOCATIONS_KEY);
}

// ============================================
// GEOLOCALIZAÇÃO DO NAVEGADOR
// ============================================

export interface GeolocationResult {
  lat: number;
  lon: number;
  accuracy: number;
}

export async function getCurrentPosition(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error(
          "Geolocalização não suportada pelo navegador. Use um navegador moderno (Chrome, Firefox, Safari, Edge)."
        )
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let message = "Erro ao obter localização";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              "Permissão de localização negada. Autorize o navegador a acessar sua localização nas configurações.";
            break;
          case error.POSITION_UNAVAILABLE:
            message =
              "Sua localização não está disponível. Tente usar WiFi ou GPS.";
            break;
          case error.TIMEOUT:
            message = "Tempo esgotado ao obter localização. Tente novamente.";
            break;
        }

        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
}

// ============================================
// HELPERS
// ============================================

function isValidCoordinates(lat: number, lon: number): boolean {
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

export function normalizeLocationName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function formatDisplayName(
  name: string,
  state?: string,
  country?: string
): string {
  const parts = [name];
  if (state) parts.push(state);
  if (country) parts.push(country);
  return parts.join(", ");
}
