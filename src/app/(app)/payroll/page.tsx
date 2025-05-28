
'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Banknote, DollarSign, Users, CalendarCheck, Calculator, Send, FileText, Settings as SettingsIcon, PlusCircle } from 'lucide-react';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Mock data for placeholder table
const mockPayrollHistory = [
  { id: 'PR001', period: 'July 2024', processingDate: '2024-07-31', totalAmount: 115000, employees: 55, status: 'Completed' },
  { id: 'PR002', period: 'June 2024', processingDate: '2024-06-30', totalAmount: 112500, employees: 54, status: 'Completed' },
];

export default function PayrollPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('run-payroll');

  const handleProcessPayroll = () => {
    toast({
      title: "Process Payroll",
      description: "Payroll processing functionality coming soon!",
    });
  };

  const handleCalculatePayroll = () => {
    toast({
      title: "Calculate Payroll",
      description: "Payroll calculation logic coming soon. Employee details would be processed here.",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Payroll Management"
          description="Oversee employee salaries, process payroll runs, and manage payslips."
          actions={
            <Button onClick={handleProcessPayroll}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Process New Payroll Run
            </Button>
          }
        />
      </div>

      <div className="flex-grow overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* KPI Section */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Payroll Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$115,000.00</div>
              <p className="text-xs text-muted-foreground">for July 2024</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees Paid (Last Run)</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">55</div>
              <p className="text-xs text-muted-foreground">in July 2024 payroll</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Scheduled Payroll</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{format(new Date(2024, 7, 31), 'MMMM dd, yyyy')}</div>
              <p className="text-xs text-muted-foreground">for August 2024</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="run-payroll">Run Payroll</TabsTrigger>
            <TabsTrigger value="payroll-history">Payroll History</TabsTrigger>
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
            <TabsTrigger value="payroll-settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="run-payroll" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Run Configuration</CardTitle>
                <CardDescription>Select the period and options for the new payroll run.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select Pay Month" /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => format(new Date(0, i), 'MMMM')).map(month => (
                        <SelectItem key={month} value={month.toLowerCase()}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select Pay Year" /></SelectTrigger>
                    <SelectContent>
                      {[new Date().getFullYear(), new Date().getFullYear() -1].map(year => (
                         <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCalculatePayroll} className="w-full sm:w-auto">
                  <Calculator className="mr-2 h-4 w-4" /> Calculate Payroll
                </Button>
                <div className="pt-4">
                  <DataPlaceholder
                    icon={Banknote}
                    title="Awaiting Calculation"
                    message="Detailed employee salary breakdown, deductions, and net pay will appear here once payroll is calculated. This section will list employees with their gross pay, deductions, and net pay."
                  />
                </div>
                <Button variant="default" disabled className="w-full sm:w-auto"> {/* Disabled until calculation */}
                  <Send className="mr-2 h-4 w-4" /> Finalize & Process Payments
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll-history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Processed Payroll Runs</CardTitle>
                <CardDescription>View history of all processed payrolls.</CardDescription>
              </CardHeader>
              <CardContent>
                {mockPayrollHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pay Period</TableHead>
                          <TableHead>Processing Date</TableHead>
                          <TableHead className="text-right">Total Amount</TableHead>
                          <TableHead className="text-center">Employees</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockPayrollHistory.map((run) => (
                          <TableRow key={run.id}>
                            <TableCell>{run.period}</TableCell>
                            <TableCell>{format(new Date(run.processingDate), 'PPP')}</TableCell>
                            <TableCell className="text-right">${run.totalAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-center">{run.employees}</TableCell>
                            <TableCell>{run.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <DataPlaceholder
                    icon={FileText}
                    title="No Payroll History"
                    message="No payrolls have been processed yet."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payslips" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Employee Payslips</CardTitle>
                <CardDescription>Generate, view, and distribute individual employee payslips.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataPlaceholder
                  icon={FileText}
                  title="Payslip Management Coming Soon"
                  message="This section will allow for detailed payslip generation and management for each employee after a payroll run is finalized."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll-settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Configuration</CardTitle>
                <CardDescription>Manage payroll settings, tax details, deduction types, and payment methods.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataPlaceholder
                  icon={SettingsIcon}
                  title="Payroll Settings Coming Soon"
                  message="Configure general payroll settings, define salary components, tax rules, deduction categories (e.g., loans, advances), and set up bank details for payments here."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
