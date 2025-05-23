
'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import type { Product, ProductStockLocation, Warehouse, CompanyProfile } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Archive } from 'lucide-react';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import { cn } from '@/lib/utils';
import {
  getDisplayUnit,
  getDisplayBasePriceInfo,
  getDisplayExciseTaxInfo,
  getDisplayVatInfo,
  calculateFinalPcsPriceWithVatAndExcise,
  calculateFinalPkgPriceWithVatAndExcise,
} from '@/app/(app)/products/page'; // Import helpers from products page

interface EnrichedWarehouseStockItem extends ProductStockLocation {
  productName: string;
  productSku: string;
  productCategory: string;
  productUnitType: string; // Base unit type for this stock
  costPrice: number;
  stockValue: number;
  globalReorderPoint?: number;
  basePrice: number; // per base unit
  exciseTax: number; // per base unit
  piecesInBaseUnit?: number;
}

export default function WarehouseStockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    getWarehouseById,
    productStockLocations,
    getProductById,
    companyProfile,
    isLoading,
  } = useData();

  const warehouseId = typeof params.warehouseId === 'string' ? params.warehouseId : undefined;
  const warehouse = useMemo(() => {
    if (!warehouseId || isLoading) return null;
    return getWarehouseById(warehouseId);
  }, [warehouseId, getWarehouseById, isLoading]);

  const enrichedWarehouseStockData: EnrichedWarehouseStockItem[] = useMemo(() => {
    if (isLoading || !warehouseId || !productStockLocations || !getProductById) return [];
    return productStockLocations
      .filter(psl => psl.warehouseId === warehouseId)
      .map(psl => {
        const product = getProductById(psl.productId);
        if (!product) return null;
        const costPrice = product.costPrice || 0;
        return {
          ...psl,
          productName: product.name,
          productSku: product.sku,
          productCategory: product.category,
          productUnitType: product.unitType,
          costPrice: costPrice,
          stockValue: psl.stockLevel * costPrice,
          globalReorderPoint: product.globalReorderPoint,
          basePrice: product.basePrice,
          exciseTax: product.exciseTax || 0,
          piecesInBaseUnit: product.piecesInBaseUnit,
        };
      })
      .filter(item => item !== null) as EnrichedWarehouseStockItem[];
  }, [isLoading, warehouseId, productStockLocations, getProductById]);

  if (isLoading || !companyProfile) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 my-4 md:my-6 lg:my-8">
          <CardHeader className="border-b"><Skeleton className="h-6 w-1/3" /></CardHeader>
          <div className="h-full overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                 <TableRow>
                    <TableHead className="min-w-[80px] px-2 text-sm text-left">ID</TableHead>
                    <TableHead className="min-w-[150px] px-2 text-sm text-left">Name</TableHead>
                    <TableHead className="min-w-[80px] px-2 text-[11px] text-left">SKU</TableHead>
                    <TableHead className="min-w-[100px] px-2 text-sm text-left">Category</TableHead>
                    <TableHead className="min-w-[70px] px-2 text-sm text-center">Stock</TableHead>
                    <TableHead className="min-w-[90px] px-2 text-sm text-right">Stock Value</TableHead>
                    <TableHead className="min-w-[90px] px-2 text-sm text-right">Base Price</TableHead>
                    <TableHead className="min-w-[90px] px-2 text-sm text-right">Excise Tax</TableHead>
                    <TableHead className="min-w-[90px] px-2 text-sm text-right">VAT ({companyProfile?.vatRate || 15}%)</TableHead>
                    <TableHead className="min-w-[90px] px-2 text-sm text-right">Sale Price / PCS</TableHead>
                    <TableHead className="min-w-[90px] px-2 text-sm text-right">Sale Price / Pkg</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(7)].map((_, i) => (
                  <TableRow key={`skel-wh-stock-${i}`} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50')}>
                    {[...Array(11)].map((__, j) => <TableCell key={j} className="px-2"><Skeleton className="h-5 w-full" /></TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="flex flex-col h-full p-4 items-center justify-center">
        <PageHeader title="Warehouse Not Found" description="The requested warehouse could not be found." />
        <Button onClick={() => router.push('/inventory')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory Overview
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push('/inventory')} variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader
            title={`Stock in: ${warehouse.name}`}
            description={`Detailed inventory for ${warehouse.location} (${warehouse.type.replace(/_/g, ' ')})`}
          />
        </div>
      </div>

      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 my-4 md:my-6 lg:my-8">
        <CardHeader className="border-b">
          <CardTitle>Products in {warehouse.name}</CardTitle>
          <CardDescription>List of all products and their current stock levels, base prices, and calculated sale prices in this warehouse.</CardDescription>
        </CardHeader>
        <div className="h-full overflow-y-auto">
          {enrichedWarehouseStockData.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="text-left min-w-[80px] px-2 text-sm">Product ID</TableHead>
                  <TableHead className="text-left min-w-[150px] px-2 text-sm">Name</TableHead>
                  <TableHead className="text-left min-w-[80px] px-2 text-[11px]">SKU</TableHead>
                  <TableHead className="text-left min-w-[100px] px-2 text-sm">Category</TableHead>
                  <TableHead className="text-center min-w-[70px] px-2 text-sm">Stock</TableHead>
                  <TableHead className="text-right min-w-[90px] px-2 text-sm">Stock Value</TableHead>
                  <TableHead className="text-right min-w-[90px] px-2 text-sm">Base Price</TableHead>
                  <TableHead className="text-right min-w-[90px] px-2 text-sm">Excise Tax</TableHead>
                  <TableHead className="text-right min-w-[90px] px-2 text-sm">VAT ({companyProfile.vatRate}%)</TableHead>
                  <TableHead className="text-right min-w-[90px] px-2 text-sm">Sale Price / PCS</TableHead>
                  <TableHead className="text-right min-w-[90px] px-2 text-sm">Sale Price / Pkg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedWarehouseStockData.map((item, index) => {
                  const productDetails = getProductById(item.productId); // Full product details for price calculation
                  if (!productDetails) return null;

                  const stockUnit = getDisplayUnit(productDetails, 'base');
                  const basePriceInfo = getDisplayBasePriceInfo(productDetails);
                  const exciseTaxInfo = getDisplayExciseTaxInfo(productDetails);
                  const vatInfo = getDisplayVatInfo(productDetails, companyProfile); // Uses product basePrice and exciseTax
                  
                  // Use the full product definition for calculating final prices
                  const finalPcsPriceInfo = calculateFinalPcsPriceWithVatAndExcise(productDetails, companyProfile);
                  const finalPkgPriceInfo = calculateFinalPkgPriceWithVatAndExcise(productDetails, companyProfile);
                  
                  return (
                    <TableRow key={`${item.productId}-${item.warehouseId}`} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                      <TableCell className="text-left font-medium px-2 text-xs">{item.productId}</TableCell>
                      <TableCell className="text-left px-2 text-xs">{item.productName}</TableCell>
                      <TableCell className="text-left px-2 text-[11px]">{item.productSku}</TableCell>
                      <TableCell className="text-left px-2 text-xs">{item.productCategory}</TableCell>
                      <TableCell className={cn(
                        "text-center font-medium px-2 text-xs",
                        productDetails.globalReorderPoint !== undefined && item.stockLevel <= productDetails.globalReorderPoint ? "text-destructive" : ""
                      )}>
                        {item.stockLevel} {stockUnit}
                      </TableCell>
                      <TableCell className="text-right px-2 text-xs">${item.stockValue.toFixed(2)}</TableCell>
                      <TableCell className="text-right px-2 text-xs">${basePriceInfo.price.toFixed(2)} / {basePriceInfo.unit}</TableCell>
                      <TableCell className="text-right px-2 text-xs">${exciseTaxInfo.exciseAmount.toFixed(2)} / {exciseTaxInfo.unit}</TableCell>
                      <TableCell className="text-right px-2 text-xs">${vatInfo.vatAmount.toFixed(2)} / {vatInfo.unit}</TableCell>
                      <TableCell className="text-right px-2 text-xs">${finalPcsPriceInfo.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right px-2 text-xs">{finalPkgPriceInfo.price !== null ? `$${finalPkgPriceInfo.price.toFixed(2)} / ${finalPkgPriceInfo.unit}` : '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <DataPlaceholder
                icon={Archive}
                title={`No Stock in ${warehouse.name}`}
                message="Adjust stock levels for products in this warehouse to see them here."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
