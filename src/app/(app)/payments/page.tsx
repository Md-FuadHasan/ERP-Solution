
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Payments"
        description="Track customer payments, manage payment gateways, and reconcile transactions."
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-6 w-6 text-primary" />
            Payment Management
          </CardTitle>
          <CardDescription>
            Oversee incoming and outgoing payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4 border-2 border-dashed border-border rounded-lg">
            <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Payment Processing Features Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              This section will allow you to record payments received, integrate with payment gateways, and manage payment reconciliation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
