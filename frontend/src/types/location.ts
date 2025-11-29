/**
 * Types para geocoding e busca de localizações
 * Baseado na API do backend (/api/v1/locations/search)
 */

export interface LocationSearchResult {
  name: string; // "Ribeirão Preto"
  state?: string; // "São Paulo" (pode não existir para outros países)
  country: string; // "Brasil" ou código "BR"
  lat: number;
  lon: number;
  display_name: string; // "Ribeirão Preto, São Paulo, Brasil"
}

export interface LocationSearchResponse {
  results: LocationSearchResult[];
  query: string;
  count: number;
}

// Para armazenar localização selecionada no estado local
export interface SelectedLocation {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
  displayName: string;
}

// Histórico de buscas recentes (localStorage)
export interface RecentLocation extends SelectedLocation {
  searchedAt: string; // ISO timestamp
}

// Coordenadas simples (para passar entre componentes)
export interface Coordinates {
  lat: number;
  lon: number;
}

// Resposta de erro da API
export interface LocationError {
  error: {
    code: string;
    message: string;
    details?: string;
  };
}