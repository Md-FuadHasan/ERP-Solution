
'use client';
import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Customer, Invoice, CompanyProfile, PaymentRecord, Product, Warehouse, ProductStockLocation, StockTransaction, StockTransactionType, StockAdjustmentReason } from '@/types';
import { MOCK_CUSTOMERS, MOCK_INVOICES, MOCK_COMPANY_PROFILE, MOCK_PRODUCTS, MOCK_WAREHOUSES, MOCK_PRODUCT_STOCK_LOCATIONS, MOCK_STOCK_TRANSACTIONS } from '@/types';

interface DataContextType {
  customers: Customer[];
  invoices: Invoice[];
  products: Product[];
  warehouses: Warehouse[];
  productStockLocations: ProductStockLocation[];
  stockTransactions: StockTransaction[];
  companyProfile: CompanyProfile | null;
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
  getProductById: (productId: string) => Product | undefined;
  addWarehouse: (warehouse: Warehouse) => void;
  updateWarehouse: (warehouse: Warehouse) => void;
  deleteWarehouse: (warehouseId: string) => void;
  getWarehouseById: (warehouseId: string) => Warehouse | undefined;
  upsertProductStockLocation: (
    stockLocation: Pick<ProductStockLocation, 'productId' | 'warehouseId' | 'stockLevel'>,
    reason: StockAdjustmentReason | StockTransactionType, // Reason for adjustment or type of transaction
    reference?: string // Optional reference for the transaction
  ) => void;
  deleteProductStockLocation: (stockLocationId: string) => void;
  getTotalStockForProduct: (productId: string) => number;
  getStockForProductInWarehouse: (productId: string, warehouseId: string) => number;
  addStockTransaction: (transaction: Omit<StockTransaction, 'id' | 'date' | 'productName' | 'warehouseName'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  CUSTOMERS: 'invoiceflow_customers',
  INVOICES: 'invoiceflow_invoices',
  COMPANY_PROFILE: 'invoiceflow_company_profile',
  PRODUCTS: 'invoiceflow_products',
  WAREHOUSES: 'invoiceflow_warehouses',
  PRODUCT_STOCK_LOCATIONS: 'invoiceflow_product_stock_locations',
  STOCK_TRANSACTIONS: 'invoiceflow_stock_transactions',
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [productStockLocations, setProductStockLocations] = useState<ProductStockLocation[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
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
      
      const storedStockTransactions = localStorage.getItem(LOCAL_STORAGE_KEYS.STOCK_TRANSACTIONS);
      setStockTransactions(storedStockTransactions ? JSON.parse(storedStockTransactions) : MOCK_STOCK_TRANSACTIONS);

    } catch (error) {
      console.error("DataContext: Failed to load data from localStorage, using mocks:", error);
      setCustomers(MOCK_CUSTOMERS);
      setInvoices(MOCK_INVOICES);
      setCompanyProfile(MOCK_COMPANY_PROFILE);
      setProducts(MOCK_PRODUCTS);
      setWarehouses(MOCK_WAREHOUSES);
      setProductStockLocations(MOCK_PRODUCT_STOCK_LOCATIONS);
      setStockTransactions(MOCK_STOCK_TRANSACTIONS);
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
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.STOCK_TRANSACTIONS, JSON.stringify(stockTransactions)); }, [stockTransactions, isLoading]);


  const addCustomer = useCallback((customer: Customer) => setCustomers(prev => [...prev, customer].sort((a,b) => a.name.localeCompare(b.name))), []);
  const updateCustomer = useCallback((updatedCustomer: Customer) => setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteCustomer = useCallback((customerId: string) => setCustomers(prev => prev.filter(c => c.id !== customerId)), []);

  const updateCompanyProfile = useCallback((profileUpdate: Partial<CompanyProfile>) => {
    setCompanyProfile(prev => ({ ...(prev || MOCK_COMPANY_PROFILE), ...profileUpdate }));
  }, []);

  const addProduct = useCallback((product: Product) => setProducts(prev => [...prev, product].sort((a,b) => a.name.localeCompare(b.name))), []);
  const updateProduct = useCallback((updatedProduct: Product) => setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteProduct = useCallback((productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setProductStockLocations(prevPsl => prevPsl.filter(psl => psl.productId !== productId));
  }, []);
  const getProductById = useCallback((productId: string) => products.find(product => product.id === productId), [products]);


  const addWarehouse = useCallback((warehouse: Warehouse) => {
    const newWarehouse = { ...warehouse, id: warehouse.id || `WH-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
    setWarehouses(prev => [...prev, newWarehouse].sort((a,b) => a.name.localeCompare(b.name)));
  }, []);
  const updateWarehouse = useCallback((updatedWarehouse: Warehouse) => setWarehouses(prev => prev.map(wh => wh.id === updatedWarehouse.id ? updatedWarehouse : wh).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteWarehouse = useCallback((warehouseId: string) => {
    setWarehouses(prev => prev.filter(wh => wh.id !== warehouseId));
    setProductStockLocations(prevPsl => prevPsl.filter(psl => psl.warehouseId !== warehouseId));
  }, []);
  const getWarehouseById = useCallback((warehouseId: string) => warehouses.find(wh => wh.id === warehouseId), [warehouses]);

  const addStockTransaction = useCallback((transactionData: Omit<StockTransaction, 'id' | 'date' | 'productName' | 'warehouseName'>) => {
    const product = getProductById(transactionData.productId);
    const warehouse = getWarehouseById(transactionData.warehouseId);

    const newTransaction: StockTransaction = {
      ...transactionData,
      id: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString(),
      productName: product?.name || transactionData.productId,
      warehouseName: warehouse?.name || transactionData.warehouseId,
    };
    setStockTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [getProductById, getWarehouseById]);


  const upsertProductStockLocation = useCallback((
    stockLocationUpdate: Pick<ProductStockLocation, 'productId' | 'warehouseId' | 'stockLevel'>,
    reason: StockAdjustmentReason | StockTransactionType,
    reference?: string
  ) => {
    setProductStockLocations(prev => {
      const { productId, warehouseId, stockLevel: newStockLevel } = stockLocationUpdate;
      const existingIndex = prev.findIndex(psl => psl.productId === productId && psl.warehouseId === warehouseId);
      let quantityChange = newStockLevel;
      let oldStockLevel = 0;

      if (existingIndex > -1) {
        oldStockLevel = prev[existingIndex].stockLevel;
        quantityChange = newStockLevel - oldStockLevel;
        const updatedPsl = [...prev];
        updatedPsl[existingIndex] = { ...updatedPsl[existingIndex], stockLevel: newStockLevel };
         addStockTransaction({
          productId,
          warehouseId,
          type: quantityChange > 0 ? 'Adjustment - Increase' : 'Adjustment - Decrease',
          quantityChange,
          newStockLevelAfterTransaction: newStockLevel,
          reason: reason as StockAdjustmentReason, // Assuming reason is passed for adjustments
          reference,
        });
        return updatedPsl;
      } else {
        const newPsl: ProductStockLocation = {
          id: `PSL-${productId}-${warehouseId}-${Date.now()}`,
          productId,
          warehouseId,
          stockLevel: newStockLevel,
        };
         addStockTransaction({
          productId,
          warehouseId,
          type: reason as StockTransactionType, // For initial entry, reason is the type
          quantityChange: newStockLevel, // For new entries, change is the full stock level
          newStockLevelAfterTransaction: newStockLevel,
          reason: reason as StockAdjustmentReason,
          reference,
        });
        return [...prev, newPsl];
      }
    });
  }, [addStockTransaction]);


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

  const deductStockForInvoiceItem = useCallback((
    productId: string, 
    warehouseId: string, // This is simplified; real system needs warehouse per line item
    quantityToDeductInBaseUnits: number, 
    currentProductStockLocations: ProductStockLocation[],
    invoiceId: string
  ): ProductStockLocation[] => {
    let remainingQtyToDeduct = quantityToDeductInBaseUnits;
    const updatedPsl = [...currentProductStockLocations];
    const stockLocationIndex = updatedPsl.findIndex(psl => psl.productId === productId && psl.warehouseId === warehouseId);

    if (stockLocationIndex !== -1) {
      const oldStockLevel = updatedPsl[stockLocationIndex].stockLevel;
      const newStockLevel = Math.max(0, oldStockLevel - remainingQtyToDeduct);
      const actualDeductedAmount = oldStockLevel - newStockLevel; 
      
      updatedPsl[stockLocationIndex] = {
        ...updatedPsl[stockLocationIndex],
        stockLevel: newStockLevel,
      };
      
      if (actualDeductedAmount > 0) {
          addStockTransaction({
            productId,
            warehouseId,
            type: 'Sale',
            quantityChange: -actualDeductedAmount,
            newStockLevelAfterTransaction: newStockLevel,
            reference: `Invoice ${invoiceId}`,
          });
      }
      remainingQtyToDeduct -= actualDeductedAmount;
    } else {
      // Product not found in the specified warehouse, or no stock. Log this or handle as error.
      console.warn(`Stock deduction: Product ${productId} not found or no stock in warehouse ${warehouseId}. Invoice ${invoiceId}`);
      // For now, we are not creating a negative stock transaction if no location exists.
    }
    return updatedPsl;
  }, [addStockTransaction]);

  const returnStockForInvoiceItem = useCallback((
    productId: string, 
    warehouseId: string, // Simplified
    quantityToReturnInBaseUnits: number, 
    currentProductStockLocations: ProductStockLocation[],
    invoiceId: string
  ): ProductStockLocation[] => {
    const updatedPsl = [...currentProductStockLocations];
    let stockLocationIndex = updatedPsl.findIndex(psl => psl.productId === productId && psl.warehouseId === warehouseId);

    if (stockLocationIndex !== -1) {
        const oldStockLevel = updatedPsl[stockLocationIndex].stockLevel;
        const newStockLevel = oldStockLevel + quantityToReturnInBaseUnits;
        updatedPsl[stockLocationIndex] = {
            ...updatedPsl[stockLocationIndex],
            stockLevel: newStockLevel,
        };
        addStockTransaction({
            productId,
            warehouseId,
            type: 'Sale Return',
            quantityChange: quantityToReturnInBaseUnits,
            newStockLevelAfterTransaction: newStockLevel,
            reference: `Invoice ${invoiceId} (Return/Cancel)`,
          });

    } else {
      // If stock location doesn't exist, we might create one with the returned stock or log an error.
      // For simplicity, let's assume returns only happen to locations that previously had stock.
      // Or, if creating a new location for returns is desired:
      const newPsl: ProductStockLocation = {
        id: `PSL-${productId}-${warehouseId}-${Date.now()}`,
        productId,
        warehouseId,
        stockLevel: quantityToReturnInBaseUnits,
      };
      updatedPsl.push(newPsl);
      addStockTransaction({
        productId,
        warehouseId,
        type: 'Sale Return', // Or 'Initial Stock' if viewed as new entry to this WH
        quantityChange: quantityToReturnInBaseUnits,
        newStockLevelAfterTransaction: quantityToReturnInBaseUnits,
        reference: `Invoice ${invoiceId} (Return to new loc)`,
      });
      console.warn(`Stock return: Product ${productId} had no prior stock in warehouse ${warehouseId}. Created new stock location. Invoice ${invoiceId}`);
    }
    return updatedPsl;
  }, [addStockTransaction]);


  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => [...prev, invoice].sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));
    if (invoice.status !== 'Cancelled') {
      setProductStockLocations(currentPsls => {
        let tempPsls = [...currentPsls];
        invoice.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product && item.productId) {
            let quantityToDeductInBaseUnits = item.quantity;
            if (item.unitType === 'Cartons') { // Item sold in cartons
                if (product.unitType === 'PCS' && product.packagingUnit?.toLowerCase() === 'carton' && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                     // Product base is PCS, sold in cartons
                    quantityToDeductInBaseUnits = item.quantity * product.itemsPerPackagingUnit;
                } else if (product.unitType === 'Cartons') {
                    // Product base is Cartons, sold in cartons
                    quantityToDeductInBaseUnits = item.quantity;
                } else {
                    // Mismatch or unhandled scenario
                    console.warn(`Stock deduction mismatch for product ${product.id} on invoice ${invoice.id}`);
                    return;
                }
            } else { // Item sold in PCS
                 if (product.unitType === 'PCS') {
                     // Product base is PCS, sold in PCS
                    quantityToDeductInBaseUnits = item.quantity;
                 } else if (product.unitType === 'Cartons' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
                    // Product base is Cartons, sold in PCS
                    quantityToDeductInBaseUnits = item.quantity / product.piecesInBaseUnit;
                    if (!Number.isInteger(quantityToDeductInBaseUnits)) {
                        console.warn(`Stock deduction: fractional base unit cartons calculated for ${product.id} on invoice ${invoice.id}`);
                        // Handle fractional deduction if necessary or round
                        quantityToDeductInBaseUnits = Math.ceil(quantityToDeductInBaseUnits); // Example: always deduct full base unit
                    }
                 } else {
                    console.warn(`Stock deduction mismatch for product ${product.id} on invoice ${invoice.id}`);
                    return;
                 }
            }
            // Simplified: Deduct from first warehouse. A real system needs warehouse ID per line item.
            const firstWarehouseWithStock = tempPsls.find(psl => psl.productId === item.productId && psl.stockLevel > 0)?.warehouseId || warehouses[0]?.id;
            if (firstWarehouseWithStock) {
              tempPsls = deductStockForInvoiceItem(item.productId, firstWarehouseWithStock, quantityToDeductInBaseUnits, tempPsls, invoice.id);
            } else {
              console.warn(`No warehouse found to deduct stock for product ${item.productId} on invoice ${invoice.id}`);
            }
          }
        });
        return tempPsls;
      });
    }
  }, [products, warehouses, deductStockForInvoiceItem]);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    const originalInvoice = invoices.find(inv => inv.id === updatedInvoice.id);
    setProductStockLocations(currentPsls => {
        let tempPsls = [...currentPsls];
        // Return stock from original invoice items if it existed and wasn't cancelled
        if (originalInvoice && originalInvoice.status !== 'Cancelled') {
            originalInvoice.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                 if (product && item.productId) {
                    let quantityToReturnInBaseUnits = item.quantity;
                     if (item.unitType === 'Cartons') {
                        if (product.unitType === 'PCS' && product.packagingUnit?.toLowerCase() === 'carton' && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                            quantityToReturnInBaseUnits = item.quantity * product.itemsPerPackagingUnit;
                        } else if (product.unitType === 'Cartons') {
                            quantityToReturnInBaseUnits = item.quantity;
                        }
                    } else { // Item sold in PCS
                        if (product.unitType === 'PCS') {
                            quantityToReturnInBaseUnits = item.quantity;
                        } else if (product.unitType === 'Cartons' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
                            quantityToReturnInBaseUnits = item.quantity / product.piecesInBaseUnit;
                        }
                    }
                    const firstWarehouseWithStock = tempPsls.find(psl => psl.productId === item.productId)?.warehouseId || warehouses[0]?.id;
                    if (firstWarehouseWithStock) {
                      tempPsls = returnStockForInvoiceItem(item.productId, firstWarehouseWithStock, quantityToReturnInBaseUnits, tempPsls, updatedInvoice.id);
                    }
                }
            });
        }
        // Deduct stock for new/updated invoice items if not cancelled
        if (updatedInvoice.status !== 'Cancelled') {
            updatedInvoice.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product && item.productId) {
                    let quantityToDeductInBaseUnits = item.quantity;
                     if (item.unitType === 'Cartons') {
                        if (product.unitType === 'PCS' && product.packagingUnit?.toLowerCase() === 'carton' && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                            quantityToDeductInBaseUnits = item.quantity * product.itemsPerPackagingUnit;
                        } else if (product.unitType === 'Cartons') {
                            quantityToDeductInBaseUnits = item.quantity;
                        }
                    } else { // Item sold in PCS
                        if (product.unitType === 'PCS') {
                           quantityToDeductInBaseUnits = item.quantity;
                        } else if (product.unitType === 'Cartons' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
                            quantityToDeductInBaseUnits = item.quantity / product.piecesInBaseUnit;
                        }
                    }
                    const firstWarehouseWithStock = tempPsls.find(psl => psl.productId === item.productId && psl.stockLevel > 0)?.warehouseId || warehouses[0]?.id;
                     if (firstWarehouseWithStock) {
                        tempPsls = deductStockForInvoiceItem(item.productId, firstWarehouseWithStock, quantityToDeductInBaseUnits, tempPsls, updatedInvoice.id);
                     } else {
                         console.warn(`No warehouse found to deduct stock for product ${item.productId} on updated invoice ${updatedInvoice.id}`);
                     }
                }
            });
        }
        return tempPsls;
    });
    setInvoices((prev) => prev.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i)).sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));
  }, [invoices, products, warehouses, deductStockForInvoiceItem, returnStockForInvoiceItem]);

  const deleteInvoice = useCallback((invoiceId: string) => {
    const invoiceToDelete = invoices.find(inv => inv.id === invoiceId);
    if (invoiceToDelete && invoiceToDelete.status !== 'Cancelled') {
        setProductStockLocations(currentPsls => {
            let tempPsls = [...currentPsls];
            invoiceToDelete.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product && item.productId) {
                    let quantityToReturnInBaseUnits = item.quantity;
                     if (item.unitType === 'Cartons') {
                        if (product.unitType === 'PCS' && product.packagingUnit?.toLowerCase() === 'carton' && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                            quantityToReturnInBaseUnits = item.quantity * product.itemsPerPackagingUnit;
                        } else if (product.unitType === 'Cartons') {
                             quantityToReturnInBaseUnits = item.quantity;
                        }
                    } else { // Item sold in PCS
                        if (product.unitType === 'PCS') {
                            quantityToReturnInBaseUnits = item.quantity;
                        } else if (product.unitType === 'Cartons' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
                             quantityToReturnInBaseUnits = item.quantity / product.piecesInBaseUnit;
                        }
                    }
                    const firstWarehouseWithStock = tempPsls.find(psl => psl.productId === item.productId)?.warehouseId || warehouses[0]?.id;
                     if (firstWarehouseWithStock) {
                        tempPsls = returnStockForInvoiceItem(item.productId, firstWarehouseWithStock, quantityToReturnInBaseUnits, tempPsls, invoiceToDelete.id);
                     }
                }
            });
            return tempPsls;
        });
    }
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
  }, [invoices, products, warehouses, returnStockForInvoiceItem]);

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
        customers, invoices, products, warehouses, productStockLocations, stockTransactions, companyProfile, isLoading,
        addCustomer, updateCustomer, deleteCustomer,
        addInvoice, updateInvoice, deleteInvoice,
        updateCompanyProfile,
        getInvoicesByCustomerId, getCustomerById, getInvoiceById, getProductById, getWarehouseById, getOutstandingBalanceByCustomerId,
        addProduct, updateProduct, deleteProduct,
        addWarehouse, updateWarehouse, deleteWarehouse,
        upsertProductStockLocation, deleteProductStockLocation, addStockTransaction,
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

    