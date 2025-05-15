
'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, FileText } from 'lucide-react';
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
import { StatusFilterDropdown, type InvoiceFilterStatus } from '@/components/common/status-filter-dropdown';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import type { Invoice, Customer, PaymentRecord, InvoiceStatus, PaymentProcessingStatus, PaymentMethod } from '@/types';
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
  const pathname = usePathname();
  const { toast } = useToast();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceFilterStatus>('all');
  const [currentPrefillValues, setCurrentPrefillValues] = useState<{ customerId?: string | null; customerName?: string | null } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreditLimitAlertOpen, setIsCreditLimitAlertOpen] = useState(false);
  const [creditLimitAlertMessage, setCreditLimitAlertMessage] = useState('');

  const [urlParamsProcessedIntentKey, setUrlParamsProcessedIntentKey] = useState<string | null>(null);


  useEffect(() => {
    const action = searchParams.get('action');
    const customerIdParam = searchParams.get('customerId');
    const customerNameParam = searchParams.get('customerName');
    
    const currentIntentKey = action === 'new' && customerIdParam 
      ? `action=new&customerId=${customerIdParam}&customerName=${customerNameParam || ''}` 
      : null;

    if (currentIntentKey) {
      if (!isFormModalOpen && !editingInvoice && urlParamsProcessedIntentKey !== currentIntentKey) {
        setCurrentPrefillValues({ customerId: customerIdParam, customerName: customerNameParam });
        setEditingInvoice(null); 
        setIsFormModalOpen(true);
        setUrlParamsProcessedIntentKey(currentIntentKey);
      }
    } else {
      if (urlParamsProcessedIntentKey !== null) {
         setUrlParamsProcessedIntentKey(null); // Reset if URL no longer has the action
      }
    }
  }, [searchParams, isFormModalOpen, editingInvoice, urlParamsProcessedIntentKey]);


  const handleAddNewInvoice = useCallback(() => {
    setEditingInvoice(null);
    setCurrentPrefillValues(null);
    setUrlParamsProcessedIntentKey(null); 
    
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete('action');
    newSearchParams.delete('customerId');
    newSearchParams.delete('customerName');
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    
    setIsFormModalOpen(true);
  }, [searchParams, router, pathname]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const customer = getCustomerById(invoice.customerId);
      const matchesSearchTerm = searchTerm ?
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.customerName && invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        invoice.customerId.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      let matchesStatusFilter = true;
      if (statusFilter !== 'all') {
        if (statusFilter === 'paid') {
          matchesStatusFilter = invoice.status === 'Paid';
        } else if (statusFilter === 'unpaid') {
          matchesStatusFilter = invoice.status === 'Pending' || invoice.status === 'Overdue';
        } else if (statusFilter === 'partially-paid') {
          matchesStatusFilter = invoice.status === 'Partially Paid';
        }
      }
      return matchesSearchTerm && matchesStatusFilter;
    });
  }, [invoices, searchTerm, statusFilter, getCustomerById]);

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setCurrentPrefillValues(null);
    setUrlParamsProcessedIntentKey(null);
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

    const calculatedSubtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxRate = companyProfile.taxRate ? Number(companyProfile.taxRate) / 100 : 0.10;
    const vatRate = companyProfile.vatRate ? Number(companyProfile.vatRate) / 100 : 0.05;
    const calculatedTaxAmount = calculatedSubtotal * taxRate;
    const calculatedVatAmount = calculatedSubtotal * vatRate;
    const calculatedTotalAmount = calculatedSubtotal + calculatedTaxAmount + calculatedVatAmount;

    if (customer && customer.customerType === 'Credit' && customer.creditLimit && customer.creditLimit > 0) {
      let totalOutstandingBalance = 0;
      invoices.forEach(inv => {
        if (
          inv.customerId === customer.id &&
          inv.id !== (editingInvoice?.id || '') &&
          (inv.status === 'Pending' || inv.status === 'Overdue' || inv.status === 'Partially Paid')
        ) {
          totalOutstandingBalance += inv.remainingBalance;
        }
      });

      if ((totalOutstandingBalance + calculatedTotalAmount) > customer.creditLimit) {
        setCreditLimitAlertMessage(`This invoice of $${calculatedTotalAmount.toFixed(2)} plus existing balance of $${totalOutstandingBalance.toFixed(2)} ($${(totalOutstandingBalance + calculatedTotalAmount).toFixed(2)}) exceeds ${customer.name}'s credit limit of $${customer.creditLimit.toFixed(2)}. Please contact management to increase the limit or reduce the invoice amount.`);
        setIsCreditLimitAlertOpen(true);
        setIsSaving(false);
        return;
      }
    }

    const existingInvoice = editingInvoice ? invoices.find(inv => inv.id === editingInvoice.id) : null;
    let newAmountPaid = existingInvoice?.amountPaid || 0;
    const newPaymentHistory: PaymentRecord[] = existingInvoice?.paymentHistory ? [...existingInvoice.paymentHistory] : [];
    let finalStatus: InvoiceStatus = data.status; // Start with form status

    if (data.paymentProcessingStatus === 'Fully Paid') {
      const paymentAmount = calculatedTotalAmount - newAmountPaid;
      if (paymentAmount > 0) {
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
    } else if (data.paymentProcessingStatus === 'Partially Paid' && data.partialAmountPaid && data.partialAmountPaid > 0) {
      const actualPartialPayment = Math.min(data.partialAmountPaid, calculatedTotalAmount - newAmountPaid);
      if (actualPartialPayment > 0) {
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
    }

    const newRemainingBalance = Math.max(0, calculatedTotalAmount - newAmountPaid);

    if (data.status === 'Cancelled') { 
        finalStatus = 'Cancelled';
    } else {
        if (newRemainingBalance <= 0 && newAmountPaid >= calculatedTotalAmount) {
            finalStatus = 'Paid';
        } else if (newAmountPaid > 0 && newAmountPaid < calculatedTotalAmount) {
            finalStatus = 'Partially Paid';
        } else { 
            const today = startOfDay(new Date());
            const dueDate = startOfDay(new Date(data.dueDate));
            if (isBefore(dueDate, today) && newRemainingBalance > 0) {
                finalStatus = 'Overdue';
            } else if (newRemainingBalance > 0) { 
                finalStatus = 'Pending';
            } // If it's 0 remaining but not Paid (e.g. from cancel), it might still be Pending if set so. Or default to Paid.
              // The logic here defaults to the form's status unless overridden by payment.
        }
    }


    const invoiceToSave: Invoice = {
      id: data.id,
      customerId: data.customerId,
      customerName: customer?.name || 'N/A',
      issueDate: format(new Date(data.issueDate), 'yyyy-MM-dd'),
      dueDate: format(new Date(data.dueDate), 'yyyy-MM-dd'),
      items: data.items.map(item => ({ ...item, total: item.quantity * item.unitPrice })),
      subtotal: calculatedSubtotal,
      taxAmount: calculatedTaxAmount,
      vatAmount: calculatedVatAmount,
      totalAmount: calculatedTotalAmount,
      status: finalStatus,
      paymentProcessingStatus: data.paymentProcessingStatus,
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
    setIsSaving(false);
    setIsFormModalOpen(false); 
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Invoices"
          description="Manage and track all your invoices."
          actions={
            <Button onClick={() => handleAddNewInvoice()} className="w-full sm:w-auto" disabled>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Invoice
            </Button>
          }
        />
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 w-full md:w-80" />
            <Skeleton className="h-10 w-full md:w-[200px]" />
        </div>
        <div className="flex-grow min-h-0 overflow-hidden rounded-lg border shadow-sm bg-card">
          <div className="h-full overflow-auto">
            <Skeleton className="h-12 w-full sticky top-0 z-10 bg-card p-4 border-b" />
            <div className="p-4 space-y-2">
                {[...Array(7)].map((_, i) => (
                <div key={i} className="flex space-x-4 py-2 border-b last:border-b-0">
                    <Skeleton className="h-6 flex-1 min-w-[120px]" />
                    <Skeleton className="h-6 flex-1 min-w-[180px]" />
                    <Skeleton className="h-6 flex-1 min-w-[120px]" />
                    <Skeleton className="h-6 flex-1 min-w-[100px]" />
                    <Skeleton className="h-6 flex-1 min-w-[100px]" />
                    <Skeleton className="h-6 flex-1 min-w-[100px]" />
                    <Skeleton className="h-6 flex-1 min-w-[120px]" />
                    <Skeleton className="h-6 w-24 min-w-[100px]" />
                </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full"> 
      <PageHeader
        title="Invoices"
        description="Manage and track all your invoices."
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={() => handleAddNewInvoice()} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Invoice
            </Button>
          </div>
        }
      />
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by ID or Customer..."
            className="w-full md:w-80"
        />
        <StatusFilterDropdown
            selectedStatus={statusFilter}
            onStatusChange={setStatusFilter}
            className="w-full md:w-auto"
        />
      </div>

      <div className="flex-grow min-h-0 overflow-hidden rounded-lg border shadow-sm bg-card">
        {filteredInvoices.length > 0 ? (
          <div className="h-full overflow-auto"> 
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
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
          <div className="h-full flex items-center justify-center">
            <DataPlaceholder
              title="No Invoices Found"
              message={searchTerm || statusFilter !== 'all' ? "Try adjusting your search or filter criteria." : "Get started by adding your first invoice."}
              icon={FileText}
              action={!searchTerm && statusFilter === 'all' ? (
                <Button onClick={() => handleAddNewInvoice()} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Invoice
                </Button>
              ) : undefined}
            />
          </div>
        )}
      </div>

      <Dialog
        open={isFormModalOpen}
        onOpenChange={(isOpen) => {
          setIsFormModalOpen(isOpen);
          if (!isOpen) {
            setEditingInvoice(null);
            setCurrentPrefillValues(null);
            if (urlParamsProcessedIntentKey) { 
                const newSearchParams = new URLSearchParams(searchParams.toString());
                newSearchParams.delete('action');
                newSearchParams.delete('customerId');
                newSearchParams.delete('customerName');
                router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
                setUrlParamsProcessedIntentKey(null);
            }
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            <DialogDescription>
              {editingInvoice ? `Update details for invoice ${editingInvoice.id}.` : 'Fill in the details to create a new invoice.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
            {isFormModalOpen && (
              <InvoiceForm
                initialData={editingInvoice}
                customers={customers}
                companyProfile={companyProfile}
                invoices={invoices}
                onSubmit={handleSubmit}
                prefillData={currentPrefillValues}
                onCancel={() => {
                  setIsFormModalOpen(false);
                }}
                isSubmitting={isSaving}
              />
            )}
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

      <AlertDialog open={isCreditLimitAlertOpen} onOpenChange={setIsCreditLimitAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Credit Limit Exceeded</AlertDialogTitle>
            <AlertDialogDescription>
              {creditLimitAlertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsCreditLimitAlertOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
    

    