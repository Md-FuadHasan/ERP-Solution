
'use client';
import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, AlertTriangle, CalendarClock, Archive, Edit, ListFilter } from 'lucide-react';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function InventoryPage() {
  const { products, isLoading } = useData();
  const { toast } = useToast();

  const kpiData = useMemo(() => {
    if (isLoading || !products || products.length === 0) {
      return {
        totalInventoryValue: 0,
        lowStockItemsCount: 0,
        nearingExpiryCount: 0, // Static for now
      };
    }

    const totalInventoryValue = products.reduce((sum, product) => {
      return sum + (product.stockLevel * product.costPrice); // Make sure costPrice is per base unit
    }, 0);

    const lowStockItemsCount = products.filter(product => product.stockLevel <= product.reorderPoint).length;

    return {
      totalInventoryValue,
      lowStockItemsCount,
      nearingExpiryCount: 5, // Static placeholder for nearing expiry
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
              <Button asChild className="w-full sm:w-auto" disabled>
                <Link href="/products">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
                </Link>
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
            <Button asChild className="w-full sm:w-auto">
              <Link href="/products">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
              </Link>
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
              Batches expiring soon (mock data).
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
    </div>
  );
}

    