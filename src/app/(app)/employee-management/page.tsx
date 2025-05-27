
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ColumnDef } from '@tanstack/react-table'; // Keep ColumnDef for type safety

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
}

const employees: Employee[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', department: 'Sales' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', department: 'Marketing' },
  { id: '3', name: 'Peter Jones', email: 'peter.jones@example.com', department: 'Engineering' },
  { id: '4', name: 'Mary Brown', email: 'mary.brown@example.com', department: 'Human Resources' },
];

// We'll keep the columns definition as it's good practice,
// but for simple display, we'll manually create headers.
// A more advanced table would use these columns with TanStack Table.
const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'department',
    header: 'Department',
  },
];

export default function EmployeeManagementPage() {
  return (
    <div className="flex flex-col h-full">
       <PageHeader
        title="Employee Management"
        description="Manage employee profiles, roles, permissions, and other HR-related tasks."
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="mr-2 h-6 w-6 text-primary" />
            Employee Hub
          </CardTitle>
          <CardDescription>
            List of current employees. Full management features coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length > 0 ? (
                  employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No employees found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
