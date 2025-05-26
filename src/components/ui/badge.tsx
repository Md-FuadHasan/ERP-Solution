
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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
        statusPaid: "border-transparent bg-green-100 text-green-700 hover:bg-green-100/80",
        statusDue: "border-transparent bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80",
        statusOverdue: "border-transparent bg-red-100 text-red-700 hover:bg-red-100/80",
 statusPartiallyPaid: "border-transparent bg-orange-100 text-orange-700 hover:bg-orange-100/80",
 statusPending: "border-transparent bg-blue-100 text-blue-700 hover:bg-blue-100/80",
        // Product Category Colors
        categoryFrozen:
          "border-transparent bg-[hsl(var(--category-frozen-bg))] text-[hsl(var(--category-frozen-fg))] hover:bg-[hsl(var(--category-frozen-bg))]/80",
        categoryRawMaterials:
          "border-transparent bg-[hsl(var(--category-raw-materials-bg))] text-[hsl(var(--category-raw-materials-fg))] hover:bg-[hsl(var(--category-raw-materials-bg))]/80",
        categoryPackaging:
          "border-transparent bg-[hsl(var(--category-packaging-bg))] text-[hsl(var(--category-packaging-fg))] hover:bg-[hsl(var(--category-packaging-bg))]/80",
        categoryDairy:
          "border-transparent bg-[hsl(var(--category-dairy-bg))] text-[hsl(var(--category-dairy-fg))] hover:bg-[hsl(var(--category-dairy-bg))]/80",
        categoryBeverages:
          "border-transparent bg-[hsl(var(--category-beverages-bg))] text-[hsl(var(--category-beverages-fg))] hover:bg-[hsl(var(--category-beverages-bg))]/80",
        // PO Status Colors
        poDraft:
          "border-transparent bg-[hsl(var(--status-po-draft-bg))] text-[hsl(var(--status-po-draft-fg))] hover:bg-[hsl(var(--status-po-draft-bg))]/80",
        poSent:
          "border-transparent bg-[hsl(var(--status-po-sent-bg))] text-[hsl(var(--status-po-sent-fg))] hover:bg-[hsl(var(--status-po-sent-bg))]/80",
        poPartiallyReceived:
          "border-transparent bg-[hsl(var(--status-po-partially-received-bg))] text-[hsl(var(--status-po-partially-received-fg))] hover:bg-[hsl(var(--status-po-partially-received-bg))]/80",
        poFullyReceived:
          "border-transparent bg-[hsl(var(--status-po-fully-received-bg))] text-[hsl(var(--status-po-fully-received-fg))] hover:bg-[hsl(var(--status-po-fully-received-bg))]/80",
        poCancelled:
          "border-transparent bg-[hsl(var(--status-po-cancelled-bg))] text-[hsl(var(--status-po-cancelled-fg))] hover:bg-[hsl(var(--status-po-cancelled-bg))]/80",
        // Sales Order Status Colors
        soDraft:
            "border-transparent bg-[hsl(var(--status-so-draft-bg))] text-[hsl(var(--status-so-draft-fg))] hover:bg-[hsl(var(--status-so-draft-bg))]/80",
        soConfirmed:
            "border-transparent bg-[hsl(var(--status-so-confirmed-bg))] text-[hsl(var(--status-so-confirmed-fg))] hover:bg-[hsl(var(--status-so-confirmed-bg))]/80",
        soProcessing:
            "border-transparent bg-[hsl(var(--status-so-processing-bg))] text-[hsl(var(--status-so-processing-fg))] hover:bg-[hsl(var(--status-so-processing-bg))]/80",
        soReadyDispatch:
            "border-transparent bg-[hsl(var(--status-so-ready-dispatch-bg))] text-[hsl(var(--status-so-ready-dispatch-fg))] hover:bg-[hsl(var(--status-so-ready-dispatch-bg))]/80",
        soDispatched:
            "border-transparent bg-[hsl(var(--status-so-dispatched-bg))] text-[hsl(var(--status-so-dispatched-fg))] hover:bg-[hsl(var(--status-so-dispatched-bg))]/80",
        soPartiallyInvoiced:
            "border-transparent bg-[hsl(var(--status-so-partially-invoiced-bg))] text-[hsl(var(--status-so-partially-invoiced-fg))] hover:bg-[hsl(var(--status-so-partially-invoiced-bg))]/80",
        soFullyInvoiced:
            "border-transparent bg-[hsl(var(--status-so-fully-invoiced-bg))] text-[hsl(var(--status-so-fully-invoiced-fg))] hover:bg-[hsl(var(--status-so-fully-invoiced-bg))]/80",
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
