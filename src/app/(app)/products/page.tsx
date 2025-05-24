
'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Eye, ChevronsUpDown, ArrowUp, ArrowDown, ListFilter } from 'lucide-react';
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
import { PRODUCT_CATEGORIES } from '@/types';
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
import { format, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Helper Functions (Defined outside component for potential reusability if exported) ---

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
  const basePricePerUnit = typeof product.basePrice === 'number' && !isNaN(product.basePrice) ? product.basePrice : 0;
  const exciseTaxPerUnit = typeof product.exciseTax === 'number' && !isNaN(product.exciseTax) ? product.exciseTax : 0;
  const subtotalForVatPerUnit = basePricePerUnit + exciseTaxPerUnit;
  const vatRate = (companyProfile?.vatRate ? (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : Number(companyProfile.vatRate)) : 0) / 100;
  const vatAmount = subtotalForVatPerUnit * vatRate;
  return { vatAmount, unit: getDisplayUnit(product, 'base') };
};

export const calculateFinalPcsPriceWithVatAndExcise = (product: Product, companyProfile: CompanyProfile | null | undefined): { price: number; unit: string } => {
  const basePricePerBaseUnit = typeof product.basePrice === 'number' && !isNaN(product.basePrice) ? product.basePrice : 0;
  const exciseTaxPerBaseUnit = typeof product.exciseTax === 'number' && !isNaN(product.exciseTax) ? product.exciseTax : 0;
  
  // piecesInBaseUnit helps determine the conceptual "piece" if the base unit itself is a package.
  // If unitType is 'PCS', piecesInBaseUnit should ideally be 1 or undefined.
  const piecesInPrimaryUnit = product.piecesInBaseUnit && product.piecesInBaseUnit > 0 ? product.piecesInBaseUnit : 1;

  const basePricePerConceptualPiece = basePricePerBaseUnit / piecesInPrimaryUnit;
  const exciseTaxPerConceptualPiece = exciseTaxPerBaseUnit / piecesInPrimaryUnit;

  const subtotalBeforeVATPerPiece = basePricePerConceptualPiece + exciseTaxPerConceptualPiece;
  const vatRatePercent = companyProfile?.vatRate ? (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : Number(companyProfile.vatRate)) : 0;
  const vatAmountOnPcs = subtotalBeforeVATPerPiece * (vatRatePercent / 100);
  
  let finalPrice = subtotalBeforeVATPerPiece + vatAmountOnPcs;
  const discountRate = product.discountRate ? product.discountRate / 100 : 0;
  finalPrice = finalPrice * (1 - discountRate);
  return { price: finalPrice, unit: 'PCS' };
};

