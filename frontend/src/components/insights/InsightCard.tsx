'use client';

import { MapPin, Calendar, Thermometer, Droplets } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, formatTemperature, formatPercentage } from '@/lib/utils/format';
import type { Insight } from '@/types/insight';
import { cn } from '@/lib/utils';
import { translateWeatherCondition } from '@/lib/utils/weather';

interface InsightCardProps {
  insight: Insight;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-teal-500',
  ];

  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function InsightCard({ insight, className }: InsightCardProps) {
  const avatarColor = getAvatarColor(insight.author.name);
  const initials = getInitials(insight.author.name);

  return (
    <Card hover className={className}>
      <CardContent className="p-5">
        {/* Header: Avatar + Author Info */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className={cn(
              'flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-sm',
              avatarColor
            )}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {insight.author.name}
              </h3>
              {insight.author.role && (
                <Badge variant="secondary" className="text-xs">
                  {insight.author.role}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatRelativeTime(insight.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {insight.location.name}
                  {insight.location.state && `, ${insight.location.state}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
          {insight.content}
        </p>

        {/* Tags */}
        {insight.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {insight.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Weather Snapshot */}
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Condições Climáticas no Momento:
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-100">
                <Thermometer className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Temperatura</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatTemperature(insight.weather_snapshot.temperature)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100">
                <Droplets className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Umidade</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatPercentage(insight.weather_snapshot.humidity)}
                </p>
              </div>
            </div>

            <div className="flex-1 min-w-0 text-right">
              <p className="text-xs text-muted-foreground">Condição</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {translateWeatherCondition(insight.weather_snapshot.condition)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}