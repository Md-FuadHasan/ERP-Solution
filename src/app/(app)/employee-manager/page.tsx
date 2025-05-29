
'use client';

import { useState, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Users, UserPlus, Clock, Search, Filter, MoreHorizontal, PlusCircle, Briefcase, Edit, Trash2, Eye } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription as FormDialogDescription,
    DialogFooter,
  } from '@/components/ui/dialog';
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription as AlertDialogDesc,
    AlertDialogFooter as AlertDialogFooterComponent,
    AlertDialogHeader as AlertDialogHeaderComponent,
    AlertDialogTitle as AlertDialogTitleComponent,
  } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input'; // Added Input import
import { Label } from '@/components/ui/label';
import { cn } from "@/lib/utils";
import { DataPlaceholder } from '@/components/common/data-placeholder';
import { useToast } from '@/hooks/use-toast';
import { SearchInput } from '@/components/common/search-input';
import type { Employee } from '@/types';
import { useData } from '@/context/DataContext';


const initialEmployeeFormState: Employee = {
  id: '', employeeId: '', name: '', nationality: '', department: '', designation: '',
  joiningDate: '', nationalId: '', iqamaNumber: '', iqamaExpiryDate: '',
  passportNumber: '', passportExpiryDate: '', mobileNumber: '', email: '',
  salary: '', salaryNumber: '', medicalInsuranceNumber: '', socialInsuranceNumber: '',
};


