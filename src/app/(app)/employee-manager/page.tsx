
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent, } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Clock, Search, Filter, MoreHorizontal, PlusCircle, Briefcase } from 'lucide-react';

interface Employee {
  employeeId: string;
  name: string;
  email?: string;
  position: string;
  department: string;
  hireDate: string;
  status: string;
}

const employeeDirectoryData: Employee[] = [
  {
    employeeId: 'EMP-001',
    name: 'John Smith',
    email: 'john.smith@company.com',
    position: 'Manufacturing Manager',
    department: 'Production',
    hireDate: '2020-03-15',
    status: 'Active',
  },
  {
    employeeId: 'EMP-002',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    position: 'Quality Control Specialist',
    department: 'Quality Control',
    hireDate: '2021-07-20',
    status: 'Active',
  },
  {
    employeeId: 'EMP-003',
    name: 'Michael Brown',
    email: 'michael.brown@company.com',
    position: 'Production Supervisor',
    department: 'Production',
    hireDate: '2019-11-10',
    status: 'Active',
  },
];

interface DepartmentData {
  name: string;
  employees: number;
  percentage: string;
}

// Assuming a Progress component exists in your UI library, uncomment the import below:
// import { Progress } from '@/components/ui/progress';

// Placeholder component for Progress if the actual component is not imported:
const Progress = ({ value }: { value: number }) => <div className="h-2 w-full bg-blue-500 rounded" style={{ width: `${value}%` }}></div>; // Placeholder if Progress component is not available

export default function EmployeeManagerPage() {
  const [activeTab, setActiveTab] = useState('employee-directory');

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Employee Management</h1>
          <p className="text-gray-600">Manage your workforce and track employee information.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
             Bulk Import
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-blue-600">+5 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">235</div>
             <p className="text-xs text-green-600">95.1% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
            <CardTitle className="text-sm font-medium">New Hires (MTD)</CardTitle>
            <UserPlus className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-purple-600">+3 this week</p>
          </CardContent>
       </Card>
       <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Turnover Rate</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-orange-600">-0.8% improvement</p>
         </CardContent>
        </Card>
      </div>


      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employee-directory">Employee Directory</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="hr-analytics">HR Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="employee-directory">
          <Card>
            <CardHeader>
              <CardTitle>Employee Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-1/3">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search employees..." className="pl-8" />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeDirectoryData.map((employee, index) => (<TableRow key={index}>
                      <TableCell className="font-medium">{employee.employeeId}</TableCell>
                      <TableCell><div>{employee.name}</div><div className="text-xs text-muted-foreground">{employee.email}</div></TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.hireDate}</TableCell>
                      <TableCell><Badge variant={employee.status === 'Active' ? 'default' : 'outline'}>{employee.status}</Badge></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon" className="hover:bg-gray-100"><MoreHorizontal className="h-4 w-4" /></Button></TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Add TabsContent for other tabs as needed */}
         <TabsContent value="departments">
           <Card>
             <CardHeader>
               <CardTitle>Department Overview</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {[
                   { name: 'Production', employees: 89, percentage: '36%' },
                   { name: 'Quality Control', employees: 24, percentage: '10%' },
                   { name: 'Maintenance', employees: 31, percentage: '13%' },
                   { name: 'Administration', employees: 18, percentage: '7%' },
                   { name: 'Sales & Marketing', employees: 28, percentage: '11%' },
                   { name: 'Finance & Accounting', employees: 15, percentage: '6%' },
                   { name: 'Human Resources', employees: 12, percentage: '5%' },
                   { name: 'IT & Engineering', employees: 30, percentage: '12%' },
                 ].map((department) => (
                   <Card key={department.name}>
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-base font-semibold">{department.name}</CardTitle>
                       <Briefcase className="h-5 w-5 text-muted-foreground" />
                     </CardHeader>
                     <CardContent>
                       <div className="text-2xl font-bold text-primary">{department.employees}</div>
                       <Progress value={parseFloat(department.percentage.replace('%', ''))} />
                       <p className="text-xs text-muted-foreground mt-1">{department.percentage} of total workforce</p>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             </CardContent>
           </Card>
         </TabsContent>
         <TabsContent value="hr-analytics">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card>
               <CardHeader>
                 <CardTitle>Workforce Analytics</CardTitle>
               </CardHeader>
               <CardContent className="flex flex-col items-center justify-center h-64">
                 <Users className="h-12 w-12 text-muted-foreground mb-4" />
                 <p className="text-lg font-semibold text-muted-foreground">Advanced Analytics</p>
                 <p className="text-sm text-muted-foreground">Detailed workforce analytics and insights coming soon.</p>
               </CardContent>
             </Card>
             <Card>
               <CardHeader>
                 <CardTitle>Performance Metrics</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex justify-between items-center">
                   <div>Employee Satisfaction</div>
                   <div className="text-green-600 font-semibold">87%</div>
                 </div>
                 <div className="flex justify-between items-center">
                   <div>Average Tenure</div>
                   <div className="text-blue-600 font-semibold">3.2 years</div>
                 </div>
                 <div className="flex justify-between items-center">
                   <div>Training Completion</div>
                   <div className="text-purple-600 font-semibold">92%</div>
                 </div>
                 <div className="flex justify-between items-center">
                   <div>Performance Rating</div>
                   {/* Using an approximate color visually matching the image */}
                   <div className="text-orange-600 font-semibold">4.1/5</div>
                 </div>
                 {/* Add more performance metrics as needed */}
               </CardContent>
             </Card>
           </div>
         </TabsContent>
      </Tabs>
    </div>
  );
}
