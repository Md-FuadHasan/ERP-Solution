
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog";


// Helper functions moved outside the component
const getDisplayUnit = (product: Product, type: 'base' | 'package' | 'pieces'): string => {
  if (type === 'pieces') return 'PCS';
  let unit: string | undefined;
  if (type === 'package' && product.packagingUnit && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
    unit = product.packagingUnit;
  } else {
    unit = product.unitType;
  }
  const unitLower = unit?.toLowerCase();
  if (unitLower === 'carton' || unitLower === 'cartons') return 'Ctn';
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

const getDisplayBasePriceInfo = (product: Product): { price: number; unit: string } => {
  const price = typeof product.basePrice === 'number' && !isNaN(product.basePrice) ? product.basePrice : 0;
  let displayUnit = getDisplayUnit(product, 'base');
  return { price, unit: displayUnit };
};

const getDisplayExciseTaxInfo = (product: Product): { exciseAmount: number; unit: string } => {
  const exciseAmount = typeof product.exciseTax === 'number' && !isNaN(product.exciseTax) ? product.exciseTax : 0;
  let displayUnit = getDisplayUnit(product, 'base');
  return { exciseAmount, unit: displayUnit };
};

const getDisplayVatInfo = (product: Product, companyProfile: CompanyProfile | null | undefined): { vatAmount: number; unit: string } => {
  const basePricePerBaseUnit = typeof product.basePrice === 'number' && !isNaN(product.basePrice) ? product.basePrice : 0;
  const exciseTaxPerBaseUnit = typeof product.exciseTax === 'number' && !isNaN(product.exciseTax) ? product.exciseTax : 0;
  const vatRate = (companyProfile?.vatRate ? (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : companyProfile.vatRate) : 0) / 100;
  
  const subtotalForVatPerBaseUnit = basePricePerBaseUnit + exciseTaxPerBaseUnit;
  const vatAmount = subtotalForVatPerBaseUnit * vatRate;
  const displayUnit = getDisplayUnit(product, 'base');
  
  return { vatAmount, unit: displayUnit };
};

const calculateFinalPcsPriceWithVatAndExcise = (product: Product, companyProfile: CompanyProfile | null | undefined): number => {
  const basePricePerBaseUnit = typeof product.basePrice === 'number' && !isNaN(product.basePrice) ? product.basePrice : 0;
  const exciseTaxPerBaseUnit = typeof product.exciseTax === 'number' && !isNaN(product.exciseTax) ? product.exciseTax : 0;
  const piecesInBase = product.piecesInBaseUnit && product.piecesInBaseUnit > 0 ? product.piecesInBaseUnit : 1;

  const basePricePerConceptualPiece = basePricePerBaseUnit / piecesInBase;
  const exciseTaxPerConceptualPiece = exciseTaxPerBaseUnit / piecesInBase;

  const subtotalBeforeVAT = basePricePerConceptualPiece + exciseTaxPerConceptualPiece;
  const vatRatePercent = companyProfile?.vatRate ? (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : companyProfile.vatRate) : 0;
  const vatAmountOnPcs = subtotalBeforeVAT * (vatRatePercent / 100);
  return subtotalBeforeVAT + vatAmountOnPcs;
};

const calculateFinalPkgPriceWithVatAndExcise = (product: Product, companyProfile: CompanyProfile | null | undefined): { price: number | null; unit: string } => {
  const basePricePerBaseUnit = typeof product.basePrice === 'number' && !isNaN(product.basePrice) ? product.basePrice : 0;
  const exciseTaxPerBaseUnit = typeof product.exciseTax === 'number' && !isNaN(product.exciseTax) ? product.exciseTax : 0;
  const vatRatePercent = companyProfile?.vatRate ? (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : companyProfile.vatRate) : 0;

  let itemsInTargetUnit = 1;
  let displayUnit = getDisplayUnit(product, 'base');
  let isPackageContext = false;

  if (product.packagingUnit && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
    // Using the optional larger packaging unit
    itemsInTargetUnit = product.itemsPerPackagingUnit;
    displayUnit = getDisplayUnit(product, 'package');
    isPackageContext = true;
  } else if (product.unitType.toLowerCase() !== 'pcs' && (product.piecesInBaseUnit || 0) > 0) {
    // Base unit itself is a package (like 'Cartons'), and we are pricing this base unit package
    itemsInTargetUnit = 1; // We are pricing one base unit
    displayUnit = getDisplayUnit(product, 'base');
    isPackageContext = true;
  } else if (product.unitType.toLowerCase() === 'pcs' && !product.packagingUnit) {
    // Base unit is PCS and no larger package defined, so no "package" price to show
    return { price: null, unit: '-' };
  } else {
     // Default fallback or unhandled scenario
    return { price: null, unit: '-' };
  }
  
  if (!isPackageContext) return { price: null, unit: '-' };

  const totalBasePriceForTargetUnit = basePricePerBaseUnit * itemsInTargetUnit;
  const totalExciseTaxForTargetUnit = exciseTaxPerBaseUnit * itemsInTargetUnit;

  const subtotalBeforeVAT = totalBasePriceForTargetUnit + totalExciseTaxForTargetUnit;
  const vatAmount = subtotalBeforeVAT * (vatRatePercent / 100);
  const finalPrice = subtotalBeforeVAT + vatAmount;

  return { price: finalPrice, unit: displayUnit };
};


export default function ProductsPage() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
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
    const productDataForStorage = {
      name: data.name,
      sku: data.sku || '',
      category: data.category,
      unitType: data.unitType,
      piecesInBaseUnit: data.piecesInBaseUnit || undefined,
      packagingUnit: data.packagingUnit && data.packagingUnit.trim() !== '' ? data.packagingUnit.trim() : undefined,
      itemsPerPackagingUnit: data.packagingUnit && data.packagingUnit.trim() !== '' && data.itemsPerPackagingUnit ? data.itemsPerPackagingUnit : undefined,
      reorderPoint: data.reorderPoint,
      basePrice: data.basePrice,
      exciseTax: data.exciseTax === undefined || data.exciseTax === null ? 0 : data.exciseTax,
    };

    if (editingProduct) {
      const newStockLevel = editingProduct.stockLevel + (data.addStockQuantity || 0);
      const updatedProductData: Product = {
        ...editingProduct,
        ...productDataForStorage,
        stockLevel: newStockLevel,
      };
      updateProduct(updatedProductData);
      toast({ title: "Product Updated", description: `${data.name} details have been updated.` });
    } else {
      let finalProductId = data.id;
      if (finalProductId && finalProductId.trim() !== '') {
        if (products.find(p => p.id === finalProductId && (!editingProduct || editingProduct.id !== finalProductId))) {
          toast({
            title: "Error: Product ID exists",
            description: `Product ID ${finalProductId} is already in use. Please choose a different ID or leave blank.`,
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
        stockLevel: data.stockLevel || 0,
        createdAt: new Date().toISOString(),
      };
      addProduct(newProduct);
      toast({ title: "Product Added", description: `${newProduct.name} has been successfully added.` });
    }

    setIsFormModalOpen(false);
    setEditingProduct(null);
  }, [addProduct, updateProduct, products, toast, editingProduct]);


  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Products"
          description="Manage your product catalog, pricing, and stock levels."
          actions={
            <Button onClick={handleAddProduct} className="w-full sm:w-auto" disabled={isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
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
        <div className="h-full overflow-y-auto">
          {isLoading ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                 <TableRow>
                  <TableHead rowSpan={2} className="text-left min-w-[80px] px-2 align-middle text-sm">Product ID</TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[150px] px-2 align-middle text-sm">Name</TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[70px] px-2 align-middle text-sm">SKU</TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[100px] px-2 align-middle text-sm">Category</TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[70px] px-2 align-middle text-sm">Stock</TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[100px] px-2 align-middle text-sm">Total PCS (Calc.)</TableHead>
                  <TableHead rowSpan={2} className="text-right min-w-[100px] px-2 align-middle text-sm">Base Price</TableHead>
                  <TableHead rowSpan={2} className="text-right min-w-[90px] px-2 align-middle text-sm">Excise Tax</TableHead>
                  <TableHead rowSpan={2} className="text-right min-w-[90px] px-2 align-middle text-sm">VAT (15%)</TableHead>
                  <TableHead colSpan={2} className="text-center align-bottom min-w-[180px] px-2 text-sm">
                    <div>Sale Price</div>
                    <div className="text-xs font-normal opacity-75">(Inc VAT & Excise)</div>
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center min-w-[100px] px-2 align-middle text-sm">Actions</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-center text-xs font-normal opacity-75 min-w-[90px] px-2">CTN</TableHead>
                  <TableHead className="text-center text-xs font-normal opacity-75 min-w-[90px] px-2">PCS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(10)].map((_, i) => (
                  <TableRow key={i} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-center px-2">
                        <div className="flex justify-center items-center gap-1">
                            <Skeleton className="h-7 w-7" />
                            <Skeleton className="h-7 w-7" />
                            <Skeleton className="h-7 w-7" />
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
                  <TableHead rowSpan={2} className="text-left min-w-[150px] px-2 align-middle text-sm">Name</TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[70px] px-2 align-middle text-sm">SKU</TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[100px] px-2 align-middle text-sm">Category</TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[70px] px-2 align-middle text-sm">Stock</TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[100px] px-2 align-middle text-sm">Total PCS (Calc.)</TableHead>
                  <TableHead rowSpan={2} className="text-right min-w-[100px] px-2 align-middle text-sm">Base Price</TableHead>
                  <TableHead rowSpan={2} className="text-right min-w-[90px] px-2 align-middle text-sm">Excise Tax</TableHead>
                  <TableHead rowSpan={2} className="text-right min-w-[90px] px-2 align-middle text-sm">VAT (15%)</TableHead>
                  <TableHead colSpan={2} className="text-center align-bottom min-w-[180px] px-2 text-sm">
                    <div>Sale Price</div>
                    <div className="text-xs font-normal opacity-75">(Inc VAT & Excise)</div>
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center min-w-[100px] px-2 align-middle text-sm">Actions</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-center text-xs font-normal opacity-75 min-w-[90px] px-2">CTN</TableHead>
                  <TableHead className="text-center text-xs font-normal opacity-75 min-w-[90px] px-2">PCS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => {
                  const currentStockLevel = product.stockLevel;
                  const stockValueToDisplay = currentStockLevel.toFixed((product.unitType === 'Kgs' || product.unitType === 'Liters') && currentStockLevel % 1 !== 0 ? 2 : 0);
                  
                  const baseUnitTypeDisplay = getDisplayUnit(product, 'base');
                  
                  const totalPieces = product.stockLevel * (product.piecesInBaseUnit || (product.unitType.toLowerCase() === 'pcs' ? 1 : 0));

                  const basePriceInfo = getDisplayBasePriceInfo(product);
                  const exciseTaxInfo = getDisplayExciseTaxInfo(product);
                  const vatInfo = getDisplayVatInfo(product, companyProfile);
                  const finalPcsPrice = calculateFinalPcsPriceWithVatAndExcise(product, companyProfile);
                  const finalPkgPriceInfo = calculateFinalPkgPriceWithVatAndExcise(product, companyProfile);
                  
                  return (
                    <TableRow key={product.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                      <TableCell className="text-left px-2 font-medium">{product.id}</TableCell>
                      <TableCell className="text-left px-2">{product.name}</TableCell>
                      <TableCell className="text-left px-2">{product.sku}</TableCell>
                      <TableCell className="text-left px-2">
                        <Badge variant={getCategoryBadgeVariant(product.category)} className="text-xs">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        "text-left font-medium px-2",
                        product.stockLevel <= product.reorderPoint ? "text-destructive" : ""
                      )}>
                        {stockValueToDisplay} {baseUnitTypeDisplay}
                      </TableCell>
                       <TableCell className="text-left px-2">
                        {totalPieces > 0 ? `${totalPieces.toFixed(0)} PCS` : '-'}
                      </TableCell>
                      <TableCell className="text-right px-2">${basePriceInfo.price.toFixed(2)} / {basePriceInfo.unit}</TableCell>
                      <TableCell className="text-right px-2">${exciseTaxInfo.exciseAmount.toFixed(2)} / {exciseTaxInfo.unit}</TableCell>
                      <TableCell className="text-right px-2">${vatInfo.vatAmount.toFixed(2)} / {vatInfo.unit}</TableCell>
                      <TableCell className="text-right px-2">{finalPkgPriceInfo.price !== null ? `$${finalPkgPriceInfo.price.toFixed(2)} / ${finalPkgPriceInfo.unit}` : '-'}</TableCell>
                      <TableCell className="text-right px-2">${finalPcsPrice.toFixed(2)}</TableCell>
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
                message={searchTerm ? "Try adjusting your search term." : "Get started by adding your first product."}
                action={!searchTerm ? (
                  <Button onClick={handleAddProduct} className="w-full max-w-xs mx-auto sm:w-auto sm:max-w-none sm:mx-0">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Product
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
        <DialogContent className="w-[90vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update the details for this product.' : 'Enter the details for the new product.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
            <ProductForm
              initialData={editingProduct}
              onSubmit={handleSubmit}
              onCancel={() => { setIsFormModalOpen(false); setEditingProduct(null); }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="w-[90vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>Product Details: {productToView?.name}</DialogTitle>
            <DialogDescription>
              Viewing details for product {productToView?.id} (SKU: {productToView?.sku}).
            </DialogDescription>
          </DialogHeader>
          {productToView && (
            <div className="space-y-3 py-4 text-sm">
              <Card><CardContent className="pt-4 space-y-1">
                <div className="grid grid-cols-2 gap-x-2">
                  <div><strong>Product ID:</strong></div><div>{productToView.id}</div>
                  <div><strong>SKU:</strong></div><div>{productToView.sku || 'N/A'}</div>
                  <div className="col-span-2 pt-1"><strong>Name:</strong></div><div className="col-span-2 -mt-1">{productToView.name}</div>
                </div>
              </CardContent></Card>
              
              <Card><CardContent className="pt-4 grid grid-cols-2 gap-x-2 gap-y-1">
                  <div><strong>Category:</strong></div>
                  <div><Badge variant={getCategoryBadgeVariant(productToView.category)} className="text-xs">{productToView.category}</Badge></div>
                  
                  <div><strong>Primary Stocking Unit (Base Unit):</strong></div>
                  <div><Badge variant="outline">{getDisplayUnit(productToView, 'base')}</Badge></div>

                  {productToView.piecesInBaseUnit && productToView.piecesInBaseUnit > 0 ? (
                    <>
                      <div><strong>Individual Pieces in Base Unit:</strong></div>
                      <div>{productToView.piecesInBaseUnit} PCS</div>
                    </>
                  ): null}
                  
                  {productToView.packagingUnit && productToView.itemsPerPackagingUnit && (
                    <>
                      <div className="col-span-2"><Separator className="my-0.5" /></div>
                      <div><strong>Also Sold As (Larger Package):</strong></div>
                      <div><Badge variant="outline">{getDisplayUnit(productToView, 'package')}</Badge></div>
                      
                      <div><strong>Base Units in Larger Package:</strong></div>
                      <div>{productToView.itemsPerPackagingUnit} {getDisplayUnit(productToView, 'base')}</div>
                    </>
                  )}
              </CardContent></Card>
              
              <Card><CardContent className="pt-4 grid grid-cols-2 gap-x-2 gap-y-1">
                  <div><strong>Current Stock Level:</strong></div>
                  <div className={cn(productToView.stockLevel <= productToView.reorderPoint ? "text-destructive font-semibold" : "")}>
                    {productToView.stockLevel.toFixed((productToView.unitType === 'Kgs' || productToView.unitType === 'Liters') && productToView.stockLevel % 1 !== 0 ? 2 : 0)} {getDisplayUnit(productToView, 'base')}
                  </div>
                  
                  <div><strong>Total Pieces (Calculated):</strong></div>
                  <div>{(productToView.stockLevel * (productToView.piecesInBaseUnit || (productToView.unitType.toLowerCase() === 'pcs' ? 1:0) ) ).toFixed(0)} PCS</div>

                  <div><strong>Reorder Point:</strong></div><div>{productToView.reorderPoint} {getDisplayUnit(productToView, 'base')}</div>
              </CardContent></Card>
              
               <Card><CardContent className="pt-4 grid grid-cols-1 gap-y-1">
                  {(() => {
                     const basePInfo = getDisplayBasePriceInfo(productToView);
                     const exciseTInfo = getDisplayExciseTaxInfo(productToView);
                     const vatOnBaseAndExciseInfo = getDisplayVatInfo(productToView, companyProfile);
                     
                     const finalPcsPriceInfo = calculateFinalPcsPriceWithVatAndExcise(productToView, companyProfile);
                     const finalPkgPriceInfoValue = calculateFinalPkgPriceWithVatAndExcise(productToView, companyProfile);
                     
                     return (<>
                        <div><strong>Base Price (per {basePInfo.unit}):</strong> ${basePInfo.price.toFixed(2)}</div>
                        <div><strong>Excise Tax (per {exciseTInfo.unit}):</strong> ${(exciseTInfo.exciseAmount || 0).toFixed(2)}</div>
                        <Separator className="my-0.5" />
                        <div><strong>VAT ({companyProfile?.vatRate || 0}%) on (Base Price + Excise Tax):</strong> ${vatOnBaseAndExciseInfo.vatAmount.toFixed(2)} / {vatOnBaseAndExciseInfo.unit}</div>
                        <Separator className="my-0.5" />
                        <div className="font-semibold"><strong>Final Sale Price / PCS (VAT & Excise Incl.):</strong> ${finalPcsPriceInfo.toFixed(2)}</div>
                        {finalPkgPriceInfoValue.price !== null && (
                            <div className="font-semibold">
                            <strong>Final Sale Price / {finalPkgPriceInfoValue.unit} (VAT & Excise Incl.):</strong> ${finalPkgPriceInfoValue.price.toFixed(2)}
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
          <AlertDialogHeader>
            <AlertDialogTitleComponent>Are you sure?</AlertDialogTitleComponent> 
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              "{productToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

