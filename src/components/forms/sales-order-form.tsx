
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
import { CalendarIcon, PlusCircle, Trash2, DollarSign, ChevronsUpDown, Check, User, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import type { SalesOrder, SalesOrderItem, Customer, Product, ProductUnitType } from '@/types';
import { PRODUCT_UNIT_TYPES } from '@/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useData } from '@/context/DataContext'; // To get products and customers

const salesOrderItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product is required."),
  productName: z.string().optional(), // For display
  quantity: z.coerce.number().min(0.01, "Quantity must be positive."),
  unitType: z.custom<ProductUnitType>((val) => PRODUCT_UNIT_TYPES.includes(val as ProductUnitType), {
    message: "Invalid unit type",
  }),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative."), // This price is (product.basePrice + product.exciseTax) for the chosen unitType
});

const salesOrderFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  salespersonId: z.string().optional().nullable(), // Placeholder for now
  routeId: z.string().optional().nullable(), // Placeholder for now
  orderDate: z.date({ required_error: "Order date is required." }),
  expectedDeliveryDate: z.date().optional().nullable(),
  items: z.array(salesOrderItemSchema).min(1, "At least one item is required."),
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional().nullable(),
});

export type SalesOrderFormValues = z.infer<typeof salesOrderFormSchema>;

