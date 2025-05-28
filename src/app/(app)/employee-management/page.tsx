
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
  const [employees, setEmployees] = useState<Employee[]>([
    { id: '1', employeeId: 'EMP001', name: 'John Michael Doe', nationality: 'American', department: 'Sales & Marketing', designation: 'Senior Sales Manager', joiningDate: '2022-01-15', nationalId: '12345678901234', iqamaNumber: '2345678901', iqamaExpiryDate: '2025-12-31', passportNumber: 'ABC12345XYZ', passportExpiryDate: '2030-05-20', mobileNumber: '+1-123-456-7890', email: 'john.doe@example.com', salary: '15000', salaryNumber: 'SAL001', medicalInsuranceNumber: 'MEDINS12345', socialInsuranceNumber: 'SOCSEC67890' },
    { id: '2', employeeId: 'EMP002', name: 'Jane Alice Smith', nationality: 'British', department: 'Operations', designation: 'Logistics Coordinator', joiningDate: '2023-03-10', nationalId: '09876543210987', iqamaNumber: '', iqamaExpiryDate: '', passportNumber: 'DEF67890ABC', passportExpiryDate: '2028-11-15', mobileNumber: '+44-987-654-3210', email: 'jane.smith@example.com', salary: '12000', salaryNumber: 'SAL002', medicalInsuranceNumber: 'MEDINS67890', socialInsuranceNumber: 'SOCSEC11223' },
  ]);

  // Add 10 more mock employees
  useState<Employee[]>([
    ...employees,
    { id: generateRandomId(), employeeId: generateUniqueEmployeeId(employees.map(e => e.employeeId)), name: 'Carlos Eduardo Garcia', nationality: 'Mexican', department: 'Engineering', designation: 'Software Developer', joiningDate: '2021-07-01', nationalId: '98765432109876', iqamaNumber: '3456789012', iqamaExpiryDate: '2026-08-25', passportNumber: 'GHI12345JKL', passportExpiryDate: '2031-02-10', mobileNumber: '+52-55-1234-5678', email: 'carlos.garcia@example.com', salary: '18000', salaryNumber: 'SAL003', medicalInsuranceNumber: 'MEDINS98765', socialInsuranceNumber: 'SOCSEC44556' },
    { id: generateRandomId(), employeeId: generateUniqueEmployeeId(employees.map(e => e.employeeId)), name: 'Fatima Zahra Al Farsi', nationality: 'Saudi Arabian', department: 'Human Resources', designation: 'HR Specialist', joiningDate: '2022-11-20', nationalId: '10112233445566', iqamaNumber: '4567890123', iqamaExpiryDate: '2027-01-15', passportNumber: null, passportExpiryDate: null, mobileNumber: '+966-50-1234567', email: 'fatima.alfarsi@example.com', salary: '14000', salaryNumber: 'SAL004', medicalInsuranceNumber: 'MEDINS11223', socialInsuranceNumber: 'SOCSEC77889' },
    { id: generateRandomId(), employeeId: generateUniqueEmployeeId(employees.map(e => e.employeeId)), name: 'Chen Wei', nationality: 'Chinese', department: 'Finance', designation: 'Accountant', joiningDate: '2023-05-18', nationalId: '13579246801357', iqamaNumber: '5678901234', iqamaExpiryDate: '2025-09-30', passportNumber: 'MNO45678PQR', passportExpiryDate: '2029-06-01', mobileNumber: '+86-10-9876-5432', email: 'chen.wei@example.com', salary: '16000', salaryNumber: 'SAL005', medicalInsuranceNumber: 'MEDINS33445', socialInsuranceNumber: 'SOCSEC99001' },
    { id: generateRandomId(), employeeId: generateUniqueEmployeeId(employees.map(e => e.employeeId)), name: 'Maria Rodriguez', nationality: 'Spanish', department: 'Sales & Marketing', designation: 'Marketing Specialist', joiningDate: '2024-01-05', nationalId: '24680135792468', iqamaNumber: '6789012345', iqamaExpiryDate: '2028-04-10', passportNumber: 'STU78901VWX', passportExpiryDate: '2033-10-25', mobileNumber: '+34-6-12345678', email: 'maria.rodriguez@example.com', salary: '13000', salaryNumber: 'SAL006', medicalInsuranceNumber: 'MEDINS55667', socialInsuranceNumber: 'SOCSEC22334' },
    { id: generateRandomId(), employeeId: generateUniqueEmployeeId(employees.map(e => e.employeeId)), name: 'Ahmed Hassan', nationality: 'Egyptian', department: 'IT', designation: 'Network Administrator', joiningDate: '2021-09-01', nationalId: '36914725803691', iqamaNumber: null, iqamaExpiryDate: null, passportNumber: 'YZA01234BCD', passportExpiryDate: '2030-12-31', mobileNumber: '+20-10-12345678', email: 'ahmed.hassan@example.com', salary: '17000', salaryNumber: 'SAL007', medicalInsuranceNumber: 'MEDINS77889', socialInsuranceNumber: 'SOCSEC55667' },
    { id: generateRandomId(), employeeId: generateUniqueEmployeeId(employees.map(e => e.employeeId)), name: 'Sophia Anderson', nationality: 'Australian', department: 'Customer Service', designation: 'Customer Support Representative', joiningDate: '2023-07-12', nationalId: '48159263704815', iqamaNumber: '7890123456', iqamaExpiryDate: '2027-11-05', passportNumber: 'EFG34567HIJ', passportExpiryDate: '2032-03-18', mobileNumber: '+61-4-1234-5678', email: 'sophia.anderson@example.com', salary: '11000', salaryNumber: 'SAL008', medicalInsuranceNumber: 'MEDINS88990', socialInsuranceNumber: 'SOCSEC11223' },
    { id: generateRandomId(), employeeId: generateUniqueEmployeeId(employees.map(e => e.employeeId)), name: 'Hiroshi Tanaka', nationality: 'Japanese', department: 'Engineering', designation: 'Mechanical Engineer', joiningDate: '2022-04-25', nationalId: '59370148265937', iqamaNumber: '8901234567', iqamaExpiryDate: '2026-06-20', passportNumber: 'KLM67890NOL', passportExpiryDate: '2031-09-14', mobileNumber: '+81-90-1234-5678', email: 'hiroshi.tanaka@example.com', salary: '19000', salaryNumber: 'SAL009', medicalInsuranceNumber: 'MEDINS00112', socialInsuranceNumber: 'SOCSEC33445' },
    { id: generateRandomId(), employeeId: generateUniqueEmployeeId(employees.map(e => e.employeeId)), name: 'Priya Sharma', nationality: 'Indian', department: 'Finance', designation: 'Financial Analyst', joiningDate: '2024-02-14', nationalId: '60581937426058', iqamaNumber: null, iqamaExpiryDate: null, passportNumber: 'PQR90123STU', passportExpiryDate: '2034-07-01', mobileNumber: '+91-98765-43210', email: 'priya.sharma@example.com', salary: '15500', salaryNumber: 'SAL010', medicalInsuranceNumber: 'MEDINS22334', socialInsuranceNumber: 'SOCSEC66778' },
    { id: generateRandomId(), employeeId: generateUniqueEmployeeId(employees.map(e => e.employeeId)), name: 'David Lee', nationality: 'South Korean', department: 'IT', designation: 'Systems Administrator', joiningDate: '2023-09-10', nationalId: '71793058647179', iqamaNumber: '9012345678', iqamaExpiryDate: '2028-12-10', passportNumber: 'VWX23456YZA', passportExpiryDate: '2033-05-22', mobileNumber: '+82-10-1234-5678', email: 'david.lee@example.com', salary: '17500', salaryNumber: 'SAL011', medicalInsuranceNumber: 'MEDINS44556', socialInsuranceNumber: 'SOCSEC88990' },
    { id: generateRandomId(), employeeId: generateUniqueEmployeeId(employees.map(e => e.employeeId)), name: 'Aisha Khan', nationality: 'Pakistani', department: 'Operations', designation: 'Supply Chain Manager', joiningDate: '2022-06-01', nationalId: '82904169758290', iqamaNumber: '0123456789', iqamaExpiryDate: '2026-03-01', passportNumber: null, passportExpiryDate: null, mobileNumber: '+92-300-1234567', email: 'aisha.khan@example.com', salary: '20000', salaryNumber: 'SAL012', medicalInsuranceNumber: 'MEDINS66778', socialInsuranceNumber: 'SOCSEC00112' },
  ]);

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
