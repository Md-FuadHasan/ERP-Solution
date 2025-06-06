
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
import { Textarea } from '@/components/ui/textarea'; // Not used in current form, but kept for potential future use
import { CalendarIcon, PlusCircle, Trash2, DollarSign, History, ChevronsUpDown, Check, PackageSearch, Warehouse as WarehouseIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import type { Invoice, InvoiceItem, Customer, InvoiceStatus, PaymentProcessingStatus, PaymentRecord, CompanyProfile, PaymentMethod, Product, Warehouse } from '@/types';
import { ALL_INVOICE_STATUSES, ALL_PAYMENT_PROCESSING_STATUSES, ALL_PAYMENT_METHODS } from '@/types';
import type React from 'react';
import { useEffect, useState, useRef, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useData } from '@/context/DataContext';


const invoiceItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product is required."),
  description: z.string().min(1, "Description is required.").max(200),
  quantity: z.coerce.number().min(0.01, "Quantity must be positive."),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative."),
  unitType: z.enum(['Cartons', 'PCS']).default('PCS'),
  sourceWarehouseId: z.string().optional(), // Added for warehouse selection
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
  paymentMethod: z.enum(ALL_PAYMENT_METHODS).optional(),
  cashVoucherNumber: z.string().max(50).optional().nullable(),
  bankName: z.string().max(100).optional().nullable(),
  bankAccountNumber: z.string().max(50).optional().nullable(),
  onlineTransactionNumber: z.string().max(100).optional().nullable(),
}).superRefine((data, ctx) => {
  data.items.forEach((item, index) => {
    if (item.productId && !item.sourceWarehouseId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Source warehouse is required for each item.",
        path: [`items.${index}.sourceWarehouseId`],
      });
    }
  });
  if (data.paymentProcessingStatus === 'Partially Paid' && (data.partialAmountPaid === undefined || data.partialAmountPaid === null || data.partialAmountPaid <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Partial payment amount is required and must be positive.",
      path: ["partialAmountPaid"],
    });
  }
  if ((data.paymentProcessingStatus === 'Partially Paid' || data.paymentProcessingStatus === 'Fully Paid') && !data.paymentMethod) {
     ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Payment method is required when processing a payment.",
        path: ["paymentMethod"],
    });
  }
  if (data.paymentMethod === 'Cash' && !data.cashVoucherNumber && (data.paymentProcessingStatus === 'Partially Paid' || data.paymentProcessingStatus === 'Fully Paid')) {
     ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cash voucher number is required for cash payments.",
        path: ["cashVoucherNumber"],
    });
  }
  if (data.paymentMethod === 'Bank Transfer' && (!data.bankName || !data.bankAccountNumber || !data.onlineTransactionNumber) && (data.paymentProcessingStatus === 'Partially Paid' || data.paymentProcessingStatus === 'Fully Paid')) {
    if (!data.bankName) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bank name is required for bank transfers.", path: ["bankName"]});
    }
    if (!data.bankAccountNumber) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bank account number is required for bank transfers.", path: ["bankAccountNumber"]});
    }
    if (!data.onlineTransactionNumber) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Online transaction number is required for bank transfers.", path: ["onlineTransactionNumber"]});
    }
  }
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  initialData?: Invoice | null;
  customers: Customer[];
  companyProfile: CompanyProfile;
  invoices: Invoice[];
  prefillData?: { customerId?: string | null; customerName?: string | null } | null;
  onSubmit: (data: InvoiceFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const getDefaultFormValues = (invoice?: Invoice | null, prefillCustomerId?: string | null, customersArray?: Customer[]): InvoiceFormValues => {
  let defaultDueDate = new Date(new Date().setDate(new Date().getDate() + 30));
  if (!invoice && prefillCustomerId && customersArray) {
    const customer = customersArray.find(c => c.id === prefillCustomerId);
    if (customer && customer.customerType === 'Credit' && customer.invoiceAgingDays) {
      defaultDueDate = addDays(new Date(), customer.invoiceAgingDays);
    }
  } else if (invoice) {
     defaultDueDate = new Date(invoice.dueDate);
  }


  if (invoice) {
    return {
      id: invoice.id,
      customerId: invoice.customerId,
      issueDate: new Date(invoice.issueDate),
      dueDate: defaultDueDate,
      items: invoice.items.map(item => ({
        ...item,
        id: item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        unitType: item.unitType || 'PCS',
        productId: item.productId || '',
        unitPrice: item.unitPrice, // unitPrice already includes (base + excise)
        sourceWarehouseId: item.sourceWarehouseId || undefined,
      })),
      status: invoice.status,
      paymentProcessingStatus: 'Unpaid',
      partialAmountPaid: undefined,
      paymentMethod: undefined,
      cashVoucherNumber: '',
      bankName: '',
      bankAccountNumber: '',
      onlineTransactionNumber: '',
    };
  }

  return {
    id: `INV-${String(Date.now()).slice(-6)}`,
    customerId: prefillCustomerId || '',
    issueDate: new Date(),
    dueDate: defaultDueDate,
    items: [{
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      unitType: 'PCS',
      sourceWarehouseId: undefined,
    }],
    status: 'Pending',
    paymentProcessingStatus: 'Unpaid',
    partialAmountPaid: undefined,
    paymentMethod: undefined,
    cashVoucherNumber: '',
    bankName: '',
    bankAccountNumber: '',
    onlineTransactionNumber: '',
  };
};


export function InvoiceForm({ initialData, customers, companyProfile, invoices, prefillData, onSubmit, onCancel, isSubmitting: parentIsSubmitting }: InvoiceFormProps) {
  const { products, warehouses, getStockForProductInWarehouse } = useData();
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: getDefaultFormValues(initialData, prefillData?.customerId, customers),
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { isSubmitting: formIsSubmitting } = form.formState;
  const actualIsSubmitting = parentIsSubmitting || formIsSubmitting;

  const watchedItems = form.watch("items");
  const watchedPaymentProcessingStatus = form.watch("paymentProcessingStatus");
  const watchedPartialAmountPaid = form.watch("partialAmountPaid");
  const watchedPaymentMethod = form.watch("paymentMethod");
  const watchedCustomerId = form.watch("customerId");


  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [currentCustomerSearchInput, setCurrentCustomerSearchInput] = useState('');
  const [isProductPopoverOpen, setIsProductPopoverOpen] = useState<Record<number, boolean>>({});
  const [currentProductSearchInput, setCurrentProductSearchInput] = useState<Record<number, string>>({});


  const prevInitialDataRef = useRef(initialData);
  const prevPrefillDataRef = useRef(prefillData);

  useEffect(() => {
    if (prevInitialDataRef.current !== initialData || prevPrefillDataRef.current !== prefillData ||
        (initialData && prevInitialDataRef.current && initialData.id !== prevInitialDataRef.current.id) ||
        (prefillData && prevPrefillDataRef.current && prefillData.customerId !== prevPrefillDataRef.current.customerId)
       ) {
      const defaultVals = getDefaultFormValues(initialData, !initialData && prefillData ? prefillData.customerId : null, customers);
      form.reset(defaultVals);

      let customerForSearchInput: Customer | undefined;
      if (!initialData && prefillData?.customerId) {
          customerForSearchInput = customers.find(c => c.id === prefillData.customerId);
          setCurrentCustomerSearchInput(customerForSearchInput ? customerForSearchInput.name : (prefillData.customerName || ""));
      } else if (initialData) {
          customerForSearchInput = customers.find(c => c.id === initialData.customerId);
          setCurrentCustomerSearchInput(customerForSearchInput ? customerForSearchInput.name : "");
      } else {
          setCurrentCustomerSearchInput("");
      }

      prevInitialDataRef.current = initialData;
      prevPrefillDataRef.current = prefillData;
    }
  }, [initialData, prefillData, customers, form]);

  useEffect(() => {
    if (!initialData && watchedCustomerId) {
      const selectedCustomer = customers.find(c => c.id === watchedCustomerId);
      if (selectedCustomer && selectedCustomer.customerType === 'Credit' && selectedCustomer.invoiceAgingDays) {
        const issueDate = form.getValues('issueDate') || new Date();
        const newDueDate = addDays(new Date(issueDate), selectedCustomer.invoiceAgingDays);
        form.setValue('dueDate', newDueDate, { shouldValidate: true });
      }
    }
  }, [watchedCustomerId, initialData, customers, form]);



  useEffect(() => {
    if (watchedPaymentProcessingStatus === 'Fully Paid' || watchedPaymentProcessingStatus === 'Unpaid') {
      if (form.getValues('partialAmountPaid') !== undefined) {
         form.setValue('partialAmountPaid', undefined, {shouldValidate: true});
      }
    }
     if (watchedPaymentProcessingStatus === 'Unpaid') {
        form.setValue('paymentMethod', undefined, {shouldValidate: true});
     }
  }, [watchedPaymentProcessingStatus, form]);

   useEffect(() => {
    const currentMethod = form.getValues('paymentMethod');
    if (currentMethod === 'Cash') {
      form.setValue('bankName', '', { shouldValidate: false });
      form.setValue('bankAccountNumber', '', { shouldValidate: false });
      form.setValue('onlineTransactionNumber', '', { shouldValidate: false });
    } else if (currentMethod === 'Bank Transfer') {
      form.setValue('cashVoucherNumber', '', { shouldValidate: false });
    } else if (currentMethod === undefined || currentMethod === null || currentMethod === '') {
      form.setValue('cashVoucherNumber', '', { shouldValidate: false });
      form.setValue('bankName', '', { shouldValidate: false });
      form.setValue('bankAccountNumber', '', { shouldValidate: false });
      form.setValue('onlineTransactionNumber', '', { shouldValidate: false });
    }
  }, [watchedPaymentMethod, form]);


  const calculateUnitPriceForInvoiceItem = (product: Product, lineItemUnitType: 'PCS' | 'Cartons'): number => {
    const basePrice = product.basePrice;
    const exciseTax = product.exciseTax || 0;

    if (lineItemUnitType === 'PCS') {
      // If selling by PCS, derive price from base unit, considering piecesInBaseUnit
      const piecesInBase = product.piecesInBaseUnit || (product.unitType.toLowerCase() === 'pcs' ? 1 : 1); // Default to 1 if not specified or base unit is already PCS
      const basePricePerPiece = basePrice / piecesInBase;
      const excisePerPiece = exciseTax / piecesInBase;
      return basePricePerPiece + excisePerPiece;
    } else { // Selling by 'Cartons' (or other product.unitType if it's a package)
      // Check if the lineItemUnitType matches the product's main unitType (which might be a carton)
      if (product.unitType.toLowerCase() === lineItemUnitType.toLowerCase()) {
        return basePrice + exciseTax; // Price is for one base unit (which is a carton)
      }
      // Check if lineItemUnitType matches the product's larger optional packagingUnit
      else if (product.packagingUnit && product.itemsPerPackagingUnit && product.packagingUnit.toLowerCase() === lineItemUnitType.toLowerCase()) {
        const totalBasePriceForPackage = basePrice * product.itemsPerPackagingUnit;
        const totalExciseForPackage = exciseTax * product.itemsPerPackagingUnit;
        return totalBasePriceForPackage + totalExciseForPackage;
      }
      // Fallback or error: This should ideally not be reached if UI restricts unitType selection properly.
      // For safety, return the price for one base unit.
      console.warn(`Could not match lineItemUnitType "${lineItemUnitType}" to product ${product.id} units. Defaulting to base unit price + excise.`);
      return basePrice + exciseTax;
    }
  };


  const handleProductSelect = (index: number, product: Product) => {
    const currentItem = form.getValues(`items.${index}`);
    // Default to PCS if product is primarily PCS, otherwise default to product's base unit (e.g., Cartons)
    const defaultLineItemUnitType = product.unitType.toLowerCase() === 'pcs' ? 'PCS' : (product.unitType as 'PCS' | 'Cartons');

    const unitPriceWithExcise = calculateUnitPriceForInvoiceItem(product, defaultLineItemUnitType);

    update(index, {
      ...currentItem,
      productId: product.id,
      description: product.name,
      unitPrice: unitPriceWithExcise,
      unitType: defaultLineItemUnitType,
      sourceWarehouseId: currentItem.sourceWarehouseId || undefined, // Preserve if already set
    });
    setCurrentProductSearchInput(prev => ({ ...prev, [index]: product.name }));
    setIsProductPopoverOpen(prev => ({ ...prev, [index]: false }));
  };

  const handleUnitTypeChange = (index: number, newLineItemUnitType: 'PCS' | 'Cartons') => {
    const currentItem = form.getValues(`items.${index}`);
    const productId = currentItem.productId;
    if (!productId) {
        update(index, {...currentItem, unitType: newLineItemUnitType});
        return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const unitPriceWithExcise = calculateUnitPriceForInvoiceItem(product, newLineItemUnitType);

    update(index, {
      ...currentItem,
      unitPrice: unitPriceWithExcise,
      unitType: newLineItemUnitType,
    });
  };


  const itemsToCalc = watchedItems || [];
  const subtotalDisplay = itemsToCalc.reduce((acc, item) => acc + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
  const generalTaxAmountDisplay = 0; // Assuming general tax is 0 as per previous discussions
  const vatRate = companyProfile.vatRate ? Number(companyProfile.vatRate)/100 : 0;
  const vatAmountDisplay = subtotalDisplay * vatRate;
  const totalAmountDisplay = subtotalDisplay + vatAmountDisplay;


  let displayAmountPaid = initialData?.amountPaid || 0;
  let displayRemainingBalance = initialData?.remainingBalance !== undefined ? initialData.remainingBalance : totalAmountDisplay;

  if (watchedPaymentProcessingStatus === 'Fully Paid') {
    displayRemainingBalance = 0;
  } else if (watchedPaymentProcessingStatus === 'Partially Paid' && watchedPartialAmountPaid && watchedPartialAmountPaid > 0) {
    const currentPaid = initialData?.amountPaid || 0;
    const potentialNewPaid = currentPaid + watchedPartialAmountPaid;
    displayRemainingBalance = Math.max(0, totalAmountDisplay - potentialNewPaid);
  }


  const isEditingExistingInvoice = initialData?.id && invoices.some(i => i.id === initialData.id);

  const filteredCustomers = useMemo(() => {
    if (!currentCustomerSearchInput.trim()) {
      return customers;
    }
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(currentCustomerSearchInput.toLowerCase().trim()) ||
        customer.id.toLowerCase().includes(currentCustomerSearchInput.toLowerCase().trim())
    );
  }, [customers, currentCustomerSearchInput]);

  const getFilteredProducts = (index: number) => {
    const searchVal = currentProductSearchInput[index]?.toLowerCase().trim() || '';
    if (!searchVal) return products;
    return products.filter(
        (product) =>
        product.name.toLowerCase().includes(searchVal) ||
        (product.sku && product.sku.toLowerCase().includes(searchVal)) ||
        product.id.toLowerCase().includes(searchVal)
    );
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-10">
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem className="flex flex-col md:col-span-3">
                <FormLabel>Invoice Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. INV-2024001" {...field} readOnly={!!initialData?.id && isEditingExistingInvoice} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
         <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem className="flex flex-col md:col-span-7">
                <FormLabel>Customer</FormLabel>
                <Popover
                  open={isCustomerPopoverOpen}
                  onOpenChange={(open) => {
                    setIsCustomerPopoverOpen(open);
                    if (!open) {
                      const selectedCustomerId = form.getValues("customerId");
                      const customer = customers.find(c => c.id === selectedCustomerId);
                       if (customer) {
                         setCurrentCustomerSearchInput(customer.name);
                       }
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isCustomerPopoverOpen}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? customers.find((customer) => customer.id === field.value)?.name ?? 'Select customer...'
                          : "Select customer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search customer by name or ID..."
                        value={currentCustomerSearchInput}
                        onValueChange={setCurrentCustomerSearchInput}
                      />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                          {filteredCustomers.map((customer) => (
                            <CommandItem
                              value={customer.name}
                              key={customer.id}
                              onSelect={() => {
                                form.setValue("customerId", customer.id, { shouldValidate: true });
                                setIsCustomerPopoverOpen(false);
                                setCurrentCustomerSearchInput(customer.name);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  customer.id === field.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {customer.name} ({customer.id})
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
              <FormItem className="flex flex-col">
                <FormLabel>Invoice Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ALL_INVOICE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>This status will automatically update based on payment and due date.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormLabel>Invoice Items</FormLabel>
          {fields.map((itemField, index) => {
            const selectedProductId = form.watch(`items.${index}.productId`);
            const selectedWarehouseId = form.watch(`items.${index}.sourceWarehouseId`);
            const availableStock = selectedProductId && selectedWarehouseId ? getStockForProductInWarehouse(selectedProductId, selectedWarehouseId) : undefined;
            const selectedProduct = products.find(p => p.id === selectedProductId);
            const stockUnit = selectedProduct ? selectedProduct.unitType : 'units';

            return (
              <div key={itemField.id} className="grid grid-cols-1 md:grid-cols-12 items-start gap-2 rounded-md border p-3">
                <FormField
                  control={form.control}
                  name={`items.${index}.productId`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-4">
                      <FormLabel className="sr-only">Product</FormLabel>
                      <Popover
                        open={isProductPopoverOpen[index] || false}
                        onOpenChange={(open) => setIsProductPopoverOpen(prev => ({ ...prev, [index]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" className={cn("w-full justify-between text-sm", !field.value && "text-muted-foreground")}>
                              {field.value ? (products.find(p => p.id === field.value)?.name ?? "Select product") : "Select product"}
                              <PackageSearch className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command><CommandInput placeholder="Search product..." value={currentProductSearchInput[index] || ''} onValueChange={(search) => setCurrentProductSearchInput(prev => ({ ...prev, [index]: search }))} />
                            <CommandList><CommandEmpty>No product found.</CommandEmpty><CommandGroup>
                              {getFilteredProducts(index).map((product) => (
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
                  name={`items.${index}.sourceWarehouseId`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel className="sr-only">Source Warehouse</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={!selectedProductId}>
                        <FormControl>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select Warehouse" />
                            <WarehouseIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel className="sr-only">Quantity</FormLabel>
                      <FormControl><Input type="number" placeholder="Qty" {...field} step="0.01" className="text-sm"/></FormControl>
                      {availableStock !== undefined && <FormDescription className="text-xs pt-1">Avail: {availableStock} {stockUnit}</FormDescription>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.unitType`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel className="sr-only">Unit Type</FormLabel>
                      <Select onValueChange={(value) => { field.onChange(value); handleUnitTypeChange(index, value as 'PCS' | 'Cartons'); }} value={field.value} defaultValue={field.value || 'PCS'}>
                        <FormControl><SelectTrigger className="text-sm"><SelectValue placeholder="Unit" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="PCS">PCS</SelectItem><SelectItem value="Cartons">Cartons</SelectItem></SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel className="sr-only">Unit Price</FormLabel>
                      <FormControl><div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        <Input type="number" placeholder="Price" {...field} step="0.01" className="pl-6 text-sm" readOnly={!!form.getValues(`items.${index}.productId`)} />
                      </div></FormControl>
                      <FormDescription className="text-xs">Incl. Item Excise</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-1 text-right md:text-left self-center pt-1 md:pt-0 md:pl-2">
                  <span className="font-medium text-sm">${((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0)).toFixed(2)}</span>
                </div>
                <div className="md:col-span-1 flex justify-end md:justify-center items-center">
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            )
          })}
          <Button type="button" variant="outline" onClick={() => append({ id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, productId: '', description: '', quantity: 1, unitPrice: 0, unitType: 'PCS', sourceWarehouseId: undefined })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="paymentProcessingStatus"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Payment Collection Status (for this save)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
                 <FormDescription>Select if making a payment with this save. This will affect Amount Paid.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {watchedPaymentProcessingStatus === 'Partially Paid' && (
            <FormField
              control={form.control}
              name="partialAmountPaid"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Partial Amount Being Paid Now</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="number" placeholder="Enter amount" {...field} step="0.01" className="pl-7"
                             value={field.value === undefined ? '' : String(field.value)}
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

        {(watchedPaymentProcessingStatus === 'Partially Paid' || watchedPaymentProcessingStatus === 'Fully Paid') && (
         <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Payment Method (for this payment)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {ALL_PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method} value={method}>
                                {method}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                {watchedPaymentMethod === 'Cash' && (
                    <FormField
                        control={form.control}
                        name="cashVoucherNumber"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Cash Voucher Number</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter voucher number" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
            </div>

            {watchedPaymentMethod === 'Bank Transfer' && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter bank name" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bankAccountNumber"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Bank Account Number</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter account number" {...field} value={field.value || ''}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="onlineTransactionNumber"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Online Transaction Number</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter transaction number" {...field} value={field.value || ''}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            )}
         </>
        )}


        <div className="mt-6 rounded-lg border bg-muted/50 p-6 space-y-2">
          <div className="flex justify-between">
            <span className="text-foreground">Subtotal (incl. Item Excise):</span>
            <span className="text-foreground">${subtotalDisplay.toFixed(2)}</span>
          </div>
           <div className="flex justify-between">
            <span className="text-foreground">VAT ({ (vatRate * 100).toFixed(0) }% on Subtotal):</span>
            <span className="text-foreground">${vatAmountDisplay.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span className="text-primary">Total Amount:</span>
            <span className="text-primary">${totalAmountDisplay.toFixed(2)}</span>
          </div>
          <hr className="my-2 border-border" />
           <div className="flex justify-between text-md">
            <span className="text-foreground">Total Amount Paid (All Time):</span>
            <span className={(displayAmountPaid) > 0 ? "text-green-600 dark:text-green-400" : "text-foreground"}>${(displayAmountPaid).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-md font-semibold">
            <span className="text-foreground">Overall Remaining Balance:</span>
            <span className={displayRemainingBalance > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}>
              ${displayRemainingBalance.toFixed(2)}
            </span>
          </div>
        </div>

        {initialData?.paymentHistory && initialData.paymentHistory.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary"/>
                <h4 className="text-md font-semibold text-foreground">Payment History</h4>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm max-h-60 overflow-y-auto">
              <ul className="space-y-3">
                {initialData.paymentHistory.map((record) => (
                  <li key={record.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-medium text-card-foreground">
                        {record.status} {record.paymentMethod ? `(${record.paymentMethod})` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.paymentDate), "MMM dd, yyyy 'at' hh:mm a")}
                      </p>
                      {record.paymentMethod === 'Cash' && record.cashVoucherNumber && (
                        <p className="text-xs text-muted-foreground">Voucher: {record.cashVoucherNumber}</p>
                      )}
                      {record.paymentMethod === 'Bank Transfer' && (
                        <>
                          {record.bankName && <p className="text-xs text-muted-foreground">Bank: {record.bankName}</p>}
                          {record.bankAccountNumber && <p className="text-xs text-muted-foreground">Acc: {record.bankAccountNumber}</p>}
                          {record.onlineTransactionNumber && <p className="text-xs text-muted-foreground">TxN: {record.onlineTransactionNumber}</p>}
                        </>
                      )}
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={actualIsSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={actualIsSubmitting || !form.formState.isValid}>
            {actualIsSubmitting ? 'Saving...' : (isEditingExistingInvoice ? 'Save Invoice' : 'Create Invoice')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

