/**
 * Constantes agronômicas para cana-de-açúcar
 * Baseado em pesquisas científicas (Embrapa, IAC, UFSCAR)
 *
 * Fontes:
 * - Embrapa: Sistemas de Produção - Cana-de-açúcar
 * - IAC: Instituto Agronômico de Campinas
 * - Universidades: ESALQ/USP, UFSCAR
 */

import type { WeatherStatus } from "./weather";

// ============================================
// FAIXAS IDEAIS POR VARIÁVEL CLIMÁTICA
// ============================================

/**
 * TEMPERATURA (°C)
 * - Crescimento ótimo: 25-35°C
 * - Germinação: 20-35°C
 * - Abaixo de 10°C: crescimento nulo
 * - Acima de 38°C: estresse hídrico severo
 */
export const TEMPERATURE_RANGES = {
  CRITICAL_LOW: {
    min: -Infinity,
    max: 10,
    status: "critical" as WeatherStatus,
  },
  ATTENTION_LOW: { min: 10, max: 18, status: "attention" as WeatherStatus },
  GOOD: { min: 18, max: 25, status: "good" as WeatherStatus },
  IDEAL: { min: 25, max: 33, status: "ideal" as WeatherStatus },
  ATTENTION_HIGH: { min: 33, max: 38, status: "attention" as WeatherStatus },
  CRITICAL_HIGH: {
    min: 38,
    max: Infinity,
    status: "critical" as WeatherStatus,
  },
} as const;

export function evaluateTemperature(temp: number): {
  status: WeatherStatus;
  message: string;
  range: string;
} {
  if (temp < 10) {
    return {
      status: "critical",
      message:
        "Temperatura crítica! Risco de geada e paralisação do crescimento.",
      range: "< 10°C",
    };
  }
  if (temp < 18) {
    return {
      status: "attention",
      message: "Temperatura baixa. Crescimento lento da cultura.",
      range: "10-18°C",
    };
  }
  if (temp < 25) {
    return {
      status: "good",
      message: "Temperatura adequada para desenvolvimento.",
      range: "18-25°C",
    };
  }
  if (temp <= 33) {
    return {
      status: "ideal",
      message: "Temperatura ideal! Condições ótimas para crescimento.",
      range: "25-33°C",
    };
  }
  if (temp <= 38) {
    return {
      status: "attention",
      message: "Temperatura elevada. Aumentar monitoramento de irrigação.",
      range: "33-38°C",
    };
  }
  return {
    status: "critical",
    message: "Temperatura crítica! Risco de estresse hídrico severo.",
    range: "> 38°C",
  };
}

/**
 * UMIDADE RELATIVA DO AR (%)
 * - Ideal: 60-85%
 * - Abaixo de 40%: Favorece pragas (broca, cigarrinha)
 * - Acima de 90%: Favorece doenças fúngicas
 */
export const HUMIDITY_RANGES = {
  CRITICAL_LOW: { min: 0, max: 30, status: "critical" as WeatherStatus },
  ATTENTION_LOW: { min: 30, max: 50, status: "attention" as WeatherStatus },
  GOOD: { min: 50, max: 60, status: "good" as WeatherStatus },
  IDEAL: { min: 60, max: 80, status: "ideal" as WeatherStatus },
  ATTENTION_HIGH: { min: 80, max: 90, status: "attention" as WeatherStatus },
  CRITICAL_HIGH: { min: 90, max: 100, status: "critical" as WeatherStatus },
} as const;

