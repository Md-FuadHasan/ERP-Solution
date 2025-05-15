
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, ReceiptText, DollarSign, Coins, Scale, Briefcase, Clock3, CircleDollarSign } from 'lucide-react';
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
import { CustomerForm, type CustomerFormValues } from '@/components/forms/customer-form';
import { SearchInput } from '@/components/common/search-input';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import type { Customer, CustomerType, InvoiceAgingDays } from '@/types';
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
  const router = useRouter();

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

  const handleDeleteCustomerConfirm = (customer: Customer) => {
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

  const handleAddNewInvoiceForCustomer = (customer: Customer | null) => {
    if (customer) {
      const customerName = customer.name ? encodeURIComponent(customer.name) : '';
      closeCustomerDetailsModal();
      router.push(`/invoices?action=new&customerId=${customer.id}&customerName=${customerName}`);
    }
  };


  const handleSubmit = (data: CustomerFormValues) => {
    if (editingCustomer) {
      const updatedCustomerData: Customer = {
        ...editingCustomer,
        ...data,
        creditLimit: data.customerType === 'Credit' ? data.creditLimit : undefined,
        invoiceAgingDays: data.customerType === 'Credit' ? data.invoiceAgingDays : undefined,
      };
      updateCustomer(updatedCustomerData); 
      toast({ title: "Customer Updated", description: `${data.name} details have been updated.` });
    } else {
      let customerId = data.id;
      if (!customerId) {
        customerId = `CUST${String(Date.now()).slice(-4)}${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`;
        while (customers.find(c => c.id === customerId)) {
            customerId = `CUST${String(Date.now()).slice(-4)}${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`;
        }
      } else {
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
        creditLimit: data.customerType === 'Credit' ? data.creditLimit : undefined,
        invoiceAgingDays: data.customerType === 'Credit' ? data.invoiceAgingDays : undefined,
      };
      addCustomer(newCustomer); 
      toast({ title: "Customer Added", description: `${data.name} has been successfully added.` });
    }
    setIsFormModalOpen(false);
    setEditingCustomer(null);
  };

  if (isLoading) {
     return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Customers"
          description="Manage your customer profiles and contact information."
          actions={
            <Button onClick={handleAddCustomer} disabled className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
            </Button>
          }
        />
        <div className="mb-6">
          <Skeleton className="h-10 w-full md:w-80" />
        </div>
        <div className="flex-grow min-h-0">
          <div className="rounded-lg border shadow-sm bg-card overflow-hidden h-full">
            <div className="overflow-y-auto max-h-96 h-full">
              <Skeleton className="h-12 w-full sticky top-0 z-10 bg-muted p-4 border-b" />
              <div className="p-4 space-y-2">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex space-x-4 py-2 border-b last:border-b-0">
                    <Skeleton className="h-6 flex-1 min-w-[100px]" />
                    <Skeleton className="h-6 flex-1 min-w-[150px]" />
                    <Skeleton className="h-6 flex-1 min-w-[150px]" />
                    <Skeleton className="h-6 w-24 min-w-[96px]" />
                    <Skeleton className="h-6 w-20 min-w-[80px]" />
                    <Skeleton className="h-6 w-24 min-w-[96px]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Customers"
        description="Manage your customer profiles and contact information."
        actions={
          <Button onClick={handleAddCustomer} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
          </Button>
        }
      />
      <div className="mb-6">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name, email, or ID..."
          className="w-full md:w-80"
        />
      </div>

      <div className="flex-grow min-h-0">
        <div className="rounded-lg border shadow-sm bg-card overflow-hidden h-full">
          <div className="overflow-y-auto max-h-96 h-full">
            {filteredCustomers.length > 0 ? (
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  <TableRow>
                    <TableHead className="min-w-[120px]">Customer ID</TableHead>
                    <TableHead className="min-w-[180px]">Name</TableHead>
                    <TableHead className="min-w-[200px]">Email</TableHead>
                    <TableHead className="min-w-[140px]">Phone</TableHead>
                    <TableHead className="min-w-[120px]">Type</TableHead>
                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
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
                      <TableCell>
                        <Badge variant={customer.customerType === 'Credit' ? 'secondary' : 'outline'}>
                          {customer.customerType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditCustomer(customer)} className="hover:text-primary" title="Edit Customer">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:text-destructive" title="Delete Customer" onClick={(e) => {
                                  e.stopPropagation(); 
                                  handleDeleteCustomerConfirm(customer);
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <DataPlaceholder
                  title="No Customers Found"
                  message={searchTerm ? "Try adjusting your search term." : "Get started by adding your first customer."}
                  action={!searchTerm ? (
                    <Button onClick={handleAddCustomer} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
                    </Button>
                  ) : undefined}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => {
          setIsFormModalOpen(isOpen);
          if (!isOpen) setEditingCustomer(null);
      }}>
        <DialogContent className="w-[90vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Update the details for this customer.' : 'Enter the details for the new customer.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
            <CustomerForm
              initialData={editingCustomer}
              onSubmit={handleSubmit}
              onCancel={() => { setIsFormModalOpen(false); setEditingCustomer(null); }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsModalOpen} onOpenChange={closeCustomerDetailsModal}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Customer Profile: {selectedCustomerForDetails?.name}</DialogTitle>
            <DialogDescription>
              Financial overview and invoice history for {selectedCustomerForDetails?.email}.
            </DialogDescription>
          </DialogHeader>
          {selectedCustomerForDetails && (
            <div className="space-y-6 flex-grow overflow-y-auto p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center">
                    <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                    <strong>Type:</strong>&nbsp;{selectedCustomerForDetails.customerType} Customer
                  </div>
                  {selectedCustomerForDetails.customerType === 'Credit' && (
                    <>
                      <div className="flex items-center">
                        <CircleDollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                        <strong>Credit Limit:</strong>&nbsp;${selectedCustomerForDetails.creditLimit?.toFixed(2) || 'N/A'}
                      </div>
                      <div className="flex items-center col-span-1 sm:col-span-2">
                        <Clock3 className="mr-2 h-4 w-4 text-muted-foreground" />
                        <strong>Invoice Aging:</strong>&nbsp;{selectedCustomerForDetails.invoiceAgingDays || 'N/A'} days
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

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
                  <div className="rounded-md border bg-card overflow-hidden max-h-60"> 
                    <div className="overflow-y-auto h-full">
                      <Table>
                        <TableHeader className="sticky top-0 bg-muted z-10">
                          <TableRow>
                            <TableHead className="min-w-[120px]">Invoice ID</TableHead>
                            <TableHead className="min-w-[120px]">Issue Date</TableHead>
                            <TableHead className="min-w-[120px]">Due Date</TableHead>
                            <TableHead className="min-w-[100px]">Total</TableHead>
                            <TableHead className="min-w-[100px]">Status</TableHead>
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
           <DialogFooter className="p-6 pt-4 border-t flex flex-col sm:flex-row justify-end gap-2">
                <Button 
                  onClick={() => handleAddNewInvoiceForCustomer(selectedCustomerForDetails)} 
                  variant="default" 
                  disabled={!selectedCustomerForDetails}
                  className="w-full sm:w-auto"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Invoice for Customer
                </Button>
                <Button variant="outline" onClick={closeCustomerDetailsModal} className="w-full sm:w-auto">Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
