
'use client';
import { useState, useEffect } from 'react';
import type React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Warehouse as WarehouseIcon, Truck } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CompanyDetailsForm, type CompanyDetailsFormValues } from '@/components/forms/company-details-form';
import { TaxSettingsForm, type TaxSettingsFormValues } from '@/components/forms/tax-settings-form';
import { WarehouseForm, type WarehouseFormValues } from '@/components/forms/warehouse-form';
import { SupplierForm, type SupplierFormValues } from '@/components/forms/supplier-form'; // New
import { DataPlaceholder } from '@/components/common/data-placeholder';
import type { CompanyProfile, Manager, Warehouse, Supplier } from '@/types'; // Added Supplier
import { MOCK_MANAGERS } from '@/types';
import { SETTINGS_TABS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Database } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter as AlertDialogFooterComponent,
  AlertDialogHeader as AlertDialogHeaderComponent,
  AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const {
    companyProfile,
    updateCompanyProfile,
    warehouses,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    suppliers, // New
    addSupplier,   // New
    updateSupplier,// New
    deleteSupplier,// New
    isLoading: isDataLoading
  } = useData();

  const [managers, setManagers] = useState<Manager[]>([]);
  const [isUserManagerModalOpen, setIsUserManagerModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerRole, setManagerRole] = useState('');

  const [isWarehouseFormModalOpen, setIsWarehouseFormModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);

  const [isSupplierFormModalOpen, setIsSupplierFormModalOpen] = useState(false); // New
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null); // New
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null); // New

  const [localLoading, setLocalLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedManagers = localStorage.getItem('invoiceflow_managers');
      setManagers(storedManagers ? JSON.parse(storedManagers) : MOCK_MANAGERS);
    } catch (error) {
      console.error("Failed to load managers from localStorage", error);
      setManagers(MOCK_MANAGERS);
    } finally {
      setLocalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localLoading && managers.length > 0) { // Only save if managers array is not empty and not initial load
        localStorage.setItem('invoiceflow_managers', JSON.stringify(managers));
    } else if (!localLoading && managers.length === 0) { // If managers array becomes empty after initial load, clear it
        localStorage.removeItem('invoiceflow_managers');
    }
  }, [managers, localLoading]);


  const handleCompanyDetailsSubmit = (data: CompanyDetailsFormValues) => {
    updateCompanyProfile(data);
    toast({ title: "Company Details Updated", description: "Your company information has been saved." });
  };

  const handleTaxSettingsSubmit = (data: TaxSettingsFormValues) => {
    updateCompanyProfile({
      taxRate: data.taxRate,
      vatRate: data.vatRate,
      excessTaxRate: data.excessTaxRate
    });
    toast({ title: "Tax Settings Updated", description: "Your tax configurations have been saved." });
  };

  const handleAddManager = () => {
    setEditingManager(null); setManagerName(''); setManagerEmail(''); setManagerRole('');
    setIsUserManagerModalOpen(true);
  };
  const handleEditManager = (manager: Manager) => {
    setEditingManager(manager); setManagerName(manager.name); setManagerEmail(manager.email); setManagerRole(manager.role);
    setIsUserManagerModalOpen(true);
  };
  const handleDeleteManager = (managerId: string) => {
    setManagers(managers.filter(m => m.id !== managerId));
    toast({ title: "Manager Removed", description: "The manager has been removed."});
  };
  const handleManagerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerName || !managerEmail || !managerRole) {
      toast({ title: "Missing Information", description: "Please fill all manager details.", variant: "destructive" });
      return;
    }
    if (editingManager) {
      setManagers(managers.map(m => m.id === editingManager.id ? { ...editingManager, name: managerName, email: managerEmail, role: managerRole } : m));
      toast({ title: "Manager Updated", description: `${managerName}'s details updated.`});
    } else {
      setManagers([{ id: `MGR-${Date.now()}`, name: managerName, email: managerEmail, role: managerRole }, ...managers]);
      toast({ title: "Manager Added", description: `${managerName} added.`});
    }
    setIsUserManagerModalOpen(false);
  };

  const handleAddWarehouse = () => { setEditingWarehouse(null); setIsWarehouseFormModalOpen(true); };
  const handleEditWarehouse = (warehouse: Warehouse) => { setEditingWarehouse(warehouse); setIsWarehouseFormModalOpen(true); };
  const handleWarehouseFormSubmit = (data: WarehouseFormValues) => {
    if (editingWarehouse) {
      updateWarehouse({ ...editingWarehouse, ...data });
      toast({ title: "Warehouse Updated", description: `${data.name} updated.` });
    } else {
      addWarehouse({ ...data, id: `WH-${Date.now()}` });
      toast({ title: "Warehouse Added", description: `${data.name} added.` });
    }
    setIsWarehouseFormModalOpen(false); setEditingWarehouse(null);
  };
  const handleDeleteWarehouseConfirm = (warehouse: Warehouse) => { setWarehouseToDelete(warehouse); };
  const confirmDeleteWarehouse = () => {
    if (warehouseToDelete) {
      deleteWarehouse(warehouseToDelete.id);
      toast({ title: "Warehouse Deleted", description: `${warehouseToDelete.name} removed.` });
      setWarehouseToDelete(null);
    }
  };

  // Supplier Handlers - New
  const handleAddSupplier = () => { setEditingSupplier(null); setIsSupplierFormModalOpen(true); };
  const handleEditSupplier = (supplier: Supplier) => { setEditingSupplier(supplier); setIsSupplierFormModalOpen(true); };
  const handleSupplierFormSubmit = (data: SupplierFormValues) => {
    if (editingSupplier) {
      updateSupplier({ ...editingSupplier, ...data, createdAt: editingSupplier.createdAt });
      toast({ title: "Supplier Updated", description: `${data.name} updated.` });
    } else {
      addSupplier({ ...data, id: `SUPP-${Date.now()}`, createdAt: new Date().toISOString() });
      toast({ title: "Supplier Added", description: `${data.name} added.` });
    }
    setIsSupplierFormModalOpen(false); setEditingSupplier(null);
  };
  const handleDeleteSupplierConfirm = (supplier: Supplier) => { setSupplierToDelete(supplier); };
  const confirmDeleteSupplier = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete.id);
      toast({ title: "Supplier Deleted", description: `${supplierToDelete.name} removed.` });
      setSupplierToDelete(null);
    }
  };

  if (isDataLoading || localLoading) {
    return (
      <>
        <PageHeader title="Settings" description="Manage your company profile, tax settings, users, warehouses, suppliers, and data storage." />
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-6">
            {SETTINGS_TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2 text-xs sm:text-sm" disabled>
                <tab.icon className="h-4 w-4" /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </Tabs>
      </>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0">
        <PageHeader title="Settings" description="Manage your company profile, tax settings, users, warehouses, suppliers, and data storage." />
      </div>

      <div className="flex-grow min-h-0">
        <Tabs defaultValue="company" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-6 shrink-0">
            {SETTINGS_TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2 text-xs sm:text-sm">
                <tab.icon className="h-4 w-4" /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-grow min-h-0 overflow-y-auto">
            <TabsContent value="company" className="mt-0">
              <Card>
                <CardHeader><CardTitle>Mother Company Details</CardTitle><CardDescription>Update your company's name, address, and contact information.</CardDescription></CardHeader>
                <CardContent><CompanyDetailsForm initialData={companyProfile!} onSubmit={handleCompanyDetailsSubmit} /></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tax" className="mt-0">
              <Card>
                <CardHeader><CardTitle>Tax Settings</CardTitle><CardDescription>Configure TAX, VAT, and Excess TAX rates for your invoices.</CardDescription></CardHeader>
                <CardContent><TaxSettingsForm initialData={companyProfile!} onSubmit={handleTaxSettingsSubmit} /></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="users" className="mt-0">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-grow"><CardTitle>User Management</CardTitle><CardDescription>Add, edit, or remove managers with custom roles.<br/><small className="text-destructive">Note: Managers cannot delete invoices or customers.</small></CardDescription></div>
                  <Button onClick={handleAddManager} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add Manager</Button>
                </CardHeader>
                <CardContent>
                  {managers.length > 0 ? (
                    <div className="rounded-lg border overflow-x-auto"><Table><TableHeader className="bg-muted"><TableRow><TableHead className="min-w-[150px] px-2">Name</TableHead><TableHead className="min-w-[200px] px-2">Email</TableHead><TableHead className="min-w-[120px] px-2">Role</TableHead><TableHead className="text-right min-w-[100px] px-2">Actions</TableHead></TableRow></TableHeader><TableBody>{managers.map((manager, index) => (<TableRow key={manager.id} className={cn(index % 2 !== 0 ? 'bg-muted/30' : 'bg-card', "hover:bg-primary/10")}><TableCell className="px-2">{manager.name}</TableCell><TableCell className="px-2">{manager.email}</TableCell><TableCell className="px-2">{manager.role}</TableCell><TableCell className="text-right px-2"><div className="flex justify-end items-center gap-1"><Button variant="ghost" size="icon" onClick={() => handleEditManager(manager)} className="hover:text-primary"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteManager(manager.id)} className="hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>))}</TableBody></Table></div>
                  ) : (<DataPlaceholder title="No Managers" message="Add managers to help manage your account." action={<Button onClick={handleAddManager} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0"><PlusCircle className="mr-2 h-4 w-4" /> Add Manager</Button>}/>)}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="warehouses" className="mt-0">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-grow"><CardTitle>Warehouse Management</CardTitle><CardDescription>Manage your storage locations for inventory.</CardDescription></div>
                  <Button onClick={handleAddWarehouse} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add New Warehouse</Button>
                </CardHeader>
                <CardContent>
                  {warehouses.length > 0 ? (
                    <div className="rounded-lg border overflow-x-auto"><Table><TableHeader className="bg-muted"><TableRow><TableHead className="min-w-[100px] px-2">ID</TableHead><TableHead className="min-w-[200px] px-2">Name</TableHead><TableHead className="min-w-[150px] px-2">Location</TableHead><TableHead className="min-w-[150px] px-2">Type</TableHead><TableHead className="text-right min-w-[100px] px-2">Actions</TableHead></TableRow></TableHeader><TableBody>{warehouses.map((warehouse, index) => (<TableRow key={warehouse.id} className={cn(index % 2 !== 0 ? 'bg-muted/30' : 'bg-card', "hover:bg-primary/10")}><TableCell className="px-2">{warehouse.id}</TableCell><TableCell className="px-2">{warehouse.name}</TableCell><TableCell className="px-2">{warehouse.location}</TableCell><TableCell className="px-2">{warehouse.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell><TableCell className="text-right px-2"><div className="flex justify-end items-center gap-1"><Button variant="ghost" size="icon" onClick={() => handleEditWarehouse(warehouse)} className="hover:text-primary"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteWarehouseConfirm(warehouse)} className="hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>))}</TableBody></Table></div>
                  ) : (<DataPlaceholder title="No Warehouses Found" message="Get started by adding your first warehouse." icon={WarehouseIcon} action={<Button onClick={handleAddWarehouse} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0"><PlusCircle className="mr-2 h-4 w-4" /> Add Warehouse</Button>}/>)}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="suppliers" className="mt-0"> {/* New Tab */}
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-grow"><CardTitle>Supplier Management</CardTitle><CardDescription>Manage your vendors and suppliers.</CardDescription></div>
                  <Button onClick={handleAddSupplier} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add New Supplier</Button>
                </CardHeader>
                <CardContent>
                  {suppliers.length > 0 ? (
                    <div className="rounded-lg border overflow-x-auto"><Table><TableHeader className="bg-muted"><TableRow><TableHead className="min-w-[100px] px-2">ID</TableHead><TableHead className="min-w-[200px] px-2">Name</TableHead><TableHead className="min-w-[180px] px-2">Email</TableHead><TableHead className="min-w-[120px] px-2">Phone</TableHead><TableHead className="min-w-[150px] px-2">Contact</TableHead><TableHead className="text-right min-w-[100px] px-2">Actions</TableHead></TableRow></TableHeader><TableBody>{suppliers.map((supplier, index) => (<TableRow key={supplier.id} className={cn(index % 2 !== 0 ? 'bg-muted/30' : 'bg-card', "hover:bg-primary/10")}><TableCell className="px-2">{supplier.id}</TableCell><TableCell className="px-2">{supplier.name}</TableCell><TableCell className="px-2">{supplier.email || '-'}</TableCell><TableCell className="px-2">{supplier.phone || '-'}</TableCell><TableCell className="px-2">{supplier.contactPerson || '-'}</TableCell><TableCell className="text-right px-2"><div className="flex justify-end items-center gap-1"><Button variant="ghost" size="icon" onClick={() => handleEditSupplier(supplier)} className="hover:text-primary"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteSupplierConfirm(supplier)} className="hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>))}</TableBody></Table></div>
                  ) : (<DataPlaceholder title="No Suppliers Found" message="Get started by adding your first supplier." icon={Truck} action={<Button onClick={handleAddSupplier} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0"><PlusCircle className="mr-2 h-4 w-4" /> Add Supplier</Button>}/>)}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="storage" className="mt-0">
              <Card>
                <CardHeader><CardTitle>Data Storage Configuration</CardTitle><CardDescription>Settings for connecting to local storage or SQL database systems.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 rounded-md border border-green-400 bg-green-50 p-4 text-green-700 dark:border-green-600 dark:bg-green-900/30 dark:text-green-300"><Database className="h-6 w-6 text-green-500 dark:text-green-400" /><div><p className="font-medium">Using Local Storage</p><p className="text-sm">Currently, all application data (invoices, customers, products, warehouses, settings) is being stored in your browser's local storage. Changes are persisted across sessions on this device.</p></div></div>
                  <p className="text-muted-foreground">Future versions may allow connecting to persistent cloud database solutions like PostgreSQL, MySQL, or SQL Server for multi-user access and robust data management.</p>
                  <Button disabled className="w-full sm:w-auto">Configure Cloud Database (Coming Soon)</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <Dialog open={isUserManagerModalOpen} onOpenChange={setIsUserManagerModalOpen}>
        <DialogContent className="w-[90vw] max-w-md"><DialogHeader><DialogTitle>{editingManager ? 'Edit Manager' : 'Add New Manager'}</DialogTitle><DialogDescription>{editingManager ? 'Update manager details.' : 'Enter details for the new manager.'}</DialogDescription></DialogHeader><form onSubmit={handleManagerFormSubmit} className="space-y-4 py-4"><div><Label htmlFor="managerName">Name</Label><Input id="managerName" value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="Full Name" /></div><div><Label htmlFor="managerEmail">Email</Label><Input id="managerEmail" type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} placeholder="email@example.com" /></div><div><Label htmlFor="managerRole">Role</Label><Input id="managerRole" value={managerRole} onChange={(e) => setManagerRole(e.target.value)} placeholder="e.g., Invoice Clerk, Sales Manager" /><p className="text-xs text-muted-foreground mt-1">Note: Roles are descriptive. Specific permissions will be implemented later.</p></div><DialogFooter className="flex flex-col sm:flex-row gap-2"><Button type="button" variant="outline" onClick={() => setIsUserManagerModalOpen(false)} className="w-full sm:w-auto">Cancel</Button><Button type="submit" className="w-full sm:w-auto">{editingManager ? 'Save Changes' : 'Add Manager'}</Button></DialogFooter></form></DialogContent>
      </Dialog>
      <Dialog open={isWarehouseFormModalOpen} onOpenChange={(isOpen) => { setIsWarehouseFormModalOpen(isOpen); if (!isOpen) setEditingWarehouse(null); }}>
        <DialogContent className="w-[90vw] max-w-lg"><DialogHeader><DialogTitle>{editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}</DialogTitle><DialogDescription>{editingWarehouse ? 'Update the details for this warehouse.' : 'Enter the details for the new warehouse.'}</DialogDescription></DialogHeader><div className="py-4"><WarehouseForm initialData={editingWarehouse} onSubmit={handleWarehouseFormSubmit} onCancel={() => { setIsWarehouseFormModalOpen(false); setEditingWarehouse(null); }} /></div></DialogContent>
      </Dialog>
      <AlertDialog open={!!warehouseToDelete} onOpenChange={(isOpen) => !isOpen && setWarehouseToDelete(null)}>
        <AlertDialogContent><AlertDialogHeaderComponent><AlertDialogTitleComponent>Are you absolutely sure?</AlertDialogTitleComponent><AlertDialogDescription>This action cannot be undone. This will permanently delete the warehouse "{warehouseToDelete?.name}" and all associated stock location records. Product definitions will remain, but their stock in this warehouse will be gone.</AlertDialogDescription></AlertDialogHeaderComponent><AlertDialogFooterComponent><AlertDialogCancel onClick={() => setWarehouseToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteWarehouse} className="bg-destructive hover:bg-destructive/90">Delete Warehouse</AlertDialogAction></AlertDialogFooterComponent></AlertDialogContent>
      </AlertDialog>

      {/* Supplier Modals - New */}
      <Dialog open={isSupplierFormModalOpen} onOpenChange={(isOpen) => { setIsSupplierFormModalOpen(isOpen); if (!isOpen) setEditingSupplier(null); }}>
        <DialogContent className="w-[90vw] max-w-lg"><DialogHeader><DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle><DialogDescription>{editingSupplier ? 'Update the details for this supplier.' : 'Enter the details for the new supplier.'}</DialogDescription></DialogHeader><div className="py-4"><SupplierForm initialData={editingSupplier} onSubmit={handleSupplierFormSubmit} onCancel={() => { setIsSupplierFormModalOpen(false); setEditingSupplier(null); }} /></div></DialogContent>
      </Dialog>
      <AlertDialog open={!!supplierToDelete} onOpenChange={(isOpen) => !isOpen && setSupplierToDelete(null)}>
        <AlertDialogContent><AlertDialogHeaderComponent><AlertDialogTitleComponent>Are you absolutely sure?</AlertDialogTitleComponent><AlertDialogDescription>This action cannot be undone. This will permanently delete the supplier "{supplierToDelete?.name}".</AlertDialogDescription></AlertDialogHeaderComponent><AlertDialogFooterComponent><AlertDialogCancel onClick={() => setSupplierToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteSupplier} className="bg-destructive hover:bg-destructive/90">Delete Supplier</AlertDialogAction></AlertDialogFooterComponent></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
