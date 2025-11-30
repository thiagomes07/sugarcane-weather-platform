"use client";

import { Newspaper } from "lucide-react";
import { NewsCard } from "./NewsCard";
import { NewsSkeleton } from "./NewsSkeleton";
import { useNews } from "@/hooks/useNews";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NewsFeedProps {
  category?: "AGRIBUSINESS" | "SUGARCANE" | "WEATHER";
  pageSize?: number;
  className?: string;
  compactMode?: boolean; // Novo prop para forçar modo compacto
}

export function NewsFeed({
  category = "AGRIBUSINESS",
  pageSize = 5,
  className,
  compactMode = false,
}: NewsFeedProps) {
  const { data: articles, isLoading } = useNews({
    category,
    pageSize,
  });

  if (isLoading) {
    return <NewsSkeleton count={pageSize} className={className} />;
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <Newspaper className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma notícia encontrada.</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header simples */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-blue-600" />
          <h2 className="font-bold text-gray-900">Notícias do Setor</h2>
        </div>
        {/* Opcional: Link para ver mais */}
        <Button
          variant="link"
          size="sm"
          className="text-xs h-auto p-0 text-blue-600"
        >
          Ver todas
        </Button>
      </div>

      {/* Lista Vertical - Ocupa 100% da largura do pai */}
      <div className="flex flex-col gap-3">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} compact={compactMode} />
        ))}
      </div>

      <div className="mt-3 text-center border-t border-gray-100 pt-2">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">
          Fonte: NewsAPI • Atualizado agora
        </p>
      </div>
    </div>
  );
}
