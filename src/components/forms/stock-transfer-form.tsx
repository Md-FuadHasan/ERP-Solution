
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
import { Check, ChevronsUpDown } from 'lucide-react';
import type { Product, Warehouse } from '@/types';
import { cn } from '@/lib/utils';
import { useData } from '@/context/DataContext'; // To get current stock

const stockTransferFormSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  sourceWarehouseId: z.string().min(1, "Source warehouse is required."),
  destinationWarehouseId: z.string().min(1, "Destination warehouse is required."),
  transferQuantity: z.coerce.number().min(0.01, "Transfer quantity must be positive and greater than zero."),
}).superRefine((data, ctx) => {
  if (data.sourceWarehouseId === data.destinationWarehouseId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Source and destination warehouses cannot be the same.",
      path: ["destinationWarehouseId"],
    });
  }
  // Further refinement for transferQuantity vs available stock will be handled in the component
});

export type StockTransferFormValues = z.infer<typeof stockTransferFormSchema>;

interface StockTransferFormProps {
  products: Product[];
  warehouses: Warehouse[];
  onSubmit: (data: StockTransferFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function StockTransferForm({
  products,
  warehouses,
  onSubmit,
  onCancel,
  isSubmitting,
}: StockTransferFormProps) {
  const { getStockForProductInWarehouse } = useData();
  
  const form = useForm<StockTransferFormValues>({
    resolver: zodResolver(stockTransferFormSchema),
    defaultValues: {
      productId: '',
      sourceWarehouseId: '',
      destinationWarehouseId: '',
      transferQuantity: undefined,
    },
  });

  const selectedProductId = form.watch('productId');
  const selectedSourceWarehouseId = form.watch('sourceWarehouseId');

  const [isProductPopoverOpen, setIsProductPopoverOpen] = React.useState(false);
  const [currentProductSearchInput, setCurrentProductSearchInput] = React.useState('');

  const currentStockInSource = React.useMemo(() => {
    if (selectedProductId && selectedSourceWarehouseId) {
      return getStockForProductInWarehouse(selectedProductId, selectedSourceWarehouseId);
    }
    return 0;
  }, [selectedProductId, selectedSourceWarehouseId, getStockForProductInWarehouse]);
  
  const selectedProductDetails = products.find(p => p.id === selectedProductId);
  const baseUnitLabel = selectedProductDetails ? selectedProductDetails.unitType : 'units';

  const filteredProducts = React.useMemo(() => {
    if (!currentProductSearchInput.trim()) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(currentProductSearchInput.toLowerCase().trim()) ||
      p.id.toLowerCase().includes(currentProductSearchInput.toLowerCase().trim()) ||
      (p.sku && p.sku.toLowerCase().includes(currentProductSearchInput.toLowerCase().trim()))
    );
  }, [products, currentProductSearchInput]);

  const handleSubmit = (values: StockTransferFormValues) => {
    if (values.transferQuantity > currentStockInSource) {
      form.setError("transferQuantity", {
        type: "manual",
        message: `Transfer quantity cannot exceed available stock of ${currentStockInSource} ${baseUnitLabel}.`
      });
      return;
    }
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                      className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? products.find(p => p.id === field.value)?.name : "Select product"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search product..."
                      value={currentProductSearchInput}
                      onValueChange={setCurrentProductSearchInput}
                    />
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        {filteredProducts.map(product => (
                          <CommandItem
                            value={product.name}
                            key={product.id}
                            onSelect={() => {
                              form.setValue("productId", product.id, { shouldValidate: true });
                              setIsProductPopoverOpen(false);
                              setCurrentProductSearchInput(product.name);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", product.id === field.value ? "opacity-100" : "opacity-0")} />
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
          name="sourceWarehouseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source Warehouse *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source warehouse" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {warehouses.map(wh => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name} ({wh.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProductId && field.value && (
                 <FormDescription className="text-xs pt-1">
                   Available stock: {currentStockInSource} {baseUnitLabel}
                 </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="destinationWarehouseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination Warehouse *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination warehouse" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {warehouses.map(wh => (
                    <SelectItem key={wh.id} value={wh.id} disabled={wh.id === selectedSourceWarehouseId}>
                      {wh.name} ({wh.location})
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
          name="transferQuantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transfer Quantity (in {baseUnitLabel}) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter quantity to transfer"
                  {...field}
                  value={field.value === undefined ? '' : String(field.value)}
                  onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                  disabled={!selectedProductId || !selectedSourceWarehouseId}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting ? 'Transferring...' : 'Transfer Stock'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
