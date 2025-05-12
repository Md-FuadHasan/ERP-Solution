
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
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvoicesPage() {
  const { 
    invoices, 
    customers, 
    companyProfile, 
    addInvoice, 
    updateInvoice, 
    deleteInvoice, 
    isLoading 
  } = useData();

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
      deleteInvoice(invoiceToDelete.id);
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
      unitType: item.unitType || 'PCS',
    }));

    const subtotal = processedItems.reduce((acc, item) => acc + item.total, 0);
    const taxAmount = subtotal * companyTaxRate;
    const vatAmount = subtotal * companyVatRate;
    const totalAmount = subtotal + taxAmount + vatAmount;
    const customerName = customers.find(c => c.id === data.customerId)?.name;

    const previousTotalAmountPaid = editingInvoice?.amountPaid || 0;
    let newPaymentAmount = 0;

    if (data.paymentProcessingStatus === 'Fully Paid') {
      newPaymentAmount = totalAmount - previousTotalAmountPaid;
       if (newPaymentAmount < 0) newPaymentAmount = 0; // ensure not negative if already overpaid somehow
    } else if (data.paymentProcessingStatus === 'Partially Paid' && data.partialAmountPaid && data.partialAmountPaid > 0) {
      newPaymentAmount = data.partialAmountPaid;
       if (previousTotalAmountPaid + newPaymentAmount > totalAmount) {
         // Cap partial payment if it would exceed total. Or let it overpay? For now, cap.
         // Or, better, this validation should be in the form if strict.
         // For now, we assume data.partialAmountPaid is the intended payment.
       }
    }
    
    const calculatedAmountPaid = previousTotalAmountPaid + newPaymentAmount; // New total amount paid
    
    if (data.paymentProcessingStatus === 'Partially Paid' && data.partialAmountPaid) {
        if (data.partialAmountPaid <= 0 || (editingInvoice && (previousTotalAmountPaid + data.partialAmountPaid) >= totalAmount && (previousTotalAmountPaid + data.partialAmountPaid) !== totalAmount) ) {
             if(data.partialAmountPaid > 0 && (previousTotalAmountPaid + data.partialAmountPaid) === totalAmount && data.paymentProcessingStatus !== 'Fully Paid') {
                // This case is fine, it makes it fully paid
             } else {
                toast({
                title: "Invalid Partial Payment",
                description: `Partial payment $${data.partialAmountPaid.toFixed(2)} is invalid. Ensure it's positive and does not exceed remaining balance $${(totalAmount - previousTotalAmountPaid).toFixed(2)} unless it's a full payment.`,
                variant: "destructive",
                });
                return; 
             }
        }
    }


    const calculatedRemainingBalance = totalAmount - calculatedAmountPaid;
    
    let finalStatus = data.status;
    if (calculatedRemainingBalance <= 0 && totalAmount > 0) {
      finalStatus = 'Received';
    } else if (data.status === 'Received' && calculatedRemainingBalance > 0) {
      finalStatus = editingInvoice?.status === 'Draft' ? 'Draft' : 'Due'; 
    }


    let updatedPaymentHistory: PaymentRecord[] = editingInvoice?.paymentHistory ? [...editingInvoice.paymentHistory] : [];

    if (newPaymentAmount > 0 && data.paymentMethod) { // A payment was actually made
        const paymentRecordStatus: PaymentRecord['status'] = 
            (calculatedRemainingBalance <= 0 && totalAmount > 0)
            ? 'Full Payment' 
            : 'Partial Payment';

        const newPaymentRecord: PaymentRecord = {
            id: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            paymentDate: new Date().toISOString(),
            amount: newPaymentAmount,
            status: paymentRecordStatus,
            paymentMethod: data.paymentMethod,
            cashVoucherNumber: data.paymentMethod === 'Cash' ? data.cashVoucherNumber : undefined,
            bankName: data.paymentMethod === 'Bank Transfer' ? data.bankName : undefined,
            bankAccountNumber: data.paymentMethod === 'Bank Transfer' ? data.bankAccountNumber : undefined,
            onlineTransactionNumber: data.paymentMethod === 'Bank Transfer' ? data.onlineTransactionNumber : undefined,
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
      paymentProcessingStatus: calculatedRemainingBalance <= 0 && totalAmount > 0 ? 'Fully Paid' : calculatedAmountPaid > 0 ? 'Partially Paid' : 'Unpaid',
      amountPaid: calculatedAmountPaid,
      remainingBalance: calculatedRemainingBalance,
      paymentHistory: updatedPaymentHistory,
      paymentMethod: data.paymentMethod, // Store last used method on invoice
      cashVoucherNumber: data.cashVoucherNumber,
      bankName: data.bankName,
      bankAccountNumber: data.bankAccountNumber,
      onlineTransactionNumber: data.onlineTransactionNumber,
    };

    if (editingInvoice) {
      updateInvoice(invoiceData);
      toast({ title: "Invoice Updated", description: `Invoice ${invoiceData.id} details have been updated.` });
      setEditingInvoice(invoiceData); // Keep modal open and pass updated data to form for reset of payment fields
    } else {
      addInvoice(invoiceData);
      toast({ title: "Invoice Created", description: `Invoice ${invoiceData.id} has been successfully created.` });
      setIsModalOpen(false); // Close modal for new invoice
      setEditingInvoice(null); // Reset editing state
    }
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
            key={editingInvoice ? editingInvoice.id + (editingInvoice.paymentHistory?.length || 0) : 'new-invoice'} // Force re-render with reset fields when editingInvoice changes meaningfully
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

