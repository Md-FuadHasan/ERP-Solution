
'use client';
import { useState, useCallback } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Edit, Trash2, Eye, PlusCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from "@/lib/utils";
import { DataPlaceholder } from '@/components/common/data-placeholder';
import { useToast } from '@/hooks/use-toast'; // Import useToast

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  nationality: string;
  department: string;
  designation: string;
  joiningDate: string;
  nationalId: string;
  iqamaNumber?: string;
  iqamaExpiryDate?: string;
  passportNumber?: string;
  passportExpiryDate?: string;
  mobileNumber: string;
  email?: string;
  salary: string;
  salaryNumber: string;
  medicalInsuranceNumber: string;
  socialInsuranceNumber: string;
}

const initialEmployeeFormState: Employee = {
  id: '', employeeId: '', name: '', nationality: '', department: '', designation: '',
  joiningDate: '', nationalId: '', iqamaNumber: '', iqamaExpiryDate: '',
  passportNumber: '', passportExpiryDate: '', mobileNumber: '', email: '', 
  salary: '', salaryNumber: '', medicalInsuranceNumber: '', socialInsuranceNumber: '',
};

// Helper to generate a random ID
const generateRandomId = () => String(Date.now()).slice(-6) + String(Math.floor(Math.random() * 1000)).padStart(3, '0');

// Helper to generate a unique employee ID
const generateUniqueEmployeeId = (existingIds: string[]) => {
  let id;
  do { id = `EMP${String(Date.now()).slice(-4)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`; } while (existingIds.includes(id));
  return id;
};

