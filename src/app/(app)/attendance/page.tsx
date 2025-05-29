
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, useMemo, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, addDays, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, UserCheck, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useData } from '@/context/DataContext';
import type { Employee } from '@/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DataPlaceholder } from '@/components/common/data-placeholder';

type ManualAttendanceData = Record<string, Record<string, boolean>>; // { employeeId: { 'YYYY-MM-DD': true/false } }

export default function AttendancePage() {
  const { employees, isLoading: isDataLoading } = useData();
  const [attendanceMode, setAttendanceMode] = useState<'manual' | 'automatic'>('manual');
  const [currentDate, setCurrentDate] = useState(new Date()); // Reference date for the week
  const [manualAttendanceData, setManualAttendanceData] = useState<ManualAttendanceData>({});
  const [searchTerm, setSearchTerm] = useState('');


  const weekInterval = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return { start, end };
  }, [currentDate]);

  const daysOfWeek = useMemo(() => {
    return eachDayOfInterval(weekInterval);
  }, [weekInterval]);

  const handleToggleAttendanceMode = (isAutomatic: boolean) => {
    setAttendanceMode(isAutomatic ? 'automatic' : 'manual');
  };

  const handlePreviousWeek = () => {
    setCurrentDate(prevDate => subDays(prevDate, 7));
  };

  const handleNextWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, 7));
  };

  const handleManualAttendanceChange = (employeeId: string, date: Date, isPresent: boolean) => {
    const dateString = format(date, 'yyyy-MM-dd');
    setManualAttendanceData(prevData => ({
      ...prevData,
      [employeeId]: {
        ...(prevData[employeeId] || {}),
        [dateString]: isPresent,
      },
    }));
    // Here you would typically save this to local storage or a backend
  };

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.designation && emp.designation.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [employees, searchTerm]);

  // Placeholder KPIs - these would need real logic
  const kpis = {
    totalPresentToday: filteredEmployees.filter(emp => manualAttendanceData[emp.id]?.[format(new Date(), 'yyyy-MM-dd')] === true).length,
    totalAbsentToday: filteredEmployees.filter(emp => manualAttendanceData[emp.id]?.[format(new Date(), 'yyyy-MM-dd')] === false).length,
    onLeave: 0, // Placeholder
    unaccounted: filteredEmployees.length - (filteredEmployees.filter(emp => manualAttendanceData[emp.id]?.[format(new Date(), 'yyyy-MM-dd')] === true).length + filteredEmployees.filter(emp => manualAttendanceData[emp.id]?.[format(new Date(), 'yyyy-MM-dd')] === false).length), // Placeholder
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Attendance Management"
        description="Track employee attendance, check-ins, check-outs, and manage leave."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isDataLoading ? <Skeleton className="h-8 w-12" /> : kpis.totalPresentToday}</div>
            <p className="text-xs text-muted-foreground">As of {format(new Date(), 'PPP')}</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{isDataLoading ? <Skeleton className="h-8 w-12" /> : kpis.totalAbsentToday}</div>
            <p className="text-xs text-muted-foreground">As of {format(new Date(), 'PPP')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isDataLoading ? <Skeleton className="h-8 w-12" /> : kpis.onLeave}</div>
             <p className="text-xs text-muted-foreground">Currently on approved leave</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unaccounted</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isDataLoading ? <Skeleton className="h-8 w-12" /> : kpis.unaccounted}</div>
             <p className="text-xs text-muted-foreground">Status not yet updated</p>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-grow flex flex-col">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-6 w-6 text-primary" />
                Employee Attendance Tracking
              </CardTitle>
              <CardDescription>
                Switch between manual weekly entry or view automatic daily status.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="attendance-mode" className="text-sm font-medium">Manual</Label>
              <Switch
                id="attendance-mode"
                checked={attendanceMode === 'automatic'}
                onCheckedChange={handleToggleAttendanceMode}
              />
              <Label htmlFor="attendance-mode" className="text-sm font-medium">Automatic</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col min-h-0 p-0 sm:p-2 md:p-4">
          {attendanceMode === 'manual' && (
            <div className="flex items-center justify-between mb-4 px-2 sm:px-0">
              <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold text-center">
                Week: {format(weekInterval.start, 'MMM dd, yyyy')} - {format(weekInterval.end, 'MMM dd, yyyy')}
              </h3>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex-grow min-h-0 rounded-lg border shadow-sm bg-card flex flex-col">
             <div className="shrink-0 p-4 border-b">
                 <Input 
                    placeholder="Search employee by ID, Name, Department, Designation..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/2"
                />
            </div>
            <div className="flex-grow overflow-y-auto">
              {isDataLoading ? (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                    <TableRow>
                      <TableHead className="w-[150px] px-2 text-sm">Employee Name</TableHead>
                      {attendanceMode === 'manual' && daysOfWeek.map(day => (
                        <TableHead key={day.toISOString()} className="text-center px-2 text-sm">{format(day, 'EEE')}</TableHead>
                      ))}
                       {attendanceMode === 'automatic' && <TableHead className="px-2 text-sm">Status</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(7)].map((_, i) => (
                      <TableRow key={`skel-att-${i}`}>
                        <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-3/4" /></TableCell>
                        {attendanceMode === 'manual' && daysOfWeek.map(day => (
                          <TableCell key={`skel-day-${day.toISOString()}`} className="text-center px-2">
                            <Skeleton className="h-5 w-5 mx-auto" />
                          </TableCell>
                        ))}
                        {attendanceMode === 'automatic' && <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-1/2" /></TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : filteredEmployees.length > 0 ? (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                    <TableRow>
                      <TableHead className="min-w-[120px] px-2 text-sm">ID</TableHead>
                      <TableHead className="min-w-[180px] px-2 text-sm">Name</TableHead>
                      <TableHead className="min-w-[120px] px-2 text-sm">Department</TableHead>
                      <TableHead className="min-w-[120px] px-2 text-sm">Designation</TableHead>
                      {attendanceMode === 'manual' && daysOfWeek.map(day => (
                        <TableHead key={day.toISOString()} className="text-center px-2 text-sm min-w-[60px]">
                          {format(day, 'EEE dd')}
                        </TableHead>
                      ))}
                      {attendanceMode === 'automatic' && <TableHead className="px-2 text-sm">Status</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee, empIndex) => (
                      <TableRow key={employee.id} className={cn(empIndex % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                        <TableCell className="px-2 text-xs">{employee.employeeId}</TableCell>
                        <TableCell className="px-2 text-xs">{employee.name}</TableCell>
                        <TableCell className="px-2 text-xs">{employee.department}</TableCell>
                        <TableCell className="px-2 text-xs">{employee.designation}</TableCell>
                        {attendanceMode === 'manual' && daysOfWeek.map(day => {
                          const dateString = format(day, 'yyyy-MM-dd');
                          const isPresent = manualAttendanceData[employee.id]?.[dateString] || false;
                          return (
                            <TableCell key={day.toISOString()} className="text-center px-2 py-1">
                              <Checkbox
                                checked={isPresent}
                                onCheckedChange={(checked) => handleManualAttendanceChange(employee.id, day, !!checked)}
                                id={`att-${employee.id}-${dateString}`}
                                aria-label={`Attendance for ${employee.name} on ${format(day, 'PPP')}`}
                              />
                            </TableCell>
                          );
                        })}
                        {attendanceMode === 'automatic' && (
                          <TableCell className="px-2 text-xs">
                            <span className="text-muted-foreground italic">Awaiting Biometric Data</span>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                 <div className="h-full flex items-center justify-center p-6">
                    <DataPlaceholder
                        icon={Users}
                        title={searchTerm ? "No Employees Found" : "No Employees Available"}
                        message={searchTerm ? "Try adjusting your search term." : "Add employees in the Employee Management section to track attendance."}
                    />
                 </div>
              )}
            </div>
          </div>
        </CardContent>
         <CardFooter className="border-t p-4 flex justify-end gap-2">
            <Button variant="outline">Save Manual Changes</Button> {/* Placeholder */}
            <Button variant="outline">Export Weekly Report</Button> {/* Placeholder */}
        </CardFooter>
      </Card>
    </div>
  );
}

    