'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  UserCog,
  Users,
  Shield,
  Mail,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';

// Placeholder data - replace with actual data fetching
const userData = [
  {
    user: { name: 'John Smith', email: 'john.smith@proerp.com' },
    role: 'Administrator',
    department: 'IT',
    status: 'Active',
    lastLogin: '2024-01-25 14:20',
  },
  {
    user: { name: 'Sarah Johnson', email: 'sarah.johnson@proerp.com' },
    role: 'Manager',
    department: 'Sales',
    status: 'Active',
    lastLogin: '2024-01-25 13:45',
  },
  {
    user: { name: 'Mike Wilson', email: 'mike.wilson@proerp.com' },
    role: 'Accountant',
    department: 'Finance',
    status: 'Active',
    lastLogin: '2024-01-25 12:20',
  },
  {
    user: { name: 'Emily Davis', email: 'emily.davis@proerp.com' },
    role: 'HR Specialist',
    department: 'Human Resources',
    status: 'Inactive',
    lastLogin: '2024-01-20 16:15',
  },
    {
    user: { name: 'Robert Chen', email: 'robert.chen@proerp.com' },
    role: 'Warehouse Manager',
    department: 'Operations',
    status: 'Active',
    lastLogin: '2024-01-25 11:30',
  },
];

const roleData = [
  {
    name: 'Administrator',
    description: 'Full system access',
    users: 2,
  },
  {
    name: 'Manager',
    description: 'Departmental management',
    users: 8,
  },
  {
    name: 'Employee',
    description: 'Limited access',
    users: 45,
  },
  {
    name: 'Accountant',
    description: 'Financial module access',
    users: 3,
  },
  {
    name: 'HR Specialist',
    description: 'HR module access',
    users: 2,
  },
  {
    name: 'Warehouse Manager',
    description: 'Inventory management',
    users: 5,
  },
];

export default function UserManagementPage() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <PageHeader
        title="User Management"
        description="Manage users, roles, and permissions."
        actions={
          <Button>
            <Link href="/add-new-user">+ Add New User</Link>
          </Button>
        }
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">58</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="flex flex-col flex-grow">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="flex flex-col flex-grow">
          <Card className="flex flex-col flex-grow">
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
              {/* Search and Filter */}
              <div className="flex items-center gap-4 mb-4">
                <Input
                  placeholder="Search users..."
                  className="max-w-sm"
                />
                {/* Role Filter - Placeholder */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">All Roles</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Administrator</DropdownMenuItem>
                    <DropdownMenuItem>Manager</DropdownMenuItem>
                    <DropdownMenuItem>Accountant</DropdownMenuItem>
                     <DropdownMenuItem>HR Specialist</DropdownMenuItem>
                     <DropdownMenuItem>Warehouse Manager</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Status Filter - Placeholder */}
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">All Status</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Active</DropdownMenuItem>
                    <DropdownMenuItem>Inactive</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Users Table */}
              <div className="flex-grow">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userData.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{user.user.name}</span>
                            <span className="text-sm text-muted-foreground">{user.user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                           <Badge variant={user.status === 'Active' ? 'default' : 'secondary'} className={user.status === 'Active' ? 'bg-green-500' : ''}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.lastLogin}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit User</DropdownMenuItem>
                              <DropdownMenuItem>Manage Permissions</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500">Delete User</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="roles" className="flex flex-col flex-grow p-4">
             {/* Content for Roles & Permissions tab */}
             <div className="flex items-center justify-between mb-4">
                 <h3 className="text-2xl font-semibold">Roles & Permissions</h3>
                 <Button>
                    + Add New Role
                 </Button>
             </div>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {roleData.map((role, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-semibold">
                                {role.name}
                            </CardTitle>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    :::
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit Role</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500">Delete Role</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <CardDescription>{role.description}</CardDescription>
                            <div className="text-sm text-muted-foreground">{role.users} users</div>
                            <Button variant="outline" className="w-full">View Details</Button>
                        </CardContent>
                    </Card>
                ))}
             </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
