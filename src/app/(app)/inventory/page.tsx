
'use client';
import Link from 'next/link';
import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, AlertTriangle, CalendarClock, Archive, Edit, ListFilter, PlusCircle, Warehouse as WarehouseIcon, Shuffle, Eye } from 'lucide-react';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProductForm, type ProductFormValues } from '@/components/forms/product-form';
import { StockAdjustmentForm, type StockAdjustmentFormValues } from '@/components/forms/stock-adjustment-form';
import { StockTransferForm, type StockTransferFormValues } from '@/components/forms/stock-transfer-form';
import type { Product, Warehouse, ProductStockLocation, StockAdjustmentReason, StockTransactionType } from '@/types';
import { addDays, isBefore, parseISO, startOfDay } from 'date-fns';
import { getDisplayUnit } from '@/app/(app)/products/page'; // Assuming getDisplayUnit is exported


interface EnrichedStockData extends ProductStockLocation {
    productName: string;
    productSku: string;
    productUnitType: string; // Base unit for this product
    warehouseName: string;
    costPrice: number;
    stockValue: number;
    globalReorderPoint?: number;
}


export default function InventoryPage() {
  const {
    products,
    warehouses,
    productStockLocations,
    isLoading,
    addProduct,
    companyProfile,
    getTotalStockForProduct,
    upsertProductStockLocation,
    getStockForProductInWarehouse,
    getProductById,
    getWarehouseById,
  } = useData();
  const { toast } = useToast();
  const router = useRouter();

  const [isProductDefineModalOpen, setIsProductDefineModalOpen] = useState(false);
  const [isStockAdjustmentModalOpen, setIsStockAdjustmentModalOpen] = useState(false);
  const [isStockTransferModalOpen, setIsStockTransferModalOpen] = useState(false);

  const kpiData = useMemo(() => {
    if (isLoading || !products || !productStockLocations || !companyProfile) {
      return {
        totalInventoryValue: 0,
        lowStockItemsCount: 0,
        nearingExpiryCount: 0,
      };
    }

    const totalInventoryValue = productStockLocations.reduce((sum, psl) => {
      const productDetails = products.find(p => p.id === psl.productId);
      const stock = typeof psl.stockLevel === 'number' ? psl.stockLevel : 0;
      const cost = productDetails && typeof productDetails.costPrice === 'number' ? productDetails.costPrice : 0;
      return sum + (stock * cost);
    }, 0);

    let lowStockItemsCount = 0;
    products.forEach(product => {
        const totalStock = getTotalStockForProduct(product.id);
        if (product.globalReorderPoint !== undefined && totalStock <= product.globalReorderPoint) {
            lowStockItemsCount++;
        }
    });

    const today = startOfDay(new Date());
    const expiryThresholdDate = addDays(today, 30);

    const nearingExpiryCount = products.filter(product => {
      if (!product.expiryDate) return false;
      try {
        const expiry = startOfDay(parseISO(product.expiryDate));
        return isBefore(expiry, expiryThresholdDate) && !isBefore(expiry, today);
      } catch (e) {
        return false;
      }
    }).length;

    return {
      totalInventoryValue,
      lowStockItemsCount,
      nearingExpiryCount,
    };
  }, [products, productStockLocations, isLoading, getTotalStockForProduct, companyProfile]);


  const enrichedStockData: EnrichedStockData[] = useMemo(() => {
        if (isLoading || !productStockLocations || !products || !warehouses) return [];
        return productStockLocations
            .map(psl => {
                const product = getProductById(psl.productId);
                const warehouse = getWarehouseById(psl.warehouseId);
                if (!product || !warehouse) return null;

                return {
                    ...psl,
                    productName: product.name,
                    productSku: product.sku,
                    productUnitType: product.unitType,
                    warehouseName: warehouse.name,
                    costPrice: product.costPrice || 0,
                    stockValue: psl.stockLevel * (product.costPrice || 0),
                    globalReorderPoint: product.globalReorderPoint,
                };
            })
            .filter(item => item !== null)
            .sort((a, b) => {
                if (a!.productName < b!.productName) return -1;
                if (a!.productName > b!.productName) return 1;
                if (a!.warehouseName < b!.warehouseName) return -1;
                if (a!.warehouseName > b!.warehouseName) return 1;
                return 0;
            }) as EnrichedStockData[];
    }, [isLoading, productStockLocations, products, warehouses, getProductById, getWarehouseById]);


  const handleOpenStockAdjustmentModal = () => setIsStockAdjustmentModalOpen(true);
  const handleOpenStockTransferModal = () => setIsStockTransferModalOpen(true);

  const handleAddWarehouse = () => {
    toast({
      title: "Navigate to Settings",
      description: "Warehouse management is available on the Settings page.",
    });
    router.push('/settings?tab=warehouses');
  };

  const handleDefineNewProduct = () => setIsProductDefineModalOpen(true);

  const handleSubmitNewProductDefinition = (data: ProductFormValues) => {
    let finalProductId = data.id;
    if (finalProductId && finalProductId.trim() !== '') {
      if (products.find(p => p.id === finalProductId)) {
        toast({
          title: "Error: Product ID exists",
          description: `Product ID ${finalProductId} is already in use. Leave blank for auto-gen.`,
          variant: "destructive",
        });
        return;
      }
    } else {
      finalProductId = `PROD${String(Date.now()).slice(-5)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;
      while (products.find(p => p.id === finalProductId)) {
        finalProductId = `PROD${String(Date.now()).slice(-5)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;
      }
    }

    const newProductDefinition: Product = {
      id: finalProductId,
      name: data.name,
      sku: data.sku || '',
      category: data.category,
      unitType: data.unitType,
      piecesInBaseUnit: data.piecesInBaseUnit || (data.unitType.toLowerCase() === 'pcs' ? 1 : undefined),
      packagingUnit: data.packagingUnit && data.packagingUnit.trim() !== '' ? data.packagingUnit.trim() : undefined,
      itemsPerPackagingUnit: data.packagingUnit && data.packagingUnit.trim() !== '' && data.itemsPerPackagingUnit ? data.itemsPerPackagingUnit : undefined,
      globalReorderPoint: data.globalReorderPoint || 0,
      basePrice: data.basePrice,
      costPrice: data.costPrice || 0,
      exciseTax: data.exciseTaxAmount === undefined || data.exciseTaxAmount === null ? 0 : data.exciseTaxAmount,
      batchNo: data.batchNo || undefined,
      productionDate: data.productionDate ? data.productionDate.toISOString() : undefined,
      expiryDate: data.expiryDate ? data.expiryDate.toISOString() : undefined,
      discountRate: data.discountRate === undefined || data.discountRate === null ? 0 : data.discountRate,
      createdAt: new Date().toISOString(),
    };

    addProduct(newProductDefinition);
    toast({ title: "Product Defined", description: `${newProductDefinition.name} created. Use 'Adjust Stock' to set initial quantities.` });
    setIsProductDefineModalOpen(false);
  };

  const handleStockAdjustmentSubmit = (data: StockAdjustmentFormValues) => {
    const currentStock = getStockForProductInWarehouse(data.productId, data.warehouseId);
    let quantityChange = data.adjustmentQuantity;
    let transactionType: StockTransactionType = data.adjustmentReason as StockTransactionType; // Default to reason

    // Determine if it's an increase or decrease based on reason
    const increaseReasons: StockAdjustmentReason[] = ["Initial Stock Entry", "Stock Take Gain", "Goods Received (Manual)", "Other Increase"];
    const decreaseReasons: StockAdjustmentReason[] = ["Stock Take Loss", "Damaged Goods", "Expired Goods", "Internal Consumption", "Promotion/Sample", "Other Decrease"];

    let newCalculatedStockLevel: number;

    if (increaseReasons.includes(data.adjustmentReason)) {
      newCalculatedStockLevel = currentStock + data.adjustmentQuantity;
      transactionType = 'Adjustment - Increase';
    } else if (decreaseReasons.includes(data.adjustmentReason)) {
      newCalculatedStockLevel = Math.max(0, currentStock - data.adjustmentQuantity);
      quantityChange = -(currentStock - newCalculatedStockLevel); // Actual change might be less if current stock is low
      transactionType = 'Adjustment - Decrease';
    } else {
      // Should not happen if form is validated
      toast({ title: "Error", description: "Invalid adjustment reason.", variant: "destructive" });
      return;
    }
    
    upsertProductStockLocation(
        { productId: data.productId, warehouseId: data.warehouseId, stockLevel: newCalculatedStockLevel },
        data.adjustmentReason, // This is the specific reason from the form
        data.reference || undefined
    );

    const productName = products.find(p => p.id === data.productId)?.name || 'Product';
    const warehouseName = warehouses.find(w => w.id === data.warehouseId)?.name || 'Warehouse';
    toast({
      title: "Stock Adjusted",
      description: `Stock for ${productName} in ${warehouseName} updated to ${newCalculatedStockLevel}. Reason: ${data.adjustmentReason}`,
    });
    setIsStockAdjustmentModalOpen(false);
  };


  const handleStockTransferSubmit = (data: StockTransferFormValues) => {
    const { productId, sourceWarehouseId, destinationWarehouseId, transferQuantity } = data;

    const currentSourceStock = getStockForProductInWarehouse(productId, sourceWarehouseId);
    const currentDestStock = getStockForProductInWarehouse(productId, destinationWarehouseId);

    if (transferQuantity > currentSourceStock) {
        toast({ title: "Transfer Error", description: "Transfer quantity exceeds available stock in source warehouse.", variant: "destructive" });
        return;
    }

    const newSourceStock = currentSourceStock - transferQuantity;
    const newDestStock = currentDestStock + transferQuantity;

    upsertProductStockLocation({
      productId,
      warehouseId: sourceWarehouseId,
      stockLevel: newSourceStock,
    }, 'Transfer Out', `To WH: ${destinationWarehouseId}`);
    upsertProductStockLocation({
      productId,
      warehouseId: destinationWarehouseId,
      stockLevel: newDestStock,
    }, 'Transfer In', `From WH: ${sourceWarehouseId}`);
    
    const productName = products.find(p => p.id === productId)?.name || 'Product';
    const sourceWhName = warehouses.find(w => w.id === sourceWarehouseId)?.name || 'Source';
    const destWhName = warehouses.find(w => w.id === destinationWarehouseId)?.name || 'Destination';

    toast({ title: "Stock Transferred", description: `${transferQuantity} units of ${productName} transferred from ${sourceWhName} to ${destWhName}.` });
    setIsStockTransferModalOpen(false);
  };

  if (isLoading && !companyProfile) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
          <PageHeader
            title="Inventory Management"
            description="Overview of your multi-warehouse inventory, product stock levels, and inventory value."
            actions={
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button className="w-full sm:w-auto" disabled><PlusCircle className="mr-2 h-4 w-4" /> Define New Product</Button>
                <Button className="w-full sm:w-auto" disabled><WarehouseIcon className="mr-2 h-4 w-4" /> Add Warehouse</Button>
                <Button className="w-full sm:w-auto" disabled><Shuffle className="mr-2 h-4 w-4" /> Transfer Stock</Button>
                <Button className="w-full sm:w-auto" disabled><Edit className="mr-2 h-4 w-4" /> Adjust Stock</Button>
              </div>
            }
          />
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6 shrink-0 px-4 md:px-6 lg:px-8 mt-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2 mb-1" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
         <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mb-4 md:mb-6 lg:mb-8">
          <CardHeader className="border-b">
             <Skeleton className="h-6 w-1/3 mb-1" />
             <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <div className="h-full overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2">WH ID</TableHead>
                  <TableHead className="min-w-[180px] px-2">WH Name</TableHead>
                  <TableHead className="min-w-[150px] px-2">WH Location</TableHead>
                  <TableHead className="min-w-[120px] px-2">WH Type</TableHead>
                  <TableHead className="text-center min-w-[100px] px-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={`skel-wh-${i}`} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50')}>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-center px-2"><Skeleton className="h-8 w-20 mx-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
       <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Inventory Management"
          description="Overview of your multi-warehouse inventory, product stock levels, and inventory value."
          actions={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={handleDefineNewProduct} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Define New Product</Button>
              <Button onClick={handleAddWarehouse} className="w-full sm:w-auto"><WarehouseIcon className="mr-2 h-4 w-4" /> Add Warehouse</Button>
              <Button onClick={handleOpenStockTransferModal} className="w-full sm:w-auto"><Shuffle className="mr-2 h-4 w-4" /> Transfer Stock</Button>
              <Button onClick={handleOpenStockAdjustmentModal} className="w-full sm:w-auto"><Edit className="mr-2 h-4 w-4" /> Adjust Stock</Button>
            </div>
          }
        />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6 shrink-0 px-4 md:px-6 lg:px-8 mt-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <Coins className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {isLoading || !companyProfile ? <Skeleton className="h-8 w-3/4" /> : `$${kpiData.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-muted-foreground">Estimated value across all warehouses.</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Low Stock Items</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {isLoading || !companyProfile ? <Skeleton className="h-8 w-1/4" /> : kpiData.lowStockItemsCount}
            </div>
            <p className="text-xs text-muted-foreground">Unique products at/below global reorder point.</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Nearing Expiry</CardTitle>
            <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
              {isLoading || !companyProfile ? <Skeleton className="h-8 w-1/4" /> : kpiData.nearingExpiryCount}
            </div>
            <p className="text-xs text-muted-foreground">Unique products expiring within 30 days.</p>
          </CardContent>
        </Card>
      </div>

       <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mb-4 md:mb-6 lg:mb-8">
        <CardHeader className="border-b">
          <CardTitle>Warehouses Overview</CardTitle>
          <CardDescription>List of all warehouses. Click to view detailed stock.</CardDescription>
        </CardHeader>
        <div className="h-full overflow-y-auto">
          {isLoading ? (
             <Table>
                <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                  <TableRow>
                    <TableHead className="min-w-[100px] px-2">WH ID</TableHead>
                    <TableHead className="min-w-[180px] px-2">WH Name</TableHead>
                    <TableHead className="min-w-[150px] px-2">WH Location</TableHead>
                    <TableHead className="min-w-[120px] px-2">WH Type</TableHead>
                    <TableHead className="text-center min-w-[100px] px-2">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={`skel-wh-${i}`} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50')}>
                      <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="text-center px-2"><Skeleton className="h-8 w-20 mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          ) : warehouses.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2">WH ID</TableHead>
                  <TableHead className="min-w-[180px] px-2">WH Name</TableHead>
                  <TableHead className="min-w-[150px] px-2">WH Location</TableHead>
                  <TableHead className="min-w-[120px] px-2">WH Type</TableHead>
                  <TableHead className="text-center min-w-[100px] px-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((warehouse, index) => (
                    <TableRow 
                        key={warehouse.id} 
                        className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10 cursor-pointer")}
                        onClick={() => router.push(`/inventory/${warehouse.id}`)}
                    >
                      <TableCell className="font-medium px-2">{warehouse.id}</TableCell>
                      <TableCell className="px-2">{warehouse.name}</TableCell>
                      <TableCell className="px-2">{warehouse.location}</TableCell>
                      <TableCell className="px-2">{warehouse.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell>
                      <TableCell className="text-center px-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                router.push(`/inventory/${warehouse.id}`);
                            }}
                            className="hover:text-primary"
                        >
                            <Eye className="mr-1 h-4 w-4" /> View Stock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <DataPlaceholder
                icon={WarehouseIcon}
                title="No Warehouses Found"
                message="Define warehouses in Settings to start managing inventory locations."
                action={
                    <Button onClick={handleAddWarehouse} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0">
                        <PlusCircle className="mr-2 h-4 w-4" /> Go to Settings to Add Warehouse
                    </Button>
                }
              />
            </div>
          )}
        </div>
      </div>

      <Dialog open={isProductDefineModalOpen} onOpenChange={setIsProductDefineModalOpen}>
        <DialogContent className="w-[90vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Define New Product</DialogTitle>
            <DialogDescription>Enter product details. Stock is managed per warehouse via Stock Adjustments.</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
            {isProductDefineModalOpen && (
              <ProductForm
                initialData={null}
                onSubmit={handleSubmitNewProductDefinition}
                onCancel={() => setIsProductDefineModalOpen(false)}
                isSubmitting={isLoading}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isStockAdjustmentModalOpen} onOpenChange={setIsStockAdjustmentModalOpen}>
        <DialogContent className="w-[90vw] sm:max-w-lg md:max-w-xl">
          <DialogHeader>
            <DialogTitle>Adjust Stock Level</DialogTitle>
            <DialogDescription>Select product, warehouse, adjustment type, and quantity.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isStockAdjustmentModalOpen && (
              <StockAdjustmentForm
                products={products}
                warehouses={warehouses}
                onSubmit={handleStockAdjustmentSubmit}
                onCancel={() => setIsStockAdjustmentModalOpen(false)}
                isSubmitting={isLoading}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isStockTransferModalOpen} onOpenChange={setIsStockTransferModalOpen}>
        <DialogContent className="w-[90vw] sm:max-w-lg md:max-w-xl">
          <DialogHeader>
            <DialogTitle>Transfer Stock</DialogTitle>
            <DialogDescription>Move stock between warehouses.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isStockTransferModalOpen && (
              <StockTransferForm
                products={products}
                warehouses={warehouses}
                onSubmit={handleStockTransferSubmit}
                onCancel={() => setIsStockTransferModalOpen(false)}
                isSubmitting={isLoading}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    