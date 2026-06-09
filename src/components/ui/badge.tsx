import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground border border-border",
        success: "bg-[#15803D]/20 text-[#4ade80] border border-[#15803D]/30",
        warning: "bg-[#D97706]/20 text-[#fbbf24] border border-[#D97706]/30",
        error: "bg-destructive/20 text-destructive border border-destructive/30",
        info: "bg-[#2563EB]/20 text-[#60a5fa] border border-[#2563EB]/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
