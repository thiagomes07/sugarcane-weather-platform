'use client';

import { AlertCircle, CheckCircle2, AlertTriangle, Sprout } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, DetailedStatusBadge } from '@/components/shared/StatusBadge';
import {
  evaluateTemperature,
  evaluateHumidity,
  evaluateRainfall,
  evaluateWind,
  calculateOverallStatus,
  generateRecommendations,
  estimateCultivationPhase,
  CULTIVATION_PHASES,
  OVERALL_STATUS_MESSAGES,
} from '@/lib/constants/sugarcane';
import type { CurrentWeather } from '@/types/weather';
import type { WeatherStatus } from '@/lib/constants/weather';
import { cn } from '@/lib/utils';

interface SugarcaneAnalysisProps {
  weather: CurrentWeather;
  className?: string;
}

const STATUS_ICON_MAP = {
  ideal: CheckCircle2,
  good: CheckCircle2,
  attention: AlertTriangle,
  critical: AlertCircle,
};

export function SugarcaneAnalysis({ weather, className }: SugarcaneAnalysisProps) {
  // Extrai dados necessários
  const temperature = weather.main.temp;
  const humidity = weather.main.humidity;
  const rainfall24h = weather.rain?.['1h'] || 0;
  const windSpeed = weather.wind.speed;

  // Avalia cada variável
  const tempEval = evaluateTemperature(temperature);
  const humidityEval = evaluateHumidity(humidity);
  const rainfallEval = evaluateRainfall(rainfall24h);
  const windEval = evaluateWind(windSpeed);

  // Calcula status geral
  const overallStatus = calculateOverallStatus(
    tempEval.status,
    humidityEval.status,
    rainfallEval.status,
    windEval.status
  );

  // Gera recomendações
  const phase = estimateCultivationPhase();
  const phaseInfo = CULTIVATION_PHASES[phase];
  const recommendations = generateRecommendations(
    tempEval.status,
    humidityEval.status,
    rainfallEval.status,
    windEval.status,
    phase
  );

  const OverallIcon = STATUS_ICON_MAP[overallStatus];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Card Principal - Status Geral */}
      <Card className={cn(
        'border-2',
        overallStatus === 'ideal' && 'border-status-ideal/30 bg-status-ideal/5',
        overallStatus === 'good' && 'border-green-300 bg-green-50',
        overallStatus === 'attention' && 'border-status-warning/30 bg-status-warning/5',
        overallStatus === 'critical' && 'border-status-critical/30 bg-status-critical/5'
      )}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-3 rounded-xl',
              overallStatus === 'ideal' && 'bg-status-ideal/10',
              overallStatus === 'good' && 'bg-green-100',
              overallStatus === 'attention' && 'bg-status-warning/10',
              overallStatus === 'critical' && 'bg-status-critical/10'
            )}>
              <Sprout className={cn(
                'h-6 w-6',
                overallStatus === 'ideal' && 'text-status-ideal',
                overallStatus === 'good' && 'text-green-600',
                overallStatus === 'attention' && 'text-status-warning',
                overallStatus === 'critical' && 'text-status-critical'
              )} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Análise para Cana-de-Açúcar</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {phaseInfo.name} • {phaseInfo.duration}
              </p>
            </div>
            <StatusBadge status={overallStatus} size="lg" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Message */}
          <div className={cn(
            'flex items-start gap-3 p-4 rounded-xl',
            overallStatus === 'ideal' && 'bg-white',
            overallStatus === 'good' && 'bg-white',
            overallStatus === 'attention' && 'bg-white',
            overallStatus === 'critical' && 'bg-white'
          )}>
            <OverallIcon className={cn(
              'h-5 w-5 mt-0.5 flex-shrink-0',
              overallStatus === 'ideal' && 'text-status-ideal',
              overallStatus === 'good' && 'text-green-600',
              overallStatus === 'attention' && 'text-status-warning',
              overallStatus === 'critical' && 'text-status-critical'
            )} />
            <p className="text-sm text-gray-900 leading-relaxed">
              {OVERALL_STATUS_MESSAGES[overallStatus]}
            </p>
          </div>

          {/* Métricas Detalhadas */}
          <div className="space-y-3">
            <DetailedStatusBadge
              status={tempEval.status}
              label="Temperatura"
              description={tempEval.message}
            />
            <DetailedStatusBadge
              status={humidityEval.status}
              label="Umidade"
              description={humidityEval.message}
            />
            <DetailedStatusBadge
              status={rainfallEval.status}
              label="Precipitação"
              description={rainfallEval.message}
            />
            <DetailedStatusBadge
              status={windEval.status}
              label="Vento"
              description={windEval.message}
            />
          </div>

          {/* Recomendações */}
          {recommendations.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Recomendações
              </h4>
              <ul className="space-y-2">
                {recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="text-primary mt-0.5">•</span>
                    <span className="flex-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fase de Cultivo */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900">
                Fase de Cultivo Atual
              </h4>
              <Badge variant="secondary">{phaseInfo.name}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {phaseInfo.idealConditions.temperature} • {phaseInfo.idealConditions.rainfall}
            </p>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-700">Atividades Recomendadas:</p>
              {phaseInfo.keyActivities.slice(0, 2).map((activity, index) => (
                <p key={index} className="text-xs text-muted-foreground pl-3">
                  • {activity}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}