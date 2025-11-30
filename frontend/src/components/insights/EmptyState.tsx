'use client';

import { MessageSquarePlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  onCreateClick?: () => void;
  className?: string;
}

export function EmptyState({ onCreateClick, className }: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed border-2', className)}>
      <CardContent className="py-12">
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          {/* Icon */}
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl" />
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
              <MessageSquarePlus className="h-12 w-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 animate-bounce">
              <div className="p-1.5 rounded-full bg-yellow-400 shadow-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          {/* Text */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Nenhuma Ideia Compartilhado Ainda
          </h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Seja o primeiro a compartilhar sua experiência com a comunidade!
            Ajude outros produtores com ideias sobre cultivo nessas condições
            climáticas.
          </p>

          {/* CTA */}
          {onCreateClick && (
            <Button
              onClick={onCreateClick}
              size="lg"
              className="gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <MessageSquarePlus className="h-5 w-5" />
              Compartilhar Minha Ideia
            </Button>
          )}

          {/* Decorative Elements */}
          <div className="flex items-center gap-2 mt-8">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-primary/20 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}