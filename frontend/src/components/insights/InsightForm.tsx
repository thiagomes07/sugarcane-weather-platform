'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RateLimitBadge } from '@/components/shared/RateLimitWarning';
import { createInsightSchema, type CreateInsightFormData } from '@/lib/utils/validation';
import { useCreateInsight } from '@/hooks/useInsights';
import { useRateLimitHandler } from '@/hooks/useRateLimitHandler';
import type { CurrentWeather } from '@/types/weather';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InsightFormProps {
  location: {
    name: string;
    state?: string;
    country: string;
    lat: number;
    lon: number;
  };
  weather: CurrentWeather;
  onSuccess?: () => void;
  className?: string;
}

export function InsightForm({ location, weather, onSuccess, className }: InsightFormProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const { mutate: createInsight, isPending } = useCreateInsight();
  const { isInCooldown, remainingSeconds } = useRateLimitHandler();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateInsightFormData>({
    resolver: zodResolver(createInsightSchema),
    defaultValues: {
      authorName: '',
      authorRole: '',
      content: '',
      tags: [],
    },
  });

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();

    if (!trimmedTag) return;

    if (tags.length >= 5) {
      toast.error('Máximo de 5 tags permitidas');
      return;
    }

    if (tags.includes(trimmedTag)) {
      toast.error('Tag já adicionada');
      return;
    }

    if (trimmedTag.length < 2 || trimmedTag.length > 30) {
      toast.error('Tag deve ter entre 2 e 30 caracteres');
      return;
    }

    setTags([...tags, trimmedTag]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const onSubmit = (data: CreateInsightFormData) => {
    if (isInCooldown) {
      toast.error(`Aguarde ${remainingSeconds}s para publicar novamente`);
      return;
    }

    createInsight(
      {
        author: {
          name: data.authorName,
          role: data.authorRole,
        },
        location: {
          name: location.name,
          state: location.state,
          country: location.country,
          lat: location.lat,
          lon: location.lon,
        },
        weather_snapshot: {
          temperature: weather.main.temp,
          humidity: weather.main.humidity,
          condition: weather.weather[0].main,
          rainfall_24h: weather.rain?.['1h'] || 0,
        },
        content: data.content,
        tags,
      },
      {
        onSuccess: () => {
          reset();
          setTags([]);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Compartilhar Insight</CardTitle>
        <CardDescription>
          Compartilhe sua experiência com outros produtores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome do Autor */}
          <div>
            <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-1.5">
              Seu Nome <span className="text-red-500">*</span>
            </label>
            <Input
              id="authorName"
              placeholder="Ex: João Silva"
              error={!!errors.authorName}
              {...register('authorName')}
            />
            {errors.authorName && (
              <p className="text-xs text-status-critical mt-1">
                {errors.authorName.message}
              </p>
            )}
          </div>

          {/* Função (opcional) */}
          <div>
            <label htmlFor="authorRole" className="block text-sm font-medium text-gray-700 mb-1.5">
              Função <span className="text-muted-foreground text-xs">(opcional)</span>
            </label>
            <Input
              id="authorRole"
              placeholder="Ex: Produtor, Agrônomo"
              {...register('authorRole')}
            />
          </div>

          {/* Conteúdo */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1.5">
              Seu Insight <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              rows={4}
              placeholder="Compartilhe suas observações sobre o cultivo nessas condições climáticas..."
              className={cn(
                'flex w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm transition-all duration-200',
                'placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
                'hover:border-gray-400',
                errors.content && 'border-status-critical focus-visible:ring-status-critical'
              )}
              {...register('content')}
            />
            <div className="flex items-center justify-between mt-1.5">
              {errors.content && (
                <p className="text-xs text-status-critical">
                  {errors.content.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground ml-auto">
                Mínimo 10 caracteres
              </p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1.5">
              Tags <span className="text-muted-foreground text-xs">(máximo 5)</span>
            </label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Ex: colheita, irrigação"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                disabled={tags.length >= 5}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTag}
                disabled={tags.length >= 5 || !tagInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Lista de Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1.5">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-status-critical transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Localização (readonly) */}
          <div className="rounded-xl bg-gray-50 p-4 border border-gray-200">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Localização e Clima Atual:
            </p>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                {location.name}{location.state && `, ${location.state}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {Math.round(weather.main.temp)}°C • {weather.main.humidity}% umidade
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || isInCooldown}
              loading={isPending}
            >
              {isInCooldown ? (
                <>
                  <Clock className="h-4 w-4" />
                  Aguarde {remainingSeconds}s
                </>
              ) : isPending ? (
                'Publicando...'
              ) : (
                'Publicar Insight'
              )}
            </Button>

            {isInCooldown && (
              <RateLimitBadge remainingSeconds={remainingSeconds} />
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}