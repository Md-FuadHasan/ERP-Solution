'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CompanyProfile } from '@/types';
import { Percent } from 'lucide-react';

const taxSettingsFormSchema = z.object({
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative.").max(100, "Tax rate cannot exceed 100%."),
  vatRate: z.coerce.number().min(0, "VAT rate cannot be negative.").max(100, "VAT rate cannot exceed 100%."),
  excessTaxRate: z.coerce.number().min(0, "Excess tax rate cannot be negative.").max(100, "Rate cannot exceed 100%.").optional(),
});

type TaxSettingsFormValues = z.infer<typeof taxSettingsFormSchema>;

interface TaxSettingsFormProps {
  initialData: CompanyProfile;
  onSubmit: (data: TaxSettingsFormValues) => void;
  isSubmitting?: boolean;
}

export function TaxSettingsForm({ initialData, onSubmit, isSubmitting }: TaxSettingsFormProps) {
  const form = useForm<TaxSettingsFormValues>({
    resolver: zodResolver(taxSettingsFormSchema),
    defaultValues: {
      taxRate: Number(initialData.taxRate) || 0,
      vatRate: Number(initialData.vatRate) || 0,
      excessTaxRate: Number(initialData.excessTaxRate) || 0,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="taxRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Standard Tax Rate</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type="number" placeholder="e.g. 10" {...field} step="0.01" className="pr-8" />
                  <Percent className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </FormControl>
              <FormDescription>Enter the standard tax rate as a percentage (e.g., 10 for 10%).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vatRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>VAT Rate</FormLabel>
              <FormControl>
                 <div className="relative">
                  <Input type="number" placeholder="e.g. 5" {...field} step="0.01" className="pr-8" />
                  <Percent className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </FormControl>
              <FormDescription>Enter the Value Added Tax (VAT) rate as a percentage.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="excessTaxRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excess Tax Rate (Optional)</FormLabel>
              <FormControl>
                 <div className="relative">
                  <Input type="number" placeholder="e.g. 2" {...field} step="0.01" className="pr-8" />
                   <Percent className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </FormControl>
              <FormDescription>Enter any additional or excess tax rate if applicable.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Tax Settings'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
