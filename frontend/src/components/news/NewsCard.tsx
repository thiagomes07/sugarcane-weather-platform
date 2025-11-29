'use client';

import { ExternalLink, Calendar, Newspaper } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProcessedNewsArticle } from '@/types/news';
import { cn } from '@/lib/utils';

interface NewsCardProps {
  article: ProcessedNewsArticle;
  className?: string;
}

export function NewsCard({ article, className }: NewsCardProps) {
  return (
    <Card hover className={className}>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        <CardContent className="p-0">
          {/* Image */}
          <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-gray-100">
            {article.image ? (
              <img
                src={article.image}
                alt={article.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            
            {/* Fallback quando não há imagem ou erro ao carregar */}
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5',
                article.image && 'hidden'
              )}
            >
              <Newspaper className="h-12 w-12 text-primary/30" />
            </div>

            {/* External Link Badge */}
            <div className="absolute top-3 right-3">
              <div className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Source + Date */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {article.source}
              </Badge>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{article.timeAgo}</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>

            {/* Description */}
            {article.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {article.description}
              </p>
            )}
          </div>
        </CardContent>
      </a>
    </Card>
  );
}