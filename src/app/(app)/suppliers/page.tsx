
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SuppliersPage() {
  // TODO: Eventually move supplier management logic from Settings here.
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Suppliers"
        description="Manage your supplier information and purchase history."
         actions={
          <Button asChild>
            <Link href="/settings?tab=config-suppliers">Configure Suppliers</Link>
          </Button>
        }
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="mr-2 h-6 w-6 text-primary" />
            Supplier Hub
          </CardTitle>
          <CardDescription>
            View supplier details, track purchase orders, and manage relationships.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4 border-2 border-dashed border-border rounded-lg">
            <Truck className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Supplier Management Portal</h3>
            <p className="text-muted-foreground max-w-md">
              Detailed supplier listings, purchase order history, and contact management will be available here. For now, supplier configuration is in Settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
