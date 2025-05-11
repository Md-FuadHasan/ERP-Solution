'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, LineChart, PieChartIcon, DollarSign, Users, FileText, AlertTriangle } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, Line, Pie, ResponsiveContainer, Cell, Legend, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid, PieChart as RechartsPieChart } from 'recharts';
import type { ChartDataPoint } from '@/types';
import { MOCK_INVOICES } from '@/types'; // Import mock data

const totalOutstanding = MOCK_INVOICES.filter(inv => inv.status === 'Sent' || inv.status === 'Overdue').reduce((sum, inv) => sum + inv.totalAmount, 0);
const recentPaymentsCount = MOCK_INVOICES.filter(inv => inv.status === 'Paid').length; // Simplistic, real app would check payment dates
const overdueAmount = MOCK_INVOICES.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.totalAmount, 0);
const totalCustomers = new Set(MOCK_INVOICES.map(inv => inv.customerId)).size;


const outstandingInvoicesData: ChartDataPoint[] = [
  { name: 'Jan', value: 1200 }, { name: 'Feb', value: 2100 }, { name: 'Mar', value: 1500 },
  { name: 'Apr', value: 2780 }, { name: 'May', value: 1890 }, { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490*0.6 }, // Assuming some got paid
];

const recentPaymentsData: ChartDataPoint[] = [
  { name: 'W1', value: 400 }, { name: 'W2', value: 300 }, { name: 'W3', value: 200 },
  { name: 'W4', value: 278 }, { name: 'W5', value: 189 }, { name: 'W6', value: 239 },
  { name: 'W7', value: 349 },
];

const invoiceStatusCounts = MOCK_INVOICES.reduce((acc, inv) => {
  acc[inv.status] = (acc[inv.status] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const invoiceStatusData: ChartDataPoint[] = Object.entries(invoiceStatusCounts).map(([name, value]) => ({ name, value }));

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];


export default function DashboardPage() {
  const chartConfig = {
    outstanding: { label: "Outstanding", color: "hsl(var(--chart-1))" },
    payments: { label: "Payments", color: "hsl(var(--chart-2))" },
  };

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
            <div className="text-2xl font-bold">${totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+10.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentPaymentsCount} invoices</div>
            <p className="text-xs text-muted-foreground">+5 since last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amounts</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${overdueAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">3 invoices overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">+2 new this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Outstanding Invoices</CardTitle>
            <CardDescription>Monthly trend of outstanding invoice amounts.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] p-2">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={outstandingInvoicesData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <RechartsTooltip
                    cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="value" fill="var(--color-outstanding)" radius={4} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
            <CardDescription>Distribution of invoices by status.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center p-2">
             <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                        <RechartsTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                        <Pie data={invoiceStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" label>
                            {invoiceStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent />} />
                    </RechartsPieChart>
                </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Renaming default Recharts BarChart to avoid conflict if we use their default Bar component
const RechartsBarChart = BarChart;
