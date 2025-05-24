
import type { InvoiceStatus, SalesOrderStatus } from '@/types'; // Added SalesOrderStatus
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

export const getSalesOrderStatusBadgeVariant = (status: SalesOrderStatus): BadgeVariant => {
  switch (status) {
    case 'Draft': return 'soDraft';
    case 'Confirmed': return 'soConfirmed';
    case 'Processing': return 'soProcessing';
    case 'Ready for Dispatch': return 'soReadyDispatch';
    case 'Dispatched': return 'soDispatched';
    case 'Partially Invoiced': return 'soPartiallyInvoiced';
    case 'Fully Invoiced': return 'soFullyInvoiced';
    case 'Cancelled': return 'soCancelled';
    default: return 'outline';
  }
};
