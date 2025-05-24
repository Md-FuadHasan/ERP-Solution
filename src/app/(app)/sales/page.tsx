
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShoppingCart, Eye, Edit, Trash2, CheckCircle, XCircle, ChevronsUpDown, ArrowUp, ArrowDown, Filter as FilterIcon, CalendarIcon } from 'lucide-react';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc,
  AlertDialogFooter as AlertDialogFooterComponent,
  AlertDialogHeader as AlertDialogHeaderComponent,
  AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useData } from '@/context/DataContext';
import type { SalesOrder, SalesOrderStatus, Customer, Product, SalesOrderItem, Warehouse, ProductUnitType } from '@/types';
import { ALL_SALES_ORDER_STATUSES } from '@/types';
import { SalesOrderForm, type SalesOrderFormValues } from '@/components/forms/sales-order-form';
import { useToast } from '@/hooks/use-toast';
import { format, isValid, parseISO, isWithinInterval, startOfDay } from 'date-fns';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import { SearchInput } from '@/components/common/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const getSalesOrderStatusBadgeVariant = (status?: SalesOrderStatus): VariantProps<typeof badgeVariants>['variant'] => {
  if (!status) return 'outline';
  switch (status) {
    case 'Draft': return 'poDraft';
    case 'Confirmed': return 'default'; // Using default for a neutral "confirmed"
    case 'Processing': return 'secondary';
    case 'Ready for Dispatch': return 'outline'; // Could be a specific color
    case 'Dispatched': return 'poSent';
    case 'Partially Invoiced': return 'statusPartiallyPaid';
    case 'Fully Invoiced': return 'statusPaid';
    case 'Cancelled': return 'poCancelled';
    default: return 'outline';
  }
};

type SortableSalesOrderKeys = keyof Pick<SalesOrder, 'id' | 'orderDate' | 'status' | 'totalAmount'> | 'customerName' | 'salespersonName' | 'routeName';

interface SortConfig {
  key: SortableSalesOrderKeys | null;
  direction: 'ascending' | 'descending';
}

interface DateRange {
  from: Date | null;
  to: Date | null;
}

