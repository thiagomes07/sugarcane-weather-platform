'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import type { ForecastResponse } from '@/types/weather';
import { formatTemperature, formatRainfall, formatDateShort } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface ForecastChartProps {
  forecast: ForecastResponse;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  tempMin: number;
  tempMax: number;
  tempAvg: number;
  rainfall: number;
  humidity: number;
}

export function ForecastChart({ forecast, className }: ForecastChartProps) {
  // Processa dados para o gráfico
  const chartData = processForecastData(forecast);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Temperatura */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Previsão de Temperatura</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Próximos 5 dias
              </p>
            </div>
            <Badge variant="secondary">°C</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#9ca3af"
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#9ca3af"
                label={{ value: '°C', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
              />
              <Tooltip content={<CustomTooltip type="temperature" />} />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="tempMax"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Máxima"
                dot={{ fill: '#f59e0b', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="tempAvg"
                stroke="#2D5F2E"
                strokeWidth={2}
                name="Média"
                dot={{ fill: '#2D5F2E', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="tempMin"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Mínima"
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Precipitação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Previsão de Chuva</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Precipitação acumulada
              </p>
            </div>
            <Badge variant="secondary">mm</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#9ca3af"
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#9ca3af"
                label={{ value: 'mm', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
              />
              <Tooltip content={<CustomTooltip type="rainfall" />} />
              <Bar
                dataKey="rainfall"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
                name="Chuva"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Processa dados do forecast para o gráfico
function processForecastData(forecast: ForecastResponse): ChartDataPoint[] {
  const grouped = new Map<string, typeof forecast.list>();

  // Agrupa por dia
  forecast.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toISOString().split('T')[0];

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(item);
  });

  // Processa cada dia
  return Array.from(grouped.entries())
    .slice(0, 5)
    .map(([dateKey, items]) => {
      const temps = items.map((i) => i.main.temp);
      const rainfall = items.reduce((sum, i) => sum + (i.rain?.['3h'] || 0), 0);
      const humidity = items.reduce((sum, i) => sum + i.main.humidity, 0) / items.length;

      const date = new Date(dateKey);
      const dateLabel = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      });

      return {
        date: dateKey,
        dateLabel,
        tempMin: Math.min(...temps),
        tempMax: Math.max(...temps),
        tempAvg: temps.reduce((a, b) => a + b, 0) / temps.length,
        rainfall: Math.round(rainfall * 10) / 10,
        humidity: Math.round(humidity),
      };
    });
}

// Tooltip customizado
function CustomTooltip({ active, payload, type }: TooltipProps<any, any> & { type: 'temperature' | 'rainfall' }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-gray-900 mb-2">
        {data.dateLabel}
      </p>
      {type === 'temperature' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Máxima:</span>
            <span className="text-sm font-medium text-orange-600">
              {formatTemperature(data.tempMax)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Média:</span>
            <span className="text-sm font-medium text-primary">
              {formatTemperature(data.tempAvg)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Mínima:</span>
            <span className="text-sm font-medium text-blue-600">
              {formatTemperature(data.tempMin)}
            </span>
          </div>
        </div>
      )}
      {type === 'rainfall' && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">Chuva:</span>
          <span className="text-sm font-medium text-blue-600">
            {formatRainfall(data.rainfall)}
          </span>
        </div>
      )}
    </div>
  );
}