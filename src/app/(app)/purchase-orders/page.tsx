
'use client';
import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShoppingBasket } from 'lucide-react';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useData } from '@/context/DataContext';
import type { PurchaseOrder, Supplier, Product } from '@/types';
import { PurchaseOrderForm, type PurchaseOrderFormValues } from '@/components/forms/purchase-order-form';
import { useToast } from '@/hooks/use-toast';

// More imports will be needed: Table components for listing POs

export default function PurchaseOrdersPage() {
  const { 
    purchaseOrders, 
    suppliers, 
    products, 
    addPurchaseOrder, 
    isLoading 
  } = useData();
  const { toast } = useToast();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null); // For future edit functionality

  const handleAddPO = () => {
    setEditingPO(null);
    setIsFormModalOpen(true);
  };

  const handleSubmitPO = (data: PurchaseOrderFormValues) => {
    // In a real app, you might want to add more fields like PO ID generation here
    // or do it in the DataContext's addPurchaseOrder function.
    // For now, DataContext handles basic ID, createdAt, status, and total calculations.
    
    const poDataForContext = {
      supplierId: data.supplierId,
      orderDate: data.orderDate.toISOString(),
      expectedDeliveryDate: data.expectedDeliveryDate?.toISOString(),
      items: data.items.map(item => ({
        ...item,
        total: (item.quantity || 0) * (item.unitPrice || 0) // Ensure total is calculated
      })),
      notes: data.notes,
    };

    addPurchaseOrder(poDataForContext);
    toast({
      title: "Purchase Order Created",
      description: "The new purchase order has been successfully added.",
    });
    setIsFormModalOpen(false);
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
        {/* Search and filter controls will go here */}
      </div>

      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mb-4 md:mb-6 lg:mb-8">
        <CardHeader className="border-b">
          <CardTitle>Purchase Order List</CardTitle>
          <CardDescription>
            Overview of all purchase orders. Table display coming soon.
          </CardDescription>
        </CardHeader>
        <div className="h-full overflow-y-auto">
          {/* Placeholder for PO Table or Loading Skeleton */}
          {/* TODO: Implement table to list purchaseOrders */}
          <DataPlaceholder
            icon={ShoppingBasket}
            title="Purchase Order Listing Coming Soon"
            message="This section will display a list of your purchase orders."
          />
        </div>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="w-[95vw] max-w-3xl lg:max-w-4xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingPO ? 'Edit Purchase Order' : 'Create New Purchase Order'}</DialogTitle>
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
                onCancel={() => setIsFormModalOpen(false)}
                isSubmitting={isLoading} // Or a specific submitting state for PO form
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    