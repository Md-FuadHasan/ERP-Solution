
'use client';
import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, ArrowLeft, Filter as FilterIcon, ChevronsUpDown, ArrowUp, ArrowDown, UserCheck } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as FormDialogDescription,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SalespersonForm, type SalespersonFormValues } from '@/components/forms/salesperson-form';
import { SearchInput } from '@/components/common/search-input';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import type { Salesperson, Warehouse } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SortableSalespersonKeys = keyof Pick<Salesperson, 'id' | 'name' | 'email' | 'assignedRouteId' | 'assignedWarehouseId'>;

interface SortConfig {
  key: SortableSalespersonKeys | null;
  direction: 'ascending' | 'descending';
}

export default function SalespeoplePage() {
  const { salespeople, addSalesperson, updateSalesperson, deleteSalesperson, warehouses, isLoading } = useData();
  const { toast } = useToast();
  const router = useRouter();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
  const [salespersonToDelete, setSalespersonToDelete] = useState<Salesperson | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });

  const handleAddSalesperson = useCallback(() => {
    setEditingSalesperson(null);
    setIsFormModalOpen(true);
  }, []);

  const handleEditSalesperson = useCallback((sp: Salesperson) => {
    setEditingSalesperson(sp);
    setIsFormModalOpen(true);
  }, []);

  const handleDeleteSalespersonConfirm = useCallback((sp: Salesperson) => {
    setSalespersonToDelete(sp);
  }, []);

  const confirmDeleteSalesperson = useCallback(() => {
    if (salespersonToDelete) {
      deleteSalesperson(salespersonToDelete.id);
      toast({ title: "Salesperson Deleted", description: `${salespersonToDelete.name} has been removed.` });
      setSalespersonToDelete(null);
    }
  }, [salespersonToDelete, deleteSalesperson, toast]);

  const handleSalespersonFormSubmit = useCallback((data: SalespersonFormValues) => {
    if (editingSalesperson) {
      updateSalesperson({ ...editingSalesperson, ...data });
      toast({ title: "Salesperson Updated", description: `${data.name} updated.` });
    } else {
      addSalesperson(data as Omit<Salesperson, 'id' | 'createdAt'>); // ID and createdAt are handled by DataContext
      toast({ title: "Salesperson Added", description: `${data.name} added.` });
    }
    setIsFormModalOpen(false);
    setEditingSalesperson(null);
  }, [addSalesperson, updateSalesperson, toast, editingSalesperson]);

  const handleSort = useCallback((key: SortableSalespersonKeys) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key && prevConfig.direction === 'ascending') {
        return { key, direction: 'descending' };
      }
      return { key, direction: 'ascending' };
    });
  }, []);

  const renderSortIcon = (columnKey: SortableSalespersonKeys) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="ml-2 h-3 w-3" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />;
  };

  const filteredSalespeople = useMemo(() => {
    let _salespeople = [...salespeople];
    if (searchTerm) {
      _salespeople = _salespeople.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.assignedRouteId && s.assignedRouteId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig.key) {
      _salespeople.sort((a, b) => {
        const aValue = a[sortConfig.key as SortableSalespersonKeys] || '';
        const bValue = b[sortConfig.key as SortableSalespersonKeys] || '';
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }
    return _salespeople;
  }, [salespeople, searchTerm, sortConfig]);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Salespeople"
          description="Manage your sales team members and their assignments."
          actions={
            <Button onClick={handleAddSalesperson} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Salesperson
            </Button>
          }
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name, email, route..."
            className="w-full md:w-64 lg:flex-none"
          />
          <Button variant="outline" size="sm" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </div>

      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 mb-4 md:mb-6 lg:mb-8">
        <CardHeader className="border-b">
          <CardTitle>Salespeople List</CardTitle>
          <CardDescription>Overview of all sales team members.</CardDescription>
        </CardHeader>
        <div className="h-full overflow-y-auto">
          {isLoading ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2 text-sm">ID</TableHead>
                  <TableHead className="min-w-[200px] px-2 text-sm">Name</TableHead>
                  <TableHead className="min-w-[180px] px-2 text-sm">Email</TableHead>
                  <TableHead className="min-w-[120px] px-2 text-sm">Route ID</TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm">Warehouse ID</TableHead>
                  <TableHead className="text-right min-w-[100px] px-2 text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(7)].map((_, i) => (
                  <TableRow key={i} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50')}>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-xs"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2 text-xs">
                      <div className="flex justify-end items-center gap-1">
                        <Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredSalespeople.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('id')}>
                    <div className="flex items-center">ID {renderSortIcon('id')}</div>
                  </TableHead>
                  <TableHead className="min-w-[200px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('name')}>
                    <div className="flex items-center">Name {renderSortIcon('name')}</div>
                  </TableHead>
                  <TableHead className="min-w-[180px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('email')}>
                    <div className="flex items-center">Email {renderSortIcon('email')}</div>
                  </TableHead>
                  <TableHead className="min-w-[120px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('assignedRouteId')}>
                    <div className="flex items-center">Route ID {renderSortIcon('assignedRouteId')}</div>
                  </TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('assignedWarehouseId')}>
                    <div className="flex items-center">Warehouse ID {renderSortIcon('assignedWarehouseId')}</div>
                  </TableHead>
                  <TableHead className="text-right min-w-[100px] px-2 text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalespeople.map((sp, index) => (
                  <TableRow key={sp.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell className="font-medium px-2 text-xs">{sp.id}</TableCell>
                    <TableCell className="px-2 text-xs">{sp.name}</TableCell>
                    <TableCell className="px-2 text-xs">{sp.email || '-'}</TableCell>
                    <TableCell className="px-2 text-xs">{sp.assignedRouteId || '-'}</TableCell>
                    <TableCell className="px-2 text-xs">{sp.assignedWarehouseId || '-'}</TableCell>
                    <TableCell className="text-right px-2 text-xs">
                      <div className="flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditSalesperson(sp)} className="hover:text-primary" title="Edit Salesperson">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSalespersonConfirm(sp)} className="hover:text-destructive" title="Delete Salesperson">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <DataPlaceholder
                title="No Salespeople Found"
                message={searchTerm ? "Try adjusting your search criteria." : "Get started by adding your first salesperson."}
                icon={UserCheck}
                action={!searchTerm ? (
                  <Button onClick={handleAddSalesperson} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Salesperson
                  </Button>
                ) : undefined}
              />
            </div>
          )}
        </div>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => { setIsFormModalOpen(isOpen); if (!isOpen) setEditingSalesperson(null); }}>
        <DialogContent className="w-[90vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSalesperson ? 'Edit Salesperson' : 'Add New Salesperson'}</DialogTitle>
            <FormDialogDescription>{editingSalesperson ? 'Update the details for this salesperson.' : 'Enter the details for the new salesperson.'}</FormDialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SalespersonForm
                initialData={editingSalesperson}
                warehouses={warehouses}
                onSubmit={handleSalespersonFormSubmit}
                onCancel={() => { setIsFormModalOpen(false); setEditingSalesperson(null); }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!salespersonToDelete} onOpenChange={(isOpen) => !isOpen && setSalespersonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent>Are you sure?</AlertDialogTitleComponent>
            <AlertDialogDesc>
              This action cannot be undone. This will permanently delete salesperson "{salespersonToDelete?.name}".
            </AlertDialogDesc>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancel onClick={() => setSalespersonToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSalesperson} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooterComponent>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
