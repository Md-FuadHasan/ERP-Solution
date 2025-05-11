'use client';
import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Users, FileText, AlertTriangle } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart as RechartsBarChartComponent, Bar, Pie, Cell, XAxis, YAxis, CartesianGrid, PieChart as RechartsPieChart, Tooltip as RechartsTooltip } from 'recharts';
import type { ChartDataPoint } from '@/types';
import { useData } from '@/context/DataContext'; // Import useData hook
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function DashboardPage() {
  const { invoices, customers, isLoading } = useData(); // Use DataContext

  const dashboardMetrics = useMemo(() => {
    const totalOutstanding = invoices
      .filter(inv => inv.status === 'Sent' || inv.status === 'Overdue')
      .reduce((sum, inv) => sum + inv.remainingBalance, 0);
    
    const recentPaymentsCount = invoices.filter(inv => inv.status === 'Paid').length;
    
    const overdueAmount = invoices
      .filter(inv => inv.status === 'Overdue')
      .reduce((sum, inv) => sum + inv.remainingBalance, 0);
      
    const totalCustomersCount = customers.length;

    // Calculate Outstanding Invoices Data for the Bar Chart
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const outstandingInvoicesData: ChartDataPoint[] = months.map((monthName, index) => {
      const monthValue = invoices
        .filter(inv => {
          const issueDate = new Date(inv.issueDate);
          return (
            (inv.status === 'Sent' || inv.status === 'Overdue') && // Consistent with totalOutstanding
            issueDate.getMonth() === index &&
            issueDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, inv) => sum + inv.remainingBalance, 0);
      return { name: monthName, value: monthValue };
    }).slice(0, 7); // Display first 7 months or adjust as needed

    // Calculate Invoice Status Data for the Pie Chart
    const invoiceStatusCounts = invoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const invoiceStatusData: ChartDataPoint[] = Object.entries(invoiceStatusCounts).map(([name, value]) => ({ name, value }));
    
    // If there are no invoices, provide empty/zeroed data for charts to prevent errors
    if (invoices.length === 0) {
        return {
            totalOutstanding: 0,
            recentPaymentsCount: 0,
            overdueAmount: 0,
            totalCustomersCount: customers.length, // customers might exist even with no invoices
            outstandingInvoicesData: months.slice(0,7).map(m => ({name: m, value: 0})),
            invoiceStatusData: [],
        };
    }


    return {
      totalOutstanding,
      recentPaymentsCount,
      overdueAmount,
      totalCustomersCount,
      outstandingInvoicesData,
      invoiceStatusData,
    };
  }, [invoices, customers]);

  const chartConfig = {
    outstanding: { label: "Outstanding", color: "hsl(var(--chart-1))" },
    // Pie chart segments
    Draft: { label: "Draft", color: PIE_COLORS[0] },
    Sent: { label: "Sent", color: PIE_COLORS[1] },
    Paid: { label: "Paid", color: PIE_COLORS[2] },
    Overdue: { label: "Overdue", color: PIE_COLORS[3] },
    Cancelled: { label: "Cancelled", color: PIE_COLORS[4] },
  };
  
  if (isLoading) {
    return (
      <>
        <PageHeader title="Dashboard" description="Overview of your business metrics." />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-3/5" /> 
                <Skeleton className="h-5 w-5 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2 mb-1" />
                <Skeleton className="h-4 w-4/5" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card className="lg:col-span-1">
            <CardHeader>
              <Skeleton className="h-6 w-1/2 mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="h-[350px] p-2 flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-1">
            <CardHeader>
              <Skeleton className="h-6 w-1/2 mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="h-[350px] flex items-center justify-center p-2">
              <Skeleton className="h-5/6 w-5/6 rounded-full" />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your business metrics." />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardMetrics.totalOutstanding.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <p className="text-xs text-muted-foreground">Based on current data</p> 
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.recentPaymentsCount} invoices</div>
            <p className="text-xs text-muted-foreground">Total paid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amounts</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${dashboardMetrics.overdueAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <p className="text-xs text-muted-foreground">{invoices.filter(i => i.status === "Overdue").length} invoices overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.totalCustomersCount}</div>
            <p className="text-xs text-muted-foreground">Active customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Outstanding Invoices Trend</CardTitle>
            <CardDescription>Monthly trend of outstanding invoice amounts for the current year.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] p-2">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <RechartsBarChartComponent data={dashboardMetrics.outstandingInvoicesData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value === 0 ? '$0' : `$${value/1000}k`} />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
                  content={<ChartTooltipContent formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]} />}
                />
                <Bar dataKey="value" fill="var(--color-outstanding)" radius={4} name="Outstanding Amount"/>
              </RechartsBarChartComponent>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
            <CardDescription>Distribution of invoices by their current status.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center p-2">
             <ChartContainer config={chartConfig} className="h-full w-full">
                <RechartsPieChart>
                    <RechartsTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie data={dashboardMetrics.invoiceStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
                        if (value === 0) return null; // Don't render label for zero-value slices
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px">
                            {`${name} (${(percent * 100).toFixed(0)}%)`}
                          </text>
                        );
                      }}>
                        {dashboardMetrics.invoiceStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    {dashboardMetrics.invoiceStatusData.length > 0 && <ChartLegend content={<ChartLegendContent />} />}
                </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
