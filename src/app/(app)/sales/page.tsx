
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShoppingCart, Eye, Edit, Trash2 } from 'lucide-react';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useData } from '@/context/DataContext';
import type { SalesOrder, SalesOrderStatus, Customer, Product } from '@/types';
import { SalesOrderForm, type SalesOrderFormValues } from '@/components/forms/sales-order-form';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// TODO: Define badge variants for SalesOrderStatus if needed, similar to POStatus
const getSalesOrderStatusBadgeVariant = (status: SalesOrderStatus) => {
  switch (status) {
    case 'Draft': return 'poDraft'; // Reusing PO draft style for now
    case 'Confirmed': return 'poSent'; // Reusing PO sent style
    case 'Processing': return 'poPartiallyReceived'; // Reusing PO partial style
    case 'Ready for Dispatch': return 'default';
    case 'Dispatched': return 'default'; // Needs a specific style
    case 'Partially Invoiced': return 'statusPartiallyPaid';
    case 'Fully Invoiced': return 'poFullyReceived'; // Reusing PO full style
    case 'Cancelled': return 'poCancelled';
    default: return 'outline';
  }
};


export default function SalesPage() {
  const {
    salesOrders,
    addSalesOrder,
    updateSalesOrder, // Placeholder
    deleteSalesOrder, // Placeholder
    getCustomerById,
    isLoading
  } = useData();
  const { toast } = useToast();

  const [isSalesOrderFormModalOpen, setIsSalesOrderFormModalOpen] = useState(false);
  const [editingSalesOrder, setEditingSalesOrder] = useState<SalesOrder | null>(null);
  // Add states for view and delete modals if needed later

  const handleAddSalesOrder = () => {
    setEditingSalesOrder(null);
    setIsSalesOrderFormModalOpen(true);
  };

  const handleSubmitSalesOrder = (data: SalesOrderFormValues) => {
    const customer = getCustomerById(data.customerId);

    const itemsWithTotalsAndNames = data.items.map(item => {
        // Product name should ideally be fetched or pre-filled when product is selected in the form
        // For now, assuming product details are somehow available or just using productId
        const product = products.find(p => p.id === item.productId); // Assume products array is available via useData()
        return {
            ...item,
            productName: product?.name || item.productId,
            total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
        };
    });

    const subtotal = itemsWithTotalsAndNames.reduce((sum, item) => sum + item.total, 0);
    // Sales Order total usually doesn't include final invoice VAT yet.
    // It's a pre-VAT total unless specified otherwise.
    const totalAmount = subtotal; 

    const salesOrderData: Omit<SalesOrder, 'id' | 'createdAt' | 'status' | 'customerName' | 'salespersonName' | 'routeName'> = {
        customerId: data.customerId,
        salespersonId: data.salespersonId || undefined,
        routeId: data.routeId || undefined,
        orderDate: data.orderDate.toISOString(),
        expectedDeliveryDate: data.expectedDeliveryDate ? data.expectedDeliveryDate.toISOString() : undefined,
        items: itemsWithTotalsAndNames,
        subtotal,
        totalAmount,
        notes: data.notes,
        // status will be set to 'Draft' by default in addSalesOrder
    };


    if (editingSalesOrder) {
      // updateSalesOrder({
      //   ...editingSalesOrder,
      //   ...salesOrderDataForContext, // This needs to be properly constructed
      // });
      toast({ title: "Sales Order Updated", description: `Sales Order ${editingSalesOrder.id} updated.` });
      console.warn("Sales Order update not fully implemented yet beyond form submission.");
    } else {
      addSalesOrder(salesOrderData); 
      toast({ title: "Sales Order Created", description: "New sales order has been created." });
    }
    setIsSalesOrderFormModalOpen(false);
    setEditingSalesOrder(null);
  };

  // Temp products for SalesOrderForm, ideally from useData context
  const { products } = useData();


  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Sales Orders"
          description="Manage your sales orders, track customer requests, and streamline fulfillment."
          actions={
            <Button onClick={handleAddSalesOrder} className="w-full sm:w-auto" disabled={isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Sales Order
            </Button>
          }
        />
        {/* Add Search and Filter controls here later */}
      </div>

      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 lg:mt-8 mb-4 md:mb-6 lg:mb-8">
        <CardHeader className="border-b">
          <CardTitle>Sales Order List</CardTitle>
          <CardDescription>Overview of all sales orders.</CardDescription>
        </CardHeader>
        <div className="h-full overflow-y-auto">
          {isLoading ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2 text-sm">Order ID</TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm">Customer</TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm">Order Date</TableHead>
                  <TableHead className="min-w-[120px] px-2 text-sm">Salesperson</TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm">Route</TableHead>
                  <TableHead className="text-right min-w-[90px] px-2 text-sm">Total</TableHead>
                  <TableHead className="min-w-[110px] px-2 text-sm">Status</TableHead>
                  <TableHead className="text-right min-w-[150px] px-2 text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(7)].map((_, i) => (
                  <TableRow key={`skel-so-${i}`} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50')}>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2 text-xs">
                      <div className="flex justify-end items-center gap-1">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : salesOrders.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2 text-sm">Order ID</TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm">Customer</TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm">Order Date</TableHead>
                  <TableHead className="min-w-[120px] px-2 text-sm">Salesperson</TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm">Route</TableHead>
                  <TableHead className="text-right min-w-[90px] px-2 text-sm">Total</TableHead>
                  <TableHead className="min-w-[110px] px-2 text-sm">Status</TableHead>
                  <TableHead className="text-right min-w-[150px] px-2 text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOrders.map((so, index) => (
                  <TableRow key={so.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell className="font-medium px-2 text-xs">{so.id}</TableCell>
                    <TableCell className="px-2 text-xs">{so.customerName || getCustomerById(so.customerId)?.name || so.customerId}</TableCell>
                    <TableCell className="px-2 text-xs">{format(new Date(so.orderDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="px-2 text-xs">{so.salespersonName || so.salespersonId || '-'}</TableCell>
                    <TableCell className="px-2 text-xs">{so.routeName || so.routeId || '-'}</TableCell>
                    <TableCell className="text-right px-2 text-xs">${so.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="px-2 text-xs"><Badge variant={getSalesOrderStatusBadgeVariant(so.status)}>{so.status}</Badge></TableCell>
                    <TableCell className="text-right px-2 text-xs">
                      <div className="flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { /* handleViewSO(so) */ }} className="hover:text-primary" title="View Sales Order (Coming Soon)"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { /* handleEditSO(so) */ }} className="hover:text-primary" title="Edit Sales Order (Coming Soon)" disabled={so.status !== 'Draft'}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { /* handleDeleteSOConfirm(so) */ }} className="hover:text-destructive" title="Delete Sales Order (Coming Soon)"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <DataPlaceholder
                icon={ShoppingCart}
                title="No Sales Orders Yet"
                message="Start by creating your first sales order."
                action={<Button onClick={handleAddSalesOrder}><PlusCircle className="mr-2 h-4 w-4" /> Create New Sales Order</Button>}
              />
            </div>
          )}
        </div>
      </div>

      <Dialog open={isSalesOrderFormModalOpen} onOpenChange={(isOpen) => { setIsSalesOrderFormModalOpen(isOpen); if (!isOpen) setEditingSalesOrder(null); }}>
        <DialogContent className="w-[95vw] max-w-3xl lg:max-w-4xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingSalesOrder ? `Edit Sales Order: ${editingSalesOrder.id}` : 'Create New Sales Order'}</DialogTitle>
            <DialogDescription>
              {editingSalesOrder ? 'Update the details for this sales order.' : 'Fill in the details to create a new sales order.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
            {isSalesOrderFormModalOpen && (
              <SalesOrderForm
                initialData={editingSalesOrder}
                onSubmit={handleSubmitSalesOrder}
                onCancel={() => { setIsSalesOrderFormModalOpen(false); setEditingSalesOrder(null); }}
                isSubmitting={isLoading} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add AlertDialog for delete confirmation and Dialog for view details later */}
    </div>
  );
}

