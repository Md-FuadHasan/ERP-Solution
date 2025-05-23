
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
  PurchaseOrder,
  POStatus,
  PurchaseOrderItem,
  ProductUnitType
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
  deleteProductStockLocation: (stockLocationId: string) => void; // Not fully implemented yet
  getTotalStockForProduct: (productId: string) => number;
  getStockForProductInWarehouse: (productId: string, warehouseId: string) => number;
  addStockTransaction: (transaction: Omit<StockTransaction, 'id' | 'date' | 'productName' | 'warehouseName'>) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  getSupplierById: (supplierId: string) => Supplier | undefined;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status' | 'subtotal' | 'taxAmount' | 'totalAmount'>) => void;
  updatePurchaseOrder: (po: PurchaseOrder) => void;
  deletePurchaseOrder: (poId: string) => void;
  getPurchaseOrderById: (poId: string) => PurchaseOrder | undefined;
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
    const productDetails = getProductById(transactionData.productId);
    const warehouseDetails = getWarehouseById(transactionData.warehouseId);

    const newTransaction: StockTransaction = {
      ...transactionData,
      id: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString(),
      productName: productDetails?.name || transactionData.productId,
      warehouseName: warehouseDetails?.name || transactionData.warehouseId,
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
      let transactionType: StockTransactionType = 'Initial Stock Entry'; // Default

      if (existingIndex > -1) {
        oldStockLevel = prev[existingIndex].stockLevel;
        quantityChange = newStockLevel - oldStockLevel;
        const updatedPsl = [...prev];
        updatedPsl[existingIndex] = { ...updatedPsl[existingIndex], stockLevel: newStockLevel };

        if (reason === 'Transfer Out' || reason === 'Transfer In') {
            transactionType = reason;
        } else {
            transactionType = quantityChange >= 0 ? 'Adjustment - Increase' : 'Adjustment - Decrease';
        }

         addStockTransaction({
          productId,
          warehouseId,
          type: transactionType,
          quantityChange,
          newStockLevelAfterTransaction: newStockLevel,
          reason: reason as StockAdjustmentReason, // Reason from form is more specific for adjustments
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
        // For new stock location, transaction type based on reason
        if (reason === 'Transfer In') {
            transactionType = 'Transfer In';
        } else if (reason === 'Initial Stock Entry') {
             transactionType = 'Initial Stock Entry';
        } else {
            transactionType = 'Adjustment - Increase'; // Default for other direct new entries
        }

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
    warehouseId: string,
    quantityToDeductInBaseUnits: number,
    invoiceId: string
  ) => {
    if (quantityToDeductInBaseUnits <= 0) return;

    setProductStockLocations(prevPsl => {
        const updatedPsl = [...prevPsl];
        const stockLocationIndex = updatedPsl.findIndex(psl => psl.productId === productId && psl.warehouseId === warehouseId);

        if (stockLocationIndex !== -1) {
            const oldStockLevel = updatedPsl[stockLocationIndex].stockLevel;
            const newStockLevel = oldStockLevel - quantityToDeductInBaseUnits;
            
            if (oldStockLevel < quantityToDeductInBaseUnits) {
                console.warn(`Invoice ${invoiceId}: Insufficient stock for product ${productId} in warehouse ${warehouseId}. Available: ${oldStockLevel}, Required: ${quantityToDeductInBaseUnits}. Stock not deducted beyond available.`);
                // Optionally, do not proceed with deduction or only deduct available. For now, we log but proceed to allow negative for correction.
                // This should ideally be prevented at invoice creation time.
            }
            
            updatedPsl[stockLocationIndex] = { ...updatedPsl[stockLocationIndex], stockLevel: newStockLevel };

            addStockTransaction({
                productId,
                warehouseId,
                type: 'Sale',
                quantityChange: -quantityToDeductInBaseUnits,
                newStockLevelAfterTransaction: newStockLevel,
                reference: `Invoice ${invoiceId}`,
            });
            return updatedPsl.sort((a,b) => (a.productId + a.warehouseId).localeCompare(b.productId + b.warehouseId));
        } else {
            console.warn(`Invoice ${invoiceId}: Product ${productId} not found in warehouse ${warehouseId} for stock deduction. Creating new negative stock record.`);
            // This indicates a problem - selling from a warehouse where product wasn't listed.
            // For robustness, we might create the stock location with a negative value if business rules allow.
            // Or, this should be an error preventing invoice save.
            // For now, we'll log and create a negative entry.
            const newPslRecord: ProductStockLocation = {
                id: `PSL-${productId}-${warehouseId}-${Date.now()}`,
                productId,
                warehouseId,
                stockLevel: -quantityToDeductInBaseUnits,
            };
             addStockTransaction({
                productId,
                warehouseId,
                type: 'Sale',
                quantityChange: -quantityToDeductInBaseUnits,
                newStockLevelAfterTransaction: -quantityToDeductInBaseUnits,
                reference: `Invoice ${invoiceId} (New Loc)`,
            });
            return [...prevPsl, newPslRecord].sort((a,b) => (a.productId + a.warehouseId).localeCompare(b.productId + b.warehouseId));
        }
    });
  }, [addStockTransaction]);

  const returnStockForInvoiceItem = useCallback((
    productId: string,
    warehouseId: string,
    quantityToReturnInBaseUnits: number,
    invoiceId: string
  ) => {
    if (quantityToReturnInBaseUnits <= 0) return;
    setProductStockLocations(prevPsl => {
        let updatedPsl = [...prevPsl];
        let stockLocationIndex = updatedPsl.findIndex(psl => psl.productId === productId && psl.warehouseId === warehouseId);

        if (stockLocationIndex !== -1) {
            const oldStockLevel = updatedPsl[stockLocationIndex].stockLevel;
            const newStockLevel = oldStockLevel + quantityToReturnInBaseUnits;
            updatedPsl[stockLocationIndex] = { ...updatedPsl[stockLocationIndex], stockLevel: newStockLevel };
            addStockTransaction({
                productId,
                warehouseId,
                type: 'Sale Return',
                quantityChange: quantityToReturnInBaseUnits,
                newStockLevelAfterTransaction: newStockLevel,
                reference: `Invoice ${invoiceId} (Return/Cancel)`,
            });
        } else {
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
          // Convert item quantity to base product unit if necessary
          if (item.unitType.toLowerCase() !== productDetails.unitType.toLowerCase()) {
            if (productDetails.packagingUnit?.toLowerCase() === item.unitType.toLowerCase() && productDetails.itemsPerPackagingUnit) {
              quantityToDeductInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
            } else if (item.unitType.toLowerCase() === 'pcs' && productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0) {
              quantityToDeductInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
            } else {
               console.warn(`Stock deduction: Unit conversion not clearly defined for product ${productDetails.id} (item unit: ${item.unitType}, product base unit: ${productDetails.unitType}). Assuming direct quantity.`);
            }
          }

          // Simplified: deduct from first available warehouse. Real app needs warehouse selection on invoice.
          const pslToDeductFrom = productStockLocations.find(psl => psl.productId === item.productId && psl.stockLevel > 0) || productStockLocations.find(psl => psl.productId === item.productId);
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

    if (originalInvoice && originalInvoice.status !== 'Cancelled') {
      originalInvoice.items.forEach(item => {
        const productDetails = getProductById(item.productId || '');
        if (productDetails && item.productId) {
          let quantityToReturnInBaseUnits = item.quantity;
           if (item.unitType.toLowerCase() !== productDetails.unitType.toLowerCase()) {
            if (productDetails.packagingUnit?.toLowerCase() === item.unitType.toLowerCase() && productDetails.itemsPerPackagingUnit) {
              quantityToReturnInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
            } else if (item.unitType.toLowerCase() === 'pcs' && productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0) {
              quantityToReturnInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
            }
          }
          const sourceWarehouseIdForReturn = productStockLocations.find(psl => psl.productId === item.productId)?.warehouseId || (warehouses.length > 0 ? warehouses[0].id : undefined);
          if (sourceWarehouseIdForReturn && quantityToReturnInBaseUnits > 0) {
            returnStockForInvoiceItem(item.productId, sourceWarehouseIdForReturn, quantityToReturnInBaseUnits, updatedInvoice.id);
          }
        }
      });
    }

    if (updatedInvoice.status !== 'Cancelled') {
      updatedInvoice.items.forEach(item => {
        const productDetails = getProductById(item.productId || '');
         if (productDetails && item.productId) {
           let quantityToDeductInBaseUnits = item.quantity;
            if (item.unitType.toLowerCase() !== productDetails.unitType.toLowerCase()) {
              if (productDetails.packagingUnit?.toLowerCase() === item.unitType.toLowerCase() && productDetails.itemsPerPackagingUnit) {
                quantityToDeductInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
              } else if (item.unitType.toLowerCase() === 'pcs' && productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0) {
                quantityToDeductInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
              }
            }
           const sourceWarehouseIdForDeduction = productStockLocations.find(psl => psl.productId === item.productId && psl.stockLevel > 0)?.warehouseId || productStockLocations.find(psl => psl.productId === item.productId)?.warehouseId || (warehouses.length > 0 ? warehouses[0].id : undefined);
           if (sourceWarehouseIdForDeduction && quantityToDeductInBaseUnits > 0) {
             deductStockForInvoiceItem(item.productId, sourceWarehouseIdForDeduction, quantityToDeductInBaseUnits, updatedInvoice.id);
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
                if (item.unitType.toLowerCase() !== productDetails.unitType.toLowerCase()) {
                  if (productDetails.packagingUnit?.toLowerCase() === item.unitType.toLowerCase() && productDetails.itemsPerPackagingUnit) {
                    quantityToReturnInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
                  } else if (item.unitType.toLowerCase() === 'pcs' && productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0) {
                    quantityToReturnInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
                  }
                }
                const sourceWarehouseIdForReturn = productStockLocations.find(psl => psl.productId === item.productId)?.warehouseId || (warehouses.length > 0 ? warehouses[0].id : undefined);
                 if (sourceWarehouseIdForReturn && quantityToReturnInBaseUnits > 0) {
                    returnStockForInvoiceItem(item.productId, sourceWarehouseIdForReturn, quantityToReturnInBaseUnits, invoiceToDelete.id);
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

  const addSupplier = useCallback((supplierData: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newSupplier: Supplier = { ...supplierData, id: `SUPP-${Date.now()}-${Math.random().toString(36).substring(2,7)}`, createdAt: new Date().toISOString() };
    setSuppliers(prev => [...prev, newSupplier].sort((a,b) => a.name.localeCompare(b.name)));
  }, []);
  const updateSupplier = useCallback((updatedSupplier: Supplier) => setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteSupplier = useCallback((supplierId: string) => setSuppliers(prev => prev.filter(s => s.id !== supplierId)), []);
  const getSupplierById = useCallback((supplierId: string) => suppliers.find(s => s.id === supplierId), [suppliers]);

  const addPurchaseOrder = useCallback((poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status' | 'subtotal' | 'taxAmount' | 'totalAmount'>) => {
     const subtotal = poData.items.reduce((sum, item) => sum + item.total, 0);
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
    const taxAmount = updatedPO.taxAmount || 0; // Keep existing tax or default to 0
    const totalAmount = subtotal + taxAmount;

    setPurchaseOrders(prev => prev.map(po => po.id === updatedPO.id ? { ...updatedPO, subtotal, totalAmount, updatedAt: new Date().toISOString() } : po).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
  }, []);

  const deletePurchaseOrder = useCallback((poId: string) => {
    setPurchaseOrders(prev => prev.filter(po => po.id !== poId));
  }, []);

  const getPurchaseOrderById = useCallback((poId: string) => purchaseOrders.find(po => po.id === poId), [purchaseOrders]);


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
        addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, getPurchaseOrderById
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
