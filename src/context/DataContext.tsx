
'use client';
import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Customer, Invoice, CompanyProfile, PaymentRecord, Product, Warehouse, ProductStockLocation } from '@/types';
import { MOCK_CUSTOMERS, MOCK_INVOICES, MOCK_COMPANY_PROFILE, MOCK_PRODUCTS, MOCK_WAREHOUSES, MOCK_PRODUCT_STOCK_LOCATIONS } from '@/types';

interface DataContextType {
  customers: Customer[];
  invoices: Invoice[];
  products: Product[];
  warehouses: Warehouse[];
  productStockLocations: ProductStockLocation[];
  companyProfile: CompanyProfile;
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
  // New Warehouse and Stock Location methods
  addWarehouse: (warehouse: Warehouse) => void;
  updateWarehouse: (warehouse: Warehouse) => void;
  deleteWarehouse: (warehouseId: string) => void;
  addProductStockLocation: (stockLocation: ProductStockLocation) => void;
  updateProductStockLocation: (stockLocation: ProductStockLocation) => void;
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
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(MOCK_COMPANY_PROFILE);
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
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.COMPANY_PROFILE, JSON.stringify(companyProfile)); }, [companyProfile, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); }, [products, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses)); }, [warehouses, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCT_STOCK_LOCATIONS, JSON.stringify(productStockLocations)); }, [productStockLocations, isLoading]);

  const addCustomer = useCallback((customer: Customer) => setCustomers(prev => [customer, ...prev]), []);
  const updateCustomer = useCallback((updatedCustomer: Customer) => setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)), []);
  const deleteCustomer = useCallback((customerId: string) => setCustomers(prev => prev.filter(c => c.id !== customerId)), []);
  
  const updateCompanyProfile = useCallback((profileUpdate: Partial<CompanyProfile>) => setCompanyProfile(prev => ({ ...prev, ...profileUpdate })), []);
  
  const addProduct = useCallback((product: Product) => setProducts(prev => [product, ...prev]), []);
  const updateProduct = useCallback((updatedProduct: Product) => setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)), []);
  const deleteProduct = useCallback((productId: string) => setProducts(prev => prev.filter(p => p.id !== productId)), []);

  const addWarehouse = useCallback((warehouse: Warehouse) => setWarehouses(prev => [warehouse, ...prev]), []);
  const updateWarehouse = useCallback((updatedWarehouse: Warehouse) => setWarehouses(prev => prev.map(wh => wh.id === updatedWarehouse.id ? updatedWarehouse : wh)), []);
  const deleteWarehouse = useCallback((warehouseId: string) => setWarehouses(prev => prev.filter(wh => wh.id !== warehouseId)), []);

  const addProductStockLocation = useCallback((psl: ProductStockLocation) => setProductStockLocations(prev => [psl, ...prev]), []);
  const updateProductStockLocation = useCallback((updatedPsl: ProductStockLocation) => setProductStockLocations(prev => prev.map(psl => psl.id === updatedPsl.id ? updatedPsl : psl)), []);
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

  const deductStockForInvoiceItem = (productId: string, quantityToDeductInBaseUnits: number, currentProductStockLocations: ProductStockLocation[]) => {
    let remainingQtyToDeduct = quantityToDeductInBaseUnits;
    const updatedPsl = [...currentProductStockLocations];
    
    // Simplified: Deduct from first available location for this product.
    // A real system would need to specify warehouse on invoice or use a strategy (e.g., FEFO, specific warehouse).
    const stockLocationIndex = updatedPsl.findIndex(psl => psl.productId === productId && psl.stockLevel > 0);

    if (stockLocationIndex !== -1) {
      const deductAmount = Math.min(updatedPsl[stockLocationIndex].stockLevel, remainingQtyToDeduct);
      updatedPsl[stockLocationIndex] = {
        ...updatedPsl[stockLocationIndex],
        stockLevel: updatedPsl[stockLocationIndex].stockLevel - deductAmount,
      };
      remainingQtyToDeduct -= deductAmount;
    }
    // If remainingQtyToDeduct > 0, it means not enough stock in the first found location.
    // For now, we don't handle splitting across multiple locations or insufficient stock errors here.
    return updatedPsl;
  };
  
  const returnStockForInvoiceItem = (productId: string, quantityToReturnInBaseUnits: number, currentProductStockLocations: ProductStockLocation[]) => {
    const updatedPsl = [...currentProductStockLocations];
     // Simplified: Add back to first available location for this product or create a new one if none.
    let stockLocationIndex = updatedPsl.findIndex(psl => psl.productId === productId);

    if (stockLocationIndex !== -1) {
        updatedPsl[stockLocationIndex] = {
            ...updatedPsl[stockLocationIndex],
            stockLevel: updatedPsl[stockLocationIndex].stockLevel + quantityToReturnInBaseUnits,
        };
    } else {
        // This case is less likely if stock was deducted, but as a fallback.
        // In a real system, you'd add to a primary/default warehouse.
        // For now, this won't create a new stock location if none exists to add back to.
        console.warn(`No stock location found to return stock for product ID: ${productId}`);
    }
    return updatedPsl;
  };


  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => [invoice, ...prev]);
    if (invoice.status !== 'Cancelled') {
      setProductStockLocations(currentPsls => {
        let tempPsls = [...currentPsls];
        invoice.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product && item.productId) {
            let quantityToDeductInBaseUnits = item.quantity;
            if (item.unitType === 'Cartons' && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) { // Assuming 'Cartons' matches product.packagingUnit if specified
                quantityToDeductInBaseUnits = item.quantity * product.itemsPerPackagingUnit;
            } else if (item.unitType === 'Cartons' && product.unitType === 'Cartons' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) { // If base unit is Cartons
                // Quantity is already in Cartons (base units)
            }
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
                     if (item.unitType === 'Cartons' && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                        quantityToReturnInBaseUnits = item.quantity * product.itemsPerPackagingUnit;
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
                     if (item.unitType === 'Cartons' && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                        quantityToDeductInBaseUnits = item.quantity * product.itemsPerPackagingUnit;
                    }
                    tempPsls = deductStockForInvoiceItem(item.productId, quantityToDeductInBaseUnits, tempPsls);
                }
            });
        }
        return tempPsls;
    });
    setInvoices((prev) => prev.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i)));
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
                     if (item.unitType === 'Cartons' && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                        quantityToReturnInBaseUnits = item.quantity * product.itemsPerPackagingUnit;
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
  const getOutstandingBalanceByCustomerId = useCallback((customerId: string) => invoices.filter(invoice => invoice.customerId === customerId && invoice.status !== 'Paid' && invoice.status !== 'Cancelled').reduce((sum, invoice) => sum + invoice.remainingBalance, 0), [invoices]);

  return (
    <DataContext.Provider
      value={{
        customers, invoices, products, warehouses, productStockLocations, companyProfile, isLoading,
        addCustomer, updateCustomer, deleteCustomer,
        addInvoice, updateInvoice, deleteInvoice,
        updateCompanyProfile,
        getInvoicesByCustomerId, getCustomerById, getInvoiceById, getOutstandingBalanceByCustomerId,
        addProduct, updateProduct, deleteProduct,
        addWarehouse, updateWarehouse, deleteWarehouse,
        addProductStockLocation, updateProductStockLocation, deleteProductStockLocation,
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

    