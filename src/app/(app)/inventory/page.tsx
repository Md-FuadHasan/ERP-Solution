
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, PackageWarning, CalendarClock, Archive } from 'lucide-react';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function InventoryPage() {
  // Placeholder data - will be replaced with dynamic data later
  const kpiData = {
    totalInventoryValue: 125340.50,
    lowStockItemsCount: 12,
    nearingExpiryCount: 5,
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Inventory Management"
        description="Overview of your product stock levels, item status, and inventory value."
        actions={
          <Button className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
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
              ${kpiData.totalInventoryValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).substring(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated value of all stock on hand.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <PackageWarning className="h-5 w-5 text-destructive" />
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
              Batches expiring within the next 30 days.
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
