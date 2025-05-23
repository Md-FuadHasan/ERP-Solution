'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShoppingBasket, Eye, Edit, Trash2, Truck, XCircle } from 'lucide-react';
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
import type { PurchaseOrder, PurchaseOrderItem, Supplier, Product, POStatus, Warehouse, ProductUnitType } from '@/types';
import { PurchaseOrderForm, type PurchaseOrderFormValues } from '@/components/forms/purchase-order-form';
import { ReceiveStockForm, type ReceiveStockFormValues } from '@/components/forms/receive-stock-form';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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
    warehouses,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    cancelPurchaseOrder,
    getSupplierById,
    getProductById,
    processPOReceipt,
    isLoading
  } = useData();
  const { toast } = useToast();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [poToView, setPoToView] = useState<PurchaseOrder | null>(null);
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
  const [poToCancel, setPoToCancel] = useState<PurchaseOrder | null>(null);
  const [isCancelConfirmModalOpen, setIsCancelConfirmModalOpen] = useState(false);

  const [isReceiveStockModalOpen, setIsReceiveStockModalOpen] = useState(false);
  const [poToReceiveStock, setPoToReceiveStock] = useState<PurchaseOrder | null>(null);


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

  const handleCancelPOConfirm = (po: PurchaseOrder) => {
    setPoToCancel(po);
    setIsCancelConfirmModalOpen(true);
  };

  const confirmCancelPO = () => {
    if (poToCancel) {
      cancelPurchaseOrder(poToCancel.id);
      toast({ title: "Purchase Order Cancelled", description: `PO ${poToCancel.id} has been cancelled.` });
      setPoToCancel(null);
    }
    setIsCancelConfirmModalOpen(false);
  };


  const handleSubmitPO = (data: PurchaseOrderFormValues) => {
    // Calculate totals for each item
    const itemsWithTotals = data.items.map(item => ({
      ...item,
      total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      // Ensure quantityReceived is preserved or initialized for new items
      quantityReceived: item.id ? (editingPO?.items.find(i => i.id === item.id)?.quantityReceived || 0) : 0,
    }));

    // Calculate overall PO totals
    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = 0; // Assuming no tax on PO for now, can be a percentage of subtotal
    const totalAmount = subtotal + taxAmount;
    const supplier = getSupplierById(data.supplierId);

    const poDataForContext = {
      supplierId: data.supplierId,
      supplierName: supplier?.name || data.supplierId,
      orderDate: data.orderDate.toISOString(),
      expectedDeliveryDate: data.expectedDeliveryDate?.toISOString(),
      items: itemsWithTotals,
      subtotal,
      taxAmount,
      totalAmount,
      notes: data.notes,
    };

    if (editingPO) {
      updatePurchaseOrder({
        ...editingPO, // Spread existing PO to keep id, createdAt, status etc.
        ...poDataForContext, // Spread new/updated values
      });
      toast({
        title: "Purchase Order Updated",
        description: `Purchase Order ${editingPO.id} has been successfully updated.`,
      });
    } else {
      // addPurchaseOrder in DataContext will handle generating id, createdAt, default status, etc.
      addPurchaseOrder(poDataForContext as Omit<PurchaseOrder, 'id' | 'createdAt' | 'status'>);
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

  const handleOpenReceiveStockModal = (po: PurchaseOrder) => {
    setPoToReceiveStock(po);
    setIsReceiveStockModalOpen(true);
  };

  const handleReceiveStockSubmit = (data: ReceiveStockFormValues) => {
    const itemsToProcess = data.receivedItems
      .filter(item => (Number(item.quantityReceivedNow) || 0) > 0 && item.destinationWarehouseId)
      .map(item => ({
        poItemId: item.poItemId,
        productId: item.productId,
        quantityNewlyReceived: Number(item.quantityReceivedNow)!,
        warehouseId: item.destinationWarehouseId!,
        itemUnitType: item.itemUnitType,
      }));

    if (itemsToProcess.length > 0) {
      processPOReceipt(data.poId, itemsToProcess);
      toast({ title: "Stock Received", description: `Stock has been updated for PO ${data.poId}.` });
    } else {
      toast({ title: "No Stock Received", description: "No quantities were entered to receive.", variant: "default"});
    }
    setIsReceiveStockModalOpen(false);
    setPoToReceiveStock(null);
  };


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
                  <TableHead className="min-w-[100px] px-2">PO ID</TableHead>
                  <TableHead className="min-w-[150px] px-2">Supplier</TableHead>
                  <TableHead className="min-w-[100px] px-2">Order Date</TableHead>
                  <TableHead className="min-w-[100px] px-2">Exp. Delivery</TableHead>
                  <TableHead className="text-right min-w-[90px] px-2">Total</TableHead>
                  <TableHead className="min-w-[110px] px-2">Status</TableHead>
                  <TableHead className="text-right min-w-[200px] px-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(7)].map((_, i) => (
                  <TableRow key={`skel-po-${i}`} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50')}>
                    {[...Array(7)].map((_, j) => <TableCell key={j} className="px-2"><Skeleton className="h-5 w-full" /></TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : purchaseOrders.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2">PO ID</TableHead>
                  <TableHead className="min-w-[150px] px-2">Supplier</TableHead>
                  <TableHead className="min-w-[100px] px-2">Order Date</TableHead>
                  <TableHead className="min-w-[100px] px-2">Exp. Delivery</TableHead>
                  <TableHead className="text-right min-w-[90px] px-2">Total</TableHead>
                  <TableHead className="min-w-[110px] px-2">Status</TableHead>
                  <TableHead className="text-right min-w-[200px] px-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po, index) => (
                  <TableRow key={po.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell className="font-medium px-2">{po.id}</TableCell>
                    <TableCell className="px-2">{po.supplierName || getSupplierById(po.supplierId)?.name || po.supplierId}</TableCell>
                    <TableCell className="px-2">{format(new Date(po.orderDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="px-2">{po.expectedDeliveryDate ? format(new Date(po.expectedDeliveryDate), 'MMM dd, yyyy') : '-'}</TableCell>
                    <TableCell className="text-right px-2">${po.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="px-2"><Badge variant={getPOStatusBadgeVariant(po.status)}>{po.status}</Badge></TableCell>
                    <TableCell className="text-right px-2">
                      <div className="flex justify-end items-center gap-1">
                        {(po.status === 'Sent' || po.status === 'Partially Received') && (
                          <Button variant="outline" size="sm" onClick={() => handleOpenReceiveStockModal(po)} className="h-7 px-2 py-1 text-xs hover:bg-green-500/10 hover:border-green-500 hover:text-green-600">
                            <Truck className="mr-1 h-3 w-3" /> Receive
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleViewPO(po)} className="hover:text-primary" title="View PO"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditPO(po)} className="hover:text-primary" title="Edit PO" disabled={po.status !== 'Draft'}><Edit className="h-4 w-4" /></Button>
                        {(po.status === 'Draft' || po.status === 'Sent') && (
                           <Button variant="ghost" size="icon" onClick={() => handleCancelPOConfirm(po)} className="hover:text-destructive" title="Cancel PO"><XCircle className="h-4 w-4" /></Button>
                        )}
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
            {isFormModalOpen && (
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
                        <TableHead className="text-center px-3 py-2">Ordered</TableHead>
                        <TableHead className="text-center px-3 py-2">Received</TableHead>
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
                          <TableCell className="text-center px-3 py-2">{item.quantityReceived || 0}</TableCell>
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
            {(poForViewModal?.status === 'Draft' || poForViewModal?.status === 'Sent') && (
                <Button 
                    variant="destructive" 
                    onClick={() => {
                        if(poToView) {
                            setIsViewModalOpen(false); // Close view modal first
                            handleCancelPOConfirm(poToView); // Then open cancel confirm modal
                        }
                    }} 
                    className="w-full sm:w-auto"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Cancel PO
                </Button>
            )}
            <Button variant="outline" onClick={() => { if (poToView) { setIsViewModalOpen(false); handleEditPO(poToView); } }} className="w-full sm:w-auto" disabled={poToView?.status !== 'Draft'}>
              <Edit className="mr-2 h-4 w-4" /> Edit PO
            </Button>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReceiveStockModalOpen} onOpenChange={(isOpen) => { setIsReceiveStockModalOpen(isOpen); if(!isOpen) setPoToReceiveStock(null); }}>
        <DialogContent className="w-[95vw] max-w-2xl lg:max-w-3xl max-h-[95vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-4 border-b">
                <DialogTitle>Receive Stock for PO: {poToReceiveStock?.id}</DialogTitle>
                <DialogDescription>
                Enter quantities received and select destination warehouse for each item.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto p-6">
                {isReceiveStockModalOpen && poToReceiveStock && (
                    <ReceiveStockForm
                        purchaseOrder={poToReceiveStock}
                        warehouses={warehouses}
                        products={products}
                        onSubmit={handleReceiveStockSubmit}
                        onCancel={() => { setIsReceiveStockModalOpen(false); setPoToReceiveStock(null);}}
                        isSubmitting={isLoading}
                    />
                )}
            </div>
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

      <AlertDialog open={isCancelConfirmModalOpen} onOpenChange={setIsCancelConfirmModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent>Confirm Cancellation</AlertDialogTitleComponent>
            <AlertDialogDesc>
              Are you sure you want to cancel Purchase Order "{poToCancel?.id}"? This action cannot be undone.
            </AlertDialogDesc>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancel onClick={() => { setIsCancelConfirmModalOpen(false); setPoToCancel(null);}}>Keep PO</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelPO} className="bg-destructive hover:bg-destructive/90">Cancel PO</AlertDialogAction>
          </AlertDialogFooterComponent>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}