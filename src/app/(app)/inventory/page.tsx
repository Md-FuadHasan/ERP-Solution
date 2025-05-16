
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive } from 'lucide-react';

export default function InventoryPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Inventory Management"
        description="Track your product stock levels, manage inventory movements, and more."
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Archive className="mr-2 h-6 w-6 text-primary" />
            Inventory Overview
          </CardTitle>
          <CardDescription>
            This section will provide tools and insights for managing your inventory effectively.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4 border-2 border-dashed border-border rounded-lg">
            <Archive className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Inventory Features Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              We're working on bringing you a comprehensive inventory management system. Stay tuned for updates on product tracking, stock adjustments, low stock alerts, and more.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
