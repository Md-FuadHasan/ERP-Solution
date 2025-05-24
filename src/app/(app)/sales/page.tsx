'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShoppingCart, Eye, Edit, Trash2, CheckCircle, XCircle, ChevronsUpDown, ArrowUp, ArrowDown, Filter as FilterIcon, CalendarIcon, DollarSign, ListFilter, Hourglass, ExternalLink } from 'lucide-react';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Separator } from '@/components/ui/separator';
import { useData } from '@/context/DataContext';
import type { SalesOrder, SalesOrderStatus, SalesOrderItem, Customer, Product, Warehouse, ProductUnitType } from '@/types';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';


export default function SalesManagementDashboardPage() {
  const {
    salesOrders,
    addSalesOrder,
    customers,
    products,
    warehouses,
    getTotalStockForProduct,
    getProductById,
    isLoading
  } = useData();
  const { toast } = useToast();
  const router = useRouter();

  const [isSalesOrderFormModalOpen, setIsSalesOrderFormModalOpen] = useState(false);
  const [editingSalesOrder, setEditingSalesOrder] = useState<SalesOrder | null>(null);

  const handleAddSalesOrder = useCallback(() => {
    setEditingSalesOrder(null);
    setIsSalesOrderFormModalOpen(true);
  }, []);

  const handleSubmitSalesOrder = (data: SalesOrderFormValues) => {
    // Editing logic will be primarily on the dedicated sales-orders page
    // This dashboard's modal will only handle new SO creation
    addSalesOrder(data);
    toast({ title: "Sales Order Created", description: "New sales order has been created." });
    setIsSalesOrderFormModalOpen(false);
    setEditingSalesOrder(null);
  };

  // Placeholder KPI data - Replace with actual calculations from salesOrders later
   const kpiData = useMemo(() => {
    const totalSalesThisMonth = salesOrders
      .filter(so => {
        const orderDate = parseISO(so.orderDate);
        const today = new Date();
        return orderDate.getFullYear() === today.getFullYear() && orderDate.getMonth() === today.getMonth();
      })
      .reduce((sum, so) => sum + so.totalAmount, 0);

    const newOrdersTodayCount = salesOrders.filter(so => format(parseISO(so.orderDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length;
    
    const openOrdersCount = salesOrders.filter(so => ['Draft', 'Confirmed', 'Processing', 'Ready for Dispatch'].includes(so.status)).length;

    return {
      totalSalesMTD: totalSalesThisMonth,
      newOrdersToday: newOrdersTodayCount,
      openOrdersPending: openOrdersCount,
    };
  }, [salesOrders]);


  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Sales Management Dashboard"
          description="Overview of sales performance, key metrics, and links to sales operations."
          actions={
            <Button onClick={handleAddSalesOrder} className="w-full sm:w-auto" disabled={isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Sales Order
            </Button>
          }
        />
      </div>

      <div className="flex-grow overflow-y-auto p-4 md:p-6 lg:p-8">
        {/* KPI Section */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales (This Month)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-3/4 mb-1" /> : <div className="text-2xl font-bold mb-1">${kpiData.totalSalesMTD.toFixed(2)}</div> }
              {isLoading ? <Skeleton className="h-4 w-1/2" /> : <p className="text-xs text-muted-foreground">Based on confirmed sales orders.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Orders (Today)</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-1/2 mb-1" /> : <div className="text-2xl font-bold mb-1">{kpiData.newOrdersToday} Orders</div>}
              {isLoading ? <Skeleton className="h-4 w-1/2" /> : <p className="text-xs text-muted-foreground">Number of sales orders created today.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Orders</CardTitle>
              <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-1/2 mb-1" /> : <div className="text-2xl font-bold mb-1">{kpiData.openOrdersPending} Orders</div>}
              {isLoading ? <Skeleton className="h-4 w-1/2" /> : <p className="text-xs text-muted-foreground">Orders not yet fully invoiced or cancelled.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Sales Operations</CardTitle>
                    <CardDescription>Manage sales orders, customers, and products.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/sales-orders">
                            <ShoppingCart className="mr-2 h-4 w-4 text-primary" /> Manage All Sales Orders
                            <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/customers">
                            <Users className="mr-2 h-4 w-4 text-primary" /> Manage Customers
                            <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/products">
                            <Package className="mr-2 h-4 w-4 text-primary" /> Manage Products
                             <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
            <Card>
              <CardHeader>
                  <CardTitle>Sales Analytics (Coming Soon)</CardTitle>
                  <CardDescription>Detailed reports on sales performance and trends.</CardDescription>
              </CardHeader>
              <CardContent>
                  <DataPlaceholder
                    icon={BarChart3}
                    title="Advanced Analytics Under Development"
                    message="This section will provide deep insights into sales data, salesperson performance, and regional trends."
                  />
              </CardContent>
            </Card>
        </div>
      </div>

      {/* Modal for Creating New Sales Order (triggered from dashboard header) */}
      <Dialog open={isSalesOrderFormModalOpen} onOpenChange={(isOpen) => { setIsSalesOrderFormModalOpen(isOpen); if (!isOpen) setEditingSalesOrder(null); }}>
        <DialogContent className="w-[95vw] max-w-3xl lg:max-w-4xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Create New Sales Order</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new sales order.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
            {isSalesOrderFormModalOpen && ( // Conditionally render to reset form state
              <SalesOrderForm
                initialData={null} // Always null for new SO from dashboard
                onSubmit={handleSubmitSalesOrder}
                onCancel={() => { setIsSalesOrderFormModalOpen(false); setEditingSalesOrder(null); }}
                isSubmitting={isLoading}
                customers={customers}
                products={products}
                warehouses={warehouses}
                getTotalStockForProduct={getTotalStockForProduct} 
                getStockForProductInWarehouse={() => 0} // Placeholder for now, main form logic on sales-orders page
                getProductById={getProductById}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
