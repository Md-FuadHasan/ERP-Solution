
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
  Supplier, // New
  PurchaseOrder // New
} from '@/types';
import {
  MOCK_CUSTOMERS,
  MOCK_INVOICES,
  MOCK_COMPANY_PROFILE,
  MOCK_PRODUCTS,
  MOCK_WAREHOUSES,
  MOCK_PRODUCT_STOCK_LOCATIONS,
  MOCK_STOCK_TRANSACTIONS,
  MOCK_SUPPLIERS, // New
  MOCK_PURCHASE_ORDERS // New
} from '@/types';

interface DataContextType {
  customers: Customer[];
  invoices: Invoice[];
  products: Product[];
  warehouses: Warehouse[];
  productStockLocations: ProductStockLocation[];
  stockTransactions: StockTransaction[];
  suppliers: Supplier[]; // New
  purchaseOrders: PurchaseOrder[]; // New
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
    reason: StockAdjustmentReason | StockTransactionType,
    reference?: string
  ) => void;
  deleteProductStockLocation: (stockLocationId: string) => void;
  getTotalStockForProduct: (productId: string) => number;
  getStockForProductInWarehouse: (productId: string, warehouseId: string) => number;
  addStockTransaction: (transaction: Omit<StockTransaction, 'id' | 'date' | 'productName' | 'warehouseName'>) => void;
  addSupplier: (supplier: Supplier) => void; // New
  updateSupplier: (supplier: Supplier) => void; // New
  deleteSupplier: (supplierId: string) => void; // New
  getSupplierById: (supplierId: string) => Supplier | undefined; // New
  addPurchaseOrder: (po: PurchaseOrder) => void; // New
  updatePurchaseOrder: (po: PurchaseOrder) => void; // New
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
  SUPPLIERS: 'invoiceflow_suppliers', // New
  PURCHASE_ORDERS: 'invoiceflow_purchase_orders', // New
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [productStockLocations, setProductStockLocations] = useState<ProductStockLocation[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]); // New
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]); // New
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

      const storedSuppliers = localStorage.getItem(LOCAL_STORAGE_KEYS.SUPPLIERS); // New
      setSuppliers(storedSuppliers ? JSON.parse(storedSuppliers) : MOCK_SUPPLIERS); // New

      const storedPurchaseOrders = localStorage.getItem(LOCAL_STORAGE_KEYS.PURCHASE_ORDERS); // New
      setPurchaseOrders(storedPurchaseOrders ? JSON.parse(storedPurchaseOrders) : MOCK_PURCHASE_ORDERS); // New

    } catch (error) {
      console.error("DataContext: Failed to load data from localStorage, using mocks:", error);
      setCustomers(MOCK_CUSTOMERS);
      setInvoices(MOCK_INVOICES);
      setCompanyProfile(MOCK_COMPANY_PROFILE);
      setProducts(MOCK_PRODUCTS);
      setWarehouses(MOCK_WAREHOUSES);
      setProductStockLocations(MOCK_PRODUCT_STOCK_LOCATIONS);
      setStockTransactions(MOCK_STOCK_TRANSACTIONS);
      setSuppliers(MOCK_SUPPLIERS); // New
      setPurchaseOrders(MOCK_PURCHASE_ORDERS); // New
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
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers)); }, [suppliers, isLoading]); // New
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(purchaseOrders)); }, [purchaseOrders, isLoading]); // New


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
     // Also remove stock transactions related to this warehouse
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
      let transactionType: StockTransactionType = 'Adjustment - Increase'; // Default

      if (existingIndex > -1) {
        oldStockLevel = prev[existingIndex].stockLevel;
        quantityChange = newStockLevel - oldStockLevel;
        const updatedPsl = [...prev];
        updatedPsl[existingIndex] = { ...updatedPsl[existingIndex], stockLevel: newStockLevel };
        transactionType = quantityChange >= 0 ? 'Adjustment - Increase' : 'Adjustment - Decrease';
         addStockTransaction({
          productId,
          warehouseId,
          type: transactionType,
          quantityChange,
          newStockLevelAfterTransaction: newStockLevel,
          reason: reason as StockAdjustmentReason,
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
        transactionType = reason as StockTransactionType; // For initial entry, reason is the type
         addStockTransaction({
          productId,
          warehouseId,
          type: transactionType,
          quantityChange: newStockLevel,
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
    warehouseId: string,
    quantityToDeductInBaseUnits: number,
    currentProductStockLocations: ProductStockLocation[],
    invoiceId: string
  ): ProductStockLocation[] => {
    const updatedPsl = [...currentProductStockLocations];
    const stockLocationIndex = updatedPsl.findIndex(psl => psl.productId === productId && psl.warehouseId === warehouseId);

    if (stockLocationIndex !== -1) {
      const oldStockLevel = updatedPsl[stockLocationIndex].stockLevel;
      const newStockLevel = Math.max(0, oldStockLevel - quantityToDeductInBaseUnits);
      const actualDeductedAmount = oldStockLevel - newStockLevel;

      updatedPsl[stockLocationIndex] = {
        ...updatedPsl[stockLocationIndex],
        stockLevel: newStockLevel,
      };

      if (actualDeductedAmount > 0) { // Log only if stock actually changed
          addStockTransaction({
            productId,
            warehouseId,
            type: 'Sale',
            quantityChange: -actualDeductedAmount,
            newStockLevelAfterTransaction: newStockLevel,
            reference: `Invoice ${invoiceId}`,
          });
      }
    } else {
      console.warn(`Stock deduction: Product ${productId} not found or no stock in warehouse ${warehouseId} for invoice ${invoiceId}. Stock not deducted.`);
      // Optionally create a transaction log for failed deduction if needed
    }
    return updatedPsl;
  }, [addStockTransaction]);

  const returnStockForInvoiceItem = useCallback((
    productId: string,
    warehouseId: string,
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
      // If stock location doesn't exist, create it with the returned stock.
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
      console.warn(`Stock return: Product ${productId} had no prior stock in warehouse ${warehouseId}. Created new stock location for invoice ${invoiceId}.`);
    }
    return updatedPsl;
  }, [addStockTransaction]);


  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => [...prev, invoice].sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));
    if (invoice.status !== 'Cancelled') {
      setProductStockLocations(currentPsls => {
        let tempPsls = [...currentPsls];
        invoice.items.forEach(item => {
          const productDetails = getProductById(item.productId || '');
          if (productDetails && item.productId) {
            let quantityToDeductInBaseUnits = item.quantity;
            if (item.unitType === 'Cartons') {
                if (productDetails.unitType === 'PCS' && productDetails.packagingUnit?.toLowerCase() === 'carton' && productDetails.itemsPerPackagingUnit && productDetails.itemsPerPackagingUnit > 0) {
                    quantityToDeductInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
                } else if (productDetails.unitType.toLowerCase() === 'cartons') {
                    quantityToDeductInBaseUnits = item.quantity;
                } else { // Assume item.unitType is a custom package name for the base unit
                    if (productDetails.packagingUnit && productDetails.itemsPerPackagingUnit && productDetails.packagingUnit.toLowerCase() === item.unitType.toLowerCase()) {
                       quantityToDeductInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
                    } else if (productDetails.unitType.toLowerCase() === item.unitType.toLowerCase() && productDetails.piecesInBaseUnit) { // Selling base unit which is a package
                        // This assumes if unitType is a package (e.g. Carton), then item.quantity *IS* in base units
                        quantityToDeductInBaseUnits = item.quantity;
                    } else {
                       console.warn(`Stock deduction: Unhandled unit conversion for product ${productDetails.id} (Base: ${productDetails.unitType}, Item: ${item.unitType}) on invoice ${invoice.id}`);
                       return; // Skip deduction if units are unclear
                    }
                }
            } else { // Item sold in PCS
                 if (productDetails.unitType.toLowerCase() === 'pcs') {
                    quantityToDeductInBaseUnits = item.quantity;
                 } else if (productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0) { // Base unit is a package, item sold in PCS from it
                    quantityToDeductInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
                    if (!Number.isInteger(quantityToDeductInBaseUnits)) {
                        console.warn(`Stock deduction: fractional base units calculated for ${productDetails.id} (selling PCS from ${productDetails.unitType}) on invoice ${invoice.id}. Deducting rounded up quantity of base units.`);
                        quantityToDeductInBaseUnits = Math.ceil(quantityToDeductInBaseUnits);
                    }
                 } else {
                    console.warn(`Stock deduction: Cannot sell PCS for product ${productDetails.id} (Base: ${productDetails.unitType}) without piecesInBaseUnit defined, on invoice ${invoice.id}`);
                    return; // Skip deduction
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
  }, [getProductById, warehouses, deductStockForInvoiceItem]);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    const originalInvoice = invoices.find(inv => inv.id === updatedInvoice.id);
    setProductStockLocations(currentPsls => {
        let tempPsls = [...currentPsls];
        if (originalInvoice && originalInvoice.status !== 'Cancelled') {
            originalInvoice.items.forEach(item => {
                const productDetails = getProductById(item.productId || '');
                 if (productDetails && item.productId) {
                    let quantityToReturnInBaseUnits = item.quantity;
                     if (item.unitType === 'Cartons') {
                        if (productDetails.unitType === 'PCS' && productDetails.packagingUnit?.toLowerCase() === 'carton' && productDetails.itemsPerPackagingUnit && productDetails.itemsPerPackagingUnit > 0) {
                            quantityToReturnInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
                        } else if (productDetails.unitType.toLowerCase() === 'cartons') {
                             quantityToReturnInBaseUnits = item.quantity;
                        }  // ... (add similar comprehensive logic as in addInvoice for other unit conversions)
                    } else { // Item sold in PCS
                        if (productDetails.unitType.toLowerCase() === 'pcs') {
                            quantityToReturnInBaseUnits = item.quantity;
                        } else if (productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0) {
                             quantityToReturnInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
                             // Handle potential fractional return similarly if needed
                        }
                    }
                    const firstWarehouseWithStock = tempPsls.find(psl => psl.productId === item.productId)?.warehouseId || warehouses[0]?.id;
                    if (firstWarehouseWithStock) {
                      tempPsls = returnStockForInvoiceItem(item.productId, firstWarehouseWithStock, quantityToReturnInBaseUnits, tempPsls, updatedInvoice.id);
                    }
                }
            });
        }
        if (updatedInvoice.status !== 'Cancelled') {
            updatedInvoice.items.forEach(item => {
                const productDetails = getProductById(item.productId || '');
                if (productDetails && item.productId) {
                    let quantityToDeductInBaseUnits = item.quantity;
                     if (item.unitType === 'Cartons') {
                        if (productDetails.unitType === 'PCS' && productDetails.packagingUnit?.toLowerCase() === 'carton' && productDetails.itemsPerPackagingUnit && productDetails.itemsPerPackagingUnit > 0) {
                            quantityToDeductInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
                        } else if (productDetails.unitType.toLowerCase() === 'cartons') {
                            quantityToDeductInBaseUnits = item.quantity;
                        } // ... (add similar comprehensive logic as in addInvoice for other unit conversions)
                    } else { // Item sold in PCS
                        if (productDetails.unitType.toLowerCase() === 'pcs') {
                           quantityToDeductInBaseUnits = item.quantity;
                        } else if (productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0) {
                            quantityToDeductInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
                             // Handle potential fractional deduction similarly if needed
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
  }, [invoices, getProductById, warehouses, deductStockForInvoiceItem, returnStockForInvoiceItem]);

  const deleteInvoice = useCallback((invoiceId: string) => {
    const invoiceToDelete = invoices.find(inv => inv.id === invoiceId);
    if (invoiceToDelete && invoiceToDelete.status !== 'Cancelled') {
        setProductStockLocations(currentPsls => {
            let tempPsls = [...currentPsls];
            invoiceToDelete.items.forEach(item => {
                const productDetails = getProductById(item.productId || '');
                if (productDetails && item.productId) {
                    let quantityToReturnInBaseUnits = item.quantity;
                     if (item.unitType === 'Cartons') {
                        if (productDetails.unitType === 'PCS' && productDetails.packagingUnit?.toLowerCase() === 'carton' && productDetails.itemsPerPackagingUnit && productDetails.itemsPerPackagingUnit > 0) {
                            quantityToReturnInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
                        } else if (productDetails.unitType.toLowerCase() === 'cartons') {
                             quantityToReturnInBaseUnits = item.quantity;
                        } // ... (add similar comprehensive logic as in addInvoice for other unit conversions)
                    } else { // Item sold in PCS
                        if (productDetails.unitType.toLowerCase() === 'pcs') {
                            quantityToReturnInBaseUnits = item.quantity;
                        } else if (productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0) {
                             quantityToReturnInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
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
  }, [invoices, getProductById, warehouses, returnStockForInvoiceItem]);

  const getInvoicesByCustomerId = useCallback((customerId: string) => invoices.filter(invoice => invoice.customerId === customerId), [invoices]);
  const getCustomerById = useCallback((customerId: string) => customers.find(customer => customer.id === customerId), [customers]);
  const getInvoiceById = useCallback((invoiceId: string) => invoices.find(invoice => invoice.id === invoiceId), [invoices]);
  const getOutstandingBalanceByCustomerId = useCallback((customerId: string) => {
    return invoices
      .filter(invoice => invoice.customerId === customerId && invoice.status !== 'Paid' && invoice.status !== 'Cancelled')
      .reduce((sum, invoice) => sum + invoice.remainingBalance, 0);
  }, [invoices]);

  // New Supplier and Purchase Order Functions
  const addSupplier = useCallback((supplier: Supplier) => {
    const newSupplier = { ...supplier, id: supplier.id || `SUPP-${Date.now()}-${Math.random().toString(36).substring(2,7)}`, createdAt: new Date().toISOString() };
    setSuppliers(prev => [...prev, newSupplier].sort((a,b) => a.name.localeCompare(b.name)));
  }, []);
  const updateSupplier = useCallback((updatedSupplier: Supplier) => setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteSupplier = useCallback((supplierId: string) => setSuppliers(prev => prev.filter(s => s.id !== supplierId)), []);
  const getSupplierById = useCallback((supplierId: string) => suppliers.find(s => s.id === supplierId), [suppliers]);

  const addPurchaseOrder = useCallback((po: PurchaseOrder) => {
     const newPO = { ...po, id: po.id || `PO-${Date.now()}-${Math.random().toString(36).substring(2,7)}`, createdAt: new Date().toISOString() };
    setPurchaseOrders(prev => [...prev, newPO].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
  }, []);
  const updatePurchaseOrder = useCallback((updatedPO: PurchaseOrder) => {
    setPurchaseOrders(prev => prev.map(po => po.id === updatedPO.id ? { ...po, ...updatedPO, updatedAt: new Date().toISOString() } : po).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
    // Logic for receiving stock against a PO would go here eventually
    // e.g., if updatedPO.status is 'Fully Received' or 'Partially Received'
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
