
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShoppingBasket, Eye, Edit, Trash2 } from 'lucide-react';
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
import { useData } from '@/context/DataContext';
import type { PurchaseOrder, PurchaseOrderItem, Supplier, Product, POStatus } from '@/types';
import { PurchaseOrderForm, type PurchaseOrderFormValues } from '@/components/forms/purchase-order-form';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';


// Helper function for PO status badge variants
const getPOStatusBadgeVariant = (status: POStatus) => {
  switch (status) {
    case 'Draft': return 'poDraft';
    case 'Sent': return 'poSent';
    case 'Partially Received': return 'poPartiallyReceived';
    case 'Fully Received': return 'poFullyReceived';
    case 'Cancelled': return 'poCancelled';
    default: return 'outline';
  }
};


export default function PurchaseOrdersPage() {
  const {
    purchaseOrders,
    suppliers,
    products,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    getSupplierById,
    getProductById,
    isLoading
  } = useData();
  const { toast } = useToast();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [poToView, setPoToView] = useState<PurchaseOrder | null>(null);
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);

  const handleAddPO = () => {
    setEditingPO(null);
    setIsFormModalOpen(true);
  };

  const handleEditPO = (po: PurchaseOrder) => {
    setEditingPO(po);
    setIsFormModalOpen(true);
  };

  const handleViewPO = (po: PurchaseOrder) => {
    setPoToView(po);
    setIsViewModalOpen(true);
  };

  const handleDeletePOConfirm = (po: PurchaseOrder) => {
    setPoToDelete(po);
  };

  const confirmDeletePO = () => {
    if (poToDelete) {
      deletePurchaseOrder(poToDelete.id);
      toast({ title: "Purchase Order Deleted", description: `PO ${poToDelete.id} has been removed.` });
      setPoToDelete(null);
    }
  };

  const handleSubmitPO = (data: PurchaseOrderFormValues) => {
    const poDataForContext = {
      supplierId: data.supplierId,
      orderDate: data.orderDate.toISOString(),
      expectedDeliveryDate: data.expectedDeliveryDate?.toISOString(),
      items: data.items.map(item => ({
        ...item,
        productId: item.productId,
        quantity: item.quantity,
        unitType: item.unitType,
        unitPrice: item.unitPrice,
        total: (item.quantity || 0) * (item.unitPrice || 0)
      })),
      notes: data.notes,
      // status will be set in DataContext
    };

    if (editingPO) {
      updatePurchaseOrder({ ...editingPO, ...poDataForContext, status: editingPO.status }); // Preserve status on edit, totals recalculated in context
      toast({
        title: "Purchase Order Updated",
        description: `Purchase Order ${editingPO.id} has been successfully updated.`,
      });
    } else {
      addPurchaseOrder(poDataForContext);
      toast({
        title: "Purchase Order Created",
        description: "The new purchase order has been successfully added.",
      });
    }
    setIsFormModalOpen(false);
    setEditingPO(null);
  };

  const poForViewModal = useMemo(() => {
    if (!poToView) return null;
    const supplier = getSupplierById(poToView.supplierId);
    const itemsWithNames = poToView.items.map(item => {
      const product = getProductById(item.productId);
      return { ...item, productName: product?.name || item.productId };
    });
    return { ...poToView, supplierName: supplier?.name, items: itemsWithNames };
  }, [poToView, getSupplierById, getProductById]);


  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Purchase Orders"
          description="Manage your purchase orders with suppliers for raw materials and packaging."
          actions={
            <Button onClick={handleAddPO} className="w-full sm:w-auto" disabled={isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New PO
            </Button>
          }
        />
        {/* TODO: Add Search and filter controls here */}
      </div>

      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mb-4 md:mb-6 lg:mb-8">
        <CardHeader className="border-b">
          <CardTitle>Purchase Order List</CardTitle>
          <CardDescription>
            Overview of all purchase orders.
          </CardDescription>
        </CardHeader>
        <div className="h-full overflow-y-auto">
          {isLoading ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[120px] px-2">PO ID</TableHead>
                  <TableHead className="min-w-[180px] px-2">Supplier</TableHead>
                  <TableHead className="min-w-[120px] px-2">Order Date</TableHead>
                  <TableHead className="min-w-[120px] px-2">Exp. Delivery</TableHead>
                  <TableHead className="text-right min-w-[100px] px-2">Total</TableHead>
                  <TableHead className="min-w-[120px] px-2">Status</TableHead>
                  <TableHead className="text-right min-w-[130px] px-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(7)].map((_, i) => (
                  <TableRow key={`skel-po-${i}`} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50')}>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2">
                      <div className="flex justify-end items-center gap-1">
                        <Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : purchaseOrders.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[120px] px-2">PO ID</TableHead>
                  <TableHead className="min-w-[180px] px-2">Supplier</TableHead>
                  <TableHead className="min-w-[120px] px-2">Order Date</TableHead>
                  <TableHead className="min-w-[120px] px-2">Exp. Delivery</TableHead>
                  <TableHead className="text-right min-w-[100px] px-2">Total</TableHead>
                  <TableHead className="min-w-[120px] px-2">Status</TableHead>
                  <TableHead className="text-right min-w-[130px] px-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po, index) => (
                  <TableRow key={po.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell className="font-medium px-2">{po.id}</TableCell>
                    <TableCell className="px-2">{getSupplierById(po.supplierId)?.name || po.supplierId}</TableCell>
                    <TableCell className="px-2">{format(new Date(po.orderDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="px-2">{po.expectedDeliveryDate ? format(new Date(po.expectedDeliveryDate), 'MMM dd, yyyy') : '-'}</TableCell>
                    <TableCell className="text-right px-2">${po.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="px-2"><Badge variant={getPOStatusBadgeVariant(po.status)}>{po.status}</Badge></TableCell>
                    <TableCell className="text-right px-2">
                      <div className="flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewPO(po)} className="hover:text-primary" title="View PO"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditPO(po)} className="hover:text-primary" title="Edit PO"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePOConfirm(po)} className="hover:text-destructive" title="Delete PO"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-full flex items-center justify-center">
              <DataPlaceholder
                icon={ShoppingBasket}
                title="No Purchase Orders Yet"
                message="Create your first purchase order to start managing your procurement."
                action={<Button onClick={handleAddPO}><PlusCircle className="mr-2 h-4 w-4" /> Create New PO</Button>}
              />
            </div>
          )}
        </div>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => { setIsFormModalOpen(isOpen); if (!isOpen) setEditingPO(null); }}>
        <DialogContent className="w-[95vw] max-w-3xl lg:max-w-4xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingPO ? `Edit Purchase Order: ${editingPO.id}` : 'Create New Purchase Order'}</DialogTitle>
            <DialogDescription>
              {editingPO ? 'Update the details for this purchase order.' : 'Fill in the details to create a new purchase order.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
            {isFormModalOpen && ( // Conditionally render to ensure fresh state
              <PurchaseOrderForm
                initialData={editingPO}
                suppliers={suppliers}
                products={products}
                onSubmit={handleSubmitPO}
                onCancel={() => { setIsFormModalOpen(false); setEditingPO(null); }}
                isSubmitting={isLoading}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="w-[95vw] max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Purchase Order Details: {poForViewModal?.id}</DialogTitle>
            <DialogDescription>
              Viewing details for purchase order sent to {poForViewModal?.supplierName}.
            </DialogDescription>
          </DialogHeader>
          {poForViewModal && (
            <div className="flex-grow overflow-y-auto p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <div><strong>PO ID:</strong> {poForViewModal.id}</div>
                <div><strong>Supplier:</strong> {poForViewModal.supplierName || poForViewModal.supplierId}</div>
                <div><strong>Order Date:</strong> {format(new Date(poForViewModal.orderDate), 'PPP')}</div>
                <div><strong>Expected Delivery:</strong> {poForViewModal.expectedDeliveryDate ? format(new Date(poForViewModal.expectedDeliveryDate), 'PPP') : 'N/A'}</div>
                <div className="md:col-span-2"><strong>Status:</strong> <Badge variant={getPOStatusBadgeVariant(poForViewModal.status)}>{poForViewModal.status}</Badge></div>
              </div>
              {poForViewModal.notes && (
                <div>
                  <h4 className="font-semibold mb-1">Notes:</h4>
                  <p className="p-3 bg-muted rounded-md whitespace-pre-line">{poForViewModal.notes}</p>
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
                      {poForViewModal.items.map((item, index) => (
                        <TableRow key={item.id || index}>
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
                <div className="flex justify-end gap-2"><span>Subtotal:</span> <span className="font-medium">${poForViewModal.subtotal.toFixed(2)}</span></div>
                {poForViewModal.taxAmount !== undefined && (
                  <div className="flex justify-end gap-2"><span>Tax:</span> <span className="font-medium">${poForViewModal.taxAmount.toFixed(2)}</span></div>
                )}
                <div className="flex justify-end gap-2 text-lg font-semibold"><span>Total Amount:</span> <span>${poForViewModal.totalAmount.toFixed(2)}</span></div>
              </div>
            </div>
          )}
          <DialogFooter className="p-6 pt-4 border-t flex-col sm:flex-row">
            <Button variant="outline" onClick={() => { if (poToView) { setIsViewModalOpen(false); handleEditPO(poToView); } }} className="w-full sm:w-auto">
              <Edit className="mr-2 h-4 w-4" /> Edit PO
            </Button>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!poToDelete} onOpenChange={(isOpen) => !isOpen && setPoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent>Are you sure?</AlertDialogTitleComponent>
            <AlertDialogDesc>
              This action cannot be undone. This will permanently delete the purchase order "{poToDelete?.id}".
            </AlertDialogDesc>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancel onClick={() => setPoToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePO} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooterComponent>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
