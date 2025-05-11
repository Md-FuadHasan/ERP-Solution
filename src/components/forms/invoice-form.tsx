
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
import type { Invoice, InvoiceItem, Customer, InvoiceStatus, PaymentProcessingStatus, PaymentRecord } from '@/types';
import { ALL_INVOICE_STATUSES, ALL_PAYMENT_PROCESSING_STATUSES } from '@/types';
import type React from 'react';
import { useEffect } from 'react';

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required.").max(200),
  quantity: z.coerce.number().min(0.01, "Quantity must be positive."),
  unitPrice: z.coerce.number().min(0.01, "Unit price must be positive."),
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
  // paymentHistory is not part of the form schema itself, it's managed by the page
}).superRefine((data, ctx) => {
  if (data.paymentProcessingStatus === 'Partially Paid' && (data.partialAmountPaid === undefined || data.partialAmountPaid === null || data.partialAmountPaid <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Partial payment amount is required and must be positive.",
      path: ["partialAmountPaid"],
    });
  }
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  initialData?: Invoice | null;
  customers: Customer[];
  onSubmit: (data: InvoiceFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function InvoiceForm({ initialData, customers, onSubmit, onCancel, isSubmitting }: InvoiceFormProps) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      issueDate: new Date(initialData.issueDate),
      dueDate: new Date(initialData.dueDate),
      items: initialData.items.map(item => ({...item})),
      paymentProcessingStatus: initialData.paymentProcessingStatus || 'Unpaid',
      partialAmountPaid: initialData.paymentProcessingStatus === 'Partially Paid' ? initialData.amountPaid : undefined,
    } : {
      id: `INV-${String(Date.now()).slice(-6)}`,
      customerId: '',
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      status: 'Draft',
      paymentProcessingStatus: 'Unpaid',
      partialAmountPaid: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchedItems = form.watch("items");
  const watchedPaymentProcessingStatus = form.watch("paymentProcessingStatus");
  const watchedPartialAmountPaid = form.watch("partialAmountPaid");

  // Calculate totals for display
  const subtotal = watchedItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice || 0), 0);
  // Ideally these rates come from company profile in props or context
  const taxRate = initialData?.taxAmount && subtotal > 0 ? initialData.taxAmount / subtotal : ( MOCK_COMPANY_PROFILE.taxRate ? Number(MOCK_COMPANY_PROFILE.taxRate)/100 : 0.10);
  const vatRate = initialData?.vatAmount && subtotal > 0 ? initialData.vatAmount / subtotal : ( MOCK_COMPANY_PROFILE.vatRate ? Number(MOCK_COMPANY_PROFILE.vatRate)/100 : 0.05);

  const taxAmount = subtotal * taxRate;
  const vatAmount = subtotal * vatRate;
  const totalAmount = subtotal + taxAmount + vatAmount;

  let displayAmountPaid = 0;
  if (watchedPaymentProcessingStatus === 'Fully Paid') {
    displayAmountPaid = totalAmount;
  } else if (watchedPaymentProcessingStatus === 'Partially Paid') {
    displayAmountPaid = watchedPartialAmountPaid || 0;
  }
  const displayRemainingBalance = totalAmount - displayAmountPaid;

  useEffect(() => {
    if (watchedPaymentProcessingStatus === 'Fully Paid') {
      form.setValue('partialAmountPaid', undefined); 
    } else if (watchedPaymentProcessingStatus === 'Unpaid') {
      form.setValue('partialAmountPaid', undefined); 
    }
  }, [watchedPaymentProcessingStatus, form]);


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
                  <Input placeholder="e.g. INV-2024-001" {...field} readOnly={!!initialData} />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ALL_INVOICE_STATUSES.filter(s => s !== 'Paid').map((status) => ( 
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Set to 'Paid' automatically if fully paid.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormLabel>Invoice Items</FormLabel>
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-col md:flex-row items-start gap-4 rounded-md border p-4">
              <FormField
                control={form.control}
                name={`items.${index}.description`}
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel className="sr-only">Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Item description" {...field} className="min-h-[40px] md:min-h-[60px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-row md:flex-col gap-4 md:gap-0 md:space-y-2 w-full md:w-auto">
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="flex-grow md:flex-grow-0 md:w-24">
                      <FormLabel className="sr-only">Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Qty" {...field} step="0.01" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem className="flex-grow md:flex-grow-0 md:w-32">
                      <FormLabel className="sr-only">Unit Price</FormLabel>
                      <FormControl>
                         <div className="relative">
                          <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input type="number" placeholder="Price" {...field} step="0.01" className="pl-7"/>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <div className="text-right md:text-left md:w-32 pt-2 md:pt-7">
                <span className="font-medium">
                  ${(watchedItems[index]?.quantity * watchedItems[index]?.unitPrice || 0).toFixed(2)}
                </span>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mt-2 md:mt-6 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="paymentProcessingStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <FormLabel>Partial Amount Paid</FormLabel>
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

        <div className="mt-6 rounded-lg border bg-muted/50 p-6 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({ (taxRate * 100).toFixed(0) }%):</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
           <div className="flex justify-between">
            <span>VAT ({ (vatRate * 100).toFixed(0) }%):</span>
            <span>${vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Amount:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <hr className="my-2 border-border" />
           <div className="flex justify-between text-md">
            <span>Amount Paid:</span>
            <span className={displayAmountPaid > 0 ? "text-green-600 dark:text-green-400" : ""}>${displayAmountPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-md font-semibold text-primary">
            <span>Remaining Balance:</span>
            <span>${displayRemainingBalance.toFixed(2)}</span>
          </div>
        </div>

        {initialData?.paymentHistory && initialData.paymentHistory.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary"/>
                <h4 className="text-md font-semibold text-foreground">Payment History</h4>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <ul className="space-y-3">
                {initialData.paymentHistory.map((record) => (
                  <li key={record.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-medium text-card-foreground">
                        {record.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.paymentDate), "MMM dd, yyyy 'at' hh:mm a")}
                      </p>
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
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Invoice')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
