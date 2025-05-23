// src/app/(app)/products/page.tsx
'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductForm, type ProductFormValues } from '@/components/forms/product-form';
import { SearchInput } from '@/components/common/search-input';
import { DataPlaceholder } from '@/components/common/data-placeholder';
import type { Product, ProductCategory, ProductUnitType, CompanyProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/DataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge, badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter as AlertDialogFooterComponent,
  AlertDialogHeader as AlertDialogHeaderComponent,
  AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';

// Helper functions are now exported
export const getDisplayUnit = (product: Product, type: 'base' | 'package'): string => {
  let unit: string | undefined;
  if (type === 'package' && product.packagingUnit && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
    unit = product.packagingUnit;
  } else {
    unit = product.unitType;
  }
  const unitLower = unit?.toLowerCase();
  if (unitLower?.includes('carton') || unitLower?.includes('cartons')) return 'Ctn';
  if (unitLower === 'pcs') return 'PCS';
  return unit || 'N/A';
};

const getCategoryBadgeVariant = (category?: ProductCategory): VariantProps<typeof badgeVariants>['variant'] => {
  if (!category) return 'secondary';
  switch (category) {
    case 'Frozen': return 'categoryFrozen';
    case 'Dairy': return 'categoryDairy';
    case 'Beverages': return 'categoryBeverages';
    case 'Raw Materials': return 'categoryRawMaterials';
    case 'Packaging': return 'categoryPackaging';
    default: return 'secondary';
  }
};

export const getDisplayBasePriceInfo = (product: Product): { price: number; unit: string } => {
  const price = typeof product.basePrice === 'number' && !isNaN(product.basePrice) ? product.basePrice : 0;
  return { price, unit: getDisplayUnit(product, 'base') };
};

export const getDisplayExciseTaxInfo = (product: Product): { exciseAmount: number; unit: string } => {
  const exciseAmount = typeof product.exciseTax === 'number' && !isNaN(product.exciseTax) ? product.exciseTax : 0;
  return { exciseAmount, unit: getDisplayUnit(product, 'base') };
};

export const getDisplayVatInfo = (product: Product, companyProfile: CompanyProfile | null | undefined): { vatAmount: number; unit: string } => {
  const basePricePerBaseUnit = typeof product.basePrice === 'number' && !isNaN(product.basePrice) ? product.basePrice : 0;
  const exciseTaxPerBaseUnit = typeof product.exciseTax === 'number' && !isNaN(product.exciseTax) ? product.exciseTax : 0;
  const subtotalForVatPerBaseUnit = basePricePerBaseUnit + exciseTaxPerBaseUnit;
  const vatRate = (companyProfile?.vatRate ? (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : Number(companyProfile.vatRate)) : 0) / 100;
  const vatAmount = subtotalForVatPerBaseUnit * vatRate;
  return { vatAmount, unit: getDisplayUnit(product, 'base') };
};

export const calculateFinalPcsPriceWithVatAndExcise = (product: Product, companyProfile: CompanyProfile | null | undefined): {price: number, unit: string} => {
  const basePricePerBaseUnit = typeof product.basePrice === 'number' && !isNaN(product.basePrice) ? product.basePrice : 0;
  const exciseTaxPerBaseUnit = typeof product.exciseTax === 'number' && !isNaN(product.exciseTax) ? product.exciseTax : 0;
  const piecesInBase = product.piecesInBaseUnit && product.piecesInBaseUnit > 0 ? product.piecesInBaseUnit : 1;

  const basePricePerConceptualPiece = basePricePerBaseUnit / piecesInBase;
  const exciseTaxPerConceptualPiece = exciseTaxPerBaseUnit / piecesInBase;

  const subtotalBeforeVATPerPiece = basePricePerConceptualPiece + exciseTaxPerConceptualPiece;
  const vatRatePercent = companyProfile?.vatRate ? (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : Number(companyProfile.vatRate)) : 0;
  const vatAmountOnPcs = subtotalBeforeVATPerPiece * (vatRatePercent / 100);
  
  let finalPrice = subtotalBeforeVATPerPiece + vatAmountOnPcs;
  const discountRate = product.discountRate ? product.discountRate / 100 : 0;
  finalPrice = finalPrice * (1 - discountRate);
  return {price: finalPrice, unit: 'PCS'};
};

export const calculateFinalPkgPriceWithVatAndExcise = (
  product: Product, 
  companyProfile: CompanyProfile | null | undefined, 
  target: 'base_unit_package' | 'larger_package'
): { price: number | null; unit: string } => {
  const basePricePerBaseUnit = typeof product.basePrice === 'number' && !isNaN(product.basePrice) ? product.basePrice : 0;
  const exciseTaxPerBaseUnit = typeof product.exciseTax === 'number' && !isNaN(product.exciseTax) ? product.exciseTax : 0;
  const vatRatePercent = companyProfile?.vatRate ? (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : Number(companyProfile.vatRate)) : 0;

  let itemsInTargetUnit = 1;
  let targetUnitDisplay = getDisplayUnit(product, 'base');
  let isBaseUnitItselfPackage = false;

  if (target === 'larger_package' && product.packagingUnit && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
    itemsInTargetUnit = product.itemsPerPackagingUnit;
    targetUnitDisplay = getDisplayUnit(product, 'package');
  } else if (target === 'base_unit_package') {
    itemsInTargetUnit = 1;
    targetUnitDisplay = getDisplayUnit(product, 'base');
    if (product.unitType.toLowerCase() !== 'pcs' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
        isBaseUnitItselfPackage = true;
    }
    if (product.unitType.toLowerCase() === 'pcs' && !product.packagingUnit && !isBaseUnitItselfPackage) {
        return { price: null, unit: '-' };
    }
  } else {
    return { price: null, unit: '-' };
  }

  const totalBasePriceForTargetUnit = basePricePerBaseUnit * itemsInTargetUnit;
  const totalExciseTaxForTargetUnit = exciseTaxPerBaseUnit * itemsInTargetUnit;
  const subtotalBeforeVAT = totalBasePriceForTargetUnit + totalExciseTaxForTargetUnit;
  const vatAmount = subtotalBeforeVAT * (vatRatePercent / 100);
  let finalPrice = subtotalBeforeVAT + vatAmount;

  const discountRate = product.discountRate ? product.discountRate / 100 : 0;
  finalPrice = finalPrice * (1 - discountRate); 

  return { price: finalPrice, unit: targetUnitDisplay };
};


export default function ProductsPage() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getTotalStockForProduct,
    isLoading,
    companyProfile,
  } = useData();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToView, setProductToView] = useState<Product | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  const handleAddProduct = useCallback(() => {
    setEditingProduct(null);
    setIsFormModalOpen(true);
  }, []);

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setIsFormModalOpen(true);
  }, []);

  const handleViewProduct = useCallback((product: Product) => {
    setProductToView(product);
    setIsViewModalOpen(true);
  }, []);

  const handleDeleteProductConfirm = useCallback((product: Product) => {
    setProductToDelete(product);
  }, []);

  const confirmDelete = useCallback(() => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      toast({ title: "Product Deleted", description: `${productToDelete.name} has been removed.` });
      setProductToDelete(null);
    }
  }, [productToDelete, deleteProduct, toast]);

  const handleSubmit = useCallback((data: ProductFormValues) => {
    const productDataForStorage: Omit<Product, 'id' | 'createdAt'> = {
      name: data.name,
      sku: data.sku || '',
      category: data.category,
      unitType: data.unitType,
      piecesInBaseUnit: data.piecesInBaseUnit || (data.unitType.toLowerCase() === 'pcs' ? 1 : undefined),
      packagingUnit: data.packagingUnit && data.packagingUnit.trim() !== '' ? data.packagingUnit.trim() : undefined,
      itemsPerPackagingUnit: data.packagingUnit && data.packagingUnit.trim() !== '' && data.itemsPerPackagingUnit ? data.itemsPerPackagingUnit : undefined,
      globalReorderPoint: data.globalReorderPoint || 0,
      basePrice: data.basePrice, // Stored as per base unit
      costPrice: data.costPrice || 0,
      exciseTax: data.exciseTaxAmount === undefined || data.exciseTaxAmount === null ? 0 : data.exciseTaxAmount, // Stored as per base unit
      batchNo: data.batchNo || undefined,
      productionDate: data.productionDate ? data.productionDate.toISOString() : undefined,
      expiryDate: data.expiryDate ? data.expiryDate.toISOString() : undefined,
      discountRate: data.discountRate === undefined || data.discountRate === null ? 0 : data.discountRate,
    };

    if (editingProduct) {
      const updatedProductData: Product = {
        ...editingProduct,
        ...productDataForStorage,
        stockLevel: editingProduct.stockLevel, // Keep existing stock level
        reorderPoint: editingProduct.reorderPoint, // Keep existing reorder point
      };
      updateProduct(updatedProductData);
      toast({ title: "Product Updated", description: `${data.name} details have been updated.` });
    } else {
      let finalProductId = data.id;
      if (finalProductId && finalProductId.trim() !== '') {
        if (products.find(p => p.id === finalProductId && (!editingProduct || editingProduct.id !== finalProductId))) {
          toast({
            title: "Error: Product ID exists",
            description: `Product ID ${finalProductId} is already in use. Leave blank for auto-gen.`,
            variant: "destructive",
          });
          return;
        }
      } else {
        finalProductId = `PROD${String(Date.now()).slice(-5)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;
        while (products.find(p => p.id === finalProductId)) {
          finalProductId = `PROD${String(Date.now()).slice(-5)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;
        }
      }
      const newProduct: Product = {
        ...productDataForStorage,
        id: finalProductId,
        stockLevel: 0, // New products start with 0 stock definitionally. Actual stock is managed per warehouse.
        reorderPoint: 0, // Corresponds to product.reorderPoint in types, if needed globally
        createdAt: new Date().toISOString(),
      };
      addProduct(newProduct);
      toast({ title: "Product Defined", description: `${newProduct.name} definition created. Manage stock in Inventory.` });
    }

    setIsFormModalOpen(false);
    setEditingProduct(null);
  }, [addProduct, updateProduct, products, toast, editingProduct]);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Products"
          description="Manage your product catalog and definitions."
          actions={
            <Button onClick={handleAddProduct} className="w-full sm:w-auto" disabled={isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> Define New Product
            </Button>
          }
        />
        <div className="mt-4">
          <SearchInput
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
            placeholder="Search by name, SKU, ID, category..."
            className="w-full md:w-80"
          />
        </div>
      </div>

      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mb-4 md:mb-6 lg:mb-8">
         <div className="h-full overflow-y-auto"> {/* This div handles scrolling for the table */}
          {isLoading ? (
             <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                 <TableRow>
                  <TableHead rowSpan={2} className="text-left min-w-[80px] px-2 align-middle text-sm">Product ID</TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[180px] px-2 align-middle text-sm">Name</TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[70px] px-2 align-middle text-[11px]">SKU</TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[100px] px-2 align-middle text-sm">Category</TableHead>
                  <TableHead colSpan={2} className="text-center align-middle text-sm px-2">Inventory Levels</TableHead>
                  <TableHead rowSpan={2} className="text-right min-w-[100px] px-2 align-middle text-sm">Base Price</TableHead>
                  <TableHead rowSpan={2} className="text-right min-w-[90px] px-2 align-middle text-sm">Excise Tax</TableHead>
                  <TableHead rowSpan={2} className="text-right min-w-[80px] px-2 align-middle text-sm">VAT ({companyProfile?.vatRate || 15}%)</TableHead>
                  <TableHead colSpan={2} className="text-center align-bottom min-w-[180px] px-2 text-sm">
                     <div>Sale Price</div>
                     <div className="text-xs font-normal opacity-75">(Inc VAT &amp; Excise)</div>
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center min-w-[100px] px-2 align-middle text-sm">Actions</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-center text-xs font-normal opacity-75 px-2 min-w-[70px]">CTN</TableHead>
                  <TableHead className="text-center text-xs font-normal opacity-75 px-2 min-w-[70px]">PCS</TableHead>
                  <TableHead className="text-center text-xs font-normal opacity-75 px-2 min-w-[90px]">CTN</TableHead>
                  <TableHead className="text-center text-xs font-normal opacity-75 px-2 min-w-[90px]">PCS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(10)].map((_, i) => (
                  <TableRow key={i} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-[11px]"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-center"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-center"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-right"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-right"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-right"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-right"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-right"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-center">
                        <div className="flex justify-center items-center gap-1">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredProducts.length > 0 ? (
            <Table>
               <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                 <TableRow>
                  <TableHead rowSpan={2} className="text-left min-w-[80px] px-2 align-middle text-sm">Product ID</TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[180px] px-2 align-middle text-sm">Name</TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[70px] px-2 align-middle text-[11px]">SKU</TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[100px] px-2 align-middle text-sm">Category</TableHead>
                  <TableHead colSpan={2} className="text-center align-middle text-sm px-2">Inventory Levels</TableHead>
                  <TableHead rowSpan={2} className="text-right min-w-[100px] px-2 align-middle text-sm">Base Price</TableHead>
                  <TableHead rowSpan={2} className="text-right min-w-[90px] px-2 align-middle text-sm">Excise Tax</TableHead>
                  <TableHead rowSpan={2} className="text-right min-w-[80px] px-2 align-middle text-sm">VAT ({companyProfile?.vatRate || 15}%)</TableHead>
                  <TableHead colSpan={2} className="text-center align-bottom min-w-[180px] px-2 text-sm">
                     <div>Sale Price</div>
                     <div className="text-xs font-normal opacity-75">(Inc VAT &amp; Excise)</div>
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center min-w-[100px] px-2 align-middle text-sm">Actions</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-center text-xs font-normal opacity-75 px-2 min-w-[70px]">CTN</TableHead>
                  <TableHead className="text-center text-xs font-normal opacity-75 px-2 min-w-[70px]">PCS</TableHead>
                  <TableHead className="text-center text-xs font-normal opacity-75 px-2 min-w-[90px]">CTN</TableHead>
                  <TableHead className="text-center text-xs font-normal opacity-75 px-2 min-w-[90px]">PCS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => {
                    const totalStockBaseUnits = getTotalStockForProduct(product.id);
                    
                    let ctnStockDisplay = "-";
                    if (product.unitType.toLowerCase() === 'cartons') {
                        ctnStockDisplay = totalStockBaseUnits.toFixed(0);
                    } else if (product.packagingUnit?.toLowerCase() === 'carton' && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                        ctnStockDisplay = (totalStockBaseUnits / product.itemsPerPackagingUnit).toFixed((totalStockBaseUnits / product.itemsPerPackagingUnit) % 1 !== 0 ? 1 : 0);
                    } else if (product.unitType.toLowerCase() !== 'pcs' && product.packagingUnit?.toLowerCase().includes('carton') && product.itemsPerPackagingUnit) {
                        // Fallback for other base units packaged in cartons
                        ctnStockDisplay = (totalStockBaseUnits / product.itemsPerPackagingUnit).toFixed(1);
                    }


                    let pcsStockDisplay = "-";
                    if (product.unitType.toLowerCase() === 'pcs') {
                        pcsStockDisplay = totalStockBaseUnits.toFixed(0);
                    } else if (product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
                        pcsStockDisplay = (totalStockBaseUnits * product.piecesInBaseUnit).toFixed(0);
                    }

                    const basePriceInfo = getDisplayBasePriceInfo(product);
                    const exciseTaxInfo = getDisplayExciseTaxInfo(product);
                    const vatInfo = getDisplayVatInfo(product, companyProfile);
                    const finalPcsPriceInfo = calculateFinalPcsPriceWithVatAndExcise(product, companyProfile);
                    const finalPkgPriceInfo = calculateFinalPkgPriceWithVatAndExcise(product, companyProfile, product.packagingUnit ? 'larger_package' : 'base_unit_package');
                  
                  return (
                    <TableRow key={product.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                      <TableCell className="text-left px-2 font-medium text-xs">{product.id}</TableCell>
                      <TableCell className="text-left px-2 text-xs">{product.name}</TableCell>
                      <TableCell className="text-left px-2 text-[11px]">{product.sku}</TableCell>
                      <TableCell className="text-left px-2 text-xs">
                        <Badge variant={getCategoryBadgeVariant(product.category)} className="text-xs">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        "text-center font-medium px-2 text-xs",
                        product.globalReorderPoint !== undefined && totalStockBaseUnits <= product.globalReorderPoint ? "text-destructive" : ""
                      )}>
                        {ctnStockDisplay}
                      </TableCell>
                      <TableCell className="text-center px-2 text-xs">
                        {pcsStockDisplay}
                      </TableCell>
                      <TableCell className="text-right px-2 text-xs">${basePriceInfo.price.toFixed(2)} / {basePriceInfo.unit}</TableCell>
                      <TableCell className="text-right px-2 text-xs">${exciseTaxInfo.exciseAmount.toFixed(2)} / {exciseTaxInfo.unit}</TableCell>
                      <TableCell className="text-right px-2 text-xs">${vatInfo.vatAmount.toFixed(2)} / {vatInfo.unit}</TableCell>
                      <TableCell className="text-right px-2 text-xs">{finalPkgPriceInfo.price !== null ? `$${finalPkgPriceInfo.price.toFixed(2)} / ${finalPkgPriceInfo.unit}` : '-'}</TableCell>
                      <TableCell className="text-right px-2 text-xs">${finalPcsPriceInfo.price.toFixed(2)} / PCS</TableCell>
                      <TableCell className="text-center px-2">
                        <div className="flex justify-center items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleViewProduct(product)} className="hover:text-primary p-1.5" title="View Product">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)} className="hover:text-primary p-1.5" title="Edit Product">
                            <Edit className="h-4 w-4" />
                          </Button>
                           <Button
                            variant="ghost"
                            size="icon"
                            className="hover:text-destructive p-1.5"
                            title="Delete Product"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProductConfirm(product);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <DataPlaceholder
                title="No Products Found"
                message={searchTerm ? "Try adjusting your search term." : "Get started by defining your first product."}
                action={!searchTerm ? (
                  <Button onClick={handleAddProduct} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0">
                    <PlusCircle className="mr-2 h-4 w-4" /> Define Product
                  </Button>
                ) : undefined}
              />
            </div>
          )}
        </div>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => {
        setIsFormModalOpen(isOpen);
        if (!isOpen) setEditingProduct(null);
      }}>
        <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingProduct ? 'Edit Product Definition' : 'Define New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? `Update definition for ${editingProduct.name}. Stock is managed separately per warehouse.` : 'Enter product details. Stock is managed separately per warehouse.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
             {isFormModalOpen && (
                <ProductForm
                  initialData={editingProduct}
                  onSubmit={handleSubmit}
                  onCancel={() => { setIsFormModalOpen(false); setEditingProduct(null); }}
                  isSubmitting={isLoading}
                />
             )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="w-[90vw] max-w-lg">
          <DialogHeader>
            <DialogTitle className="truncate max-w-full">Product Details: {productToView?.name}</DialogTitle>
            <DialogDescription>
              Viewing definition for product {productToView?.id} (SKU: {productToView?.sku || 'N/A'}).
            </DialogDescription>
          </DialogHeader>
          {productToView && companyProfile && (
            <div className="space-y-3 py-4 text-sm max-h-[70vh] overflow-y-auto pr-2">
              <Card><CardContent className="pt-4 space-y-1">
                <div className="grid grid-cols-2 gap-x-2">
                  <div><strong>Product ID:</strong></div><div>{productToView.id}</div>
                  <div><strong>SKU:</strong></div><div>{productToView.sku || 'N/A'}</div>
                  <div className="col-span-2 pt-1"><strong>Name:</strong></div><div className="col-span-2 -mt-1">{productToView.name}</div>
                  {productToView.batchNo && <><div><strong>Batch No:</strong></div><div>{productToView.batchNo}</div></>}
                  {productToView.productionDate && <><div><strong>Prod. Date:</strong></div><div>{format(new Date(productToView.productionDate), 'MM/dd/yyyy')}</div></>}
                  {productToView.expiryDate && <><div><strong>Exp. Date:</strong></div><div>{format(new Date(productToView.expiryDate), 'MM/dd/yyyy')}</div></>}
                </div>
              </CardContent></Card>
              
              <Card><CardContent className="pt-4 grid grid-cols-2 gap-x-2 gap-y-1">
                  <div><strong>Category:</strong></div>
                  <div><Badge variant={getCategoryBadgeVariant(productToView.category)} className="text-xs">{productToView.category}</Badge></div>
                  
                  <div><strong>Primary Stocking Unit (Base Unit):</strong></div>
                  <div><Badge variant="outline">{getDisplayUnit(productToView, 'base')}</Badge></div>

                  {productToView.piecesInBaseUnit && productToView.piecesInBaseUnit > 0 && (
                    <>
                      <div><strong>Individual Pieces in Base Unit:</strong></div>
                      <div>{productToView.piecesInBaseUnit} PCS</div>
                    </>
                  )}
                  
                  {productToView.packagingUnit && productToView.itemsPerPackagingUnit && productToView.itemsPerPackagingUnit > 0 && (
                    <>
                      <div className="col-span-2"><Separator className="my-0.5" /></div>
                      <div><strong>Also Sold As (Larger Package):</strong></div>
                      <div><Badge variant="outline">{getDisplayUnit(productToView, 'package')}</Badge></div>
                      
                      <div><strong>Base Units in Larger Package:</strong></div>
                      <div>{productToView.itemsPerPackagingUnit} {getDisplayUnit(productToView, 'base')}</div>
                    </>
                  )}
              </CardContent></Card>
              
              <Card><CardContent className="pt-4 grid grid-cols-1 gap-y-1">
                  <div className="grid grid-cols-2 gap-x-2">
                    <div><strong>Total Stock (All Warehouses):</strong></div>
                    <div className={cn(productToView.globalReorderPoint !== undefined && getTotalStockForProduct(productToView.id) <= productToView.globalReorderPoint ? "text-destructive font-semibold" : "")}>
                      {getTotalStockForProduct(productToView.id).toFixed((productToView.unitType === 'Kgs' || productToView.unitType === 'Liters') && getTotalStockForProduct(productToView.id) % 1 !== 0 ? 2 : 0)} {getDisplayUnit(productToView, 'base')}
                    </div>
                    {(() => {
                        const totalPcsForDisplay = getTotalStockForProduct(productToView.id) * (productToView.piecesInBaseUnit || (productToView.unitType.toLowerCase() === 'pcs' ? 1 : 0));
                        if (totalPcsForDisplay > 0 && !(productToView.unitType.toLowerCase() === 'pcs' && (productToView.piecesInBaseUnit || 1) === 1)) {
                            return (<>
                            <div><strong>Total Pieces (Calculated):</strong></div>
                            <div>{totalPcsForDisplay.toFixed(0)} PCS</div>
                            </>);
                        }
                        return null;
                    })()}

                    <div><strong>Global Reorder Point:</strong></div><div>{productToView.globalReorderPoint || 0} {getDisplayUnit(productToView, 'base')}</div>
                    <div><strong>Cost Price (per {getDisplayUnit(productToView, 'base')}):</strong></div><div>${(productToView.costPrice || 0).toFixed(2)}</div>
                  </div>
              </CardContent></Card>
              
               <Card><CardContent className="pt-4 grid grid-cols-1 gap-y-1">
                  {(() => {
                     const basePInfo = getDisplayBasePriceInfo(productToView);
                     const exciseTInfo = getDisplayExciseTaxInfo(productToView);
                     const vatOnBaseAndExciseInfo = getDisplayVatInfo(productToView, companyProfile);
                     const finalPcsPriceInfoValue = calculateFinalPcsPriceWithVatAndExcise(productToView, companyProfile);
                     const finalPkgPriceInfoValue = calculateFinalPkgPriceWithVatAndExcise(productToView, companyProfile, productToView.packagingUnit ? 'larger_package' : 'base_unit_package');
                     
                     return (<>
                        <div><strong>Base Price (per {basePInfo.unit}):</strong> ${basePInfo.price.toFixed(2)}</div>
                        <div><strong>Excise Tax (per {exciseTInfo.unit}):</strong> ${(exciseTInfo.exciseAmount || 0).toFixed(2)}</div>
                        <Separator className="my-0.5" />
                        <div><strong>VAT ({companyProfile?.vatRate || 0}%) on (Base Price + Excise Tax):</strong> ${vatOnBaseAndExciseInfo.vatAmount.toFixed(2)} / {vatOnBaseAndExciseInfo.unit}</div>
                        {productToView.discountRate && productToView.discountRate > 0 &&
                          <div><strong>Product Discount Rate:</strong> {productToView.discountRate.toFixed(1)}%</div>
                        }
                        <Separator className="my-0.5" />
                        <div className="font-semibold"><strong>Final Sale Price / PCS (VAT, Excise, Disc. Incl.):</strong> ${finalPcsPriceInfoValue.price.toFixed(2)}</div>
                        {finalPkgPriceInfoValue.price !== null && (
                            <div className="font-semibold">
                            <strong>Final Sale Price / {finalPkgPriceInfoValue.unit} (VAT, Excise, Disc. Incl.):</strong> ${finalPkgPriceInfoValue.price.toFixed(2)}
                            </div>
                        )}
                     </>);
                  })()}
              </CardContent></Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!productToDelete} onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent>Are you sure?</AlertDialogTitleComponent> 
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product definition
              "{productToDelete?.name}". Associated stock records in warehouses will NOT be deleted automatically by this action, but this product definition will be gone.
            </AlertDialogDescription>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete Definition
            </AlertDialogAction>
          </AlertDialogFooterComponent>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

