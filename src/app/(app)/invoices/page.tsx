
'use client';
import { useState, useMemo } from 'react';
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
import type { Invoice, Customer } from '@/types';
import { MOCK_INVOICES, MOCK_CUSTOMERS } from '@/types'; // Using mock data
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
} from "@/components/ui/alert-dialog";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [customers] = useState<Customer[]>(MOCK_CUSTOMERS); // Assuming customers are fairly static for the form
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const { toast } = useToast();

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    return invoices.filter(
      (invoice) =>
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    setIsModalOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };
  
  const handleViewInvoice = (invoice: Invoice) => {
    // For now, view is same as edit. Could be a read-only view later.
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      // IMPORTANT: User requirement: Managers cannot delete invoices. This UI assumes an admin role.
      // Actual deletion logic should check user permissions.
      setInvoices(invoices.filter((inv) => inv.id !== invoiceToDelete.id));
      toast({ title: "Invoice Deleted", description: `Invoice ${invoiceToDelete.id} has been removed.` });
      setInvoiceToDelete(null);
    }
  };

  const handleSubmit = (data: InvoiceFormValues) => {
    // Recalculate totals based on form items, taxRate and vatRate would come from settings
    const companyTaxRate = MOCK_CUSTOMERS.length > 0 ? 0.10 : 0; // Example, pull from settings
    const companyVatRate = MOCK_CUSTOMERS.length > 0 ? 0.05 : 0; // Example

    const processedItems = data.items.map((item, index) => ({
      ...item,
      id: editingInvoice?.items[index]?.id || `item-${Date.now()}-${index}`,
      total: item.quantity * item.unitPrice,
    }));

    const subtotal = processedItems.reduce((acc, item) => acc + item.total, 0);
    const taxAmount = subtotal * companyTaxRate;
    const vatAmount = subtotal * companyVatRate;
    const totalAmount = subtotal + taxAmount + vatAmount;
    const customerName = customers.find(c => c.id === data.customerId)?.name;

    const invoiceData: Invoice = {
      id: data.id,
      customerId: data.customerId,
      status: data.status,
      customerName,
      items: processedItems,
      subtotal,
      taxAmount,
      vatAmount,
      totalAmount,
      issueDate: format(data.issueDate, 'yyyy-MM-dd'), // data.issueDate is a Date object from InvoiceFormValues
      dueDate: format(data.dueDate, 'yyyy-MM-dd'),   // data.dueDate is a Date object from InvoiceFormValues
    };


    if (editingInvoice) {
      setInvoices(
        invoices.map((inv) =>
          inv.id === editingInvoice.id ? { ...invoiceData, id: editingInvoice.id } : inv
        )
      );
      toast({ title: "Invoice Updated", description: `Invoice ${invoiceData.id} details have been updated.` });
    } else {
      setInvoices([invoiceData, ...invoices]);
      toast({ title: "Invoice Created", description: `Invoice ${invoiceData.id} has been successfully created.` });
    }
    setIsModalOpen(false);
    setEditingInvoice(null);
  };
  
  const getStatusBadgeVariant = (status: Invoice['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Paid': return 'default'; // Primary color for paid
      case 'Sent': return 'secondary';
      case 'Overdue': return 'destructive';
      case 'Draft': return 'outline';
      case 'Cancelled': return 'outline'; // Consider a different color for cancelled
      default: return 'outline';
    }
  };


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
          placeholder="Search by Invoice ID or Customer..."
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
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.customerName || invoice.customerId}</TableCell>
                  <TableCell>{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>${invoice.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(invoice)} className="hover:text-primary" title="View/Edit Invoice">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {/* User req: managers cannot delete invoices. This button should be hidden based on role */}
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteInvoice(invoice)} className="hover:text-destructive" title="Delete Invoice">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
        <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            <DialogDescription>
              {editingInvoice ? `Update details for invoice ${editingInvoice.id}.` : 'Fill in the details to create a new invoice.'}
            </DialogDescription>
          </DialogHeader>
          <InvoiceForm
            initialData={editingInvoice}
            customers={customers}
            onSubmit={handleSubmit}
            onCancel={() => { setIsModalOpen(false); setEditingInvoice(null); }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!invoiceToDelete} onOpenChange={(isOpen) => !isOpen && setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete invoice
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
