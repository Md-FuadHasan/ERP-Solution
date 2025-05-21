
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
import { Printer, Download, Edit, ArrowLeft, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { getStatusBadgeVariant } from '@/lib/invoiceUtils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        setCustomer(null); 
      }
      setPageLoading(false);
    } else if (!isDataContextLoading && !invoiceId) {
        setInvoice(null);
        setCustomer(null);
        setPageLoading(false);
    }
  }, [invoiceId, getInvoiceById, getCustomerById, isDataContextLoading]);

  const handlePrint = () => {
    toast({ title: "Print Action", description: "Print functionality would be implemented here." });
  };

  const handleDownloadPDF = () => {
    toast({ title: "Download PDF Action", description: "PDF download functionality would be implemented here." });
  };

  const handleEditInvoice = () => {
    if (invoice) {
      router.push(`/invoices?action=edit&id=${invoice.id}`);
    }
  };
  
  const vatRatePercent = companyProfile?.vatRate ? (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : companyProfile.vatRate) : 0;


  if (pageLoading || isDataContextLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto bg-card shadow-lg rounded-lg animate-pulse">
        <Skeleton className="h-6 w-24 mb-8" /> 
        
        <header className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-10 w-40" /> 
            <Skeleton className="h-8 w-24" /> 
          </div>
          <Skeleton className="h-4 w-32" /> 
        </header>
        
        <section className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
          <div>
            <Skeleton className="h-4 w-16 mb-2" /> 
            <Skeleton className="h-6 w-48 mb-1" /> 
            <Skeleton className="h-4 w-full mb-0.5" /> 
            <Skeleton className="h-4 w-3/4 mb-0.5" /> 
            <Skeleton className="h-4 w-5/6" /> 
          </div>
          <div className="md:text-left">
            <Skeleton className="h-4 w-16 mb-2" /> 
            <Skeleton className="h-6 w-40 mb-1" /> 
            <Skeleton className="h-4 w-full mb-0.5" /> 
            <Skeleton className="h-4 w-3/4 mb-0.5" /> 
            <Skeleton className="h-4 w-5/6" /> 
          </div>
        </section>
        
        <Separator className="my-8" />

        <section className="mb-8 p-4 sm:p-6 rounded-lg border bg-muted/40">
           <div className="grid grid-cols-3 gap-x-4 text-sm"> 
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-20" /> 
                <Skeleton className="h-5 w-full max-w-[100px] sm:max-w-[120px]" /> 
              </div>
            ))}
          </div>
        </section>
        
        <section className="mb-8">
          <Skeleton className="h-6 w-36 mb-4" /> 
          <div className="overflow-x-auto rounded-lg border">
            <Skeleton className="h-48 w-full" /> 
          </div>
        </section>

        <section className="flex flex-col-reverse md:flex-row justify-between items-start mb-8 gap-8">
            <div className="w-full md:w-auto flex flex-col items-center md:items-start">
                <Skeleton className="h-5 w-32 mb-2" /> 
                <Skeleton className="h-32 w-32" /> 
            </div>
            <div className="w-full md:max-w-sm space-y-2.5 border p-4 sm:p-6 rounded-lg bg-muted/40">
                <Skeleton className="h-5 w-24 ml-auto" />
                <Skeleton className="h-5 w-20 ml-auto" /> 
                <Skeleton className="h-1 w-full my-3 !bg-border" />
                <Skeleton className="h-6 w-28 ml-auto" />
                <Skeleton className="h-5 w-24 ml-auto mt-2" />
                <Skeleton className="h-6 w-32 ml-auto" />
            </div>
        </section>
        <Separator className="my-8" />
        <footer className="flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </footer>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-4">
        <h2 className="text-2xl font-semibold mb-2 text-destructive">Invoice Not Found</h2>
        <p className="text-muted-foreground mb-4">The invoice with ID "{invoiceId}" could not be found.</p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }
  
  if (!customer) {
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-4">
        <h2 className="text-2xl font-semibold mb-2 text-destructive">Customer Not Found</h2>
        <p className="text-muted-foreground mb-4">The customer for invoice "{invoiceId}" could not be found.</p>
         <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto bg-card shadow-lg rounded-lg">
      <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-8 group print:hidden">
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back
      </Button>

      <header className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">INVOICE</h1>
          <Badge variant={getStatusBadgeVariant(invoice.status)} className="text-base px-4 py-1.5">
            {invoice.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Invoice # {invoice.id}</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8 text-sm">
        <div>
          <h3 className="text-xs uppercase font-semibold text-muted-foreground mb-2">From</h3>
          <p className="font-semibold text-lg text-foreground">{companyProfile?.name || 'Your Company'}</p>
          <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{companyProfile?.address}</p>
          <p className="text-muted-foreground">{companyProfile?.email} | {companyProfile?.phone}</p>
        </div>
        <div className="md:text-left"> 
          <h3 className="text-xs uppercase font-semibold text-muted-foreground mb-2">Bill To</h3>
          <p className="font-semibold text-lg text-foreground">{customer.name}</p>
          <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{customer.billingAddress}</p>
          <p className="text-muted-foreground">{customer.email} | {customer.phone}</p>
        </div>
      </section>
      
      <Separator className="my-8" />

      <section className="mb-8 p-4 sm:p-6 rounded-lg border bg-muted/40">
        <div className="grid grid-cols-3 gap-x-4 text-sm"> 
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Issue Date</p>
            <p className="font-medium text-base text-foreground">{format(new Date(invoice.issueDate), 'MMMM d, yyyy')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Due Date</p>
            <p className="font-medium text-base text-foreground">{format(new Date(invoice.dueDate), 'MMMM d, yyyy')}</p>
          </div>
           <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Invoice Total</p>
            <p className="font-bold text-base text-primary">${invoice.totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Order Summary</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="min-w-[200px] pl-4 sm:pl-6">Item Description</TableHead>
                <TableHead className="text-center w-24">Qty</TableHead>
                <TableHead className="text-right w-32">Unit Price (incl. Excise)</TableHead>
                <TableHead className="text-right w-32 pr-4 sm:pr-6">Amount (incl. Excise)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item: InvoiceItem, index: number) => (
                <TableRow key={item.id || index} className="even:bg-muted/20">
                  <TableCell className="font-medium text-foreground py-3 pl-4 sm:pl-6">{item.description}</TableCell>
                  <TableCell className="text-center text-muted-foreground py-3">{item.quantity} ({item.unitType})</TableCell>
                  <TableCell className="text-right text-muted-foreground py-3">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium text-foreground py-3 pr-4 sm:pr-6">${item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="flex flex-col-reverse md:flex-row justify-between items-start mb-8 gap-8">
        <div className="w-full md:w-auto flex flex-col items-center md:items-start print:hidden">
          {qrCodeValue && (
            <>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center"><QrCode className="w-4 h-4 mr-2"/>Scan for Quick Details</h3>
              <div className="p-3 border rounded-lg inline-block bg-white shadow-sm">
                <QRCodeCanvas value={qrCodeValue} size={128} bgColor="#ffffff" fgColor="#000000" level="Q" />
              </div>
            </>
          )}
        </div>
        <div className="w-full md:max-w-sm space-y-2.5 text-sm border p-4 sm:p-6 rounded-lg bg-muted/40">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal (incl. Item Excise):</span>
            <span className="font-medium text-foreground">${invoice.subtotal.toFixed(2)}</span>
          </div>
          {invoice.vatAmount > 0 && (
             <div className="flex justify-between">
                <span className="text-muted-foreground">VAT ({vatRatePercent.toFixed(0)}%):</span>
                <span className="font-medium text-foreground">${invoice.vatAmount.toFixed(2)}</span>
            </div>
          )}
          <Separator className="my-3 !bg-border" />
          <div className="flex justify-between text-base font-semibold">
            <span className="text-foreground">Total Amount:</span>
            <span className="text-foreground">${invoice.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mt-2 text-green-600 dark:text-green-400">
            <span className="font-medium">Amount Paid:</span>
            <span className="font-semibold">${invoice.amountPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span className="text-foreground">Balance Due:</span>
            <span className={`${invoice.remainingBalance > 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
              ${invoice.remainingBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </section>

      {invoice.paymentHistory && invoice.paymentHistory.length > 0 && (
        <section className="mb-8 print:hidden">
          <Separator className="my-8" />
          <h3 className="text-lg font-semibold text-foreground mb-3">Payment History</h3>
            <div className="rounded-md border">
            {invoice.paymentHistory.map((record, index) => (
                <div key={record.id} className={`p-3 ${index < invoice.paymentHistory!.length -1 ? 'border-b' : ''} ${index % 2 === 0 ? 'bg-muted/20' : 'bg-card'}`}>
                    <div className="flex justify-between items-center text-sm">
                        <div>
                            <p className="font-medium">{record.status} {record.paymentMethod ? `(${record.paymentMethod})` : ''}</p>
                            <p className="text-xs text-muted-foreground">
                                {format(new Date(record.paymentDate), "MMM d, yyyy 'at' hh:mm a")}
                            </p>
                        </div>
                        <p className="font-semibold text-primary">${record.amount.toFixed(2)}</p>
                    </div>
                    {record.paymentMethod === 'Cash' && record.cashVoucherNumber && (
                        <p className="text-xs text-muted-foreground mt-1">Voucher: {record.cashVoucherNumber}</p>
                    )}
                    {record.paymentMethod === 'Bank Transfer' && (
                        <div className="text-xs text-muted-foreground mt-1">
                        {record.bankName && <p>Bank: {record.bankName}</p>}
                        {record.bankAccountNumber && <p>Acc: {record.bankAccountNumber}</p>}
                        {record.onlineTransactionNumber && <p>TxN: {record.onlineTransactionNumber}</p>}
                        </div>
                    )}
                </div>
            ))}
            </div>
        </section>
      )}
      
      <Separator className="my-8 print:hidden" />

      <footer className="flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-4 print:hidden">
        <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto">
          <Printer className="mr-2 h-4 w-4" /> Print Invoice
        </Button>
        <Button variant="outline" onClick={handleDownloadPDF} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
        <Button onClick={handleEditInvoice} className="w-full sm:w-auto">
          <Edit className="mr-2 h-4 w-4" /> Edit Invoice
        </Button>
      </footer>
      
      <div className="mt-12 text-center text-xs text-muted-foreground print:block hidden">
        <p>Thank you for your business!</p>
        {companyProfile && <p>{companyProfile.name} | {companyProfile.email} | {companyProfile.phone}</p>}
      </div>

    </div>
  );
}

    