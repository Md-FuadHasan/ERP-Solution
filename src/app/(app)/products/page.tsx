
'use client';
import { useState, useMemo, useEffect } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsFormModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormModalOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    setProductToView(product);
    setIsViewModalOpen(true);
  };

  const handleDeleteProductConfirm = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      toast({ title: "Product Deleted", description: `${productToDelete.name} has been removed.` });
      setProductToDelete(null);
    }
  };

  const handleSubmit = (data: ProductFormValues) => {
    let formSalePrice = data.salePrice; // This is pre-excise, pre-VAT
    let formExciseTaxValue = data.exciseTax ?? 0;

    let storedBaseUnitPrice: number;
    let storedBaseUnitExciseTax: number | undefined = undefined;

    // If packaging unit is defined, user input for salePrice and exciseTax is for the whole package.
    // We need to convert them to per-base-unit for storage.
    if (data.packagingUnit && data.packagingUnit.trim() !== '' && data.itemsPerPackagingUnit && data.itemsPerPackagingUnit > 0) {
      storedBaseUnitPrice = formSalePrice / data.itemsPerPackagingUnit;
      if (formExciseTaxValue > 0) {
        storedBaseUnitExciseTax = formExciseTaxValue / data.itemsPerPackagingUnit;
      }
    } else {
      storedBaseUnitPrice = formSalePrice;
      if (formExciseTaxValue > 0) {
        storedBaseUnitExciseTax = formExciseTaxValue;
      }
    }

    const productDataForStorage: Omit<Product, 'id' | 'createdAt'> = {
      name: data.name,
      sku: data.sku,
      category: data.category,
      unitType: data.unitType,
      packagingUnit: data.packagingUnit && data.packagingUnit.trim() !== '' ? data.packagingUnit.trim() : undefined,
      itemsPerPackagingUnit: data.packagingUnit && data.packagingUnit.trim() !== '' && data.itemsPerPackagingUnit ? data.itemsPerPackagingUnit : undefined,
      stockLevel: data.stockLevel,
      reorderPoint: data.reorderPoint,
      costPrice: data.costPrice,
      salePrice: storedBaseUnitPrice, // Store base unit sale price (pre-excise, pre-VAT)
      exciseTax: storedBaseUnitExciseTax, // Store base unit excise tax
    };

    if (editingProduct) {
      const updatedProductData: Product = {
        ...editingProduct,
        ...productDataForStorage,
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
        createdAt: new Date().toISOString(),
      };
      addProduct(newProduct);
      toast({ title: "Product Added", description: `${newProduct.name} has been successfully added.` });
    }

    setIsFormModalOpen(false);
    setEditingProduct(null);
  };

  const getCategoryBadgeVariant = (category: ProductCategory): VariantProps<typeof badgeVariants>['variant'] => {
    switch (category) {
      case 'Frozen': return 'categoryFrozen';
      case 'Dairy': return 'categoryDairy';
      case 'Beverages': return 'categoryBeverages';
      case 'Raw Materials': return 'categoryRawMaterials';
      case 'Packaging': return 'categoryPackaging';
      default: return 'secondary';
    }
  };
  
  // Helper functions for new price breakdown
  const getDisplayBasePriceInfo = (product: Product): { price: number; unit: string } => {
    if (product.packagingUnit && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
      return {
        price: product.salePrice * product.itemsPerPackagingUnit,
        unit: product.packagingUnit.toLowerCase() === 'carton' || product.packagingUnit.toLowerCase() === 'cartons' ? 'Ctn' : product.packagingUnit,
      };
    }
    return { price: product.salePrice, unit: product.unitType };
  };

  const getDisplayVatOnBasePriceInfo = (product: Product, profile: CompanyProfile): { vatAmount: number; unit: string } => {
    const basePriceInfo = getDisplayBasePriceInfo(product);
    const vatRate = typeof profile.vatRate === 'string' ? parseFloat(profile.vatRate) : (profile.vatRate || 0);
    const vatAmount = basePriceInfo.price * (vatRate / 100);
    return { vatAmount, unit: basePriceInfo.unit };
  };
  
  const getDisplayExciseTaxInfo = (product: Product): { exciseAmount: number; unit: string } => {
    const baseExcise = product.exciseTax || 0;
    if (product.packagingUnit && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
      return {
        exciseAmount: baseExcise * product.itemsPerPackagingUnit,
        unit: product.packagingUnit.toLowerCase() === 'carton' || product.packagingUnit.toLowerCase() === 'cartons' ? 'Ctn' : product.packagingUnit,
      };
    }
    return { exciseAmount: baseExcise, unit: product.unitType };
  };

  const calculateFinalPcsPriceWithVatAndExcise = (product: Product, profile: CompanyProfile) => {
    const vatRatePercent = typeof profile.vatRate === 'string' ? parseFloat(profile.vatRate) : (profile.vatRate || 0);
    // product.salePrice is base unit price (pre-excise, pre-VAT)
    // product.exciseTax is base unit excise tax
    const basePriceWithExcise = product.salePrice + (product.exciseTax || 0);
    const vatAmount = basePriceWithExcise * (vatRatePercent / 100);
    return basePriceWithExcise + vatAmount;
  };

  const calculateFinalCtnPriceWithVatAndExcise = (product: Product, profile: CompanyProfile) => {
    if (!product.packagingUnit || !product.itemsPerPackagingUnit || product.itemsPerPackagingUnit <= 0) {
      return null;
    }
    const vatRatePercent = typeof profile.vatRate === 'string' ? parseFloat(profile.vatRate) : (profile.vatRate || 0);
    const cartonBasePrice = product.salePrice * product.itemsPerPackagingUnit;
    const cartonExciseTax = (product.exciseTax || 0) * product.itemsPerPackagingUnit;
    
    const cartonPriceWithExcise = cartonBasePrice + cartonExciseTax;
    const vatAmount = cartonPriceWithExcise * (vatRatePercent / 100);
    return cartonPriceWithExcise + vatAmount;
  };


  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Products"
        description="Manage your product catalog."
        actions={
          <Button onClick={handleAddProduct} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
          </Button>
        }
      />
      <div className="mb-6">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name, SKU, ID, category..."
          className="w-full md:w-80"
        />
      </div>

      <div className="flex-grow min-h-0 rounded-lg border shadow-sm bg-card flex flex-col">
        <div className="h-full overflow-y-auto">
          {isLoading ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px]" rowSpan={2}>Product ID</TableHead>
                  <TableHead className="min-w-[180px]" rowSpan={2}>Name</TableHead>
                  <TableHead className="min-w-[80px]" rowSpan={2}>SKU</TableHead>
                  <TableHead className="min-w-[120px]" rowSpan={2}>Category</TableHead>
                  <TableHead className="min-w-[100px] text-right" rowSpan={2}>Stock</TableHead>
                  <TableHead className="min-w-[100px] text-right" rowSpan={2}>Base Price</TableHead>
                  <TableHead className="min-w-[100px] text-right" rowSpan={2}>VAT ({companyProfile.vatRate || 0}%)</TableHead>
                  <TableHead className="min-w-[100px] text-right" rowSpan={2}>Excise Tax</TableHead>
                  <TableHead className="text-center" colSpan={2}>
                    Final Sale Price <span className="text-xs font-normal opacity-75">(Inc VAT & Excise)</span>
                  </TableHead>
                  <TableHead className="text-right min-w-[150px]" rowSpan={2}>Actions</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="min-w-[80px] text-right text-xs font-normal">CTN Price</TableHead>
                  <TableHead className="min-w-[80px] text-right text-xs font-normal">PCS Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(10)].map((_, i) => (
                  <TableRow key={i} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-3/4 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-3/4 ml-auto" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
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
                  <TableHead className="min-w-[100px]" rowSpan={2}>Product ID</TableHead>
                  <TableHead className="min-w-[180px]" rowSpan={2}>Name</TableHead>
                  <TableHead className="min-w-[80px]" rowSpan={2}>SKU</TableHead>
                  <TableHead className="min-w-[120px]" rowSpan={2}>Category</TableHead>
                  <TableHead className="min-w-[100px] text-right" rowSpan={2}>Stock</TableHead>
                  <TableHead className="min-w-[100px] text-right" rowSpan={2}>Base Price</TableHead>
                  <TableHead className="min-w-[100px] text-right" rowSpan={2}>VAT ({companyProfile.vatRate || 0}%)</TableHead>
                  <TableHead className="min-w-[100px] text-right" rowSpan={2}>Excise Tax</TableHead>
                  <TableHead className="text-center" colSpan={2}>
                    Final Sale Price <span className="text-xs font-normal opacity-75">(Inc VAT & Excise)</span>
                  </TableHead>
                  <TableHead className="text-right min-w-[150px]" rowSpan={2}>Actions</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="min-w-[80px] text-right text-xs font-normal">CTN Price</TableHead>
                  <TableHead className="min-w-[80px] text-right text-xs font-normal">PCS Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => {
                  const basePriceInfo = getDisplayBasePriceInfo(product);
                  const vatOnBasePriceInfo = getDisplayVatOnBasePriceInfo(product, companyProfile);
                  const exciseTaxInfo = getDisplayExciseTaxInfo(product);
                  const finalPcsPrice = calculateFinalPcsPriceWithVatAndExcise(product, companyProfile);
                  const finalCtnPrice = calculateFinalCtnPriceWithVatAndExcise(product, companyProfile);

                  return (
                    <TableRow key={product.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                      <TableCell className="font-medium">{product.id}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>
                        <Badge variant={getCategoryBadgeVariant(product.category)} className="text-xs">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        product.stockLevel <= product.reorderPoint ? "text-destructive" : "text-foreground"
                      )}>
                        {product.stockLevel} {product.unitType}
                      </TableCell>
                      <TableCell className="text-right">${basePriceInfo.price.toFixed(2)} / {basePriceInfo.unit}</TableCell>
                      <TableCell className="text-right">${vatOnBasePriceInfo.vatAmount.toFixed(2)} / {vatOnBasePriceInfo.unit}</TableCell>
                      <TableCell className="text-right">${exciseTaxInfo.exciseAmount.toFixed(2)} / {exciseTaxInfo.unit}</TableCell>
                      <TableCell className="text-right">{finalCtnPrice !== null ? `$${finalCtnPrice.toFixed(2)}` : '-'}</TableCell>
                      <TableCell className="text-right">${finalPcsPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleViewProduct(product)} className="hover:text-primary" title="View Product">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)} className="hover:text-primary" title="Edit Product">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:text-destructive"
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
            <div className="flex-grow flex items-center justify-center p-8">
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
              Viewing details for product {productToView?.sku}.
            </DialogDescription>
          </DialogHeader>
          {productToView && companyProfile &&(
            <div className="space-y-4 py-4 text-sm">
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div><strong>Product ID:</strong></div><div>{productToView.id}</div>
                    <div><strong>SKU:</strong></div><div>{productToView.sku}</div>
                    <div className="col-span-2 pt-2"><strong>Name:</strong></div><div className="col-span-2 -mt-1">{productToView.name}</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><strong>Category:</strong></div>
                  <div>
                    <Badge variant={getCategoryBadgeVariant(productToView.category)} className="text-xs">
                      {productToView.category}
                    </Badge>
                  </div>
                  <div><strong>Base Unit:</strong></div><div><Badge variant="outline">{productToView.unitType}</Badge> ({productToView.unitType} are tracked in stock)</div>
                  {productToView.packagingUnit && (
                    <>
                      <div className="col-span-2"><Separator className="my-1" /></div>
                      <div><strong>Packaging Unit:</strong></div><div><Badge variant="outline">{productToView.packagingUnit}</Badge></div>
                      <div><strong>Items per Package:</strong></div><div>{productToView.itemsPerPackagingUnit} {productToView.unitType}</div>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><strong>Stock Level:</strong></div>
                  <div className={cn(productToView.stockLevel <= productToView.reorderPoint ? "text-destructive font-semibold" : "")}>
                    {productToView.stockLevel} {productToView.unitType}
                  </div>
                  <div><strong>Reorder Point:</strong></div><div>{productToView.reorderPoint} {productToView.unitType}</div>
                </CardContent>
              </Card>
              <Card>
                 <CardContent className="pt-6 grid grid-cols-1 gap-y-2">
                    <div>
                        <strong>Base Price:</strong>
                        &nbsp;${getDisplayBasePriceInfo(productToView).price.toFixed(2)} / {getDisplayBasePriceInfo(productToView).unit}
                        <span className="text-muted-foreground text-xs italic"> (pre-VAT, pre-excise)</span>
                    </div>
                    <Separator className="my-1" />
                     <div>
                        <strong>VAT ({companyProfile.vatRate || 0}% on Base Price):</strong>
                        &nbsp;${getDisplayVatOnBasePriceInfo(productToView, companyProfile).vatAmount.toFixed(2)} / {getDisplayVatOnBasePriceInfo(productToView, companyProfile).unit}
                    </div>
                    <Separator className="my-1" />
                    <div>
                        <strong>Excise Tax:</strong>
                        &nbsp;${getDisplayExciseTaxInfo(productToView).exciseAmount.toFixed(2)} / {getDisplayExciseTaxInfo(productToView).unit}
                    </div>
                    <Separator className="my-1" />
                     <div className="font-semibold">
                        <strong>Final Sale Price / PCS (VAT & Excise Incl.):</strong>
                        &nbsp;${calculateFinalPcsPriceWithVatAndExcise(productToView, companyProfile).toFixed(2)}
                    </div>
                    {productToView.packagingUnit && productToView.itemsPerPackagingUnit && productToView.itemsPerPackagingUnit > 0 && (
                        <div className="font-semibold">
                        <strong>Final Sale Price / {getDisplayExciseTaxInfo(productToView).unit} (VAT & Excise Incl.):</strong>
                        &nbsp;${calculateFinalCtnPriceWithVatAndExcise(productToView, companyProfile)?.toFixed(2) || 'N/A'}
                        </div>
                    )}
                </CardContent>
              </Card>
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
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
