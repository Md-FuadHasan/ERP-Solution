
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
import * as React from 'react';

const PRODUCT_CATEGORIES: ProductCategory[] = ['Frozen', 'Dairy', 'Beverages', 'Raw Materials', 'Packaging'];
const PRODUCT_UNIT_TYPES: ProductUnitType[] = ['PCS', 'Cartons', 'Liters', 'Kgs', 'Units', 'ML', 'Pack'];
const PACKAGING_UNIT_SUGGESTIONS: string[] = ['Carton', 'Box', 'Pack', 'Tray', 'Pallet', 'Master Case'];

const productFormSchema = z.object({
  id: z.string().max(50).optional(),
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  sku: z.string().min(1, "SKU is required.").max(50),
  category: z.enum(PRODUCT_CATEGORIES, { required_error: "Category is required."}),
  unitType: z.enum(PRODUCT_UNIT_TYPES, { required_error: "Primary Stocking Unit is required."}),
  piecesInBaseUnit: z.coerce.number().min(1, "Must be at least 1 if specified.").optional().nullable(),
  packagingUnit: z.string().max(50).optional().nullable(),
  itemsPerPackagingUnit: z.coerce.number().positive("Must be a positive number if specifying a larger package.").optional().nullable(),
  stockLevel: z.coerce.number().min(0, "Stock level cannot be negative.").default(0),
  addStockQuantity: z.coerce.number().min(0, "Cannot add negative stock.").optional().nullable(),
  reorderPoint: z.coerce.number().min(0, "Reorder point cannot be negative.").default(0),
  salePrice: z.coerce.number().min(0, "Sale price cannot be negative.").default(0),
  exciseTax: z.coerce.number().min(0, "Excise tax cannot be negative.").optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.itemsPerPackagingUnit && (!data.packagingUnit || data.packagingUnit.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Larger package name is required if specifying items per larger package.",
      path: ["packagingUnit"],
    });
  }
  if (data.packagingUnit && data.packagingUnit.trim() !== '' && (!data.itemsPerPackagingUnit || data.itemsPerPackagingUnit <=0 )) {
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Number of base units in larger package is required and must be positive.",
        path: ["itemsPerPackagingUnit"],
    })
  }
  const isBaseUnitAPackageLike = ['Cartons', 'Pack', 'Box', 'Tray'].includes(data.unitType);
  if (isBaseUnitAPackageLike && (data.piecesInBaseUnit === undefined || data.piecesInBaseUnit === null || data.piecesInBaseUnit < 1)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Specify how many individual pieces (e.g., PCS) are in this base unit package.",
      path: ["piecesInBaseUnit"],
    });
  }
  if (!isBaseUnitAPackageLike && data.piecesInBaseUnit && data.piecesInBaseUnit > 1) {
     ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pieces per Base Unit should be 1 if the Base Unit is not a package (e.g., if Base Unit is PCS).",
      path: ["piecesInBaseUnit"],
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

export function ProductForm({ initialData, onSubmit, onCancel, isSubmitting }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      packagingUnit: initialData.packagingUnit || '',
      itemsPerPackagingUnit: initialData.itemsPerPackagingUnit || undefined,
      piecesInBaseUnit: initialData.piecesInBaseUnit || undefined,
      // Sale price and excise tax are always for the base unit in 'initialData'
      salePrice: initialData.salePrice,
      exciseTax: initialData.exciseTax === undefined || initialData.exciseTax === null ? undefined : initialData.exciseTax,
      addStockQuantity: undefined, // Always reset this field
    } : {
      id: '',
      name: '',
      sku: '',
      category: undefined,
      unitType: PRODUCT_UNIT_TYPES[0],
      piecesInBaseUnit: undefined,
      packagingUnit: '',
      itemsPerPackagingUnit: undefined,
      stockLevel: 0,
      addStockQuantity: undefined,
      reorderPoint: 0,
      salePrice: 0,
      exciseTax: undefined,
    },
  });

  const watchedUnitType = form.watch("unitType");
  const watchedPackagingUnit = form.watch("packagingUnit");

  const isBaseUnitAPackageLike = React.useMemo(() => {
    return ['Cartons', 'Pack', 'Box', 'Tray'].includes(watchedUnitType);
  }, [watchedUnitType]);

  React.useEffect(() => {
    if (!isBaseUnitAPackageLike) {
      // If base unit is not a package (e.g., PCS), piecesInBaseUnit should default to 1 or be cleared if > 1
      const currentPieces = form.getValues("piecesInBaseUnit");
      if (currentPieces === undefined || currentPieces === null || currentPieces !== 1 ) {
         // form.setValue("piecesInBaseUnit", 1, { shouldValidate: true }); // Auto-set to 1
      }
    }
  }, [isBaseUnitAPackageLike, form]);


  const pricingUnitForLabels = React.useMemo(() => {
    if (watchedPackagingUnit && watchedPackagingUnit.trim() !== '') {
      return watchedPackagingUnit; // Pricing is for the larger package
    }
    return watchedUnitType; // Pricing is for the base unit
  }, [watchedPackagingUnit, watchedUnitType]);


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
                <FormLabel>Primary Stocking Unit (Base Unit)</FormLabel>
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
                <FormDescription>The main unit inventory is counted in & primary price is set for (e.g., PCS, Kgs, Cartons).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
            control={form.control}
            name="piecesInBaseUnit"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Individual Pieces in this Base Unit (e.g., PCS)</FormLabel>
                <FormControl>
                <Input
                    type="number"
                    placeholder="e.g., 40 if Base Unit is 'Carton' of 40 PCS"
                    {...field}
                    value={field.value === null || field.value === undefined ? '' : String(field.value)}
                    onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                    disabled={!isBaseUnitAPackageLike && watchedUnitType !== ''} // Disable if base unit is not a package (unless it's empty, then allow setting to 1)
                />
                </FormControl>
                <FormDescription>If 'Base Unit' is a package (e.g., Carton, Pack), enter how many individual sellable pieces (e.g., PCS) it contains. Enter 1 if Base Unit is already a piece or not a package.</FormDescription>
                <FormMessage />
            </FormItem>
            )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                <FormDescription>Leave blank if not applicable.</FormDescription>
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
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g. 20 (if Larger Package is set)"
                    {...field}
                    value={field.value === null || field.value === undefined ? '' : String(field.value)}
                    onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    disabled={!watchedPackagingUnit || watchedPackagingUnit.trim() === ''}
                  />
                </FormControl>
                <FormDescription>e.g., If Base Unit is 'Carton' and Larger Package is 'Pallet', how many Cartons per Pallet.</FormDescription>
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
                <FormLabel>Current Stock Level (in {watchedUnitType || 'Base Units'})</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="e.g. 150" 
                    {...field} 
                    readOnly={!!initialData} // Read-only when editing
                    disabled={!!initialData}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {initialData && ( // Only show "Add Stock Quantity" when editing
            <FormField
              control={form.control}
              name="addStockQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add Stock Quantity (in {watchedUnitType || 'Base Units'})</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 10"
                      {...field}
                      value={field.value === null || field.value === undefined ? '' : String(field.value)}
                      onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormDescription>Enter quantity to add to current stock. Leave blank or 0 for no change.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
         <FormField
            control={form.control}
            name="reorderPoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder Point (in {watchedUnitType || 'Base Units'})</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="salePrice"
            render={({ field }) => (
              <FormItem>
                 <FormLabel>Sale Price (per {pricingUnitForLabels}, before taxes)</FormLabel>
                <FormControl>
                   <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="number" placeholder="e.g. 5.99" {...field} step="0.01" className="pl-8" />
                  </div>
                </FormControl>
                <FormDescription>
                  Price for one '{pricingUnitForLabels}'. It's pre-excise, pre-VAT.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="exciseTax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Excise Tax (per {pricingUnitForLabels})</FormLabel>
                <FormControl>
                   <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="number"
                        placeholder="e.g. 0.50"
                        {...field}
                        value={field.value === null || field.value === undefined ? '' : String(field.value)}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        step="0.01"
                        className="pl-8"
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Fixed excise for one '{pricingUnitForLabels}' (applied before VAT).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !form.formState.isDirty && !form.getValues("addStockQuantity") && !!initialData}>
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Product')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
