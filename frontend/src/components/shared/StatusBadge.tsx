import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { WeatherStatus } from "@/lib/constants/weather"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: WeatherStatus
  label?: string
  showIcon?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const statusConfig: Record<
  WeatherStatus,
  {
    icon: typeof CheckCircle2
    variant: "ideal" | "good" | "attention" | "critical"
    defaultLabel: string
  }
> = {
  ideal: {
    icon: CheckCircle2,
    variant: "ideal",
    defaultLabel: "Ideal",
  },
  good: {
    icon: CheckCircle2,
    variant: "good",
    defaultLabel: "Bom",
  },
  attention: {
    icon: AlertTriangle,
    variant: "attention",
    defaultLabel: "Atenção",
  },
  critical: {
    icon: XCircle,
    variant: "critical",
    defaultLabel: "Crítico",
  },
}

const sizeConfig = {
  sm: {
    badge: "text-xs px-2 py-0.5",
    icon: "h-3 w-3",
  },
  md: {
    badge: "text-sm px-3 py-1",
    icon: "h-4 w-4",
  },
  lg: {
    badge: "text-base px-4 py-1.5",
    icon: "h-5 w-5",
  },
}

export function StatusBadge({
  status,
  label,
  showIcon = true,
  size = "md",
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const displayLabel = label || config.defaultLabel
  const sizeStyles = sizeConfig[size]

  return (
    <Badge
      variant={config.variant}
      className={cn(sizeStyles.badge, className)}
    >
      {showIcon && <Icon className={sizeStyles.icon} />}
      {displayLabel}
    </Badge>
  )
}

// Variante com pulso (para alertas ativos)
export function PulsingStatusBadge({
  status,
  label,
  className,
}: {
  status: WeatherStatus
  label?: string
  className?: string
}) {
  if (status !== "critical" && status !== "attention") {
    return <StatusBadge status={status} label={label} className={className} />
  }

  return (
    <div className="relative inline-flex">
      <StatusBadge status={status} label={label} className={className} />
      <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            status === "critical" ? "bg-status-critical" : "bg-status-warning"
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full h-3 w-3",
            status === "critical" ? "bg-status-critical" : "bg-status-warning"
          )}
        />
      </span>
    </div>
  )
}

// Variante com descrição detalhada
export function DetailedStatusBadge({
  status,
  label,
  description,
  className,
}: {
  status: WeatherStatus
  label?: string
  description: string
  className?: string
}) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl p-4 border-2",
        status === "ideal" && "bg-status-ideal/5 border-status-ideal/20",
        status === "good" && "bg-green-50 border-green-200",
        status === "attention" && "bg-status-warning/5 border-status-warning/20",
        status === "critical" && "bg-status-critical/5 border-status-critical/20",
        className
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 flex-shrink-0 mt-0.5",
          status === "ideal" && "text-status-ideal",
          status === "good" && "text-green-600",
          status === "attention" && "text-status-warning",
          status === "critical" && "text-status-critical"
        )}
      />
      <div className="flex-1 space-y-1">
        <StatusBadge status={status} label={label} showIcon={false} size="sm" />
        <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}   