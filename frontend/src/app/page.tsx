import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { RateLimitWarning } from "@/components/shared/RateLimitWarning";
import { Cloud, Droplets, Wind, Thermometer, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-white py-16 sm:py-24">
          <Container>
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <Badge variant="success" className="mx-auto">
                <TrendingUp className="h-3.5 w-3.5" />
                Sistema de Monitoramento Climático
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary leading-tight">
                Dados Climáticos Inteligentes para Cana-de-Açúcar
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Monitore condições climáticas em tempo real com análises
                especializadas para cultivo de cana-de-açúcar. Compartilhe
                conhecimento com outros produtores.
              </p>
              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <Button size="lg" className="gap-2">
                  <Cloud className="h-5 w-5" />
                  Consultar Clima
                </Button>
                <Button size="lg" variant="outline">
                  Ver Insights da Comunidade
                </Button>
              </div>
            </div>
          </Container>
        </section>

        {/* Demo Section - Mostrando Componentes */}
        <section className="py-16">
          <Container>
            <h2 className="text-3xl font-bold text-center mb-12">
              Componentes do Sistema
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card de Exemplo */}
              <Card hover>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-primary" />
                    Temperatura
                  </CardTitle>
                  <CardDescription>Condições atuais</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold">28°C</div>
                    <StatusBadge status="ideal" />
                    <p className="text-sm text-muted-foreground">
                      Temperatura ideal para crescimento
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Umidade */}
              <Card hover>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    Umidade
                  </CardTitle>
                  <CardDescription>Relativa do ar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold">65%</div>
                    <StatusBadge status="good" />
                    <p className="text-sm text-muted-foreground">
                      Umidade adequada
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Vento */}
              <Card hover>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wind className="h-5 w-5 text-gray-500" />
                    Vento
                  </CardTitle>
                  <CardDescription>Velocidade atual</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold">4 m/s</div>
                    <StatusBadge status="good" />
                    <p className="text-sm text-muted-foreground">
                      Vento leve, sem riscos
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estados de Loading */}
            <div className="mt-12 space-y-6">
              <h3 className="text-2xl font-semibold">Estados de Interface</h3>

              {/* Skeleton Loading */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Loading State (Skeleton)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              </div>

              {/* Loading Spinner */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Loading Spinner
                </h4>
                <Card>
                  <CardContent className="py-12">
                    <LoadingSpinner text="Carregando dados climáticos..." />
                  </CardContent>
                </Card>
              </div>

              {/* Error State */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Error Message
                </h4>
                <ErrorMessage
                  title="Erro ao Carregar Dados"
                  message="Não foi possível conectar ao serviço de clima. Verifique sua conexão e tente novamente."
                  onRetry={() => alert("Tentando novamente...")}
                />
              </div>

              {/* Rate Limit Warning */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Rate Limit Warning
                </h4>
                <RateLimitWarning retryAfter={60} />
              </div>

              {/* Status Badges */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Status Badges
                </h4>
                <div className="flex flex-wrap gap-3">
                  <StatusBadge status="ideal" />
                  <StatusBadge status="good" />
                  <StatusBadge status="attention" />
                  <StatusBadge status="critical" />
                </div>
              </div>

              {/* Buttons */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Buttons
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Button>Default</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="warning">Warning</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button loading>Loading...</Button>
                </div>
              </div>

              {/* Badges */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Badges
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <Container>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Recursos da Plataforma
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Ferramentas especializadas para maximizar sua produtividade no
                cultivo de cana-de-açúcar
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Análise Climática</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Dados em tempo real com análises contextualizadas para cada
                    fase de cultivo da cana-de-açúcar.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comunidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Compartilhe insights e aprenda com experiências de outros
                    produtores em diferentes regiões.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notícias</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Mantenha-se atualizado com as últimas notícias do
                    agronegócio e inovações do setor.
                  </p>
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