export const calculateFinalPkgPriceWithVatAndExcise = (product: Product, companyProfile: CompanyProfile | null | undefined): { price: number | null; unit: string } => {
  const basePricePerBaseUnit = typeof product.basePrice === 'number' && !isNaN(product.basePrice) ? product.basePrice : 0;
  const exciseTaxPerBaseUnit = typeof product.exciseTax === 'number' && !isNaN(product.exciseTax) ? product.exciseTax : 0;
  const vatRatePercent = companyProfile?.vatRate ? (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : Number(companyProfile.vatRate)) : 0;

  // Determine the target package and items for this calculation
  let itemsInTargetUnit = 1;
  let targetUnitDisplay = getDisplayUnit(product, 'base'); // Default to base unit (e.g., a 'Carton' if unitType is 'Cartons')

  // Scenario 1: There's an "Optional Larger Sales Package" defined
  if (product.packagingUnit && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
    itemsInTargetUnit = product.itemsPerPackagingUnit;
    targetUnitDisplay = getDisplayUnit(product, 'package'); // This will be the packagingUnit name
  }
  // Scenario 2: The Base Unit Type itself is a package (e.g., 'Cartons'), and no larger package is defined.
  // In this case, we want the price for one Base Unit Type.
  else if (product.unitType.toLowerCase() !== 'pcs' && (product.piecesInBaseUnit || 1) > 0) {
    // itemsInTargetUnit remains 1 (we are pricing one base unit)
    // targetUnitDisplay is already getDisplayUnit(product, 'base')
  }
  // Scenario 3: Base Unit Type is 'PCS' and no larger package defined. This column is not applicable.
  else if (product.unitType.toLowerCase() === 'pcs' && !product.packagingUnit) {
    return { price: null, unit: '-' };
  }
  // Fallback
  else {
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


type SortableProductKeys = keyof Pick<Product, 'id' | 'name' | 'sku' | 'category' | 'basePrice'> | 'stockLevel' | 'totalPieces';

interface SortConfig {
  key: SortableProductKeys | null;
  direction: 'ascending' | 'descending';
}


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

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');


  const filteredProducts = useMemo(() => {
    let _products = [...products];

    if (searchTerm) {
      _products = _products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
          product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter !== 'all') {
      _products = _products.filter(product => product.category === categoryFilter);
    }
    
    if (sortConfig.key) {
      _products.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'stockLevel') {
          aValue = getTotalStockForProduct(a.id);
          bValue = getTotalStockForProduct(b.id);
        } else if (sortConfig.key === 'totalPieces') {
            aValue = getTotalStockForProduct(a.id) * (a.piecesInBaseUnit || (a.unitType.toLowerCase() === 'pcs' ? 1 : 0));
            bValue = getTotalStockForProduct(b.id) * (b.piecesInBaseUnit || (b.unitType.toLowerCase() === 'pcs' ? 1 : 0));
        } else {
          aValue = a[sortConfig.key as keyof Product];
          bValue = b[sortConfig.key as keyof Product];
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue === undefined || aValue === null) aValue = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
        if (bValue === undefined || bValue === null) bValue = sortConfig.direction === 'ascending' ? Infinity : -Infinity;


        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return _products;
  }, [products, searchTerm, categoryFilter, sortConfig, getTotalStockForProduct]);

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
      piecesInBaseUnit: data.piecesInBaseUnit || (data.unitType.toLowerCase() === 'pcs' ? 1 : undefined),
      packagingUnit: data.packagingUnit && data.packagingUnit.trim() !== '' ? data.packagingUnit.trim() : undefined,
      itemsPerPackagingUnit: data.packagingUnit && data.packagingUnit.trim() !== '' && data.itemsPerPackagingUnit ? data.itemsPerPackagingUnit : undefined,
      globalReorderPoint: data.globalReorderPoint || 0,
      basePrice: data.basePrice, // This is now for the base unit
      costPrice: data.costPrice || 0, // From form
      exciseTax: data.exciseTaxAmount === undefined || data.exciseTaxAmount === null ? 0 : data.exciseTaxAmount, // This is also for the base unit
      batchNo: data.batchNo || undefined,
      productionDate: data.productionDate ? data.productionDate.toISOString() : undefined,
      expiryDate: data.expiryDate ? data.expiryDate.toISOString() : undefined,
      discountRate: data.discountRate === undefined || data.discountRate === null ? 0 : data.discountRate,
    };

    if (editingProduct) {
      const updatedProductData: Product = {
        ...editingProduct,
        ...productDataForStorage,
        stockLevel: editingProduct.stockLevel, // Preserve existing stockLevel if not managed by form
        reorderPoint: editingProduct.reorderPoint, // Preserve if not managed by form
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
        stockLevel: data.stockLevel, // Initial stock on creation
        reorderPoint: data.reorderPoint || 0, // Use globalReorderPoint alias
        createdAt: new Date().toISOString(),
      };
      addProduct(newProduct);
      toast({ title: "Product Defined", description: `${newProduct.name} definition created.` });
    }
    setIsFormModalOpen(false);
    setEditingProduct(null);
  }, [addProduct, updateProduct, products, toast, editingProduct]);

  const handleSort = useCallback((key: SortableProductKeys) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key && prevConfig.direction === 'ascending') {
        return { key, direction: 'descending' };
      }
      return { key, direction: 'ascending' };
    });
  }, []);

  const renderSortIcon = (columnKey: SortableProductKeys) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="ml-2 h-3 w-3" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-20 bg-background pt-4 pb-4 px-4 md:px-6 lg:px-8 border-b">
        <PageHeader
          title="Products"
          description="Manage your product catalog, definitions, pricing, and stock levels."
          actions={
            <Button onClick={handleAddProduct} className="w-full sm:w-auto" disabled={isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> Define New Product
            </Button>
          }
        />
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
          <SearchInput
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
            placeholder="Search by name, SKU, ID, category..."
            className="w-full sm:w-auto md:w-64"
          />
          <div className="relative w-full sm:w-auto md:w-[200px]">
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as ProductCategory | 'all')}
            >
              <SelectTrigger className="w-full pl-10">
                 <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {PRODUCT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-grow min-h-0 flex flex-col rounded-lg border shadow-sm bg-card mx-4 md:mx-6 lg:mx-8 mb-4 md:mb-6 lg:mb-8">
         <div className="h-full overflow-y-auto">
          {isLoading ? (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
                <TableRow>
                    <TableHead rowSpan={2} className="text-left min-w-[80px] px-2 align-middle text-sm">ID</TableHead>
                    <TableHead rowSpan={2} className="text-left min-w-[150px] px-2 align-middle text-sm">Name</TableHead>
                    <TableHead rowSpan={2} className="text-left min-w-[70px] px-2 align-middle text-[11px]">SKU</TableHead>
                    <TableHead rowSpan={2} className="text-left min-w-[100px] px-2 align-middle text-sm">Category</TableHead>
                    <TableHead colSpan={2} className="text-center align-middle text-sm px-2">Inventory Levels</TableHead>
                    <TableHead rowSpan={2} className="text-right min-w-[100px] px-2 align-middle text-sm">Base Price</TableHead>
                    <TableHead rowSpan={2} className="text-right min-w-[90px] px-2 align-middle text-sm">Excise Tax</TableHead>
                    <TableHead rowSpan={2} className="text-right min-w-[90px] px-2 align-middle text-sm">VAT ({companyProfile?.vatRate || 15}%)</TableHead>
                    <TableHead colSpan={2} className="text-center align-middle px-2 text-sm">
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
                  <TableRow key={`skel-prod-${i}`} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/50', "hover:bg-primary/10")}>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2 text-[11px]"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-center px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-center px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right px-2"><Skeleton className="h-5 w-full" /></TableCell>
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
                  <TableHead rowSpan={2} className="text-left min-w-[80px] px-2 align-middle text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('id')}>
                    <div className="flex items-center">ID {renderSortIcon('id')}</div>
                  </TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[150px] px-2 align-middle text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('name')}>
                     <div className="flex items-center">Name {renderSortIcon('name')}</div>
                  </TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[70px] px-2 align-middle text-[11px] cursor-pointer hover:bg-primary/80" onClick={() => handleSort('sku')}>
                    <div className="flex items-center">SKU {renderSortIcon('sku')}</div>
                  </TableHead>
                  <TableHead rowSpan={2} className="text-left min-w-[100px] px-2 align-middle text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('category')}>
                     <div className="flex items-center">Category {renderSortIcon('category')}</div>
                  </TableHead>
                  <TableHead colSpan={2} className="text-center align-middle text-sm px-2 cursor-pointer hover:bg-primary/80" onClick={() => handleSort('stockLevel')}>
                    <div className="flex items-center justify-center">Inventory Levels {renderSortIcon('stockLevel')}</div>
                  </TableHead>
                  <TableHead rowSpan={2} className="text-right min-w-[100px] px-2 align-middle text-sm cursor-pointer hover:bg-primary/80" onClick={() => handleSort('basePrice')}>
                     <div className="flex items-center justify-end">Base Price {renderSortIcon('basePrice')}</div>
                  </TableHead>
                  <TableHead rowSpan={2} className="text-right min-w-[90px] px-2 align-middle text-sm">Excise Tax</TableHead>
                  <TableHead rowSpan={2} className="text-right min-w-[90px] px-2 align-middle text-sm">VAT ({companyProfile?.vatRate || 15}%)</TableHead>
                  <TableHead colSpan={2} className="text-center align-bottom px-2 text-sm">
                     <div>Sale Price</div>
                     <div className="text-xs font-normal opacity-75">(Inc VAT &amp; Excise)</div>
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center min-w-[100px] px-2 align-middle text-sm">Actions</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-center text-xs font-normal opacity-75 px-2 min-w-[70px]">CTN</TableHead>
                  <TableHead className="text-center text-xs font-normal opacity-75 px-2 min-w-[70px] cursor-pointer hover:bg-primary/80" onClick={() => handleSort('totalPieces')}>PCS {renderSortIcon('totalPieces')}</TableHead>
                  <TableHead className="text-center text-xs font-normal opacity-75 px-2 min-w-[90px]">CTN</TableHead>
                  <TableHead className="text-center text-xs font-normal opacity-75 px-2 min-w-[90px]">PCS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => {
                    const totalStockBaseUnits = getTotalStockForProduct(product.id);
                    let ctnStockDisplay: string | number = "-";
                    if (product.unitType.toLowerCase() === 'cartons') {
                        ctnStockDisplay = totalStockBaseUnits.toFixed(0);
                    } else if (product.unitType.toLowerCase() === 'pcs' && product.packagingUnit?.toLowerCase().includes('carton') && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                        ctnStockDisplay = (totalStockBaseUnits / product.itemsPerPackagingUnit).toFixed((totalStockBaseUnits / product.itemsPerPackagingUnit) % 1 !== 0 ? 1 : 0);
                    } else if (product.packagingUnit?.toLowerCase().includes('carton') && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                        ctnStockDisplay = (totalStockBaseUnits / product.itemsPerPackagingUnit).toFixed((totalStockBaseUnits / product.itemsPerPackagingUnit) % 1 !== 0 ? 1 : 0);
                    }

                    let pcsStockDisplay: string | number = "-";
                    const totalPieces = totalStockBaseUnits * (product.piecesInBaseUnit || (product.unitType.toLowerCase() === 'pcs' ? 1 : 0));
                     if (totalPieces > 0) {
                        pcsStockDisplay = totalPieces.toFixed(0);
                    }


                    const basePriceInfo = getDisplayBasePriceInfo(product);
                    const exciseTaxInfo = getDisplayExciseTaxInfo(product);
                    const vatInfo = getDisplayVatInfo(product, companyProfile);
                    const finalPcsPriceInfo = calculateFinalPcsPriceWithVatAndExcise(product, companyProfile);
                    const finalPkgPriceInfo = calculateFinalPkgPriceWithVatAndExcise(product, companyProfile);
                  
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
                message={searchTerm || categoryFilter !== 'all' ? "Try adjusting your search or filter." : "Get started by defining your first product."}
                action={!searchTerm && categoryFilter === 'all' ? (
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
              {editingProduct ? `Update definition for ${editingProduct.name}. Stock is managed per warehouse.` : 'Enter product details. Stock is managed per warehouse via Stock Adjustments in the Inventory section.'}
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
                  {productToView.productionDate && <><div><strong>Prod. Date:</strong></div><div>{format(parseISO(productToView.productionDate), 'MM/dd/yyyy')}</div></>}
                  {productToView.expiryDate && <><div><strong>Exp. Date:</strong></div><div>{format(parseISO(productToView.expiryDate), 'MM/dd/yyyy')}</div></>}
                </div>
              </CardContent></Card>
              
              <Card><CardContent className="pt-4 grid grid-cols-1 gap-y-2">
                  <div className="grid grid-cols-2 gap-x-2">
                    <div><strong>Category:</strong></div>
                    <div><Badge variant={getCategoryBadgeVariant(productToView.category)} className="text-xs">{productToView.category}</Badge></div>
                  </div>
                  
                  <Separator className="my-1" />

                  <div><strong>Primary Stocking Unit (Base Unit):</strong> <Badge variant="outline" className="ml-1">{getDisplayUnit(productToView, 'base')}</Badge></div>
                  
                  {productToView.piecesInBaseUnit && productToView.piecesInBaseUnit > 0 && (
                    <div><strong>Individual Pieces in Base Unit:</strong> {productToView.piecesInBaseUnit} PCS</div>
                  )}
                  
                  {productToView.packagingUnit && productToView.itemsPerPackagingUnit && productToView.itemsPerPackagingUnit > 0 && (
                    <>
                      <Separator className="my-1" />
                      <div><strong>Also Sold As (Larger Package):</strong> <Badge variant="outline" className="ml-1">{getDisplayUnit(productToView, 'package')}</Badge></div>
                      <div><strong>Base Units in Larger Package:</strong> {productToView.itemsPerPackagingUnit} {getDisplayUnit(productToView, 'base')}</div>
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
                     const finalPkgPriceInfoValue = calculateFinalPkgPriceWithVatAndExcise(productToView, companyProfile);
                     
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

// Export helper functions so they can be used by other pages if needed (e.g., warehouse detail page)
// Already done in previous step
