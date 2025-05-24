
'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, ReceiptText, DollarSign, Coins, Scale, Briefcase, Clock3, CircleDollarSign, Eye, ChevronsUpDown, ArrowUp, ArrowDown, Filter as FilterIcon, ArrowLeft } from 'lucide-react';
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
  AlertDialogFooter as AlertDialogFooterComponent,
  AlertDialogHeader as AlertDialogHeaderComponent,
  AlertDialogTitle as AlertDialogTitleComponent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeVariant } from '@/lib/invoiceUtils';
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CUSTOMER_TYPES } from '@/types';

type SortableCustomerKeys = keyof Pick<Customer, 'id' | 'name' | 'registrationNumber' | 'vatNumber' | 'phone' | 'customerType'> | 'outstandingBalance';

interface SortConfig {
  key: SortableCustomerKeys | null;
  direction: 'ascending' | 'descending';
}

export default function CustomersPage() {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    isLoading,
    getInvoicesByCustomerId,
    getOutstandingBalanceByCustomerId
  } = useData();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
  const [customerTypeFilter, setCustomerTypeFilter] = useState<CustomerType | 'all'>('all');

  const { toast } = useToast();

  const filteredCustomers = useMemo(() => {
    let _customers = [...customers];

    if (searchTerm) {
      _customers = _customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          customer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (customer.registrationNumber && customer.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (customer.vatNumber && customer.vatNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (customerTypeFilter !== 'all') {
      _customers = _customers.filter(customer => customer.customerType === customerTypeFilter);
    }

    if (sortConfig.key) {
      _customers.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'outstandingBalance') {
          aValue = getOutstandingBalanceByCustomerId(a.id);
          bValue = getOutstandingBalanceByCustomerId(b.id);
        } else {
          aValue = a[sortConfig.key as keyof Customer];
          bValue = b[sortConfig.key as keyof Customer];
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          // Numeric sort
        } else {
          // Fallback for mixed types or undefined - treat undefined as lowest
          if (aValue === undefined || aValue === null) aValue = sortConfig.direction === 'ascending' ? -Infinity : Infinity;
          if (bValue === undefined || bValue === null) bValue = sortConfig.direction === 'ascending' ? -Infinity : Infinity;
        }


        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return _customers;
  }, [customers, searchTerm, customerTypeFilter, sortConfig, getOutstandingBalanceByCustomerId]);

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
    const remainingBalance = getOutstandingBalanceByCustomerId(selectedCustomerForDetails.id);
    return {
      totalInvoices: invoices.length,
      totalPurchased,
      totalPaid,
      remainingBalance
    };
  }, [selectedCustomerForDetails, getInvoicesByCustomerId, getOutstandingBalanceByCustomerId]);


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
        registrationNumber: data.registrationNumber || undefined,
        vatNumber: data.vatNumber || undefined,
        shippingAddress: data.shippingAddress || undefined,
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
        registrationNumber: data.registrationNumber || undefined,
        vatNumber: data.vatNumber || undefined,
        shippingAddress: data.shippingAddress || undefined,
        creditLimit: data.customerType === 'Credit' ? data.creditLimit : undefined,
        invoiceAgingDays: data.customerType === 'Credit' ? data.invoiceAgingDays : undefined,
      };
      addCustomer(newCustomer);
      toast({ title: "Customer Added", description: `${data.name} has been successfully added.` });
    }
    setIsFormModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSort = useCallback((key: SortableCustomerKeys) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key && prevConfig.direction === 'ascending') {
        return { key, direction: 'descending' };
      }
      return { key, direction: 'ascending' };
    });
  }, []);

  const renderSortIcon = (columnKey: SortableCustomerKeys) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="ml-2 h-3 w-3" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />;
  };


  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Customers"
          description="Manage your customer profiles and contact information."
          actions={
            <Button onClick={handleAddCustomer} className="w-full sm:w-auto" disabled={isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
            </Button>
          }
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4"> {/* Group for left-aligned filters */}
                <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by name, ID, CR, VAT..."
                    className="w-full md:w-64 lg:flex-none"
                />
                <div className="relative w-full md:w-[200px] lg:flex-none">
                    <Select
                    value={customerTypeFilter}
                    onValueChange={(value) => setCustomerTypeFilter(value as CustomerType | 'all')}
                    >
                    <SelectTrigger className="w-full pl-10">
                        <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Filter by type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {CUSTOMER_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                            {type}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
        </div>
      </div>

      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 mb-4 md:mb-6 lg:mb-8">
         <CardHeader className="border-b">
            <CardTitle>Customer List</CardTitle>
            <CardDescription>Overview of all customers.</CardDescription>
        </CardHeader>
         <div className="h-full overflow-y-auto">
          {isLoading ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[80px] px-2 text-sm font-semibold">Cust. ID</TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm font-semibold">Name</TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm font-semibold">CR No.</TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm font-semibold">VAT No.</TableHead>
                  <TableHead className="min-w-[120px] px-2 text-sm font-semibold">Phone</TableHead>
                  <TableHead className="min-w-[80px] px-2 text-sm font-semibold">Type</TableHead>
                  <TableHead className="min-w-[130px] text-right px-2 text-sm font-semibold">Outstanding</TableHead>
                  <TableHead className="text-center min-w-[100px] px-2 text-sm font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(7)].map((_, i) => (
                  <TableRow key={i} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell className="text-right px-2 text-xs"><Skeleton className="h-5 w-3/4 ml-auto" /></TableCell>
                    <TableCell className="text-center px-2 text-xs"><Skeleton className="h-8 w-28 mx-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredCustomers.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[80px] px-2 text-sm font-semibold cursor-pointer hover:bg-primary/80" onClick={() => handleSort('id')}>
                     <div className="flex items-center">ID {renderSortIcon('id')}</div>
                  </TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm font-semibold cursor-pointer hover:bg-primary/80" onClick={() => handleSort('name')}>
                     <div className="flex items-center">Name {renderSortIcon('name')}</div>
                  </TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm font-semibold cursor-pointer hover:bg-primary/80" onClick={() => handleSort('registrationNumber')}>
                     <div className="flex items-center">CR No. {renderSortIcon('registrationNumber')}</div>
                  </TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm font-semibold cursor-pointer hover:bg-primary/80" onClick={() => handleSort('vatNumber')}>
                     <div className="flex items-center">VAT No. {renderSortIcon('vatNumber')}</div>
                  </TableHead>
                  <TableHead className="min-w-[120px] px-2 text-sm font-semibold cursor-pointer hover:bg-primary/80" onClick={() => handleSort('phone')}>
                     <div className="flex items-center">Phone {renderSortIcon('phone')}</div>
                  </TableHead>
                  <TableHead className="min-w-[80px] px-2 text-sm font-semibold cursor-pointer hover:bg-primary/80" onClick={() => handleSort('customerType')}>
                     <div className="flex items-center">Type {renderSortIcon('customerType')}</div>
                  </TableHead>
                  <TableHead className="min-w-[130px] text-right px-2 text-sm font-semibold cursor-pointer hover:bg-primary/80" onClick={() => handleSort('outstandingBalance')}>
                     <div className="flex items-center justify-end">Outstanding {renderSortIcon('outstandingBalance')}</div>
                  </TableHead>
                  <TableHead className="text-center min-w-[100px] px-2 text-sm font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer, index) => {
                  const outstandingBalance = getOutstandingBalanceByCustomerId(customer.id);
                  return (
                    <TableRow key={customer.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                      <TableCell className="font-medium px-2 text-xs">{customer.id}</TableCell>
                      <TableCell
                        className="cursor-pointer hover:text-primary hover:underline px-2 text-xs"
                        onClick={() => handleViewCustomerDetails(customer)}
                      >
                        {customer.name}
                      </TableCell>
                      <TableCell className="px-2 text-xs">{customer.registrationNumber || '-'}</TableCell>
                      <TableCell className="px-2 text-xs">{customer.vatNumber || '-'}</TableCell>
                      <TableCell className="px-2 text-xs">{customer.phone}</TableCell>
                      <TableCell className="px-2 text-xs">
                        <Badge
                          variant={customer.customerType === 'Credit' ? 'creditCustomer' : 'cashCustomer'}
                          className="text-xs"
                        >
                          {customer.customerType}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-semibold px-2 text-xs",
                        outstandingBalance > 0 ? "text-destructive" : "text-foreground"
                      )}>
                        ${outstandingBalance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center px-2 text-xs">
                        <div className="flex justify-center items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleViewCustomerDetails(customer)} className="hover:text-primary p-1.5" title="View Customer">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditCustomer(customer)} className="hover:text-primary p-1.5" title="Edit Customer">
                            <Edit className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" className="hover:text-destructive p-1.5" title="Delete Customer" onClick={(e) => { e.stopPropagation(); handleDeleteCustomerConfirm(customer);}}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <DataPlaceholder
                title="No Customers Found"
                message={searchTerm || customerTypeFilter !== 'all' ? "Try adjusting your search or filter criteria." : "Get started by adding your first customer."}
                action={!searchTerm && customerTypeFilter === 'all' ? (
                  <Button onClick={handleAddCustomer} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
                  </Button>
                ) : undefined}
              />
            </div>
          )}
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

      {/* Customer Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={closeCustomerDetailsModal}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Customer Profile: {selectedCustomerForDetails?.name}</DialogTitle>
            <DialogDescription>
              Contact, financial overview, and invoice history for {selectedCustomerForDetails?.email}.
            </DialogDescription>
          </DialogHeader>
          {selectedCustomerForDetails && (
            <div className="space-y-6 flex-grow overflow-y-auto p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><strong>CR No:</strong> {selectedCustomerForDetails.registrationNumber || 'N/A'}</div>
                  <div><strong>VAT No:</strong> {selectedCustomerForDetails.vatNumber || 'N/A'}</div>
                  <div className="flex items-center">
                    <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                    <strong>Type:</strong>&nbsp;
                     <Badge
                        variant={selectedCustomerForDetails.customerType === 'Credit' ? 'creditCustomer' : 'cashCustomer'}
                        className="text-xs ml-1"
                      >
                        {selectedCustomerForDetails.customerType}
                      </Badge>
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
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">${customerAggregates.totalPaid.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Balance Due</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={cn("text-2xl font-bold", customerAggregates.remainingBalance > 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400')}>
                      ${customerAggregates.remainingBalance.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 text-foreground">Invoice History</h4>
                {customerInvoices.length > 0 ? (
                  <div className="rounded-md border bg-muted overflow-hidden max-h-60">
                    <div className="overflow-y-auto h-full"> 
                      <Table>
                        <TableHeader className="sticky top-0 bg-primary text-primary-foreground z-10">
                          <TableRow>
                            <TableHead className="min-w-[120px] px-2 text-sm font-semibold">Invoice ID</TableHead>
                            <TableHead className="min-w-[120px] px-2 text-sm font-semibold">Issue Date</TableHead>
                            <TableHead className="min-w-[120px] px-2 text-sm font-semibold">Due Date</TableHead>
                            <TableHead className="min-w-[100px] text-right px-2 text-sm font-semibold">Total</TableHead>
                            <TableHead className="min-w-[100px] px-2 text-sm font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerInvoices.map((invoice, index) => (
                            <TableRow key={invoice.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                              <TableCell className="font-medium px-2 text-xs">{invoice.id}</TableCell>
                              <TableCell className="px-2 text-xs">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</TableCell>
                              <TableCell className="px-2 text-xs">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                              <TableCell className="text-right px-2 text-xs">${invoice.totalAmount.toFixed(2)}</TableCell>
                              <TableCell className="px-2 text-xs">
                                <Badge variant={getStatusBadgeVariant(invoice.status)} className="text-xs">{invoice.status}</Badge>
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
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent>Are you sure?</AlertDialogTitleComponent>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer
              "{customerToDelete?.name}" and all associated data (including invoices).
            </AlertDialogDescription>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooterComponent>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    