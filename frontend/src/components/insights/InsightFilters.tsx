'use client';

import { Clock, TrendingUp, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InsightFiltersProps {
  selectedSort: 'recent' | 'popular';
  onSortChange: (sort: 'recent' | 'popular') => void;
  availableTags?: string[];
  selectedTags?: string[];
  onTagToggle?: (tag: string) => void;
  className?: string;
}

export function InsightFilters({
  selectedSort,
  onSortChange,
  availableTags = [],
  selectedTags = [],
  onTagToggle,
  className,
}: InsightFiltersProps) {
  const showTags = availableTags.length > 0 && onTagToggle;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Sort Buttons */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Ordenar Por
          </h4>
          <div className="flex gap-2">
            <Button
              variant={selectedSort === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSortChange('recent')}
              className="flex-1 gap-2"
            >
              <Clock className="h-4 w-4" />
              Mais Recentes
            </Button>
            <Button
              variant={selectedSort === 'popular' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSortChange('popular')}
              className="flex-1 gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Populares
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tag Filters */}
      {showTags && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TagIcon className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold text-gray-900">
                Filtrar por Tags
              </h4>
            </div>

            {availableTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma tag disponível ainda
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-all',
                        'hover:scale-105 active:scale-95'
                      )}
                      onClick={() => onTagToggle(tag)}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            )}

            {selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectedTags.forEach((tag) => onTagToggle(tag))}
                className="mt-3 w-full"
              >
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}