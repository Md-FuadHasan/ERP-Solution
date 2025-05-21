
'use client';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, AlertTriangle, CalendarClock, Archive, Edit, ListFilter, PlusCircle } from 'lucide-react';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProductForm, type ProductFormValues } from '@/components/forms/product-form';
import type { Product } from '@/types';
import { addDays, isBefore, parseISO, startOfDay } from 'date-fns'; // Added date-fns imports

export default function InventoryPage() {
  const { products, isLoading, addProduct, companyProfile } = useData();
  const { toast } = useToast();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const kpiData = useMemo(() => {
    if (isLoading || !products || products.length === 0) {
      return {
        totalInventoryValue: 0,
        lowStockItemsCount: 0,
        nearingExpiryCount: 0,
      };
    }

    const totalInventoryValue = products.reduce((sum, product) => {
      const stock = typeof product.stockLevel === 'number' ? product.stockLevel : 0;
      const cost = typeof product.costPrice === 'number' ? product.costPrice : 0;
      return sum + (stock * cost);
    }, 0);

    const lowStockItemsCount = products.filter(product => product.stockLevel <= product.reorderPoint).length;

    const today = startOfDay(new Date());
    const expiryThresholdDate = addDays(today, 30); // Items expiring within the next 30 days

    const nearingExpiryCount = products.filter(product => {
      if (!product.expiryDate) return false;
      try {
        const expiry = startOfDay(parseISO(product.expiryDate));
        return isBefore(expiry, expiryThresholdDate) && !isBefore(expiry, today); // Nearing expiry but not yet expired
      } catch (e) {
        console.warn(`Invalid expiry date format for product ${product.id}: ${product.expiryDate}`);
        return false;
      }
    }).length;

    return {
      totalInventoryValue,
      lowStockItemsCount,
      nearingExpiryCount,
    };
  }, [products, isLoading]);

  const lowStockProducts = useMemo(() => {
    if (isLoading || !products) return [];
    return products.filter(product => product.stockLevel <= product.reorderPoint);
  }, [products, isLoading]);

  const handleAdjustStock = () => {
    toast({
      title: "Coming Soon!",
      description: "Stock Adjustment feature will be available in a future update.",
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
    
    const newProduct: Product = {
      id: finalProductId,
      name: data.name,
      sku: data.sku || '',
      category: data.category,
      unitType: data.unitType,
      piecesInBaseUnit: data.piecesInBaseUnit || (data.unitType.toLowerCase() === 'pcs' ? 1 : undefined),
      packagingUnit: data.packagingUnit && data.packagingUnit.trim() !== '' ? data.packagingUnit.trim() : undefined,
      itemsPerPackagingUnit: data.packagingUnit && data.packagingUnit.trim() !== '' && data.itemsPerPackagingUnit ? data.itemsPerPackagingUnit : undefined,
      stockLevel: data.stockLevel || 0, // Default stockLevel for new products
      reorderPoint: data.reorderPoint || 0,
      basePrice: data.basePrice || 0,
      costPrice: data.costPrice || 0,
      exciseTax: data.exciseTaxAmount === undefined || data.exciseTaxAmount === null ? 0 : data.exciseTaxAmount,
      batchNo: data.batchNo || undefined,
      productionDate: data.productionDate ? data.productionDate.toISOString() : undefined,
      expiryDate: data.expiryDate ? data.expiryDate.toISOString() : undefined,
      discountRate: data.discountRate === undefined || data.discountRate === null ? 0 : data.discountRate,
      createdAt: new Date().toISOString(),
    };

    addProduct(newProduct);
    toast({ title: "Product Added", description: `${newProduct.name} has been successfully added.` });
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
              <Button className="w-full sm:w-auto" disabled>
                <Edit className="mr-2 h-4 w-4" /> Adjust Stock
              </Button>
              <Button className="w-full sm:w-auto" disabled>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
              </Button>
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
            <Skeleton className="h-32 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Inventory Management"
        description="Overview of your product stock levels, item status, and inventory value."
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={handleAdjustStock} className="w-full sm:w-auto">
              <Edit className="mr-2 h-4 w-4" /> Adjust Stock
            </Button>
            <Button onClick={handleAddNewProduct} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
            </Button>
          </div>
        }
      />

      {/* KPI Cards Section */}
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
              Estimated value of all stock on hand.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {kpiData.lowStockItemsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Items at or below reorder point.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Nearing Expiry</CardTitle>
            <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
              {kpiData.nearingExpiryCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Products expiring within 30 days.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Items Table */}
      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Low Stock Items</CardTitle>
              <CardDescription>Products at or below their reorder point.</CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled>
              <ListFilter className="mr-2 h-3.5 w-3.5" /> Filter (Soon)
            </Button>
          </div>
        </CardHeader>
        <div className="h-full overflow-y-auto">
          {lowStockProducts.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[150px]">Product Name</TableHead>
                  <TableHead className="min-w-[100px]">SKU</TableHead>
                  <TableHead className="text-right min-w-[100px]">Current Stock</TableHead>
                  <TableHead className="text-right min-w-[100px]">Reorder Point</TableHead>
                  <TableHead className="text-right min-w-[100px]">Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product, index) => (
                  <TableRow key={product.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      {product.stockLevel} {product.unitType}
                    </TableCell>
                    <TableCell className="text-right">{product.reorderPoint} {product.unitType}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      {product.reorderPoint - product.stockLevel} {product.unitType}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <DataPlaceholder
                icon={Archive}
                title="No Low Stock Items"
                message="All products are currently above their reorder points."
              />
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => {
        setIsFormModalOpen(isOpen);
        if (!isOpen) setEditingProduct(null);
      }}>
        <DialogContent className="w-[90vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Enter the details for the new product.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
            <ProductForm
              initialData={null}
              onSubmit={handleSubmitNewProduct}
              onCancel={() => { setIsFormModalOpen(false); setEditingProduct(null); }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
