/**
 * Utilitários de Clima
 * Helpers para processamento de dados climáticos e análise para cana-de-açúcar
 */

import {
  WEATHER_CONDITIONS,
  WEATHER_DESCRIPTIONS,
  WEATHER_ICONS,
  getWindDirection,
} from "@/lib/constants/weather";
import {
  evaluateTemperature,
  evaluateHumidity,
  evaluateRainfall,
  evaluateWind,
  calculateOverallStatus,
  generateRecommendations,
  estimateCultivationPhase,
  OVERALL_STATUS_MESSAGES,
} from "@/lib/constants/sugarcane";
import type {
  CurrentWeather,
  ForecastItem,
  SugarcaneAnalysis,
  ProcessedWeatherData,
} from "@/types/weather";

// ============================================
// TRADUÇÃO E FORMATAÇÃO
// ============================================

/**
 * Traduz condição climática para PT-BR
 */
export function translateWeatherCondition(condition: string): string {
  if (!condition) return "N/A";

  // Tenta encontrar a tradução exata
  if (WEATHER_CONDITIONS[condition]) {
    return WEATHER_CONDITIONS[condition];
  }

  // Tenta encontrar ignorando maiúsculas/minúsculas
  const lowerCondition = condition.toLowerCase();
  const foundKey = Object.keys(WEATHER_CONDITIONS).find(
    (key) => key.toLowerCase() === lowerCondition
  );

  if (foundKey) {
    return WEATHER_CONDITIONS[foundKey];
  }

  // Se não encontrar, retorna o original (fallback)
  return condition;
}

/**
 * Traduz descrição climática para PT-BR
 */
export function translateWeatherDescription(description: string): string {
  return WEATHER_DESCRIPTIONS[description.toLowerCase()] || description;
}

/**
 * Obtém ícone Lucide baseado no código da OpenWeather
 */
export function getWeatherIcon(iconCode: string): string {
  return WEATHER_ICONS[iconCode] || "cloud";
}

// ============================================
// PROCESSAMENTO DE DADOS
// ============================================

/**
 * Processa dados climáticos brutos para exibição
 */
export function processWeatherData(
  current: CurrentWeather,
  forecast: ForecastItem[]
): ProcessedWeatherData {
  const location = `${current.name}, ${current.sys.country}`;

  // Dados atuais
  const currentProcessed = {
    temp: current.main.temp,
    feelsLike: current.main.feels_like,
    condition: translateWeatherCondition(current.weather[0].main),
    conditionDescription: translateWeatherDescription(
      current.weather[0].description
    ),
    icon: getWeatherIcon(current.weather[0].icon),
    humidity: current.main.humidity,
    windSpeed: current.wind.speed,
    windDirection: getWindDirection(current.wind.deg),
    pressure: current.main.pressure,
    visibility: current.visibility,
    cloudCoverage: current.clouds.all,
    sunrise: new Date(current.sys.sunrise * 1000),
    sunset: new Date(current.sys.sunset * 1000),
    rainfall24h: current.rain?.["1h"] || 0,
  };

  // Previsão (agrupa por dia)
  const forecastProcessed = groupForecastByDay(forecast);

  // Análise para cana-de-açúcar
  const sugarcaneAnalysis = analyzeSugarcaneConditions(
    currentProcessed.temp,
    currentProcessed.humidity,
    currentProcessed.rainfall24h,
    currentProcessed.windSpeed
  );

  return {
    location,
    current: currentProcessed,
    forecast: forecastProcessed,
    sugarcaneAnalysis,
    alerts: [],
    lastUpdate: new Date(),
  };
}

/**
 * Agrupa previsão por dia (média de temperatura, soma de chuva)
 */
function groupForecastByDay(
  forecast: ForecastItem[]
): ProcessedWeatherData["forecast"] {
  const grouped = new Map<string, ForecastItem[]>();

  // Agrupa por dia
  forecast.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(item);
  });

  // Processa cada dia
  return Array.from(grouped.entries())
    .slice(0, 5) // Próximos 5 dias
    .map(([dateKey, items]) => {
      const temps = items.map((i) => i.main.temp);
      const rainfall = items.reduce((sum, i) => sum + (i.rain?.["3h"] || 0), 0);
      const avgPop = items.reduce((sum, i) => sum + i.pop, 0) / items.length;

      // Pega condição do meio-dia (mais representativo)
      const noonItem =
        items.find((i) => {
          const hour = new Date(i.dt * 1000).getHours();
          return hour >= 11 && hour <= 13;
        }) || items[0];

      return {
        date: new Date(dateKey),
        tempMin: Math.min(...temps),
        tempMax: Math.max(...temps),
        condition: translateWeatherCondition(noonItem.weather[0].main),
        icon: getWeatherIcon(noonItem.weather[0].icon),
        pop: avgPop,
        rainfall,
      };
    });
}

// ============================================
// ANÁLISE PARA CANA-DE-AÇÚCAR
// ============================================

/**
 * Analisa condições climáticas para cultivo de cana
 */
