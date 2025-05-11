// src/app/(app)/dashboard/page.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Users, FileText, AlertTriangle, TrendingUp, TrendingDown, Zap } from 'lucide-react';
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
import { format } from 'date-fns';
import { useData } from '@/context/DataContext'; // Corrected import path
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function DashboardPage() {
  const { invoices, customers, isLoading } = useData();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  useEffect(() => {
    if (!isLoading) {
        setLastRefreshed(new Date());
    }
  }, [invoices, customers, isLoading]);


  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalOutstanding = totalRevenue - totalPaid;
    const activeCustomers = new Set(invoices.map(inv => inv.customerId)).size;
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue' && inv.remainingBalance > 0).length;

    return {
      totalRevenue,
      totalPaid,
      totalOutstanding,
      activeCustomers,
      totalInvoices: invoices.length,
      overdueInvoices,
    };
  }, [invoices]);

  const invoiceStatusData: ChartDataPoint[] = useMemo(() => {
    const statusCounts = invoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {} as Record<InvoiceStatus, number>); // Use InvoiceStatus type here
    return Object.entries(statusCounts).map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }));
  }, [invoices]);

  const monthlyRevenueData: ChartDataPoint[] = useMemo(() => {
    const revenueByMonth: Record<string, number> = {};
    invoices.filter(inv => inv.status === 'Paid').forEach(inv => {
      const month = format(new Date(inv.issueDate), 'MMM yy');
      revenueByMonth[month] = (revenueByMonth[month] || 0) + inv.amountPaid;
    });
    return Object.entries(revenueByMonth)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => {
        const [aMonth, aYear] = a.name.split(' ');
        const [bMonth, bYear] = b.name.split(' ');
        const dateA = new Date(`${aMonth} 1, 20${aYear}`);
        const dateB = new Date(`${bMonth} 1, 20${bYear}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6); // last 6 months
  }, [invoices]);

  const outstandingInvoicesData: (ChartDataPoint & { customerName?: string; dueDate?: string; status?: InvoiceStatus })[] = useMemo(() => {
     return invoices
      .filter(inv => inv.remainingBalance > 0 && (inv.status === 'Sent' || inv.status === 'Overdue'))
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()) // Most recent due dates first
      .slice(0, 5) // Top 5
      .map(inv => ({
        name: inv.id,
        value: inv.remainingBalance,
        customerName: inv.customerName || customers.find(c => c.id === inv.customerId)?.name || 'N/A',
        dueDate: inv.dueDate,
        status: inv.status,
      }));
  }, [invoices, customers]);


  if (isLoading) {
    return (
      <>
        <PageHeader title="Dashboard" description="Overview of your invoicing activities." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>Last 6 months paid invoice amounts.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <Skeleton className="h-[350px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Invoice Statuses</CardTitle>
              <CardDescription>Distribution of current invoice statuses.</CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[350px] w-full" />
            </CardContent>
          </Card>
        </div>
         <Card className="mt-6">
          <CardHeader>
            <CardTitle>Top Outstanding Invoices</CardTitle>
             <CardDescription>Top 5 invoices with remaining balances.</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Overview of your invoicing activities. Last refreshed: ${lastRefreshed ? format(lastRefreshed, 'PPpp') : 'Loading...'}`}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From {stats.totalInvoices} invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">${stats.totalPaid.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">
              {(stats.totalRevenue > 0 ? (stats.totalPaid / stats.totalRevenue) * 100 : 0).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">${stats.totalOutstanding.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.overdueInvoices} overdue invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">Based on current invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Last 6 months paid invoice amounts.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
          <ChartContainer config={{
                revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
              }} className="h-[350px] w-full">
              <RechartsBarChart data={monthlyRevenueData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickFormatter={(value) => `$${value/1000}k`} tickLine={false} axisLine={false} tickMargin={8} />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Revenue" />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Statuses</CardTitle>
             <CardDescription>Distribution of current invoice statuses.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[350px]">
             <ChartContainer config={invoiceStatusData.reduce((acc, cur) => ({...acc, [cur.name]: {label: cur.name, color: cur.fill}}), {})} className="mx-auto aspect-square h-full">
              <PieChart>
                <RechartsTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                <Pie data={invoiceStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} 
                     label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.6; // Adjust label position
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        if (percent * 100 < 5) return null; // Hide small percentage labels
                        return (
                          <text x={x} y={y} fill="hsl(var(--card-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-medium">
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                >
                  {invoiceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="hsl(var(--card))" style={{filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))'}}/>
                  ))}
                </Pie>
                 <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Top Outstanding Invoices</CardTitle>
          <CardDescription>Top 5 invoices with remaining balances, most recent due dates first.</CardDescription>
        </CardHeader>
        <CardContent>
          {outstandingInvoicesData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingInvoicesData.map((invoice) => (
                  <TableRow key={invoice.name}>
                    <TableCell className="font-medium">{invoice.name}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status as InvoiceStatus)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">${invoice.value.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="mx-auto h-12 w-12 mb-2 text-green-500" />
              <p className="font-semibold">All Clear!</p>
              <p>No outstanding invoices at the moment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
