
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function ProductsPage() {
  const {
    products,
    addProduct,
    updateProduct,
    // deleteProduct, // We'll add delete functionality later
    isLoading,
  } = useData();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  // const [productToDelete, setProductToDelete] = useState<Product | null>(null); // For delete later

  const [productToView, setProductToView] = useState<Product | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // const handleDeleteProductConfirm = (product: Product) => {
  //   setProductToDelete(product);
  // };

  // const confirmDelete = () => {
  //   if (productToDelete) {
  //     deleteProduct(productToDelete.id);
  //     toast({ title: "Product Deleted", description: `${productToDelete.name} has been removed.` });
  //     setProductToDelete(null);
  //   }
  // };

  const handleSubmit = (data: ProductFormValues) => {
    if (editingProduct) {
      const updatedProductData: Product = {
        ...editingProduct,
        ...data,
        category: data.category as ProductCategory,
        unitType: data.unitType as ProductUnitType,
      };
      updateProduct(updatedProductData);
      toast({ title: "Product Updated", description: `${data.name} details have been updated.` });
    } else {
      let productId = data.id;
      if (!productId) {
        productId = `PROD${String(Date.now()).slice(-5)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;
        while (products.find(p => p.id === productId)) {
          productId = `PROD${String(Date.now()).slice(-5)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;
        }
      } else {
         if (products.find(p => p.id === productId && (!editingProduct || editingProduct.id !== productId))) {
          toast({
            title: "Error: Product ID exists",
            description: `Product ID ${productId} is already in use. Please choose a different ID or leave it blank for auto-generation.`,
            variant: "destructive",
          });
          return;
        }
      }

      const newProduct: Product = {
        ...data,
        id: productId,
        category: data.category as ProductCategory,
        unitType: data.unitType as ProductUnitType,
      };
      addProduct(newProduct);
      toast({ title: "Product Added", description: `${data.name} has been successfully added.` });
    }
    setIsFormModalOpen(false);
    setEditingProduct(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Products"
          description="Manage your product catalog."
          actions={
            <Button onClick={handleAddProduct} disabled className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
            </Button>
          }
        />
        <div className="mb-6">
          <Skeleton className="h-10 w-full md:w-80" />
        </div>
        <div className="flex-grow min-h-0">
          <div className="rounded-lg border shadow-sm bg-card overflow-hidden h-full">
            <div className="overflow-y-auto max-h-96">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                  <TableRow>
                    <TableHead className="min-w-[100px]"><Skeleton className="h-5 w-full bg-primary/50" /></TableHead>
                    <TableHead className="min-w-[180px]"><Skeleton className="h-5 w-full bg-primary/50" /></TableHead>
                    <TableHead className="min-w-[120px]"><Skeleton className="h-5 w-full bg-primary/50" /></TableHead>
                    <TableHead className="min-w-[120px]"><Skeleton className="h-5 w-full bg-primary/50" /></TableHead>
                    <TableHead className="min-w-[100px] text-right"><Skeleton className="h-5 w-full bg-primary/50" /></TableHead>
                    <TableHead className="min-w-[100px] text-right"><Skeleton className="h-5 w-full bg-primary/50" /></TableHead>
                    <TableHead className="min-w-[100px] text-right"><Skeleton className="h-5 w-full bg-primary/50" /></TableHead>
                    <TableHead className="text-right min-w-[150px]"><Skeleton className="h-8 w-32 ml-auto bg-primary/50" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(7)].map((_, i) => (
                    <TableRow key={i} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                      {[...Array(8)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-3/4" /></TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="flex-grow min-h-0">
        <div className="rounded-lg border shadow-sm bg-card overflow-hidden h-full">
          <div className="overflow-y-auto max-h-96">
            {filteredProducts.length > 0 ? (
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                  <TableRow>
                    <TableHead className="min-w-[100px]">Product ID</TableHead>
                    <TableHead className="min-w-[180px]">Name</TableHead>
                    <TableHead className="min-w-[120px]">SKU</TableHead>
                    <TableHead className="min-w-[120px]">Category</TableHead>
                    <TableHead className="min-w-[100px] text-right">Stock</TableHead>
                    <TableHead className="min-w-[100px] text-right">Cost</TableHead>
                    <TableHead className="min-w-[100px] text-right">Sale Price</TableHead>
                    <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product, index) => (
                    <TableRow key={product.id} className={cn(index % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                      <TableCell className="font-medium">{product.id}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell><Badge variant="secondary">{product.category}</Badge></TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        product.stockLevel <= product.reorderPoint ? "text-destructive" : "text-foreground"
                      )}>
                        {product.stockLevel} {product.unitType}
                      </TableCell>
                      <TableCell className="text-right">${product.costPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${product.salePrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                           <Button variant="ghost" size="icon" onClick={() => handleViewProduct(product)} className="hover:text-primary" title="View Product">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)} className="hover:text-primary" title="Edit Product">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {/* <Button variant="ghost" size="icon" className="hover:text-destructive" title="Delete Product" onClick={() => handleDeleteProductConfirm(product)}>
                            <Trash2 className="h-4 w-4" />
                          </Button> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
        </div>
      </div>

      {/* Add/Edit Product Modal */}
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

      {/* View Product Details Modal */}
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
                  <div><strong>Category:</strong></div> <div><Badge variant="outline">{productToView.category}</Badge></div>
                  <div><strong>Unit Type:</strong></div><div><Badge variant="outline">{productToView.unitType}</Badge></div>
                </CardContent>
              </Card>
               <Card>
                <CardContent className="pt-6 grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><strong>Stock Level:</strong></div>
                  <div className={cn(productToView.stockLevel <= productToView.reorderPoint ? "text-destructive font-semibold" : "")}>
                    {productToView.stockLevel}
                  </div>
                  <div><strong>Reorder Point:</strong></div><div>{productToView.reorderPoint}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><strong>Cost Price:</strong></div><div>${productToView.costPrice.toFixed(2)}</div>
                  <div><strong>Sale Price:</strong></div><div>${productToView.salePrice.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog for delete confirmation - to be added later
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
      */}
    </div>
  );
}

    
