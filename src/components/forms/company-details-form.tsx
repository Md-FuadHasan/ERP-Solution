'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { CompanyProfile } from '@/types';

const companyDetailsFormSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters.").max(100),
  email: z.string().email("Invalid email address.").max(100),
  phone: z.string().min(7, "Phone number seems too short.").max(20),
  address: z.string().min(5, "Address is required.").max(255),
});

type CompanyDetailsFormValues = z.infer<typeof companyDetailsFormSchema>;

interface CompanyDetailsFormProps {
  initialData: CompanyProfile; // Assuming initialData always exists for settings
  onSubmit: (data: CompanyDetailsFormValues) => void;
  isSubmitting?: boolean;
}

export function CompanyDetailsForm({ initialData, onSubmit, isSubmitting }: CompanyDetailsFormProps) {
  const form = useForm<CompanyDetailsFormValues>({
    resolver: zodResolver(companyDetailsFormSchema),
    defaultValues: {
      name: initialData.name || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      address: initialData.address || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Company LLC" {...field} />
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
                <FormLabel>Company Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@yourcompany.com" {...field} />
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
                <FormLabel>Company Phone</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="(555) 000-1111" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Address</FormLabel>
              <FormControl>
                <Textarea placeholder="1 Corporate Drive, Business City, ST 12345" {...field} className="min-h-[100px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Company Details'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
