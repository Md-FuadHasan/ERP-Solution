
'use client';
import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { InvoiceForm, type InvoiceFormValues } from '@/components/forms/invoice-form';
import { SearchInput } from '@/components/common/search-input';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import type { Invoice, Customer, PaymentRecord } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getStatusBadgeVariant } from '@/lib/invoiceUtils';
import { useData } from '@/context/DataContext'; // Import useData hook
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function InvoicesPage() {
  const { 
    invoices, 
    customers, 
    companyProfile, 
    addInvoice, 
    updateInvoice, 
    deleteInvoice, 
    isLoading 
  } = useData(); // Use DataContext

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const { toast } = useToast();

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return invoices.filter(
      (invoice) =>
        invoice.id.toLowerCase().includes(lowerSearchTerm) ||
        (invoice.customerName && invoice.customerName.toLowerCase().includes(lowerSearchTerm)) ||
        invoice.customerId.toLowerCase().includes(lowerSearchTerm)
    );
  }, [invoices, searchTerm]);

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    setIsModalOpen(true);
  };
  
  const handleViewInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      deleteInvoice(invoiceToDelete.id); // Use context action
      toast({ title: "Invoice Deleted", description: `Invoice ${invoiceToDelete.id} has been removed.` });
      setInvoiceToDelete(null);
    }
  };

  const handleSubmit = (data: InvoiceFormValues) => {
    const companyTaxRate = companyProfile.taxRate ? Number(companyProfile.taxRate) / 100 : 0.10;
    const companyVatRate = companyProfile.vatRate ? Number(companyProfile.vatRate) / 100 : 0.05;

    const processedItems = data.items.map((item, index) => ({
      ...item,
      id: editingInvoice?.items[index]?.id || `item-${Date.now()}-${index}-${Math.random().toString(36).substr(2,5)}`,
      total: item.quantity * item.unitPrice,
    }));

    const subtotal = processedItems.reduce((acc, item) => acc + item.total, 0);
    const taxAmount = subtotal * companyTaxRate;
    const vatAmount = subtotal * companyVatRate;
    const totalAmount = subtotal + taxAmount + vatAmount;
    const customerName = customers.find(c => c.id === data.customerId)?.name;

    let calculatedAmountPaid = 0;
    if (data.paymentProcessingStatus === 'Fully Paid') {
      calculatedAmountPaid = totalAmount;
    } else if (data.paymentProcessingStatus === 'Partially Paid') {
      calculatedAmountPaid = data.partialAmountPaid || 0;
      if (calculatedAmountPaid <= 0 || calculatedAmountPaid >= totalAmount) {
        toast({
          title: "Invalid Partial Payment",
          description: `Partial payment amount must be greater than $0 and less than total amount $${totalAmount.toFixed(2)}.`,
          variant: "destructive",
        });
        return; 
      }
    }

    const calculatedRemainingBalance = totalAmount - calculatedAmountPaid;
    
    let finalStatus = data.status;
    if (calculatedRemainingBalance <= 0 && totalAmount > 0) {
      finalStatus = 'Paid';
    } else if (data.status === 'Paid' && calculatedRemainingBalance > 0) {
      // If user sets to 'Paid' but balance is >0, revert to 'Sent' or 'Draft'
      finalStatus = editingInvoice?.status === 'Draft' ? 'Draft' : 'Sent'; 
    }


    let updatedPaymentHistory: PaymentRecord[] = editingInvoice?.paymentHistory ? [...editingInvoice.paymentHistory] : [];
    const previousTotalAmountPaid = editingInvoice?.amountPaid || 0;
    const paymentAmountForThisRecord = calculatedAmountPaid - previousTotalAmountPaid;

    if (paymentAmountForThisRecord > 0) { // Only add a record if new payment is made
        const paymentRecordStatus: PaymentRecord['status'] = 
            (calculatedRemainingBalance <= 0 && totalAmount > 0 && calculatedAmountPaid >= previousTotalAmountPaid) // Check if this payment makes it fully paid
            ? 'Full Payment' 
            : 'Partial Payment';

        const newPaymentRecord: PaymentRecord = {
            id: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            paymentDate: new Date().toISOString(),
            amount: paymentAmountForThisRecord, // The amount of *this* specific payment
            status: paymentRecordStatus,
        };
        updatedPaymentHistory.push(newPaymentRecord);
    }


    const invoiceData: Invoice = {
      id: data.id, 
      customerId: data.customerId,
      customerName,
      items: processedItems,
      subtotal,
      taxAmount,
      vatAmount,
      totalAmount,
      issueDate: format(data.issueDate, 'yyyy-MM-dd'),
      dueDate: format(data.dueDate, 'yyyy-MM-dd'),
      status: finalStatus,
      paymentProcessingStatus: data.paymentProcessingStatus,
      amountPaid: calculatedAmountPaid, // This is the *total* amount paid so far
      remainingBalance: calculatedRemainingBalance,
      paymentHistory: updatedPaymentHistory,
    };

    if (editingInvoice) {
      updateInvoice(invoiceData); // Use context action
      toast({ title: "Invoice Updated", description: `Invoice ${invoiceData.id} details have been updated.` });
    } else {
      addInvoice(invoiceData); // Use context action
      toast({ title: "Invoice Created", description: `Invoice ${invoiceData.id} has been successfully created.` });
    }
    setIsModalOpen(false);
    setEditingInvoice(null);
  };
  
  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Invoices"
          description="Create, track, and manage your invoices."
          actions={
            <Button onClick={handleAddInvoice} disabled>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
            </Button>
          }
        />
        <div className="mb-6">
          <Skeleton className="h-10 w-full md:w-80" />
        </div>
        <div className="rounded-lg border shadow-sm bg-card p-4">
          <Skeleton className="h-8 w-1/4 mb-4" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4 py-2 border-b last:border-b-0">
              <Skeleton className="h-6 flex-1" />
              <Skeleton className="h-6 flex-1" />
              <Skeleton className="h-6 flex-1" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create, track, and manage your invoices."
        actions={
          <Button onClick={handleAddInvoice}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
          </Button>
        }
      />
      <div className="mb-6">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by Invoice ID, Customer Name, or Customer ID..."
        />
      </div>

      {filteredInvoices.length > 0 ? (
        <div className="rounded-lg border shadow-sm bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.customerName || customers.find(c=>c.id === invoice.customerId)?.name || invoice.customerId}</TableCell>
                  <TableCell>{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>${invoice.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>${invoice.amountPaid.toFixed(2)}</TableCell>
                  <TableCell>${invoice.remainingBalance.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(invoice)} className="hover:text-primary" title="View/Edit Invoice">
                      <Eye className="h-4 w-4" />
                    </Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:text-destructive" title="Delete Invoice" onClick={(e) => {
                            e.stopPropagation(); 
                            handleDeleteInvoice(invoice);
                          }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete invoice
                            "{invoice.id}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setInvoiceToDelete(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => confirmDelete()} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
         <DataPlaceholder
          title="No Invoices Found"
          message={searchTerm ? "Try adjusting your search term." : "Get started by creating your first invoice."}
          action={!searchTerm && (
            <Button onClick={handleAddInvoice}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Invoice
            </Button>
          )}
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
          setIsModalOpen(isOpen);
          if (!isOpen) setEditingInvoice(null);
      }}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            <DialogDescription>
              {editingInvoice ? `Update details for invoice ${editingInvoice.id}.` : 'Fill in the details to create a new invoice.'}
            </DialogDescription>
          </DialogHeader>
          <InvoiceForm
            initialData={editingInvoice}
            customers={customers}
            companyProfile={companyProfile}
            onSubmit={handleSubmit}
            onCancel={() => { setIsModalOpen(false); setEditingInvoice(null); }}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!invoiceToDelete} onOpenChange={(isOpen) => { if (!isOpen) setInvoiceToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice
              "{invoiceToDelete?.id}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setInvoiceToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
