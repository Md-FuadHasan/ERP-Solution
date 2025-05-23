
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, type ControllerRenderProps } from 'react-hook-form';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, PlusCircle, Trash2, DollarSign, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { PurchaseOrder, PurchaseOrderItem, Supplier, Product, ProductUnitType } from '@/types';
import { PRODUCT_UNIT_TYPES } from '@/types'; // Assuming you have this array of unit types
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const purchaseOrderItemSchema = z.object({
  id: z.string().optional(), // For existing items during edit
  productId: z.string().min(1, "Product is required."),
  quantity: z.coerce.number().min(0.01, "Quantity must be positive."),
  unitType: z.enum(PRODUCT_UNIT_TYPES, { required_error: "Unit type is required." }),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative."), // Cost price from supplier
});

const purchaseOrderFormSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required."),
  orderDate: z.date({ required_error: "Order date is required." }),
  expectedDeliveryDate: z.date().optional().nullable(),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required."),
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional().nullable(),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

interface PurchaseOrderFormProps {
  initialData?: PurchaseOrder | null;
  suppliers: Supplier[];
  products: Product[]; // To select products for line items
  onSubmit: (data: PurchaseOrderFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PurchaseOrderForm({
  initialData,
  suppliers,
  products,
  onSubmit,
  onCancel,
  isSubmitting,
}: PurchaseOrderFormProps) {
  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          orderDate: new Date(initialData.orderDate),
          expectedDeliveryDate: initialData.expectedDeliveryDate
            ? new Date(initialData.expectedDeliveryDate)
            : undefined,
          items: initialData.items.map(item => ({
            ...item,
            id: item.id || `po-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          })),
        }
      : {
          supplierId: '',
          orderDate: new Date(),
          expectedDeliveryDate: undefined,
          items: [{
            id: `po-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            productId: '',
            quantity: 1,
            unitType: PRODUCT_UNIT_TYPES[0],
            unitPrice: 0,
          }],
          notes: '',
        },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");

  const [isSupplierPopoverOpen, setIsSupplierPopoverOpen] = React.useState(false);
  const [currentSupplierSearchInput, setCurrentSupplierSearchInput] = React.useState(
    initialData?.supplierId ? suppliers.find(s => s.id === initialData.supplierId)?.name || '' : ''
  );

  const [isProductPopoverOpen, setIsProductPopoverOpen] = React.useState<Record<number, boolean>>({});
  const [currentProductSearchInput, setCurrentProductSearchInput] = React.useState<Record<number, string>>({});


  React.useEffect(() => {
    if (initialData?.supplierId) {
      const supplierName = suppliers.find(s => s.id === initialData.supplierId)?.name;
      setCurrentSupplierSearchInput(supplierName || '');
    }
    // Populate initial product search inputs if editing
    initialData?.items.forEach((item, index) => {
        const productName = products.find(p => p.id === item.productId)?.name;
        if (productName) {
            setCurrentProductSearchInput(prev => ({...prev, [index]: productName}));
        }
    });
  }, [initialData, suppliers, products]);


  const filteredSuppliers = React.useMemo(() => {
    if (!currentSupplierSearchInput.trim()) return suppliers;
    return suppliers.filter(s => s.name.toLowerCase().includes(currentSupplierSearchInput.toLowerCase().trim()));
  }, [suppliers, currentSupplierSearchInput]);

  const getFilteredProducts = (index: number) => {
    const searchVal = currentProductSearchInput[index]?.toLowerCase().trim() || '';
    if (!searchVal) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchVal) ||
      (p.sku && p.sku.toLowerCase().includes(searchVal)) ||
      p.id.toLowerCase().includes(searchVal)
    );
  };

  const handleProductSelect = (index: number, product: Product) => {
    const currentItem = form.getValues(`items.${index}`);
    update(index, {
      ...currentItem,
      productId: product.id,
      unitType: product.unitType, // Default to product's base unit
      unitPrice: product.costPrice || 0, // Default to product's cost price
    });
    setCurrentProductSearchInput(prev => ({ ...prev, [index]: product.name }));
    setIsProductPopoverOpen(prev => ({ ...prev, [index]: false }));
  };


  const subtotal = React.useMemo(() => {
    return watchedItems.reduce((acc, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      return acc + quantity * unitPrice;
    }, 0);
  }, [watchedItems]);

  // Assuming tax on PO is simple for now, can be expanded
  const taxAmount = subtotal * 0; // Placeholder for supplier VAT or other taxes
  const totalAmount = subtotal + taxAmount;

