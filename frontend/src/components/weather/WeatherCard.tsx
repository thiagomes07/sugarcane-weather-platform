"use client";

import {
  Cloud,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  CloudFog,
  Cloudy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatTemperature } from "@/lib/utils/format";
import type { CurrentWeather } from "@/types/weather";
import type { WeatherStatus } from "@/lib/constants/weather";
import { cn } from "@/lib/utils";

interface WeatherCardProps {
  weather: CurrentWeather;
  status?: WeatherStatus;
  className?: string;
}

const WEATHER_ICON_MAP: Record<string, any> = {
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  cloudy: Cloudy,
  "cloud-sun": CloudSun,
  "cloud-moon": CloudMoon,
  "cloud-rain": CloudRain,
  "cloud-drizzle": CloudDrizzle,
  "cloud-lightning": CloudLightning,
  snowflake: CloudSnow,
  "cloud-fog": CloudFog,
};

function getWeatherIcon(iconCode: string): any {
  const mapping: Record<string, string> = {
    "01d": "sun",
    "01n": "moon",
    "02d": "cloud-sun",
    "02n": "cloud-moon",
    "03d": "cloud",
    "03n": "cloud",
    "04d": "cloudy",
    "04n": "cloudy",
    "09d": "cloud-drizzle",
    "09n": "cloud-drizzle",
    "10d": "cloud-rain",
    "10n": "cloud-rain",
    "11d": "cloud-lightning",
    "11n": "cloud-lightning",
    "13d": "snowflake",
    "13n": "snowflake",
    "50d": "cloud-fog",
    "50n": "cloud-fog",
  };

  const iconName = mapping[iconCode] || "cloud";
  return WEATHER_ICON_MAP[iconName] || Cloud;
}

function translateCondition(main: string): string {
  const translations: Record<string, string> = {
    Thunderstorm: "Tempestade",
    Drizzle: "Garoa",
    Rain: "Chuva",
    Snow: "Neve",
    Mist: "Névoa",
    Smoke: "Fumaça",
    Haze: "Neblina",
    Dust: "Poeira",
    Fog: "Nevoeiro",
    Clear: "Céu Limpo",
    Clouds: "Nublado",
  };

  return translations[main] || main;
}

export function WeatherCard({
  weather,
  status = "good",
  className,
}: WeatherCardProps) {
  const WeatherIcon = getWeatherIcon(weather.weather[0].icon);
  const condition = translateCondition(weather.weather[0].main);

  const timezoneOffset = weather.timezone ?? 0;

  // LÓGICA CORRIGIDA:
  // Se o nascer do sol no JSON é ~1764479460 (que equivale a 05:11 UTC),
  // e queremos exibir "05:11", não podemos subtrair o fuso horário de novo.
  // Tratamos o timestamp da API como a "Hora Absoluta da Cidade" e formatamos como UTC.
  function getCityAbsoluteDate(timestamp: number) {
    return new Date(timestamp * 1000);
  }

  // Para o "Agora", pegamos o UTC real e aplicamos o deslocamento manualmente
  // para alinhar com os dados de nascer/pôr do sol da API.
  function getCurrentCityDate() {
    const nowUTC = Math.floor(Date.now() / 1000);
    return new Date((nowUTC + timezoneOffset) * 1000);
  }

  const sunriseDate = getCityAbsoluteDate(weather.sys.sunrise);
  const sunsetDate = getCityAbsoluteDate(weather.sys.sunset);
  
  // Usamos o deslocamento manual apenas para o "Agora" para comparar maçãs com maçãs
  const nowAdjusted = getCurrentCityDate(); 

  // Formatador forçando UTC (para mostrar exatamente o número que está no timestamp)
  const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  // A lógica de dia/noite compara os timestamps brutos ajustados
  // Nota: aqui comparamos horas do dia (pegamos o timestamp do dia atual e aplicamos hora do nascer/pôr)
  // Mas para simplificar, se os dias forem os mesmos no JSON, podemos comparar direto:
  const isDay =
    nowAdjusted.getTime() >= sunriseDate.getTime() &&
    nowAdjusted.getTime() <= sunsetDate.getTime();

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-1">
              Clima Atual
            </h2>
            <p className="text-lg font-semibold text-gray-900">
              {weather.name}, {weather.sys.country}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {weekdayFormatter.format(nowAdjusted)}
            </p>
          </div>
          {status && <StatusBadge status={status} size="sm" />}
        </div>

        {/* Temperatura + Ícone */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold text-gray-900">
                {Math.round(weather.main.temp)}
              </span>
              <span className="text-3xl font-semibold text-gray-500">°C</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Sensação: {formatTemperature(weather.main.feels_like)}
            </p>
          </div>

          <div
            className={cn(
              "p-4 rounded-2xl",
              isDay ? "bg-yellow-50" : "bg-blue-50"
            )}
          >
            <WeatherIcon
              className={cn(
                "h-20 w-20",
                isDay ? "text-yellow-500" : "text-blue-400"
              )}
            />
          </div>
        </div>

        {/* Condição */}
        <div className="flex items-center justify-between py-4 border-t border-gray-100">
          <div>
            <p className="text-lg font-medium text-gray-900">{condition}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {weather.weather[0].description}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Min / Máx</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatTemperature(weather.main.temp_min)} /{" "}
              {formatTemperature(weather.main.temp_max)}
            </p>
          </div>
        </div>

        {/* Nascer/Pôr do Sol */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-50">
              <Sun className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nascer</p>
              <p className="text-sm font-medium text-gray-900">
                {timeFormatter.format(sunriseDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-50">
              <Moon className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pôr do Sol</p>
              <p className="text-sm font-medium text-gray-900">
                {timeFormatter.format(sunsetDate)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}