/**
 * Validação e exportação de variáveis de ambiente
 */

const requiredEnvVars = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
} as const;

const optionalEnvVars = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// Validação das variáveis obrigatórias
function validateEnv() {
  const missing: string[] = [];
  
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias não configuradas:\n${missing.join('\n')}\n\n` +
      `Crie um arquivo .env.local na raiz do projeto com:\n` +
      missing.map(key => `${key}=seu_valor_aqui`).join('\n')
    );
  }
}

// Executar validação apenas no cliente
if (typeof window !== 'undefined') {
  validateEnv();
}

export const env = {
  ...requiredEnvVars,
  ...optionalEnvVars,
  
  // Helpers
  isDevelopment: optionalEnvVars.NODE_ENV === 'development',
  isProduction: optionalEnvVars.NODE_ENV === 'production',
  
  // URLs configuradas
  apiUrl: requiredEnvVars.NEXT_PUBLIC_API_URL!,
  siteUrl: optionalEnvVars.NEXT_PUBLIC_SITE_URL,
} as const;

export type Env = typeof env;