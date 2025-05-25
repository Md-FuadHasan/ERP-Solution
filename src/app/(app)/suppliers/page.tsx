
'use client';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, ArrowLeft, Filter as FilterIcon, ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
import { SupplierForm, type SupplierFormValues } from '@/components/forms/supplier-form';
import { SearchInput } from '@/components/common/search-input';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import type { Supplier } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SortableSupplierKeys = keyof Pick<Supplier, 'id' | 'name' | 'email' | 'phone' | 'contactPerson'>;

interface SortConfig {
  key: SortableSupplierKeys | null;
  direction: 'ascending' | 'descending';
}

export default function SuppliersPage() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, isLoading } = useData();
  const { toast } = useToast();
  const router = useRouter();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });

  const handleAddSupplier = useCallback(() => {
    setEditingSupplier(null);
    setIsFormModalOpen(true);
  }, []);

  const handleEditSupplier = useCallback((supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsFormModalOpen(true);
  }, []);

  const handleDeleteSupplierConfirm = useCallback((supplier: Supplier) => {
    setSupplierToDelete(supplier);
  }, []);

  const confirmDeleteSupplier = useCallback(() => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete.id);
      toast({ title: "Supplier Deleted", description: `${supplierToDelete.name} has been removed.` });
      setSupplierToDelete(null);
    }
  }, [supplierToDelete, deleteSupplier, toast]);

  const handleSupplierFormSubmit = useCallback((data: SupplierFormValues) => {
    if (editingSupplier) {
      updateSupplier({ ...editingSupplier, ...data });
      toast({ title: "Supplier Updated", description: `${data.name} updated.` });
    } else {
      addSupplier(data as Omit<Supplier, 'id' | 'createdAt'>);
      toast({ title: "Supplier Added", description: `${data.name} added.` });
    }
    setIsFormModalOpen(false);
    setEditingSupplier(null);
  }, [addSupplier, updateSupplier, toast, editingSupplier]);

  const handleSort = useCallback((key: SortableSupplierKeys) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key && prevConfig.direction === 'ascending') {
        return { key, direction: 'descending' };
      }
      return { key, direction: 'ascending' };
    });
  }, []);

  const renderSortIcon = (columnKey: SortableSupplierKeys) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="ml-2 h-3 w-3" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />;
  };

  const filteredSuppliers = useMemo(() => {
    let _suppliers = [...suppliers];
    if (searchTerm) {
      _suppliers = _suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig.key) {
      _suppliers.sort((a, b) => {
        const aValue = a[sortConfig.key as SortableSupplierKeys] || '';
        const bValue = b[sortConfig.key as SortableSupplierKeys] || '';
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }
    return _suppliers;
  }, [suppliers, searchTerm, sortConfig]);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Suppliers"
          description="Manage your vendors and suppliers."
          actions={
            <Button onClick={handleAddSupplier} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Supplier
            </Button>
          }
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name, email, contact..."
            className="w-full md:w-64 lg:flex-none"
          />
          <Button variant="outline" size="sm" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </div>

      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 mb-4 md:mb-6 lg:mb-8">
        <CardHeader className="border-b">
          <CardTitle>Supplier List</CardTitle>
          <CardDescription>Overview of all suppliers.</CardDescription>
        </CardHeader>
        <div className="h-full overflow-y-auto">
          {isLoading ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2 text-sm">ID</TableHead>
                  <TableHead className="min-w-[200px] px-2 text-sm">Name</TableHead>
                  <TableHead className="min-w-[180px] px-2 text-sm">Email</TableHead>
                  <TableHead className="min-w-[120px] px-2 text-sm">Phone</TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm">Contact Person</TableHead>
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
          ) : filteredSuppliers.length > 0 ? (
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
                  <TableHead className="min-w-[120px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('phone')}>
                    <div className="flex items-center">Phone {renderSortIcon('phone')}</div>
                  </TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('contactPerson')}>
                    <div className="flex items-center">Contact Person {renderSortIcon('contactPerson')}</div>
                  </TableHead>
                  <TableHead className="text-right min-w-[100px] px-2 text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier, index) => (
                  <TableRow key={supplier.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell className="font-medium px-2 text-xs">{supplier.id}</TableCell>
                    <TableCell className="px-2 text-xs">{supplier.name}</TableCell>
                    <TableCell className="px-2 text-xs">{supplier.email || '-'}</TableCell>
                    <TableCell className="px-2 text-xs">{supplier.phone || '-'}</TableCell>
                    <TableCell className="px-2 text-xs">{supplier.contactPerson || '-'}</TableCell>
                    <TableCell className="text-right px-2 text-xs">
                      <div className="flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditSupplier(supplier)} className="hover:text-primary" title="Edit Supplier">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSupplierConfirm(supplier)} className="hover:text-destructive" title="Delete Supplier">
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
                title="No Suppliers Found"
                message={searchTerm ? "Try adjusting your search criteria." : "Get started by adding your first supplier."}
                icon={PlusCircle}
                action={!searchTerm ? (
                  <Button onClick={handleAddSupplier} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Supplier
                  </Button>
                ) : undefined}
              />
            </div>
          )}
        </div>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => { setIsFormModalOpen(isOpen); if (!isOpen) setEditingSupplier(null); }}>
        <DialogContent className="w-[90vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
            <FormDialogDescription>{editingSupplier ? 'Update the details for this supplier.' : 'Enter the details for the new supplier.'}</FormDialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SupplierForm initialData={editingSupplier} onSubmit={handleSupplierFormSubmit} onCancel={() => { setIsFormModalOpen(false); setEditingSupplier(null); }} />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!supplierToDelete} onOpenChange={(isOpen) => !isOpen && setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent>Are you sure?</AlertDialogTitleComponent>
            <AlertDialogDesc>
              This action cannot be undone. This will permanently delete the supplier "{supplierToDelete?.name}".
            </AlertDialogDesc>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancel onClick={() => setSupplierToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSupplier} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooterComponent>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
