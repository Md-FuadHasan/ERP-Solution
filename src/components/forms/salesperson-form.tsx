
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Salesperson, Warehouse } from '@/types'; // Assuming Warehouse type exists for dropdown
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const salespersonFormSchema = z.object({
  id: z.string().optional(), // Auto-generated for new, used for editing
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Invalid email address.").optional().nullable(),
  assignedRouteId: z.string().max(50, "Route ID cannot exceed 50 characters.").optional().nullable(),
  assignedWarehouseId: z.string().optional().nullable(),
});

export type SalespersonFormValues = z.infer<typeof salespersonFormSchema>;

interface SalespersonFormProps {
  initialData?: Salesperson | null;
  warehouses: Warehouse[]; // Pass warehouses for the dropdown
  onSubmit: (data: SalespersonFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function SalespersonForm({ initialData, warehouses, onSubmit, onCancel, isSubmitting }: SalespersonFormProps) {
  const form = useForm<SalespersonFormValues>({
    resolver: zodResolver(salespersonFormSchema),
    defaultValues: initialData || {
      name: '',
      email: '',
      assignedRouteId: '',
      assignedWarehouseId: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Salesperson ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., SP-ROUTE-001 (auto-generated if blank)"
                  {...field}
                  readOnly={!!initialData} // Read-only if editing
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                {initialData ? "ID cannot be changed." : "Leave blank for auto-generation or enter a custom ID."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter salesperson's full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="salesperson@example.com" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assignedRouteId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned Route/Territory ID (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., JED-NORTH, RIY-CENTRAL" {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>Enter the code or identifier for their primary route/territory.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assignedWarehouseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned Primary Warehouse (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary warehouse" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>The main warehouse this salesperson operates from or draws stock from.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Salesperson')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    