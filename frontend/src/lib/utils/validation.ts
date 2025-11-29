/**
 * Utilitários de Validação
 * Schemas Zod para formulários e validação de dados
 */

import { z } from 'zod';

// ============================================
// SCHEMAS DE INSIGHTS
// ============================================

/**
 * Schema para criação de insight
 */
export const createInsightSchema = z.object({
  authorName: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome não pode ter mais de 100 caracteres')
    .trim(),
  
  authorRole: z
    .string()
    .max(50, 'Função não pode ter mais de 50 caracteres')
    .optional(),
  
  content: z
    .string()
    .min(10, 'Conteúdo deve ter pelo menos 10 caracteres')
    .max(1000, 'Conteúdo não pode ter mais de 1000 caracteres')
    .trim(),
  
  tags: z
    .array(
      z
        .string()
        .min(2, 'Tag deve ter pelo menos 2 caracteres')
        .max(30, 'Tag não pode ter mais de 30 caracteres')
        .regex(
          /^[a-zA-Z0-9\u00C0-\u017F\s-]+$/,
          'Tag pode conter apenas letras, números, hífens e espaços'
        )
    )
    .max(5, 'Máximo de 5 tags permitidas')
    .default([]),
});

export type CreateInsightFormData = z.infer<typeof createInsightSchema>;

// ============================================
// SCHEMAS DE LOCALIZAÇÃO
// ============================================

/**
 * Schema para busca de localização
 */
export const searchLocationSchema = z.object({
  query: z
    .string()
    .min(2, 'Digite pelo menos 2 caracteres')
    .max(100, 'Busca muito longa')
    .trim(),
});

/**
 * Schema para coordenadas
 */
export const coordinatesSchema = z.object({
  lat: z
    .number()
    .min(-90, 'Latitude inválida')
    .max(90, 'Latitude inválida'),
  
  lon: z
    .number()
    .min(-180, 'Longitude inválida')
    .max(180, 'Longitude inválida'),
});

// ============================================
// SCHEMAS DE CONTATO (FUTURO)
// ============================================

/**
 * Schema para formulário de contato
 */
export const contactSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome muito longo')
    .trim(),
  
  email: z
    .string()
    .email('Email inválido')
    .trim()
    .toLowerCase(),
  
  subject: z
    .string()
    .min(5, 'Assunto deve ter pelo menos 5 caracteres')
    .max(200, 'Assunto muito longo')
    .trim(),
  
  message: z
    .string()
    .min(20, 'Mensagem deve ter pelo menos 20 caracteres')
    .max(2000, 'Mensagem muito longa')
    .trim(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// ============================================
// VALIDADORES CUSTOMIZADOS
// ============================================

/**
 * Valida email (regex simples)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida CPF (Brasil)
 */
export function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // CPFs com dígitos repetidos
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

/**
 * Valida CNPJ (Brasil)
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;
  
  // Validação dos dígitos verificadores
  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

/**
 * Valida telefone brasileiro
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  
  // Celular: (XX) 9XXXX-XXXX ou fixo: (XX) XXXX-XXXX
  return /^(\d{2})9?\d{8}$/.test(cleaned);
}

/**
 * Valida CEP brasileiro
 */
export function isValidCEP(cep: string): boolean {
  const cleaned = cep.replace(/\D/g, '');
  return /^\d{8}$/.test(cleaned);
}

/**
 * Valida URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida senha forte
 * Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
 */
export function isStrongPassword(password: string): boolean {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return minLength && hasUpperCase && hasLowerCase && hasNumber;
}

// ============================================
// SANITIZAÇÃO
// ============================================

/**
 * Sanitiza string removendo HTML/scripts
 */
export function sanitizeHTML(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Remove caracteres especiais mantendo apenas alfanuméricos
 */
export function sanitizeAlphanumeric(input: string): string {
  return input.replace(/[^a-zA-Z0-9\u00C0-\u017F\s-]/g, '').trim();
}

/**
 * Sanitiza input para nome de arquivo
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_');
}

// ============================================
// FORMATAÇÃO DE DADOS
// ============================================

/**
 * Formata CPF: 123.456.789-01
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ: 12.345.678/0001-90
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata telefone: (11) 98765-4321
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

/**
 * Formata CEP: 12345-678
 */
export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// ============================================
// HELPERS DE COMPARAÇÃO
// ============================================

/**
 * Compara duas strings ignorando case e acentos
 */
export function compareStrings(a: string, b: string): boolean {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  
  return normalize(a) === normalize(b);
}

/**
 * Verifica se string contém substring (case insensitive)
 */
export function containsString(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}