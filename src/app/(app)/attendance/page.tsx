
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useState, useMemo, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, addDays, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, UserCheck, Clock, Users, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input'; // Added Input import
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
// Removed RadioGroup imports
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useData } from '@/context/DataContext';
import type { Employee, AttendanceStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DataPlaceholder } from '@/components/common/data-placeholder';

type ManualAttendanceData = Record<string, Record<string, AttendanceStatus>>; // { employeeId: { 'YYYY-MM-DD': AttendanceStatus } }

export default function AttendancePage() {
  const { employees, isLoading: isDataLoading } = useData();
  const [attendanceMode, setAttendanceMode] = useState<'manual' | 'automatic'>('manual'); // manual mode is default now
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

  const handleManualAttendanceChange = (employeeId: string, date: Date, status: AttendanceStatus, isChecked: boolean) => {
    const dateString = format(date, 'yyyy-MM-dd');
    setManualAttendanceData(prevData => {
      const employeeAttendance = prevData[employeeId] || {};
      let newEmployeeAttendance = { ...employeeAttendance };

      if (isChecked) {
        // If a checkbox is checked, set the status for this employee and day to the status of the checked box.
        // This implicitly "unchecks" other statuses for this day in the state by overwriting the value.
        newEmployeeAttendance[dateString] = status;
      } else {
        // If a checkbox is unchecked, and its status was the current status for this employee and day,
        // then clear the status (delete the key).
        if (newEmployeeAttendance[dateString] === status) {
           delete newEmployeeAttendance[dateString]; // Clear the status if the unchecked box was the active one
        }
      }

      // Optional: If strict single selection is required like radio buttons, uncomment this.
      // This ensures only the *last* checked box's status is kept if multiple are checked quickly.
      // However, standard checkbox behavior is independent.
      // const allStatuses: AttendanceStatus[] = ['Present', 'Absent', 'Annual Leave', 'Sick Leave'];
      // allStatuses.forEach(s => {
      //    if (s !== status && isChecked) {
      //        delete newEmployeeAttendance[dateString]; // Clear other statuses if a new one is checked
      //    }
      // });

      return {
        ...prevData,
        [employeeId]: newEmployeeAttendance,
      };
    });
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
    totalPresentToday: filteredEmployees.filter(emp => manualAttendanceData[emp.id]?.[format(new Date(), 'yyyy-MM-dd')] === 'Present').length,
    totalAbsentToday: filteredEmployees.filter(emp => manualAttendanceData[emp.id]?.[format(new Date(), 'yyyy-MM-dd')] === 'Absent').length,
    onAnnualLeaveToday: filteredEmployees.filter(emp => manualAttendanceData[emp.id]?.[format(new Date(), 'yyyy-MM-dd')] === 'Annual Leave').length,
    onSickLeaveToday: filteredEmployees.filter(emp => manualAttendanceData[emp.id]?.[format(new Date(), 'yyyy-MM-dd')] === 'Sick Leave').length,
    unaccounted: filteredEmployees.length - (filteredEmployees.filter(emp => ['Present', 'Absent', 'Annual Leave', 'Sick Leave'].includes(manualAttendanceData[emp.id]?.[format(new Date(), 'yyyy-MM-dd')] as AttendanceStatus)).length),
    totalOnLeaveToday: filteredEmployees.filter(emp => ['Annual Leave', 'Sick Leave'].includes(manualAttendanceData[emp.id]?.[format(new Date(), 'yyyy-MM-dd')] as AttendanceStatus)).length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* New flex container for header elements */}
      <div className="flex justify-between items-center mb-6">
         <PageHeader
            title="Attendance Management"
            description="Track employee attendance, check-ins, check-outs, and manage leave."
          />
          {attendanceMode === 'manual' && (
            <div> {/* Wrapper div for date */}
              <h3 className="text-lg font-semibold text-center">
                {format(currentDate, 'EEEE, MMM dd, yyyy')}
              </h3>
            </div>
          )}
      </div>

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
            <CardTitle className="text-sm font-medium">Sick Leave Today</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isDataLoading ? <Skeleton className="h-8 w-12" /> : kpis.onSickLeaveToday}</div>
             <p className="text-xs text-muted-foreground">Currently on sick leave</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Leave Today</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2"> {/* Adjusted padding */}
            <div className="text-2xl font-bold">{isDataLoading ? <Skeleton className="h-8 w-12" /> : kpis.onAnnualLeaveToday}</div>
             <p className="text-xs text-muted-foreground">Currently on annual leave</p>
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
                        <TableHead key={day.toISOString()} className="text-center px-2 text-sm">{format(day, 'EEE')}</TableHead> // Still showing all days for skeleton
                      ))}
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
                      {attendanceMode === 'manual' && (
                         <TableHead className="text-center px-2 text-sm min-w-[250px]"> {/* Adjusted width for checkboxes */}
                          Attendance Status ({format(currentDate, 'MMM dd')})
                        </TableHead>
                      )}
                      {attendanceMode === 'automatic' && <TableHead className="px-2 text-sm">Status</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee, empIndex) => (
                      <TableRow key={employee.id} className={cn(empIndex % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                        {/* Common Employee Details Columns */}
                        <TableCell className="px-2 text-xs">{employee.employeeId}</TableCell>
                        <TableCell className="px-2 text-xs">{employee.name}</TableCell>
                        <TableCell className="px-2 text-xs">{employee.department}</TableCell>
                        <TableCell className="px-2 text-xs">{employee.designation}</TableCell>
                        {attendanceMode === 'manual' && daysOfWeek.map(day => {
                          // In Manual mode, only show column for the current date
                          if (!isSameDay(day, currentDate)) return null;

                          const dateString = format(day, 'yyyy-MM-dd');
                          // Fetch current status, defaults to undefined if not set
                          const currentStatus = manualAttendanceData[employee.id]?.[dateString];

                          return (
                            <TableCell key={day.toISOString()} className="text-center px-2 py-1">
                              {/* Replaced RadioGroup with Checkboxes */}
                              <div className="flex flex-wrap gap-2 justify-center">
                                {/* Present Checkbox */}
                                <div className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`att-${employee.id}-${dateString}-present`}
                                    checked={currentStatus === 'Present'}
                                    onCheckedChange={(isChecked: boolean) => handleManualAttendanceChange(employee.id, day, 'Present', isChecked)}
                                  />
                                  <Label htmlFor={`att-${employee.id}-${dateString}-present`} className="text-xs">Present</Label>
                                </div>
                                {/* Absent Checkbox */}
                                <div className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`att-${employee.id}-${dateString}-absent`}
                                    checked={currentStatus === 'Absent'}
                                    onCheckedChange={(isChecked: boolean) => handleManualAttendanceChange(employee.id, day, 'Absent', isChecked)}
                                  />
                                  <Label htmlFor={`att-${employee.id}-${dateString}-absent`} className="text-xs">Absent</Label>
                                </div>
                                {/* Annual Leave Checkbox */}
                                <div className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`att-${employee.id}-${dateString}-annual-leave`}
                                    checked={currentStatus === 'Annual Leave'}
                                    onCheckedChange={(isChecked: boolean) => handleManualAttendanceChange(employee.id, day, 'Annual Leave', isChecked)}
                                  />
                                  <Label htmlFor={`att-${employee.id}-${dateString}-annual-leave`} className="text-xs whitespace-nowrap">Annual Leave</Label>
                                </div>
                                {/* Sick Leave Checkbox */}
                                <div className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`att-${employee.id}-${dateString}-sick-leave`}
                                    checked={currentStatus === 'Sick Leave'}
                                    onCheckedChange={(isChecked: boolean) => handleManualAttendanceChange(employee.id, day, 'Sick Leave', isChecked)}
                                  />
                                  <Label htmlFor={`att-${employee.id}-${dateString}-sick-leave`} className="text-xs whitespace-nowrap">Sick Leave</Label>
                                </div>
                              </div>
                            </TableCell>
                          );
                        })}
                        {attendanceMode === 'automatic' && (
                          <TableCell className="px-2 text-xs">
                            {/* Placeholder for automatic status */}
                            <div className="flex items-center justify-center text-muted-foreground italic">
                                <CircleDot className="mr-1 h-3 w-3" /> Awaiting Biometric Data
                            </div>
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
