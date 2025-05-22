
'use client';
import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Customer, Invoice, CompanyProfile, PaymentRecord, Product, Warehouse, ProductStockLocation, ProductUnitType } from '@/types';
import { MOCK_CUSTOMERS, MOCK_INVOICES, MOCK_COMPANY_PROFILE, MOCK_PRODUCTS, MOCK_WAREHOUSES, MOCK_PRODUCT_STOCK_LOCATIONS } from '@/types';

interface DataContextType {
  customers: Customer[];
  invoices: Invoice[];
  products: Product[];
  warehouses: Warehouse[];
  productStockLocations: ProductStockLocation[];
  companyProfile: CompanyProfile | null; // Can be null initially
  isLoading: boolean;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (invoiceId: string) => void;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => void;
  getInvoicesByCustomerId: (customerId: string) => Invoice[];
  getCustomerById: (customerId: string) => Customer | undefined;
  getInvoiceById: (invoiceId: string) => Invoice | undefined;
  getOutstandingBalanceByCustomerId: (customerId: string) => number;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  getProductById: (productId: string) => Product | undefined; // Added
  addWarehouse: (warehouse: Warehouse) => void;
  updateWarehouse: (warehouse: Warehouse) => void;
  deleteWarehouse: (warehouseId: string) => void;
  getWarehouseById: (warehouseId: string) => Warehouse | undefined; // Added
  upsertProductStockLocation: (stockLocation: ProductStockLocation) => void;
  deleteProductStockLocation: (stockLocationId: string) => void;
  getTotalStockForProduct: (productId: string) => number;
  getStockForProductInWarehouse: (productId: string, warehouseId: string) => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  CUSTOMERS: 'invoiceflow_customers',
  INVOICES: 'invoiceflow_invoices',
  COMPANY_PROFILE: 'invoiceflow_company_profile',
  PRODUCTS: 'invoiceflow_products',
  WAREHOUSES: 'invoiceflow_warehouses',
  PRODUCT_STOCK_LOCATIONS: 'invoiceflow_product_stock_locations',
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [productStockLocations, setProductStockLocations] = useState<ProductStockLocation[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null); // Initialize as null
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedCustomers = localStorage.getItem(LOCAL_STORAGE_KEYS.CUSTOMERS);
      setCustomers(storedCustomers ? JSON.parse(storedCustomers) : MOCK_CUSTOMERS);

