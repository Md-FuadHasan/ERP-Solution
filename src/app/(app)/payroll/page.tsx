
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Banknote } from 'lucide-react';

export default function PayrollPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Payroll"
        description="Manage employee salaries, deductions, and payroll processing."
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Banknote className="mr-2 h-6 w-6 text-primary" />
            Payroll Processing
          </CardTitle>
          <CardDescription>
            Handle all aspects of employee compensation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4 border-2 border-dashed border-border rounded-lg">
            <Banknote className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Payroll Management Features Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              This section will allow for salary calculations, payslip generation, tax deductions, and payroll processing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
