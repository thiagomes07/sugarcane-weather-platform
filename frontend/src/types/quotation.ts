/**
 * Types para cotação de cana-de-açúcar
 * Baseado na resposta do endpoint /quotation
 */

export interface QuotationData {
  data: string; // ISO timestamp: "2025-11-03T00:00:00"
  data_formatada: string; // Formato legível: "03/11/2025"
  valor_campo: number | null; // Valor da cana no campo (R$/ton)
  valor_esteira: number | null; // Valor da cana na esteira (R$/ton)
}

export interface QuotationResponse {
  success: boolean;
  data: QuotationData[];
  cached: boolean;
  cached_at?: string;
  expires_at?: string;
}

export interface QuotationError {
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface QuotationStats {
  lastValueCampo: number | null;
  lastValueEsteira: number | null;
  variationCampo: number | null; // percentual
  variationEsteira: number | null; // percentual
  average_campo: number;
  average_esteira: number;
  max_campo: number;
  max_esteira: number;
  min_campo: number;
  min_esteira: number;
}

/**
 * Calcula estatísticas dos dados de cotação
 */
export function calculateQuotationStats(data: QuotationData[]): QuotationStats {
  if (!data || data.length === 0) {
    return {
      lastValueCampo: null,
      lastValueEsteira: null,
      variationCampo: null,
      variationEsteira: null,
      average_campo: 0,
      average_esteira: 0,
      max_campo: 0,
      max_esteira: 0,
      min_campo: 0,
      min_esteira: 0,
    };
  }

  // Filtra valores válidos
  const campoValues = data
    .map((d) => d.valor_campo)
    .filter((v): v is number => v !== null);
  const estoiraValues = data
    .map((d) => d.valor_esteira)
    .filter((v): v is number => v !== null);

  const firstCampo = campoValues[campoValues.length - 1];
  const lastCampo = campoValues[0];
  const firstEsteira = estoiraValues[estoiraValues.length - 1];
  const lastEsteira = estoiraValues[0];

  const variationCampo =
    firstCampo && lastCampo && firstCampo !== 0
      ? ((lastCampo - firstCampo) / firstCampo) * 100
      : null;

  const variationEsteira =
    firstEsteira && lastEsteira && firstEsteira !== 0
      ? ((lastEsteira - firstEsteira) / firstEsteira) * 100
      : null;

  return {
    lastValueCampo: lastCampo || null,
    lastValueEsteira: lastEsteira || null,
    variationCampo,
    variationEsteira,
    average_campo:
      campoValues.length > 0
        ? campoValues.reduce((a, b) => a + b, 0) / campoValues.length
        : 0,
    average_esteira:
      estoiraValues.length > 0
        ? estoiraValues.reduce((a, b) => a + b, 0) / estoiraValues.length
        : 0,
    max_campo: Math.max(...campoValues, 0),
    max_esteira: Math.max(...estoiraValues, 0),
    min_campo: Math.min(...campoValues, 0),
    min_esteira: Math.min(...estoiraValues, 0),
  };
}
