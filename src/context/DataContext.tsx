
'use client';
import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Customer,
  Invoice,
  CompanyProfile,
  Product,
  Warehouse,
  ProductStockLocation,
  StockTransaction,
  StockTransactionType,
  StockAdjustmentReason,
  Supplier,
  PurchaseOrder
} from '@/types';
import {
  MOCK_CUSTOMERS,
  MOCK_INVOICES,
  MOCK_COMPANY_PROFILE,
  MOCK_PRODUCTS,
  MOCK_WAREHOUSES,
  MOCK_PRODUCT_STOCK_LOCATIONS,
  MOCK_STOCK_TRANSACTIONS,
  MOCK_SUPPLIERS,
  MOCK_PURCHASE_ORDERS
} from '@/types';

interface DataContextType {
  customers: Customer[];
  invoices: Invoice[];
  products: Product[];
  warehouses: Warehouse[];
  productStockLocations: ProductStockLocation[];
  stockTransactions: StockTransaction[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
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
  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => void;
  updateWarehouse: (warehouse: Warehouse) => void;
  deleteWarehouse: (warehouseId: string) => void;
  getWarehouseById: (warehouseId: string) => Warehouse | undefined;
  upsertProductStockLocation: (
    stockLocation: Pick<ProductStockLocation, 'productId' | 'warehouseId' | 'stockLevel'>,
    reason: StockAdjustmentReason | StockTransactionType,
    reference?: string
  ) => void;
  deleteProductStockLocation: (stockLocationId: string) => void;
  getTotalStockForProduct: (productId: string) => number;
  getStockForProductInWarehouse: (productId: string, warehouseId: string) => number;
  addStockTransaction: (transaction: Omit<StockTransaction, 'id' | 'date' | 'productName' | 'warehouseName'>) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  getSupplierById: (supplierId: string) => Supplier | undefined;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status' | 'subtotal' | 'totalAmount'>) => void;
  updatePurchaseOrder: (po: PurchaseOrder) => void;
  // getPurchaseOrderById: (poId: string) => PurchaseOrder | undefined; // Placeholder for later
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
  SUPPLIERS: 'invoiceflow_suppliers',
  PURCHASE_ORDERS: 'invoiceflow_purchase_orders',
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [productStockLocations, setProductStockLocations] = useState<ProductStockLocation[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
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

      const storedSuppliers = localStorage.getItem(LOCAL_STORAGE_KEYS.SUPPLIERS);
      setSuppliers(storedSuppliers ? JSON.parse(storedSuppliers) : MOCK_SUPPLIERS);

      const storedPurchaseOrders = localStorage.getItem(LOCAL_STORAGE_KEYS.PURCHASE_ORDERS);
      setPurchaseOrders(storedPurchaseOrders ? JSON.parse(storedPurchaseOrders) : MOCK_PURCHASE_ORDERS);

    } catch (error) {
      console.error("DataContext: Failed to load data from localStorage, using mocks:", error);
      setCustomers(MOCK_CUSTOMERS);
      setInvoices(MOCK_INVOICES);
      setCompanyProfile(MOCK_COMPANY_PROFILE);
      setProducts(MOCK_PRODUCTS);
      setWarehouses(MOCK_WAREHOUSES);
      setProductStockLocations(MOCK_PRODUCT_STOCK_LOCATIONS);
      setStockTransactions(MOCK_STOCK_TRANSACTIONS);
      setSuppliers(MOCK_SUPPLIERS);
      setPurchaseOrders(MOCK_PURCHASE_ORDERS);
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
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers)); }, [suppliers, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(purchaseOrders)); }, [purchaseOrders, isLoading]);


  const addCustomer = useCallback((customer: Customer) => setCustomers(prev => [...prev, customer].sort((a,b) => a.name.localeCompare(b.name))), []);
  const updateCustomer = useCallback((updatedCustomer: Customer) => setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteCustomer = useCallback((customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
  }, []);

  const updateCompanyProfile = useCallback((profileUpdate: Partial<CompanyProfile>) => {
    setCompanyProfile(prev => ({ ...(prev || MOCK_COMPANY_PROFILE), ...profileUpdate }));
  }, []);

  const addProduct = useCallback((product: Product) => setProducts(prev => [...prev, product].sort((a,b) => a.name.localeCompare(b.name))), []);
  const updateProduct = useCallback((updatedProduct: Product) => setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteProduct = useCallback((productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setProductStockLocations(prevPsl => prevPsl.filter(psl => psl.productId !== productId));
    setStockTransactions(prevTxn => prevTxn.filter(txn => txn.productId !== productId));
  }, []);
  const getProductById = useCallback((productId: string) => products.find(product => product.id === productId), [products]);

  const addWarehouse = useCallback((warehouseData: Omit<Warehouse, 'id'>) => {
    const newWarehouse: Warehouse = { ...warehouseData, id: `WH-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
    setWarehouses(prev => [...prev, newWarehouse].sort((a,b) => a.name.localeCompare(b.name)));
  }, []);
  const updateWarehouse = useCallback((updatedWarehouse: Warehouse) => setWarehouses(prev => prev.map(wh => wh.id === updatedWarehouse.id ? updatedWarehouse : wh).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteWarehouse = useCallback((warehouseId: string) => {
    setWarehouses(prev => prev.filter(wh => wh.id !== warehouseId));
    setProductStockLocations(prevPsl => prevPsl.filter(psl => psl.warehouseId !== warehouseId));
    setStockTransactions(prevTxn => prevTxn.filter(txn => txn.warehouseId !== warehouseId));
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
      let transactionType: StockTransactionType = 'Adjustment - Increase'; // Default, will be refined

      if (existingIndex > -1) {
        oldStockLevel = prev[existingIndex].stockLevel;
        quantityChange = newStockLevel - oldStockLevel;
        const updatedPsl = [...prev];
        updatedPsl[existingIndex] = { ...updatedPsl[existingIndex], stockLevel: newStockLevel };
        
        if (reason.startsWith('Transfer')) {
          transactionType = reason as StockTransactionType;
        } else {
          transactionType = quantityChange >= 0 ? 'Adjustment - Increase' : 'Adjustment - Decrease';
        }
        
         addStockTransaction({
          productId,
          warehouseId,
          type: transactionType,
          quantityChange,
          newStockLevelAfterTransaction: newStockLevel,
          reason: reason as StockAdjustmentReason,
          reference,
        });
        return updatedPsl.sort((a,b) => (a.productId + a.warehouseId).localeCompare(b.productId + b.warehouseId));
      } else { // New stock location
        const newPsl: ProductStockLocation = {
          id: `PSL-${productId}-${warehouseId}-${Date.now()}`,
          productId,
          warehouseId,
          stockLevel: newStockLevel,
        };
        transactionType = 'Initial Stock Entry'; // Or use reason if appropriate for new entries
         addStockTransaction({
          productId,
          warehouseId,
          type: transactionType,
          quantityChange: newStockLevel,
          newStockLevelAfterTransaction: newStockLevel,
          reason: reason as StockAdjustmentReason,
          reference,
        });
        return [...prev, newPsl].sort((a,b) => (a.productId + a.warehouseId).localeCompare(b.productId + b.warehouseId));
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
    warehouseId: string, // Which warehouse to deduct from - IMPORTANT
    quantityToDeductInBaseUnits: number,
    invoiceId: string
  ) => {
    setProductStockLocations(prevPsl => {
        const updatedPsl = [...prevPsl];
        const stockLocationIndex = updatedPsl.findIndex(psl => psl.productId === productId && psl.warehouseId === warehouseId);

        if (stockLocationIndex !== -1) {
            const oldStockLevel = updatedPsl[stockLocationIndex].stockLevel;
            if (oldStockLevel < quantityToDeductInBaseUnits) {
                console.warn(`Stock deduction warning for Invoice ${invoiceId}: Insufficient stock for product ${productId} in warehouse ${warehouseId}. Available: ${oldStockLevel}, Required: ${quantityToDeductInBaseUnits}. Deducting available stock.`);
                quantityToDeductInBaseUnits = oldStockLevel; // Deduct only what's available
            }
            const newStockLevel = oldStockLevel - quantityToDeductInBaseUnits;
            
            updatedPsl[stockLocationIndex] = {
                ...updatedPsl[stockLocationIndex],
                stockLevel: newStockLevel,
            };

            if (quantityToDeductInBaseUnits > 0) { // Only log if actual deduction happened
                addStockTransaction({
                    productId,
                    warehouseId,
                    type: 'Sale',
                    quantityChange: -quantityToDeductInBaseUnits,
                    newStockLevelAfterTransaction: newStockLevel,
                    reference: `Invoice ${invoiceId}`,
                });
            }
            return updatedPsl.sort((a,b) => (a.productId + a.warehouseId).localeCompare(b.productId + b.warehouseId));
        } else {
            console.warn(`Stock deduction error for Invoice ${invoiceId}: Product ${productId} not found in warehouse ${warehouseId}. Stock not deducted.`);
            return prevPsl; // No change if product not found in warehouse
        }
    });
  }, [addStockTransaction]);

  const returnStockForInvoiceItem = useCallback((
    productId: string,
    warehouseId: string, // Which warehouse to return to
    quantityToReturnInBaseUnits: number,
    invoiceId: string
  ) => {
    setProductStockLocations(prevPsl => {
        let updatedPsl = [...prevPsl];
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
            // If product wasn't in warehouse, create new stock location (e.g. return to a different WH)
            const newPslRecord: ProductStockLocation = {
                id: `PSL-${productId}-${warehouseId}-${Date.now()}`,
                productId,
                warehouseId,
                stockLevel: quantityToReturnInBaseUnits,
            };
            updatedPsl.push(newPslRecord);
            addStockTransaction({
                productId,
                warehouseId,
                type: 'Sale Return',
                quantityChange: quantityToReturnInBaseUnits,
                newStockLevelAfterTransaction: quantityToReturnInBaseUnits,
                reference: `Invoice ${invoiceId} (Return to new loc)`,
            });
        }
        return updatedPsl.sort((a,b) => (a.productId + a.warehouseId).localeCompare(b.productId + b.warehouseId));
    });
  }, [addStockTransaction]);


  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => [...prev, invoice].sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));
    if (invoice.status !== 'Cancelled') {
      invoice.items.forEach(item => {
        const productDetails = getProductById(item.productId || '');
        if (productDetails && item.productId) {
          let quantityToDeductInBaseUnits = item.quantity;
          if (item.unitType === 'Cartons') {
            if (productDetails.unitType.toLowerCase() === 'pcs' && productDetails.packagingUnit?.toLowerCase().includes('carton') && productDetails.itemsPerPackagingUnit) {
              quantityToDeductInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
            } else if (productDetails.unitType.toLowerCase().includes('carton')) {
              quantityToDeductInBaseUnits = item.quantity; // Item sold as base unit which is carton
            } else if (productDetails.packagingUnit && productDetails.itemsPerPackagingUnit && productDetails.packagingUnit.toLowerCase() === item.unitType.toLowerCase()) {
                quantityToDeductInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit; // Item sold as optional larger package
            }
          } else { // Item sold in PCS
            if (productDetails.unitType.toLowerCase() === 'pcs') {
              quantityToDeductInBaseUnits = item.quantity;
            } else if (productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0) { // Base unit is a package, selling individual piece from it
              quantityToDeductInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
              if (!Number.isInteger(quantityToDeductInBaseUnits)) {
                console.warn(`Stock deduction: fractional base units for ${productDetails.id} (selling PCS from package). This should ideally be handled by item definition.`);
                // For now, we'll assume such sales aren't allowed or unitType on item would match product.unitType
                return; 
              }
            } else { // Base unit is not PCS and no piecesInBaseUnit defined, cannot sell as PCS
                 console.warn(`Stock deduction: Cannot sell product ${productDetails.id} as PCS. Its base unit is ${productDetails.unitType}.`);
                 return;
            }
          }
          // TODO: Implement logic to select source warehouse for deduction. For now, uses first available.
          const pslToDeductFrom = productStockLocations.find(psl => psl.productId === item.productId && psl.stockLevel >= quantityToDeductInBaseUnits)
                                  || productStockLocations.find(psl => psl.productId === item.productId && psl.stockLevel > 0);
          const sourceWarehouseId = pslToDeductFrom?.warehouseId || (warehouses.length > 0 ? warehouses[0].id : undefined);
          
          if (sourceWarehouseId && quantityToDeductInBaseUnits > 0) {
            deductStockForInvoiceItem(item.productId, sourceWarehouseId, quantityToDeductInBaseUnits, invoice.id);
          } else if (!sourceWarehouseId) {
            console.warn(`No warehouse found to deduct stock for product ${item.productId} on invoice ${invoice.id}`);
          }
        }
      });
    }
  }, [getProductById, warehouses, productStockLocations, deductStockForInvoiceItem]);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    const originalInvoice = invoices.find(inv => inv.id === updatedInvoice.id);

    // Return stock from original invoice items if it wasn't cancelled
    if (originalInvoice && originalInvoice.status !== 'Cancelled') {
      originalInvoice.items.forEach(item => {
        const productDetails = getProductById(item.productId || '');
        if (productDetails && item.productId) {
          let quantityToReturnInBaseUnits = item.quantity;
          // Add conversion logic similar to addInvoice if unitType differs
           if (item.unitType === 'Cartons') { /* ... conversion logic ... */ }
           else { /* ... conversion logic ... */ } // Simplified for brevity
          const sourceWarehouseId = productStockLocations.find(psl => psl.productId === item.productId)?.warehouseId || (warehouses.length > 0 ? warehouses[0].id : undefined); // Simplified warehouse selection
          if (sourceWarehouseId && quantityToReturnInBaseUnits > 0) {
            returnStockForInvoiceItem(item.productId, sourceWarehouseId, quantityToReturnInBaseUnits, updatedInvoice.id);
          }
        }
      });
    }

    // Deduct stock for new/updated invoice items if not cancelled
    if (updatedInvoice.status !== 'Cancelled') {
      updatedInvoice.items.forEach(item => {
        const productDetails = getProductById(item.productId || '');
         if (productDetails && item.productId) {
           let quantityToDeductInBaseUnits = item.quantity;
           // Add conversion logic similar to addInvoice
            if (item.unitType === 'Cartons') { /* ... conversion logic ... */ }
            else { /* ... conversion logic ... */ } // Simplified for brevity
           const sourceWarehouseId = productStockLocations.find(psl => psl.productId === item.productId && psl.stockLevel >= quantityToDeductInBaseUnits)?.warehouseId || productStockLocations.find(psl => psl.productId === item.productId && psl.stockLevel > 0)?.warehouseId || (warehouses.length > 0 ? warehouses[0].id : undefined); // Simplified warehouse selection
           if (sourceWarehouseId && quantityToDeductInBaseUnits > 0) {
             deductStockForInvoiceItem(item.productId, sourceWarehouseId, quantityToDeductInBaseUnits, updatedInvoice.id);
           }
         }
      });
    }
    setInvoices((prev) => prev.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i)).sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));
  }, [invoices, getProductById, warehouses, productStockLocations, deductStockForInvoiceItem, returnStockForInvoiceItem]);

  const deleteInvoice = useCallback((invoiceId: string) => {
    const invoiceToDelete = invoices.find(inv => inv.id === invoiceId);
    if (invoiceToDelete && invoiceToDelete.status !== 'Cancelled') {
        invoiceToDelete.items.forEach(item => {
            const productDetails = getProductById(item.productId || '');
            if (productDetails && item.productId) {
                let quantityToReturnInBaseUnits = item.quantity;
                // Add conversion logic similar to addInvoice
                if (item.unitType === 'Cartons') { /* ... conversion logic ... */ }
                else { /* ... conversion logic ... */ } // Simplified for brevity
                const sourceWarehouseId = productStockLocations.find(psl => psl.productId === item.productId)?.warehouseId || (warehouses.length > 0 ? warehouses[0].id : undefined); // Simplified warehouse selection
                 if (sourceWarehouseId && quantityToReturnInBaseUnits > 0) {
                    returnStockForInvoiceItem(item.productId, sourceWarehouseId, quantityToReturnInBaseUnits, invoiceToDelete.id);
                 }
            }
        });
    }
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
  }, [invoices, getProductById, warehouses, productStockLocations, returnStockForInvoiceItem]);

  const getInvoicesByCustomerId = useCallback((customerId: string) => invoices.filter(invoice => invoice.customerId === customerId), [invoices]);
  const getCustomerById = useCallback((customerId: string) => customers.find(customer => customer.id === customerId), [customers]);
  const getInvoiceById = useCallback((invoiceId: string) => invoices.find(invoice => invoice.id === invoiceId), [invoices]);
  const getOutstandingBalanceByCustomerId = useCallback((customerId: string) => {
    return invoices
      .filter(invoice => invoice.customerId === customerId && invoice.status !== 'Paid' && invoice.status !== 'Cancelled')
      .reduce((sum, invoice) => sum + invoice.remainingBalance, 0);
  }, [invoices]);

  // Supplier and Purchase Order Functions
  const addSupplier = useCallback((supplierData: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newSupplier: Supplier = { ...supplierData, id: `SUPP-${Date.now()}-${Math.random().toString(36).substring(2,7)}`, createdAt: new Date().toISOString() };
    setSuppliers(prev => [...prev, newSupplier].sort((a,b) => a.name.localeCompare(b.name)));
  }, []);
  const updateSupplier = useCallback((updatedSupplier: Supplier) => setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteSupplier = useCallback((supplierId: string) => setSuppliers(prev => prev.filter(s => s.id !== supplierId)), []);
  const getSupplierById = useCallback((supplierId: string) => suppliers.find(s => s.id === supplierId), [suppliers]);

  const addPurchaseOrder = useCallback((poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status' | 'subtotal' | 'totalAmount'>) => {
     const subtotal = poData.items.reduce((sum, item) => sum + item.total, 0);
     // Add tax calculation for PO if needed, e.g., based on supplier terms
     const taxAmount = 0; // Placeholder
     const totalAmount = subtotal + taxAmount;

     const newPO: PurchaseOrder = {
      ...poData,
      id: `PO-${String(Date.now()).slice(-6)}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
      createdAt: new Date().toISOString(),
      status: 'Draft',
      subtotal,
      taxAmount,
      totalAmount,
    };
    setPurchaseOrders(prev => [...prev, newPO].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
  }, []);
  const updatePurchaseOrder = useCallback((updatedPO: PurchaseOrder) => {
    const subtotal = updatedPO.items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = updatedPO.taxAmount || 0;
    const totalAmount = subtotal + taxAmount;

    setPurchaseOrders(prev => prev.map(po => po.id === updatedPO.id ? { ...updatedPO, subtotal, totalAmount, updatedAt: new Date().toISOString() } : po).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
  }, []);


  return (
    <DataContext.Provider
      value={{
        customers, invoices, products, warehouses, productStockLocations, stockTransactions, suppliers, purchaseOrders, companyProfile, isLoading,
        addCustomer, updateCustomer, deleteCustomer,
        addInvoice, updateInvoice, deleteInvoice,
        updateCompanyProfile,
        getInvoicesByCustomerId, getCustomerById, getInvoiceById, getProductById, getWarehouseById, getOutstandingBalanceByCustomerId, getSupplierById,
        addProduct, updateProduct, deleteProduct,
        addWarehouse, updateWarehouse, deleteWarehouse,
        upsertProductStockLocation, deleteProductStockLocation, addStockTransaction,
        getTotalStockForProduct, getStockForProductInWarehouse,
        addSupplier, updateSupplier, deleteSupplier,
        addPurchaseOrder, updatePurchaseOrder,
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

    