export function evaluateHumidity(humidity: number): {
  status: WeatherStatus;
  message: string;
  range: string;
} {
  if (humidity < 30) {
    return {
      status: "critical",
      message: "Umidade crítica! Alto risco de estresse hídrico e pragas.",
      range: "< 30%",
    };
  }
  if (humidity < 50) {
    return {
      status: "attention",
      message: "Umidade baixa. Monitorar irrigação e pragas.",
      range: "30-50%",
    };
  }
  if (humidity < 60) {
    return {
      status: "good",
      message: "Umidade adequada.",
      range: "50-60%",
    };
  }
  if (humidity <= 80) {
    return {
      status: "ideal",
      message: "Umidade ideal para o desenvolvimento.",
      range: "60-80%",
    };
  }
  if (humidity <= 90) {
    return {
      status: "attention",
      message: "Umidade elevada. Monitorar doenças fúngicas.",
      range: "80-90%",
    };
  }
  return {
    status: "critical",
    message: "Umidade crítica! Alto risco de ferrugem e outras doenças.",
    range: "> 90%",
  };
}

/**
 * PRECIPITAÇÃO (mm/24h)
 * - Necessidade anual: 1200-1500mm (bem distribuída)
 * - Ciclo de 12 meses: ~100-125mm/mês ideal
 * - Excesso: > 50mm/dia pode causar encharcamento
 */
export const RAINFALL_RANGES = {
  DROUGHT: { min: 0, max: 1, status: "critical" as WeatherStatus },
  LOW: { min: 1, max: 10, status: "attention" as WeatherStatus },
  GOOD: { min: 10, max: 30, status: "good" as WeatherStatus },
  IDEAL: { min: 30, max: 50, status: "ideal" as WeatherStatus },
  HEAVY: { min: 50, max: 80, status: "attention" as WeatherStatus },
  EXTREME: { min: 80, max: Infinity, status: "critical" as WeatherStatus },
} as const;

export function evaluateRainfall(rainfall24h: number): {
  status: WeatherStatus;
  message: string;
  range: string;
} {
  if (rainfall24h < 1) {
    return {
      status: "critical",
      message: "Ausência de chuva. Necessário monitorar reservas hídricas.",
      range: "< 1mm",
    };
  }
  if (rainfall24h < 10) {
    return {
      status: "attention",
      message: "Chuva insuficiente. Avaliar necessidade de irrigação.",
      range: "1-10mm",
    };
  }
  if (rainfall24h < 30) {
    return {
      status: "good",
      message: "Precipitação adequada.",
      range: "10-30mm",
    };
  }
  if (rainfall24h <= 50) {
    return {
      status: "ideal",
      message: "Precipitação ideal! Excelente reposição hídrica.",
      range: "30-50mm",
    };
  }
  if (rainfall24h <= 80) {
    return {
      status: "attention",
      message: "Chuva forte. Monitorar drenagem e erosão.",
      range: "50-80mm",
    };
  }
  return {
    status: "critical",
    message: "Chuva extrema! Risco de encharcamento e perda de nutrientes.",
    range: "> 80mm",
  };
}

/**
 * VENTO (m/s)
 * - Ideal: < 3 m/s (proteção contra quebra de colmos)
 * - Crítico: > 10 m/s (tombamento)
 */
export const WIND_RANGES = {
  CALM: { min: 0, max: 2, status: "ideal" as WeatherStatus },
  LIGHT: { min: 2, max: 5, status: "good" as WeatherStatus },
  MODERATE: { min: 5, max: 8, status: "attention" as WeatherStatus },
  STRONG: { min: 8, max: Infinity, status: "critical" as WeatherStatus },
} as const;

export function evaluateWind(windSpeed: number): {
  status: WeatherStatus;
  message: string;
  range: string;
} {
  if (windSpeed < 2) {
    return {
      status: "ideal",
      message: "Vento calmo. Condições ideais.",
      range: "< 2 m/s",
    };
  }
  if (windSpeed < 5) {
    return {
      status: "good",
      message: "Vento leve. Sem impacto significativo.",
      range: "2-5 m/s",
    };
  }
  if (windSpeed < 8) {
    return {
      status: "attention",
      message: "Vento moderado. Monitorar quebra de colmos.",
      range: "5-8 m/s",
    };
  }
  return {
    status: "critical",
    message: "Vento forte! Alto risco de tombamento e quebra.",
    range: "> 8 m/s",
  };
}

