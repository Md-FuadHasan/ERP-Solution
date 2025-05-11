'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { summarizeInvoiceData, type SummarizeInvoiceDataInput, type SummarizeInvoiceDataOutput } from '@/ai/flows/summarize-invoice-data';
import { MOCK_INVOICES } from '@/types'; // Using mock invoices for summary
import { Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
  const [summary, setSummary] = useState<SummarizeInvoiceDataOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setSummary(null);

    // Prepare sample data for the AI flow.
    // In a real app, you'd fetch relevant data or allow user selection.
    const sampleInvoiceDataForAI = MOCK_INVOICES.map(inv => ({
        invoiceId: inv.id,
        customerName: inv.customerName,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        totalAmount: inv.totalAmount,
        status: inv.status,
        // Add paymentDate if available from a more detailed mock or real data
    }));

    const input: SummarizeInvoiceDataInput = {
      invoiceData: JSON.stringify(sampleInvoiceDataForAI, null, 2), // Pretty print JSON for readability if needed by model
    };

    try {
      const result = await summarizeInvoiceData(input);
      setSummary(result);
      toast({
        title: "Report Generated",
        description: "Invoice summary has been successfully created.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error Generating Report",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate and view AI-powered summaries of your invoice data."
      />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Data Summary</CardTitle>
            <CardDescription>
              Click the button below to generate an AI summary of your current invoice data,
              highlighting payment trends, customer balances, and actionable insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                 <FileText className="mr-2 h-4 w-4" />
                  Generate Summary Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        )}

        {summary && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Report</CardTitle>
              <CardDescription>Below is the AI-generated summary of your invoice data.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                readOnly
                value={summary.summary}
                className="min-h-[200px] text-sm leading-relaxed bg-muted/30"
                rows={15}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
