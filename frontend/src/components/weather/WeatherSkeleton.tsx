'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface WeatherSkeletonProps {
  className?: string;
}

export function WeatherSkeleton({ className }: WeatherSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Weather Card Skeleton */}
      <Card>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>

          {/* Temperature + Icon */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <Skeleton className="h-20 w-28" />
                <Skeleton className="h-12 w-12" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-24 w-24 rounded-2xl" />
          </div>

          {/* Condition */}
          <div className="flex items-center justify-between py-4 border-t border-gray-100">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-3 w-20 ml-auto" />
              <Skeleton className="h-5 w-24 ml-auto" />
            </div>
          </div>

          {/* Sunrise/Sunset */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weather Metrics Skeleton */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} hover>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sugarcane Analysis Skeleton */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Message */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-full" />
          </div>

          {/* Detailed Metrics */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl p-4 border-2 border-gray-100"
              >
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 rounded-full mt-0.5" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Phase */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-48" />
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-3 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast Charts Skeleton */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}