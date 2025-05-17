
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product, ProductCategory, ProductUnitType } from '@/types';
import { DollarSign } from 'lucide-react';

const PRODUCT_CATEGORIES: ProductCategory[] = ['Finished Goods', 'Raw Materials', 'Packaging'];
const PRODUCT_UNIT_TYPES: ProductUnitType[] = ['PCS', 'Cartons', 'Liters', 'Kgs', 'Units'];


const productFormSchema = z.object({
  id: z.string().max(50).optional(),
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  sku: z.string().min(1, "SKU is required.").max(50),
  category: z.enum(PRODUCT_CATEGORIES, { required_error: "Category is required."}),
  unitType: z.enum(PRODUCT_UNIT_TYPES, { required_error: "Unit type is required."}),
  stockLevel: z.coerce.number().min(0, "Stock level cannot be negative.").default(0),
  reorderPoint: z.coerce.number().min(0, "Reorder point cannot be negative.").default(0),
  costPrice: z.coerce.number().min(0, "Cost price cannot be negative.").default(0),
  salePrice: z.coerce.number().min(0, "Sale price cannot be negative.").default(0),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: ProductFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProductForm({ initialData, onSubmit, onCancel, isSubmitting }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      category: initialData.category || PRODUCT_CATEGORIES[0],
      unitType: initialData.unitType || PRODUCT_UNIT_TYPES[0],
    } : {
      id: '',
      name: '',
      sku: '',
      category: PRODUCT_CATEGORIES[0],
      unitType: PRODUCT_UNIT_TYPES[0],
      stockLevel: 0,
      reorderPoint: 0,
      costPrice: 0,
      salePrice: 0,
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
              <FormLabel>Product ID</FormLabel>
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
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Vanilla Ice Cream 1L Tub" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. VIC001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unitType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRODUCT_UNIT_TYPES.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="stockLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Stock Level</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 150" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reorderPoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder Point</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Price</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="number" placeholder="e.g. 2.50" {...field} step="0.01" className="pl-8" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sale Price</FormLabel>
                <FormControl>
                   <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="number" placeholder="e.g. 5.99" {...field} step="0.01" className="pl-8" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Product')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
