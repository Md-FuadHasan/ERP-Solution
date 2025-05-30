
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Eye, Send, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription as FormDialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { Textarea } from '@/components/ui/textarea';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// import { mockProducts } from '@/lib/constants'; // Assuming you have mock products - Commented out as not used in this placeholder


// Define a type for Quotation (basic structure)
type Quotation = {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  status: string; // e.g., Draft, Sent, Accepted, Rejected
  createdAt: string;
};

const mockQuotations: Quotation[] = [
 { id: 'Q001', customerId: 'CUST001', customerName: 'Alpha Solutions', amount: 1500.00, status: 'Draft', createdAt: '2023-10-26' },
 { id: 'Q002', customerId: 'CUST002', customerName: 'Beta Innovations', amount: 2200.50, status: 'Sent', createdAt: '2023-10-25' },
 { id: 'Q003', customerId: 'CUST003', customerName: 'Gamma Services', amount: 800.75, status: 'Accepted', createdAt: '2023-10-24' },
];

// Mock Customer data (to get detailed info for the modal)
const mockCustomers = [
  {
    id: 'CUST001',
    name: 'Alpha Solutions',
    businessName: 'Alpha Solutions Inc.',
    // cr: '1010123456',
    // vat: '300012345678901',
    // address: { building: 'Building A', additionalNo: '1234', street: 'Main St', city: 'Riyadh', district: 'Olaya', zip: '12211' },
    email: 'contact@alpha.com',
    phone: '555-0101',
    // products: [{ name: 'Product A', quantity: 10, price: 100, unit: 'pcs' }, { name: 'Product B', quantity: 5, price: 100, unit: 'pcs' }],
  },
  {
    id: 'CUST002',
    name: 'Beta Innovations',
    businessName: 'Beta Innovations Ltd.',
    // cr: '1010654321',
    // vat: '300098765432109',
    // address: { building: 'Building B', additionalNo: '5678', street: 'King Fahd Rd', city: 'Jeddah', district: 'Al Balad', zip: '22234' },
    email: 'info@beta.dev',
    phone: '555-0102',
    // products: [{ name: 'Product C', quantity: 20, price: 50, unit: 'pcs' }],
  },
  {
    id: 'CUST003',
    name: 'Gamma Services',
    businessName: 'Gamma Services Co.',
    // address: { building: 'Building C', additionalNo: '9101', street: 'Prince Sultan Rd', city: 'Dammam', district: 'Al Khobar Al Janubiyah', zip: '31952' },
    email: 'support@gamma.io',
    phone: '555-0103',
  },
];

