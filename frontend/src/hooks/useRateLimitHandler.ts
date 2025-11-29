/**
 * Hook para gerenciar cooldown de rate limiting
 * Persiste estado no localStorage e sincroniza entre abas
 */

import { useState, useEffect, useCallback } from 'react';

const RATE_LIMIT_STORAGE_KEY = 'rateLimitCooldown';
const STORAGE_EVENT = 'storage';

interface CooldownData {
  expiresAt: string; // ISO timestamp
  retryAfter: number; // segundos originais
}

export function useRateLimitHandler() {
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);

  // Recupera cooldown do localStorage ao montar
  useEffect(() => {
    const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (stored) {
      try {
        const data: CooldownData = JSON.parse(stored);
        const expiresAt = new Date(data.expiresAt);

        if (expiresAt > new Date()) {
          setCooldownUntil(expiresAt);
        } else {
          // Expirou, limpa
          localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
        }
      } catch (error) {
        console.error('[useRateLimitHandler] Erro ao ler localStorage:', error);
        localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
      }
    }
  }, []);

  // Sincroniza cooldown entre abas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === RATE_LIMIT_STORAGE_KEY) {
        if (e.newValue) {
          try {
            const data: CooldownData = JSON.parse(e.newValue);
            const expiresAt = new Date(data.expiresAt);

            if (expiresAt > new Date()) {
              setCooldownUntil(expiresAt);
            } else {
              setCooldownUntil(null);
            }
          } catch {
            setCooldownUntil(null);
          }
        } else {
          setCooldownUntil(null);
        }
      }
    };

    window.addEventListener(STORAGE_EVENT, handleStorageChange);
    return () => window.removeEventListener(STORAGE_EVENT, handleStorageChange);
  }, []);

  // Atualiza contador a cada segundo
  useEffect(() => {
    if (!cooldownUntil) return;

    const interval = setInterval(() => {
      const now = new Date();
      if (now >= cooldownUntil) {
        setCooldownUntil(null);
        localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const isInCooldown = cooldownUntil ? new Date() < cooldownUntil : false;

  const remainingSeconds = isInCooldown && cooldownUntil
    ? Math.ceil((cooldownUntil.getTime() - Date.now()) / 1000)
    : 0;

  const handleRateLimitError = useCallback((retryAfter: number) => {
    const expiresAt = new Date(Date.now() + retryAfter * 1000);
    setCooldownUntil(expiresAt);

    const data: CooldownData = {
      expiresAt: expiresAt.toISOString(),
      retryAfter,
    };

    try {
      localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[useRateLimitHandler] Erro ao salvar no localStorage:', error);
    }
  }, []);

  const clearCooldown = useCallback(() => {
    setCooldownUntil(null);
    localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
  }, []);

  return {
    isInCooldown,
    remainingSeconds,
    cooldownUntil,
    handleRateLimitError,
    clearCooldown,
  };
}