
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
import type { Product, ProductCategory, ProductUnitType } from '@/types';
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
    let actualBaseUnitPrice = data.salePrice;
    if (data.packagingUnit && data.packagingUnit.trim() !== '' && data.itemsPerPackagingUnit && data.itemsPerPackagingUnit > 0) {
      actualBaseUnitPrice = data.salePrice / data.itemsPerPackagingUnit;
    }

    const productDataForStorage = {
      name: data.name,
      sku: data.sku,
      category: data.category,
      unitType: data.unitType,
      packagingUnit: data.packagingUnit && data.packagingUnit.trim() !== '' ? data.packagingUnit.trim() : undefined,
      itemsPerPackagingUnit: data.packagingUnit && data.packagingUnit.trim() !== '' && data.itemsPerPackagingUnit ? data.itemsPerPackagingUnit : undefined,
      stockLevel: data.stockLevel,
      reorderPoint: data.reorderPoint,
      costPrice: data.costPrice,
      salePrice: actualBaseUnitPrice, // Always store the base unit price
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
      case 'Raw Materials': return 'categoryRawMaterials';
      case 'Packaging': return 'categoryPackaging';
      case 'Dairy': return 'categoryDairy';
      case 'Beverages': return 'categoryBeverages';
      default: return 'secondary';
    }
  };

  const calculateDisplaySalePrice = (product: Product) => {
    const vatRatePercent = typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : (companyProfile.vatRate || 0);
    const vatMultiplier = 1 + (vatRatePercent / 100);
    
    let priceForCalc = product.salePrice; 
    let priceUnit: string = product.unitType;

    if (product.packagingUnit && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
      priceForCalc = product.salePrice * product.itemsPerPackagingUnit; 
      priceUnit = product.packagingUnit;
    }
    
    if (priceUnit.toLowerCase() === 'carton' || priceUnit.toLowerCase() === 'cartons') {
        priceUnit = 'Ctn';
    }

    return {
      priceWithVat: priceForCalc * vatMultiplier,
      unit: priceUnit
    };
  };

  return (
    <div className="max-h-[610px] flex flex-col">
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
{/* main table starts */}
      <div className="relative flex-grow h-full overflow-hidden rounded-lg border shadow-sm bg-card flex flex-col">
        {isLoading ? (
          <div className="relative flex-grow"> 
{/* Suggested code may be subject to a license. Learn more: ~LicenseLog:2205773654. */}
            <Table className="relative overflow-y-auto max-h-auto">
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px]">Product ID</TableHead>
                  <TableHead className="min-w-[180px]">Name</TableHead>
                  <TableHead className="min-w-[120px]">SKU</TableHead>
                  <TableHead className="min-w-[120px]">Category</TableHead>
                  <TableHead className="min-w-[100px] text-right">Stock</TableHead>
                  <TableHead className="min-w-[100px] text-right">Cost</TableHead>
                  <TableHead className="min-w-[140px] text-right">Sale Price (incl. VAT)</TableHead>
                  <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="overscroll-auto">
                {[...Array(10)].map((_, i) => (
                  <TableRow key={i} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
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
          </div>
        ) : filteredProducts.length > 0 ? (
           <div className="flex-grow overflow-y-auto relative"> 
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                  <TableHead className="min-w-[100px]">Product ID</TableHead>
                  <TableHead className="min-w-[180px]">Name</TableHead>
                  <TableHead className="min-w-[120px]">SKU</TableHead>
                  <TableHead className="min-w-[120px]">Category</TableHead>
                  <TableHead className="min-w-[100px] text-right">Stock</TableHead>
                  <TableHead className="min-w-[100px] text-right">Cost</TableHead>
                  <TableHead className="min-w-[140px] text-right">Sale Price (incl. VAT)</TableHead>
                  <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="overscroll-contain">
                {filteredProducts.map((product, index) => {
                  const { priceWithVat, unit } = calculateDisplaySalePrice(product);
                  return (
                    <TableRow key={product.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                      <TableCell className="font-medium text-xs">{product.id}</TableCell>
                      <TableCell className="text-xs">{product.name}</TableCell>
                      <TableCell className="text-xs">{product.sku}</TableCell>
                      <TableCell>
                        <Badge variant={getCategoryBadgeVariant(product.category)} className="text-xs">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium text-xs",
                        product.stockLevel <= product.reorderPoint ? "text-destructive" : "text-foreground"
                      )}>
                        {product.stockLevel} {product.unitType}
                      </TableCell>
                      <TableCell className="text-right text-xs">${product.costPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-xs">
                        ${priceWithVat.toFixed(2)} / {unit}
                      </TableCell>
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
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-8"> 
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
          {productToView && (
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
                      <div className="col-span-2"><Separator className="my-1"/></div>
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
                <CardContent className="pt-6 grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><strong>Cost Price (per Base Unit):</strong></div><div>${productToView.costPrice.toFixed(2)} / {productToView.unitType}</div>
                  {(() => {
                    const { priceWithVat, unit } = calculateDisplaySalePrice(productToView);
                    const baseUnitPriceExVat = productToView.salePrice; 
                    
                    return (
                      <>
                        <div><strong>Sale Price (incl. VAT):</strong></div>
                        <div>${priceWithVat.toFixed(2)} / {unit}</div>
                        <div className="col-span-2 text-muted-foreground text-xs italic">
                          (Base unit sale price ex-VAT: ${baseUnitPriceExVat.toFixed(2)} / {productToView.unitType})
                        </div>
                      </>
                    );
                  })()}
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