      const storedInvoices = localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICES);
      setInvoices(storedInvoices ? JSON.parse(storedInvoices) : MOCK_INVOICES);

      const storedProfile = localStorage.getItem(LOCAL_STORAGE_KEYS.COMPANY_PROFILE);
      setCompanyProfile(storedProfile ? JSON.parse(storedProfile) : MOCK_COMPANY_PROFILE);

      const storedProducts = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
      setProducts(storedProducts ? JSON.parse(storedProducts) : MOCK_PRODUCTS);

      const storedWarehouses = localStorage.getItem(LOCAL_STORAGE_KEYS.WAREHOUSES);
      setWarehouses(storedWarehouses ? JSON.parse(storedWarehouses) : MOCK_WAREHOUSES);

      const storedProductStockLocations = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCT_STOCK_LOCATIONS);
      setProductStockLocations(storedProductStockLocations ? JSON.parse(storedProductStockLocations) : MOCK_PRODUCT_STOCK_LOCATIONS);

    } catch (error) {
      console.error("DataContext: Failed to load data from localStorage, using mocks:", error);
      setCustomers(MOCK_CUSTOMERS);
      setInvoices(MOCK_INVOICES);
      setCompanyProfile(MOCK_COMPANY_PROFILE);
      setProducts(MOCK_PRODUCTS);
      setWarehouses(MOCK_WAREHOUSES);
      setProductStockLocations(MOCK_PRODUCT_STOCK_LOCATIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers)); }, [customers, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.INVOICES, JSON.stringify(invoices)); }, [invoices, isLoading]);
  useEffect(() => { if (!isLoading && companyProfile) localStorage.setItem(LOCAL_STORAGE_KEYS.COMPANY_PROFILE, JSON.stringify(companyProfile)); }, [companyProfile, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); }, [products, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses)); }, [warehouses, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCT_STOCK_LOCATIONS, JSON.stringify(productStockLocations)); }, [productStockLocations, isLoading]);

  const addCustomer = useCallback((customer: Customer) => setCustomers(prev => [customer, ...prev].sort((a,b) => a.name.localeCompare(b.name))), []);
  const updateCustomer = useCallback((updatedCustomer: Customer) => setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteCustomer = useCallback((customerId: string) => setCustomers(prev => prev.filter(c => c.id !== customerId)), []);

  const updateCompanyProfile = useCallback((profileUpdate: Partial<CompanyProfile>) => setCompanyProfile(prev => ({ ...(prev || MOCK_COMPANY_PROFILE), ...profileUpdate })), []);

  const addProduct = useCallback((product: Product) => setProducts(prev => [product, ...prev].sort((a,b) => a.name.localeCompare(b.name))), []);
  const updateProduct = useCallback((updatedProduct: Product) => setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteProduct = useCallback((productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setProductStockLocations(prevPsl => prevPsl.filter(psl => psl.productId !== productId));
  }, []);
  const getProductById = useCallback((productId: string) => products.find(product => product.id === productId), [products]);


  const addWarehouse = useCallback((warehouse: Warehouse) => {
    const newWarehouse = { ...warehouse, id: warehouse.id || `WH-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
    setWarehouses(prev => [newWarehouse, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
  }, []);
  const updateWarehouse = useCallback((updatedWarehouse: Warehouse) => setWarehouses(prev => prev.map(wh => wh.id === updatedWarehouse.id ? updatedWarehouse : wh).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteWarehouse = useCallback((warehouseId: string) => {
    setWarehouses(prev => prev.filter(wh => wh.id !== warehouseId));
    setProductStockLocations(prevPsl => prevPsl.filter(psl => psl.warehouseId !== warehouseId));
  }, []);
  const getWarehouseById = useCallback((warehouseId: string) => warehouses.find(wh => wh.id === warehouseId), [warehouses]);

  const upsertProductStockLocation = useCallback((stockLocation: ProductStockLocation) => {
    setProductStockLocations(prev => {
      const existingIndex = prev.findIndex(psl => psl.productId === stockLocation.productId && psl.warehouseId === stockLocation.warehouseId);
      if (existingIndex > -1) {
        const updatedPsl = [...prev];
        updatedPsl[existingIndex] = { ...updatedPsl[existingIndex], ...stockLocation, id: updatedPsl[existingIndex].id };
        return updatedPsl;
      } else {
        const newPsl = { ...stockLocation, id: stockLocation.id || `PSL-${Date.now()}-${Math.random().toString(36).substring(2,7)}`};
        return [newPsl, ...prev];
      }
    });
  }, []);

  const deleteProductStockLocation = useCallback((pslId: string) => setProductStockLocations(prev => prev.filter(psl => psl.id !== pslId)), []);

  const getTotalStockForProduct = useCallback((productId: string): number => {
    return productStockLocations
      .filter(psl => psl.productId === productId)
      .reduce((sum, psl) => sum + psl.stockLevel, 0);
  }, [productStockLocations]);

  const getStockForProductInWarehouse = useCallback((productId: string, warehouseId: string): number => {
    const stockLocation = productStockLocations.find(psl => psl.productId === productId && psl.warehouseId === warehouseId);
    return stockLocation ? stockLocation.stockLevel : 0;
  }, [productStockLocations]);

  const deductStockForInvoiceItem = (productId: string, quantityToDeductInBaseUnits: number, currentProductStockLocations: ProductStockLocation[]): ProductStockLocation[] => {
    let remainingQtyToDeduct = quantityToDeductInBaseUnits;
    const updatedPsl = [...currentProductStockLocations];

    // Simplified: Deduct from first available location for this product that has stock.
    // A real system needs to specify warehouse on invoice or use a strategy.
    const stockLocationIndex = updatedPsl.findIndex(psl => psl.productId === productId && psl.stockLevel > 0);

    if (stockLocationIndex !== -1) {
      const deductAmount = Math.min(updatedPsl[stockLocationIndex].stockLevel, remainingQtyToDeduct);
      updatedPsl[stockLocationIndex] = {
        ...updatedPsl[stockLocationIndex],
        stockLevel: updatedPsl[stockLocationIndex].stockLevel - deductAmount,
      };
      remainingQtyToDeduct -= deductAmount;
    }
    // If remainingQtyToDeduct > 0, it means not enough stock. This simplified logic doesn't handle splitting or errors.
    return updatedPsl;
  };

  const returnStockForInvoiceItem = (productId: string, quantityToReturnInBaseUnits: number, currentProductStockLocations: ProductStockLocation[]): ProductStockLocation[] => {
    const updatedPsl = [...currentProductStockLocations];
    let stockLocationIndex = updatedPsl.findIndex(psl => psl.productId === productId);

    if (stockLocationIndex !== -1) {
        updatedPsl[stockLocationIndex] = {
            ...updatedPsl[stockLocationIndex],
            stockLevel: updatedPsl[stockLocationIndex].stockLevel + quantityToReturnInBaseUnits,
        };
    } else {
        // This implies stock was deducted from a location that no longer exists or product wasn't stocked.
        // A robust system might try to add to a default warehouse or flag this.
        console.warn(`No stock location found to return stock for product ID: ${productId}. This might happen if warehouses were deleted or product was never stocked in an expected location.`);
    }
    return updatedPsl;
  };


  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => [invoice, ...prev].sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));
    if (invoice.status !== 'Cancelled') {
      setProductStockLocations(currentPsls => {
        let tempPsls = [...currentPsls];
        invoice.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product && item.productId) {
            let quantityToDeductInBaseUnits = item.quantity;
            // If item.unitType on invoice is Cartons AND product.unitType (base stock unit) is PCS AND product.packagingUnit is Carton
            if (item.unitType === 'Cartons' && product.unitType === 'PCS' && product.packagingUnit?.toLowerCase() === 'carton' && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                quantityToDeductInBaseUnits = item.quantity * product.itemsPerPackagingUnit;
            } else if (item.unitType === 'Cartons' && product.unitType === 'Cartons') {
                 // If selling cartons and base unit is cartons, quantity is already correct
                 quantityToDeductInBaseUnits = item.quantity;
            }
            // If item.unitType is 'PCS' and product.unitType is 'PCS', quantity is already correct.
            // If item.unitType is 'PCS' and product.unitType is 'Cartons' (e.g. selling loose pieces from a base unit carton) - this scenario needs careful definition
            // For now, assume if item.unitType is 'PCS', item.quantity refers to PCS. If product.unitType is 'Cartons', it implies 1 item.quantity PCS.
            // If product.unitType is 'Cartons', and item.unitType is 'PCS', this means we are selling 1/Nth of a carton.
            // This would require stockLevel in base units (Cartons) to be fractional, or a different stock deduction model.
            // The current model deduces product.unitType.
            // If item.unitType (invoice) is 'PCS' and product.unitType (stock) is 'Cartons',
            // This line should convert PCS sales to fractional Cartons if that's the stock unit
            // This means 1 PCS sold is 1/product.piecesInBaseUnit of a Carton deducted.
            // HOWEVER, the current `deductStockForInvoiceItem` expects quantityToDeductInBaseUnits to be in `product.unitType`.
            // So, if product.unitType is 'Cartons', and item.unitType is 'PCS', we need to be careful.
            // The current logic assumes: If product.unitType is Cartons, you sell in Cartons or fractions of Cartons.
            // If you sell PCS from a base unit of Carton, you'd need to define how many PCS are in that Base Unit Carton using piecesInBaseUnit.

            if (product.unitType === 'Cartons' && item.unitType === 'PCS' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
                 // Selling PCS, stock is in Cartons, where 1 Carton = product.piecesInBaseUnit PCS
                 quantityToDeductInBaseUnits = item.quantity / product.piecesInBaseUnit; // Deduct fraction of a carton
            } else if (product.unitType === 'PCS' && item.unitType === 'Cartons' && product.packagingUnit?.toLowerCase() === 'carton' && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                // Selling Cartons, stock is in PCS, where 1 Carton = product.itemsPerPackagingUnit PCS (this is from larger packaging)
                quantityToDeductInBaseUnits = item.quantity * product.itemsPerPackagingUnit;
            }
            // If item.unitType and product.unitType match (e.g., PCS & PCS, or Cartons & Cartons), item.quantity is already in base units.

            tempPsls = deductStockForInvoiceItem(item.productId, quantityToDeductInBaseUnits, tempPsls);
          }
        });
        return tempPsls;
      });
    }
  }, [products]);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    const originalInvoice = invoices.find(inv => inv.id === updatedInvoice.id);
    setProductStockLocations(currentPsls => {
        let tempPsls = [...currentPsls];
        if (originalInvoice && originalInvoice.status !== 'Cancelled') {
            originalInvoice.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                 if (product && item.productId) {
                    let quantityToReturnInBaseUnits = item.quantity;
                    if (item.unitType === 'Cartons' && product.unitType === 'PCS' && product.packagingUnit?.toLowerCase() === 'carton' && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                        quantityToReturnInBaseUnits = item.quantity * product.itemsPerPackagingUnit;
                    } else if (product.unitType === 'Cartons' && item.unitType === 'PCS' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
                        quantityToReturnInBaseUnits = item.quantity / product.piecesInBaseUnit;
                    }
                    tempPsls = returnStockForInvoiceItem(item.productId, quantityToReturnInBaseUnits, tempPsls);
                }
            });
        }
        if (updatedInvoice.status !== 'Cancelled') {
            updatedInvoice.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product && item.productId) {
                    let quantityToDeductInBaseUnits = item.quantity;
                     if (item.unitType === 'Cartons' && product.unitType === 'PCS' && product.packagingUnit?.toLowerCase() === 'carton' && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                        quantityToDeductInBaseUnits = item.quantity * product.itemsPerPackagingUnit;
                    } else if (product.unitType === 'Cartons' && item.unitType === 'PCS' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
                        quantityToDeductInBaseUnits = item.quantity / product.piecesInBaseUnit;
                    }
                    tempPsls = deductStockForInvoiceItem(item.productId, quantityToDeductInBaseUnits, tempPsls);
                }
            });
        }
        return tempPsls;
    });
    setInvoices((prev) => prev.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i)).sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));
  }, [invoices, products]);

  const deleteInvoice = useCallback((invoiceId: string) => {
    const invoiceToDelete = invoices.find(inv => inv.id === invoiceId);
    if (invoiceToDelete && invoiceToDelete.status !== 'Cancelled') {
        setProductStockLocations(currentPsls => {
            let tempPsls = [...currentPsls];
            invoiceToDelete.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product && item.productId) {
                    let quantityToReturnInBaseUnits = item.quantity;
                     if (item.unitType === 'Cartons' && product.unitType === 'PCS' && product.packagingUnit?.toLowerCase() === 'carton' && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                        quantityToReturnInBaseUnits = item.quantity * product.itemsPerPackagingUnit;
                    } else if (product.unitType === 'Cartons' && item.unitType === 'PCS' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
                         quantityToReturnInBaseUnits = item.quantity / product.piecesInBaseUnit;
                    }
                    tempPsls = returnStockForInvoiceItem(item.productId, quantityToReturnInBaseUnits, tempPsls);
                }
            });
            return tempPsls;
        });
    }
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
  }, [invoices, products]);

  const getInvoicesByCustomerId = useCallback((customerId: string) => invoices.filter(invoice => invoice.customerId === customerId), [invoices]);
  const getCustomerById = useCallback((customerId: string) => customers.find(customer => customer.id === customerId), [customers]);
  const getInvoiceById = useCallback((invoiceId: string) => invoices.find(invoice => invoice.id === invoiceId), [invoices]);
  const getOutstandingBalanceByCustomerId = useCallback((customerId: string) => {
    return invoices
      .filter(invoice => invoice.customerId === customerId && invoice.status !== 'Paid' && invoice.status !== 'Cancelled')
      .reduce((sum, invoice) => sum + invoice.remainingBalance, 0);
  }, [invoices]);

  return (
    <DataContext.Provider
      value={{
        customers, invoices, products, warehouses, productStockLocations, companyProfile, isLoading,
        addCustomer, updateCustomer, deleteCustomer,
        addInvoice, updateInvoice, deleteInvoice,
        updateCompanyProfile,
        getInvoicesByCustomerId, getCustomerById, getInvoiceById, getProductById, getWarehouseById, getOutstandingBalanceByCustomerId,
        addProduct, updateProduct, deleteProduct,
        addWarehouse, updateWarehouse, deleteWarehouse,
        upsertProductStockLocation, deleteProductStockLocation,
        getTotalStockForProduct, getStockForProductInWarehouse,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