  const handleSubmitPo = (values: PurchaseOrderFormValues) => {
    const dataToSubmit = {
        ...values,
        items: values.items.map(item => ({
            ...item,
            total: (item.quantity || 0) * (item.unitPrice || 0)
        }))
    };
    onSubmit(dataToSubmit as any); // Type assertion needed if onSubmit expects full PO with totals
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitPo)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem className="flex flex-col md:col-span-2">
                <FormLabel>Supplier *</FormLabel>
                <Popover open={isSupplierPopoverOpen} onOpenChange={setIsSupplierPopoverOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? suppliers.find(s => s.id === field.value)?.name : "Select supplier"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search supplier..."
                        value={currentSupplierSearchInput}
                        onValueChange={setCurrentSupplierSearchInput}
                      />
                      <CommandList>
                        <CommandEmpty>No supplier found.</CommandEmpty>
                        <CommandGroup>
                          {filteredSuppliers.map(supplier => (
                            <CommandItem
                              value={supplier.name}
                              key={supplier.id}
                              onSelect={() => {
                                form.setValue("supplierId", supplier.id, { shouldValidate: true });
                                setIsSupplierPopoverOpen(false);
                                setCurrentSupplierSearchInput(supplier.name);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", supplier.id === field.value ? "opacity-100" : "opacity-0")} />
                              {supplier.name}
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="orderDate"
            render={({ field }: { field: ControllerRenderProps<PurchaseOrderFormValues, 'orderDate'> }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Order Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
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
            name="expectedDeliveryDate"
            render={({ field }: { field: ControllerRenderProps<PurchaseOrderFormValues, 'expectedDeliveryDate'> }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expected Delivery Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <FormLabel>Order Items *</FormLabel>
          {fields.map((itemField, index) => (
            <div key={itemField.id} className="flex flex-col md:flex-row items-start md:items-center gap-2 rounded-md border p-3 space-y-2 md:space-y-0">
              <FormField
                control={form.control}
                name={`items.${index}.productId`}
                render={({ field }) => (
                  <FormItem className="flex-grow-[2] w-full md:w-auto">
                    <FormLabel className="sr-only">Product</FormLabel>
                     <Popover
                        open={isProductPopoverOpen[index] || false}
                        onOpenChange={(open) => setIsProductPopoverOpen(prev => ({ ...prev, [index]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                              {field.value ? products.find(p => p.id === field.value)?.name : "Select product"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Search product..." value={currentProductSearchInput[index] || ''} onValueChange={(search) => setCurrentProductSearchInput(prev => ({ ...prev, [index]: search }))} />
                            <CommandList><CommandEmpty>No product found.</CommandEmpty><CommandGroup>
                                {getFilteredProducts(index).map(product => (
                                  <CommandItem value={product.name} key={product.id} onSelect={() => handleProductSelect(index, product)}>
                                    <Check className={cn("mr-2 h-4 w-4", product.id === field.value ? "opacity-100" : "opacity-0")} />
                                    {product.name} (SKU: {product.sku})
                                  </CommandItem>
                                ))}
                            </CommandGroup></CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem className="w-full md:w-24"><FormLabel className="sr-only">Quantity</FormLabel>
                    <FormControl><Input type="number" placeholder="Qty" {...field} step="0.01" className="text-sm"/></FormControl>
                  <FormMessage /></FormItem>
                )}
              />
               <FormField
                control={form.control}
                name={`items.${index}.unitType`}
                render={({ field }) => (
                  <FormItem className="w-full md:w-32"><FormLabel className="sr-only">Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={form.getValues(`items.${index}.productId`) ? products.find(p=>p.id === form.getValues(`items.${index}.productId`))?.unitType : PRODUCT_UNIT_TYPES[0]}>
                      <FormControl><SelectTrigger className="text-sm"><SelectValue placeholder="Unit" /></SelectTrigger></FormControl>
                      <SelectContent>{PRODUCT_UNIT_TYPES.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
                    </Select>
                  <FormMessage /></FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.unitPrice`}
                render={({ field }) => (
                  <FormItem className="w-full md:w-32"><FormLabel className="sr-only">Unit Price</FormLabel>
                    <FormControl><div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        <Input type="number" placeholder="Price" {...field} step="0.01" className="pl-6 text-sm"/>
                    </div></FormControl>
                  <FormMessage /></FormItem>
                )}
              />
              <div className="text-right md:text-left w-full md:w-24 pt-1 md:pt-0 md:pl-2">
                <span className="font-medium text-sm">${((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0)).toFixed(2)}</span>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10 self-center md:self-auto">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({
                id: `po-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                productId: '',
                quantity: 1,
                unitType: PRODUCT_UNIT_TYPES[0],
                unitPrice: 0
            })}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter any notes for this purchase order..." {...field} value={field.value || ''} className="min-h-[80px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-6 rounded-lg border bg-muted/50 p-4 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax (e.g. VAT from supplier):</span><span>${taxAmount.toFixed(2)}</span></div>
          <div className="flex justify-between font-semibold text-md"><span>Total Amount:</span><span>${totalAmount.toFixed(2)}</span></div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Purchase Order')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    