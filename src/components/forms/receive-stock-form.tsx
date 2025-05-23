
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PurchaseOrder, PurchaseOrderItem, Warehouse, Product, ProductUnitType } from '@/types';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const receiveStockItemSchema = z.object({
  poItemId: z.string(), // This will store the original PurchaseOrderItem ID
  productId: z.string(),
  productName: z.string(),
  quantityOrdered: z.number(),
  quantityAlreadyReceived: z.number(),
  itemUnitType: z.custom<ProductUnitType>(), // Unit type from the PO item
  quantityReceivedNow: z.coerce.number().optional(), // User inputs this
  destinationWarehouseId: z.string().optional(),
});

const receiveStockFormSchema = z.object({
  poId: z.string(),
  receivedItems: z.array(receiveStockItemSchema),
}).superRefine((data, ctx) => {
  let hasError = false;
  data.receivedItems.forEach((item, index) => {
    const qtyReceivedNow = item.quantityReceivedNow || 0;
    const qtyPending = item.quantityOrdered - item.quantityAlreadyReceived;

    if (qtyReceivedNow < 0) {
      ctx.addIssue({
        path: [`receivedItems.${index}.quantityReceivedNow`],
        message: "Quantity cannot be negative.",
        code: z.ZodIssueCode.custom,
      });
      hasError = true;
    } else if (qtyReceivedNow > qtyPending) {
      ctx.addIssue({
        path: [`receivedItems.${index}.quantityReceivedNow`],
        message: `Cannot exceed pending quantity of ${qtyPending} ${item.itemUnitType}.`,
        code: z.ZodIssueCode.custom,
      });
      hasError = true;
    }
    if (qtyReceivedNow > 0 && !item.destinationWarehouseId) {
      ctx.addIssue({
        path: [`receivedItems.${index}.destinationWarehouseId`],
        message: "Warehouse required if receiving quantity.",
        code: z.ZodIssueCode.custom,
      });
      hasError = true;
    }
  });

  if (!hasError && data.receivedItems.every(item => (item.quantityReceivedNow || 0) === 0)) {
    ctx.addIssue({
        path: [`receivedItems`], // General error if nothing is received
        message: "Please enter a quantity for at least one item to receive.",
        code: z.ZodIssueCode.custom,
    });
  }
});

export type ReceiveStockFormValues = z.infer<typeof receiveStockFormSchema>;

interface ReceiveStockFormProps {
  purchaseOrder: PurchaseOrder;
  warehouses: Warehouse[];
  products: Product[]; // Needed to get product details for unit conversion
  onSubmit: (data: ReceiveStockFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ReceiveStockForm({
  purchaseOrder,
  warehouses,
  products,
  onSubmit,
  onCancel,
  isSubmitting,
}: ReceiveStockFormProps) {
  const form = useForm<ReceiveStockFormValues>({
    resolver: zodResolver(receiveStockFormSchema),
    defaultValues: {
      poId: purchaseOrder.id,
      receivedItems: purchaseOrder.items.map(item => ({
        poItemId: item.id,
        productId: item.productId,
        productName: products.find(p => p.id === item.productId)?.name || item.productId,
        quantityOrdered: item.quantity,
        quantityAlreadyReceived: item.quantityReceived || 0,
        itemUnitType: item.unitType,
        quantityReceivedNow: undefined,
        destinationWarehouseId: undefined,
      })),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "receivedItems",
  });

  const formErrors = form.formState.errors;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="mb-4 p-3 border rounded-md bg-muted/50">
          <h3 className="text-sm font-medium">Receiving for PO: <span className="text-primary">{purchaseOrder.id}</span></h3>
          <p className="text-xs text-muted-foreground">Supplier: {purchaseOrder.supplierName || purchaseOrder.supplierId}</p>
        </div>

        {formErrors.receivedItems && formErrors.receivedItems.message && (
             <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{formErrors.receivedItems.message}</AlertDescription>
            </Alert>
        )}

        <ScrollArea className="h-[400px] pr-3">
          <div className="space-y-4">
            {fields.map((field, index) => {
              const item = form.getValues(`receivedItems.${index}`);
              const qtyPending = item.quantityOrdered - item.quantityAlreadyReceived;
              const productDetails = products.find(p => p.id === item.productId);

              return (
                <div key={field.id} className="p-4 border rounded-md space-y-3 bg-card shadow-sm">
                  <h4 className="font-medium text-sm text-primary">{item.productName}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div><span className="font-semibold">Ordered:</span> {item.quantityOrdered} {item.itemUnitType}</div>
                    <div><span className="font-semibold">Received:</span> {item.quantityAlreadyReceived} {item.itemUnitType}</div>
                    <div><span className="font-semibold">Pending:</span> {qtyPending} {item.itemUnitType}</div>
                  </div>

                  {qtyPending > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end pt-2">
                      <FormField
                        control={form.control}
                        name={`receivedItems.${index}.quantityReceivedNow`}
                        render={({ field: qtyField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Quantity Received Now</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={`Max ${qtyPending} ${item.itemUnitType}`}
                                {...qtyField}
                                value={qtyField.value === undefined ? '' : String(qtyField.value)}
                                onChange={e => qtyField.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                className="text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`receivedItems.${index}.destinationWarehouseId`}
                        render={({ field: whField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Destination Warehouse</FormLabel>
                            <Select onValueChange={whField.onChange} value={whField.value || ""}>
                              <FormControl>
                                <SelectTrigger className="text-sm">
                                  <SelectValue placeholder="Select warehouse" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {warehouses.map(warehouse => (
                                  <SelectItem key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-green-600 font-medium">Item fully received.</p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting ? 'Processing Receipt...' : 'Confirm Receipt'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
