
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Product, ProductCategory, ProductUnitType, CompanyProfile } from '@/types';
import { PRODUCT_CATEGORIES, PRODUCT_UNIT_TYPES } from '@/types';
import { CalendarIcon, DollarSign, Percent } from 'lucide-react';
import * as React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useData } from '@/context/DataContext'; // Import useData

const PACKAGING_UNIT_SUGGESTIONS: string[] = ['Carton', 'Box', 'Pack', 'Tray', 'Pallet', 'Master Case'];

const productFormSchema = z.object({
  id: z.string().max(50).optional(),
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  sku: z.string().min(1, "SKU is required.").max(50),
  batchNo: z.string().max(50).optional().nullable(),
  productionDate: z.date().optional().nullable(),
  expiryDate: z.date().optional().nullable(),
  category: z.enum(PRODUCT_CATEGORIES, { required_error: "Category is required." }),
  unitType: z.enum(PRODUCT_UNIT_TYPES, { required_error: "Primary Stocking Unit is required." }),
  piecesInBaseUnit: z.coerce.number().min(1, "Must be at least 1.").optional().nullable(),
  packagingUnit: z.string().max(50).optional().nullable(),
  itemsPerPackagingUnit: z.coerce.number().positive("Must be a positive number if specifying a larger package.").optional().nullable(),
  stockLevel: z.coerce.number().min(0, "Stock level cannot be negative.").default(0),
  addStockQuantity: z.coerce.number().min(0, "Cannot add negative stock.").optional().nullable(),
  reorderPoint: z.coerce.number().min(0, "Reorder point cannot be negative.").default(0),
  basePrice: z.coerce.number().min(0, "Base price cannot be negative.").default(0),
  costPrice: z.coerce.number().min(0, "Cost price cannot be negative.").default(0), // Added costPrice
  exciseTaxAmount: z.coerce.number().min(0, "Excise tax cannot be negative.").optional().nullable(),
  vatRateInput: z.coerce.number().min(0).max(100, "VAT rate must be between 0 and 100.").optional().nullable(),
  discountRate: z.coerce.number().min(0).max(100, "Discount rate must be between 0 and 100.").optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.itemsPerPackagingUnit && (!data.packagingUnit || data.packagingUnit.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Larger package name is required if specifying items per larger package.",
      path: ["packagingUnit"],
    });
  }
  if (data.packagingUnit && data.packagingUnit.trim() !== '' && (!data.itemsPerPackagingUnit || data.itemsPerPackagingUnit <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Number of base units in larger package is required and must be positive.",
      path: ["itemsPerPackagingUnit"],
    });
  }
  const isBaseUnitAPackageLike = ['Cartons', 'Pack', 'Box', 'Tray'].includes(data.unitType);
  if (isBaseUnitAPackageLike && (data.piecesInBaseUnit === undefined || data.piecesInBaseUnit === null || data.piecesInBaseUnit < 1)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Specify how many individual pieces (e.g., PCS) are in this base unit package.",
      path: ["piecesInBaseUnit"],
    });
  }
  if (data.unitType === 'PCS' && data.piecesInBaseUnit && data.piecesInBaseUnit !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "If Base Unit Type is 'PCS', then 'Pieces per Base Unit' must be 1.",
      path: ["piecesInBaseUnit"],
    });
  }
  if (data.productionDate && data.expiryDate && data.productionDate > data.expiryDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Expiry date cannot be before production date.",
      path: ["expiryDate"],
    });
  }
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: ProductFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const SectionTitle: React.FC<{ number: number; title: string }> = ({ number, title }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
      {number}
    </span>
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
  </div>
);