interface SalesOrderFormProps {
  initialData?: SalesOrder | null;
  onSubmit: (data: SalesOrderFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function SalesOrderForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: SalesOrderFormProps) {
  const { customers, products, getProductById } = useData(); // Use DataContext to get customers and products

  const form = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderFormSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          orderDate: new Date(initialData.orderDate),
          expectedDeliveryDate: initialData.expectedDeliveryDate
            ? new Date(initialData.expectedDeliveryDate)
            : undefined,
          items: initialData.items.map(item => ({
            ...item,
            id: item.id || `so-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            productName: products.find(p => p.id === item.productId)?.name || item.productName || item.productId,
          })),
          notes: initialData.notes || '',
        }
      : {
          customerId: '',
          salespersonId: '', // Placeholder
          routeId: '', // Placeholder
          orderDate: new Date(),
          expectedDeliveryDate: addDays(new Date(), 7), // Default to 7 days from now
          items: [{
            id: `so-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            productId: '',
            productName: '',
            quantity: 1,
            unitType: PRODUCT_UNIT_TYPES[0], // Default to first unit type
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

  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = React.useState(false);
  const [currentCustomerSearchInput, setCurrentCustomerSearchInput] = React.useState(
    initialData?.customerId ? customers.find(c => c.id === initialData.customerId)?.name || '' : ''
  );

  const [isProductPopoverOpen, setIsProductPopoverOpen] = React.useState<Record<number, boolean>>({});
  const [currentProductSearchInput, setCurrentProductSearchInput] = React.useState<Record<number, string>>({});

  React.useEffect(() => {
    if (initialData?.customerId) {
      const customerName = customers.find(c => c.id === initialData.customerId)?.name;
      setCurrentCustomerSearchInput(customerName || '');
    }
    initialData?.items.forEach((item, index) => {
        const productName = products.find(p => p.id === item.productId)?.name;
        if (productName) {
            setCurrentProductSearchInput(prev => ({...prev, [index]: productName}));
        }
    });
  }, [initialData, customers, products]);

  const filteredCustomers = React.useMemo(() => {
    if (!currentCustomerSearchInput.trim()) return customers;
    return customers.filter(c => c.name.toLowerCase().includes(currentCustomerSearchInput.toLowerCase().trim()));
  }, [customers, currentCustomerSearchInput]);

  const getFilteredProducts = (index: number) => {
    const searchVal = currentProductSearchInput[index]?.toLowerCase().trim() || '';
    if (!searchVal) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchVal) ||
      (p.sku && p.sku.toLowerCase().includes(searchVal)) ||
      p.id.toLowerCase().includes(searchVal)
    );
  };

  const calculateUnitPriceForSalesOrderItem = (product: Product, lineItemUnitType: ProductUnitType): number => {
    let price = product.basePrice;
    let excise = product.exciseTax || 0;

    if (lineItemUnitType.toLowerCase() !== product.unitType.toLowerCase()) {
      if (lineItemUnitType.toLowerCase() === product.packagingUnit?.toLowerCase() && product.itemsPerPackagingUnit) {
        price = product.basePrice * product.itemsPerPackagingUnit;
        excise = (product.exciseTax || 0) * product.itemsPerPackagingUnit;
      } else if (lineItemUnitType.toLowerCase() === 'pcs' && product.unitType.toLowerCase() !== 'pcs' && product.piecesInBaseUnit) {
        price = product.basePrice / product.piecesInBaseUnit;
        excise = (product.exciseTax || 0) / product.piecesInBaseUnit;
      }
    }
    return price + excise;
  };

  const handleProductSelect = (index: number, product: Product) => {
    const currentItem = form.getValues(`items.${index}`);
    const defaultUnit = product.unitType; // Default to product's base unit for sale
    const unitPrice = calculateUnitPriceForSalesOrderItem(product, defaultUnit);

    update(index, {
      ...currentItem,
      productId: product.id,
      productName: product.name,
      unitType: defaultUnit,
      unitPrice: unitPrice,
    });
    setCurrentProductSearchInput(prev => ({ ...prev, [index]: product.name }));
    setIsProductPopoverOpen(prev => ({ ...prev, [index]: false }));
  };
  
  const handleUnitTypeChange = (index: number, newUnitType: ProductUnitType) => {
    const currentItem = form.getValues(`items.${index}`);
    const product = getProductById(currentItem.productId);
    if (!product) return;

    const newUnitPrice = calculateUnitPriceForSalesOrderItem(product, newUnitType);
    update(index, { ...currentItem, unitType: newUnitType, unitPrice: newUnitPrice });
  };


  const subtotal = watchedItems.reduce((acc, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return acc + (quantity * unitPrice);
  }, 0);
  const totalAmount = subtotal; // For SO, total might be same as subtotal if no SO-level taxes/discounts

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Customer *</FormLabel>
                <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? customers.find(c => c.id === field.value)?.name : "Select customer"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search customer..."
                        value={currentCustomerSearchInput}
                        onValueChange={setCurrentCustomerSearchInput}
                      />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                          {filteredCustomers.map(customer => (
                            <CommandItem
                              value={customer.name}
                              key={customer.id}
                              onSelect={() => {
                                form.setValue("customerId", customer.id, { shouldValidate: true });
                                setIsCustomerPopoverOpen(false);
                                setCurrentCustomerSearchInput(customer.name);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", customer.id === field.value ? "opacity-100" : "opacity-0")} />
                              {customer.name}
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
            name="orderDate"
            render={({ field }: { field: ControllerRenderProps<SalesOrderFormValues, 'orderDate'> }) => (
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="expectedDeliveryDate"
            render={({ field }: { field: ControllerRenderProps<SalesOrderFormValues, 'expectedDeliveryDate'> }) => (
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

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="salespersonId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Salesperson ID (Optional)</FormLabel>
                    <div className="relative">
                    <User className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                        <Input placeholder="Enter Salesperson ID" {...field} value={field.value || ''} className="pl-8" />
                    </FormControl>
                    </div>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="routeId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Route ID (Optional)</FormLabel>
                    <div className="relative">
                     <MapPin className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                        <Input placeholder="Enter Route ID" {...field} value={field.value || ''} className="pl-8" />
                    </FormControl>
                    </div>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>


        <div className="space-y-3">
          <FormLabel>Order Items *</FormLabel>
          {fields.map((itemField, index) => {
            const selectedProductForLine = getProductById(form.watch(`items.${index}.productId`));
            const availableUnits = selectedProductForLine
              ? [selectedProductForLine.unitType, ...(selectedProductForLine.packagingUnit ? [selectedProductForLine.packagingUnit as ProductUnitType] : [])]
                  .filter((value, idx, self) => self.indexOf(value) === idx) // Unique units
              : PRODUCT_UNIT_TYPES;

            return (
              <div key={itemField.id} className="flex flex-col md:flex-row items-start md:items-center gap-2 rounded-md border p-3 space-y-2 md:space-y-0">
                 <FormField
                    control={form.control}
                    name={`items.${index}.productId`}
                    render={({ field }) => (
                    <FormItem className="flex-grow-[3] w-full md:w-auto">
                        <FormLabel className="sr-only">Product</FormLabel>
                        <Popover open={isProductPopoverOpen[index] || false} onOpenChange={(open) => setIsProductPopoverOpen(prev => ({ ...prev, [index]: open }))}>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button variant="outline" role="combobox" className={cn("w-full justify-between text-sm", !field.value && "text-muted-foreground")}>
                                {field.value ? (products.find(p => p.id === field.value)?.name || form.getValues(`items.${index}.productName`)) : "Select product"}
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
                    <FormItem className="flex-grow-[1] w-full md:w-24"><FormLabel className="sr-only">Quantity</FormLabel>
                      <FormControl><Input type="number" placeholder="Qty" {...field} step="0.01" className="text-sm"/></FormControl>
                    <FormMessage /></FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name={`items.${index}.unitType`}
                  render={({ field }) => (
                    <FormItem className="flex-grow-[1] w-full md:w-32"><FormLabel className="sr-only">Unit</FormLabel>
                      <Select onValueChange={(value) => handleUnitTypeChange(index, value as ProductUnitType)} value={field.value} disabled={!form.watch(`items.${index}.productId`)}>
                        <FormControl><SelectTrigger className="text-sm"><SelectValue placeholder="Unit" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {availableUnits.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    <FormMessage /></FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem className="flex-grow-[1] w-full md:w-32"><FormLabel className="sr-only">Unit Price</FormLabel>
                      <FormControl><div className="relative">
                          <DollarSign className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                          <Input type="number" placeholder="Price" {...field} step="0.01" className="pl-6 text-sm" readOnly/>
                      </div></FormControl>
                       <FormDescription className="text-xs">Base + Excise</FormDescription>
                    <FormMessage /></FormItem>
                  )}
                />
                <div className="text-right md:text-left flex-grow-[1] w-full md:w-24 pt-1 md:pt-0 md:pl-2">
                  <span className="font-medium text-sm">${((Number(watchedItems[index]?.quantity) || 0) * (Number(watchedItems[index]?.unitPrice) || 0)).toFixed(2)}</span>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10 self-center md:self-auto">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({
                id: `so-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                productId: '',
                productName: '',
                quantity: 1,
                unitType: PRODUCT_UNIT_TYPES[0], // Default to first unit type
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
                <Textarea placeholder="Enter any notes for this sales order..." {...field} value={field.value || ''} className="min-h-[80px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-6 rounded-lg border bg-muted/50 p-4 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal (Base Price + Excise):</span><span>${subtotal.toFixed(2)}</span></div>
          {/* VAT will be applied when converting to Invoice */}
          <div className="flex justify-between font-semibold text-md"><span>Order Total (Pre-VAT):</span><span>${totalAmount.toFixed(2)}</span></div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Sales Order')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
