import { AlertCircle, RefreshCw, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  onDismiss?: () => void
  variant?: "default" | "critical" | "warning"
  className?: string
  fullPage?: boolean
}

const variantConfig = {
  default: {
    icon: AlertCircle,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    iconColor: "text-red-500",
  },
  critical: {
    icon: XCircle,
    bgColor: "bg-status-critical/10",
    borderColor: "border-status-critical/30",
    textColor: "text-status-critical",
    iconColor: "text-status-critical",
  },
  warning: {
    icon: AlertCircle,
    bgColor: "bg-status-warning/10",
    borderColor: "border-status-warning/30",
    textColor: "text-status-warning",
    iconColor: "text-status-warning",
  },
}

export function ErrorMessage({
  title = "Erro",
  message,
  onRetry,
  retryLabel = "Tentar Novamente",
  onDismiss,
  variant = "default",
  className,
  fullPage = false,
}: ErrorMessageProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  const content = (
    <div
      className={cn(
        "rounded-xl border-2 p-6",
        config.bgColor,
        config.borderColor,
        className
      )}
      role="alert"
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <Icon className={cn("h-6 w-6", config.iconColor)} />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className={cn("font-semibold text-base", config.textColor)}>
            {title}
          </h3>
          <p className={cn("text-sm", config.textColor, "opacity-90")}>
            {message}
          </p>
          {(onRetry || onDismiss) && (
            <div className="flex gap-3 pt-2">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {retryLabel}
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="text-muted-foreground"
                >
                  Dispensar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (fullPage) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="max-w-md w-full">{content}</div>
      </div>
    )
  }

  return content
}

// Variante compacta (inline)
export function InlineError({
  message,
  className,
}: {
  message: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-status-critical",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}