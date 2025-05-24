
'use client';
import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShoppingCart, Eye, Edit, Trash2, XCircle } from 'lucide-react';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc,
  AlertDialogFooter as AlertDialogFooterComponent,
  AlertDialogHeader as AlertDialogHeaderComponent,
  AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useData } from '@/context/DataContext';
import type { SalesOrder, SalesOrderStatus, Customer, Product, SalesOrderItem } from '@/types';
import { SalesOrderForm, type SalesOrderFormValues } from '@/components/forms/sales-order-form';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const getSalesOrderStatusBadgeVariant = (status?: SalesOrderStatus) => {
  if (!status) return 'outline';
  switch (status) {
    case 'Draft': return 'poDraft';
    case 'Confirmed': return 'default'; // Consider a specific 'confirmed' variant later
    case 'Processing': return 'secondary';
    case 'Ready for Dispatch': return 'outline';
    case 'Dispatched': return 'poSent'; // Using blue like PO 'Sent'
    case 'Partially Invoiced': return 'statusPartiallyPaid';
    case 'Fully Invoiced': return 'statusPaid';
    case 'Cancelled': return 'poCancelled';
    default: return 'outline';
  }
};


export default function SalesPage() {
  const {
    salesOrders,
    addSalesOrder,
    updateSalesOrder,
    deleteSalesOrder, // Placeholder for now, but will be used
    getCustomerById,
    getProductById, // Needed for view modal
    isLoading
  } = useData();
  const { toast } = useToast();

  const [isSalesOrderFormModalOpen, setIsSalesOrderFormModalOpen] = useState(false);
  const [editingSalesOrder, setEditingSalesOrder] = useState<SalesOrder | null>(null);
  const [salesOrderToView, setSalesOrderToView] = useState<SalesOrder | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [salesOrderToDelete, setSalesOrderToDelete] = useState<SalesOrder | null>(null);


  const handleAddSalesOrder = () => {
    setEditingSalesOrder(null);
    setIsSalesOrderFormModalOpen(true);
  };

  const handleEditSalesOrder = (so: SalesOrder) => {
    setEditingSalesOrder(so);
    setIsSalesOrderFormModalOpen(true);
  };

  const handleViewSalesOrder = (so: SalesOrder) => {
    setSalesOrderToView(so);
    setIsViewModalOpen(true);
  };

  const handleDeleteSalesOrderConfirm = (so: SalesOrder) => {
    setSalesOrderToDelete(so);
  };

  const confirmDeleteSalesOrder = () => {
    if (salesOrderToDelete) {
      deleteSalesOrder(salesOrderToDelete.id); // Assuming deleteSalesOrder exists and works
      toast({ title: "Sales Order Deleted", description: `Sales Order ${salesOrderToDelete.id} has been removed.` });
      setSalesOrderToDelete(null);
    }
  };


  const handleSubmitSalesOrder = (data: SalesOrderFormValues) => {
    const customer = getCustomerById(data.customerId);

    const itemsWithDetails = data.items.map(item => {
        const product = getProductById(item.productId);
        return {
            ...item, // id, productId, quantity, unitType, unitPrice (from form)
            productName: product?.name || item.productId,
            total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        };
    });

    const subtotal = itemsWithDetails.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = subtotal; // SO total is pre-VAT

    if (editingSalesOrder) {
      const updatedSO: SalesOrder = {
        ...editingSalesOrder,
        customerId: data.customerId,
        customerName: customer?.name || data.customerId,
        salespersonId: data.salespersonId,
        salespersonName: data.salespersonId ? `Salesperson ${data.salespersonId}` : undefined, // Placeholder
        routeId: data.routeId,
        routeName: data.routeId ? `Route ${data.routeId}` : undefined, // Placeholder
        orderDate: data.orderDate.toISOString(),
        expectedDeliveryDate: data.expectedDeliveryDate ? data.expectedDeliveryDate.toISOString() : undefined,
        items: itemsWithDetails,
        subtotal,
        totalAmount,
        notes: data.notes,
        // status remains unchanged by edit form, managed by other actions
      };
      updateSalesOrder(updatedSO);
      toast({ title: "Sales Order Updated", description: `Sales Order ${editingSalesOrder.id} updated.` });
    } else {
      const salesOrderDataForContext: Omit<SalesOrder, 'id' | 'createdAt' | 'status' | 'customerName' | 'salespersonName' | 'routeName' | 'subtotal' | 'totalAmount'> & { items: Array<Omit<SalesOrderItem, 'id'| 'total'>> } = {
        customerId: data.customerId,
        salespersonId: data.salespersonId,
        routeId: data.routeId,
        orderDate: data.orderDate.toISOString(),
        expectedDeliveryDate: data.expectedDeliveryDate ? data.expectedDeliveryDate.toISOString() : undefined,
        items: data.items, // Pass raw items, DataContext calculates totals/names
        notes: data.notes,
        shippingAddress: data.shippingAddress || customer?.shippingAddress || customer?.billingAddress, // Assuming these fields exist in SalesOrderFormValues
        billingAddress: data.billingAddress || customer?.billingAddress, // Assuming these fields exist in SalesOrderFormValues
      };
      addSalesOrder(salesOrderDataForContext);
      toast({ title: "Sales Order Created", description: "New sales order has been created." });
    }
    setIsSalesOrderFormModalOpen(false);
    setEditingSalesOrder(null);
  };

  const salesOrderForViewModal = useMemo(() => {
    if (!salesOrderToView) return null;
    const customer = getCustomerById(salesOrderToView.customerId);
    const items = salesOrderToView.items.map(item => ({
      ...item,
      productName: getProductById(item.productId)?.name || item.productId,
    }));
    return { ...salesOrderToView, customerName: customer?.name, items };
  }, [salesOrderToView, getCustomerById, getProductById]);


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
                        <Button variant="ghost" size="icon" onClick={() => handleViewSalesOrder(so)} className="hover:text-primary" title="View Sales Order"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditSalesOrder(so)} className="hover:text-primary" title="Edit Sales Order" disabled={so.status !== 'Draft'}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSalesOrderConfirm(so)} className="hover:text-destructive" title="Delete Sales Order"><Trash2 className="h-4 w-4" /></Button>
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

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="w-[95vw] max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Sales Order Details: {salesOrderForViewModal?.id}</DialogTitle>
            <DialogDescription>
              Viewing details for sales order for {salesOrderForViewModal?.customerName}.
            </DialogDescription>
          </DialogHeader>
          {salesOrderForViewModal && (
            <div className="flex-grow overflow-y-auto p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <div><strong>Order ID:</strong> {salesOrderForViewModal.id}</div>
                <div><strong>Customer:</strong> {salesOrderForViewModal.customerName || salesOrderForViewModal.customerId}</div>
                <div><strong>Order Date:</strong> {format(new Date(salesOrderForViewModal.orderDate), 'PPP')}</div>
                <div><strong>Exp. Delivery:</strong> {salesOrderForViewModal.expectedDeliveryDate ? format(new Date(salesOrderForViewModal.expectedDeliveryDate), 'PPP') : 'N/A'}</div>
                <div><strong>Salesperson:</strong> {salesOrderForViewModal.salespersonName || salesOrderForViewModal.salespersonId || '-'}</div>
                <div><strong>Route:</strong> {salesOrderForViewModal.routeName || salesOrderForViewModal.routeId || '-'}</div>
                <div className="md:col-span-2"><strong>Status:</strong> <Badge variant={getSalesOrderStatusBadgeVariant(salesOrderForViewModal.status)}>{salesOrderForViewModal.status}</Badge></div>
              </div>
              {salesOrderForViewModal.notes && (
                <div>
                  <h4 className="font-semibold mb-1">Notes:</h4>
                  <p className="p-3 bg-muted rounded-md whitespace-pre-line">{salesOrderForViewModal.notes}</p>
                </div>
              )}
              <div>
                <h4 className="font-semibold mb-1">Items:</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="px-3 py-2">Product</TableHead>
                        <TableHead className="text-center px-3 py-2">Qty</TableHead>
                        <TableHead className="px-3 py-2">Unit</TableHead>
                        <TableHead className="text-right px-3 py-2">Unit Price</TableHead>
                        <TableHead className="text-right px-3 py-2">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesOrderForViewModal.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="px-3 py-2">{item.productName}</TableCell>
                          <TableCell className="text-center px-3 py-2">{item.quantity}</TableCell>
                          <TableCell className="px-3 py-2">{item.unitType}</TableCell>
                          <TableCell className="text-right px-3 py-2">${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right px-3 py-2">${item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-1 text-right">
                <div className="flex justify-end gap-2"><span>Subtotal:</span> <span className="font-medium">${salesOrderForViewModal.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-end gap-2 text-lg font-semibold"><span>Order Total (Pre-VAT):</span> <span>${salesOrderForViewModal.totalAmount.toFixed(2)}</span></div>
              </div>
            </div>
          )}
          <DialogFooter className="p-6 pt-4 border-t flex-col sm:flex-row sm:justify-end gap-2">
             {salesOrderForViewModal?.status === 'Draft' && (
                <Button 
                    variant="outline" 
                    onClick={() => { if(salesOrderToView) { setIsViewModalOpen(false); setTimeout(() => handleEditSalesOrder(salesOrderToView), 100); }}} 
                    className="w-full sm:w-auto"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Order
                </Button>
            )}
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       <AlertDialog open={!!salesOrderToDelete} onOpenChange={(isOpen) => !isOpen && setSalesOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent>Are you sure?</AlertDialogTitleComponent>
            <AlertDialogDesc>
              This action cannot be undone. This will permanently delete Sales Order "{salesOrderToDelete?.id}".
            </AlertDialogDesc>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancel onClick={() => setSalesOrderToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSalesOrder} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooterComponent>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    