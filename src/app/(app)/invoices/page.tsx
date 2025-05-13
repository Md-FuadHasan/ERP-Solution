
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import type { Invoice, Customer, PaymentRecord, InvoiceStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format, isBefore, startOfDay } from 'date-fns';
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

  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const action = searchParams.get('action');
    const customerIdParam = searchParams.get('customerId');
    const customerNameParam = searchParams.get('customerName');

    if (action === 'new' && customerIdParam && !isLoading && customers.length > 0) {
      const customer = customers.find(c => c.id === customerIdParam);
      const newInvoiceTemplate: Invoice = {
        id: `INV-${String(Date.now()).slice(-6)}`, // Updated invoice ID generation
        customerId: customerIdParam,
        customerName: customer ? customer.name : (customerNameParam ? decodeURIComponent(customerNameParam) : 'Unknown Customer'),
        issueDate: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(new Date().setDate(new Date().getDate() + 30)), 'yyyy-MM-dd'),
        items: [{ id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, total: 0, unitType: 'PCS' }],
        subtotal: 0,
        taxAmount: 0,
        vatAmount: 0,
        totalAmount: 0,
        status: 'Pending', 
        paymentProcessingStatus: 'Unpaid',
        amountPaid: 0,
        remainingBalance: 0,
        paymentHistory: [],
      };
      setEditingInvoice(newInvoiceTemplate);
      setIsModalOpen(true);
      // Query params will be cleared when modal closes (see handleModalOpenChange)
    }
  }, [searchParams, isLoading, customers, router]);


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

    const previousTotalAmountPaid = (editingInvoice && invoices.some(i => i.id === editingInvoice.id)) ? editingInvoice.amountPaid : 0;

    let newPaymentAmount = 0;

    if (data.paymentProcessingStatus === 'Fully Paid') {
      newPaymentAmount = totalAmount - previousTotalAmountPaid;
       if (newPaymentAmount < 0) newPaymentAmount = 0; 
    } else if (data.paymentProcessingStatus === 'Partially Paid' && data.partialAmountPaid && data.partialAmountPaid > 0) {
      newPaymentAmount = data.partialAmountPaid;
    }
    
    const calculatedAmountPaid = previousTotalAmountPaid + newPaymentAmount; 
    
    if (data.paymentProcessingStatus === 'Partially Paid' && data.partialAmountPaid) {
        if (data.partialAmountPaid <= 0 || ((previousTotalAmountPaid + data.partialAmountPaid) > totalAmount && (previousTotalAmountPaid + data.partialAmountPaid) !== totalAmount) ) {
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
    
    let finalStatus: InvoiceStatus = data.status;

    if (data.status === 'Cancelled') {
        finalStatus = 'Cancelled';
    } else {
        if (totalAmount > 0) {
            if (calculatedRemainingBalance <= 0) {
                finalStatus = 'Paid';
            } else if (calculatedAmountPaid > 0) {
                finalStatus = 'Partially Paid';
            } else { 
                if (finalStatus === 'Paid' || finalStatus === 'Partially Paid') {
                    finalStatus = 'Pending';
                }
                if (finalStatus === 'Pending' && isBefore(startOfDay(new Date(data.dueDate)), startOfDay(new Date())) && calculatedRemainingBalance > 0) {
                    finalStatus = 'Overdue';
                }
            }
        } else { 
            finalStatus = 'Pending'; 
        }
    }


    let updatedPaymentHistory: PaymentRecord[] = (editingInvoice && invoices.some(i => i.id === editingInvoice.id) && editingInvoice.paymentHistory) ? [...editingInvoice.paymentHistory] : [];

    if (newPaymentAmount > 0 && data.paymentMethod) { 
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
      paymentMethod: data.paymentMethod, 
      cashVoucherNumber: data.cashVoucherNumber,
      bankName: data.bankName,
      bankAccountNumber: data.bankAccountNumber,
      onlineTransactionNumber: data.onlineTransactionNumber,
    };

    const isActuallyEditing = editingInvoice && invoices.some(i => i.id === editingInvoice.id);

    if (isActuallyEditing) {
      updateInvoice(invoiceData);
      toast({ title: "Invoice Updated", description: `Invoice ${invoiceData.id} details have been updated.` });
      setEditingInvoice(invoiceData); 
    } else {
      addInvoice(invoiceData);
      toast({ title: "Invoice Created", description: `Invoice ${invoiceData.id} has been successfully created.` });
      setIsModalOpen(false); 
      setEditingInvoice(null); 
    }
  };

  const handleModalOpenChange = (isOpen: boolean) => {
      setIsModalOpen(isOpen);
      if (!isOpen) {
        setEditingInvoice(null);
        if (searchParams.get('action') === 'new' && searchParams.get('customerId')) {
            router.replace('/invoices', { scroll: false });
        }
      }
  };
  
  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Invoices"
          description="Create, track, and manage your invoices."
          actions={
            <Button onClick={handleAddInvoice} disabled className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
            </Button>
          }
        />
        <div className="mb-6">
          <Skeleton className="h-10 w-full md:w-80" />
        </div>
        <div className="rounded-lg border shadow-sm bg-card p-4 overflow-x-auto">
          <Skeleton className="h-8 w-1/4 mb-4" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4 py-2 border-b last:border-b-0">
              <Skeleton className="h-6 flex-1 min-w-[120px]" />
              <Skeleton className="h-6 flex-1 min-w-[200px]" />
              <Skeleton className="h-6 flex-1 min-w-[120px]" />
              <Skeleton className="h-6 flex-1 min-w-[100px]" />
              <Skeleton className="h-6 flex-1 min-w-[100px]" />
              <Skeleton className="h-6 flex-1 min-w-[100px]" />
              <Skeleton className="h-6 flex-1 min-w-[120px]" />
              <Skeleton className="h-6 w-24 min-w-[100px]" />
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
          <Button onClick={handleAddInvoice} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
          </Button>
        }
      />
      <div className="mb-6">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by Invoice ID, Customer Name, or Customer ID..."
          className="w-full md:w-80"
        />
      </div>

      {filteredInvoices.length > 0 ? (
        <div className="rounded-lg border shadow-sm bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Invoice ID</TableHead>
                <TableHead className="min-w-[220px]">Customer</TableHead>
                <TableHead className="min-w-[130px]">Due Date</TableHead>
                <TableHead className="min-w-[110px]">Total</TableHead>
                <TableHead className="min-w-[110px]">Paid</TableHead>
                <TableHead className="min-w-[110px]">Balance</TableHead>
                <TableHead className="min-w-[120px]">Status</TableHead>
                <TableHead className="text-right min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.customerName || customers.find(c=>c.id === invoice.customerId)?.name || invoice.customerId}</TableCell>
                  <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>${invoice.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>${invoice.amountPaid.toFixed(2)}</TableCell>
                  <TableCell>${invoice.remainingBalance.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(invoice.status)}>
                      {invoice.status === 'Partially Paid' ? 'Partially' : invoice.status} {/* Modified line */}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                     <div className="flex justify-end items-center gap-1">
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
          message={searchTerm ? "Try adjusting your search term." : "Get started by creating your first invoice."}
          action={!searchTerm && (
            <Button onClick={handleAddInvoice} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Invoice
            </Button>
          )}
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingInvoice && invoices.some(i => i.id === editingInvoice.id) ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            <DialogDescription>
              {editingInvoice && invoices.some(i => i.id === editingInvoice.id) ? `Update details for invoice ${editingInvoice.id}.` : 'Fill in the details to create a new invoice.'}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-grow p-6">
            <InvoiceForm
              key={editingInvoice ? editingInvoice.id + (editingInvoice.paymentHistory?.length || 0) + editingInvoice.customerId + editingInvoice.status : 'new-invoice'}
              initialData={editingInvoice}
              customers={customers}
              companyProfile={companyProfile}
              invoices={invoices}
              onSubmit={handleSubmit}
              onCancel={() => handleModalOpenChange(false)}
            />
          </div>
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

