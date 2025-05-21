
'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Eye, Printer, Download, QrCode, DollarSign, History, ChevronsUpDown, Check, Filter } from 'lucide-react';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { InvoiceForm, type InvoiceFormValues } from '@/components/forms/invoice-form';
import { SearchInput } from '@/components/common/search-input';
import { StatusFilterDropdown, type InvoiceFilterStatus } from '@/components/common/status-filter-dropdown';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import type { Invoice, Customer, PaymentRecord, InvoiceStatus, PaymentProcessingStatus, PaymentMethod, CompanyProfile, InvoiceItem } from '@/types';
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
import { QRCodeCanvas } from 'qrcode.react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";


export default function InvoicesPage() {
  const {
    invoices,
    customers,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    isLoading: isDataContextLoading,
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

  const [invoiceToViewInModal, setInvoiceToViewInModal] = useState<Invoice | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [qrCodeValueForModal, setQrCodeValueForModal] = useState('');


  useEffect(() => {
    const action = searchParams.get('action');
    const invoiceIdParam = searchParams.get('id');
    const customerIdParam = searchParams.get('customerId');
    const customerNameParam = searchParams.get('customerName');

    let currentUrlIntentKey: string | null = null;
    if (action === 'new') {
      currentUrlIntentKey = `action=new&customerId=${customerIdParam || ''}&customerName=${customerNameParam || ''}`;
    } else if (action === 'edit' && invoiceIdParam) {
      currentUrlIntentKey = `action=edit&id=${invoiceIdParam}`;
    } else if (action === 'view' && invoiceIdParam) {
      currentUrlIntentKey = `action=view&id=${invoiceIdParam}`;
    }

    if (currentUrlIntentKey && urlParamsProcessedIntentKey !== currentUrlIntentKey && !isFormModalOpen && !isViewModalOpen) {
      if (action === 'new') {
          setCurrentPrefillValues({ customerId: customerIdParam, customerName: customerNameParam });
          setEditingInvoice(null);
          setIsFormModalOpen(true);
          setUrlParamsProcessedIntentKey(currentUrlIntentKey);
      } else if (action === 'edit') {
          const invoiceToEdit = invoices.find(inv => inv.id === invoiceIdParam);
          setEditingInvoice(invoiceToEdit || null);
          setCurrentPrefillValues(null);
          setIsFormModalOpen(true);
          setUrlParamsProcessedIntentKey(currentUrlIntentKey);
      } else if (action === 'view') {
           const invoiceToView = invoices.find(inv => inv.id === invoiceIdParam);
           if (invoiceToView) {
             setInvoiceToViewInModal(invoiceToView);
             setIsViewModalOpen(true);
             setUrlParamsProcessedIntentKey(currentUrlIntentKey);
           } else {
             // If invoice not found for view, clear params to avoid loop
              const newSearchParams = new URLSearchParams(searchParams.toString());
              newSearchParams.delete('action');
              newSearchParams.delete('id');
              router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
              setUrlParamsProcessedIntentKey(null);
           }
      }
    } else if (!currentUrlIntentKey && urlParamsProcessedIntentKey && !isFormModalOpen && !isViewModalOpen) {
      setUrlParamsProcessedIntentKey(null);
    }
  }, [
    searchParams,
    isFormModalOpen,
    isViewModalOpen,
    urlParamsProcessedIntentKey,
    invoices,
    editingInvoice,
    invoiceToViewInModal,
    router,
    pathname
  ]);


  const handleFormModalOpenChange = useCallback((isOpen: boolean) => {
    setIsFormModalOpen(isOpen);
    if (!isOpen) {
      setEditingInvoice(null);
      setCurrentPrefillValues(null);
      setUrlParamsProcessedIntentKey(null); // Reset processed key on close
      
      const currentAction = searchParams.get('action');
      const currentId = searchParams.get('id');
      
      if ( (currentAction === 'new' || currentAction === 'edit')) {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('action');
        newSearchParams.delete('customerId');
        newSearchParams.delete('customerName');
        newSearchParams.delete('id');
        router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
      }
    }
  }, [searchParams, router, pathname]);
  
  const handleViewModalOpenChange = useCallback((isOpen: boolean) => {
    setIsViewModalOpen(isOpen);
    if (!isOpen) {
        setInvoiceToViewInModal(null);
        setUrlParamsProcessedIntentKey(null); // Reset processed key on close

        const currentAction = searchParams.get('action');
        if (currentAction === 'view') {
            const newSearchParams = new URLSearchParams(searchParams.toString());
            newSearchParams.delete('action');
            newSearchParams.delete('id');
            router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
        }
    }
  }, [searchParams, router, pathname]);


  const handleAddNewInvoice = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('action', 'new');
    newSearchParams.delete('id');
    newSearchParams.delete('customerId');
    newSearchParams.delete('customerName');
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
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
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('action', 'edit');
    newSearchParams.set('id', invoice.id);
    newSearchParams.delete('customerId');
    newSearchParams.delete('customerName');
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const handleViewInvoiceInModal = useCallback((invoice: Invoice) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('action', 'view');
    newSearchParams.set('id', invoice.id);
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  useEffect(() => {
    if (invoiceToViewInModal) {
      const totalAmount = typeof invoiceToViewInModal.totalAmount === 'number' ? invoiceToViewInModal.totalAmount : 0;
      setQrCodeValueForModal(`Invoice ID: ${invoiceToViewInModal.id}\nTotal Amount: $${totalAmount.toFixed(2)}\nDue Date: ${format(new Date(invoiceToViewInModal.dueDate), 'MMM d, yyyy')}`);
    } else {
      setQrCodeValueForModal('');
    }
  }, [invoiceToViewInModal]);

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

    const calculatedSubtotal = data.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
    
    const calculatedGeneralTaxAmount = 0; // Assuming general tax is not used
    const vatRate = companyProfile && companyProfile.vatRate ? Number(companyProfile.vatRate) / 100 : 0;
    const calculatedVatAmount = calculatedSubtotal * vatRate;
    const calculatedTotalAmount = calculatedSubtotal + calculatedVatAmount;


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
      if (paymentAmount >= 0) { 
        newPaymentHistory.push({
          id: `PAY-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
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
         newAmountPaid = calculatedTotalAmount;
      }
    } else if (data.paymentProcessingStatus === 'Partially Paid' && data.partialAmountPaid && data.partialAmountPaid > 0) {
      const actualPartialPayment = Math.min(data.partialAmountPaid, calculatedTotalAmount - newAmountPaid);
      if (actualPartialPayment > 0) {
        newPaymentHistory.push({
          id: `PAY-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
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
      finalStatus = 'Paid'; 
    }


    const invoiceToSave: Invoice = {
      id: data.id,
      customerId: data.customerId,
      customerName: customer?.name || 'N/A',
      issueDate: format(new Date(data.issueDate), 'yyyy-MM-dd'),
      dueDate: format(new Date(data.dueDate), 'yyyy-MM-dd'),
      items: data.items.map(item => ({ ...item, total: (item.quantity || 0) * (item.unitPrice || 0) })), 
      subtotal: calculatedSubtotal, 
      taxAmount: calculatedGeneralTaxAmount, 
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

    handleFormModalOpenChange(false); // This will also clear URL params due to its internal logic
    setIsSaving(false);
  }, [editingInvoice, invoices, getCustomerById, companyProfile, addInvoice, updateInvoice, toast, handleFormModalOpenChange]);

  const customerForModal = invoiceToViewInModal ? getCustomerById(invoiceToViewInModal.customerId) : null;
  const vatRatePercent = companyProfile?.vatRate ? (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : Number(companyProfile.vatRate)) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Invoices"
          description="Manage and track all your invoices."
          actions={
            <Button onClick={handleAddNewInvoice} className="w-full sm:w-auto" disabled={isDataContextLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Invoice
            </Button>
          }
        />
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by ID, Customer, Cust ID..." className="w-full md:w-80" />
          <StatusFilterDropdown selectedStatus={statusFilter} onStatusChange={setStatusFilter} className="w-full md:w-auto" />
        </div>
      </div>

       <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mb-4 md:mb-6 lg:mb-8">
        <div className="h-full overflow-y-auto"> 
          {isDataContextLoading ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[120px] px-2">Invoice ID</TableHead>
                  <TableHead className="min-w-[180px] px-2">Customer</TableHead>
                  <TableHead className="min-w-[100px] text-right px-2">Amount</TableHead>
                  <TableHead className="min-w-[100px] text-right px-2">Paid</TableHead>
                  <TableHead className="min-w-[100px] text-right px-2">Balance</TableHead>
                  <TableHead className="min-w-[120px] px-2">Status</TableHead>
                  <TableHead className="min-w-[150px] text-right px-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(7)].map((_, i) => (
                  <TableRow key={i} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50')}>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2">
                      <div className="flex justify-end items-center gap-1">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredInvoices.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[120px] px-2">Invoice ID</TableHead>
                  <TableHead className="min-w-[180px] px-2">Customer</TableHead>
                  <TableHead className="min-w-[100px] text-right px-2">Amount</TableHead>
                  <TableHead className="min-w-[100px] text-right px-2">Paid</TableHead>
                  <TableHead className="min-w-[100px] text-right px-2">Balance</TableHead>
                  <TableHead className="min-w-[120px] px-2">Status</TableHead>
                  <TableHead className="min-w-[150px] text-right px-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice, index) => (
                  <TableRow key={invoice.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-muted/70")}>
                    <TableCell className="font-medium px-2">{invoice.id}</TableCell>
                    <TableCell className="px-2">{invoice.customerName || getCustomerById(invoice.customerId)?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right px-2">${invoice.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right px-2">${invoice.amountPaid.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold px-2">${invoice.remainingBalance.toFixed(2)}</TableCell>
                    <TableCell className="px-2">
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-2">
                      <div className="flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewInvoiceInModal(invoice)} className="hover:text-primary" title="View Invoice">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditInvoice(invoice)} className="hover:text-primary" title="Edit Invoice">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:text-destructive" title="Delete Invoice" onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice); }}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="h-full flex items-center justify-center">
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

      {/* Edit/Create Form Modal */}
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
                companyProfile={companyProfile!}
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

      {/* View Invoice Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={handleViewModalOpenChange}>
        <DialogContent className="w-[95vw] max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none print:max-h-none print:h-auto print:w-auto">
          {(isDataContextLoading && isViewModalOpen && !invoiceToViewInModal) && (
            <div className="p-6 space-y-6 animate-pulse">
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div><Skeleton className="h-24 w-full" /></div>
                <div><Skeleton className="h-24 w-full" /></div>
              </div>
              <Skeleton className="h-16 w-full mb-8" />
              <Skeleton className="h-40 w-full mb-8" />
              <div className="flex flex-col-reverse md:flex-row justify-between items-start mb-8 gap-8">
                <Skeleton className="h-32 w-32" />
                <Skeleton className="h-48 w-full md:max-w-sm" />
              </div>
            </div>
          )}
          {(!isDataContextLoading && invoiceToViewInModal) && (
            <>
              <DialogHeader className="p-6 pb-4 border-b print:hidden">
                <DialogTitle>Invoice Details: {invoiceToViewInModal.id}</DialogTitle>
                <DialogDescription>
                  Viewing details for invoice #{invoiceToViewInModal.id}.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-grow overflow-y-auto p-6 space-y-6 print:overflow-visible print:h-auto print:p-0">
                {!customerForModal && <div className="text-destructive p-4 rounded-md border border-destructive/50 bg-destructive/10">Error: Customer not found for this invoice. Please check customer records.</div>}
                {customerForModal && companyProfile && (
                  <>
                    <header className="mb-8">
                      <div className="flex justify-between items-center mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground">INVOICE</h1>
                        <Badge variant={getStatusBadgeVariant(invoiceToViewInModal.status)} className="text-base px-4 py-1.5">
                          {invoiceToViewInModal.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Invoice # {invoiceToViewInModal.id}</p>
                    </header>

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8 text-sm">
                      <div>
                        <h3 className="text-xs uppercase font-semibold text-muted-foreground mb-2">From</h3>
                        <p className="font-semibold text-lg text-foreground">{companyProfile.name}</p>
                        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{companyProfile.address}</p>
                        <p className="text-muted-foreground">{companyProfile.email} | {companyProfile.phone}</p>
                      </div>
                      <div className="md:text-left">
                        <h3 className="text-xs uppercase font-semibold text-muted-foreground mb-2">Bill To</h3>
                        <p className="font-semibold text-lg text-foreground">{customerForModal.name}</p>
                        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{customerForModal.billingAddress}</p>
                        <p className="text-muted-foreground">{customerForModal.email} | {customerForModal.phone}</p>
                      </div>
                    </section>

                    <Separator className="my-8" />

                    <section className="mb-8 p-4 sm:p-6 rounded-lg border bg-muted/40">
                      <div className="grid grid-cols-3 gap-x-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Issue Date</p>
                          <p className="font-medium text-base text-foreground">{format(new Date(invoiceToViewInModal.issueDate), 'MMMM d, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Due Date</p>
                          <p className="font-medium text-base text-foreground">{format(new Date(invoiceToViewInModal.dueDate), 'MMMM d, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Invoice Total</p>
                          <p className="font-bold text-base text-primary">${(typeof invoiceToViewInModal.totalAmount === 'number' ? invoiceToViewInModal.totalAmount : 0).toFixed(2)}</p>
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
                            {invoiceToViewInModal.items.map((item: InvoiceItem, index: number) => (
                              <TableRow key={item.id || index} className="even:bg-muted/20">
                                <TableCell className="font-medium text-foreground py-3 pl-4 sm:pl-6">{item.description}</TableCell>
                                <TableCell className="text-center text-muted-foreground py-3">{item.quantity} ({item.unitType})</TableCell>
                                <TableCell className="text-right text-muted-foreground py-3">${(typeof item.unitPrice === 'number' ? item.unitPrice : 0).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-medium text-foreground py-3 pr-4 sm:pr-6">${(typeof item.total === 'number' ? item.total : 0).toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </section>

                    <section className="flex flex-col-reverse md:flex-row justify-between items-start mb-8 gap-8">
                      <div className="w-full md:w-auto flex flex-col items-center md:items-start print:hidden">
                        {qrCodeValueForModal && (
                          <>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center"><QrCode className="w-4 h-4 mr-2"/>Scan for Quick Details</h3>
                            <div className="p-3 border rounded-lg inline-block bg-white shadow-sm">
                              <QRCodeCanvas value={qrCodeValueForModal} size={128} bgColor="#ffffff" fgColor="#000000" level="Q" />
                            </div>
                          </>
                        )}
                      </div>
                      <div className="w-full md:max-w-sm space-y-2.5 text-sm border p-4 sm:p-6 rounded-lg bg-muted/40">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal (incl. Item Excise):</span>
                          <span className="font-medium text-foreground">${(typeof invoiceToViewInModal.subtotal === 'number' ? invoiceToViewInModal.subtotal : 0).toFixed(2)}</span>
                        </div>
                        {invoiceToViewInModal.vatAmount > 0 && (
                          <div className="flex justify-between">
                              <span className="text-muted-foreground">VAT ({vatRatePercent.toFixed(0)}%):</span>
                              <span className="font-medium text-foreground">${(typeof invoiceToViewInModal.vatAmount === 'number' ? invoiceToViewInModal.vatAmount : 0).toFixed(2)}</span>
                          </div>
                        )}
                        <Separator className="my-3 !bg-border" />
                        <div className="flex justify-between text-base font-semibold">
                          <span className="text-foreground">Total Amount:</span>
                          <span className="text-foreground">${(typeof invoiceToViewInModal.totalAmount === 'number' ? invoiceToViewInModal.totalAmount : 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mt-2 text-green-600 dark:text-green-400">
                          <span className="font-medium">Amount Paid:</span>
                          <span className="font-semibold">${(typeof invoiceToViewInModal.amountPaid === 'number' ? invoiceToViewInModal.amountPaid : 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                          <span className="text-foreground">Balance Due:</span>
                          <span className={`${(typeof invoiceToViewInModal.remainingBalance === 'number' ? invoiceToViewInModal.remainingBalance : 0) > 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
                            ${(typeof invoiceToViewInModal.remainingBalance === 'number' ? invoiceToViewInModal.remainingBalance : 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </section>

                    {invoiceToViewInModal.paymentHistory && invoiceToViewInModal.paymentHistory.length > 0 && (
                      <section className="mb-8 print:hidden">
                        <Separator className="my-8" />
                        <h3 className="text-lg font-semibold text-foreground mb-3">Payment History</h3>
                          <div className="rounded-md border">
                          {invoiceToViewInModal.paymentHistory.map((record, index) => (
                              <div key={record.id} className={`p-3 ${index < invoiceToViewInModal.paymentHistory!.length -1 ? 'border-b' : ''} ${index % 2 === 0 ? 'bg-muted/20' : 'bg-card'}`}>
                                  <div className="flex justify-between items-center text-sm">
                                      <div>
                                          <p className="font-medium">{record.status} {record.paymentMethod ? `(${record.paymentMethod})` : ''}</p>
                                          <p className="text-xs text-muted-foreground">
                                              {format(new Date(record.paymentDate), "MMM d, yyyy 'at' hh:mm a")}
                                          </p>
                                      </div>
                                      <p className="font-semibold text-primary">${(typeof record.amount === 'number' ? record.amount : 0).toFixed(2)}</p>
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
                    <div className="mt-12 text-center text-xs text-muted-foreground print:block hidden">
                        <p>Thank you for your business!</p>
                        {companyProfile && <p>{companyProfile.name} | {companyProfile.email} | {companyProfile.phone}</p>}
                    </div>
                  </>
                )}
              </div>
              <DialogFooter className="p-6 pt-4 border-t flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 print:hidden">
                <Button variant="outline" onClick={() => window.print()} className="w-full sm:w-auto">
                  <Printer className="mr-2 h-4 w-4" /> Print Invoice
                </Button>
                <Button variant="outline" onClick={() => { toast({ title: "Download PDF Action", description: "PDF download functionality would be implemented here." }) }} className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
                <Button onClick={() => {
                  if (invoiceToViewInModal) {
                    handleViewModalOpenChange(false); 
                    setTimeout(() => { 
                      handleEditInvoice(invoiceToViewInModal); 
                    }, 100); 
                  }
                }} className="w-full sm:w-auto">
                  <Edit className="mr-2 h-4 w-4" /> Edit Invoice
                </Button>
              </DialogFooter>
            </>
          )}
          {(!invoiceToViewInModal && isViewModalOpen && !isDataContextLoading) && ( 
             <div className="p-6"><DialogTitle>Error</DialogTitle><DialogDescription>No invoice selected or invoice data is unavailable.</DialogDescription></div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!invoiceToDelete} onOpenChange={(isOpen) => !isOpen && setInvoiceToDelete(null)}>
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