export default function EmployeeManagerPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, isLoading } = useData();
  const [activeTab, setActiveTab] = useState('employee-directory');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState<Employee>(initialEmployeeFormState);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleOpenAddModal = useCallback(() => {
    setEditingEmployee(null);
    setFormData(initialEmployeeFormState);
    setIsFormModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((employee: Employee) => {
    setEditingEmployee(employee);
    setFormData(employee);
    setIsFormModalOpen(true);
  }, []);

  const handleOpenViewModal = useCallback((employee: Employee) => {
    setViewingEmployee(employee);
    setIsViewModalOpen(true);
  }, []);

  const handleDeleteEmployeeConfirm = useCallback((employee: Employee) => {
    setEmployeeToDelete(employee);
  }, []);

  const handleAddOrUpdateEmployee = () => {
    if (!formData.name || !formData.department || !formData.nationalId || !formData.mobileNumber || !formData.salary || !formData.medicalInsuranceNumber || !formData.socialInsuranceNumber) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    if (editingEmployee) {
      updateEmployee({ ...formData, id: editingEmployee.id });
      toast({ title: "Employee Updated", description: `${formData.name}'s details have been updated.` });
    } else {
      const newEmployeeId = formData.employeeId || `EMP${String(Date.now()).slice(-4)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;
      // Ensure all fields from Employee type are present, even if some are optional in the form initially
      const newEmployeeWithGeneratedId: Employee = {
        ...initialEmployeeFormState, // Start with all fields from the base state
        ...formData,                // Overlay with current form data
        id: Date.now().toString(),  // Generate a unique ID for the employee object itself
        employeeId: newEmployeeId,  // Use the generated or provided employee ID
        status: formData.status || 'Active', // Default status if not set
      };
      addEmployee(newEmployeeWithGeneratedId);
      toast({ title: "Employee Added", description: `${newEmployeeWithGeneratedId.name} has been successfully added.` });
    }
    setIsFormModalOpen(false);
    setFormData(initialEmployeeFormState);
    setEditingEmployee(null);
  };

  const confirmDelete = useCallback(() => {
    if (employeeToDelete) {
      deleteEmployee(employeeToDelete.id);
      toast({ title: "Employee Deleted", description: `${employeeToDelete.name} has been removed.` });
      setEmployeeToDelete(null);
    }
  }, [employeeToDelete, deleteEmployee, toast]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
            employee.name.toLowerCase().includes(lowerSearchTerm) ||
            employee.employeeId.toLowerCase().includes(lowerSearchTerm) ||
            (employee.department && employee.department.toLowerCase().includes(lowerSearchTerm)) ||
            (employee.designation && employee.designation.toLowerCase().includes(lowerSearchTerm))
        );
    });
  }, [employees, searchTerm]);


  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Employee Management"
          description="Manage your workforce and track employee information."
          actions={
            <Button onClick={handleOpenAddModal}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
             <p className="text-xs text-muted-foreground">Count of all active and inactive staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.filter(e => e.status === 'Active').length}</div>
             <p className="text-xs text-muted-foreground">{employees.length > 0 ? ((employees.filter(e => e.status === 'Active').length / employees.length) * 100).toFixed(1) : 0}% of total</p>
          </CardContent>
        </Card>
       <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
            <CardTitle className="text-sm font-medium">New Hires (MTD)</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">+0 this week</p> {/* Placeholder */}
          </CardContent>
       </Card>
       <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnover Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Monthly placeholder</p> {/* Placeholder */}
         </CardContent>
        </Card>
      </div>


      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-grow flex flex-col px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 mb-4 shrink-0">
          <TabsTrigger value="employee-directory">Employee Directory</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="hr-analytics">HR Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="employee-directory" className="flex-grow min-h-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <CardTitle>Employee List</CardTitle>
                    <CardDescription>Overview of all current employees.</CardDescription>
                </div>
                <div className="flex w-full sm:w-auto items-center space-x-4">
                    <SearchInput
                        placeholder="Search by ID, Name, Department, Designation..."
                        className="w-full sm:w-auto md:w-80"
                        value={searchTerm}
                        onChange={setSearchTerm}
                    />
                </div>
              </div>
            </CardHeader>
            <div className="flex-grow min-h-0 overflow-hidden">
                <div className="h-full overflow-y-auto">
                  {isLoading ? (
                     <div className="p-6">
                       <DataPlaceholder icon={Briefcase} title="Loading Employees..." message="Please wait while employee data is being fetched." />
                     </div>
                  ) : filteredEmployees.length > 0 ? (
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                        <TableRow>
                          <TableHead className="px-2 text-sm">ID</TableHead>
                          <TableHead className="px-2 text-sm">Name</TableHead>
                          <TableHead className="px-2 text-sm">Department</TableHead>
                          <TableHead className="px-2 text-sm">Designation</TableHead>
                          <TableHead className="px-2 text-sm">Joining Date</TableHead>
                          <TableHead className="text-center px-2 text-sm min-w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.map((employee, index) => (
                          <TableRow key={employee.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                            <TableCell className="font-medium px-2 text-xs">{employee.employeeId}</TableCell>
                            <TableCell className="px-2 text-xs">{employee.name}</TableCell>
                            <TableCell className="px-2 text-xs">{employee.department}</TableCell>
                            <TableCell className="px-2 text-xs">{employee.designation}</TableCell>
                            <TableCell className="px-2 text-xs">{employee.joiningDate}</TableCell>
                            <TableCell className="text-center px-2 text-xs">
                              <div className="flex justify-center items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenViewModal(employee)} className="hover:text-primary p-1.5" title="View Employee"><Eye className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(employee)} className="hover:text-primary p-1.5" title="Edit Employee"><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteEmployeeConfirm(employee)} className="hover:text-destructive p-1.5" title="Delete Employee"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="h-full flex items-center justify-center p-6">
                      <DataPlaceholder
                        icon={Briefcase}
                        title={searchTerm ? "No Employees Found" : "No Employees Added Yet"}
                        message={searchTerm ? "Try adjusting your search term." : "Get started by adding your first employee."}
                        action={!searchTerm ? (<Button onClick={handleOpenAddModal}><PlusCircle className="mr-2 h-4 w-4" /> Add Employee</Button>) : undefined}
                      />
                    </div>
                  )}
                </div>
            </div>
          </Card>
        </TabsContent>
         <TabsContent value="departments" className="flex-grow min-h-0">
           <Card className="h-full flex flex-col">
             <CardHeader>
               <CardTitle>Department Overview</CardTitle>
               <CardDescription>Distribution of employees across departments.</CardDescription>
             </CardHeader>
             <CardContent className="flex-grow overflow-y-auto">
               <DataPlaceholder
                 icon={Users}
                 title="Department Analytics Coming Soon"
                 message="Detailed departmental breakdowns, charts, and reports will be available here."
               />
             </CardContent>
           </Card>
         </TabsContent>
         <TabsContent value="hr-analytics" className="flex-grow min-h-0">
           <Card className="h-full flex flex-col">
             <CardHeader>
               <CardTitle>HR Analytics</CardTitle>
               <CardDescription>Insights into workforce trends and performance metrics.</CardDescription>
             </CardHeader>
             <CardContent className="flex-grow overflow-y-auto">
                <DataPlaceholder
                    icon={Clock}
                    title="HR Analytics & Performance Metrics Coming Soon"
                    message="This section will feature advanced analytics on employee satisfaction, tenure, training completion, and performance ratings."
                />
             </CardContent>
           </Card>
         </TabsContent>
      </Tabs>

      <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => { setIsFormModalOpen(isOpen); if (!isOpen) { setFormData(initialEmployeeFormState); setEditingEmployee(null); }}}>
        <DialogContent className="w-[90vw] sm:max-w-xl md:max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            <FormDialogDescription>{editingEmployee ? 'Update details for this employee.' : 'Enter details for the new employee.'}</FormDialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            <details open className="space-y-4 p-4 border rounded-lg shadow-sm">
                <summary className="text-lg font-semibold text-primary cursor-pointer">Basic Information</summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
                    <div className="space-y-1"><Label htmlFor="employeeId">Employee ID</Label><Input id="employeeId" value={formData.employeeId} onChange={handleInputChange} placeholder="Auto-generates if empty" /></div>
                    <div className="space-y-1"><Label htmlFor="name">Employee Name *</Label><Input id="name" value={formData.name} onChange={handleInputChange} required /></div>
                    <div className="space-y-1"><Label htmlFor="nationality">Nationality *</Label><Input id="nationality" value={formData.nationality} onChange={handleInputChange} required /></div>
                    <div className="space-y-1"><Label htmlFor="department">Department *</Label><Input id="department" value={formData.department} onChange={handleInputChange} required /></div>
                    <div className="space-y-1"><Label htmlFor="designation">Designation *</Label><Input id="designation" value={formData.designation} onChange={handleInputChange} required /></div>
                    <div className="space-y-1"><Label htmlFor="joiningDate">Joining Date *</Label><Input id="joiningDate" type="date" value={formData.joiningDate} onChange={handleInputChange} required /></div>
                </div>
            </details>

            <details className="space-y-4 p-4 border rounded-lg shadow-sm">
                <summary className="text-lg font-semibold text-primary cursor-pointer">Identification</summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
                    <div className="space-y-1"><Label htmlFor="nationalId">National ID *</Label><Input id="nationalId" value={formData.nationalId} onChange={handleInputChange} required /></div>
                    <div className="space-y-1"><Label htmlFor="iqamaNumber">Iqama Number</Label><Input id="iqamaNumber" value={formData.iqamaNumber || ''} onChange={handleInputChange} /></div>
                    <div className="space-y-1"><Label htmlFor="iqamaExpiryDate">Iqama Expiry Date</Label><Input id="iqamaExpiryDate" type="date" value={formData.iqamaExpiryDate || ''} onChange={handleInputChange} /></div>
                    <div className="space-y-1"><Label htmlFor="passportNumber">Passport Number</Label><Input id="passportNumber" value={formData.passportNumber || ''} onChange={handleInputChange} /></div>
                    {formData.passportNumber && (<div className="space-y-1"><Label htmlFor="passportExpiryDate">Passport Expiry Date</Label><Input id="passportExpiryDate" type="date" value={formData.passportExpiryDate || ''} onChange={handleInputChange} /></div>)}
                </div>
            </details>

            <details className="space-y-4 p-4 border rounded-lg shadow-sm">
                <summary className="text-lg font-semibold text-primary cursor-pointer">Contact Details</summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
                    <div className="space-y-1"><Label htmlFor="mobileNumber">Mobile Number *</Label><Input id="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} required /></div>
                    <div className="space-y-1"><Label htmlFor="email">Email Address</Label><Input id="email" type="email" value={formData.email || ''} onChange={handleInputChange} /></div>
                </div>
            </details>

            <details className="space-y-4 p-4 border rounded-lg shadow-sm">
                <summary className="text-lg font-semibold text-primary cursor-pointer">Compensation & Insurance</summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
                    <div className="space-y-1"><Label htmlFor="salary">Salary *</Label><Input id="salary" type="number" value={formData.salary} onChange={handleInputChange} required /></div>
                    <div className="space-y-1"><Label htmlFor="salaryNumber">Salary Number *</Label><Input id="salaryNumber" value={formData.salaryNumber} onChange={handleInputChange} required /></div>
                    <div className="space-y-1"><Label htmlFor="medicalInsuranceNumber">Medical Insurance No. *</Label><Input id="medicalInsuranceNumber" value={formData.medicalInsuranceNumber} onChange={handleInputChange} required /></div>
                    <div className="space-y-1"><Label htmlFor="socialInsuranceNumber">Social Insurance No. *</Label><Input id="socialInsuranceNumber" value={formData.socialInsuranceNumber} onChange={handleInputChange} required /></div>
                </div>
            </details>
          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setIsFormModalOpen(false); setFormData(initialEmployeeFormState); setEditingEmployee(null); }}>Cancel</Button>
            <Button onClick={handleAddOrUpdateEmployee}>{editingEmployee ? 'Save Changes' : 'Add Employee'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={(isOpen) => { setIsViewModalOpen(isOpen); if (!isOpen) setViewingEmployee(null); }}>
        <DialogContent className="w-[90vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Employee Details: {viewingEmployee?.name}</DialogTitle>
            <FormDialogDescription>Full profile information for the selected employee.</FormDialogDescription>
          </DialogHeader>
          {viewingEmployee && (
            <div className="flex-grow overflow-y-auto p-6 space-y-5 text-sm">
              <section><h4 className="text-md font-semibold mb-2 text-primary border-b pb-1">Basic Information</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><strong>Employee ID:</strong></div><div>{viewingEmployee.employeeId}</div>
                  <div><strong>Name:</strong></div><div>{viewingEmployee.name}</div>
                  <div><strong>Nationality:</strong></div><div>{viewingEmployee.nationality}</div>
                  <div><strong>Department:</strong></div><div>{viewingEmployee.department}</div>
                  <div><strong>Designation:</strong></div><div>{viewingEmployee.designation}</div>
                  <div><strong>Joining Date:</strong></div><div>{viewingEmployee.joiningDate}</div>
                </div>
              </section>
              <section><h4 className="text-md font-semibold mb-2 text-primary border-b pb-1">Identification</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><strong>National ID:</strong></div><div>{viewingEmployee.nationalId}</div>
                  <div><strong>Iqama Number:</strong></div><div>{viewingEmployee.iqamaNumber || 'N/A'}</div>
                  <div><strong>Iqama Expiry:</strong></div><div>{viewingEmployee.iqamaExpiryDate || 'N/A'}</div>
                  <div><strong>Passport Number:</strong></div><div>{viewingEmployee.passportNumber || 'N/A'}</div>
                  <div><strong>Passport Expiry:</strong></div><div>{viewingEmployee.passportExpiryDate || 'N/A'}</div>
                </div>
              </section>
              <section><h4 className="text-md font-semibold mb-2 text-primary border-b pb-1">Contact Details</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><strong>Mobile Number:</strong></div><div>{viewingEmployee.mobileNumber}</div>
                  <div><strong>Email:</strong></div><div>{viewingEmployee.email || 'N/A'}</div>
                </div>
              </section>
              <section><h4 className="text-md font-semibold mb-2 text-primary border-b pb-1">Compensation & Insurance</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><strong>Salary:</strong></div><div>{viewingEmployee.salary}</div>
                  <div><strong>Salary Number:</strong></div><div>{viewingEmployee.salaryNumber}</div>
                  <div><strong>Medical Insurance:</strong></div><div>{viewingEmployee.medicalInsuranceNumber}</div>
                  <div><strong>Social Insurance:</strong></div><div>{viewingEmployee.socialInsuranceNumber}</div>
                </div>
              </section>
            </div>
          )}
          <DialogFooter className="p-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!employeeToDelete} onOpenChange={(isOpen) => !isOpen && setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent>Are you sure?</AlertDialogTitleComponent>
            <AlertDialogDesc>
              This action cannot be undone. This will permanently delete the employee "{employeeToDelete?.name}".
            </AlertDialogDesc>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancel onClick={() => setEmployeeToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooterComponent>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    