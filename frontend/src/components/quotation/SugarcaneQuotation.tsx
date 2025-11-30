"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useQuotation } from "@/hooks/useQuotation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { ExternalLink, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Componente para visualização da cotação de cana-de-açúcar
 * Dados: Campo vs Esteira (R$/ton)
 * Fonte: Notícias Agrícolas (webscraping)
 */
export function SugarcaneQuotation() {
  const { data, isLoading, error } = useQuotation();

  if (isLoading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Cotação da Cana-de-Açúcar
          </CardTitle>
          <CardDescription>R$/ton - Últimos 10 fechamentos</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <LoadingSpinner text="Carregando dados de cotação..." />
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Cotação da Cana-de-Açúcar
          </CardTitle>
          <CardDescription>R$/ton - Últimos 10 fechamentos</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <ErrorMessage
            title="Erro ao Carregar Cotação"
            message={
              error || "Nenhum dado disponível. Tente novamente mais tarde."
            }
            variant="warning"
          />
        </CardContent>
      </Card>
    );
  }

  // Prepara dados para o gráfico (inverte para ter o mais antigo à esquerda)
  const chartData = data
    .map((item) => ({
      name: item.data_formatada, // "03/11/2025"
      Campo: item.valor_campo || 0,
      Esteira: item.valor_esteira || 0,
      original: item,
    }))
    .reverse();

  // Calcula variação (última vs primeira)
  const firstData = data[data.length - 1];
  const lastData = data[0];
  const variacaoCampo =
    lastData.valor_campo && firstData.valor_campo
      ? (
          ((lastData.valor_campo - firstData.valor_campo) /
            firstData.valor_campo) *
          100
        ).toFixed(1)
      : null;
  const variacaoEsteira =
    lastData.valor_esteira && firstData.valor_esteira
      ? (
          ((lastData.valor_esteira - firstData.valor_esteira) /
            firstData.valor_esteira) *
          100
        ).toFixed(1)
      : null;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">
                Cotação da Cana-de-Açúcar
              </CardTitle>
            </div>
            <CardDescription>
              Comparativo Campo vs Esteira - Últimos 10 fechamentos (R$/ton)
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            Atualizado: {chartData[chartData.length - 1].name}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Gráfico */}
        <div className="h-80 rounded-lg border border-gray-200 bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                stroke="#d1d5db"
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                stroke="#d1d5db"
                label={{
                  value: "R$/ton",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 12, fill: "#6b7280" },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{
                  paddingBottom: "10px",
                }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="Campo"
                stroke="#2D5F2E"
                strokeWidth={2.5}
                dot={{ fill: "#2D5F2E", r: 4 }}
                activeDot={{ r: 6, fill: "#2D5F2E" }}
                name="Campo"
              />
              <Line
                type="monotone"
                dataKey="Esteira"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ fill: "#059669", r: 4 }}
                activeDot={{ r: 6, fill: "#059669" }}
                name="Esteira"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Campo (R$/ton)
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {lastData.valor_campo?.toFixed(2) || "N/A"}
              </span>
              {variacaoCampo && (
                <span
                  className={`text-sm font-medium ${
                    parseFloat(variacaoCampo) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {parseFloat(variacaoCampo) >= 0 ? "+" : ""}
                  {variacaoCampo}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Última cotação: {lastData.data_formatada}
            </p>
          </div>

          <div className="rounded-lg bg-green-50 p-4 border border-green-200">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Esteira (R$/ton)
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-700">
                {lastData.valor_esteira?.toFixed(2) || "N/A"}
              </span>
              {variacaoEsteira && (
                <span
                  className={`text-sm font-medium ${
                    parseFloat(variacaoEsteira) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {parseFloat(variacaoEsteira) >= 0 ? "+" : ""}
                  {variacaoEsteira}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Última cotação: {lastData.data_formatada}
            </p>
          </div>
        </div>

        {/* Diferença Campo vs Esteira */}
        {lastData.valor_campo && lastData.valor_esteira && (
          <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Diferença Esteira - Campo
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  R${" "}
                  {(lastData.valor_esteira - lastData.valor_campo).toFixed(2)}
                  /ton
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  A esteira custa{" "}
                  {(
                    ((lastData.valor_esteira - lastData.valor_campo) /
                      lastData.valor_campo) *
                    100
                  ).toFixed(1)}
                  % a mais que o campo
                </p>
              </div>
              <Badge variant="info" className="text-sm">
                Prêmio Esteira
              </Badge>
            </div>
          </div>
        )}

        {/* Rodapé com fonte e link */}
        <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-gray-900 mb-1">Fonte dos dados:</p>
            <p>Notícias Agrícolas - Cana Básica PR (web scraping)</p>
            <p className="mt-2">Atualização: Diária | Cache: 1 hora</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2 text-primary hover:text-primary/80"
          >
            <a
              href="https://www.noticiasagricolas.com.br/cotacoes/sucroenergetico/acucar-preco-da-cana-basica-pr"
              target="_blank"
              rel="noopener noreferrer"
            >
              Acessar Fonte
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Tooltip customizado para o gráfico
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4">
      <p className="text-sm font-semibold text-gray-900 mb-2">{data.name}</p>
      <div className="space-y-1">
        {payload.map((entry: any) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4"
          >
            <span className="text-xs text-gray-600">{entry.name}:</span>
            <span
              className="text-sm font-medium"
              style={{ color: entry.color }}
            >
              R$ {entry.value?.toFixed(2)}
            </span>
          </div>
        ))}
        {data.original?.valor_campo && data.original?.valor_esteira && (
          <div className="pt-2 border-t border-gray-200 mt-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-600">Diferença:</span>
              <span className="text-sm font-medium text-blue-600">
                R${" "}
                {(
                  data.original.valor_esteira - data.original.valor_campo
                ).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
