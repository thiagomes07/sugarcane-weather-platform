'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocations } from '@/hooks/useLocations';
import { getCurrentPosition, reverseGeocode, saveRecentLocation } from '@/lib/api/locations';
import type { LocationSearchResult } from '@/types/location';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LocationSearchProps {
  onSelect: (location: LocationSearchResult) => void;
  className?: string;
}

export function LocationSearch({ onSelect, className }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [gettingLocation, setGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useLocations({ query, enabled: query.length >= 2 });

  const results = data?.results || [];

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index quando results mudam
  useEffect(() => {
    setHighlightedIndex(0);
  }, [results]);

  const handleSelect = (location: LocationSearchResult) => {
    saveRecentLocation({
      name: location.name,
      state: location.state,
      country: location.country,
      lat: location.lat,
      lon: location.lon,
      display_name: location.display_name,
    });

    onSelect(location);
    setQuery(location.display_name);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleGetCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const position = await getCurrentPosition();
      const location = await reverseGeocode(position.lat, position.lon);

      if (location) {
        handleSelect(location);
        toast.success('Localização obtida com sucesso!');
      } else {
        toast.error('Não foi possível identificar sua localização');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao obter localização'
      );
    } finally {
      setGettingLocation(false);
    }
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Buscar localização..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleGetCurrentLocation}
          disabled={gettingLocation}
          title="Usar minha localização"
        >
          {gettingLocation ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Navigation className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Dropdown de resultados */}
      {isOpen && query.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-lg max-h-80 overflow-y-auto"
        >
          {isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Buscando localizações...
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <MapPin className="h-5 w-5 mx-auto mb-2 opacity-50" />
              Nenhuma localização encontrada.
              <br />
              Tente buscar por cidade ou região.
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <ul className="py-1">
              {results.map((location, index) => (
                <li key={`${location.lat}-${location.lon}-${index}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(location)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      'w-full px-4 py-3 text-left transition-colors',
                      'hover:bg-primary/5',
                      highlightedIndex === index && 'bg-primary/5',
                      'focus:outline-none focus:bg-primary/10'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {location.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {location.state && `${location.state}, `}
                          {location.country}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}