
'use client';
import { useMemo, useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, AlertTriangle, CalendarClock, Archive, Edit, ListFilter, PlusCircle, Warehouse as WarehouseIcon, Shuffle } from 'lucide-react';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ProductForm, type ProductFormValues } from '@/components/forms/product-form';
import { StockAdjustmentForm, type StockAdjustmentFormValues } from '@/components/forms/stock-adjustment-form';
import type { Product, ProductStockLocation, Warehouse, ProductUnitType } from '@/types';
import { addDays, isBefore, parseISO, startOfDay } from 'date-fns';
import { getDisplayUnit } from '@/app/(app)/products/page';

interface EnrichedStockLocation extends ProductStockLocation {
  productName: string;
  productSku: string;
  productUnitType: string;
  warehouseName: string;
  stockValue: number;
  globalReorderPoint?: number;
  costPrice: number;
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
    getProductById,
    getWarehouseById,
    getStockForProductInWarehouse, // Added
  } = useData();
  const { toast } = useToast();

  const [isProductDefineModalOpen, setIsProductDefineModalOpen] = useState(false);
  const [isStockAdjustmentModalOpen, setIsStockAdjustmentModalOpen] = useState(false);
  // editingProduct state is not used for the Define New Product modal here
  // but could be useful if an edit product definition feature was on this page.

  const kpiData = useMemo(() => {
    if (isLoading || !products || !productStockLocations) {
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
        return false; // Invalid date string
      }
    }).length;

    return {
      totalInventoryValue,
      lowStockItemsCount,
      nearingExpiryCount,
    };
  }, [products, productStockLocations, isLoading, getTotalStockForProduct]);

  const enrichedStockData: EnrichedStockLocation[] = useMemo(() => {
    if (isLoading || !productStockLocations || !products || !warehouses) return [];
    return productStockLocations.map(psl => {
      const product = getProductById(psl.productId);
      const warehouse = getWarehouseById(psl.warehouseId);
      const costPrice = product?.costPrice || 0;
      return {
        ...psl,
        productName: product?.name || 'N/A',
        productSku: product?.sku || 'N/A',
        productUnitType: product?.unitType || 'N/A', // Base unit of the product
        warehouseName: warehouse?.name || 'N/A',
        stockValue: psl.stockLevel * costPrice,
        globalReorderPoint: product?.globalReorderPoint,
        costPrice: costPrice,
      };
    }).sort((a, b) => a.productName.localeCompare(b.productName) || a.warehouseName.localeCompare(b.warehouseName));
  }, [productStockLocations, products, warehouses, isLoading, getProductById, getWarehouseById]);


  const handleOpenStockAdjustmentModal = () => {
    setIsStockAdjustmentModalOpen(true);
  };

  const handleAddWarehouse = () => {
    toast({
      title: "Navigate to Settings",
      description: "Warehouse management is available on the Settings page.",
    });
    // Consider router.push('/settings?tab=warehouses');
  };

  const handleTransferStock = () => {
    toast({
      title: "Coming Soon!",
      description: "Stock Transfer feature will be available in a future update.",
    });
  };

  const handleDefineNewProduct = () => {
    setIsProductDefineModalOpen(true);
  };

  const handleSubmitNewProductDefinition = (data: ProductFormValues) => {
    let finalProductId = data.id;
    if (finalProductId && finalProductId.trim() !== '') {
      if (products.find(p => p.id === finalProductId)) {
        toast({
          title: "Error: Product ID exists",
          description: `Product ID ${finalProductId} is already in use. Please choose a different ID or leave blank.`,
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
    toast({ title: "Product Definition Added", description: `${newProductDefinition.name} has been defined. Add stock via Stock Adjustments or Receiving.` });
    setIsProductDefineModalOpen(false);
  };

  const handleStockAdjustmentSubmit = (data: StockAdjustmentFormValues) => {
    const currentStock = getStockForProductInWarehouse(data.productId, data.warehouseId);
    let newCalculatedStockLevel = currentStock;

    if (data.adjustmentType === "Increase Stock") {
      newCalculatedStockLevel = currentStock + data.adjustmentQuantity;
    } else if (data.adjustmentType === "Decrease Stock") {
      newCalculatedStockLevel = Math.max(0, currentStock - data.adjustmentQuantity); // Prevent negative stock
    }

    const productStockRecord: ProductStockLocation = {
      id: `${data.productId}-${data.warehouseId}`, // Use a consistent ID format if you update
      productId: data.productId,
      warehouseId: data.warehouseId,
      stockLevel: newCalculatedStockLevel,
    };
    upsertProductStockLocation(productStockRecord);
    const productName = products.find(p => p.id === data.productId)?.name || 'Product';
    const warehouseName = warehouses.find(w => w.id === data.warehouseId)?.name || 'Warehouse';
    toast({
      title: "Stock Adjusted",
      description: `Stock for ${productName} in ${warehouseName} updated to ${newCalculatedStockLevel}.`,
    });
    setIsStockAdjustmentModalOpen(false);
  };


  if (isLoading && !companyProfile) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Inventory Management"
          description="Overview of your product stock levels, item status, and inventory value."
           actions={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button className="w-full sm:w-auto" disabled><WarehouseIcon className="mr-2 h-4 w-4" /> Add Warehouse</Button>
              <Button className="w-full sm:w-auto" disabled><Shuffle className="mr-2 h-4 w-4" /> Transfer Stock</Button>
              <Button className="w-full sm:w-auto" disabled><Edit className="mr-2 h-4 w-4" /> Adjust Stock</Button>
              <Button className="w-full sm:w-auto" disabled><PlusCircle className="mr-2 h-4 w-4" /> Define New Product</Button>
            </div>
          }
        />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
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
        <Card className="flex-grow flex flex-col shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-1" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <div className="h-full overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                  <TableRow>
                    <TableHead className="min-w-[100px] px-2">Prod. ID</TableHead>
                    <TableHead className="min-w-[180px] px-2">Product Name</TableHead>
                    <TableHead className="min-w-[100px] px-2">SKU</TableHead>
                    <TableHead className="min-w-[150px] px-2">Warehouse</TableHead>
                    <TableHead className="text-center min-w-[100px] px-2">Stock</TableHead>
                    <TableHead className="text-right min-w-[120px] px-2">Stock Value</TableHead>
                    <TableHead className="text-center min-w-[100px] px-2">Global R.P.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(7)].map((_, i) => (
                    <TableRow key={`skel-stock-${i}`} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50')}>
                      <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="text-center px-2"><Skeleton className="h-5 w-3/4 mx-auto" /></TableCell>
                      <TableCell className="text-right px-2"><Skeleton className="h-5 w-3/4 ml-auto" /></TableCell>
                      <TableCell className="text-center px-2"><Skeleton className="h-5 w-3/4 mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
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
              <Button onClick={handleAddWarehouse} className="w-full sm:w-auto"><WarehouseIcon className="mr-2 h-4 w-4" /> Add Warehouse</Button>
              <Button onClick={handleTransferStock} className="w-full sm:w-auto"><Shuffle className="mr-2 h-4 w-4" /> Transfer Stock</Button>
              <Button onClick={handleOpenStockAdjustmentModal} className="w-full sm:w-auto"><Edit className="mr-2 h-4 w-4" /> Adjust Stock</Button>
              <Button onClick={handleDefineNewProduct} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Define New Product</Button>
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
              ${kpiData.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated value across all warehouses.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Low Stock Items</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {kpiData.lowStockItemsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique products at/below global reorder point.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Nearing Expiry</CardTitle>
            <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
              {kpiData.nearingExpiryCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique products expiring within 30 days.
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mb-4 md:mb-6 lg:mb-8">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Detailed Inventory Stock</CardTitle>
              <CardDescription>Stock levels per product and warehouse.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <div className="h-full overflow-y-auto">
          {isLoading ? (
             <Table>
                <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                  <TableRow>
                    <TableHead className="min-w-[100px] px-2">Prod. ID</TableHead>
                    <TableHead className="min-w-[180px] px-2">Product Name</TableHead>
                    <TableHead className="min-w-[100px] px-2">SKU</TableHead>
                    <TableHead className="min-w-[150px] px-2">Warehouse</TableHead>
                    <TableHead className="text-center min-w-[100px] px-2">Stock</TableHead>
                    <TableHead className="text-right min-w-[120px] px-2">Stock Value</TableHead>
                    <TableHead className="text-center min-w-[100px] px-2">Global R.P.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(7)].map((_, i) => (
                    <TableRow key={`skel-stock-${i}`} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50')}>
                      <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="text-center px-2"><Skeleton className="h-5 w-3/4 mx-auto" /></TableCell>
                      <TableCell className="text-right px-2"><Skeleton className="h-5 w-3/4 ml-auto" /></TableCell>
                      <TableCell className="text-center px-2"><Skeleton className="h-5 w-3/4 mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          ) : enrichedStockData.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2">Prod. ID</TableHead>
                  <TableHead className="min-w-[180px] px-2">Product Name</TableHead>
                  <TableHead className="min-w-[100px] px-2">SKU</TableHead>
                  <TableHead className="min-w-[150px] px-2">Warehouse</TableHead>
                  <TableHead className="text-center min-w-[100px] px-2">Stock</TableHead>
                  <TableHead className="text-right min-w-[120px] px-2">Stock Value</TableHead>
                  <TableHead className="text-center min-w-[100px] px-2">Global R.P.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedStockData.map((item, index) => {
                  const product = getProductById(item.productId);
                  const displayUnit = product ? getDisplayUnit(product, 'base') : item.productUnitType;
                  return (
                    <TableRow key={item.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                      <TableCell className="font-medium px-2">{item.productId}</TableCell>
                      <TableCell className="px-2">{item.productName}</TableCell>
                      <TableCell className="px-2">{item.productSku}</TableCell>
                      <TableCell className="px-2">{item.warehouseName}</TableCell>
                      <TableCell className={cn(
                          "text-center font-medium px-2",
                          product?.globalReorderPoint !== undefined && item.stockLevel <= product.globalReorderPoint ? "text-destructive" : ""
                        )}>
                        {item.stockLevel} {displayUnit}
                      </TableCell>
                      <TableCell className="text-right px-2">${item.stockValue.toFixed(2)}</TableCell>
                      <TableCell className="text-center px-2">
                        {item.globalReorderPoint !== undefined ? `${item.globalReorderPoint} ${displayUnit}` : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <DataPlaceholder
                icon={Archive}
                title="No Stock Records Found"
                message="Adjust stock levels for products in your warehouses to see them here."
                action={
                    <Button onClick={handleOpenStockAdjustmentModal} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0">
                        <Edit className="mr-2 h-4 w-4" /> Adjust Stock
                    </Button>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Dialog for Defining New Product */}
      <Dialog open={isProductDefineModalOpen} onOpenChange={setIsProductDefineModalOpen}>
        <DialogContent className="w-[90vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Define New Product</DialogTitle>
            <DialogDescription>
              Enter details for the new product. Stock levels will be managed separately per warehouse.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
            {isProductDefineModalOpen && ( // Conditionally render to ensure fresh state if form had complex internal state
                 <ProductForm
                    initialData={null} // Always for new product definition from this page
                    onSubmit={handleSubmitNewProductDefinition}
                    onCancel={() => { setIsProductDefineModalOpen(false); }}
                    isSubmitting={isLoading} // Pass loading state if needed by form
                 />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Stock Adjustment */}
      <Dialog open={isStockAdjustmentModalOpen} onOpenChange={setIsStockAdjustmentModalOpen}>
        <DialogContent className="w-[90vw] sm:max-w-lg md:max-w-xl">
          <DialogHeader>
            <DialogTitle>Adjust Stock Level</DialogTitle>
            <DialogDescription>
              Select product, warehouse, adjustment type, and quantity.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isStockAdjustmentModalOpen && ( // Conditionally render for fresh state
              <StockAdjustmentForm
                products={products}
                warehouses={warehouses}
                onSubmit={handleStockAdjustmentSubmit}
                onCancel={() => setIsStockAdjustmentModalOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
