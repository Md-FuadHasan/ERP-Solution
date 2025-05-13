
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // New specific variants for invoice statuses
        statusPaid: 
          "border-transparent bg-status-paid text-status-paid-foreground hover:bg-status-paid/80",
        statusPartiallyPaid: 
          "border-transparent bg-status-partially-paid text-status-partially-paid-foreground hover:bg-status-partially-paid/80",
        statusPending: 
          "border-transparent bg-status-pending text-status-pending-foreground hover:bg-status-pending/80",
        statusOverdue: 
          "border-transparent bg-status-overdue text-status-overdue-foreground hover:bg-status-overdue/80",
        statusCancelled: 
          "border-transparent bg-status-cancelled text-status-cancelled-foreground hover:bg-status-cancelled/80",
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

