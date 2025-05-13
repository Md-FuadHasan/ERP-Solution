
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, FileText, Search, Filter, Printer, Download } from 'lucide-react';
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
import type { Invoice, Customer, PaymentRecord, InvoiceStatus, PaymentProcessingStatus, PaymentMethod } from '@/types'; // Make sure all types are exported
import { useToast } from '@/hooks/use-toast';
import { format, isBefore, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeVariant } from '@/lib/invoiceUtils';
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
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvoicesPage() {
  const { 
    invoices, 
    customers, 
    addInvoice, 
    updateInvoice, 
    deleteInvoice, 
    isLoading, 
    getCustomerById,
    companyProfile 
  } = useData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState(''); 
  const [currentPrefillValues, setCurrentPrefillValues] = useState<{ customerId?: string | null; customerName?: string | null } | null>(null);
  const [isSaving, setIsSaving] = useState(false);


  const handleAddNewInvoice = useCallback((prefillCustomerId?: string | null, prefillCustomerName?: string | null) => {
    setEditingInvoice(null);
    setCurrentPrefillValues({ customerId: prefillCustomerId, customerName: prefillCustomerName });
    setIsFormModalOpen(true);
  }, []); // Removed dependencies that might cause stale closures if not needed for THIS specific action of opening modal with prefill context

  useEffect(() => {
    const action = searchParams.get('action');
    const customerId = searchParams.get('customerId');
    const customerName = searchParams.get('customerName');

    // More robust check to prevent re-triggering if modal is already handling a 'new' action
    if (action === 'new' && !isFormModalOpen && !editingInvoice && (!currentPrefillValues || currentPrefillValues.customerId !== customerId)) {
      handleAddNewInvoice(customerId, customerName);
    }
  }, [searchParams, isFormModalOpen, editingInvoice, currentPrefillValues, handleAddNewInvoice]);


  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const customer = getCustomerById(invoice.customerId);
      const matchesSearchTerm = searchTerm ? 
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchesCustomerSearchTerm = customerSearchTerm ? 
        invoice.customerId.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer?.id.toLowerCase().includes(customerSearchTerm.toLowerCase())
        : true;
      return matchesSearchTerm && matchesCustomerSearchTerm;
    });
  }, [invoices, searchTerm, customerSearchTerm, getCustomerById]);

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setCurrentPrefillValues(null); // Clear prefill when editing
    setIsFormModalOpen(true);
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

  const handleSubmit = async (data: InvoiceFormValues) => {
    setIsSaving(true);
    const customer = getCustomerById(data.customerId);

    // Calculate subtotal, tax, VAT, and total amount from items
    const calculatedSubtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxRate = companyProfile.taxRate ? Number(companyProfile.taxRate) / 100 : 0.10;
    const vatRate = companyProfile.vatRate ? Number(companyProfile.vatRate) / 100 : 0.05;
    const calculatedTaxAmount = calculatedSubtotal * taxRate;
    const calculatedVatAmount = calculatedSubtotal * vatRate;
    const calculatedTotalAmount = calculatedSubtotal + calculatedTaxAmount + calculatedVatAmount;

    const existingInvoice = editingInvoice ? invoices.find(inv => inv.id === editingInvoice.id) : null;
    let newAmountPaid = existingInvoice?.amountPaid || 0;
    const newPaymentHistory: PaymentRecord[] = existingInvoice?.paymentHistory ? [...existingInvoice.paymentHistory] : [];

    let finalStatus: InvoiceStatus = existingInvoice?.status || data.status;


    if (data.paymentProcessingStatus === 'Fully Paid') {
      const paymentAmount = calculatedTotalAmount - newAmountPaid; // Amount needed to be fully paid
      if (paymentAmount > 0) { // Only add payment record if there's an amount to pay
        newPaymentHistory.push({
          id: `PAY-${Date.now()}`,
          paymentDate: new Date().toISOString(),
          amount: paymentAmount,
          status: 'Full Payment',
          paymentMethod: data.paymentMethod,
          cashVoucherNumber: data.paymentMethod === 'Cash' ? data.cashVoucherNumber : undefined,
          bankName: data.paymentMethod === 'Bank Transfer' ? data.bankName : undefined,
          bankAccountNumber: data.paymentMethod === 'Bank Transfer' ? data.bankAccountNumber : undefined,
          onlineTransactionNumber: data.paymentMethod === 'Bank Transfer' ? data.onlineTransactionNumber : undefined,
        });
      }
      newAmountPaid = calculatedTotalAmount;
      finalStatus = 'Paid';
    } else if (data.paymentProcessingStatus === 'Partially Paid' && data.partialAmountPaid && data.partialAmountPaid > 0) {
      const actualPartialPayment = Math.min(data.partialAmountPaid, calculatedTotalAmount - newAmountPaid); // Cap payment at remaining balance
      if (actualPartialPayment > 0) { // Only add record if a positive amount is being paid
         newPaymentHistory.push({
          id: `PAY-${Date.now()}`,
          paymentDate: new Date().toISOString(),
          amount: actualPartialPayment,
          status: 'Partial Payment',
          paymentMethod: data.paymentMethod,
          cashVoucherNumber: data.paymentMethod === 'Cash' ? data.cashVoucherNumber : undefined,
          bankName: data.paymentMethod === 'Bank Transfer' ? data.bankName : undefined,
          bankAccountNumber: data.paymentMethod === 'Bank Transfer' ? data.bankAccountNumber : undefined,
          onlineTransactionNumber: data.paymentMethod === 'Bank Transfer' ? data.onlineTransactionNumber : undefined,
        });
        newAmountPaid += actualPartialPayment;
      }

      if (newAmountPaid >= calculatedTotalAmount) {
        finalStatus = 'Paid';
        newAmountPaid = calculatedTotalAmount; // Ensure it doesn't exceed total
      } else {
        finalStatus = 'Partially Paid';
      }
    }
    
    const newRemainingBalance = Math.max(0, calculatedTotalAmount - newAmountPaid);

    // Auto-update status based on balance and due date, respecting 'Cancelled'
    if (finalStatus !== 'Cancelled') { // Don't override 'Cancelled' unless it becomes 'Paid'
        if (newRemainingBalance <= 0) {
            finalStatus = 'Paid';
        } else if (newAmountPaid > 0 && newAmountPaid < calculatedTotalAmount) {
            finalStatus = 'Partially Paid';
        } else { // newAmountPaid is 0 or invalid
            const today = startOfDay(new Date());
            const dueDate = startOfDay(new Date(data.dueDate));
            if (isBefore(dueDate, today)) {
                finalStatus = 'Overdue';
            } else {
                finalStatus = 'Pending';
            }
        }
    }
    // If form status was set to Cancelled, ensure it remains Cancelled unless it's fully paid.
    if (data.status === 'Cancelled' && finalStatus !== 'Paid') {
        finalStatus = 'Cancelled';
    }


    const invoiceToSave: Invoice = {
      id: data.id,
      customerId: data.customerId,
      customerName: customer?.name || 'N/A',
      issueDate: format(data.issueDate, 'yyyy-MM-dd'),
      dueDate: format(data.dueDate, 'yyyy-MM-dd'),
      items: data.items.map(item => ({ ...item, total: item.quantity * item.unitPrice })),
      subtotal: calculatedSubtotal,
      taxAmount: calculatedTaxAmount,
      vatAmount: calculatedVatAmount,
      totalAmount: calculatedTotalAmount,
      status: finalStatus,
      paymentProcessingStatus: data.paymentProcessingStatus, // Store the action status for record if needed
      amountPaid: newAmountPaid,
      remainingBalance: newRemainingBalance,
      paymentHistory: newPaymentHistory,
      paymentMethod: data.paymentMethod,
      cashVoucherNumber: data.cashVoucherNumber,
      bankName: data.bankName,
      bankAccountNumber: data.bankAccountNumber,
      onlineTransactionNumber: data.onlineTransactionNumber,
    };

    if (editingInvoice) {
      updateInvoice(invoiceToSave);
      toast({ title: "Invoice Updated", description: `Invoice ${data.id} has been updated.` });
    } else {
      addInvoice(invoiceToSave);
      toast({ title: "Invoice Added", description: `Invoice ${data.id} has been created.` });
    }
    setIsFormModalOpen(false);
    setEditingInvoice(null);
    setCurrentPrefillValues(null); // Clear prefill after submit
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Invoices"
          description="Manage and track all your invoices."
          actions={
            <Button onClick={() => handleAddNewInvoice()} className="w-full sm:w-auto" disabled>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Invoice
            </Button>
          }
        />
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="rounded-lg border shadow-sm bg-card p-4">
          <Skeleton className="h-8 w-1/4 mb-4" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-4 py-2 border-b last:border-b-0">
              <Skeleton className="h-6 flex-1 min-w-[100px]" />
              <Skeleton className="h-6 flex-1 min-w-[150px]" />
              <Skeleton className="h-6 flex-1 min-w-[100px]" />
              <Skeleton className="h-6 flex-1 min-w-[100px]" />
              <Skeleton className="h-6 flex-1 min-w-[80px]" />
              <Skeleton className="h-6 w-24 min-w-[96px]" />
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
        description="Manage and track all your invoices."
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={() => handleAddNewInvoice()} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Invoice
            </Button>
            {/* Add filter, print, download buttons here if needed */}
          </div>
        }
      />
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by Invoice ID or Customer Name..."
            className="w-full"
        />
        <SearchInput
            value={customerSearchTerm}
            onChange={setCustomerSearchTerm}
            placeholder="Filter by Customer ID..."
            className="w-full"
        />
      </div>

      {filteredInvoices.length > 0 ? (
        <div className="rounded-lg border shadow-sm bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Invoice ID</TableHead>
                <TableHead className="min-w-[180px]">Customer</TableHead>
                <TableHead className="min-w-[120px]">Due Date</TableHead>
                <TableHead className="min-w-[100px] text-right">Amount</TableHead>
                <TableHead className="min-w-[100px] text-right">Paid</TableHead>
                <TableHead className="min-w-[100px] text-right">Balance</TableHead>
                <TableHead className="min-w-[120px]">Status</TableHead>
                <TableHead className="text-right min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.customerName || getCustomerById(invoice.customerId)?.name || 'N/A'}</TableCell>
                  <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="text-right">${invoice.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-green-600 dark:text-green-400">${invoice.amountPaid.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold">${invoice.remainingBalance.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditInvoice(invoice)} className="hover:text-primary" title="Edit Invoice">
                        <Edit className="h-4 w-4" />
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
                              This action cannot be undone. This will permanently delete invoice "{invoiceToDelete?.id}".
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
         <DataPlaceholder
          title="No Invoices Found"
          message={searchTerm || customerSearchTerm ? "Try adjusting your search terms." : "Get started by adding your first invoice."}
          icon={FileText}
          action={!searchTerm && !customerSearchTerm ? (
            <Button onClick={() => handleAddNewInvoice()} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Invoice
            </Button>
          ) : undefined}
        />
      )}

      <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => {
        setIsFormModalOpen(isOpen);
        if (!isOpen) {
          setEditingInvoice(null);
          setCurrentPrefillValues(null); // Clear prefill on close
        }
      }}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            <DialogDescription>
              {editingInvoice ? `Update details for invoice ${editingInvoice.id}.` : 'Fill in the details to create a new invoice.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
            <InvoiceForm
              initialData={editingInvoice}
              customers={customers}
              companyProfile={companyProfile}
              invoices={invoices}
              onSubmit={handleSubmit}
              prefillData={currentPrefillValues}
              onCancel={() => {
                setIsFormModalOpen(false);
                setEditingInvoice(null);
                setCurrentPrefillValues(null);
              }}
              isSubmitting={isSaving}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!invoiceToDelete} onOpenChange={(isOpen) => !isOpen && setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete invoice "{invoiceToDelete?.id}".
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
