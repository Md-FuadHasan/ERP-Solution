
'use client';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { CustomerForm } from '@/components/forms/customer-form';
import { SearchInput } from '@/components/common/search-input';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import type { Customer } from '@/types';
import { MOCK_CUSTOMERS } from '@/types'; // Using mock data
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const { toast } = useToast();

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      setCustomers(customers.filter((c) => c.id !== customerToDelete.id));
      toast({ title: "Customer Deleted", description: `${customerToDelete.name} has been removed.` });
      setCustomerToDelete(null);
    }
  };

  const handleSubmit = (data: Omit<Customer, 'id' | 'createdAt'>) => {
    if (editingCustomer) {
      setCustomers(
        customers.map((c) =>
          c.id === editingCustomer.id ? { ...editingCustomer, ...data } : c
        )
      );
      toast({ title: "Customer Updated", description: `${data.name} details have been updated.` });
    } else {
      const newCustomer: Customer = {
        ...data,
        id: `CUST${String(Date.now()).slice(-4)}${String(Math.floor(Math.random()*100))}`,
        createdAt: new Date().toISOString(),
      };
      setCustomers([newCustomer, ...customers]);
      toast({ title: "Customer Added", description: `${data.name} has been successfully added.` });
    }
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage your customer profiles and contact information."
        actions={
          <Button onClick={handleAddCustomer}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
          </Button>
        }
      />
      <div className="mb-6">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name, email, or ID..."
        />
      </div>

      {filteredCustomers.length > 0 ? (
        <div className="rounded-lg border shadow-sm bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.id}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditCustomer(customer)} className="mr-2 hover:text-primary">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCustomer(customer)} className="hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <DataPlaceholder
          title="No Customers Found"
          message={searchTerm ? "Try adjusting your search term." : "Get started by adding your first customer."}
          action={!searchTerm && (
            <Button onClick={handleAddCustomer}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          )}
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
          setIsModalOpen(isOpen);
          if (!isOpen) setEditingCustomer(null);
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Update the details for this customer.' : 'Enter the details for the new customer.'}
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            initialData={editingCustomer}
            onSubmit={handleSubmit}
            onCancel={() => { setIsModalOpen(false); setEditingCustomer(null); }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!customerToDelete} onOpenChange={(isOpen) => !isOpen && setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer
              "{customerToDelete?.name}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
