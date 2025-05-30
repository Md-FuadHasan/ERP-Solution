
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Eye, Send, Trash2, Search, Filter, ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { PageHeader } from '@/components/layout/page-header';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormErrorMessage,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// import { mockProducts } from '@/lib/constants'; // Assuming you have mock products - Commented out as not used in this placeholder


// Define a type for Quotation
type Quotation = {
  id: string;
 customer: {
    id: string;
 name: string;
 businessName?: string; // Assuming customer might have a business name
  };
  date: string; // Quotation creation date
  validUntil: string; // Quotation expiry date
  amount: number;
 status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
};

const mockQuotations: Quotation[] = [
 { id: 'Q001', customer: { id: 'CUST001', name: 'Alpha Solutions', businessName: 'Alpha Solutions Inc.' }, date: '2023-10-26', validUntil: '2023-11-26', amount: 1500.00, status: 'Draft' },
 { id: 'Q002', customer: { id: 'CUST002', name: 'Beta Innovations' }, date: '2023-10-25', validUntil: '2023-11-25', amount: 2200.50, status: 'Sent' },
 { id: 'Q003', customer: { id: 'CUST003', name: 'Gamma Services', businessName: 'Gamma Services Co.' }, date: '2023-10-24', validUntil: '2023-11-24', amount: 800.75, status: 'Accepted' },
  { id: 'Q004', customer: { id: 'CUST004', name: 'Delta Industries' }, date: '2023-10-23', validUntil: '2023-11-23', amount: 500.00, status: 'Rejected' },
  { id: 'Q005', customer: { id: 'CUST005', name: 'Epsilon Enterprises' }, date: '2023-10-22', validUntil: '2023-11-22', amount: 3500.00, status: 'Sent' },
];

const QuotationManagementPage = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Modal States
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

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = searchTerm === '' ||
      quotation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quotation.customer.businessName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      quotation.status.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || quotation.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleViewQuotation = (quotation : Quotation) => {
    setQuotationToView(quotation);
    setIsViewModalOpen(true);
  };

  const handleOpenQuotationModal = (quotation?: Quotation) => {
    setEditingQuotation(quotation || null);
    setIsQuotationModalOpen(true);
  };

  const handleSendQuotation = (quotation : Quotation) => {
    setQuotationToSend(quotation);
    setIsSendModalOpen(true);
    // Implement send logic here
    console.log(`Sending quotation ${quotation.id}...`);
  };

  const handleDeleteQuotationClick = (quotation: Quotation) => {
    setQuotationToDelete(quotation); // Store the whole object
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

  // Calculate Dashboard Metrics (Mock Data Based)
  const totalQuotations = quotations.length;
  const acceptedQuotations = quotations.filter(q => q.status === 'Accepted').length;
  const acceptanceRate = totalQuotations > 0 ? ((acceptedQuotations / totalQuotations) * 100).toFixed(1) : '0';
  const pendingQuotations = quotations.filter(q => q.status === 'Sent' || q.status === 'Draft').length;
  const totalQuoteValue = quotations.reduce((sum, q) => sum + q.amount, 0).toFixed(2);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Accepted': return 'default';
      case 'Sent': return 'secondary';
      case 'Draft': return 'outline';
      case 'Rejected': return 'destructive';
      case 'Expired': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="flex flex-col h-full px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Quotations"
        description="Create, manage, and track your sales quotations."
        actions={
          <Button onClick={() => handleOpenQuotationModal()}>
            <Plus className="mr-2 h-4 w-4" /> New Quotation
          </Button>
        }
      />

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuotations}</div>
            <p className="text-xs text-muted-foreground">+5 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptanceRate}%</div>
            <p className="text-xs text-muted-foreground">+3.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingQuotations}</div>
            <p className="text-xs text-muted-foreground">-2 since last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quote Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalQuoteValue}</div>
            <p className="text-xs text-muted-foreground">+19% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Quotations Section */}
      <div className="mt-8 mb-8 rounded-lg border shadow-sm bg-card">
        <CardHeader className="border-b">
          <CardTitle>Quotations List</CardTitle>
          <CardDescription>Overview of all sales quotations.</CardDescription>
        </CardHeader>
        <div className="h-full overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">Loading quotations...</div>
 ) : filteredQuotations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No quotations found. Create one to get started!</div>
          ) : (
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quotations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              {/* Placeholder for Filter Button */}
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Quote ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead className="hidden md:table-cell">Items</TableHead> {/* Hide on small screens */}
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-medium">{quotation.id}</TableCell>
                      <TableCell>{quotation.customer.name}</TableCell>
                      <TableCell>{quotation.date}</TableCell>
                      <TableCell>{quotation.validUntil}</TableCell>
                      <TableCell className="hidden md:table-cell">N/A (Placeholder)</TableCell> {/* Placeholder for number of items */}
                      <TableCell className="text-right">${quotation.amount.toFixed(2)}</TableCell>
                      <TableCell><Badge variant={getStatusBadgeVariant(quotation.status)}>{quotation.status}</Badge></TableCell>
                      <TableCell className="text-right">
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
                            <DropdownMenuItem onClick={() => handleOpenQuotationModal(quotation)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendQuotation(quotation)} disabled={quotation.status !== 'Draft'}>
                              <Send className="mr-2 h-4 w-4" /> Send
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteQuotationClick(quotation)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
        </div>
      </div>

      {/* View Quotation Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Quotation Details: {quotationToView?.id}</DialogTitle>
            <FormDialogDescription>
              Detailed information for quotation sent to {quotationToView?.customer.name}.
            </FormDialogDescription>
          </DialogHeader>
          {quotationToView && (
            <div className="grid gap-4 py-4 text-sm max-h-[60vh] overflow-y-auto">
              <p><strong>Quotation ID:</strong> {quotationToView.id}</p>
              <p><strong>Customer Name:</strong> {quotationToView.customer.name}</p>
              <p><strong>Amount:</strong> ${quotationToView.amount.toFixed(2)}</p>
              <p><strong>Status:</strong> {quotationToView.status}</p>
              <p><strong>Created At:</strong> {new Date(quotationToView.date).toLocaleDateString()}</p>
              
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
              Prepare to send quotation to {quotationToSend?.customer.name}.
            </FormDialogDescription>
          </DialogHeader>
 <div className="grid gap-4 py-4">
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
              Are you sure you want to delete quotation {quotationToDelete?.id} for {quotationToDelete?.customer.name}? This action cannot be undone.
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

