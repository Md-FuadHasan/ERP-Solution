
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

export default function SalesPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Sales Management"
        description="Manage sales orders, track sales performance, and analyze sales data."
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-6 w-6 text-primary" />
            Sales Overview
          </CardTitle>
          <CardDescription>
            This section will help you manage your sales pipeline and performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4 border-2 border-dashed border-border rounded-lg">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Sales Features Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              Get ready for tools to manage sales orders, track salesperson performance, view sales analytics, and integrate with your invoicing process.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
