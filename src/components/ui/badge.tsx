
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
        // Invoice Status Colors
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
        // Customer Type Colors
        creditCustomer:
          "border-transparent bg-primary/70 text-primary-foreground hover:bg-primary/60",
        cashCustomer:
          "border-transparent bg-status-paid/70 text-status-paid-foreground hover:bg-status-paid/60",
        // Product Category Colors
        categoryFinishedGoods:
          "border-transparent bg-[hsl(var(--category-finished-goods-bg))] text-[hsl(var(--category-finished-goods-fg))] hover:bg-[hsl(var(--category-finished-goods-bg))]/80",
        categoryRawMaterials:
          "border-transparent bg-[hsl(var(--category-raw-materials-bg))] text-[hsl(var(--category-raw-materials-fg))] hover:bg-[hsl(var(--category-raw-materials-bg))]/80",
        categoryPackaging:
          "border-transparent bg-[hsl(var(--category-packaging-bg))] text-[hsl(var(--category-packaging-fg))] hover:bg-[hsl(var(--category-packaging-bg))]/80",
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

