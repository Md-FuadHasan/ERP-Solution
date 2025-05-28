'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Car, DollarSign, Users, Package, Route, MoreHorizontal, Banknote } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const vanSalesData = [
  {
    id: 'VAN-001',
    route: 'Route A - Downtown',
    salesman: 'Ahmed Al-Ahmad',
    vehicle: 'Toyota Hiace - ABC123',
    progress: 8,
    totalCustomers: 12,
    salesAmount: 15400,
    collections: 12800,
    stockLevel: 85,
    status: 'Active',
  },
  {
    id: 'VAN-002',
    route: 'Route B - Industrial Area',
    salesman: 'Mohammed Hassan',
    vehicle: 'Isuzu NPR - DEF456',
    progress: 15,
    totalCustomers: 20,
    salesAmount: 22100,
    collections: 18500,
    stockLevel: 72,
    status: 'In Progress',
  },
  {
    id: 'VAN-003',
    route: 'Route C - Residential North',
    salesman: 'Khalid Ibrahim',
    vehicle: 'Mitsubishi Canter - GHI789',
    progress: 25,
    totalCustomers: 25,
    salesAmount: 31200,
    collections: 29800,
    stockLevel: 45,
    status: 'Completed',
  },
];

export default function VanSalesPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Van Sales Management</h1>
          <p className="text-gray-600">Manage your field sales operations, routes, and performance.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Route className="mr-2 h-4 w-4" /> Schedule Route
          </Button>
          <Button>
            <Car className="mr-2 h-4 w-4" /> New Van Sales
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vans</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SAR 68,700</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers Visited</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SAR 61,100</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Stock Usage</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground">Normal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Route Efficiency</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">Excellent</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="route-planning">Route Planning</TabsTrigger>
          <TabsTrigger value="van-inventory">Van Inventory</TabsTrigger>
          <TabsTrigger value="orders-invoices">Orders & Invoices</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Active Van Sales Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-1/3">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search van sales..." className="pl-8" />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Van ID</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Salesman</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Sales Amount</TableHead>
                    <TableHead>Collections</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vanSalesData.map((van) => (
                    <TableRow key={van.id}>
                      <TableCell className="font-medium">{van.id}</TableCell>
                      <TableCell>{van.route}</TableCell>
                      <TableCell>{van.salesman}</TableCell>
                      <TableCell>{van.vehicle}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                           <span>{van.progress}/{van.totalCustomers} customers</span>
                          <Progress value={(van.progress / van.totalCustomers) * 100} className="w-[60%]" />
                        </div>
                      </TableCell>
                      <TableCell>SAR {van.salesAmount.toLocaleString()}</TableCell>
                      <TableCell>SAR {van.collections.toLocaleString()}</TableCell>
                      <TableCell>{van.stockLevel}%</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            van.status === 'Active' ? 'default' : van.status === 'In Progress' ? 'secondary' : 'outline'
                          }
                        >
                          {van.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Add TabsContent for other tabs as needed */}
      </Tabs>
    </div>
  );
}