
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, UserCheck, Clock, TrendingUp, UserMinus } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DataPlaceholder } from '@/components/common/data-placeholder';

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());


  // Define columns for the attendance data table
  const attendanceColumns = [
    {
      accessorKey: 'employeeName',
      header: 'Employee Name',
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }: { row: any }) => {
        const date = new Date(row.getValue('date'));
        return format(date, 'yyyy-MM-dd');
      },
    },
    {
      accessorKey: 'checkIn',
      header: 'Check-in',
      cell: ({ row }: { row: any }) => {
        return row.getValue('checkIn') || '-';
      },
    },
    {
      accessorKey: 'checkOut',
      header: 'Check-out',
      cell: ({ row }: { row: any }) => {
        return row.getValue('checkOut') || '-';
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => {
        const status = row.getValue('status');
        let statusColor = 'text-muted-foreground';
        let statusText = status;

        switch (status) {
          case 'present':
            statusColor = 'text-green-500';
            statusText = 'Present';
            break;
          case 'absent':
            statusColor = 'text-red-500';
            statusText = 'Absent';
            break;
          case 'on_leave':
            statusColor = 'text-yellow-500';
            statusText = 'On Leave';
            break;
          default:
            break;
        }

        return (
          <div className={`flex items-center ${statusColor}`}>
            <span className={`h-2 w-2 rounded-full mr-2`} style={{ backgroundColor: statusColor.split('-')[1] }} />
            {statusText}
          </div>
        );
      },
    },
    {
      accessorKey: 'hoursWorked',
      header: 'Hours Worked',
      cell: ({ row }: { row: any }) => {
        return row.getValue('hoursWorked') || '-';
      },
    },
    // Add more columns as needed (e.g., location, notes)
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Attendance Management"
        description="Track employee attendance, check-ins, check-outs, and manage leave."
      />
      <Card className="flex-grow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-6 w-6 text-primary" />
              Attendance Tracking
            </CardTitle>
            <CardDescription>
              Track employee check-ins, check-outs, and overall attendance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* KPIs Section */}
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {/* Date Selection */}
              <div className="md:w-1/3">
                <h3 className="text-lg font-semibold mb-3">Select Date</h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border shadow"
                  initialFocus
                />
              </div>

              {/* Overview KPIs */}
              <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Present</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">--</div> {/* Placeholder */}
                    <p className="text-xs text-muted-foreground">For {selectedDate ? format(selectedDate, 'PPP') : 'selected date'}</p> {/* Placeholder */}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Absent</CardTitle>
                    <UserMinus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">--</div> {/* Placeholder */}
                    <p className="text-xs text-muted-foreground">For {selectedDate ? format(selectedDate, 'PPP') : 'selected date'}</p> {/* Placeholder */}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">On Leave</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">--</div> {/* Placeholder */}
                    <p className="text-xs text-muted-foreground">For {selectedDate ? format(selectedDate, 'PPP') : 'selected date'}</p> {/* Placeholder */}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unaccounted</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">--</div> {/* Placeholder */}
                    <p className="text-xs text-muted-foreground">For {selectedDate ? format(selectedDate, 'PPP') : 'selected date'}</p> {/* Placeholder */}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Employee Attendance List Section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">
                Employee Status for {selectedDate ? format(selectedDate, 'PPP') : 'Selected Date'}
              </h3>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {/* Employee Search */}
                <Input
                  placeholder="Search employee..."
                  className="max-w-sm"
                  // Add search functionality
                />
                {/* Export Button */}
                <Button variant="outline"
                  // Add export functionality
                >
                  Export Data
                </Button>
              </div>
              {/* Placeholder for Employee Attendance List */}
              <DataPlaceholder
                title="Employee Attendance Details"
                description={`Detailed employee attendance list for ${selectedDate ? format(selectedDate, 'PPP') : 'the selected date'} will appear here soon. This will include check-in/check-out times and options to mark attendance status. If an employee is marked absent, a field for the reason will be provided.`}
                icon={Clock}
              />
            </div>

            {/* Quick Actions */}
            <div className="mt-6 p-4 border-t border-border">
              <h4 className="text-lg font-semibold mb-2">Quick Actions</h4>
              <div className="flex flex-wrap gap-4">
                {/* Log Bulk Absence Button */}
                <Button variant="outline">Log Bulk Absence</Button>
                {/* Request Leave Button (Might link elsewhere or trigger modal) */}
                <Button variant="outline">Request Leave</Button>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
