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
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header'; // Corrected import

// Define a type for Quotation (basic structure)
type Quotation = {
  id: string;
  customerName: string;
  amount: number;
  status: string; // e.g., Draft, Sent, Accepted, Rejected
  createdAt: string;
};

const mockQuotations: Quotation[] = [
  { id: 'Q001', customerName: 'ABC Corp', amount: 1500.00, status: 'Draft', createdAt: '2023-10-26' },
  { id: 'Q002', customerName: 'XYZ Ltd', amount: 2200.50, status: 'Sent', createdAt: '2023-10-25' },
  { id: 'Q003', customerName: '123 Industries', amount: 800.75, status: 'Accepted', createdAt: '2023-10-24' },
];

const QuotationManagementPage = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [quotationToView, setQuotationToView] = useState<Quotation | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [quotationToEdit, setQuotationToEdit] = useState<Quotation | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [quotationToSend, setQuotationToSend] = useState<Quotation | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);

  useEffect(() => {
    // In a real application, you would fetch data from an API
    setQuotations(mockQuotations);
    setLoading(false);
  }, []);

  const handleViewQuotation = (quotation: Quotation) => {
    setQuotationToView(quotation);
    setIsViewModalOpen(true);
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setQuotationToEdit(quotation);
    setIsEditModalOpen(true);
    // Implement edit logic here
  };

  const handleSendQuotation = (quotation: Quotation) => {
    setQuotationToSend(quotation);
    setIsSendModalOpen(true);
    // Implement send logic here
  };

  const handleDeleteQuotation = (quotation: Quotation) => {
    setQuotationToDelete(quotation);
    setIsDeleteModalOpen(true);
    // Implement delete logic here
  };

  // Define columns for the DataTable (assuming a similar structure to other tables)
  const columns = [
    { accessorKey: 'id', header: 'Quotation ID' },
    { accessorKey: 'customerName', header: 'Customer' },
    { accessorKey: 'amount', header: 'Amount' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'createdAt', header: 'Created At' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: Quotation } }) => {
        const quotation = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewQuotation(quotation)}>
                <Eye className="mr-2 h-4 w-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditQuotation(quotation)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendQuotation(quotation)}>
                <Send className="mr-2 h-4 w-4" /> Send
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteQuotation(quotation)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Quotation Management" description="Manage your sales quotations" />
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Quotations</CardTitle>
          <Button onClick={() => alert('Implement Add New Quotation')}>
            <Plus className="mr-2 h-4 w-4" /> Add New Quotation
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead key={index}>{column.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>
                        {column.id === 'actions' ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewQuotation(quotation)}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditQuotation(quotation)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendQuotation(quotation)}>
                                <Send className="mr-2 h-4 w-4" /> Send
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteQuotation(quotation)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          String(quotation[column.accessorKey as keyof Quotation] ?? '')
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Quotation Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quotation Details</DialogTitle>
            <DialogDescription>
              Details of quotation {quotationToView?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Display quotation details here */}
            {quotationToView && (
              <div className="space-y-2">
                <div><strong>ID:</strong> {quotationToView.id}</div>
                <div><strong>Customer:</strong> {quotationToView.customerName}</div>
                <div><strong>Amount:</strong> ${quotationToView.amount.toFixed(2)}</div>
                <div><strong>Status:</strong> {quotationToView.status}</div>
                <div><strong>Created At:</strong> {quotationToView.createdAt}</div>
                {/* Add more details as needed */}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quotation Modal (Placeholder)*/}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quotation</DialogTitle>
            <DialogDescription>
              Edit details for quotation {quotationToEdit?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Edit form fields here */}
            <p>Edit form goes here...</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={() => { /* Save logic here */ setIsEditModalOpen(false); }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Quotation Modal (Placeholder)*/}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quotation</DialogTitle>
            <DialogDescription>
              Send quotation {quotationToSend?.id} to customer {quotationToSend?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Send options here (e.g., email)*/}
            <p>Send options go here...</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendModalOpen(false)}>Cancel</Button>
            <Button onClick={() => { /* Send logic here */ setIsSendModalOpen(false); }}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Quotation Confirmation Modal (Placeholder)*/}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete quotation {quotationToDelete?.id}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { /* Delete logic here */ setIsDeleteModalOpen(false); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationManagementPage;
