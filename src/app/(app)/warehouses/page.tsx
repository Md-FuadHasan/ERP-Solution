
'use client';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, ArrowLeft, Warehouse as WarehouseIconLucide, ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
import { WarehouseForm, type WarehouseFormValues } from '@/components/forms/warehouse-form';
import { SearchInput } from '@/components/common/search-input';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import type { Warehouse, WarehouseType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type SortableWarehouseKeys = keyof Pick<Warehouse, 'id' | 'name' | 'location' | 'type'>;

interface SortConfig {
  key: SortableWarehouseKeys | null;
  direction: 'ascending' | 'descending';
}

export default function WarehousesPage() {
  const { warehouses, addWarehouse, updateWarehouse, deleteWarehouse, isLoading } = useData();
  const { toast } = useToast();
  const router = useRouter();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });

  const handleAddWarehouse = useCallback(() => {
    setEditingWarehouse(null);
    setIsFormModalOpen(true);
  }, []);

  const handleEditWarehouse = useCallback((warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setIsFormModalOpen(true);
  }, []);

  const handleDeleteWarehouseConfirm = useCallback((warehouse: Warehouse) => {
    setWarehouseToDelete(warehouse);
  }, []);

  const confirmDeleteWarehouse = useCallback(() => {
    if (warehouseToDelete) {
      deleteWarehouse(warehouseToDelete.id);
      toast({ title: "Warehouse Deleted", description: `${warehouseToDelete.name} removed.` });
      setWarehouseToDelete(null);
    }
  }, [warehouseToDelete, deleteWarehouse, toast]);

  const handleWarehouseFormSubmit = useCallback((data: WarehouseFormValues) => {
    if (editingWarehouse) {
      updateWarehouse({ ...editingWarehouse, ...data });
      toast({ title: "Warehouse Updated", description: `${data.name} updated.` });
    } else {
      addWarehouse(data as Omit<Warehouse, 'id'>);
      toast({ title: "Warehouse Added", description: `${data.name} added.` });
    }
    setIsFormModalOpen(false);
    setEditingWarehouse(null);
  }, [addWarehouse, updateWarehouse, toast, editingWarehouse]);

  const handleSort = useCallback((key: SortableWarehouseKeys) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key && prevConfig.direction === 'ascending') {
        return { key, direction: 'descending' };
      }
      return { key, direction: 'ascending' };
    });
  }, []);

  const renderSortIcon = (columnKey: SortableWarehouseKeys) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="ml-2 h-3 w-3" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />;
  };

  const filteredWarehouses = useMemo(() => {
    let _warehouses = [...warehouses];
    if (searchTerm) {
      _warehouses = _warehouses.filter(wh =>
        wh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wh.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wh.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wh.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig.key) {
      _warehouses.sort((a, b) => {
        const aValue = a[sortConfig.key as SortableWarehouseKeys] || '';
        const bValue = b[sortConfig.key as SortableWarehouseKeys] || '';
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }
    return _warehouses;
  }, [warehouses, searchTerm, sortConfig]);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Warehouses"
          description="Manage your warehouse locations."
          actions={
            <Button onClick={handleAddWarehouse} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Warehouse
            </Button>
          }
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name, location, type..."
            className="w-full md:w-64 lg:flex-none"
          />
          <Button variant="outline" size="sm" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </div>

      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 mb-4 md:mb-6 lg:mb-8">
        <CardHeader className="border-b">
          <CardTitle>Warehouse List</CardTitle>
          <CardDescription>Overview of all warehouse locations.</CardDescription>
        </CardHeader>
        <div className="h-full overflow-y-auto">
          {isLoading ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2 text-sm">ID</TableHead>
                  <TableHead className="min-w-[200px] px-2 text-sm">Name</TableHead>
                  <TableHead className="min-w-[180px] px-2 text-sm">Location</TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm">Type</TableHead>
                  <TableHead className="text-right min-w-[120px] px-2 text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(7)].map((_, i) => (
                  <TableRow key={i} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50')}>
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
          ) : filteredWarehouses.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('id')}>
                    <div className="flex items-center">ID {renderSortIcon('id')}</div>
                  </TableHead>
                  <TableHead className="min-w-[200px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('name')}>
                    <div className="flex items-center">Name {renderSortIcon('name')}</div>
                  </TableHead>
                  <TableHead className="min-w-[180px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('location')}>
                    <div className="flex items-center">Location {renderSortIcon('location')}</div>
                  </TableHead>
                  <TableHead className="min-w-[150px] px-2 text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('type')}>
                    <div className="flex items-center">Type {renderSortIcon('type')}</div>
                  </TableHead>
                  <TableHead className="text-right min-w-[120px] px-2 text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.map((warehouse, index) => (
                  <TableRow key={warehouse.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell className="font-medium px-2 text-xs">{warehouse.id}</TableCell>
                    <TableCell className="px-2 text-xs">{warehouse.name}</TableCell>
                    <TableCell className="px-2 text-xs">{warehouse.location}</TableCell>
                    <TableCell className="px-2 text-xs">{warehouse.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell>
                    <TableCell className="text-right px-2 text-xs">
                      <div className="flex justify-end items-center gap-1">
                         <Button variant="ghost" size="icon" asChild className="hover:text-primary" title="View Warehouse Stock">
                           <Link href={`/inventory/${warehouse.id}`}><WarehouseIconLucide className="h-4 w-4" /></Link>
                         </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditWarehouse(warehouse)} className="hover:text-primary" title="Edit Warehouse">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteWarehouseConfirm(warehouse)} className="hover:text-destructive" title="Delete Warehouse">
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
                title="No Warehouses Found"
                message={searchTerm ? "Try adjusting your search criteria." : "Get started by adding your first warehouse."}
                icon={WarehouseIconLucide}
                action={!searchTerm ? (
                  <Button onClick={handleAddWarehouse} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Warehouse
                  </Button>
                ) : undefined}
              />
            </div>
          )}
        </div>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => { setIsFormModalOpen(isOpen); if (!isOpen) setEditingWarehouse(null); }}>
        <DialogContent className="w-[90vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}</DialogTitle>
            <FormDialogDescription>{editingWarehouse ? 'Update the details for this warehouse.' : 'Enter the details for the new warehouse.'}</FormDialogDescription>
          </DialogHeader>
          <div className="py-4">
            <WarehouseForm initialData={editingWarehouse} onSubmit={handleWarehouseFormSubmit} onCancel={() => { setIsFormModalOpen(false); setEditingWarehouse(null); }} />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!warehouseToDelete} onOpenChange={(isOpen) => !isOpen && setWarehouseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent>Are you sure?</AlertDialogTitleComponent>
            <AlertDialogDesc>
              This action cannot be undone. This will permanently delete the warehouse "{warehouseToDelete?.name}" and all associated stock location records.
            </AlertDialogDesc>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancel onClick={() => setWarehouseToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteWarehouse} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooterComponent>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
