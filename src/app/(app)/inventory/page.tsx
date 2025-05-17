
'use client';
import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, AlertTriangle, CalendarClock, Archive } from 'lucide-react';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link'; // Added import for Link

export default function InventoryPage() {
  const { products, isLoading } = useData();

  const kpiData = useMemo(() => {
    if (isLoading || !products) {
      return {
        totalInventoryValue: 0,
        lowStockItemsCount: 0,
        nearingExpiryCount: 0, // Static for now
      };
    }

    const totalInventoryValue = products.reduce((sum, product) => {
      return sum + (product.stockLevel * product.costPrice);
    }, 0);

    const lowStockItemsCount = products.filter(product => product.stockLevel <= product.reorderPoint).length;

    return {
      totalInventoryValue,
      lowStockItemsCount,
      nearingExpiryCount: 5, // Static placeholder for nearing expiry
    };
  }, [products, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Inventory Management"
          description="Overview of your product stock levels, item status, and inventory value."
          actions={
            <Button className="w-full sm:w-auto" disabled>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
            </Button>
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
          <Button asChild className="w-full sm:w-auto">
            <Link href="/products">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
            </Link>
          </Button>
        }
      />

      {/* KPI Cards Section */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
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

      {/* Placeholder for Main Inventory List/Table */}
      <Card className="flex-grow flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Inventory List</CardTitle>
          <CardDescription>
            Manage and track all your products, raw materials, stock levels, and batch information.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <DataPlaceholder
            icon={Archive}
            title="Inventory List Coming Soon"
            message="Detailed product stock levels, batch tracking, and management features will be available here."
            action={
              <Button variant="secondary">
                View Product Categories (Soon)
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
