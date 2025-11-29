import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary border border-primary/20",
        secondary:
          "bg-gray-100 text-gray-700 border border-gray-200",
        success:
          "bg-status-ideal/10 text-status-ideal border border-status-ideal/20",
        warning:
          "bg-status-warning/10 text-status-warning border border-status-warning/20",
        error:
          "bg-status-critical/10 text-status-critical border border-status-critical/20",
        info:
          "bg-blue-50 text-blue-700 border border-blue-200",
        outline:
          "bg-transparent text-foreground border border-gray-300",
        // Status específicos para cana-de-açúcar
        ideal:
          "bg-status-ideal/10 text-status-ideal border border-status-ideal/20",
        good:
          "bg-green-50 text-green-700 border border-green-200",
        attention:
          "bg-status-warning/10 text-status-warning border border-status-warning/20",
        critical:
          "bg-status-critical/10 text-status-critical border border-status-critical/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }