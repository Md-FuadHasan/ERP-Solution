
import type { InvoiceStatus } from '@/types';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge'; // Correct import for badgeVariants type

// Define the return type based on the variants of the badge component
type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

export const getStatusBadgeVariant = (status: InvoiceStatus): BadgeVariant => {
  switch (status) {
    case 'Paid': return 'default'; // 'default' is often green or primary in shadcn themes
    case 'Sent': return 'secondary';
    case 'Overdue': return 'destructive';
    case 'Draft': return 'outline';
    case 'Cancelled': return 'outline';
    default: return 'outline';
  }
};
