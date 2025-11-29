'use client'

import { useEffect, useState } from "react"
import { Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface RateLimitWarningProps {
  retryAfter: number // segundos
  onExpire?: () => void
  variant?: "default" | "compact"
  className?: string
}

export function RateLimitWarning({
  retryAfter,
  onExpire,
  variant = "default",
  className,
}: RateLimitWarningProps) {
  const [remaining, setRemaining] = useState(retryAfter)

  useEffect(() => {
    setRemaining(retryAfter)

    const timer = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1
        if (next <= 0) {
          clearInterval(timer)
          onExpire?.()
          return 0
        }
        return next
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [retryAfter, onExpire])

  if (remaining <= 0) return null

  // Formatação de tempo
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const timeString =
    minutes > 0
      ? `${minutes}:${seconds.toString().padStart(2, "0")}`
      : `${seconds}s`

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-status-warning/10 px-3 py-1.5 text-xs font-medium text-status-warning border border-status-warning/20",
          className
        )}
      >
        <Clock className="h-3.5 w-3.5 animate-pulse" />
        <span>Aguarde {timeString}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-status-warning/10 border-l-4 border-status-warning p-4 shadow-sm",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="rounded-full bg-status-warning/20 p-2">
            <AlertTriangle className="h-5 w-5 text-status-warning" />
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold text-sm text-status-warning">
            Limite de Requisições Atingido
          </h3>
          <p className="text-sm text-gray-700">
            Você fez muitas requisições em um curto período. Para garantir um
            serviço estável para todos os usuários, por favor aguarde.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Clock className="h-4 w-4 text-status-warning animate-pulse" />
            <span className="text-sm font-medium text-status-warning">
              Tempo restante:{" "}
              <span className="font-mono text-base">{timeString}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Variante para uso em modais/botões
export function RateLimitBadge({
  remainingSeconds,
  className,
}: {
  remainingSeconds: number
  className?: string
}) {
  if (remainingSeconds <= 0) return null

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-status-warning/10 px-2.5 py-1 text-xs font-medium text-status-warning",
        className
      )}
    >
      <Clock className="h-3 w-3" />
      {remainingSeconds}s
    </span>
  )
}

// Hook para gerenciar cooldown
export function useRateLimitCooldown(initialSeconds?: number) {
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null)

  useEffect(() => {
    // Recuperar cooldown do localStorage ao montar
    const stored = localStorage.getItem("rateLimitCooldown")
    if (stored) {
      const date = new Date(stored)
      if (date > new Date()) {
        setCooldownUntil(date)
      } else {
        localStorage.removeItem("rateLimitCooldown")
      }
    }
  }, [])

  useEffect(() => {
    if (initialSeconds && initialSeconds > 0) {
      const until = new Date(Date.now() + initialSeconds * 1000)
      setCooldownUntil(until)
      localStorage.setItem("rateLimitCooldown", until.toISOString())
    }
  }, [initialSeconds])

  const isInCooldown = cooldownUntil && new Date() < cooldownUntil
  const remainingSeconds = isInCooldown
    ? Math.ceil((cooldownUntil.getTime() - Date.now()) / 1000)
    : 0

  const clearCooldown = () => {
    setCooldownUntil(null)
    localStorage.removeItem("rateLimitCooldown")
  }

  return {
    isInCooldown: !!isInCooldown,
    remainingSeconds,
    cooldownUntil,
    clearCooldown,
  }
}