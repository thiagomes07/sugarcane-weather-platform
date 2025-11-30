
"use client";

import { useState } from "react";
import { Sprout, TrendingUp } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { LocationSearch } from "@/components/weather/LocationSearch";
import { WeatherCard } from "@/components/weather/WeatherCard";
import { WeatherMetrics } from "@/components/weather/WeatherMetrics";
import { SugarcaneAnalysis } from "@/components/weather/SugarcaneAnalysis";
import { ForecastChart } from "@/components/weather/ForecastChart";
import { WeatherSkeleton } from "@/components/weather/WeatherSkeleton";
import { InsightForm } from "@/components/insights/InsightForm";
import { InsightsList } from "@/components/insights/InsightsList";
import { InsightFilters } from "@/components/insights/InsightFilters";
import { NewsFeed } from "@/components/news/NewsFeed";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWeather } from "@/hooks/useWeather";
import { useInsightsTags } from "@/hooks/useInsights";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { SugarcaneQuotation } from "@/components/quotation/SugarcaneQuotation";

import type { LocationSearchResult } from "@/types/location";

export default function Home() {
  const [location, setLocation] = useState<LocationSearchResult | null>(null);
  const [showInsightForm, setShowInsightForm] = useState(false);
  const [insightSort, setInsightSort] = useState<"recent" | "popular">(
    "recent"
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const {
    data: weatherData,
    isLoading: isLoadingWeather,
    isError: isErrorWeather,
    error: weatherError,
    refetch: refetchWeather,
  } = useWeather({
    lat: location?.lat,
    lon: location?.lon,
    location_name: location?.display_name,
    enabled: !!location,
  });

  const availableTags = useInsightsTags([]);

  const handleLocationSelect = (selectedLocation: LocationSearchResult) => {
    setLocation(selectedLocation);
    setShowInsightForm(false);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // ============================================
  // ESTADO: Nenhuma localização selecionada (Hero)
  // ============================================
  if (!location) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-primary/5 to-white">
          <Container size="md">
            <div className="text-center space-y-8 py-16">
              {/* Hero Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
                  <div className="relative p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
                    <Sprout className="h-20 w-20 text-primary" />
                  </div>
                </div>
              </div>

              {/* Hero Text */}
              <div className="space-y-4">
                <Badge variant="success" className="mx-auto">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Sistema de Monitoramento Climático
                </Badge>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary leading-tight">
                  Dados Climáticos Inteligentes
                  <br />
                  para Cana-de-Açúcar
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Monitore condições climáticas em tempo real com análises
                  especializadas para cultivo. Compartilhe conhecimento com
                  outros produtores.
                </p>
              </div>

              {/* Search */}
              <div className="max-w-2xl mx-auto pt-4">
                <LocationSearch onSelect={handleLocationSelect} />
                <p className="text-xs text-muted-foreground mt-3">
                  Busque por cidade ou região para começar
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 max-w-4xl mx-auto">
                {[
                  {
                    title: "Análise Climática",
                    description:
                      "Dados em tempo real contextualizados para cana-de-açúcar",
                  },
                  {
                    title: "Comunidade",
                    description:
                      "Insights compartilhados por produtores de todo país",
                  },
                  {
                    title: "Notícias",
                    description:
                      "Últimas atualizações do agronegócio brasileiro",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // ============================================
  // ESTADO: Localização selecionada (Dashboard)
  // ============================================
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main id="main" className="flex-1 bg-gray-50/50">
        {/* Search Header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
          <Container>
            <div className="py-4 flex items-center gap-4">
              <div className="flex-1">
                <LocationSearch onSelect={handleLocationSelect} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(null)}
                className="hidden sm:inline-flex"
              >
                Limpar
              </Button>
            </div>
          </Container>
        </div>

        {/* Dashboard Content */}
        <Container className="py-8">
          {/* ✨ BOTÕES DE EXPORTAÇÃO - Variante Floating (Mobile) */}
          <ExportButtons
            weatherData={weatherData}
            location={location?.display_name}
            variant="floating"
            className="md:hidden"
          />

          {/* ✨ BOTÕES DE EXPORTAÇÃO - Variante Compact (Desktop, no topo) */}
          {weatherData && !isLoadingWeather && !isErrorWeather && (
            <div className="hidden md:flex justify-end mb-4">
              <ExportButtons
                weatherData={weatherData}
                location={location?.display_name}
                variant="compact"
              />
            </div>
          )}

          {/* Loading State */}
          {isLoadingWeather && <WeatherSkeleton />}

          {/* Error State */}
          {isErrorWeather && (
            <ErrorMessage
              title="Erro ao Carregar Dados Climáticos"
              message={
                weatherError instanceof Error
                  ? weatherError.message
                  : "Não foi possível carregar os dados. Tente novamente."
              }
              onRetry={refetchWeather}
              fullPage
            />
          )}

          {/* Success State */}
          {weatherData && !isLoadingWeather && !isErrorWeather && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Coluna Esquerda: Clima (2/3 do espaço) */}
              <div className="lg:col-span-2 space-y-8">
                {/* Weather Card */}
                <WeatherCard
                  weather={weatherData.current}
                  status={weatherData.sugarcane_analysis.overallStatus}
                />

                {/* Weather Metrics */}
                <WeatherMetrics weather={weatherData.current} />

                {/* Sugarcane Analysis */}
                <SugarcaneAnalysis weather={weatherData.current} />

                {/* Forecast Charts */}
                <ForecastChart forecast={weatherData.forecast} />

                {/* Quotation */}
                <div className="pt-6">
                  <SugarcaneQuotation />
                </div>

                {/* Insights Section (Mobile Only) */}
                <div className="lg:hidden space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Insights da Comunidade
                    </h2>
                    <Button
                      variant={showInsightForm ? "outline" : "default"}
                      size="sm"
                      onClick={() => setShowInsightForm(!showInsightForm)}
                    >
                      {showInsightForm ? "Cancelar" : "Compartilhar"}
                    </Button>
                  </div>

                  {showInsightForm && (
                    <InsightForm
                      location={{
                        name: location.name,
                        state: location.state,
                        country: location.country,
                        lat: location.lat,
                        lon: location.lon,
                      }}
                      weather={weatherData.current}
                      onSuccess={() => setShowInsightForm(false)}
                    />
                  )}

                  <InsightFilters
                    selectedSort={insightSort}
                    onSortChange={setInsightSort}
                    availableTags={availableTags}
                    selectedTags={selectedTags}
                    onTagToggle={handleTagToggle}
                  />

                  <InsightsList
                    location={location.name}
                    tags={selectedTags.length > 0 ? selectedTags : undefined}
                    sort={insightSort}
                    onCreateClick={() => setShowInsightForm(true)}
                  />
                </div>

                {/* News Section (Mobile Only) */}
                <div className="lg:hidden">
                  <NewsFeed category="SUGARCANE" pageSize={6} />
                </div>
              </div>

              {/* Coluna Direita: Insights + News (1/3 do espaço - Desktop Only) */}
              <div className="hidden lg:block space-y-8">
                {/* Insights Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Comunidade
                  </h2>
                  <Button
                    variant={showInsightForm ? "outline" : "default"}
                    size="sm"
                    onClick={() => setShowInsightForm(!showInsightForm)}
                  >
                    {showInsightForm ? "Cancelar" : "Compartilhar"}
                  </Button>
                </div>

                {/* Insight Form */}
                {showInsightForm && (
                  <InsightForm
                    location={{
                      name: location.name,
                      state: location.state,
                      country: location.country,
                      lat: location.lat,
                      lon: location.lon,
                    }}
                    weather={weatherData.current}
                    onSuccess={() => setShowInsightForm(false)}
                  />
                )}

                {/* Filters */}
                <InsightFilters
                  selectedSort={insightSort}
                  onSortChange={setInsightSort}
                  availableTags={availableTags}
                  selectedTags={selectedTags}
                  onTagToggle={handleTagToggle}
                />

                {/* Insights List */}
                <InsightsList
                  location={location.name}
                  tags={selectedTags.length > 0 ? selectedTags : undefined}
                  sort={insightSort}
                  onCreateClick={() => setShowInsightForm(true)}
                />

                {/* News Feed */}
                <div className="pt-8 border-t border-gray-200">
                  <NewsFeed category="SUGARCANE" pageSize={6} />
                </div>
              </div>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}