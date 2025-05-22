
'use client';
import { useMemo, useState } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProductForm, type ProductFormValues } from '@/components/forms/product-form';
import type { Product, ProductStockLocation } from '@/types'; // Product type already has globalReorderPoint
import { addDays, isBefore, parseISO, startOfDay } from 'date-fns';

export default function InventoryPage() {
  const { products, productStockLocations, isLoading, addProduct, companyProfile, getTotalStockForProduct } = useData();
  const { toast } = useToast();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null); 

  const kpiData = useMemo(() => {
    if (isLoading || !products || products.length === 0 || !productStockLocations) {
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
        // console.warn(`Invalid expiry date format for product ${product.id}: ${product.expiryDate}`);
        return false;
      }
    }).length;

    return {
      totalInventoryValue,
      lowStockItemsCount,
      nearingExpiryCount,
    };
  }, [products, productStockLocations, isLoading, getTotalStockForProduct]);


  const handleAdjustStock = () => {
    toast({
      title: "Coming Soon!",
      description: "Stock Adjustment feature (for specific warehouses) will be available in a future update.",
    });
  };
  
  const handleAddWarehouse = () => {
    toast({
      title: "Coming Soon!",
      description: "Add New Warehouse feature will be available in a future update.",
    });
  };

  const handleTransferStock = () => {
    toast({
      title: "Coming Soon!",
      description: "Stock Transfer feature will be available in a future update.",
    });
  };

  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setIsFormModalOpen(true);
  };

  const handleSubmitNewProduct = (data: ProductFormValues) => {
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
      globalReorderPoint: data.reorderPoint || 0, // Form's reorderPoint is the globalReorderPoint
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
    setIsFormModalOpen(false);
    setEditingProduct(null);
  };


  if (isLoading) {
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
          <CardContent className="flex-grow flex items-center justify-center">
             <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Inventory Management"
        description="Overview of your multi-warehouse inventory, product stock levels, and inventory value."
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={handleAddWarehouse} className="w-full sm:w-auto"><WarehouseIcon className="mr-2 h-4 w-4" /> Add Warehouse</Button>
            <Button onClick={handleTransferStock} className="w-full sm:w-auto"><Shuffle className="mr-2 h-4 w-4" /> Transfer Stock</Button>
            <Button onClick={handleAdjustStock} className="w-full sm:w-auto"><Edit className="mr-2 h-4 w-4" /> Adjust Stock</Button>
            <Button onClick={handleAddNewProduct} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Define New Product</Button>
          </div>
        }
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6 shrink-0">
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

      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Inventory Overview</CardTitle>
              <CardDescription>Detailed stock views and warehouse management coming soon.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <div className="h-full overflow-y-auto p-6">
          <DataPlaceholder
            icon={Archive}
            title="Detailed Inventory Views Coming Soon"
            message="This area will display comprehensive stock levels per product and warehouse, batch tracking, and more inventory management tools."
          />
        </div>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => {
        setIsFormModalOpen(isOpen);
        if (!isOpen) setEditingProduct(null);
      }}>
        <DialogContent className="w-[90vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Define New Product</DialogTitle>
            <DialogDescription>
              Enter details for the new product. Stock will be added separately for each warehouse.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
            {isFormModalOpen && (
                 <ProductForm
                    initialData={null} 
                    onSubmit={handleSubmitNewProduct}
                    onCancel={() => { setIsFormModalOpen(false); setEditingProduct(null); }}
                 />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    