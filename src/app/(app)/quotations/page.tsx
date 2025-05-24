
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FilePlus2 } from 'lucide-react';

export default function QuotationsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Quotations"
        description="Create and manage customer quotations."
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FilePlus2 className="mr-2 h-6 w-6 text-primary" />
            Quotation Management
          </CardTitle>
          <CardDescription>
            This section will allow you to create, send, and track quotations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4 border-2 border-dashed border-border rounded-lg">
            <FilePlus2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Quotation Features Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              Soon you'll be able to generate professional quotations, convert them to sales orders or invoices, and track their status.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
