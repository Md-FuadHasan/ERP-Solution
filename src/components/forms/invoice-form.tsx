'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, type ControllerRenderProps } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, PlusCircle, Trash2, DollarSign, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Invoice, InvoiceItem, Customer, InvoiceStatus, PaymentProcessingStatus, PaymentRecord, CompanyProfile, PaymentMethod } from '@/types';
import { ALL_INVOICE_STATUSES, ALL_PAYMENT_PROCESSING_STATUSES, ALL_PAYMENT_METHODS } from '@/types';
import type React from 'react';
import { useEffect, useState } from 'react';

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required.").max(200),
  quantity: z.coerce.number().min(0.01, "Quantity must be positive."),
  unitPrice: z.coerce.number().min(0.01, "Unit price must be positive."),
  unitType: z.enum(['Cartons', 'PCS']).default('PCS'),
});

export const invoiceFormSchema = z.object({
  id: z.string().min(1, "Invoice number is required.").max(50),
  customerId: z.string().min(1, "Customer is required."),
  issueDate: z.date({ required_error: "Issue date is required."}),
  dueDate: z.date({ required_error: "Due date is required." }),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required."),
  status: z.enum(ALL_INVOICE_STATUSES),
  paymentProcessingStatus: z.enum(ALL_PAYMENT_PROCESSING_STATUSES),
  partialAmountPaid: z.coerce.number().positive("Amount must be positive if provided.").optional(),
  paymentMethod: z.enum(ALL_PAYMENT_METHODS).optional(),
  cashVoucherNumber: z.string().max(50).optional().nullable(),
  bankName: z.string().max(100).optional().nullable(),
  bankAccountNumber: z.string().max(50).optional().nullable(),
  onlineTransactionNumber: z.string().max(100).optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.paymentProcessingStatus === 'Partially Paid' && (data.partialAmountPaid === undefined || data.partialAmountPaid === null || data.partialAmountPaid <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Partial payment amount is required and must be positive.",
      path: ["partialAmountPaid"],
    });
  }
  if ((data.paymentProcessingStatus === 'Partially Paid' || data.paymentProcessingStatus === 'Fully Paid') && !data.paymentMethod) {
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Payment method is required when processing a payment.",
        path: ["paymentMethod"],
    });
  }
  if (data.paymentMethod === 'Cash' && !data.cashVoucherNumber && (data.paymentProcessingStatus === 'Partially Paid' || data.paymentProcessingStatus === 'Fully Paid')) {
     ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cash voucher number is required for cash payments.",
        path: ["cashVoucherNumber"],
    });
  }
  if (data.paymentMethod === 'Bank Transfer' && (!data.bankName || !data.bankAccountNumber || !data.onlineTransactionNumber) && (data.paymentProcessingStatus === 'Partially Paid' || data.paymentProcessingStatus === 'Fully Paid')) {
    if (!data.bankName) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bank name is required for bank transfers.", path: ["bankName"]});
    }
    if (!data.bankAccountNumber) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bank account number is required for bank transfers.", path: ["bankAccountNumber"]});
    }
    if (!data.onlineTransactionNumber) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Online transaction number is required for bank transfers.", path: ["onlineTransactionNumber"]});
    }
  }
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  initialData?: Invoice | null;
  customers: Customer[];
  companyProfile: CompanyProfile;
  onSubmit: (data: InvoiceFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const getDefaultFormValues = (invoice?: Invoice | null): InvoiceFormValues => {
  if (invoice) {
    return {
      id: invoice.id,
      customerId: invoice.customerId,
      issueDate: new Date(invoice.issueDate),
      dueDate: new Date(invoice.dueDate),
      items: invoice.items.map(item => ({...item, unitType: item.unitType || 'PCS'})),
      status: invoice.status,
      paymentProcessingStatus: invoice.paymentProcessingStatus || (invoice.remainingBalance <= 0 && invoice.totalAmount > 0 ? 'Fully Paid' : invoice.amountPaid > 0 ? 'Partially Paid' : 'Unpaid'),
      partialAmountPaid: undefined,
      paymentMethod: undefined, 
      cashVoucherNumber: '',
      bankName: '',
      bankAccountNumber: '',
      onlineTransactionNumber: '',
    };
  }
  return {
    id: `INV-${String(Date.now()).slice(-6)}-${Math.random().toString(36).substring(2,5)}`,
    customerId: '',
    issueDate: new Date(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    items: [{ description: '', quantity: 1, unitPrice: 0, unitType: 'PCS' }],
    status: 'Draft',
    paymentProcessingStatus: 'Unpaid',
    partialAmountPaid: undefined,
    paymentMethod: undefined,
    cashVoucherNumber: '',
    bankName: '',
    bankAccountNumber: '',
    onlineTransactionNumber: '',
  };
};


export function InvoiceForm({ initialData, customers, companyProfile, onSubmit, onCancel, isSubmitting }: InvoiceFormProps) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: getDefaultFormValues(initialData),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchedItems = form.watch("items");
  const watchedPaymentProcessingStatus = form.watch("paymentProcessingStatus");
  const watchedPartialAmountPaid = form.watch("partialAmountPaid");
  const watchedPaymentMethod = form.watch("paymentMethod");

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [isCustomerSearchFocused, setIsCustomerSearchFocused] = useState(false);


  useEffect(() => {
    if (initialData && initialData.customerId) {
      const currentCustomer = customers.find(c => c.id === initialData.customerId);
      setCustomerSearch(currentCustomer?.name || initialData.customerName || '');
    } else {
      setCustomerSearch('');
    }
    form.reset(getDefaultFormValues(initialData));
    setCustomerSuggestions([]);
    setIsCustomerSearchFocused(false);
  }, [initialData, customers, form]);


  useEffect(() => {
    if (watchedPaymentProcessingStatus === 'Fully Paid' || watchedPaymentProcessingStatus === 'Unpaid') {
      if (form.getValues('partialAmountPaid') !== undefined) { 
         form.setValue('partialAmountPaid', undefined, {shouldValidate: true});
      }
    }
     if (watchedPaymentProcessingStatus === 'Unpaid') {
        form.setValue('paymentMethod', undefined, {shouldValidate: true});
     }
  }, [watchedPaymentProcessingStatus, form]);

   useEffect(() => {
    const currentMethod = form.getValues('paymentMethod');
    if (currentMethod === 'Cash') {
      form.setValue('bankName', '', { shouldValidate: false });
      form.setValue('bankAccountNumber', '', { shouldValidate: false });
      form.setValue('onlineTransactionNumber', '', { shouldValidate: false });
    } else if (currentMethod === 'Bank Transfer') {
      form.setValue('cashVoucherNumber', '', { shouldValidate: false });
    } else if (currentMethod === undefined) { 
      form.setValue('cashVoucherNumber', '', { shouldValidate: false });
      form.setValue('bankName', '', { shouldValidate: false });
      form.setValue('bankAccountNumber', '', { shouldValidate: false });
      form.setValue('onlineTransactionNumber', '', { shouldValidate: false });
    }
  }, [watchedPaymentMethod, form]);


  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setCustomerSearch(searchTerm);
    if (searchTerm) {
      setCustomerSuggestions(
        customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } else {
      setCustomerSuggestions([]);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    form.setValue('customerId', customer.id, { shouldValidate: true });
    setCustomerSearch(customer.name);
    setCustomerSuggestions([]);
    setIsCustomerSearchFocused(false); 
  };

  const itemsToCalc = watchedItems; 
  const subtotalDisplay = itemsToCalc.reduce((acc, item) => acc + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
  
  const taxRate = companyProfile.taxRate ? Number(companyProfile.taxRate)/100 : 0.10;
  const vatRate = companyProfile.vatRate ? Number(companyProfile.vatRate)/100 : 0.05;

  const taxAmountDisplay = subtotalDisplay * taxRate;
  const vatAmountDisplay = subtotalDisplay * vatRate;
  const totalAmountDisplay = subtotalDisplay + taxAmountDisplay + vatAmountDisplay;
  
  let displayAmountPaid = initialData?.amountPaid || 0;
  if (watchedPaymentProcessingStatus === 'Fully Paid') {
    displayAmountPaid = totalAmountDisplay; 
  } else if (watchedPaymentProcessingStatus === 'Partially Paid' && watchedPartialAmountPaid && watchedPartialAmountPaid > 0) {
    displayAmountPaid = (initialData?.amountPaid || 0) + watchedPartialAmountPaid;
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. INV-2024-001" {...field} readOnly={!!initialData && !!initialData.id} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => ( 
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Popover 
                  open={isCustomerSearchFocused && customerSuggestions.length > 0} 
                  onOpenChange={(open) => {
                    if (!open) {
                      setIsCustomerSearchFocused(false); 
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Input 
                      placeholder="Type to search customer..." 
                      value={customerSearch}
                      onChange={handleCustomerSearchChange}
                      onFocus={() => setIsCustomerSearchFocused(true)}
                      className="pr-8"
                      autoComplete="off"
                    />
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[--radix-popover-trigger-width] p-0" 
                    onOpenAutoFocus={(e) => e.preventDefault()} 
                  >
                    <ul className="max-h-60 overflow-y-auto">
                      {customerSuggestions.map(cust => (
                        <li 
                          key={cust.id} 
                          onClick={() => handleCustomerSelect(cust)}
                          className="p-2 hover:bg-accent cursor-pointer text-sm"
                        >
                          {cust.name} ({cust.id})
                        </li>
                      ))}
                    </ul>
                  </PopoverContent>
                </Popover>
                <FormMessage /> 
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }: { field: ControllerRenderProps<InvoiceFormValues, 'issueDate'> }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Issue Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }: { field: ControllerRenderProps<InvoiceFormValues, 'dueDate'> }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ALL_INVOICE_STATUSES.map((status) => ( 
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Set to 'Received' automatically if fully paid.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormLabel>Invoice Items</FormLabel>
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-col md:flex-row items-start md:items-center gap-2 rounded-md border p-3">
              <FormField
                control={form.control}
                name={`items.${index}.description`}
                render={({ field }) => (
                  <FormItem className="flex-grow w-full md:w-auto">
                    <FormLabel className="sr-only">Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Item Description" {...field} className="min-h-[40px] text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem className="w-full md:w-24">
                    <FormLabel className="sr-only">Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Quantity" {...field} step="0.01" className="text-sm"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name={`items.${index}.unitType`}
                render={({ field }) => (
                  <FormItem className="w-full md:w-32">
                    <FormLabel className="sr-only">Unit Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value || 'PCS'}>
                      <FormControl>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PCS">PCS</SelectItem>
                        <SelectItem value="Cartons">Cartons</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.unitPrice`}
                render={({ field }) => (
                  <FormItem className="w-full md:w-32">
                    <FormLabel className="sr-only">Unit Price</FormLabel>
                    <FormControl>
                        <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        <Input type="number" placeholder="Price" {...field} step="0.01" className="pl-6 text-sm"/>
                        </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-right md:text-left w-full md:w-24 pt-1 md:pt-0 md:pl-2">
                <span className="font-medium text-sm">
                  ${((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0)).toFixed(2)}
                </span>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10 self-center md:self-auto">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => append({ description: '', quantity: 1, unitPrice: 0, unitType: 'PCS' })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="paymentProcessingStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Collection Status (for this save)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ALL_PAYMENT_PROCESSING_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <FormDescription>Select if making a payment with this save.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {watchedPaymentProcessingStatus === 'Partially Paid' && (
            <FormField
              control={form.control}
              name="partialAmountPaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partial Amount Being Paid Now</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="number" placeholder="Enter amount" {...field} step="0.01" className="pl-7" 
                             value={field.value === undefined ? '' : field.value}
                             onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {(watchedPaymentProcessingStatus === 'Partially Paid' || watchedPaymentProcessingStatus === 'Fully Paid') && (
         <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Payment Method (for this payment)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {ALL_PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method} value={method}>
                                {method}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                {watchedPaymentMethod === 'Cash' && (
                    <FormField
                        control={form.control}
                        name="cashVoucherNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cash Voucher Number</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter voucher number" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
            </div>
            
            {watchedPaymentMethod === 'Bank Transfer' && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter bank name" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bankAccountNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Bank Account Number</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter account number" {...field} value={field.value || ''}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="onlineTransactionNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Online Transaction Number</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter transaction number" {...field} value={field.value || ''}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            )}
         </>
        )}


        <div className="mt-6 rounded-lg border bg-muted/50 p-6 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotalDisplay.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({ (taxRate * 100).toFixed(0) }%):</span>
            <span>${taxAmountDisplay.toFixed(2)}</span>
          </div>
           <div className="flex justify-between">
            <span>VAT ({ (vatRate * 100).toFixed(0) }%):</span>
            <span>${vatAmountDisplay.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Amount:</span>
            <span>${totalAmountDisplay.toFixed(2)}</span>
          </div>
          <hr className="my-2 border-border" />
           <div className="flex justify-between text-md">
            <span>Total Amount Paid (All Time):</span>
            <span className={(initialData?.amountPaid || 0) > 0 ? "text-green-600 dark:text-green-400" : ""}>${(initialData?.amountPaid || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-md font-semibold text-primary">
            <span>Overall Remaining Balance:</span>
            <span>${(initialData?.remainingBalance !== undefined ? initialData.remainingBalance : totalAmountDisplay).toFixed(2)}</span>
          </div>
        </div>

        {initialData?.paymentHistory && initialData.paymentHistory.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary"/>
                <h4 className="text-md font-semibold text-foreground">Payment History</h4>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm max-h-60 overflow-y-auto">
              <ul className="space-y-3">
                {initialData.paymentHistory.map((record) => (
                  <li key={record.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-medium text-card-foreground">
                        {record.status} {record.paymentMethod ? `(${record.paymentMethod})` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.paymentDate), "MMM dd, yyyy 'at' hh:mm a")}
                      </p>
                      {record.paymentMethod === 'Cash' && record.cashVoucherNumber && (
                        <p className="text-xs text-muted-foreground">Voucher: {record.cashVoucherNumber}</p>
                      )}
                      {record.paymentMethod === 'Bank Transfer' && (
                        <>
                          {record.bankName && <p className="text-xs text-muted-foreground">Bank: {record.bankName}</p>}
                          {record.bankAccountNumber && <p className="text-xs text-muted-foreground">Acc: {record.bankAccountNumber}</p>}
                          {record.onlineTransactionNumber && <p className="text-xs text-muted-foreground">TxN: {record.onlineTransactionNumber}</p>}
                        </>
                      )}
                    </div>
                    <p className="font-semibold text-primary mt-1 sm:mt-0">
                      ${record.amount.toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}


        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (initialData && invoices.some(i => i.id === initialData.id) ? 'Save Changes' : 'Create Invoice')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Helper to check if the initialData invoice is actually present in the main invoices list (from context)
// This helps determine if it's a true edit of an existing persisted invoice vs. a new invoice pre-filled from params.
// This is not used in the current code but can be useful for more complex logic.
const invoices: Invoice[] = []; // This would need to be passed in or accessed from context if used.
