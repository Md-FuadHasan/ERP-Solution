
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calculator } from 'lucide-react';

export default function AccountingPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Accounting"
        description="Manage your chart of accounts, journal entries, and financial statements."
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-6 w-6 text-primary" />
            Financial Accounting Hub
          </CardTitle>
          <CardDescription>
            This section will provide comprehensive accounting tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4 border-2 border-dashed border-border rounded-lg">
            <Calculator className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Accounting Features Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              Manage general ledger, accounts payable/receivable, financial statements (Balance Sheet, P&L), and more.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
