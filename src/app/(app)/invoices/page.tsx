
'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
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
    companyProfile,
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
    const invoiceIdParam = searchParams.get('id'); // For editing
    const customerIdParam = searchParams.get('customerId'); // For new from customer
    const customerNameParam = searchParams.get('customerName');

    let currentIntentKey: string | null = null;

    if (action === 'new' && customerIdParam) {
      currentIntentKey = `action=new&customerId=${customerIdParam}&customerName=${customerNameParam || ''}`;
    } else if (action === 'edit' && invoiceIdParam) {
      currentIntentKey = `action=edit&id=${invoiceIdParam}`;
    }

    if (currentIntentKey) {
      if (!isFormModalOpen && urlParamsProcessedIntentKey !== currentIntentKey) {
        if (action === 'new' && customerIdParam) {
          setCurrentPrefillValues({ customerId: customerIdParam, customerName: customerNameParam });
          setEditingInvoice(null);
        } else if (action === 'edit' && invoiceIdParam) {
          const invoiceToEdit = invoices.find(inv => inv.id === invoiceIdParam);
          setEditingInvoice(invoiceToEdit || null);
          setCurrentPrefillValues(null);
        }
        setIsFormModalOpen(true);
        setUrlParamsProcessedIntentKey(currentIntentKey);
      }
    } else {
        if (urlParamsProcessedIntentKey) {
            setUrlParamsProcessedIntentKey(null);
        }
    }
  }, [searchParams, isFormModalOpen, editingInvoice, urlParamsProcessedIntentKey, invoices]);


 const handleFormModalOpenChange = useCallback((isOpen: boolean) => {
    setIsFormModalOpen(isOpen);
    if (!isOpen) {
      setEditingInvoice(null);
      setCurrentPrefillValues(null);

      const currentAction = searchParams.get('action');
      const currentCustomerId = searchParams.get('customerId');
      const currentInvoiceId = searchParams.get('id');

      let intentKeyToClear: string | null = null;
      if (currentAction === 'new' && currentCustomerId) {
        intentKeyToClear = `action=new&customerId=${currentCustomerId}&customerName=${searchParams.get('customerName') || ''}`;
      } else if (currentAction === 'edit' && currentInvoiceId) {
        intentKeyToClear = `action=edit&id=${currentInvoiceId}`;
      }

      if (intentKeyToClear && urlParamsProcessedIntentKey === intentKeyToClear) {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('action');
        newSearchParams.delete('customerId');
        newSearchParams.delete('customerName');
        newSearchParams.delete('id');
        router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
      } else if (!intentKeyToClear && urlParamsProcessedIntentKey) {
        setUrlParamsProcessedIntentKey(null);
      }
    }
  }, [searchParams, router, pathname, urlParamsProcessedIntentKey ]);


  const handleAddNewInvoice = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete('action');
    newSearchParams.delete('customerId');
    newSearchParams.delete('customerName');
    newSearchParams.delete('id');
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });

    setEditingInvoice(null);
    setCurrentPrefillValues(null);
    setUrlParamsProcessedIntentKey(null);
    setIsFormModalOpen(true);
  }, [searchParams, router, pathname]);


  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const customer = getCustomerById(invoice.customerId);
      const matchesSearch = searchTerm
        ? invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (invoice.customerName && invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (customer && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          invoice.customerId.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const matchesStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'paid'
          ? invoice.status === 'Paid'
          : statusFilter === 'unpaid'
            ? invoice.status === 'Pending' || invoice.status === 'Overdue'
            : statusFilter === 'partially-paid'
              ? invoice.status === 'Partially Paid'
              : statusFilter === 'cancelled'
                ? invoice.status === 'Cancelled'
                : false;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter, getCustomerById]);

  const handleEditInvoice = useCallback((invoice: Invoice) => {
    // Navigate to edit by setting URL params, which useEffect will pick up
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('action', 'edit');
    newSearchParams.set('id', invoice.id);
    newSearchParams.delete('customerId'); // Clear any new invoice params
    newSearchParams.delete('customerName');
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    // useEffect will handle setting editingInvoice and opening the modal
  }, [searchParams, router, pathname]);

  const handleViewInvoice = useCallback((invoice: Invoice) => {
    router.push(`/invoices/${invoice.id}/view`);
  }, [router]);

  const handleDeleteInvoice = useCallback((invoice: Invoice) => {
    setInvoiceToDelete(invoice);
  }, []);

  const confirmDelete = useCallback(() => {
    if (invoiceToDelete) {
      deleteInvoice(invoiceToDelete.id);
      toast({ title: "Invoice Deleted", description: `Invoice ${invoiceToDelete.id} has been removed.` });
      setInvoiceToDelete(null);
    }
  }, [invoiceToDelete, deleteInvoice, toast]);

  const handleSubmit = useCallback(async (data: InvoiceFormValues) => {
    setIsSaving(true);
    const customer = getCustomerById(data.customerId);

    const calculatedSubtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxRate = companyProfile.taxRate ? Number(companyProfile.taxRate) / 100 : 0.10;
    const vatRate = companyProfile.vatRate ? Number(companyProfile.vatRate) / 100 : 0.05;
    const calculatedTaxAmount = calculatedSubtotal * taxRate;
    const calculatedVatAmount = calculatedSubtotal * vatRate;
    const calculatedTotalAmount = calculatedSubtotal + calculatedTaxAmount + calculatedVatAmount;

    if (customer?.customerType === 'Credit' && customer.creditLimit && customer.creditLimit > 0) {
      const totalOutstandingBalance = invoices
        .filter(inv => inv.customerId === customer.id && inv.id !== (editingInvoice?.id || '') &&
          ['Pending', 'Overdue', 'Partially Paid'].includes(inv.status))
        .reduce((sum, inv) => sum + inv.remainingBalance, 0);

      if (totalOutstandingBalance + calculatedTotalAmount > customer.creditLimit) {
        setCreditLimitAlertMessage(
          `This invoice of $${calculatedTotalAmount.toFixed(2)} plus existing balance of $${totalOutstandingBalance.toFixed(2)} ($${(totalOutstandingBalance + calculatedTotalAmount).toFixed(2)}) exceeds ${customer.name}'s credit limit of $${customer.creditLimit.toFixed(2)}. Please contact management to increase the limit or reduce the invoice amount.`
        );
        setIsCreditLimitAlertOpen(true);
        setIsSaving(false);
        return;
      }
    }

    const existingInvoice = editingInvoice ? invoices.find(inv => inv.id === editingInvoice.id) : null;
    let newAmountPaid = existingInvoice?.amountPaid || 0;
    const newPaymentHistory: PaymentRecord[] = existingInvoice?.paymentHistory ? [...existingInvoice.paymentHistory] : [];
    let finalStatus: InvoiceStatus = data.status;

    if (data.paymentProcessingStatus === 'Fully Paid') {
      const paymentAmount = calculatedTotalAmount - newAmountPaid;
      if (paymentAmount > 0) {
        newPaymentHistory.push({
          id: `PAY-${Date.now()}`,
          paymentDate: new Date().toISOString(),
          amount: paymentAmount,
          status: 'Full Payment',
          paymentMethod: data.paymentMethod,
          ...(data.paymentMethod === 'Cash' && { cashVoucherNumber: data.cashVoucherNumber }),
          ...(data.paymentMethod === 'Bank Transfer' && {
            bankName: data.bankName,
            bankAccountNumber: data.bankAccountNumber,
            onlineTransactionNumber: data.onlineTransactionNumber,
          }),
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
          ...(data.paymentMethod === 'Cash' && { cashVoucherNumber: data.cashVoucherNumber }),
          ...(data.paymentMethod === 'Bank Transfer' && {
            bankName: data.bankName,
            bankAccountNumber: data.bankAccountNumber,
            onlineTransactionNumber: data.onlineTransactionNumber,
          }),
        });
        newAmountPaid += actualPartialPayment;
      }
    }

    const newRemainingBalance = Math.max(0, calculatedTotalAmount - newAmountPaid);

    if (data.status === 'Cancelled') {
      finalStatus = 'Cancelled';
    } else if (newRemainingBalance <= 0 && newAmountPaid >= calculatedTotalAmount) {
      finalStatus = 'Paid';
    } else if (newAmountPaid > 0 && newAmountPaid < calculatedTotalAmount) {
      finalStatus = 'Partially Paid';
    } else if (isBefore(startOfDay(new Date(data.dueDate)), startOfDay(new Date())) && newRemainingBalance > 0) {
      finalStatus = 'Overdue';
    } else if (newRemainingBalance > 0) {
      finalStatus = 'Pending';
    } else {
      finalStatus = 'Paid'; // Fallback if newRemainingBalance is 0 but somehow didn't hit first 'Paid'
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
      ...(data.paymentMethod === 'Cash' && { cashVoucherNumber: data.cashVoucherNumber }),
      ...(data.paymentMethod === 'Bank Transfer' && {
        bankName: data.bankName,
        bankAccountNumber: data.bankAccountNumber,
        onlineTransactionNumber: data.onlineTransactionNumber,
      }),
    };

    editingInvoice ? updateInvoice(invoiceToSave) : addInvoice(invoiceToSave);
    toast({ title: editingInvoice ? "Invoice Updated" : "Invoice Added", description: `Invoice ${data.id} has been ${editingInvoice ? 'updated' : 'created'}.` });

    handleFormModalOpenChange(false);

    setIsSaving(false);
  }, [editingInvoice, invoices, getCustomerById, companyProfile, addInvoice, updateInvoice, toast, handleFormModalOpenChange]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Invoices"
          description="Manage and track all your invoices."
          actions={<Button onClick={handleAddNewInvoice} className="w-full sm:w-auto" disabled><PlusCircle className="mr-2 h-4 w-4" /> Add New Invoice</Button>}
        />
        <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
          <Skeleton className="h-10 w-full md:w-80" />
          <Skeleton className="h-10 w-full md:w-[200px]" />
        </div>
        <div className="flex-grow min-h-0 rounded-lg border shadow-sm bg-card overflow-hidden">
          <div className="overflow-y-auto max-h-96">
             <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                <TableRow>
                  <TableHead className="min-w-[120px]"><Skeleton className="h-5 w-3/4" /></TableHead>
                  <TableHead className="min-w-[180px]"><Skeleton className="h-5 w-full" /></TableHead>
                  <TableHead className="min-w-[100px]"><Skeleton className="h-5 w-3/4" /></TableHead>
                  <TableHead className="min-w-[100px] text-right"><Skeleton className="h-5 w-1/2 ml-auto" /></TableHead>
                  <TableHead className="min-w-[100px] text-right"><Skeleton className="h-5 w-1/2 ml-auto" /></TableHead>
                  <TableHead className="min-w-[100px] text-right"><Skeleton className="h-5 w-1/2 ml-auto" /></TableHead>
                  <TableHead className="min-w-[120px]"><Skeleton className="h-5 w-3/4" /></TableHead>
                  <TableHead className="min-w-[120px] text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(7)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          <Button onClick={handleAddNewInvoice} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Invoice
          </Button>
        }
      />
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by ID, Customer, Cust ID..." className="w-full md:w-80" />
        <StatusFilterDropdown selectedStatus={statusFilter} onStatusChange={setStatusFilter} className="w-full md:w-auto" />
      </div>

      <div className="flex-grow min-h-0 rounded-lg border shadow-sm bg-card overflow-hidden">
        <div className="overflow-y-auto max-h-96">
          {filteredInvoices.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                <TableRow>
                  <TableHead className="min-w-[120px]">Invoice ID</TableHead>
                  <TableHead className="min-w-[180px]">Customer</TableHead>
                  <TableHead className="min-w-[100px]">Due Date</TableHead>
                  <TableHead className="min-w-[100px] text-right">Amount</TableHead>
                  <TableHead className="min-w-[100px] text-right">Paid</TableHead>
                  <TableHead className="min-w-[100px] text-right">Balance</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.customerName || getCustomerById(invoice.customerId)?.name || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">${invoice.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${invoice.amountPaid.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">${invoice.remainingBalance.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(invoice)} className="hover:text-primary" title="View Invoice">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditInvoice(invoice)} className="hover:text-primary" title="Edit Invoice">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:text-destructive" title="Delete Invoice" onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete invoice "{invoiceToDelete?.id}".
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
          ) : (
             <div className="h-full flex items-center justify-center p-8">
              <DataPlaceholder
                title="No Invoices Found"
                message={searchTerm || statusFilter !== 'all' ? "Try adjusting your search or filter criteria." : "Get started by adding your first invoice."}
                icon={PlusCircle}
                action={!searchTerm && statusFilter === 'all' ? (
                  <Button onClick={handleAddNewInvoice} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Invoice
                  </Button>
                ) : undefined}
              />
            </div>
          )}
        </div>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={handleFormModalOpenChange}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] flex flex-col p-0">
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
                onCancel={() => handleFormModalOpenChange(false)}
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
              This will permanently delete invoice "{invoiceToDelete?.id}".
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
            <AlertDialogDescription>{creditLimitAlertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsCreditLimitAlertOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