export default function EmployeeManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [employeeFormData, setEmployeeFormData] = useState<Employee>(initialEmployeeFormState);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEmployeeFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleAddOrUpdateEmployee = () => {
    if (!employeeFormData.name || !employeeFormData.department || !employeeFormData.nationalId || !employeeFormData.mobileNumber || !employeeFormData.salary || !employeeFormData.medicalInsuranceNumber || !employeeFormData.socialInsuranceNumber) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    if (editingEmployee) {
      setEmployees(prevEmployees => prevEmployees.map(emp => emp.id === editingEmployee.id ? { ...employeeFormData, id: editingEmployee.id } : emp));
      toast({ title: "Employee Updated", description: `${employeeFormData.name}'s details have been updated.` });
    } else {
      const newEmployeeId = employeeFormData.employeeId || `EMP${String(Date.now()).slice(-4)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;
      const newEmployee: Employee = { ...employeeFormData, id: Date.now().toString(), employeeId: newEmployeeId };
      setEmployees(prevEmployees => [newEmployee, ...prevEmployees]);
      toast({ title: "Employee Added", description: `${newEmployee.name} has been successfully added.` });
    }
    setIsFormModalOpen(false);
    setEmployeeFormData(initialEmployeeFormState);
    setEditingEmployee(null);
  };

  const openAddModal = useCallback(() => {
    setEditingEmployee(null);
    setEmployeeFormData(initialEmployeeFormState);
    setIsFormModalOpen(true);
  }, []);

  const openEditModal = useCallback((employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeFormData(employee);
    setIsFormModalOpen(true);
  }, []);

  const openViewModal = useCallback((employee: Employee) => {
    setViewingEmployee(employee);
    setIsViewModalOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (employeeToDelete) {
      setEmployees(prev => prev.filter(emp => emp.id !== employeeToDelete.id));
      toast({ title: "Employee Deleted", description: `${employeeToDelete.name} has been removed.` });
      setEmployeeToDelete(null);
    }
  }, [employeeToDelete, toast]);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Employee Management"
          description="Manage employee profiles, roles, and HR-related tasks."
          actions={
            <Button onClick={openAddModal}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Employee
            </Button>
          }
        />
      </div>

      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 mb-4 md:mb-6 lg:mb-8">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5 text-primary" />
            Employee Hub
          </CardTitle>
          <CardDescription>Overview of all current employees.</CardDescription>
        </CardHeader>
        <div className="h-full overflow-y-auto">
          {employees.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="px-2 text-sm font-semibold">ID</TableHead>
                  <TableHead className="px-2 text-sm font-semibold">Name</TableHead>
                  <TableHead className="px-2 text-sm font-semibold">Department</TableHead>
                  <TableHead className="px-2 text-sm font-semibold">Designation</TableHead>
                  <TableHead className="px-2 text-sm font-semibold">Joining Date</TableHead>
                  <TableHead className="text-center px-2 text-sm font-semibold min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee, index) => (
                  <TableRow key={employee.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell className="font-medium px-2 text-xs">{employee.employeeId}</TableCell>
                    <TableCell className="px-2 text-xs">{employee.name}</TableCell>
                    <TableCell className="px-2 text-xs">{employee.department}</TableCell>
                    <TableCell className="px-2 text-xs">{employee.designation}</TableCell>
                    <TableCell className="px-2 text-xs">{employee.joiningDate}</TableCell>
                    <TableCell className="text-center px-2 text-xs">
                      <div className="flex justify-center items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openViewModal(employee)} className="hover:text-primary p-1.5" title="View Employee"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(employee)} className="hover:text-primary p-1.5" title="Edit Employee"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setEmployeeToDelete(employee)} className="hover:text-destructive p-1.5" title="Delete Employee"><Trash2 className="h-4 w-4" /></Button>
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
                title="No Employees Found"
                message="Get started by adding your first employee."
                action={<Button onClick={openAddModal}><PlusCircle className="mr-2 h-4 w-4" /> Add Employee</Button>}
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4 md:p-6 lg:p-8 pt-0">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{employees.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Employees by Dept. (Coming Soon)</CardTitle></CardHeader>
          <CardContent><div className="h-32 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">Pie Chart Placeholder</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Joining Trend (Coming Soon)</CardTitle></CardHeader>
          <CardContent><div className="h-32 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">Bar Chart Placeholder</div></CardContent>
        </Card>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => { setIsFormModalOpen(isOpen); if (!isOpen) { setEmployeeFormData(initialEmployeeFormState); setEditingEmployee(null); }}}>
        <DialogContent className="w-[90vw] sm:max-w-xl md:max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            <FormDialogDescription>{editingEmployee ? 'Update details for this employee.' : 'Enter details for the new employee.'}</FormDialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            
            <section>
              <h3 className="text-lg font-semibold mb-3 border-b pb-2 text-primary">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1"><Label htmlFor="employeeId">Employee ID</Label><Input id="employeeId" value={employeeFormData.employeeId} onChange={handleInputChange} placeholder="Auto-generates if empty" /></div>
                <div className="space-y-1"><Label htmlFor="name">Employee Name *</Label><Input id="name" value={employeeFormData.name} onChange={handleInputChange} required /></div>
                <div className="space-y-1"><Label htmlFor="nationality">Nationality *</Label><Input id="nationality" value={employeeFormData.nationality} onChange={handleInputChange} required /></div>
                <div className="space-y-1"><Label htmlFor="department">Department *</Label><Input id="department" value={employeeFormData.department} onChange={handleInputChange} required /></div>
                <div className="space-y-1"><Label htmlFor="designation">Designation *</Label><Input id="designation" value={employeeFormData.designation} onChange={handleInputChange} required /></div>
                <div className="space-y-1"><Label htmlFor="joiningDate">Joining Date *</Label><Input id="joiningDate" type="date" value={employeeFormData.joiningDate} onChange={handleInputChange} required /></div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3 border-b pb-2 text-primary">Identification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1"><Label htmlFor="nationalId">National ID *</Label><Input id="nationalId" value={employeeFormData.nationalId} onChange={handleInputChange} required /></div>
                <div className="space-y-1"><Label htmlFor="iqamaNumber">Iqama Number</Label><Input id="iqamaNumber" value={employeeFormData.iqamaNumber || ''} onChange={handleInputChange} /></div>
                <div className="space-y-1"><Label htmlFor="iqamaExpiryDate">Iqama Expiry Date</Label><Input id="iqamaExpiryDate" type="date" value={employeeFormData.iqamaExpiryDate || ''} onChange={handleInputChange} /></div>
                <div className="space-y-1"><Label htmlFor="passportNumber">Passport Number</Label><Input id="passportNumber" value={employeeFormData.passportNumber || ''} onChange={handleInputChange} /></div>
                {employeeFormData.passportNumber && (<div className="space-y-1"><Label htmlFor="passportExpiryDate">Passport Expiry Date</Label><Input id="passportExpiryDate" type="date" value={employeeFormData.passportExpiryDate || ''} onChange={handleInputChange} /></div>)}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3 border-b pb-2 text-primary">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1"><Label htmlFor="mobileNumber">Mobile Number *</Label><Input id="mobileNumber" value={employeeFormData.mobileNumber} onChange={handleInputChange} required /></div>
                <div className="space-y-1"><Label htmlFor="email">Email Address</Label><Input id="email" type="email" value={employeeFormData.email || ''} onChange={handleInputChange} /></div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3 border-b pb-2 text-primary">Compensation & Insurance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1"><Label htmlFor="salary">Salary *</Label><Input id="salary" type="number" value={employeeFormData.salary} onChange={handleInputChange} required /></div>
                <div className="space-y-1"><Label htmlFor="salaryNumber">Salary Number *</Label><Input id="salaryNumber" value={employeeFormData.salaryNumber} onChange={handleInputChange} required /></div>
                <div className="space-y-1"><Label htmlFor="medicalInsuranceNumber">Medical Insurance No. *</Label><Input id="medicalInsuranceNumber" value={employeeFormData.medicalInsuranceNumber} onChange={handleInputChange} required /></div>
                <div className="space-y-1"><Label htmlFor="socialInsuranceNumber">Social Insurance No. *</Label><Input id="socialInsuranceNumber" value={employeeFormData.socialInsuranceNumber} onChange={handleInputChange} required /></div>
              </div>
            </section>
          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setIsFormModalOpen(false); setEmployeeFormData(initialEmployeeFormState); setEditingEmployee(null); }}>Cancel</Button>
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
