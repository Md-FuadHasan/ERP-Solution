
import type { InvoiceStatus } from '@/types';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge'; 

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

export const getStatusBadgeVariant = (status: InvoiceStatus): BadgeVariant => {
  switch (status) {
    case 'Paid': return 'statusPaid'; 
    case 'Partially Paid': return 'statusPartiallyPaid'; 
    case 'Overdue': return 'statusOverdue';
    case 'Pending': return 'statusPending'; // 'Due' in request maps to 'Pending' for coloring
    case 'Cancelled': return 'statusCancelled';
    default: return 'outline'; // Fallback
  }
};
