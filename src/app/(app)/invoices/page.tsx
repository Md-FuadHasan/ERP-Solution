
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Eye, Printer, Download, QrCode, DollarSign, History, ChevronsUpDown, Check, Filter as FilterIcon, CalendarIcon, ArrowUp, ArrowDown, ArrowLeft } from 'lucide-react';
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
  DialogDescription as FormDialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { InvoiceForm, type InvoiceFormValues } from '@/components/forms/invoice-form';
import { SearchInput } from '@/components/common/search-input';
import { StatusFilterDropdown, type InvoiceFilterStatus } from '@/components/common/status-filter-dropdown';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import type { Invoice, Customer, PaymentRecord, InvoiceStatus, PaymentProcessingStatus, PaymentMethod, CompanyProfile, InvoiceItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format, isBefore, startOfDay, isValid, parseISO, isWithinInterval } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeVariant } from '@/lib/invoiceUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc,
  AlertDialogFooter as AlertDialogFooterComponent,
  AlertDialogHeader as AlertDialogHeaderComponent,
  AlertDialogTitle as AlertDialogTitleComponent,
  // AlertDialogTrigger, // Removed as it was causing issues in table rows
} from "@/components/ui/alert-dialog";
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { QRCodeCanvas } from 'qrcode.react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from '@/components/ui/calendar';
import InvoiceTaxView from '@/components/invoices/InvoiceTaxView';


type SortableInvoiceKeys = keyof Pick<Invoice, 'id' | 'dueDate' | 'status' | 'issueDate'> | 'customerName' | 'totalAmount' | 'remainingBalance' | 'amountPaid';

interface SortConfig {
  key: SortableInvoiceKeys | null;
  direction: 'ascending' | 'descending';
}

