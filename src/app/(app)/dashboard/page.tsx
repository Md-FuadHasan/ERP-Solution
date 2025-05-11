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
    const totalOutstanding = invoices.filter(inv => inv.status === 'Sent' || inv.status === 'Overdue').reduce((sum, inv) => sum + inv.remainingBalance, 0);
    const recentPaymentsCount = invoices.filter(inv => inv.status === 'Paid').length; // Simplified
    const overdueAmount = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.remainingBalance, 0);
    const totalCustomersCount = customers.length;

    // For Outstanding Invoices Chart (example: monthly trend, needs real date logic)
    // This is placeholder logic and would need to be adapted for actual monthly aggregation
    const outstandingInvoicesData: ChartDataPoint[] = [
      { name: 'Jan', value: invoices.filter(i => i.status !== 'Paid' && new Date(i.issueDate).getMonth() === 0).reduce((s, i) => s + i.remainingBalance, 0) || 1200 },
      { name: 'Feb', value: invoices.filter(i => i.status !== 'Paid' && new Date(i.issueDate).getMonth() === 1).reduce((s, i) => s + i.remainingBalance, 0) || 2100 },
      { name: 'Mar', value: invoices.filter(i => i.status !== 'Paid' && new Date(i.issueDate).getMonth() === 2).reduce((s, i) => s + i.remainingBalance, 0) || 1500 },
      { name: 'Apr', value: invoices.filter(i => i.status !== 'Paid' && new Date(i.issueDate).getMonth() === 3).reduce((s, i) => s + i.remainingBalance, 0) || 2780 },
      { name: 'May', value: invoices.filter(i => i.status !== 'Paid' && new Date(i.issueDate).getMonth() === 4).reduce((s, i) => s + i.remainingBalance, 0) || 1890 },
      { name: 'Jun', value: invoices.filter(i => i.status !== 'Paid' && new Date(i.issueDate).getMonth() === 5).reduce((s, i) => s + i.remainingBalance, 0) || 2390 },
      { name: 'Jul', value: invoices.filter(i => i.status !== 'Paid' && new Date(i.issueDate).getMonth() === 6).reduce((s, i) => s + i.remainingBalance, 0) || 3490 * 0.6 },
    ];
    
    const invoiceStatusCounts = invoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const invoiceStatusData: ChartDataPoint[] = Object.entries(invoiceStatusCounts).map(([name, value]) => ({ name, value }));

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
            {/* Placeholder for dynamic change text */}
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
            <CardDescription>Monthly trend of outstanding invoice amounts (example).</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] p-2">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <RechartsBarChartComponent data={dashboardMetrics.outstandingInvoicesData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value/1000}k`} />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
                  content={<ChartTooltipContent />} // Simplified
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
                    <Pie data={dashboardMetrics.invoiceStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
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
                    <ChartLegend content={<ChartLegendContent />} />
                </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
