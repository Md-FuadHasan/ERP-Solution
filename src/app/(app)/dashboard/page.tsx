
// src/app/(app)/dashboard/page.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Users, FileText, AlertTriangle, TrendingUp, PieChart as PieChartIcon, Zap, FileWarning, PlusCircle, UserPlus, BarChartHorizontalBig, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Customer, Invoice, ChartDataPoint, InvoiceStatus } from '@/types';
import { getStatusBadgeVariant } from '@/lib/invoiceUtils';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, isBefore, startOfDay } from 'date-fns';
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function DashboardPage() {
  const { invoices, customers, isLoading, getCustomerById } = useData();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  useEffect(() => {
    if (!isLoading) {
        setLastRefreshed(new Date());
    }
  }, [invoices, customers, isLoading]);


  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.remainingBalance, 0);
    const activeCustomers = new Set(invoices.map(inv => inv.customerId)).size;
    const overdueInvoicesCount = invoices.filter(inv => inv.status === 'Overdue').length;
    const totalCustomerCount = customers.length;

    return {
      totalRevenue,
      totalPaid,
      totalOutstanding,
      activeCustomers,
      totalInvoices: invoices.length,
      overdueInvoicesCount,
      totalCustomerCount,
    };
  }, [invoices, customers]);

  const invoiceStatusData: ChartDataPoint[] = useMemo(() => {
    const statusCounts = invoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {} as Record<InvoiceStatus, number>);
    return Object.entries(statusCounts).map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }));
  }, [invoices]);

  const hasValidPieData = useMemo(() => {
    if (!invoiceStatusData || invoiceStatusData.length === 0) return false;
    return invoiceStatusData.some(d => d.value > 0);
  }, [invoiceStatusData]);

  const monthlyFinancialData = useMemo(() => {
    const dataByMonth: Record<string, { totalRevenue: number; totalReceived: number; totalOutstanding: number }> = {};

    invoices.forEach(inv => {
      const month = format(new Date(inv.issueDate), 'MMM yy');
      if (!dataByMonth[month]) {
        dataByMonth[month] = { totalRevenue: 0, totalReceived: 0, totalOutstanding: 0 };
      }
      dataByMonth[month].totalRevenue += inv.totalAmount;
      dataByMonth[month].totalReceived += inv.amountPaid;
      dataByMonth[month].totalOutstanding += inv.remainingBalance;
    });

    return Object.entries(dataByMonth)
      .map(([name, { totalRevenue, totalReceived, totalOutstanding }]) => ({
        name,
        "Total Revenue": totalRevenue,
        "Total Received": totalReceived,
        "Total Outstanding": totalOutstanding,
      }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.name.split(' ');
        const [bMonth, bYear] = b.name.split(' ');
        const dateA = new Date(`${aMonth} 1, 20${aYear}`);
        const dateB = new Date(`${bMonth} 1, 20${bYear}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6); 
  }, [invoices]);

  const outstandingInvoicesData: (ChartDataPoint & { customerName?: string; dueDate?: string; status?: InvoiceStatus })[] = useMemo(() => {
     const filteredAndSorted = invoices
      .filter(inv => inv.remainingBalance > 0) 
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

     return filteredAndSorted.slice(0, 5) 
      .map(inv => ({
        name: inv.id,
        value: inv.remainingBalance,
        customerName: inv.customerName || getCustomerById(inv.customerId)?.name || 'N/A',
        dueDate: inv.dueDate,
        status: inv.status,
      }));
  }, [invoices, getCustomerById]);

  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
      .slice(0, 5);
  }, [invoices]);

  const topCustomers = useMemo(() => {
    const customerTotals: Record<string, { totalInvoiced: number; invoiceCount: number; name: string, id: string }> = {};
    invoices.forEach(invoice => {
      const customer = getCustomerById(invoice.customerId);
      if (customer) {
        if (!customerTotals[customer.id]) {
          customerTotals[customer.id] = { totalInvoiced: 0, invoiceCount: 0, name: customer.name, id: customer.id };
        }
        customerTotals[customer.id].totalInvoiced += invoice.totalAmount;
        customerTotals[customer.id].invoiceCount += 1;
      }
    });
    return Object.values(customerTotals)
      .sort((a, b) => b.totalInvoiced - a.totalInvoiced)
      .slice(0, 3);
  }, [invoices, customers, getCustomerById]);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0">
        <PageHeader 
          title="Dashboard" 
          description={`Overview of your invoicing activities. ${lastRefreshed ? `Last updated: ${format(lastRefreshed, "PPpp")}` : '' }`}
        />
      </div>
      <div className="flex-grow overflow-y-auto pb-6 pr-1"> 
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {[...Array(5)].map((_, i) => ( 
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-5 w-5" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-1/2 mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle>
                  <CardDescription><Skeleton className="h-4 w-full" /></CardDescription>
                </CardHeader>
                <CardContent className="pl-0 pr-1 sm:pl-2 sm:pr-3">
                  <Skeleton className="h-[300px] sm:h-[350px] w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
                  <CardDescription><Skeleton className="h-4 w-3/4" /></CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <Skeleton className="h-[300px] sm:h-[350px] w-full" />
                </CardContent>
              </Card>
            </div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-3/4" /></CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-2">
                <div className="max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                      <TableRow>
                        <TableHead className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-3/4" /></TableHead>
                        <TableHead className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-3/4" /></TableHead>
                        <TableHead className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-3/4" /></TableHead>
                        <TableHead className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-3/4" /></TableHead>
                        <TableHead className="text-right py-2 px-2 sm:px-4"><Skeleton className="h-5 w-1/2 ml-auto" /></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(3)].map((_, i) => (
                        <TableRow key={`toi-skel-${i}`}>
                          <TableCell className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-full" /></TableCell>
                          <TableCell className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-full" /></TableCell>
                          <TableCell className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-full" /></TableCell>
                          <TableCell className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-full" /></TableCell>
                          <TableCell className="text-right py-2 px-2 sm:px-4"><Skeleton className="h-5 w-full" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle></CardHeader>
                <CardContent className="p-0 sm:p-2">
                   <div className="max-h-72 overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                        <TableRow>
                          <TableHead className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-3/4" /></TableHead>
                          <TableHead className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-3/4" /></TableHead>
                          <TableHead className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-3/4" /></TableHead>
                          <TableHead className="text-right py-2 px-2 sm:px-4"><Skeleton className="h-5 w-1/2 ml-auto" /></TableHead>
                          <TableHead className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-3/4" /></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                      {[...Array(3)].map((_, i) => (
                        <TableRow key={`ri-skel-${i}`}>
                          <TableCell className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-full" /></TableCell>
                          <TableCell className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-full" /></TableCell>
                          <TableCell className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-full" /></TableCell>
                          <TableCell className="text-right py-2 px-2 sm:px-4"><Skeleton className="h-5 w-full" /></TableCell>
                          <TableCell className="py-2 px-2 sm:px-4"><Skeleton className="h-5 w-full" /></TableCell>
                        </TableRow>
                      ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle></CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={`tc-skel-${i}`} className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-[hsl(var(--primary))]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1 text-green-600" />
                    <span className="text-green-600 mr-1">+12.5%</span> vs last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                  <TrendingUp className="h-4 w-4 text-[hsl(var(--status-paid))]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">${stats.totalPaid.toFixed(2)}</div>
                   <p className="text-xs text-muted-foreground flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1 text-green-600" />
                    <span className="text-green-600 mr-1">+8.2%</span> vs last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stats.totalOutstanding > 0 ? 'text-orange-500 dark:text-orange-400' : ''}`}>
                      ${stats.totalOutstanding.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1 text-orange-500" /> 
                    <span className="text-orange-500 mr-1">+5.1%</span> vs last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
                  <FileWarning className="h-4 w-4 text-[hsl(var(--status-overdue))]" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stats.overdueInvoicesCount > 0 ? 'text-red-500 dark:text-red-400' : ''}`}>
                      {stats.overdueInvoicesCount}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <ArrowDown className="h-3 w-3 mr-1 text-red-500" />
                    <span className="text-red-500 mr-1">-2.0%</span> vs last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                  <Users className="h-4 w-4 text-[hsl(var(--primary))]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCustomerCount}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1 text-green-600" />
                    <span className="text-green-600 mr-1">+5</span> new this month
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Financial Overview (Last 6 Months)</CardTitle>
                  <CardDescription>Monthly breakdown of total revenue, received amount, and outstanding balance.</CardDescription>
                </CardHeader>
                <CardContent className="pl-0 pr-1 sm:pl-2 sm:pr-3">
                  <ChartContainer config={{
                        "Total Revenue": { label: "Revenue", color: "hsl(var(--chart-1))" },
                        "Total Received": { label: "Received", color: "hsl(var(--chart-2))" },
                        "Total Outstanding": { label: "Outstanding", color: "hsl(var(--chart-3))" },
                      }} className="h-[300px] sm:h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={monthlyFinancialData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize="10px" interval={0} />
                        <YAxis tickFormatter={(value) => `$${value/1000}k`} tickLine={false} axisLine={false} tickMargin={8} fontSize="10px" />
                        <RechartsTooltip
                          cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
                          content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar dataKey="Total Revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Total Revenue" />
                        <Bar dataKey="Total Received" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Total Received" />
                        <Bar dataKey="Total Outstanding" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Total Outstanding" />
                        <ChartLegend content={<ChartLegendContent nameKey="name" className="text-[10px] sm:text-xs"/>} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Invoice Statuses</CardTitle>
                  <CardDescription>Distribution of current invoice statuses.</CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  {hasValidPieData ? (
                    <ChartContainer 
                      config={invoiceStatusData.reduce((acc, cur) => ({...acc, [cur.name]: {label: cur.name, color: cur.fill}}), {})} 
                      className="h-[300px] sm:h-[350px] w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <RechartsTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                          <Pie 
                            data={invoiceStatusData} 
                            dataKey="value" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius="80%" 
                            labelLine={false} 
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.4; 
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              if (percent * 100 < 5) return null; 
                              return (
                                <text x={x} y={y} fill="hsl(var(--card-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] sm:text-xs font-medium">
                                  {`${(percent * 100).toFixed(0)}%`}
                                </text>
                              );
                            }}
                          >
                            {invoiceStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} stroke="hsl(var(--card))" style={{filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))'}}/>
                            ))}
                          </Pie>
                          <ChartLegend content={<ChartLegendContent nameKey="name" className="text-[10px] sm:text-xs"/>} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] sm:h-[350px] text-center text-muted-foreground">
                      <PieChartIcon className="mx-auto h-12 w-12 mb-2 text-primary" />
                      <p className="font-semibold">No Invoice Status Data</p>
                      <p>There is no data to display for invoice statuses.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Top Outstanding Invoices</CardTitle>
                <CardDescription>Top 5 invoices with remaining balances, most recent due dates first.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-2">
                <div className="max-h-72 overflow-y-auto">
                  {outstandingInvoicesData.length > 0 ? (
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                        <TableRow>
                          <TableHead className="py-2 px-2 sm:px-4">Invoice ID</TableHead>
                          <TableHead className="py-2 px-2 sm:px-4">Customer</TableHead>
                          <TableHead className="py-2 px-2 sm:px-4">Due Date</TableHead>
                          <TableHead className="py-2 px-2 sm:px-4">Status</TableHead>
                          <TableHead className="text-right py-2 px-2 sm:px-4">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outstandingInvoicesData.map((invoice) => (
                          <TableRow key={invoice.name}>
                            <TableCell className="font-medium py-2 px-2 sm:px-4">{invoice.name}</TableCell>
                            <TableCell className="py-2 px-2 sm:px-4">{invoice.customerName}</TableCell>
                            <TableCell className="py-2 px-2 sm:px-4">{invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                            <TableCell className="py-2 px-2 sm:px-4">
                              <Badge variant={getStatusBadgeVariant(invoice.status as InvoiceStatus)}>
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold py-2 px-2 sm:px-4">${invoice.value.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Zap className="mx-auto h-12 w-12 mb-2 text-green-500 dark:text-green-400" />
                      <p className="font-semibold">All Clear!</p>
                      <p>No outstanding invoices at the moment.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Invoices</CardTitle>
                  <Link href="/invoices" className="text-sm text-primary hover:underline">
                    View all
                  </Link>
                </CardHeader>
                <CardContent className="p-0 sm:p-2">
                  <div className="max-h-72 overflow-y-auto">
                    {recentInvoices.length > 0 ? (
                       <Table>
                        <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                          <TableRow>
                            <TableHead className="py-2 px-2 sm:px-4">Invoice ID</TableHead>
                            <TableHead className="py-2 px-2 sm:px-4">Customer</TableHead>
                            <TableHead className="py-2 px-2 sm:px-4">Due Date</TableHead>
                            <TableHead className="text-right py-2 px-2 sm:px-4">Amount</TableHead>
                            <TableHead className="py-2 px-2 sm:px-4">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentInvoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium py-2 px-2 sm:px-4">{invoice.id}</TableCell>
                              <TableCell className="py-2 px-2 sm:px-4">{invoice.customerName || getCustomerById(invoice.customerId)?.name || 'N/A'}</TableCell>
                              <TableCell className="py-2 px-2 sm:px-4">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                              <TableCell className="text-right py-2 px-2 sm:px-4">${invoice.totalAmount.toFixed(2)}</TableCell>
                              <TableCell className="py-2 px-2 sm:px-4">
                                <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                       </Table>
                    ) : (
                      <p className="p-4 text-center text-muted-foreground">No recent invoices.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/invoices?action=new">
                        <PlusCircle className="mr-2 h-4 w-4 text-primary" /> Create New Invoice
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/customers"> 
                        <UserPlus className="mr-2 h-4 w-4 text-primary" /> Add New Customer
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/reports">
                        <BarChartHorizontalBig className="mr-2 h-4 w-4 text-primary" /> Generate Report
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Top Customers</CardTitle>
                    <Link href="/customers" className="text-sm text-primary hover:underline">
                      View all
                    </Link>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {topCustomers.length > 0 ? topCustomers.map((customer) => (
                      <div key={customer.id} className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={`https://placehold.co/40x40.png?text=${customer.name.charAt(0)}`} data-ai-hint="letter avatar" alt={customer.name} />
                          <AvatarFallback>{customer.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer.invoiceCount} invoices &bull; ${customer.totalInvoiced.toFixed(2)}
                          </p>
                        </div>
                        <Link href={`/customers?action=view&id=${customer.id}`} passHref> 
                          <Button variant="ghost" size="sm" className="px-2">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground text-center">No customer data available.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

    
