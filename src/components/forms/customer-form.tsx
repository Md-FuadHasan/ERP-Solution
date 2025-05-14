
'use client';

import * as React from 'react'; // Added React import
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Customer, CustomerType, InvoiceAgingDays } from '@/types';
import { CUSTOMER_TYPES, INVOICE_AGING_OPTIONS } from '@/types';

const customerFormSchema = z.object({
  id: z.string().max(50).optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100),
  email: z.string().email({ message: "Invalid email address." }).max(100),
  phone: z.string().min(7, { message: "Phone number seems too short." }).max(20),
  billingAddress: z.string().min(5, { message: "Billing address is required." }).max(255),
  shippingAddress: z.string().max(255).optional(),
  customerType: z.enum(CUSTOMER_TYPES, { required_error: "Customer type is required." }),
  creditLimit: z.coerce.number().positive("Credit limit must be a positive number.").optional(),
  invoiceAgingDays: z.coerce.number().optional().transform(val => val ? Number(val) as InvoiceAgingDays : undefined),
}).superRefine((data, ctx) => {
  if (data.customerType === 'Credit') {
    if (data.creditLimit === undefined || data.creditLimit === null || data.creditLimit <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Credit limit is required for Credit customers and must be positive.",
        path: ["creditLimit"],
      });
    }
    if (!data.invoiceAgingDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invoice aging period is required for Credit customers.",
        path: ["invoiceAgingDays"],
      });
    }
  }
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  initialData?: Customer | null;
  onSubmit: (data: CustomerFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CustomerForm({ initialData, onSubmit, onCancel, isSubmitting }: CustomerFormProps) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: initialData ? {
      id: initialData.id,
      name: initialData.name,
      email: initialData.email,
      phone: initialData.phone,
      billingAddress: initialData.billingAddress,
      shippingAddress: initialData.shippingAddress || '',
      customerType: initialData.customerType || 'Cash',
      creditLimit: initialData.creditLimit || undefined,
      invoiceAgingDays: initialData.invoiceAgingDays || undefined,
    } : {
      id: '',
      name: '',
      email: '',
      phone: '',
      billingAddress: '',
      shippingAddress: '',
      customerType: 'Cash',
      creditLimit: undefined,
      invoiceAgingDays: undefined,
    },
  });

  const watchedCustomerType = form.watch("customerType");

  // Reset credit fields if customer type changes to Cash
  React.useEffect(() => {
    if (watchedCustomerType === 'Cash') {
      form.setValue('creditLimit', undefined);
      form.setValue('invoiceAgingDays', undefined);
    }
  }, [watchedCustomerType, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer ID</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Leave blank for auto-generation" 
                  {...field} 
                  readOnly={!!initialData} 
                  disabled={!!initialData} 
                />
              </FormControl>
              {!initialData && <FormDescription>Optional. If left blank, a unique ID will be generated.</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="e.g. john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="e.g. (555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="billingAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Address</FormLabel>
              <FormControl>
                <Textarea placeholder="123 Main St, Anytown, USA" {...field} className="min-h-[80px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shippingAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shipping Address (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Leave blank if same as billing" {...field} className="min-h-[80px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customerType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CUSTOMER_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedCustomerType === 'Credit' && (
          <>
            <FormField
              control={form.control}
              name="invoiceAgingDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Aging Period</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value ? parseInt(value) as InvoiceAgingDays : undefined)} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select aging period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INVOICE_AGING_OPTIONS.map(days => (
                        <SelectItem key={days} value={days.toString()}>{days} days</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Limit Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter credit limit" 
                      {...field} 
                      value={field.value === undefined ? '' : String(field.value)} 
                      onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Customer')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
