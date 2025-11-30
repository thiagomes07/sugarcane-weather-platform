"use client";

import { useState } from "react";
import { Calendar, ExternalLink, ImageOff, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProcessedNewsArticle } from "@/types/news";

interface NewsCardProps {
  article: ProcessedNewsArticle;
  className?: string;
  compact?: boolean; // Opção para esconder descrição se necessário
}

export function NewsCard({
  article,
  className,
  compact = false,
}: NewsCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border border-gray-100 bg-white transition-all duration-300 hover:shadow-md hover:border-gray-200",
        className
      )}
    >
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-full w-full"
      >
        {/* IMAGEM: Fixa à esquerda, quadrada ou retangular pequena */}
        <div className="relative w-24 sm:w-32 shrink-0 overflow-hidden bg-gray-50 border-r border-gray-100">
          {!imageError && article.image ? (
            <img
              src={article.image}
              alt={article.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <ImageOff className="h-6 w-6" />
            </div>
          )}
        </div>

        {/* CONTEÚDO: Ocupa o resto do espaço */}
        <div className="flex flex-1 flex-col justify-between p-3 sm:p-4 min-h-[100px]">
          <div className="space-y-2">
            {/* Header: Fonte e Data */}
            <div className="flex items-center justify-between text-xs">
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0 font-medium px-2 py-0.5"
              >
                {article.source}
              </Badge>
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {article.timeAgo}
              </span>
            </div>

            {/* Título */}
            <h3
              className="font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors text-sm sm:text-base"
              title={article.title}
            >
              {article.title}
            </h3>

            {/* Descrição (Opcional baseada no espaço) */}
            {!compact && article.description && (
              <p className="hidden sm:block text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {article.description}
              </p>
            )}
          </div>

          {/* Ícone de ação (aparece no hover) */}
          <div className="absolute bottom-3 right-3 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <div className="bg-blue-600 rounded-full p-1.5 text-white shadow-sm">
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </a>
    </Card>
  );
}