export function ProductForm({ initialData, onSubmit, onCancel, isSubmitting }: ProductFormProps) {
  const { companyProfile } = useData();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      productionDate: initialData.productionDate ? new Date(initialData.productionDate) : undefined,
      expiryDate: initialData.expiryDate ? new Date(initialData.expiryDate) : undefined,
      addStockQuantity: undefined, // Always reset for edit
      basePrice: initialData.basePrice,
      costPrice: initialData.costPrice || 0, // Initialize costPrice
      exciseTaxAmount: initialData.exciseTax === undefined || initialData.exciseTax === null ? undefined : initialData.exciseTax,
      vatRateInput: companyProfile?.vatRate ? Number(companyProfile.vatRate) : 15,
      discountRate: initialData.discountRate === undefined || initialData.discountRate === null ? undefined : initialData.discountRate,
      piecesInBaseUnit: initialData.piecesInBaseUnit || (initialData.unitType === 'PCS' ? 1 : undefined),
    } : {
      id: '',
      name: '',
      sku: '',
      batchNo: '',
      productionDate: undefined,
      expiryDate: undefined,
      category: undefined,
      unitType: PRODUCT_UNIT_TYPES[0],
      piecesInBaseUnit: 1,
      packagingUnit: '',
      itemsPerPackagingUnit: undefined,
      stockLevel: 0,
      addStockQuantity: undefined,
      reorderPoint: 0,
      basePrice: 0,
      costPrice: 0, // Default costPrice for new product
      exciseTaxAmount: undefined,
      vatRateInput: companyProfile?.vatRate ? Number(companyProfile.vatRate) : 15,
      discountRate: undefined,
    },
  });

  const watchedUnitType = form.watch("unitType");
  const watchedBasePrice = form.watch("basePrice");
  const watchedExciseTaxAmount = form.watch("exciseTaxAmount");
  const watchedVatRateInput = form.watch("vatRateInput");
  const watchedDiscountRate = form.watch("discountRate");

  React.useEffect(() => {
    if (watchedUnitType === 'PCS') {
      if (form.getValues("piecesInBaseUnit") !== 1) {
        form.setValue("piecesInBaseUnit", 1, { shouldValidate: true });
      }
    } else {
      // If unitType is not PCS and piecesInBaseUnit is 1 (default for new non-PCS), clear it
      // to encourage user input if the unit type implies a package.
      // Only do this if not editing or if initialData didn't already have a specific value.
      if (!initialData && form.getValues("piecesInBaseUnit") === 1) {
        // form.setValue("piecesInBaseUnit", undefined); // Or keep 1 as a valid default
      }
    }
  }, [watchedUnitType, form, initialData]);

  const priceSummary = React.useMemo(() => {
    const base = watchedBasePrice || 0;
    const excise = watchedExciseTaxAmount || 0;
    const vatRate = (watchedVatRateInput || (companyProfile?.vatRate ? Number(companyProfile.vatRate) : 15)) / 100;
    const discountRateVal = (watchedDiscountRate || 0) / 100;

    const subtotalBeforeVat = base + excise;
    const vatAmount = subtotalBeforeVat * vatRate;
    const totalBeforeDiscount = subtotalBeforeVat + vatAmount;
    const discountAmount = totalBeforeDiscount * discountRateVal;
    const finalPrice = totalBeforeDiscount - discountAmount;

    return {
      basePrice: base,
      exciseTax: excise,
      vat: vatAmount,
      discount: discountAmount,
      finalPrice: finalPrice,
    };
  }, [watchedBasePrice, watchedExciseTaxAmount, watchedVatRateInput, watchedDiscountRate, companyProfile]);

  const handleSubmitForm = (values: ProductFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="p-4 border rounded-lg shadow-sm bg-card">
          <SectionTitle number={1} title="Basic Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product ID</FormLabel>
                  <FormControl><Input placeholder="Leave blank for auto-generation" {...field} readOnly={!!initialData} disabled={!!initialData} /></FormControl>
                  {!initialData && <FormDescription className="text-xs">Optional. Auto-generated if blank.</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Product Name *</FormLabel><FormControl><Input placeholder="e.g. Vanilla Ice Cream 1L" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU *</FormLabel><FormControl><Input placeholder="e.g. VIC001" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="batchNo" render={({ field }) => (<FormItem><FormLabel>Batch No</FormLabel><FormControl><Input placeholder="Enter batch number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
          </div>
        </div>

        {/* Section 2: Dates and Categories */}
        <div className="p-4 border rounded-lg shadow-sm bg-card">
          <SectionTitle number={2} title="Categorization & Units" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                    <SelectContent>{PRODUCT_CATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
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
                  <FormLabel>Primary Stocking Unit (Base Unit) *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select unit type" /></SelectTrigger></FormControl>
                    <SelectContent>{PRODUCT_UNIT_TYPES.map(unit => (<SelectItem key={unit} value={unit}>{unit}</SelectItem>))}</SelectContent>
                  </Select>
                  <FormDescription className="text-xs">Main unit for inventory count & primary pricing.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="piecesInBaseUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Individual Pieces in this Base Unit (e.g., PCS)</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 40 if Base Unit is Carton of 40 PCS" {...field} value={field.value === null || field.value === undefined ? '' : String(field.value)} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))} /></FormControl>
                  <FormDescription className="text-xs">If 'Base Unit' is a package, pieces it contains. Enter 1 if Base Unit is 'PCS'.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="productionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Production Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "MM/dd/yyyy") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} /></PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiry Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "MM/dd/yyyy") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} /></PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField
              control={form.control}
              name="packagingUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Optionally Sell As (Larger Package)</FormLabel>
                    <FormControl>
                         <Input placeholder="e.g., Pallet, Master Case" {...field} value={field.value || ''} list="packaging-suggestions" />
                    </FormControl>
                    <datalist id="packaging-suggestions">
                      {PACKAGING_UNIT_SUGGESTIONS.map(suggestion => (
                        <option key={suggestion} value={suggestion} />
                      ))}
                    </datalist>
                  <FormDescription className="text-xs">Leave blank if not applicable.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="itemsPerPackagingUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. of Base Units in this Larger Package</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 20" {...field} value={field.value === null || field.value === undefined ? '' : String(field.value)} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))} disabled={!form.watch("packagingUnit")} /></FormControl>
                  <FormDescription className="text-xs">e.g., If Base Unit is 'Carton' and Larger Package is 'Pallet', how many Cartons per Pallet.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Section 3: Stock Information */}
        <div className="p-4 border rounded-lg shadow-sm bg-card">
          <SectionTitle number={3} title="Stock Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField
              control={form.control}
              name="stockLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Stock Level (in {form.getValues("unitType") || 'Base Units'})</FormLabel>
                    <div className="relative">
                      <FormControl><Input type="number" placeholder="e.g. 100" {...field} readOnly={!!initialData} disabled={!!initialData} value={field.value === null || field.value === undefined ? '' : String(field.value)} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">units</span>
                    </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {initialData && (
              <FormField
                control={form.control}
                name="addStockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add Stock (in {form.getValues("unitType") || 'Base Units'})</FormLabel>
                    <div className="relative">
                      <FormControl><Input type="number" placeholder="e.g. 10" {...field} value={field.value === null || field.value === undefined ? '' : String(field.value)} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">units</span>
                    </div>
                    <FormDescription className="text-xs">Enter quantity to add to current stock.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="reorderPoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder Point (in {form.getValues("unitType") || 'Base Units'}) *</FormLabel>
                  <div className="relative">
                    <FormControl><Input type="number" placeholder="e.g. 50" {...field} value={field.value === null || field.value === undefined ? '' : String(field.value)} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">units</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section 4: Pricing Information */}
        <div className="p-4 border rounded-lg shadow-sm bg-card">
          <SectionTitle number={4} title="Pricing Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField
              control={form.control}
              name="basePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Price (per {form.getValues("unitType") || 'Base Unit'}) *</FormLabel>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl><Input type="number" placeholder="0.00" {...field} step="0.01" className="pl-8" value={field.value === null || field.value === undefined ? '' : String(field.value)} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl>
                  </div>
                  <FormDescription className="text-xs">Fundamental price before any taxes.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="costPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Price (per {form.getValues("unitType") || 'Base Unit'}) *</FormLabel>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl><Input type="number" placeholder="0.00" {...field} step="0.01" className="pl-8" value={field.value === null || field.value === undefined ? '' : String(field.value)} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl>
                  </div>
                  <FormDescription className="text-xs">Your cost for one base unit.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="exciseTaxAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Excise Tax Amount (per {form.getValues("unitType") || 'Base Unit'})</FormLabel>
                    <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl><Input type="number" placeholder="0.00" {...field} value={field.value === null || field.value === undefined ? '' : String(field.value)} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} step="0.01" className="pl-8" /></FormControl>
                  </div>
                  <FormDescription className="text-xs">Optional. Applied before VAT.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vatRateInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VAT Rate (%) *</FormLabel>
                  <div className="relative">
                    <FormControl><Input type="number" placeholder="e.g. 15" {...field} step="0.01" className="pr-8" value={field.value === null || field.value === undefined ? '' : String(field.value)} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl>
                    <Percent className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <FormDescription className="text-xs">Used for Price Summary. Invoice uses global VAT.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discountRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Rate (%)</FormLabel>
                    <div className="relative">
                    <FormControl><Input type="number" placeholder="0" {...field} value={field.value === null || field.value === undefined ? '' : String(field.value)} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} step="0.01" className="pr-8" /></FormControl>
                    <Percent className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <FormDescription className="text-xs">Optional. Applied to final price.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mt-6 p-4 bg-muted/50 rounded-md">
            <h4 className="text-md font-semibold mb-2 text-foreground">Price Summary (per {form.getValues("unitType") || 'Base Unit'})</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Base Price:</span><span>${priceSummary.basePrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>+ Excise Tax:</span><span>${priceSummary.exciseTax.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>+ VAT:</span><span>${priceSummary.vat.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>- Discount:</span><span>${priceSummary.discount.toFixed(2)}</span></div>
              <hr className="my-1 border-border" />
              <div className="flex justify-between font-semibold text-md"><span>Final Price:</span><span>${priceSummary.finalPrice.toFixed(2)}</span></div>
            </div>
          </div>
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

