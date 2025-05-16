
'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import type { Invoice, Customer, CompanyProfile, InvoiceItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, Edit, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getStatusBadgeVariant } from '@/lib/invoiceUtils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { QRCodeCanvas } from 'qrcode.react';

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const { getInvoiceById, getCustomerById, companyProfile, isLoading: isDataContextLoading } = useData();
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null | undefined>(undefined); // undefined for loading, null for not found
  const [customer, setCustomer] = useState<Customer | null | undefined>(undefined);
  const [pageLoading, setPageLoading] = useState(true);
  const [qrCodeValue, setQrCodeValue] = useState('');

  const invoiceId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (invoiceId && !isDataContextLoading) {
      const foundInvoice = getInvoiceById(invoiceId);
      setInvoice(foundInvoice);
      if (foundInvoice) {
        const foundCustomer = getCustomerById(foundInvoice.customerId);
        setCustomer(foundCustomer);
        setQrCodeValue(`Invoice ID: ${foundInvoice.id}\nTotal Amount: $${foundInvoice.totalAmount.toFixed(2)}\nDue Date: ${format(new Date(foundInvoice.dueDate), 'MMM d, yyyy')}`);
      } else {
        setCustomer(null); // Invoice not found, so customer is also not applicable
      }
      setPageLoading(false);
    } else if (!isDataContextLoading && !invoiceId) {
        // No invoiceId provided or invalid
        setInvoice(null);
        setCustomer(null);
        setPageLoading(false);
    }
  }, [invoiceId, getInvoiceById, getCustomerById, isDataContextLoading]);

  const handlePrint = () => {
    toast({ title: "Print Action", description: "Print functionality would be implemented here." });
    // window.print(); // Basic browser print
  };

  const handleDownloadPDF = () => {
    toast({ title: "Download PDF Action", description: "PDF download functionality would be implemented here." });
  };

  const handleEditInvoice = () => {
    if (invoice) {
      router.push(`/invoices?action=edit&id=${invoice.id}`);
    }
  };
  
  const taxRatePercent = companyProfile.taxRate ? parseFloat(String(companyProfile.taxRate)) : 0;

  if (pageLoading || isDataContextLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto bg-card shadow-lg rounded-lg animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-24 mb-4" /> {/* Back button placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <Skeleton className="h-5 w-20 mb-1" />
            <Skeleton className="h-4 w-40 mb-0.5" />
            <Skeleton className="h-4 w-32 mb-0.5" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div>
            <Skeleton className="h-5 w-20 mb-1" />
            <Skeleton className="h-4 w-36 mb-0.5" />
            <Skeleton className="h-4 w-44 mb-0.5" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Separator className="my-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 mb-6 text-sm">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
        
        <Separator className="my-8" />
        <h2 className="text-xl font-semibold mb-4"><Skeleton className="h-6 w-32" /></h2>
        <div className="overflow-x-auto mb-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                <TableHead className="text-center"><Skeleton className="h-5 w-12" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-5 w-16" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-5 w-20" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(2)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-between items-start mb-8">
            <Skeleton className="h-32 w-32" /> {/* QR Code Skeleton */}
            <div className="w-full max-w-xs space-y-2">
                <Skeleton className="h-5 w-32 ml-auto" />
                <Skeleton className="h-5 w-28 ml-auto" />
                <Skeleton className="h-6 w-36 ml-auto" />
                <Skeleton className="h-5 w-24 ml-auto mt-2" />
                <Skeleton className="h-6 w-28 ml-auto" />
            </div>
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <h2 className="text-2xl font-semibold mb-2 text-destructive">Invoice Not Found</h2>
        <p className="text-muted-foreground mb-4">The invoice with ID "{invoiceId}" could not be found.</p>
        <Button onClick={() => router.push('/invoices')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
        </Button>
      </div>
    );
  }
  
  if (!customer) {
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <h2 className="text-2xl font-semibold mb-2 text-destructive">Customer Not Found</h2>
        <p className="text-muted-foreground mb-4">The customer for invoice "{invoiceId}" could not be found.</p>
         <Button onClick={() => router.push('/invoices')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
        </Button>
      </div>
    );
  }


  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto bg-card shadow-lg rounded-lg">
      <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-6 group">
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back
      </Button>

      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Invoice {invoice.id}</h1>
        <Badge variant={getStatusBadgeVariant(invoice.status)} className="text-sm px-3 py-1">
          {invoice.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8 text-sm">
        <div>
          <p className="text-muted-foreground mb-1">From</p>
          <p className="font-semibold text-foreground">{companyProfile.name}</p>
          <p className="text-muted-foreground whitespace-pre-line">{companyProfile.address}</p>
        </div>
        <div className="md:text-left"> 
          <p className="text-muted-foreground mb-1">Bill To</p>
          <p className="font-semibold text-foreground">{customer.name}</p>
          <p className="text-muted-foreground whitespace-pre-line">{customer.billingAddress}</p>
        </div>
      </div>
      
      <Separator className="my-6 md:my-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 mb-6 text-sm">
        <div>
          <p className="text-muted-foreground">Invoice Number:</p>
          <p className="font-medium text-foreground">{invoice.id}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Issue Date:</p>
          <p className="font-medium text-foreground">{format(new Date(invoice.issueDate), 'MMM d, yyyy')}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Due Date:</p>
          <p className="font-medium text-foreground">{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</p>
        </div>
      </div>

      <Separator className="my-6 md:my-8" />

      <h2 className="text-xl font-semibold mb-4 text-foreground">Invoice Items</h2>
      <div className="overflow-x-auto mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Item</TableHead>
              <TableHead className="text-center w-24">Qty</TableHead>
              <TableHead className="text-right w-32">Price</TableHead>
              <TableHead className="text-right w-32">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item: InvoiceItem, index: number) => (
              <TableRow key={item.id || index}>
                <TableCell className="font-medium text-foreground">{item.description}</TableCell>
                <TableCell className="text-center text-muted-foreground">{item.quantity} ({item.unitType})</TableCell>
                <TableCell className="text-right text-muted-foreground">${item.unitPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium text-foreground">${item.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col-reverse md:flex-row justify-between items-start mb-8 gap-6">
        <div className="w-full md:w-auto flex justify-center md:justify-start">
          {qrCodeValue && (
            <div className="p-2 border rounded-md inline-block bg-white">
              <QRCodeCanvas value={qrCodeValue} size={128} bgColor="#ffffff" fgColor="#000000" level="Q" />
            </div>
          )}
        </div>
        <div className="w-full md:max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground">${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax ({taxRatePercent.toFixed(0)}%)</span> 
            <span className="font-medium text-foreground">${invoice.taxAmount.toFixed(2)}</span>
          </div>
          {invoice.vatAmount > 0 && (
             <div className="flex justify-between">
                <span className="text-muted-foreground">VAT ({companyProfile.vatRate ? parseFloat(String(companyProfile.vatRate)).toFixed(0) : '0'}%)</span>
                <span className="font-medium text-foreground">${invoice.vatAmount.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span className="text-foreground">Total</span>
            <span className="text-foreground">${invoice.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-green-600">Amount Paid</span>
            <span className="font-medium text-green-600">${invoice.amountPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-foreground">Balance Due</span>
            <span className="text-destructive">${invoice.remainingBalance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Separator className="my-6 md:my-8" />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
        <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
        </div>
        <Button onClick={handleEditInvoice} className="w-full sm:w-auto">
          <Edit className="mr-2 h-4 w-4" /> Edit Invoice
        </Button>
      </div>
    </div>
  );
}
