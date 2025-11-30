"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface NewsSkeletonProps {
  count?: number;
  className?: string;
}

export function NewsSkeleton({ count = 5, className }: NewsSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Fake */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Lista de Cards */}
      <div className="flex flex-col gap-3">
        {[...Array(count)].map((_, index) => (
          <Card
            key={index}
            className="flex overflow-hidden border-gray-100 h-28"
          >
            {/* Imagem Skeleton */}
            <Skeleton className="w-24 sm:w-32 h-full shrink-0" />

            {/* Conteúdo Skeleton */}
            <div className="flex-1 p-3 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