export function analyzeSugarcaneConditions(
  temperature: number,
  humidity: number,
  rainfall24h: number,
  windSpeed: number
): SugarcaneAnalysis {
  // Avalia cada variável
  const tempEval = evaluateTemperature(temperature);
  const humidityEval = evaluateHumidity(humidity);
  const rainfallEval = evaluateRainfall(rainfall24h);
  const windEval = evaluateWind(windSpeed);

  // Calcula status geral
  const overallStatus = calculateOverallStatus(
    tempEval.status,
    humidityEval.status,
    rainfallEval.status,
    windEval.status
  );

  // Identifica fase de cultivo (baseado na época do ano)
  const phase = estimateCultivationPhase();
  const phaseInfo = {
    planting: "Fase de Plantio",
    growing: "Fase de Crescimento Vegetativo",
    ripening: "Fase de Maturação",
    harvest: "Fase de Colheita",
  };

  // Gera recomendações
  const recommendations = generateRecommendations(
    tempEval.status,
    humidityEval.status,
    rainfallEval.status,
    windEval.status,
    phase
  );

  return {
    overallStatus,
    statusMessage: OVERALL_STATUS_MESSAGES[overallStatus],
    details: {
      temperature: {
        status: tempEval.status,
        message: tempEval.message,
        value: temperature,
        range: tempEval.range,
      },
      humidity: {
        status: humidityEval.status,
        message: humidityEval.message,
        value: humidity,
        range: humidityEval.range,
      },
      rainfall: {
        status: rainfallEval.status,
        message: rainfallEval.message,
        value: rainfall24h,
        range: rainfallEval.range,
      },
      wind: {
        status: windEval.status,
        message: windEval.message,
        value: windSpeed,
        range: windEval.range,
      },
    },
    recommendations,
    phase: phase as "planting" | "growing" | "ripening" | "harvest",
    phaseMessage: phaseInfo[phase as keyof typeof phaseInfo],
  };
}

// ============================================
// CÁLCULOS CLIMÁTICOS
// ============================================

/**
 * Calcula sensação térmica (se não fornecida pela API)
 * Fórmula simplificada baseada em temperatura e umidade
 */
export function calculateFeelsLike(
  temp: number,
  humidity: number,
  windSpeed: number
): number {
  // Heat Index (quando quente)
  if (temp >= 27) {
    const hi =
      -8.784695 +
      1.61139411 * temp +
      2.338549 * humidity -
      0.14611605 * temp * humidity -
      0.012308094 * temp * temp -
      0.016424828 * humidity * humidity +
      0.002211732 * temp * temp * humidity +
      0.00072546 * temp * humidity * humidity -
      0.000003582 * temp * temp * humidity * humidity;

    return Math.round(hi * 10) / 10;
  }

  // Wind Chill (quando frio e ventando)
  if (temp <= 10 && windSpeed > 1.34) {
    const wc =
      13.12 +
      0.6215 * temp -
      11.37 * Math.pow(windSpeed * 3.6, 0.16) +
      0.3965 * temp * Math.pow(windSpeed * 3.6, 0.16);

    return Math.round(wc * 10) / 10;
  }

  // Caso padrão: temperatura real
  return temp;
}

/**
 * Calcula ponto de orvalho (Dew Point)
 */
export function calculateDewPoint(temp: number, humidity: number): number {
  const a = 17.27;
  const b = 237.7;

  const alpha = (a * temp) / (b + temp) + Math.log(humidity / 100);
  const dewPoint = (b * alpha) / (a - alpha);

  return Math.round(dewPoint * 10) / 10;
}

/**
 * Determina se é dia ou noite baseado no timestamp e sunrise/sunset
 */
export function isDaytime(
  timestamp: number,
  sunrise: number,
  sunset: number
): boolean {
  return timestamp >= sunrise && timestamp <= sunset;
}

// ============================================
// HELPERS DE CLASSIFICAÇÃO
// ============================================

/**
 * Classifica qualidade do ar baseado em PM2.5 (se disponível)
 */
export function classifyAirQuality(pm25: number): {
  level: string;
  color: string;
  description: string;
} {
  if (pm25 <= 12) {
    return {
      level: "Bom",
      color: "text-green-600",
      description: "Ar limpo e saudável",
    };
  }
  if (pm25 <= 35.4) {
    return {
      level: "Moderado",
      color: "text-yellow-600",
      description: "Aceitável para a maioria",
    };
  }
  if (pm25 <= 55.4) {
    return {
      level: "Insalubre",
      color: "text-orange-600",
      description: "Grupos sensíveis podem ser afetados",
    };
  }
  return {
    level: "Muito Insalubre",
    color: "text-red-600",
    description: "Evite atividades ao ar livre",
  };
}

/**
 * Determina melhor horário para atividades agrícolas
 */
export function getBestWorkingHours(
  sunrise: Date,
  sunset: Date
): {
  morning: string;
  afternoon: string;
} {
  const morningStart = new Date(sunrise);
  morningStart.setHours(morningStart.getHours() + 1); // 1h após nascer do sol

  const morningEnd = new Date(sunrise);
  morningEnd.setHours(morningEnd.getHours() + 5); // 5h após nascer do sol

  const afternoonStart = new Date(sunset);
  afternoonStart.setHours(afternoonStart.getHours() - 3); // 3h antes do pôr do sol

  return {
    morning: `${morningStart.getHours()}h - ${morningEnd.getHours()}h`,
    afternoon: `${afternoonStart.getHours()}h - ${sunset.getHours()}h`,
  };
}
