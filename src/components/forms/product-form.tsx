
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
  unitType: z.enum(PRODUCT_UNIT_TYPES, { required_error: "Base Unit Type is required."}),
  piecesInBaseUnit: z.coerce.number().min(1, "Must be at least 1 if specified.").optional().nullable(),
  packagingUnit: z.string().max(50).optional().nullable(),
  itemsPerPackagingUnit: z.coerce.number().positive("Must be a positive number if specifying a larger package.").optional().nullable(),
  stockLevel: z.coerce.number().min(0, "Stock level cannot be negative.").default(0),
  addStockQuantity: z.coerce.number().min(0, "Cannot add negative stock.").optional().nullable(),
  reorderPoint: z.coerce.number().min(0, "Reorder point cannot be negative.").default(0),
  basePrice: z.coerce.number().min(0, "Base price cannot be negative.").default(0),
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
  if (!isBaseUnitAPackageLike && data.unitType !== 'PCS' && data.piecesInBaseUnit && data.piecesInBaseUnit > 1) {
     ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pieces per Base Unit should typically be 1 if the Base Unit itself is not a standard package type (e.g., 'Kgs', 'Liters', 'Units'). If it's 'PCS', it must be 1.",
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
      basePrice: initialData.basePrice, // Directly use stored basePrice
      exciseTax: initialData.exciseTax === undefined || initialData.exciseTax === null ? undefined : initialData.exciseTax, // Directly use stored exciseTax
      packagingUnit: initialData.packagingUnit || '',
      itemsPerPackagingUnit: initialData.itemsPerPackagingUnit || undefined,
      piecesInBaseUnit: initialData.piecesInBaseUnit || undefined,
      addStockQuantity: undefined,
    } : {
      id: '',
      name: '',
      sku: '',
      category: undefined,
      unitType: PRODUCT_UNIT_TYPES[0],
      piecesInBaseUnit: 1, // Default to 1, especially if PCS is first unit type
      packagingUnit: '',
      itemsPerPackagingUnit: undefined,
      stockLevel: 0,
      addStockQuantity: undefined,
      reorderPoint: 0,
      basePrice: 0,
      exciseTax: undefined,
    },
  });

  const watchedUnitType = form.watch("unitType");

  const isBaseUnitAPackageLike = React.useMemo(() => {
    return ['Cartons', 'Pack', 'Box', 'Tray'].includes(watchedUnitType);
  }, [watchedUnitType]);

  React.useEffect(() => {
    if (watchedUnitType === 'PCS' && form.getValues("piecesInBaseUnit") !== 1) {
      form.setValue("piecesInBaseUnit", 1, { shouldValidate: true });
    } else if (!isBaseUnitAPackageLike && watchedUnitType !== 'PCS' && form.getValues("piecesInBaseUnit") === undefined) {
      // For units like Kgs, Liters, Units, if piecesInBaseUnit is not set, default it to 1.
      // Only do this if it's undefined to avoid overriding intentional edits for other package-like base units.
      // form.setValue("piecesInBaseUnit", 1, { shouldValidate: true });
    }
  }, [watchedUnitType, isBaseUnitAPackageLike, form]);

  const handleSubmitForm = (values: ProductFormValues) => {
    onSubmit(values);
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
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
                <FormLabel>Base Unit Type (for Stock & Pricing)</FormLabel>
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
                <FormDescription>The primary unit inventory is counted in AND how its sale price is defined (e.g., PCS, Cartons). Stock levels refer to this unit.</FormDescription>
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
                <FormLabel>Pieces per Base Unit (e.g., PCS in this Carton/Pack)</FormLabel>
                <FormControl>
                <Input
                    type="number"
                    placeholder="e.g., 40 if Base Unit is 'Carton' of 40 PCS"
                    {...field}
                    value={field.value === null || field.value === undefined ? '' : String(field.value)}
                    onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                />
                </FormControl>
                <FormDescription>If 'Base Unit Type' is a package (like Carton), enter how many individual sellable pieces (e.g., PCS) it contains. Enter 1 if the Base Unit is already a piece (e.g. if Base Unit Type is 'PCS').</FormDescription>
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
                <FormDescription>e.g., Pallet, Master Case. Leave blank if not applicable.</FormDescription>
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
                    disabled={!form.getValues("packagingUnit") || form.getValues("packagingUnit")!.trim() === ''}
                  />
                </FormControl>
                <FormDescription>Number of 'Base Units' (defined above) in one 'Larger Sales Package'.</FormDescription>
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
                    readOnly={!!initialData} 
                    disabled={!!initialData}
                  />
                </FormControl>
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
                  <FormLabel>Add Stock (in {watchedUnitType || 'Base Units'})</FormLabel>
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
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                 <FormLabel>Base Price (per {watchedUnitType || 'Base Unit'}, before taxes)</FormLabel>
                <FormControl>
                   <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="number" placeholder="e.g. 5.99" {...field} step="0.01" className="pl-8" />
                  </div>
                </FormControl>
                <FormDescription>
                  Enter the fundamental price for one '{watchedUnitType || 'Base Unit'}' *before* any taxes (VAT, Excise).
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
                <FormLabel>Excise Tax (per {watchedUnitType || 'Base Unit'}) (Optional)</FormLabel>
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
                  Enter the excise tax amount for one '{watchedUnitType || 'Base Unit'}'.
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
          <Button type="submit" disabled={isSubmitting || (!form.formState.isDirty && !form.getValues("addStockQuantity") && !!initialData) || !form.formState.isValid}>
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Product')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    