const QuotationManagementPage = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [quotationToView, setQuotationToView] = useState<Quotation | null>(null);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false); // Renamed from isEditModalOpen for clarity
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null); // Renamed from quotationToEdit
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [quotationToSend, setQuotationToSend] = useState<Quotation | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null); // Changed to store whole object for better message

  useEffect(() => {
    // In a real application, you would fetch data from an API
    setQuotations(mockQuotations);
    setLoading(false);
  }, []);

  const handleViewQuotation = (quotation: Quotation) => {
    setQuotationToView(quotation);
    setIsViewModalOpen(true);
  };

  const handleOpenQuotationModal = (quotation?: Quotation) => {
    setEditingQuotation(quotation || null);
    setIsQuotationModalOpen(true);
  };

  const handleSendQuotation = (quotation: Quotation) => {
    setQuotationToSend(quotation);
    setIsSendModalOpen(true);
    // Implement send logic here
    console.log(`Sending quotation ${quotation.id}...`);
  };

  const handleDeleteQuotationClick = (quotation: Quotation) => {
    setQuotationToDelete(quotation);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteQuotation = () => {
    if (quotationToDelete) {
      setQuotations(quotations.filter(q => q.id !== quotationToDelete.id));
      setIsDeleteModalOpen(false);
      // In a real app, call API to delete
      console.log(`Deleted quotation ${quotationToDelete.id}`);
      setQuotationToDelete(null);
    }
  };


  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Quotation Management"
        description="Create, manage, and track your sales quotations."
        actions={
          <Button onClick={() => handleOpenQuotationModal()}>
            <Plus className="mr-2 h-4 w-4" /> Add New Quotation
          </Button>
        }
      />
      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 mb-4 md:mb-6 lg:mb-8">
        <CardHeader className="border-b">
          <CardTitle>Quotations List</CardTitle>
          <CardDescription>Overview of all sales quotations.</CardDescription>
        </CardHeader>
        <div className="h-full overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">Loading quotations...</div>
          ) : quotations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No quotations found. Create one to get started!</div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="px-2 text-sm">ID</TableHead>
                  <TableHead className="px-2 text-sm">Customer</TableHead>
                  <TableHead className="text-right px-2 text-sm">Amount</TableHead>
                  <TableHead className="px-2 text-sm">Status</TableHead>
                  <TableHead className="px-2 text-sm">Created At</TableHead>
                  <TableHead className="text-center px-2 text-sm min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation, index) => (
                  <TableRow key={quotation.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/50'}>
                    <TableCell className="font-medium px-2 text-xs">{quotation.id}</TableCell>
                    <TableCell className="px-2 text-xs">{quotation.customerName}</TableCell>
                    <TableCell className="text-right px-2 text-xs">${quotation.amount.toFixed(2)}</TableCell>
                    <TableCell className="px-2 text-xs">{quotation.status}</TableCell>
                    <TableCell className="px-2 text-xs">{quotation.createdAt}</TableCell>
                    <TableCell className="text-center px-2 text-xs">
                       <div className="flex justify-center items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewQuotation(quotation)} className="hover:text-primary p-1.5" title="View Quotation">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenQuotationModal(quotation)} className="hover:text-primary p-1.5" title="Edit Quotation">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleSendQuotation(quotation)} className="hover:text-green-600 p-1.5" title="Send Quotation" disabled={quotation.status !== 'Draft'}>
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteQuotationClick(quotation)} className="hover:text-destructive p-1.5" title="Delete Quotation">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* View Quotation Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Quotation Details: {quotationToView?.id}</DialogTitle>
            <FormDialogDescription>
              Detailed information for quotation sent to {quotationToView?.customerName}.
            </FormDialogDescription>
          </DialogHeader>
          {quotationToView && (
            <div className="space-y-3 py-4 text-sm max-h-[60vh] overflow-y-auto">
              <p><strong>Quotation ID:</strong> {quotationToView.id}</p>
              <p><strong>Customer Name:</strong> {quotationToView.customerName}</p>
              <p><strong>Amount:</strong> ${quotationToView.amount.toFixed(2)}</p>
              <p><strong>Status:</strong> {quotationToView.status}</p>
              <p><strong>Created At:</strong> {new Date(quotationToView.createdAt).toLocaleDateString()}</p>
              
              {/* Placeholder for items */}
              <div className="pt-2">
                <h4 className="font-semibold">Items:</h4>
                <p className="text-muted-foreground text-xs">Item details placeholder - full item list would go here.</p>
              </div>
              {/* Placeholder for terms */}
              <div className="pt-2">
                <h4 className="font-semibold">Terms & Conditions:</h4>
                <p className="text-muted-foreground text-xs">Standard terms and conditions placeholder.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Quotation Modal (Placeholder - Needs full form component) */}
      <Dialog open={isQuotationModalOpen} onOpenChange={(isOpen) => { setIsQuotationModalOpen(isOpen); if (!isOpen) setEditingQuotation(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingQuotation ? 'Edit Quotation' : 'Create New Quotation'}</DialogTitle>
            <FormDialogDescription>
              {editingQuotation ? 'Update details for this quotation.' : 'Fill in the details to create a new quotation.'}
            </FormDialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">Quotation Form Component will go here.</p>
            {/* TODO: Replace with <QuotationForm initialData={editingQuotation} ... /> */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsQuotationModalOpen(false); setEditingQuotation(null); }}>Cancel</Button>
            <Button onClick={() => { /* Save logic here */ setIsQuotationModalOpen(false); setEditingQuotation(null); }}>
              {editingQuotation ? 'Save Changes' : 'Create Quotation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Quotation Modal (Placeholder)*/}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Quotation: {quotationToSend?.id}</DialogTitle>
            <FormDialogDescription>
              Prepare to send quotation to {quotationToSend?.customerName}.
            </FormDialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">Email sending options/preview will go here.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendModalOpen(false)}>Cancel</Button>
            <Button onClick={() => { /* Send logic here */ setIsSendModalOpen(false); }}>Send Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Quotation Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <FormDialogDescription>
              Are you sure you want to delete quotation {quotationToDelete?.id} for {quotationToDelete?.customerName}? This action cannot be undone.
            </FormDialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteQuotation}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationManagementPage;

