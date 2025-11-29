/**
 * Hook para buscar dados climáticos
 * Cache: 30 minutos (alinhado com cache do backend)
 * Rate limit: 1 req/s com burst de 20
 */

import { useQuery } from '@tanstack/react-query';
import { getWeather, type GetWeatherParams } from '@/lib/api/weather';
import type { WeatherResponse } from '@/types/weather';
import { isRateLimitError } from '@/lib/api/client';
import { useRateLimitHandler } from './useRateLimitHandler';

interface UseWeatherOptions {
  lat?: number;
  lon?: number;
  location_name?: string;
  enabled?: boolean;
}

export function useWeather(options: UseWeatherOptions) {
  const { lat, lon, location_name, enabled = true } = options;
  const { handleRateLimitError } = useRateLimitHandler();

  const hasCoordinates = lat !== undefined && lon !== undefined && location_name !== undefined;

  return useQuery<WeatherResponse>({
    queryKey: ['weather', lat, lon, location_name],
    queryFn: async () => {
      if (!hasCoordinates) {
        throw new Error('Coordenadas e nome da localização são obrigatórios');
      }

      try {
        return await getWeather({
          lat: lat!,
          lon: lon!,
          location_name: location_name!,
        });
      } catch (error) {
        // Se for rate limit, dispara o handler
        if (isRateLimitError(error)) {
          const retryAfter = (error as any).retryAfter || 60;
          handleRateLimitError(retryAfter);
        }
        throw error;
      }
    },
    enabled: enabled && hasCoordinates,
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora (antes era cacheTime)
    retry: (failureCount, error) => {
      // Não retenta rate limiting
      if (isRateLimitError(error)) return false;
      // Retenta até 2 vezes para outros erros
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook simplificado para buscar apenas previsão
 */
export function useForecast(lat?: number, lon?: number, enabled: boolean = true) {
  const hasCoordinates = lat !== undefined && lon !== undefined;

  return useQuery({
    queryKey: ['forecast', lat, lon],
    queryFn: async () => {
      if (!hasCoordinates) {
        throw new Error('Coordenadas são obrigatórias');
      }

      const { forecast } = await getWeather({
        lat: lat!,
        lon: lon!,
        location_name: 'unknown', // Não usado para forecast only
      });

      return forecast;
    },
    enabled: enabled && hasCoordinates,
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000,
  });
}