// ============================================
// FASES DE CULTIVO
// ============================================

export interface CultivationPhase {
  name: string;
  duration: string;
  idealConditions: {
    temperature: string;
    rainfall: string;
    humidity: string;
  };
  keyActivities: string[];
  risks: string[];
}

export const CULTIVATION_PHASES: Record<string, CultivationPhase> = {
  planting: {
    name: "Plantio",
    duration: "0-2 meses",
    idealConditions: {
      temperature: "20-32°C",
      rainfall: "30-50mm/semana (solo úmido)",
      humidity: "60-80%",
    },
    keyActivities: [
      "Preparo de solo",
      "Plantio de mudas ou toletes",
      "Adubação de base",
      "Controle inicial de plantas daninhas",
    ],
    risks: [
      "Déficit hídrico (prejudica brotação)",
      "Temperaturas < 18°C (baixa germinação)",
      "Excesso de chuva (apodrecimento)",
    ],
  },
  growing: {
    name: "Crescimento Vegetativo",
    duration: "3-7 meses",
    idealConditions: {
      temperature: "25-35°C",
      rainfall: "100-125mm/mês",
      humidity: "60-85%",
    },
    keyActivities: [
      "Adubação de cobertura",
      "Controle de plantas daninhas",
      "Monitoramento de pragas (broca, cigarrinha)",
      "Irrigação complementar (se necessário)",
    ],
    risks: [
      "Seca prolongada (> 15 dias sem chuva)",
      "Pragas (broca-da-cana, cigarrinha)",
      "Deficiência nutricional",
    ],
  },
  ripening: {
    name: "Maturação",
    duration: "8-11 meses",
    idealConditions: {
      temperature: "18-25°C (noites frias)",
      rainfall: "< 50mm/mês (déficit controlado)",
      humidity: "50-70%",
    },
    keyActivities: [
      "Aplicação de maturadores",
      "Redução de irrigação",
      "Suspensão de adubação",
      "Planejamento de colheita",
    ],
    risks: [
      "Excesso de chuva (dilui sacarose)",
      "Temperaturas > 30°C (dificulta maturação)",
      "Florescimento precoce",
    ],
  },
  harvest: {
    name: "Colheita",
    duration: "12-18 meses",
    idealConditions: {
      temperature: "20-30°C",
      rainfall: "< 30mm/mês (clima seco)",
      humidity: "50-70%",
    },
    keyActivities: [
      "Colheita mecanizada ou manual",
      "Queima controlada (se autorizado)",
      "Transporte rápido para usina (< 24h)",
      "Rebrota imediata",
    ],
    risks: [
      "Chuvas durante colheita (perda de qualidade)",
      "Ventos fortes (dificulta operação)",
      "Atraso no corte (queda de ATR)",
    ],
  },
};

// ============================================
// ANÁLISE INTEGRADA
// ============================================

/**
 * Determina a fase de cultivo mais provável baseada na época do ano (Brasil)
 * - Plantio: Setembro-Março (primavera/verão)
 * - Crescimento: Outubro-Maio
 * - Maturação: Abril-Julho (outono)
 * - Colheita: Maio-Novembro (inverno/primavera)
 */
export function estimateCultivationPhase(
  date: Date = new Date()
): keyof typeof CULTIVATION_PHASES {
  const month = date.getMonth(); // 0-11

  // Plantio: Set-Mar (8,9,10,11,0,1,2)
  if ([8, 9, 10, 11, 0, 1, 2].includes(month)) {
    return "planting";
  }

  // Maturação: Abr-Jul (3,4,5,6)
  if ([3, 4, 5, 6].includes(month)) {
    return "ripening";
  }

  // Colheita: Mai-Nov (4,5,6,7,8,9,10)
  if ([4, 5, 6, 7, 8, 9, 10].includes(month)) {
    return "harvest";
  }

  // Fallback: crescimento
  return "growing";
}

