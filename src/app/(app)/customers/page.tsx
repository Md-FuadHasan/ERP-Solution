
'use client';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, ReceiptText, DollarSign, Coins, Scale } from 'lucide-react';
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
import { CustomerForm, type CustomerFormValues } from '@/components/forms/customer-form';
import { SearchInput } from '@/components/common/search-input';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import type { Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeVariant } from '@/lib/invoiceUtils';
import { useData } from '@/context/DataContext'; 
import { Skeleton } from '@/components/ui/skeleton'; 

export default function CustomersPage() {
  const { 
    customers, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    isLoading, 
    getInvoicesByCustomerId 
  } = useData(); 

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { toast } = useToast();

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const customerInvoices = useMemo(() => {
    if (!selectedCustomerForDetails) return [];
    return getInvoicesByCustomerId(selectedCustomerForDetails.id);
  }, [selectedCustomerForDetails, getInvoicesByCustomerId]);

  const customerAggregates = useMemo(() => {
    if (!selectedCustomerForDetails) {
      return { totalInvoices: 0, totalPurchased: 0, totalPaid: 0, remainingBalance: 0 };
    }
    const invoices = getInvoicesByCustomerId(selectedCustomerForDetails.id);
    if (invoices.length === 0) {
         return { totalInvoices: 0, totalPurchased: 0, totalPaid: 0, remainingBalance: 0 };
    }
    const totalPurchased = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const remainingBalance = invoices.reduce((sum, inv) => sum + inv.remainingBalance, 0);
    return {
      totalInvoices: invoices.length,
      totalPurchased,
      totalPaid,
      remainingBalance
    };
  }, [selectedCustomerForDetails, getInvoicesByCustomerId]);


  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsFormModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormModalOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id); 
      toast({ title: "Customer Deleted", description: `${customerToDelete.name} has been removed.` });
      setCustomerToDelete(null);
    }
  };

  const handleViewCustomerDetails = (customer: Customer) => {
    setSelectedCustomerForDetails(customer);
    setIsDetailsModalOpen(true);
  };

  const closeCustomerDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setTimeout(() => setSelectedCustomerForDetails(null), 300);
  };


  const handleSubmit = (data: CustomerFormValues) => {
    if (editingCustomer) {
      updateCustomer({ ...editingCustomer, ...data }); 
      toast({ title: "Customer Updated", description: `${data.name} details have been updated.` });
    } else {
      let customerId = data.id;
      if (!customerId) {
        customerId = `CUST${String(Date.now()).slice(-4)}${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`;
        // Basic check for uniqueness, in a real app, this would be more robust
        while (customers.find(c => c.id === customerId)) {
            customerId = `CUST${String(Date.now()).slice(-4)}${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`;
        }
      } else {
        // Check if user provided ID already exists
        if (customers.find(c => c.id === customerId && (!editingCustomer || editingCustomer.id !== customerId))) {
          toast({
            title: "Error: Customer ID exists",
            description: `Customer ID ${customerId} is already in use. Please choose a different ID or leave it blank for auto-generation.`,
            variant: "destructive",
          });
          return;
        }
      }

      const newCustomer: Customer = {
        ...data,
        id: customerId,
        createdAt: new Date().toISOString(),
      };
      addCustomer(newCustomer); 
      toast({ title: "Customer Added", description: `${data.name} has been successfully added.` });
    }
    setIsFormModalOpen(false);
    setEditingCustomer(null);
  };

  if (isLoading) {
     return (
      <>
        <PageHeader
          title="Customers"
          description="Manage your customer profiles and contact information."
          actions={
            <Button onClick={handleAddCustomer} disabled>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
            </Button>
          }
        />
        <div className="mb-6">
          <Skeleton className="h-10 w-full md:w-80" />
        </div>
        <div className="rounded-lg border shadow-sm bg-card p-4">
          <Skeleton className="h-8 w-1/4 mb-4" />
          {[...Array(3)].map((_, i) => (
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
        title="Customers"
        description="Manage your customer profiles and contact information."
        actions={
          <Button onClick={handleAddCustomer}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
          </Button>
        }
      />
      <div className="mb-6">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name, email, or ID..."
        />
      </div>

      {filteredCustomers.length > 0 ? (
        <div className="rounded-lg border shadow-sm bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.id}</TableCell>
                  <TableCell 
                    className="cursor-pointer hover:text-primary hover:underline"
                    onClick={() => handleViewCustomerDetails(customer)}
                  >
                    {customer.name}
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditCustomer(customer)} className="mr-2 hover:text-primary">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={(e) => {
                            e.stopPropagation(); 
                            handleDeleteCustomer(customer);
                          }}>
                           <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                       <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the customer
                            "{customerToDelete?.name}" and all associated data (including invoices).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
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
          title="No Customers Found"
          message={searchTerm ? "Try adjusting your search term." : "Get started by adding your first customer."}
          action={!searchTerm ? (
            <Button onClick={handleAddCustomer}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          ) : undefined}
        />
      )}

      <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => {
          setIsFormModalOpen(isOpen);
          if (!isOpen) setEditingCustomer(null);
      }}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-lg md:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Update the details for this customer.' : 'Enter the details for the new customer.'}
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            initialData={editingCustomer}
            onSubmit={handleSubmit}
            onCancel={() => { setIsFormModalOpen(false); setEditingCustomer(null); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsModalOpen} onOpenChange={closeCustomerDetailsModal}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Customer Profile: {selectedCustomerForDetails?.name}</DialogTitle>
            <DialogDescription>
              Financial overview and invoice history for {selectedCustomerForDetails?.email}.
            </DialogDescription>
          </DialogHeader>
          {selectedCustomerForDetails && (
            <div className="space-y-6 flex-grow overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                    <ReceiptText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{customerAggregates.totalInvoices}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Purchased</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${customerAggregates.totalPurchased.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                    <Coins className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${customerAggregates.totalPaid.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Balance Due</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${customerAggregates.remainingBalance > 0 ? 'text-destructive' : ''}`}>
                      ${customerAggregates.remainingBalance.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 text-foreground">Invoice History</h4>
                {customerInvoices.length > 0 ? (
                  <div className="rounded-md border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice ID</TableHead>
                          <TableHead>Issue Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.id}</TableCell>
                            <TableCell>{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>${invoice.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <DataPlaceholder
                    title="No Invoices Found"
                    message={`${selectedCustomerForDetails.name} does not have any invoices yet.`}
                    icon={ReceiptText}
                  />
                )}
              </div>
            </div>
          )}
           <div className="mt-auto pt-4 flex justify-end">
                <Button variant="outline" onClick={closeCustomerDetailsModal}>Close</Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* This AlertDialog is for confirming customer deletion */}
      <AlertDialog open={!!customerToDelete} onOpenChange={(isOpen) => !isOpen && setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer
              "{customerToDelete?.name}" and all associated data (including invoices).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


    

    