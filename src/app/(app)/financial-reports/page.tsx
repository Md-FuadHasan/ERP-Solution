
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart } from 'lucide-react';

export default function FinancialReportsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Financial Reports"
        description="Generate and view key financial statements and reports."
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AreaChart className="mr-2 h-6 w-6 text-primary" />
            Financial Reporting Suite
          </CardTitle>
          <CardDescription>
            Access Balance Sheets, Profit & Loss statements, Cash Flow, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4 border-2 border-dashed border-border rounded-lg">
            <AreaChart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Detailed Financial Reports Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              This area will provide comprehensive financial reporting tools to understand your company's financial health.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
