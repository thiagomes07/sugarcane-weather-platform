'use client';

import { Newspaper } from 'lucide-react';
import { NewsCard } from './NewsCard';
import { NewsSkeleton } from './NewsSkeleton';
import { useNews } from '@/hooks/useNews';
import { cn } from '@/lib/utils';

interface NewsFeedProps {
  category?: 'AGRIBUSINESS' | 'SUGARCANE' | 'WEATHER';
  pageSize?: number;
  className?: string;
}

export function NewsFeed({
  category = 'AGRIBUSINESS',
  pageSize = 9,
  className,
}: NewsFeedProps) {
  const { data: articles, isLoading } = useNews({
    category,
    pageSize,
  });

  if (isLoading) {
    return <NewsSkeleton className={className} />;
  }

  // Falha silenciosa: se não houver artigos, não mostra nada
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-50">
          <Newspaper className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Notícias do Agronegócio
          </h2>
          <p className="text-sm text-muted-foreground">
            Últimas atualizações do setor
          </p>
        </div>
      </div>

      {/* Grid de Notícias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pt-4">
        Notícias atualizadas a cada hora • Fonte: NewsAPI
      </p>
    </div>
  );
}