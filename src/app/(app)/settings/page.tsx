'use client';
import { useState, useEffect } from 'react';
import type React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, AlertTriangle } from 'lucide-react';
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
import { DataPlaceholder } from '@/components/common/data-placeholder';
import type { CompanyProfile, Manager } from '@/types';
import { MOCK_MANAGERS } from '@/types'; // Managers are still local for now
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
import { useData } from '@/context/DataContext'; // Import useData hook
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Database } from 'lucide-react';

export default function SettingsPage() {
  const { companyProfile, updateCompanyProfile, isLoading: isDataLoading } = useData();
  
  // Managers state remains local to this page for now, as it's not part of DataContext yet.
  // If managers needed global state, they'd be added to DataContext.
  const [managers, setManagers] = useState<Manager[]>([]); 
  const [isUserManagerModalOpen, setIsUserManagerModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerRole, setManagerRole] = useState('');
  const [localLoading, setLocalLoading] = useState(true);


  const { toast } = useToast();
  
  // Initialize managers from localStorage or mock if not in DataContext
  useEffect(() => {
    try {
      const storedManagers = localStorage.getItem('invoiceflow_managers');
      if (storedManagers) {
        setManagers(JSON.parse(storedManagers));
      } else {
        setManagers(MOCK_MANAGERS);
      }
    } catch (error) {
      console.error("Failed to load managers from localStorage", error);
      setManagers(MOCK_MANAGERS);
    } finally {
      setLocalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localLoading) {
        localStorage.setItem('invoiceflow_managers', JSON.stringify(managers));
    }
  }, [managers, localLoading]);


  const handleCompanyDetailsSubmit = (data: CompanyDetailsFormValues) => {
    updateCompanyProfile(data); // Use context action
    toast({ title: "Company Details Updated", description: "Your company information has been saved." });
  };

  const handleTaxSettingsSubmit = (data: TaxSettingsFormValues) => {
    updateCompanyProfile({ 
      taxRate: data.taxRate, 
      vatRate: data.vatRate,
      excessTaxRate: data.excessTaxRate 
    }); // Use context action
    toast({ title: "Tax Settings Updated", description: "Your tax configurations have been saved." });
  };

  const handleAddManager = () => {
    setEditingManager(null);
    setManagerName('');
    setManagerEmail('');
    setManagerRole('');
    setIsUserManagerModalOpen(true);
  };

  const handleEditManager = (manager: Manager) => {
    setEditingManager(manager);
    setManagerName(manager.name);
    setManagerEmail(manager.email);
    setManagerRole(manager.role);
    setIsUserManagerModalOpen(true);
  };

  const handleDeleteManager = (managerId: string) => {
    setManagers(managers.filter(m => m.id !== managerId));
    toast({ title: "Manager Removed", description: "The manager has been removed from the system."});
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
      const newManager: Manager = { id: `MGR-${Date.now()}`, name: managerName, email: managerEmail, role: managerRole };
      setManagers([newManager, ...managers]);
      toast({ title: "Manager Added", description: `${managerName} added to the system.`});
    }
    setIsUserManagerModalOpen(false);
  };

  if (isDataLoading || localLoading) {
    return (
      <>
        <PageHeader title="Settings" description="Manage your company profile, tax settings, users, and data storage." />
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            {SETTINGS_TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2" disabled>
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
    <>
      <PageHeader title="Settings" description="Manage your company profile, tax settings, users, and data storage." />
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          {SETTINGS_TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Mother Company Details</CardTitle>
              <CardDescription>Update your company's name, address, and contact information.</CardDescription>
            </CardHeader>
            <CardContent>
              <CompanyDetailsForm initialData={companyProfile} onSubmit={handleCompanyDetailsSubmit} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>Configure TAX, VAT, and Excess TAX rates for your invoices.</CardDescription>
            </CardHeader>
            <CardContent>
              <TaxSettingsForm initialData={companyProfile} onSubmit={handleTaxSettingsSubmit} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Add, edit, or remove managers with custom roles.
                  <br/><small className="text-destructive">Note: Managers cannot delete invoices or customers.</small>
                </CardDescription>
              </div>
              <Button onClick={handleAddManager}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Manager
              </Button>
            </CardHeader>
            <CardContent>
              {managers.length > 0 ? (
                <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {managers.map((manager) => (
                      <TableRow key={manager.id}>
                        <TableCell>{manager.name}</TableCell>
                        <TableCell>{manager.email}</TableCell>
                        <TableCell>{manager.role}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditManager(manager)} className="mr-2 hover:text-primary">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteManager(manager.id)} className="hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              ) : (
                <DataPlaceholder title="No Managers" message="Add managers to help manage your account." action={
                    <Button onClick={handleAddManager}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Manager
                    </Button>
                }/>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Data Storage Configuration</CardTitle>
              <CardDescription>Settings for connecting to local storage or SQL database systems.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 rounded-md border border-green-400 bg-green-50 p-4 text-green-700 dark:border-green-600 dark:bg-green-900/30 dark:text-green-300">
                 <Database className="h-6 w-6 text-green-500 dark:text-green-400" />
                <div>
                  <p className="font-medium">Using Local Storage</p>
                  <p className="text-sm">
                    Currently, all application data (invoices, customers, settings) is being stored in your browser's local storage.
                    Changes are persisted across sessions on this device.
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground">
                Future versions may allow connecting to persistent cloud database solutions like PostgreSQL, MySQL, or SQL Server for multi-user access and robust data management.
              </p>
               <Button disabled>Configure Cloud Database (Coming Soon)</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isUserManagerModalOpen} onOpenChange={setIsUserManagerModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingManager ? 'Edit Manager' : 'Add New Manager'}</DialogTitle>
            <DialogDescription>
              {editingManager ? 'Update manager details.' : 'Enter details for the new manager.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleManagerFormSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="managerName">Name</Label>
              <Input id="managerName" value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="Full Name" />
            </div>
            <div>
              <Label htmlFor="managerEmail">Email</Label>
              <Input id="managerEmail" type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <Label htmlFor="managerRole">Role</Label>
              <Input id="managerRole" value={managerRole} onChange={(e) => setManagerRole(e.target.value)} placeholder="e.g., Invoice Clerk, Sales Manager" />
              <p className="text-xs text-muted-foreground mt-1">Note: Roles are descriptive. Specific permissions will be implemented later.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUserManagerModalOpen(false)}>Cancel</Button>
              <Button type="submit">{editingManager ? 'Save Changes' : 'Add Manager'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
