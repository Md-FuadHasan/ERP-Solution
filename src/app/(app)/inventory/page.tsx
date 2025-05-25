
'use client';
import Link from 'next/link';
import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, AlertTriangle, CalendarClock, Archive, Edit, ListFilter, PlusCircle, Warehouse as WarehouseIcon, Shuffle, Eye, BookOpen, Lightbulb, Search as SearchIconLucide } from 'lucide-react';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as FormDialogDescription } from '@/components/ui/dialog';
import { ProductForm, type ProductFormValues } from '@/components/forms/product-form';
import { StockAdjustmentForm, type StockAdjustmentFormValues } from '@/components/forms/stock-adjustment-form';
import { StockTransferForm, type StockTransferFormValues } from '@/components/forms/stock-transfer-form';
import type { Product, Warehouse, ProductStockLocation, StockAdjustmentReason, StockTransactionType, StockTransaction, CompanyProfile } from '@/types';
import { addDays, isBefore, parseISO, startOfDay, format } from 'date-fns';
import { getDisplayUnit, getCategoryBadgeVariant } from '@/app/(app)/products/page'; // Assuming these are exported
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/common/search-input';

interface EnrichedStockData extends ProductStockLocation {
    productName: string;
    productSku: string;
    productUnitType: string;
    productCategory: ProductCategory;
    warehouseName: string;
    costPrice: number;
    stockValue: number;
    globalReorderPoint?: number;
}
type ProductCategory = Product['category'];


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
  const [searchTerm, setSearchTerm] = useState('');

  const kpiData = useMemo(() => {
    if (isLoading || !products || !productStockLocations || !companyProfile) {
      return { totalInventoryValue: 0, lowStockItemsCount: 0, nearingExpiryCount: 0 };
    }
    const totalInventoryValue = productStockLocations.reduce((sum, psl) => {
      const productDetails = getProductById(psl.productId);
      const stock = typeof psl.stockLevel === 'number' ? psl.stockLevel : 0;
      const cost = productDetails && typeof productDetails.costPrice === 'number' ? productDetails.costPrice : 0;
      return sum + (stock * cost);
    }, 0);

    let lowStockItemsCount = 0;
    const uniqueLowStockProductIds = new Set<string>();
    productStockLocations.forEach(psl => {
        const product = getProductById(psl.productId);
        if (product && product.globalReorderPoint !== undefined && psl.stockLevel <= product.globalReorderPoint) {
            uniqueLowStockProductIds.add(product.id);
        }
    });
    lowStockItemsCount = uniqueLowStockProductIds.size;

    const today = startOfDay(new Date());
    const expiryThresholdDate = addDays(today, 30);
    const nearingExpiryCount = products.filter(product => {
      if (!product.expiryDate) return false;
      try {
        const expiry = startOfDay(parseISO(product.expiryDate));
        return isBefore(expiry, expiryThresholdDate) && !isBefore(expiry, today);
      } catch (e) { return false; }
    }).length;

    return { totalInventoryValue, lowStockItemsCount, nearingExpiryCount };
  }, [products, productStockLocations, isLoading, getProductById, companyProfile]);

  const enrichedStockData: EnrichedStockData[] = useMemo(() => {
    if (isLoading || !productStockLocations || !products.length || !warehouses.length) return [];
    let data = productStockLocations.map(psl => {
      const product = getProductById(psl.productId);
      const warehouse = getWarehouseById(psl.warehouseId);
      if (!product || !warehouse) return null;
      return {
        ...psl,
        productName: product.name,
        productSku: product.sku,
        productUnitType: product.unitType,
        productCategory: product.category,
        warehouseName: warehouse.name,
        costPrice: product.costPrice || 0,
        stockValue: psl.stockLevel * (product.costPrice || 0),
        globalReorderPoint: product.globalReorderPoint,
      };
    }).filter(item => item !== null) as EnrichedStockData[];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      data = data.filter(item =>
        item.productName.toLowerCase().includes(lowerSearchTerm) ||
        item.productSku.toLowerCase().includes(lowerSearchTerm) ||
        item.productCategory.toLowerCase().includes(lowerSearchTerm) ||
        item.warehouseName.toLowerCase().includes(lowerSearchTerm)
      );
    }
    return data.sort((a, b) => a.productName.localeCompare(b.productName) || a.warehouseName.localeCompare(b.warehouseName));
  }, [isLoading, productStockLocations, products, warehouses, getProductById, getWarehouseById, searchTerm]);


  const handleDefineNewProduct = () => setIsProductDefineModalOpen(true);
  const handleOpenStockAdjustmentModal = () => setIsStockAdjustmentModalOpen(true);
  const handleOpenStockTransferModal = () => setIsStockTransferModalOpen(true);

  const handleSubmitNewProductDefinition = (data: ProductFormValues) => {
    // Simplified from product page - no initial stock here
    let finalProductId = data.id;
    if (finalProductId && finalProductId.trim() !== '') {
      if (products.find(p => p.id === finalProductId)) {
        toast({ title: "Error: Product ID exists", description: `Product ID ${finalProductId} is already in use. Leave blank for auto-gen.`, variant: "destructive" });
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
      piecesInBaseUnit: data.piecesInBaseUnit || (data.unitType === 'PCS' ? 1 : undefined),
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
    toast({ title: "Product Defined", description: `${newProductDefinition.name} created. Use 'Adjust Stock' to set initial quantities in warehouses.` });
    setIsProductDefineModalOpen(false);
  };

  const handleStockAdjustmentSubmit = (data: StockAdjustmentFormValues) => {
    const currentStock = getStockForProductInWarehouse(data.productId, data.warehouseId);
    let newCalculatedStockLevel: number;
    const product = getProductById(data.productId);
    const qtyChange = data.adjustmentQuantity;

    if (data.adjustmentReason === "Initial Stock Entry" || data.adjustmentReason === "Stock Take Gain" || data.adjustmentReason === "Goods Received (Manual)" || data.adjustmentReason === "Other Increase") {
      newCalculatedStockLevel = currentStock + qtyChange;
    } else { // Decrease reasons
      newCalculatedStockLevel = Math.max(0, currentStock - qtyChange);
    }
    
    upsertProductStockLocation(
        { productId: data.productId, warehouseId: data.warehouseId, stockLevel: newCalculatedStockLevel },
        data.adjustmentReason,
        data.reference || undefined
    );
    toast({ title: "Stock Adjusted", description: `Stock for ${product?.name || data.productId} updated to ${newCalculatedStockLevel}. Reason: ${data.adjustmentReason}` });
    setIsStockAdjustmentModalOpen(false);
  };

  const handleStockTransferSubmit = (data: StockTransferFormValues) => {
    const { productId, sourceWarehouseId, destinationWarehouseId, transferQuantity, reference } = data;
    const currentSourceStock = getStockForProductInWarehouse(productId, sourceWarehouseId);
    if (transferQuantity > currentSourceStock) {
        toast({ title: "Transfer Error", description: "Transfer quantity exceeds available stock in source warehouse.", variant: "destructive" });
        return;
    }
    const currentDestStock = getStockForProductInWarehouse(productId, destinationWarehouseId);
    upsertProductStockLocation({ productId, warehouseId: sourceWarehouseId, stockLevel: currentSourceStock - transferQuantity }, 'Transfer Out', `To WH: ${getWarehouseById(destinationWarehouseId)?.name || destinationWarehouseId} / Ref: ${reference || ''}`);
    upsertProductStockLocation({ productId, warehouseId: destinationWarehouseId, stockLevel: currentDestStock + transferQuantity }, 'Transfer In', `From WH: ${getWarehouseById(sourceWarehouseId)?.name || sourceWarehouseId} / Ref: ${reference || ''}`);
    toast({ title: "Stock Transferred", description: `${transferQuantity} units of ${getProductById(productId)?.name || productId} transferred.` });
    setIsStockTransferModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Inventory Management"
          description="Overview of inventory KPIs and detailed stock levels across all locations."
          actions={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={handleDefineNewProduct} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Define New Product</Button>
              <Button onClick={() => router.push('/warehouses')} className="w-full sm:w-auto"><WarehouseIcon className="mr-2 h-4 w-4" /> Manage Warehouses</Button>
              <Button onClick={handleOpenStockTransferModal} className="w-full sm:w-auto"><Shuffle className="mr-2 h-4 w-4" /> Transfer Stock</Button>
              <Button onClick={handleOpenStockAdjustmentModal} className="w-full sm:w-auto"><Edit className="mr-2 h-4 w-4" /> Adjust Stock</Button>
            </div>
          }
        />
      </div>

      <div className="flex-grow min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center space-x-3">
            <Lightbulb className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-lg">AI Suggestion</CardTitle>
              <CardDescription className="text-xs">
                {kpiData.lowStockItemsCount > 0
                  ? `${kpiData.lowStockItemsCount} item(s) are running low on stock and may need to be reordered soon.`
                  : "All stock levels are currently above reorder points."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Generate POs", description: "This feature will be implemented soon!" })}>
              Generate Purchase Orders
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-lg"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle><Coins className="h-5 w-5 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{isLoading || !companyProfile ? <Skeleton className="h-8 w-3/4" /> : `$${kpiData.totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</div><p className="text-xs text-muted-foreground">Estimated value across all warehouses.</p></CardContent></Card>
          <Card className="shadow-lg"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Global Low Stock Items</CardTitle><AlertTriangle className="h-5 w-5 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{isLoading || !companyProfile ? <Skeleton className="h-8 w-1/4" /> : kpiData.lowStockItemsCount}</div><p className="text-xs text-muted-foreground">Unique products at/below global reorder point.</p></CardContent></Card>
          <Card className="shadow-lg"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Products Nearing Expiry</CardTitle><CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{isLoading || !companyProfile ? <Skeleton className="h-8 w-1/4" /> : kpiData.nearingExpiryCount}</div><p className="text-xs text-muted-foreground">Unique products expiring within 30 days.</p></CardContent></Card>
        </div>

        <Card className="shadow-md flex-grow min-h-0 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <CardTitle>Detailed Inventory Stock Levels</CardTitle>
                    <CardDescription>Stock for each product across all warehouse locations.</CardDescription>
                </div>
                <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by name, SKU, category, warehouse..."
                    className="w-full sm:w-auto md:w-72"
                />
            </div>
          </CardHeader>
          <div className="flex-grow min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {isLoading ? (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                    <TableRow>
                      <TableHead className="px-2 min-w-[80px]">ID</TableHead>
                      <TableHead className="px-2 min-w-[150px]">Item Name</TableHead>
                      <TableHead className="px-2 min-w-[100px]">Category</TableHead>
                      <TableHead className="px-2 min-w-[100px]">Quantity</TableHead>
                      <TableHead className="px-2 min-w-[100px]">Min Quantity</TableHead>
                      <TableHead className="px-2 min-w-[120px]">Location</TableHead>
                      <TableHead className="px-2 min-w-[100px]">Status</TableHead>
                      <TableHead className="text-center px-2 min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(7)].map((_, i) => (
                      <TableRow key={`skel-inv-stock-${i}`} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50')}>
                        {[...Array(8)].map((__, j) => <TableCell key={j} className="px-2"><Skeleton className="h-5 w-full" /></TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : enrichedStockData.length > 0 ? (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                    <TableRow>
                      <TableHead className="px-2 min-w-[80px]">ID</TableHead>
                      <TableHead className="px-2 min-w-[150px]">Item Name</TableHead>
                      <TableHead className="px-2 min-w-[100px]">Category</TableHead>
                      <TableHead className="text-center px-2 min-w-[100px]">Quantity</TableHead>
                      <TableHead className="text-center px-2 min-w-[100px]">Min Quantity</TableHead>
                      <TableHead className="px-2 min-w-[120px]">Location</TableHead>
                      <TableHead className="px-2 min-w-[100px]">Status</TableHead>
                      <TableHead className="text-center px-2 min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrichedStockData.map((item, index) => {
                      const product = getProductById(item.productId);
                      const isLowStock = product && product.globalReorderPoint !== undefined && item.stockLevel <= product.globalReorderPoint;
                      const displayUnit = product ? getDisplayUnit(product, 'base') : 'units';
                      return (
                        <TableRow key={`${item.productId}-${item.warehouseId}`} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                          <TableCell className="px-2 text-xs font-medium">{item.productSku}</TableCell>
                          <TableCell className="px-2 text-xs">{item.productName}</TableCell>
                          <TableCell className="px-2 text-xs"><Badge variant={getCategoryBadgeVariant(item.productCategory)} className="text-xs">{item.productCategory}</Badge></TableCell>
                          <TableCell className={cn("px-2 text-xs text-center font-medium", isLowStock ? "text-destructive" : "")}>{item.stockLevel} {displayUnit}</TableCell>
                          <TableCell className="px-2 text-xs text-center">{item.globalReorderPoint !== undefined ? `${item.globalReorderPoint} ${displayUnit}` : '-'}</TableCell>
                          <TableCell className="px-2 text-xs">{item.warehouseName}</TableCell>
                          <TableCell className="px-2 text-xs">
                            <Badge variant={isLowStock ? "destructive" : "outline"} className={cn("text-xs", isLowStock ? "" : "text-green-600 border-green-600")}>
                              {isLowStock ? "Low Stock" : "In Stock"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center px-2 text-xs">
                            <div className="flex justify-center items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => router.push(`/products?view=${item.productId}`)} className="hover:text-primary p-1.5" title="View Product Definition"><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => {
                                const currentWarehouse = warehouses.find(w => w.id === item.warehouseId);
                                if(currentWarehouse) {
                                   // Logic to open stock adjustment modal pre-filled for this item & warehouse
                                   // For now, just log or show a toast.
                                   toast({title: "Adjust Stock", description: `Adjust stock for ${item.productName} in ${item.warehouseName}. (Modal to be implemented)`});
                                }
                              }} className="hover:text-primary p-1.5" title="Adjust Stock"><Edit className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="h-full flex items-center justify-center p-6">
                  <DataPlaceholder icon={Archive} title="No Inventory Stock Records" message="Adjust stock levels for products in your warehouses to see them here, or add warehouses in Settings." />
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {isProductDefineModalOpen && (
        <Dialog open={isProductDefineModalOpen} onOpenChange={setIsProductDefineModalOpen}>
          <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl max-h-[95vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-4 border-b"><DialogTitle>Define New Product</DialogTitle><FormDialogDescription>Enter product details. Stock levels are managed per warehouse.</FormDialogDescription></DialogHeader>
            <div className="flex-grow overflow-y-auto p-6">
              <ProductForm initialData={null} onSubmit={handleSubmitNewProductDefinition} onCancel={() => setIsProductDefineModalOpen(false)} isSubmitting={isLoading} />
            </div>
          </DialogContent>
        </Dialog>
      )}
      {isStockAdjustmentModalOpen && (
        <Dialog open={isStockAdjustmentModalOpen} onOpenChange={setIsStockAdjustmentModalOpen}>
          <DialogContent className="w-[90vw] sm:max-w-lg md:max-w-xl">
            <DialogHeader><DialogTitle>Adjust Stock Level</DialogTitle><FormDialogDescription>Select product, warehouse, adjustment reason, quantity, and reference.</FormDialogDescription></DialogHeader>
            <div className="py-4">
              <StockAdjustmentForm products={products} warehouses={warehouses} onSubmit={handleStockAdjustmentSubmit} onCancel={() => setIsStockAdjustmentModalOpen(false)} isSubmitting={isLoading} />
            </div>
          </DialogContent>
        </Dialog>
      )}
      {isStockTransferModalOpen && (
        <Dialog open={isStockTransferModalOpen} onOpenChange={setIsStockTransferModalOpen}>
          <DialogContent className="w-[90vw] sm:max-w-lg md:max-w-xl">
            <DialogHeader><DialogTitle>Transfer Stock</DialogTitle><FormDialogDescription>Move stock between warehouses.</FormDialogDescription></DialogHeader>
            <div className="py-4">
              <StockTransferForm products={products} warehouses={warehouses} onSubmit={handleStockTransferSubmit} onCancel={() => setIsStockTransferModalOpen(false)} isSubmitting={isLoading} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
    