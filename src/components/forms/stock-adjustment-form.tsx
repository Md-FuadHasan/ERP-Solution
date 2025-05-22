
'use client';

import * as React from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, DollarSign } from 'lucide-react';
import type { Product, Warehouse } from '@/types';
import { cn } from '@/lib/utils';

const stockAdjustmentFormSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  warehouseId: z.string().min(1, "Warehouse is required."),
  newStockLevel: z.coerce.number().min(0, "Stock level cannot be negative."),
  // reason: z.string().optional(), // Future enhancement
});

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentFormSchema>;

interface StockAdjustmentFormProps {
  products: Product[];
  warehouses: Warehouse[];
  onSubmit: (data: StockAdjustmentFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: { productId?: string; warehouseId?: string; currentStock?: number };
}

export function StockAdjustmentForm({
  products,
  warehouses,
  onSubmit,
  onCancel,
  isSubmitting,
  initialData,
}: StockAdjustmentFormProps) {
  const form = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentFormSchema),
    defaultValues: {
      productId: initialData?.productId || '',
      warehouseId: initialData?.warehouseId || '',
      newStockLevel: initialData?.currentStock || 0,
    },
  });

  const [isProductPopoverOpen, setIsProductPopoverOpen] = React.useState(false);
  const [currentProductSearchInput, setCurrentProductSearchInput] = React.useState(
    initialData?.productId ? products.find(p => p.id === initialData.productId)?.name || '' : ''
  );

  React.useEffect(() => {
    if (initialData?.productId) {
      const productName = products.find(p => p.id === initialData.productId)?.name;
      setCurrentProductSearchInput(productName || '');
    }
  }, [initialData?.productId, products]);
  
  const selectedProduct = products.find(p => p.id === form.watch('productId'));
  const baseUnitLabel = selectedProduct ? selectedProduct.unitType : 'units';


  const filteredProducts = React.useMemo(() => {
    if (!currentProductSearchInput.trim()) {
      return products;
    }
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(currentProductSearchInput.toLowerCase().trim()) ||
        product.id.toLowerCase().includes(currentProductSearchInput.toLowerCase().trim()) ||
        (product.sku && product.sku.toLowerCase().includes(currentProductSearchInput.toLowerCase().trim()))
    );
  }, [products, currentProductSearchInput]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Product *</FormLabel>
              <Popover open={isProductPopoverOpen} onOpenChange={setIsProductPopoverOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? products.find((product) => product.id === field.value)?.name
                        : "Select product"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search product by name, ID, SKU..."
                      value={currentProductSearchInput}
                      onValueChange={setCurrentProductSearchInput}
                    />
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        {filteredProducts.map((product) => (
                          <CommandItem
                            value={product.name}
                            key={product.id}
                            onSelect={() => {
                              form.setValue("productId", product.id, { shouldValidate: true });
                              setIsProductPopoverOpen(false);
                              setCurrentProductSearchInput(product.name);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                product.id === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {product.name} (SKU: {product.sku})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="warehouseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Warehouse *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newStockLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Stock Level (in {baseUnitLabel}) *</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder={`Enter new total stock in ${baseUnitLabel}`} 
                  {...field}
                  value={field.value === undefined ? '' : String(field.value)}
                  onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Enter the desired total stock quantity for this product in the selected warehouse.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting ? 'Saving...' : 'Adjust Stock'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