export default function SalesPage() {
  const {
    salesOrders,
    addSalesOrder,
    updateSalesOrder,
    deleteSalesOrder,
    getSalesOrderById,
    getCustomerById,
    getProductById,
    getTotalStockForProduct,
    getStockForProductInWarehouse,
    warehouses,
    products,
    customers, // Added customers here
    isLoading
  } = useData();
  const { toast } = useToast();

  const [isSalesOrderFormModalOpen, setIsSalesOrderFormModalOpen] = useState(false);
  const [editingSalesOrder, setEditingSalesOrder] = useState<SalesOrder | null>(null);
  const [salesOrderToView, setSalesOrderToView] = useState<SalesOrder | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [salesOrderToDelete, setSalesOrderToDelete] = useState<SalesOrder | null>(null);
  const [salesOrderToCancel, setSalesOrderToCancel] = useState<SalesOrder | null>(null);
  const [isCancelConfirmModalOpen, setIsCancelConfirmModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'orderDate', direction: 'descending' });
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });


  const handleAddSalesOrder = () => {
    setEditingSalesOrder(null);
    setIsSalesOrderFormModalOpen(true);
  };

  const handleEditSalesOrder = (so: SalesOrder) => {
    setEditingSalesOrder(so);
    setIsSalesOrderFormModalOpen(true);
  };

  const handleViewSalesOrder = (so: SalesOrder) => {
    setSalesOrderToView(so);
    setIsViewModalOpen(true);
  };

  const handleDeleteSalesOrderConfirm = (so: SalesOrder) => {
    setSalesOrderToDelete(so);
  };

  const confirmDeleteSalesOrder = () => {
    if (salesOrderToDelete) {
      deleteSalesOrder(salesOrderToDelete.id);
      toast({ title: "Sales Order Deleted", description: `Sales Order ${salesOrderToDelete.id} has been removed.` });
      setSalesOrderToDelete(null);
    }
  };

  const handleConfirmOrder = useCallback((order: SalesOrder) => {
    if (order.status === 'Draft') {
      updateSalesOrder({ ...order, status: 'Confirmed' });
      toast({ title: "Sales Order Confirmed", description: `Order ${order.id} status updated to Confirmed.`});
      if(isViewModalOpen && salesOrderToView?.id === order.id) {
        setSalesOrderToView({...order, status: 'Confirmed'});
      }
    }
  }, [updateSalesOrder, toast, isViewModalOpen, salesOrderToView]);

  const handleCancelOrderConfirm = useCallback((order: SalesOrder) => {
    setSalesOrderToCancel(order);
    setIsCancelConfirmModalOpen(true);
  }, []);

  const confirmCancelSalesOrder = useCallback(() => {
    if (salesOrderToCancel) {
      updateSalesOrder({ ...salesOrderToCancel, status: 'Cancelled' });
      toast({ title: "Sales Order Cancelled", description: `Order ${salesOrderToCancel.id} has been cancelled.`});
      if(isViewModalOpen && salesOrderToView?.id === salesOrderToCancel.id) {
         setSalesOrderToView({...salesOrderToCancel, status: 'Cancelled'});
      }
      setSalesOrderToCancel(null);
    }
    setIsCancelConfirmModalOpen(false);
  }, [salesOrderToCancel, updateSalesOrder, toast, isViewModalOpen, salesOrderToView]);

  const handleSubmitSalesOrder = (data: SalesOrderFormValues) => {
    const customer = getCustomerById(data.customerId);
    const itemsWithDetailsAndTotals = data.items.map(item => {
        const productDetails = getProductById(item.productId);
        // Price is already (base + excise) based on selected unit from form logic
        const unitPrice = item.unitPrice; 
        return {
            ...item,
            id: item.id || `so-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            productName: productDetails?.name || item.productId,
            total: (Number(item.quantity) || 0) * unitPrice,
            // sourceWarehouseId should be coming from the form data directly
        };
    });

    const subtotal = itemsWithDetailsAndTotals.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = subtotal; // Sales Order total is pre-invoice VAT

    if (editingSalesOrder) {
      const updatedSO: SalesOrder = {
        ...editingSalesOrder,
        customerId: data.customerId,
        customerName: customer?.name || data.customerId,
        salespersonId: data.salespersonId,
        salespersonName: data.salespersonId ? `Salesperson ${data.salespersonId}` : undefined, // Placeholder
        routeId: data.routeId,
        routeName: data.routeId ? `Route ${data.routeId}` : undefined, // Placeholder
        orderDate: data.orderDate.toISOString(),
        expectedDeliveryDate: data.expectedDeliveryDate ? data.expectedDeliveryDate.toISOString() : undefined,
        items: itemsWithDetailsAndTotals,
        subtotal,
        totalAmount,
        notes: data.notes,
        shippingAddress: editingSalesOrder.shippingAddress || customer?.shippingAddress || customer?.billingAddress,
        billingAddress: editingSalesOrder.billingAddress || customer?.billingAddress,
        // status is preserved during edit unless specifically changed by another action
      };
      updateSalesOrder(updatedSO);
      toast({ title: "Sales Order Updated", description: `Sales Order ${editingSalesOrder.id} updated.` });
    } else {
      const salesOrderDataForContext = {
        customerId: data.customerId,
        salespersonId: data.salespersonId,
        routeId: data.routeId,
        orderDate: data.orderDate.toISOString(),
        expectedDeliveryDate: data.expectedDeliveryDate ? data.expectedDeliveryDate.toISOString() : undefined,
        items: itemsWithDetailsAndTotals, // items now include sourceWarehouseId from the form
        notes: data.notes,
        shippingAddress: customer?.shippingAddress || customer?.billingAddress,
        billingAddress: customer?.billingAddress,
      };
      addSalesOrder(salesOrderDataForContext as any); // Cast to bypass strict type checks for fields generated by addSalesOrder
      toast({ title: "Sales Order Created", description: "New sales order has been created." });
    }
    setIsSalesOrderFormModalOpen(false);
    setEditingSalesOrder(null);
  };

  const salesOrderForViewModal = useMemo(() => {
    if (!salesOrderToView) return null;
    const customer = getCustomerById(salesOrderToView.customerId);
    const items = salesOrderToView.items.map(item => {
      const product = getProductById(item.productId);
      const warehouse = item.sourceWarehouseId ? warehouses.find(w => w.id === item.sourceWarehouseId) : null;
      return {
        ...item,
        productName: product?.name || item.productId,
        sourceWarehouseName: warehouse?.name || item.sourceWarehouseId || 'N/A',
      };
    });
    return { ...salesOrderToView, customerName: customer?.name, items };
  }, [salesOrderToView, getCustomerById, getProductById, warehouses]);

  const handleSort = useCallback((key: SortableSalesOrderKeys) => {
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

  const filteredSalesOrders = useMemo(() => {
    let _salesOrders = [...salesOrders];

    if (searchTerm) {
      _salesOrders = _salesOrders.filter(so =>
        so.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (so.customerName && so.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (so.salespersonName && so.salespersonName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (so.routeName && so.routeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (getCustomerById(so.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      _salesOrders = _salesOrders.filter(so => so.status === statusFilter);
    }

    if (dateRange.from || dateRange.to) {
      _salesOrders = _salesOrders.filter(so => {
        const orderDate = parseISO(so.orderDate);
        if (!isValid(orderDate)) return false;
        const fromDate = dateRange.from ? startOfDay(dateRange.from) : null;
        const toDate = dateRange.to ? startOfDay(dateRange.to) : null;
        if (fromDate && toDate) return isWithinInterval(orderDate, { start: fromDate, end: toDate });
        if (fromDate) return orderDate >= fromDate;
        if (toDate) return orderDate <= toDate;
        return true;
      });
    }

    if (sortConfig.key) {
      _salesOrders.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'customerName') {
          aValue = a.customerName || getCustomerById(a.customerId)?.name || '';
          bValue = b.customerName || getCustomerById(b.customerId)?.name || '';
        } else if (sortConfig.key === 'orderDate') {
            aValue = new Date(a.orderDate).getTime();
            bValue = new Date(b.orderDate).getTime();
        } else {
            aValue = a[sortConfig.key as keyof SalesOrder];
            bValue = b[sortConfig.key as keyof SalesOrder];
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return _salesOrders;
  }, [salesOrders, searchTerm, statusFilter, dateRange, sortConfig, getCustomerById]);

  const renderSortIcon = (columnKey: SortableSalesOrderKeys) => {
    if (sortConfig.key !== columnKey) return <ChevronsUpDown className="ml-2 h-3 w-3" />;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Sales Orders"
          description="Manage sales orders, track customer requests, and streamline fulfillment."
          actions={
            <Button onClick={handleAddSalesOrder} className="w-full sm:w-auto" disabled={isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Sales Order
            </Button>
          }
        />
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search SO by ID, Customer..."
            className="w-full sm:w-auto md:w-64 lg:flex-none"
          />
          <div className="relative w-full sm:w-auto md:w-[200px] lg:flex-none">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as SalesOrderStatus | 'all')}
            >
              <SelectTrigger className="w-full pl-10">
                <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ALL_SALES_ORDER_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto justify-start text-left font-normal lg:flex-none"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "PPP") : <span>Order Date From</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateRange.from || undefined} onSelect={(date) => handleDateChange('from', date)} initialFocus />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto justify-start text-left font-normal lg:flex-none"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, "PPP") : <span>Order Date To</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateRange.to || undefined} onSelect={(date) => handleDateChange('to', date)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 lg:mt-8 mb-4 md:mb-6 lg:mb-8">
        <CardHeader className="border-b">
          <CardTitle>Sales Order List</CardTitle>
          <CardDescription>Overview of all sales orders.</CardDescription>
        </CardHeader>
        <div className="h-full overflow-y-auto">
          {isLoading ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2 text-sm">Order ID</TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm">Customer</TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm">Order Date</TableHead>
                  <TableHead className="min-w-[120px] px-2 text-sm">Salesperson</TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm">Route</TableHead>
                  <TableHead className="text-right min-w-[90px] px-2 text-sm">Total</TableHead>
                  <TableHead className="min-w-[110px] px-2 text-sm">Status</TableHead>
                  <TableHead className="text-right min-w-[200px] px-2 text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(7)].map((_, i) => (
                  <TableRow key={`skel-so-${i}`} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50')}>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2 text-xs"><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredSalesOrders.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('id')}>
                     <div className="flex items-center">Order ID {renderSortIcon('id')}</div>
                  </TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('customerName')}>
                    <div className="flex items-center">Customer {renderSortIcon('customerName')}</div>
                  </TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('orderDate')}>
                    <div className="flex items-center">Order Date {renderSortIcon('orderDate')}</div>
                  </TableHead>
                  <TableHead className="min-w-[120px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('salespersonName')}>
                    <div className="flex items-center">Salesperson {renderSortIcon('salespersonName')}</div>
                  </TableHead>
                  <TableHead className="min-w-[100px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('routeName')}>
                     <div className="flex items-center">Route {renderSortIcon('routeName')}</div>
                  </TableHead>
                  <TableHead className="text-right min-w-[90px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('totalAmount')}>
                    <div className="flex items-center justify-end">Total {renderSortIcon('totalAmount')}</div>
                  </TableHead>
                  <TableHead className="min-w-[110px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('status')}>
                    <div className="flex items-center">Status {renderSortIcon('status')}</div>
                  </TableHead>
                  <TableHead className="text-right min-w-[200px] px-2 text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalesOrders.map((so, index) => (
                  <TableRow key={so.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell className="font-medium px-2 text-xs">{so.id}</TableCell>
                    <TableCell className="px-2 text-xs">{so.customerName || getCustomerById(so.customerId)?.name || so.customerId}</TableCell>
                    <TableCell className="px-2 text-xs">{format(new Date(so.orderDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="px-2 text-xs">{so.salespersonName || so.salespersonId || '-'}</TableCell>
                    <TableCell className="px-2 text-xs">{so.routeName || so.routeId || '-'}</TableCell>
                    <TableCell className="text-right px-2 text-xs">${so.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="px-2 text-xs"><Badge variant={getSalesOrderStatusBadgeVariant(so.status)}>{so.status}</Badge></TableCell>
                    <TableCell className="text-right px-2 text-xs">
                      <div className="flex justify-end items-center gap-1">
                        {so.status === 'Draft' && (
                           <Button variant="ghost" size="icon" onClick={() => handleConfirmOrder(so)} className="hover:text-green-600" title="Confirm Order"><CheckCircle className="h-4 w-4" /></Button>
                        )}
                        {(so.status === 'Draft' || so.status === 'Confirmed') && (
                            <Button variant="ghost" size="icon" onClick={() => handleCancelOrderConfirm(so)} className="hover:text-orange-500" title="Cancel Order"><XCircle className="h-4 w-4" /></Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleViewSalesOrder(so)} className="hover:text-primary" title="View Sales Order"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditSalesOrder(so)} className="hover:text-primary" title="Edit Sales Order" disabled={so.status !== 'Draft'}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSalesOrderConfirm(so)} className="hover:text-destructive" title="Delete Sales Order"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <DataPlaceholder
                icon={ShoppingCart}
                title="No Sales Orders Found"
                message={searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to ? "Try adjusting your search or filter criteria." : "Start by creating your first sales order."}
                action={!searchTerm && statusFilter === 'all' && !dateRange.from && !dateRange.to ? (
                  <Button onClick={handleAddSalesOrder} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0"><PlusCircle className="mr-2 h-4 w-4" /> Create New Sales Order</Button>
                ) : undefined}
              />
            </div>
          )}
        </div>
      </div>

      <Dialog open={isSalesOrderFormModalOpen} onOpenChange={(isOpen) => { setIsSalesOrderFormModalOpen(isOpen); if (!isOpen) setEditingSalesOrder(null); }}>
        <DialogContent className="w-[95vw] max-w-3xl lg:max-w-4xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingSalesOrder ? `Edit Sales Order: ${editingSalesOrder.id}` : 'Create New Sales Order'}</DialogTitle>
            <DialogDescription>
              {editingSalesOrder ? 'Update the details for this sales order.' : 'Fill in the details to create a new sales order.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
            {isSalesOrderFormModalOpen && (
              <SalesOrderForm
                initialData={editingSalesOrder}
                onSubmit={handleSubmitSalesOrder}
                onCancel={() => { setIsSalesOrderFormModalOpen(false); setEditingSalesOrder(null); }}
                isSubmitting={isLoading}
                customers={customers}
                products={products}
                warehouses={warehouses}
                getTotalStockForProduct={getTotalStockForProduct} 
                getStockForProductInWarehouse={getStockForProductInWarehouse}
                getProductById={getProductById}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="w-[95vw] max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Sales Order Details: {salesOrderForViewModal?.id}</DialogTitle>
            <DialogDescription>
              Viewing details for sales order for {salesOrderForViewModal?.customerName}.
            </DialogDescription>
          </DialogHeader>
          {salesOrderForViewModal && (
            <div className="flex-grow overflow-y-auto p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <div><strong>Order ID:</strong> {salesOrderForViewModal.id}</div>
                <div><strong>Customer:</strong> {salesOrderForViewModal.customerName || salesOrderForViewModal.customerId}</div>
                <div><strong>Order Date:</strong> {format(new Date(salesOrderForViewModal.orderDate), 'PPP')}</div>
                <div><strong>Exp. Delivery:</strong> {salesOrderForViewModal.expectedDeliveryDate ? format(new Date(salesOrderForViewModal.expectedDeliveryDate), 'PPP') : 'N/A'}</div>
                <div><strong>Salesperson:</strong> {salesOrderForViewModal.salespersonName || salesOrderForViewModal.salespersonId || '-'}</div>
                <div><strong>Route:</strong> {salesOrderForViewModal.routeName || salesOrderForViewModal.routeId || '-'}</div>
                <div className="md:col-span-2"><strong>Status:</strong> <Badge variant={getSalesOrderStatusBadgeVariant(salesOrderForViewModal.status)}>{salesOrderForViewModal.status}</Badge></div>
              </div>
              {salesOrderForViewModal.shippingAddress && <p><strong>Shipping Address:</strong> {salesOrderForViewModal.shippingAddress}</p>}
              {salesOrderForViewModal.billingAddress && <p><strong>Billing Address:</strong> {salesOrderForViewModal.billingAddress}</p>}
              {salesOrderForViewModal.notes && (
                <div>
                  <h4 className="font-semibold mb-1">Notes:</h4>
                  <p className="p-3 bg-muted rounded-md whitespace-pre-line">{salesOrderForViewModal.notes}</p>
                </div>
              )}
              <div>
                <h4 className="font-semibold mb-1">Items:</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="px-3 py-2">Product</TableHead>
                        <TableHead className="px-3 py-2">Source Warehouse</TableHead>
                        <TableHead className="text-center px-3 py-2">Qty</TableHead>
                        <TableHead className="px-3 py-2">Unit</TableHead>
                        <TableHead className="text-right px-3 py-2">Unit Price</TableHead>
                        <TableHead className="text-right px-3 py-2">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesOrderForViewModal.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="px-3 py-2">{item.productName}</TableCell>
                          <TableCell className="px-3 py-2">{item.sourceWarehouseName}</TableCell>
                          <TableCell className="text-center px-3 py-2">{item.quantity}</TableCell>
                          <TableCell className="px-3 py-2">{item.unitType}</TableCell>
                          <TableCell className="text-right px-3 py-2">${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right px-3 py-2">${item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-1 text-right">
                <div className="flex justify-end gap-2"><span>Subtotal (Base Price + Excise):</span> <span className="font-medium">${salesOrderForViewModal.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-end gap-2 text-lg font-semibold"><span>Order Total (Pre-VAT):</span> <span>${salesOrderForViewModal.totalAmount.toFixed(2)}</span></div>
              </div>
            </div>
          )}
          <DialogFooter className="p-6 pt-4 border-t flex-col sm:flex-row sm:justify-end gap-2">
             {salesOrderForViewModal?.status === 'Draft' && (
                <Button
                    variant="default"
                    onClick={() => { if(salesOrderToView) { handleConfirmOrder(salesOrderToView);}}}
                    className="w-full sm:w-auto"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Confirm Order
                </Button>
            )}
            {(salesOrderForViewModal?.status === 'Draft' || salesOrderForViewModal?.status === 'Confirmed') && (
                <Button
                    variant="destructive"
                    onClick={() => { if(salesOrderToView) { handleCancelOrderConfirm(salesOrderToView); }}}
                    className="w-full sm:w-auto"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                </Button>
            )}
            {salesOrderForViewModal?.status === 'Draft' && (
              <Button variant="outline" onClick={() => { if (salesOrderToView) { setIsViewModalOpen(false); setTimeout(() => handleEditSalesOrder(salesOrderToView), 100); } }} className="w-full sm:w-auto">
                <Edit className="mr-2 h-4 w-4" /> Edit Order
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       <AlertDialog open={!!salesOrderToDelete} onOpenChange={(isOpen) => !isOpen && setSalesOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent>Are you sure?</AlertDialogTitleComponent>
            <AlertDialogDesc>
              This action cannot be undone. This will permanently delete Sales Order "{salesOrderToDelete?.id}".
            </AlertDialogDesc>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancel onClick={() => setSalesOrderToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSalesOrder} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooterComponent>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isCancelConfirmModalOpen} onOpenChange={setIsCancelConfirmModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent>Confirm Cancellation</AlertDialogTitleComponent>
            <AlertDialogDesc>
              Are you sure you want to cancel Sales Order "{salesOrderToCancel?.id}"? This action cannot be undone and will set its status to 'Cancelled'.
            </AlertDialogDesc>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancel onClick={() => { setIsCancelConfirmModalOpen(false); setSalesOrderToCancel(null); }}>Keep Order</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelSalesOrder} className="bg-destructive hover:bg-destructive/90">Cancel Order</AlertDialogAction>
          </AlertDialogFooterComponent>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

