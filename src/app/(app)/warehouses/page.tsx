
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Warehouse as WarehouseIcon } from 'lucide-react'; // Renamed import to avoid conflict
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WarehousesPage() {
  // TODO: Eventually move warehouse management logic from Settings here.
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Warehouses"
        description="Oversee and manage all your warehouse locations and stock."
         actions={
          <Button asChild>
            <Link href="/settings?tab=config-warehouses">Configure Warehouses</Link>
          </Button>
        }
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <WarehouseIcon className="mr-2 h-6 w-6 text-primary" />
            Warehouse Overview
          </CardTitle>
          <CardDescription>
            View details and stock levels for each warehouse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4 border-2 border-dashed border-border rounded-lg">
            <WarehouseIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Warehouse Management Portal</h3>
            <p className="text-muted-foreground max-w-md">
              This section will provide detailed views of each warehouse's stock, transaction history, and management tools. Warehouse configuration is in Settings.
            </p>
             <Button variant="outline" className="mt-4" asChild>
                <Link href="/inventory">Go to Inventory Overview</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
