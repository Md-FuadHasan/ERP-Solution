
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  ShoppingCart,
  Eye,
  Edit,
  Trash2,
  Truck,
  XCircle,
  ArrowLeft,
  Filter as FilterIcon,
} from 'lucide-react';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as FormDialogDescription,
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
import { ALL_PO_STATUSES } from '@/types';
import { PurchaseOrderForm, type PurchaseOrderFormValues } from '@/components/forms/purchase-order-form';
import { ReceiveStockForm, type ReceiveStockFormValues } from '@/components/forms/receive-stock-form';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SearchInput } from '@/components/common/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    getSupplierById,
    getProductById,
    processPOReceipt,
    isLoading
  } = useData();
  const { toast } = useToast();
  const router = useRouter();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [poToView, setPoToView] = useState<PurchaseOrder | null>(null);
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
  const [poToCancel, setPoToCancel] = useState<PurchaseOrder | null>(null);
  const [isCancelConfirmModalOpen, setIsCancelConfirmModalOpen] = useState(false);

  const [isReceiveStockModalOpen, setIsReceiveStockModalOpen] = useState(false);
  const [poToReceiveStock, setPoToReceiveStock] = useState<PurchaseOrder | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<POStatus | 'all'>('all');


  const filteredPurchaseOrders = useMemo(() => {
    let filtered = [...purchaseOrders];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(po =>
        po.id.toLowerCase().includes(lowerSearchTerm) ||
        (po.supplierName && po.supplierName.toLowerCase().includes(lowerSearchTerm)) ||
        (getSupplierById(po.supplierId)?.name.toLowerCase().includes(lowerSearchTerm)) ||
        (po.orderDate && format(new Date(po.orderDate), 'MMM dd, yyyy').toLowerCase().includes(lowerSearchTerm))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(po => po.status === statusFilter);
    }
    // Default sort by order date, most recent first
    return filtered.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [purchaseOrders, searchTerm, statusFilter, getSupplierById]);


  const handleAddPO = useCallback(() => {
    setEditingPO(null);
    setIsFormModalOpen(true);
  }, []);

  const handleEditPO = useCallback((po: PurchaseOrder) => {
    if (po.status !== 'Draft') {
      toast({ title: "Cannot Edit", description: `Purchase Order ${po.id} is not in Draft status and cannot be edited.`, variant: "default" });
      return;
    }
    setEditingPO(po);
    setIsFormModalOpen(true);
  }, [toast]);

  const handleViewPO = useCallback((po: PurchaseOrder) => {
    setPoToView(po);
    setIsViewModalOpen(true);
  }, []);

  const handleDeletePOConfirm = useCallback((po: PurchaseOrder) => {
    setPoToDelete(po);
  }, []);

  const confirmDeletePO = useCallback(() => {
    if (poToDelete) {
      deletePurchaseOrder(poToDelete.id);
      toast({ title: "Purchase Order Deleted", description: `PO ${poToDelete.id} has been removed.` });
      setPoToDelete(null);
    }
  }, [poToDelete, deletePurchaseOrder, toast]);

  const handleCancelPOConfirm = useCallback((po: PurchaseOrder) => {
    if (po.status !== 'Draft' && po.status !== 'Sent') {
      toast({ title: "Cannot Cancel", description: `PO ${po.id} status is ${po.status}. Only Draft or Sent POs can be cancelled.`, variant: "default" });
      return;
    }
    setPoToCancel(po);
    setIsCancelConfirmModalOpen(true);
  }, [toast]);

  const confirmCancelPO = useCallback(() => {
    if (poToCancel) {
      updatePurchaseOrder({ ...poToCancel, status: 'Cancelled', updatedAt: new Date().toISOString() });
      toast({ title: "Purchase Order Cancelled", description: `PO ${poToCancel.id} has been cancelled.` });
      if (poToView && poToView.id === poToCancel.id) {
        setPoToView({ ...poToView, status: 'Cancelled', updatedAt: new Date().toISOString() });
      }
      setPoToCancel(null);
    }
    setIsCancelConfirmModalOpen(false);
  }, [poToCancel, updatePurchaseOrder, toast, poToView]);


  const handleSubmitPO = useCallback((data: PurchaseOrderFormValues) => {
    const itemsWithTotals = data.items.map(item => ({
      ...item,
      id: item.id || `po-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      quantityReceived: item.id && editingPO?.items.find(i => i.id === item.id)?.quantityReceived || 0,
    }));

    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = 0; // Assuming no PO-level tax for now
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
      let updatedStatus = editingPO.status;
      // Only transition from Draft to Sent automatically. Other statuses should be managed explicitly.
      if (editingPO.status === 'Draft' && itemsWithTotals.length > 0 && data.supplierId) {
          updatedStatus = 'Sent';
      }
      updatePurchaseOrder({
        ...editingPO,
        ...poDataForContext,
        status: updatedStatus, 
      });
      toast({
        title: "Purchase Order Updated",
        description: `Purchase Order ${editingPO.id} has been successfully updated. Status: ${updatedStatus}`,
      });
    } else {
      addPurchaseOrder(poDataForContext as Omit<PurchaseOrder, 'id' | 'createdAt' | 'status' | 'supplierName' | 'subtotal' | 'totalAmount' | 'taxAmount'> & { items: Array<Omit<PurchaseOrderItem, 'id' | 'total' | 'quantityReceived'| 'productName'>> });
      toast({
        title: "Purchase Order Created",
        description: "The new purchase order has been successfully added as Draft.",
      });
    }
    setIsFormModalOpen(false);
    setEditingPO(null);
  }, [editingPO, getSupplierById, updatePurchaseOrder, addPurchaseOrder, toast]);

  const poForViewModal = useMemo(() => {
    if (!poToView) return null;
    const supplier = getSupplierById(poToView.supplierId);
    const itemsWithProductDetails = poToView.items.map(item => {
      const product = getProductById(item.productId);
      return {
        ...item,
        productName: product?.name || item.productId,
        quantityReceived: typeof item.quantityReceived === 'number' ? item.quantityReceived : 0,
      };
    });
    return { ...poToView, supplierName: supplier?.name || poToView.supplierId, items: itemsWithProductDetails };
  }, [poToView, getSupplierById, getProductById]);

  const handleOpenReceiveStockModal = useCallback((po: PurchaseOrder) => {
    if (po.status !== 'Sent' && po.status !== 'Partially Received') {
       toast({ title: "Cannot Receive Stock", description: `PO ${po.id} is in ${po.status} status. Only Sent or Partially Received POs can receive stock.`, variant: "default" });
       return;
    }
    setPoToReceiveStock(po);
    setIsReceiveStockModalOpen(true);
  }, [toast]);

  const handleReceiveStockSubmit = useCallback((data: ReceiveStockFormValues) => {
    const itemsToProcess = data.receivedItems
      .filter(item => (Number(item.quantityReceivedNow) || 0) > 0 && item.destinationWarehouseId)
      .map(item => ({
        poItemId: item.poItemId,
        productId: item.productId,
        quantityNewlyReceived: Number(item.quantityReceivedNow)!,
        warehouseId: item.destinationWarehouseId!,
        itemUnitType: item.itemUnitType, // Pass the unit type from PO item
      }));

    if (itemsToProcess.length > 0) {
      processPOReceipt(data.poId, itemsToProcess);
      toast({ title: "Stock Received", description: `Stock has been updated for PO ${data.poId}.` });
      if (poToView && poToView.id === data.poId) {
        const updatedPOFromContext = purchaseOrders.find(p => p.id === data.poId);
        if (updatedPOFromContext) {
          setPoToView(updatedPOFromContext);
        }
      }
    } else {
      toast({ title: "No Stock Received", description: "No quantities were entered to receive.", variant: "default"});
    }
    setIsReceiveStockModalOpen(false);
    setPoToReceiveStock(null);
  }, [processPOReceipt, toast, poToView, purchaseOrders]);

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
        <div className="mt-4 flex flex-wrap items-center justify-between gap-y-4"> {/* Removed gap-x-6 */}
           {/* Group for filters - takes 50% width on sm screens and up */}
           <div className="flex flex-col sm:flex-row w-full sm:w-1/2 gap-4"> {/* gap-4 for internal spacing */}
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by PO ID, Supplier..."
                className="w-full sm:w-[45%]" // Takes 45% of its parent (the 50% group)
              />
              <div className="relative w-full sm:w-[40%]"> {/* Takes 40% of its parent */}
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as POStatus | 'all')}
                >
                  <SelectTrigger className="w-full pl-10">
                    <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter by status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {ALL_PO_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.back()} className="shrink-0">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
        </div>
      </div>

       <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 mb-4 md:mb-6 lg:mb-8">
        {/* CardHeader removed as per previous instruction */}
        <div className="h-full overflow-y-auto">
          {isLoading ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2 text-sm">PO ID</TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm">Supplier</TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm">Order Date</TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm">Exp. Delivery</TableHead>
                  <TableHead className="text-right min-w-[90px] px-2 text-sm">Total</TableHead>
                  <TableHead className="min-w-[120px] px-2 text-sm">Status</TableHead>
                  <TableHead className="text-right min-w-[220px] px-2 text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(7)].map((_, i) => (
                  <TableRow key={`skel-po-${i}`} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50')}>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2 text-xs">
                        <div className="flex justify-end items-center gap-1">
                            <Skeleton className="h-8 w-8" /> <Skeleton className="h-8 w-8" /> <Skeleton className="h-8 w-8" /> <Skeleton className="h-8 w-8" /> <Skeleton className="h-8 w-8" />
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredPurchaseOrders.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2 text-sm">PO ID</TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm">Supplier</TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm">Order Date</TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm">Exp. Delivery</TableHead>
                  <TableHead className="text-right min-w-[90px] px-2 text-sm">Total</TableHead>
                  <TableHead className="min-w-[120px] px-2 text-sm">Status</TableHead>
                  <TableHead className="text-right min-w-[220px] px-2 text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseOrders.map((po, index) => (
                  <TableRow key={po.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell className="font-medium px-2 text-xs">{po.id}</TableCell>
                    <TableCell className="px-2 text-xs">{po.supplierName || getSupplierById(po.supplierId)?.name || po.supplierId}</TableCell>
                    <TableCell className="px-2 text-xs">{format(new Date(po.orderDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="px-2 text-xs">{po.expectedDeliveryDate ? format(new Date(po.expectedDeliveryDate), 'MMM dd, yyyy') : '-'}</TableCell>
                    <TableCell className="text-right px-2 text-xs">${po.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="px-2 text-xs"><Badge variant={getPOStatusBadgeVariant(po.status)}>{po.status}</Badge></TableCell>
                    <TableCell className="text-right px-2 text-xs">
                      <div className="flex justify-end items-center gap-1">
                        {(po.status === 'Sent' || po.status === 'Partially Received') && (
                          <Button variant="outline" size="sm" onClick={() => handleOpenReceiveStockModal(po)} className="h-7 px-2 py-1 text-xs hover:bg-green-500/10 hover:border-green-500 hover:text-green-600">
                            <Truck className="mr-1 h-3 w-3" /> Receive
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleViewPO(po)} className="hover:text-primary p-1.5" title="View PO"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditPO(po)} className="hover:text-primary p-1.5" title="Edit PO" disabled={po.status !== 'Draft'}><Edit className="h-4 w-4" /></Button>
                        {(po.status === 'Draft' || po.status === 'Sent') && (
                           <Button variant="ghost" size="icon" onClick={() => handleCancelPOConfirm(po)} className="hover:text-orange-500 p-1.5" title="Cancel PO"><XCircle className="h-4 w-4" /></Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePOConfirm(po)} className="hover:text-destructive p-1.5" title="Delete PO"><Trash2 className="h-4 w-4" /></Button>
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
                title="No Purchase Orders Found"
                message={searchTerm || statusFilter !== 'all' ? "Try adjusting your search or filter criteria." : "Create your first purchase order to start managing procurement."}
                action={!searchTerm && statusFilter === 'all' ? <Button onClick={handleAddPO}><PlusCircle className="mr-2 h-4 w-4" /> Create New PO</Button> : undefined}
              />
            </div>
          )}
        </div>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => { setIsFormModalOpen(isOpen); if (!isOpen) setEditingPO(null); }}>
        <DialogContent className="w-[95vw] max-w-3xl lg:max-w-4xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingPO ? `Edit Purchase Order: ${editingPO.id}` : 'Create New Purchase Order'}</DialogTitle>
            <FormDialogDescription>
              {editingPO ? 'Update the details for this purchase order.' : 'Fill in the details to create a new purchase order.'}
            </FormDialogDescription>
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

      <Dialog open={isViewModalOpen} onOpenChange={(isOpen) => { setIsViewModalOpen(isOpen); if(!isOpen) setPoToView(null);}}>
        <DialogContent className="w-[95vw] max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Purchase Order Details: {poForViewModal?.id}</DialogTitle>
            <FormDialogDescription>
              Viewing details for purchase order sent to {poForViewModal?.supplierName}.
            </FormDialogDescription>
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
                        <TableHead className="px-3 py-2 text-sm">Product</TableHead>
                        <TableHead className="text-center px-3 py-2 text-sm">Ordered</TableHead>
                        <TableHead className="text-center px-3 py-2 text-sm">Received</TableHead>
                        <TableHead className="px-3 py-2 text-sm">Unit</TableHead>
                        <TableHead className="text-right px-3 py-2 text-sm">Unit Price</TableHead>
                        <TableHead className="text-right px-3 py-2 text-sm">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {poForViewModal.items.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell className="px-3 py-2 text-xs">{item.productName}</TableCell>
                          <TableCell className="text-center px-3 py-2 text-xs">{item.quantity}</TableCell>
                          <TableCell className="text-center px-3 py-2 text-xs">{item.quantityReceived || 0}</TableCell>
                          <TableCell className="px-3 py-2 text-xs">{item.unitType}</TableCell>
                          <TableCell className="text-right px-3 py-2 text-xs">${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right px-3 py-2 text-xs">${item.total.toFixed(2)}</TableCell>
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
          <DialogFooter className="p-6 pt-4 border-t flex flex-col sm:flex-row sm:justify-end gap-2">
            {(poForViewModal?.status === 'Sent' || poForViewModal?.status === 'Partially Received') && (
                <Button
                    variant="default"
                    onClick={() => { if(poToView) { setIsViewModalOpen(false); setTimeout(() => handleOpenReceiveStockModal(poToView), 100); }}}
                    className="w-full sm:w-auto"
                >
                  <Truck className="mr-2 h-4 w-4" /> Receive Stock
                </Button>
            )}
             {(poForViewModal?.status === 'Draft' || poForViewModal?.status === 'Sent') && (
                <Button
                    variant="destructive"
                    onClick={() => {
                        if(poToView) {
                            setIsViewModalOpen(false);
                            setTimeout(() => handleCancelPOConfirm(poToView), 100);
                        }
                    }}
                    className="w-full sm:w-auto"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Cancel PO
                </Button>
            )}
            {poForViewModal?.status === 'Draft' && (
              <Button variant="outline" onClick={() => { if (poToView) { setIsViewModalOpen(false); setTimeout(() => handleEditPO(poToView), 100); } }} className="w-full sm:w-auto">
                <Edit className="mr-2 h-4 w-4" /> Edit PO
              </Button>
            )}
            <Button variant="outline" onClick={() => {setIsViewModalOpen(false); setPoToView(null);}} className="w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReceiveStockModalOpen} onOpenChange={(isOpen) => { setIsReceiveStockModalOpen(isOpen); if(!isOpen) setPoToReceiveStock(null); }}>
        <DialogContent className="w-[95vw] max-w-2xl lg:max-w-3xl max-h-[95vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-4 border-b">
                <DialogTitle>Receive Stock for PO: {poToReceiveStock?.id}</DialogTitle>
                <FormDialogDescription>
                Enter quantities received and select destination warehouse for each item.
                </FormDialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto p-6">
                {isReceiveStockModalOpen && poToReceiveStock && (
                    <ReceiveStockForm
                        purchaseOrder={poToReceiveStock}
                        warehouses={warehouses}
                        products={products} // Pass products for unit type info
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

      <AlertDialog open={isCancelConfirmModalOpen} onOpenChange={(isOpen) => {if(!isOpen) {setIsCancelConfirmModalOpen(false); setPoToCancel(null);}}}>
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
