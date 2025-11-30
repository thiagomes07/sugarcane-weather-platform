'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InsightCard } from './InsightCard';
import { EmptyState } from './EmptyState';
import { useInsights } from '@/hooks/useInsights';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface InsightsListProps {
  location?: string;
  tags?: string[];
  sort?: 'recent' | 'popular';
  onCreateClick?: () => void;
  className?: string;
}

export function InsightsList({
  location,
  tags,
  sort = 'recent',
  onCreateClick,
  className,
}: InsightsListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInsights({ location, tags, sort });

  // Flatten pages into single array
  const insights = data?.pages.flatMap((page) => page.insights) || [];
  const totalInsights = data?.pages[0]?.total || 0;

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <InsightCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Erro ao Carregar Ideias"
        message={error instanceof Error ? error.message : 'Erro desconhecido'}
        onRetry={refetch}
        className={className}
      />
    );
  }

  if (insights.length === 0) {
    return (
      <EmptyState
        onCreateClick={onCreateClick}
        className={className}
      />
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Ideias da Comunidade
          </h3>
          <p className="text-sm text-muted-foreground">
            {totalInsights} {totalInsights === 1 ? 'insight compartilhado' : 'insights compartilhados'}
          </p>
        </div>
      </div>

      {/* Lista de Insights */}
      <div className="space-y-4">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="gap-2"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              'Carregar Mais Insights'
            )}
          </Button>
        </div>
      )}

      {/* End Message */}
      {!hasNextPage && insights.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Você viu todos as Ideias disponíveis
        </p>
      )}
    </div>
  );
}

function InsightCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
      <div className="flex items-start gap-3 mb-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      <div className="flex gap-2 mb-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );
}