/**
 * Calcula status geral baseado nos 4 fatores
 */
export function calculateOverallStatus(
  tempStatus: WeatherStatus,
  humidityStatus: WeatherStatus,
  rainfallStatus: WeatherStatus,
  windStatus: WeatherStatus
): WeatherStatus {
  const statusPriority: Record<WeatherStatus, number> = {
    critical: 0,
    attention: 1,
    good: 2,
    ideal: 3,
  };

  const statuses = [tempStatus, humidityStatus, rainfallStatus, windStatus];
  const worstStatus = statuses.reduce((worst, current) => {
    return statusPriority[current] < statusPriority[worst] ? current : worst;
  });

  return worstStatus;
}

/**
 * Gera recomendações baseadas no status e fase
 */
export function generateRecommendations(
  tempStatus: WeatherStatus,
  humidityStatus: WeatherStatus,
  rainfallStatus: WeatherStatus,
  windStatus: WeatherStatus,
  phase: keyof typeof CULTIVATION_PHASES
): string[] {
  const recommendations: string[] = [];

  // Recomendações por temperatura
  if (tempStatus === "critical" || tempStatus === "attention") {
    if (tempStatus === "critical") {
      recommendations.push(
        "⚠️ Temperatura crítica detectada. Considere coberturas ou quebra-ventos."
      );
    }
    recommendations.push("🌡️ Monitorar temperatura diariamente.");
  }

  // Recomendações por umidade
  if (humidityStatus === "critical") {
    recommendations.push("💧 Avaliar sistema de irrigação imediatamente.");
  } else if (humidityStatus === "attention") {
    recommendations.push("💧 Aumentar frequência de monitoramento hídrico.");
  }

  // Recomendações por chuva
  if (rainfallStatus === "critical") {
    recommendations.push(
      "🌧️ Déficit ou excesso hídrico crítico. Ajustar irrigação/drenagem."
    );
  } else if (rainfallStatus === "attention") {
    recommendations.push("🌧️ Monitorar precipitação e solo.");
  }

  // Recomendações por vento
  if (windStatus === "critical") {
    recommendations.push(
      "💨 Ventos fortes! Suspender operações de campo se possível."
    );
  } else if (windStatus === "attention") {
    recommendations.push("💨 Ventos moderados. Cautela em operações aéreas.");
  }

  // Recomendações por fase
  const phaseInfo = CULTIVATION_PHASES[phase];
  if (
    phase === "planting" &&
    (rainfallStatus === "critical" || rainfallStatus === "attention")
  ) {
    recommendations.push(
      "🌱 Considere adiar plantio até normalização da chuva."
    );
  }
  if (
    phase === "harvest" &&
    rainfallStatus !== "ideal" &&
    rainfallStatus !== "good"
  ) {
    recommendations.push(
      "✂️ Chuvas podem afetar qualidade da colheita. Planejar janelas de corte."
    );
  }

  // Se tudo ideal
  if (recommendations.length === 0) {
    recommendations.push(
      `✅ Condições ideais para ${phaseInfo.name.toLowerCase()}!`
    );
    recommendations.push(
      `📋 Atividades recomendadas: ${phaseInfo.keyActivities[0]}`
    );
  }

  return recommendations.slice(0, 4); // Máximo 4 recomendações
}

/**
 * Mensagem resumida do status geral
 */
export const OVERALL_STATUS_MESSAGES: Record<WeatherStatus, string> = {
  ideal: "Condições ideais para o cultivo de cana-de-açúcar!",
  good: "Boas condições. Monitoramento de rotina recomendado.",
  attention: "Atenção necessária. Alguns fatores fora do ideal.",
  critical: "Alerta! Condições críticas detectadas. Ação imediata recomendada.",
};