interface DateRange {
  from: Date | null;
  to: Date | null;
}

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
    products, 
    warehouses, 
    getStockForProductInWarehouse,
    getProductById,
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

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'issueDate', direction: 'descending' });
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

  const handleFormModalOpenChange = useCallback((isOpen: boolean) => {
    setIsFormModalOpen(isOpen);
    if (!isOpen) {
      setEditingInvoice(null);
      setCurrentPrefillValues(null);
      const action = searchParams.get('action');
      if (action === 'new' || action === 'edit') {
        // Clear URL params only if the modal was opened by them
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('action');
        newSearchParams.delete('id');
        newSearchParams.delete('customerId');
        newSearchParams.delete('customerName');
        router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
        // It's crucial to also reset the processed intent key when the URL is cleared
        // This will be handled by the useEffect below
      }
    }
  }, [searchParams, router, pathname]);

  const handleViewModalOpenChange = useCallback((isOpen: boolean) => {
    setIsViewModalOpen(isOpen);
    if (!isOpen) {
      setInvoiceToViewInModal(null);
      const action = searchParams.get('action');
      if (action === 'view') {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('action');
        newSearchParams.delete('id');
        router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
         // It's crucial to also reset the processed intent key when the URL is cleared
        // This will be handled by the useEffect below
      }
    }
  }, [searchParams, router, pathname]);


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
    
    if (currentUrlIntentKey) {
      if (urlParamsProcessedIntentKey !== currentUrlIntentKey) {
        if (action === 'new' && !isFormModalOpen && !editingInvoice) {
          setCurrentPrefillValues({ customerId: customerIdParam, customerName: customerNameParam });
          setEditingInvoice(null);
          setIsFormModalOpen(true);
          setUrlParamsProcessedIntentKey(currentUrlIntentKey);
        } else if (action === 'edit' && invoiceIdParam && !isFormModalOpen) {
          const invoiceToEdit = invoices.find(inv => inv.id === invoiceIdParam);
          if (invoiceToEdit) {
            setEditingInvoice(invoiceToEdit);
            setCurrentPrefillValues(null);
            setIsFormModalOpen(true);
            setUrlParamsProcessedIntentKey(currentUrlIntentKey);
          }
        } else if (action === 'view' && invoiceIdParam && !isViewModalOpen) {
          const invoiceToView = invoices.find(inv => inv.id === invoiceIdParam);
          if (invoiceToView) {
            setInvoiceToViewInModal(invoiceToView);
            setIsViewModalOpen(true);
            setUrlParamsProcessedIntentKey(currentUrlIntentKey);
          }
        }
      }
    } else {
      // If URL no longer has an actionable intent, reset the processed key
      if (urlParamsProcessedIntentKey) {
        setUrlParamsProcessedIntentKey(null);
      }
    }
  }, [searchParams, invoices, isFormModalOpen, editingInvoice, isViewModalOpen, urlParamsProcessedIntentKey]);


  const handleAddNewInvoice = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('action', 'new');
    newSearchParams.delete('id'); // Clear any existing edit ID
    newSearchParams.delete('customerId'); // Clear specific customer prefill if any
    newSearchParams.delete('customerName');
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const handleSort = useCallback((key: SortableInvoiceKeys) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key && prevConfig.direction === 'ascending') {
        return { key, direction: 'descending' };
      }
      return { key, direction: 'ascending' };
    });
  }, []);

  const handleDateChange = useCallback((type: 'from' | 'to', date: Date | undefined) => {
    setDateRange(prevRange => ({ ...prevRange, [type]: date || null }));
  }, []);

  const filteredInvoices = useMemo(() => {
    let _filtered = [...invoices];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      _filtered = _filtered.filter(invoice => {
        const customer = getCustomerById(invoice.customerId); // Fetch customer for comprehensive search
        return invoice.id.toLowerCase().includes(lowerSearchTerm) ||
               (invoice.customerName && invoice.customerName.toLowerCase().includes(lowerSearchTerm)) ||
               (customer && customer.name.toLowerCase().includes(lowerSearchTerm)) ||
               invoice.customerId.toLowerCase().includes(lowerSearchTerm);
      });
    }

    if (statusFilter !== 'all') {
      _filtered = _filtered.filter(invoice => {
        if (statusFilter === 'paid') return invoice.status === 'Paid';
        if (statusFilter === 'unpaid') return ['Pending', 'Overdue'].includes(invoice.status);
        if (statusFilter === 'partially-paid') return invoice.status === 'Partially Paid';
        if (statusFilter === 'cancelled') return invoice.status === 'Cancelled';
        return true; 
      });
    }

    if (dateRange.from || dateRange.to) {
      _filtered = _filtered.filter(invoice => {
        try {
            const issueDate = parseISO(invoice.issueDate);
            if (!isValid(issueDate)) return false;

            const fromDate = dateRange.from ? startOfDay(dateRange.from) : null;
            const toDate = dateRange.to ? startOfDay(dateRange.to) : null;

            if (fromDate && toDate) {
            return isWithinInterval(issueDate, { start: fromDate, end: toDate });
            }
            if (fromDate) {
            return issueDate >= fromDate;
            }
            if (toDate) {
            return issueDate <= toDate;
            }
            return true;
        } catch(e) {
            console.error("Error parsing invoice date:", invoice.issueDate, e);
            return false; // Exclude problematic dates
        }
      });
    }

    if (sortConfig.key) {
      _filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        if (sortConfig.key === 'customerName') {
            aValue = a.customerName || getCustomerById(a.customerId)?.name || '';
            bValue = b.customerName || getCustomerById(b.customerId)?.name || '';
        } else if (sortConfig.key === 'issueDate' || sortConfig.key === 'dueDate') {
            try {
                aValue = new Date(a[sortConfig.key as 'issueDate' | 'dueDate']).getTime();
                bValue = new Date(b[sortConfig.key as 'issueDate' | 'dueDate']).getTime();
                if (isNaN(aValue)) aValue = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
                if (isNaN(bValue)) bValue = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
            } catch (e) {
                aValue = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
                bValue = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
            }
        } else {
            aValue = a[sortConfig.key as keyof Invoice];
            bValue = b[sortConfig.key as keyof Invoice];
        }

        if (aValue === undefined || aValue === null) aValue = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
        if (bValue === undefined || bValue === null) bValue = sortConfig.direction === 'ascending' ? Infinity : -Infinity;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return _filtered;
  }, [invoices, searchTerm, statusFilter, dateRange, sortConfig, getCustomerById]);

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
    if (invoiceToViewInModal && companyProfile) {
      const totalAmount = typeof invoiceToViewInModal.totalAmount === 'number' ? invoiceToViewInModal.totalAmount : 0;
      setQrCodeValueForModal(`Invoice ID: ${invoiceToViewInModal.id}\nTotal Amount: $${totalAmount.toFixed(2)}\nDue Date: ${format(new Date(invoiceToViewInModal.dueDate), 'MMM d, yyyy')}`);
    } else {
      setQrCodeValueForModal('');
    }
  }, [invoiceToViewInModal, companyProfile]);

  const handleDeleteInvoiceConfirm = useCallback((invoice: Invoice) => {
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
    if (!companyProfile) {
        toast({ title: "Error", description: "Company profile not loaded.", variant: "destructive" });
        setIsSaving(false);
        return;
    }

    const calculatedItems = data.items.map(item => ({
        ...item,
        total: (item.quantity || 0) * (item.unitPrice || 0), // unitPrice already includes product-level excise
    }));
    
    const calculatedSubtotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);
    const calculatedGeneralTaxAmount = 0; // General tax is 0.
    const vatRate = (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : Number(companyProfile.vatRate) || 0) / 100;
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
       if (paymentAmount > 0 || (paymentAmount === 0 && newAmountPaid < calculatedTotalAmount)) {
         const effectivePayment = paymentAmount > 0 ? paymentAmount : (calculatedTotalAmount - newAmountPaid);
         if (effectivePayment > 0) {
           newPaymentHistory.push({
            id: `PAY-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
            paymentDate: new Date().toISOString(),
            amount: effectivePayment,
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
      finalStatus = 'Paid'; // Default to paid if no other conditions met for balance > 0
    }

    const invoiceToSave: Invoice = {
      id: data.id,
      customerId: data.customerId,
      customerName: customer?.name || 'N/A',
      issueDate: format(new Date(data.issueDate), 'yyyy-MM-dd'),
      dueDate: format(new Date(data.dueDate), 'yyyy-MM-dd'),
      items: calculatedItems,
      subtotal: calculatedSubtotal,
      taxAmount: calculatedGeneralTaxAmount, // General tax is 0
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

    if (editingInvoice) {
      updateInvoice(invoiceToSave);
      toast({ title: "Invoice Updated", description: `Invoice ${data.id} has been updated.` });
    } else {
      addInvoice(invoiceToSave as Omit<Invoice, 'customerName' | 'paymentHistory' | 'amountPaid' | 'remainingBalance'> & { items: Array<InvoiceItem & { sourceWarehouseId?: string }>});
      toast({ title: "Invoice Added", description: `Invoice ${data.id} has been created.` });
    }

    handleFormModalOpenChange(false); 
    setIsSaving(false);
  }, [editingInvoice, invoices, getCustomerById, companyProfile, addInvoice, updateInvoice, toast, handleFormModalOpenChange]);


  const customerForModal = invoiceToViewInModal ? getCustomerById(invoiceToViewInModal.customerId) : null;
  const vatRatePercent = companyProfile?.vatRate ? (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : Number(companyProfile.vatRate)) : 0;

  const renderSortIcon = (columnKey: SortableInvoiceKeys) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="ml-2 h-3 w-3" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />;
  };

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
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 flex-1 min-w-0">
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by ID, Customer..." className="w-full md:w-64 lg:flex-none" />
            <StatusFilterDropdown selectedStatus={statusFilter} onStatusChange={setStatusFilter} className="w-full md:w-[200px] lg:flex-none" />
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal lg:flex-none">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "PPP") : <span>Issue Date From</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateRange.from || undefined} onSelect={(date) => handleDateChange('from', date)} initialFocus />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal lg:flex-none">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "PPP") : <span>Issue Date To</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateRange.to || undefined} onSelect={(date) => handleDateChange('to', date)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </div>

      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 mb-4 md:mb-6 lg:mb-8">
        <CardHeader className="border-b">
            <CardTitle>Invoice List</CardTitle>
            <CardDescription>Overview of all invoices.</CardDescription>
        </CardHeader>
        <div className="h-full overflow-y-auto">
          {isDataContextLoading ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2 text-sm font-semibold">Invoice ID</TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm font-semibold">Customer</TableHead>
                  <TableHead className="min-w-[120px] px-2 text-sm font-semibold">Due Date</TableHead>
                  <TableHead className="min-w-[100px] text-right px-2 text-sm font-semibold">Amount</TableHead>
                  <TableHead className="min-w-[100px] text-right px-2 text-sm font-semibold">Paid</TableHead>
                  <TableHead className="min-w-[100px] text-right px-2 text-sm font-semibold">Balance</TableHead>
                  <TableHead className="min-w-[110px] px-2 text-sm font-semibold">Status</TableHead>
                  <TableHead className="text-right min-w-[150px] px-2 text-sm font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(7)].map((_, i) => (
                  <TableRow key={i} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50')}>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2 text-xs">
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
                  <TableHead className="min-w-[100px] px-2 text-sm font-semibold cursor-pointer hover:bg-primary/80" onClick={() => handleSort('id')}>
                    <div className="flex items-center">Invoice ID {renderSortIcon('id')}</div>
                  </TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm font-semibold cursor-pointer hover:bg-primary/80" onClick={() => handleSort('customerName')}>
                     <div className="flex items-center">Customer {renderSortIcon('customerName')}</div>
                  </TableHead>
                  <TableHead className="min-w-[120px] px-2 text-sm font-semibold cursor-pointer hover:bg-primary/80" onClick={() => handleSort('dueDate')}>
                    <div className="flex items-center">Due Date {renderSortIcon('dueDate')}</div>
                  </TableHead>
                  <TableHead className="min-w-[100px] text-right px-2 text-sm font-semibold cursor-pointer hover:bg-primary/80" onClick={() => handleSort('totalAmount')}>
                    <div className="flex items-center justify-end">Amount {renderSortIcon('totalAmount')}</div>
                  </TableHead>
                  <TableHead className="min-w-[100px] text-right px-2 text-sm font-semibold cursor-pointer hover:bg-primary/80" onClick={() => handleSort('amountPaid')}>
                    <div className="flex items-center justify-end">Paid {renderSortIcon('amountPaid')}</div>
                  </TableHead>
                  <TableHead className="min-w-[100px] text-right px-2 text-sm font-semibold cursor-pointer hover:bg-primary/80" onClick={() => handleSort('remainingBalance')}>
                    <div className="flex items-center justify-end">Balance {renderSortIcon('remainingBalance')}</div>
                  </TableHead>
                  <TableHead className="min-w-[110px] px-2 text-sm font-semibold cursor-pointer hover:bg-primary/80" onClick={() => handleSort('status')}>
                    <div className="flex items-center">Status {renderSortIcon('status')}</div>
                  </TableHead>
                  <TableHead className="text-right min-w-[150px] px-2 text-sm font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice, index) => (
                  <TableRow key={invoice.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell className="font-medium px-2 text-xs">{invoice.id}</TableCell>
                    <TableCell className="px-2 text-xs">{invoice.customerName || getCustomerById(invoice.customerId)?.name || 'N/A'}</TableCell>
                    <TableCell className="px-2 text-xs">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right px-2 text-xs">${invoice.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right px-2 text-xs text-green-600 dark:text-green-400">${invoice.amountPaid.toFixed(2)}</TableCell>
                    <TableCell className={cn(
                        "text-right font-semibold px-2 text-xs",
                        invoice.remainingBalance > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"
                      )}>${invoice.remainingBalance.toFixed(2)}</TableCell>
                    <TableCell className="px-2 text-xs">
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-2 text-xs">
                      <div className="flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewInvoiceInModal(invoice)} className="hover:text-primary p-1.5" title="View Invoice">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditInvoice(invoice)} className="hover:text-primary p-1.5" title="Edit Invoice">
                          <Edit className="h-4 w-4" />
                        </Button>
                           <Button variant="ghost" size="icon" className="hover:text-destructive p-1.5" title="Delete Invoice" onClick={(e) => { e.stopPropagation(); handleDeleteInvoiceConfirm(invoice); }}>
                              <Trash2 className="h-4 w-4" />
                           </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="h-full flex items-center justify-center p-6">
              <DataPlaceholder
                title="No Invoices Found"
                message={searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to ? "Try adjusting your search or filter criteria." : "Get started by adding your first invoice."}
                icon={PlusCircle}
                action={!searchTerm && statusFilter === 'all' && !dateRange.from && !dateRange.to ? (
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
            <FormDialogDescription>
              {editingInvoice ? `Update details for invoice ${editingInvoice.id}.` : 'Fill in the details to create a new invoice.'}
            </FormDialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
            {isFormModalOpen && companyProfile && (
              <InvoiceForm
                initialData={editingInvoice}
                customers={customers}
                companyProfile={companyProfile}
                invoices={invoices}
                products={products}
                warehouses={warehouses}
                getStockForProductInWarehouse={getStockForProductInWarehouse}
                getProductById={getProductById}
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
        <DialogContent className="w-[95vw] max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none print:max-h-none print:h-auto print:w-auto print-root-content">
          {(isDataContextLoading && isViewModalOpen && !invoiceToViewInModal) && (
            <div className="flex-grow overflow-y-auto p-6 space-y-6 animate-pulse">
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div><Skeleton className="h-24 w-full" /></div>
                <div><Skeleton className="h-24 w-full" /></div>
              </div>
              <Skeleton className="h-12 w-full mb-6" />
              <Skeleton className="h-6 w-1/4 mb-4" />
              <Skeleton className="h-48 w-full mb-6" />
              <div className="flex justify-between items-start gap-6">
                <Skeleton className="h-40 w-32" />
                <Skeleton className="h-40 w-1/2" />
              </div>
             </div>
          )}
          {(!isDataContextLoading && invoiceToViewInModal && companyProfile && customerForModal) && (
            <>
              <DialogHeader className="p-6 pb-4 border-b print:hidden">
                <DialogTitle>Invoice Details: {invoiceToViewInModal.id}</DialogTitle>
                <FormDialogDescription>
                  Viewing details for invoice #{invoiceToViewInModal.id}. This dialog will change to TAX INVOICE when printed.
                </FormDialogDescription>
              </DialogHeader>
              <div className="flex-grow overflow-y-auto space-y-0 print:overflow-visible print:h-auto print:p-0">
                <InvoiceTaxView
                    invoice={invoiceToViewInModal}
                    customer={customerForModal}
                    companyProfile={companyProfile}
                    warehouses={warehouses} // Make sure warehouses is passed
                />
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
                 <Button variant="outline" onClick={() => handleViewModalOpenChange(false)} className="w-full sm:w-auto">Close</Button>
              </DialogFooter>
            </>
          )}
          {(!invoiceToViewInModal && isViewModalOpen && !isDataContextLoading) && (
             <div className="p-6"><DialogHeader><DialogTitle>Error</DialogTitle><FormDialogDescription>No invoice selected or invoice data is unavailable.</FormDialogDescription></DialogHeader></div>
          )}
           {(!customerForModal && invoiceToViewInModal && !isDataContextLoading) && (
             <div className="p-6"><DialogHeader><DialogTitle>Error</DialogTitle><FormDialogDescription>Customer for invoice "{invoiceToViewInModal.id}" not found.</FormDialogDescription></DialogHeader></div>
          )}
        </DialogContent>
      </Dialog>

       <AlertDialog open={!!invoiceToDelete} onOpenChange={(isOpen) => !isOpen && setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent>Are you sure?</AlertDialogTitleComponent>
            <AlertDialogDesc>
              This action cannot be undone. This will permanently delete the invoice "{invoiceToDelete?.id}".
            </AlertDialogDesc>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancel onClick={() => setInvoiceToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooterComponent>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isCreditLimitAlertOpen} onOpenChange={setIsCreditLimitAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent>Credit Limit Exceeded</AlertDialogTitleComponent>
            <AlertDialogDesc>{creditLimitAlertMessage}</AlertDialogDesc>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogAction onClick={() => setIsCreditLimitAlertOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooterComponent>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
