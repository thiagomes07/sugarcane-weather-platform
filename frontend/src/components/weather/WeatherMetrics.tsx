'use client';

import { Droplets, Wind, CloudRain, Eye, Gauge, Cloud } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  formatPercentage,
  formatWindSpeed,
  formatPressure,
  formatVisibility,
  formatRainfall,
} from '@/lib/utils/format';
import { getWindDirection } from '@/lib/constants/weather';
import type { CurrentWeather } from '@/types/weather';
import { cn } from '@/lib/utils';

interface WeatherMetricsProps {
  weather: CurrentWeather;
  className?: string;
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle?: string;
  iconColor: string;
  iconBgColor: string;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  iconColor,
  iconBgColor,
}: MetricCardProps) {
  return (
    <Card hover>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('p-2.5 rounded-xl', iconBgColor)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WeatherMetrics({ weather, className }: WeatherMetricsProps) {
  const rainfall24h = weather.rain?.['1h'] || 0;
  const windDirection = getWindDirection(weather.wind.deg);

  const metrics = [
    {
      icon: Droplets,
      label: 'Umidade',
      value: formatPercentage(weather.main.humidity),
      subtitle: getHumidityLevel(weather.main.humidity),
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-50',
    },
    {
      icon: Wind,
      label: 'Vento',
      value: formatWindSpeed(weather.wind.speed, 'ms'),
      subtitle: `${windDirection} • ${formatWindSpeed(weather.wind.speed, 'kmh')}`,
      iconColor: 'text-gray-600',
      iconBgColor: 'bg-gray-50',
    },
    {
      icon: CloudRain,
      label: 'Precipitação',
      value: formatRainfall(rainfall24h),
      subtitle: getRainfallLevel(rainfall24h),
      iconColor: 'text-blue-500',
      iconBgColor: 'bg-blue-50',
    },
    {
      icon: Gauge,
      label: 'Pressão',
      value: formatPressure(weather.main.pressure),
      subtitle: getPressureLevel(weather.main.pressure),
      iconColor: 'text-purple-600',
      iconBgColor: 'bg-purple-50',
    },
    {
      icon: Eye,
      label: 'Visibilidade',
      value: formatVisibility(weather.visibility),
      subtitle: getVisibilityLevel(weather.visibility),
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-50',
    },
    {
      icon: Cloud,
      label: 'Nebulosidade',
      value: formatPercentage(weather.clouds.all),
      subtitle: getCloudLevel(weather.clouds.all),
      iconColor: 'text-gray-500',
      iconBgColor: 'bg-gray-100',
    },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Métricas Climáticas
        </h3>
        <p className="text-sm text-muted-foreground">
          Condições atmosféricas detalhadas
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
    </div>
  );
}

// Helpers para categorizar valores
function getHumidityLevel(humidity: number): string {
  if (humidity < 30) return 'Muito baixa';
  if (humidity < 50) return 'Baixa';
  if (humidity < 70) return 'Moderada';
  if (humidity < 85) return 'Alta';
  return 'Muito alta';
}

function getRainfallLevel(mm: number): string {
  if (mm === 0) return 'Sem chuva';
  if (mm < 2.5) return 'Chuva leve';
  if (mm < 7.6) return 'Chuva moderada';
  if (mm < 50) return 'Chuva forte';
  return 'Chuva extrema';
}

function getPressureLevel(hpa: number): string {
  if (hpa < 1000) return 'Baixa pressão';
  if (hpa < 1020) return 'Normal';
  return 'Alta pressão';
}

function getVisibilityLevel(meters: number): string {
  if (meters < 1000) return 'Visibilidade reduzida';
  if (meters < 5000) return 'Moderada';
  return 'Boa visibilidade';
}

function getCloudLevel(percentage: number): string {
  if (percentage < 20) return 'Céu limpo';
  if (percentage < 50) return 'Poucas nuvens';
  if (percentage < 80) return 'Parcialmente nublado';
  return 'Muito nublado';
}