
import type { InvoiceStatus } from '@/types';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge'; // Correct import for badgeVariants type

// Define the return type based on the variants of the badge component
type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

export const getStatusBadgeVariant = (status: InvoiceStatus): BadgeVariant => {
  switch (status) {
    case 'Received': return 'default'; // 'default' (often green/primary) for paid/received
    case 'Due': return 'secondary'; // 'secondary' for due/sent/overdue
    case 'Cancelled': return 'destructive'; // 'destructive' for cancelled
    case 'Draft': return 'outline';
    default: return 'outline';
  }
};

