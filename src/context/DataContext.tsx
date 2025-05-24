
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
  InvoiceItem,
  ProductUnitType,
  SalesOrder,
  SalesOrderStatus,
  SalesOrderItem,
  Salesperson
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
  MOCK_PURCHASE_ORDERS,
  MOCK_SALESPEOPLE,
  MOCK_SALES_ORDERS,
} from '@/types';
import { toast } from '@/hooks/use-toast';

// --- Plain Helper Finder Functions (defined outside component) ---
const findCustomerById = (customersArray: Customer[], customerId: string): Customer | undefined => customersArray.find(c => c.id === customerId);
const findInvoiceById = (invoicesArray: Invoice[], invoiceId: string): Invoice | undefined => invoicesArray.find(i => i.id === invoiceId);
const findProductById = (productsArray: Product[], productId: string): Product | undefined => productsArray.find(p => p.id === productId);
const findWarehouseById = (warehousesArray: Warehouse[], warehouseId: string): Warehouse | undefined => warehousesArray.find(wh => wh.id === warehouseId);
const findSupplierById = (suppliersArray: Supplier[], supplierId: string): Supplier | undefined => suppliersArray.find(s => s.id === supplierId);
const findPurchaseOrderById = (purchaseOrdersArray: PurchaseOrder[], poId: string): PurchaseOrder | undefined => purchaseOrdersArray.find(po => po.id === poId);
const findSalespersonById = (salespeopleArray: Salesperson[], salespersonId: string): Salesperson | undefined => salespeopleArray.find(sp => sp.id === salespersonId);
const findSalesOrderById = (salesOrdersArray: SalesOrder[], soId: string): SalesOrder | undefined => salesOrdersArray.find(so => so.id === soId);


interface DataContextType {
  customers: Customer[];
  invoices: Invoice[];
  products: Product[];
  warehouses: Warehouse[];
  productStockLocations: ProductStockLocation[];
  stockTransactions: StockTransaction[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  salespeople: Salesperson[];
  salesOrders: SalesOrder[];
  companyProfile: CompanyProfile | null;
  isLoading: boolean;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'customerName' | 'paymentHistory' | 'amountPaid' | 'remainingBalance'> & { items: Array<InvoiceItem & { sourceWarehouseId?: string }>}) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (invoiceId: string) => void;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => void;
  getInvoicesByCustomerId: (customerId: string) => Invoice[];
  getCustomerById: (customerId: string) => Customer | undefined;
  getInvoiceById: (invoiceId: string) => Invoice | undefined;
  getOutstandingBalanceByCustomerId: (customerId: string) => number;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  getProductById: (productId: string) => Product | undefined;
  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => void;
  updateWarehouse: (warehouse: Warehouse) => void;
  deleteWarehouse: (warehouseId: string) => void;
  getWarehouseById: (warehouseId: string) => Warehouse | undefined;
  upsertProductStockLocation: (
    stockLocationUpdate: Pick<ProductStockLocation, 'productId' | 'warehouseId' | 'stockLevel'>,
    reason: StockAdjustmentReason | StockTransactionType,
    reference?: string
  ) => void;
  getTotalStockForProduct: (productId: string) => number;
  getStockForProductInWarehouse: (productId: string, warehouseId: string) => number;
  addStockTransaction: (transaction: Omit<StockTransaction, 'id' | 'date' | 'productName' | 'warehouseName'>) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  getSupplierById: (supplierId: string) => Supplier | undefined;
  addPurchaseOrder: (poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status' | 'items' | 'supplierName' | 'subtotal' | 'totalAmount'> & { items: Array<Omit<PurchaseOrderItem, 'id' | 'total' | 'quantityReceived' | 'productName'>> }) => void;
  updatePurchaseOrder: (po: PurchaseOrder) => void;
  deletePurchaseOrder: (poId: string) => void;
  cancelPurchaseOrder: (poId: string) => void;
  getPurchaseOrderById: (poId: string) => PurchaseOrder | undefined;
  processPOReceipt: (poId: string, receivedItemsData: Array<{ poItemId: string; productId: string; quantityNewlyReceived: number; warehouseId: string; itemUnitType: ProductUnitType }>) => void;
  addSalesperson: (salesperson: Omit<Salesperson, 'id' | 'createdAt'>) => void;
  updateSalesperson: (salesperson: Salesperson) => void;
  deleteSalesperson: (salespersonId: string) => void;
  getSalespersonById: (salespersonId: string) => Salesperson | undefined;
  addSalesOrder: (orderData: Omit<SalesOrder, 'id' | 'createdAt' | 'status' | 'customerName' | 'salespersonName' | 'routeName' | 'subtotal' | 'totalAmount'> & { items: Array<Omit<SalesOrderItem, 'id'| 'total' | 'productName' | 'sourceWarehouseName'>> }) => void;
  updateSalesOrder: (order: SalesOrder) => void;
  deleteSalesOrder: (orderId: string) => void;
  getSalesOrderById: (orderId: string) => SalesOrder | undefined;
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
  SALESPEOPLE: 'invoiceflow_salespeople',
  SALES_ORDERS: 'invoiceflow_sales_orders',
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
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data Loading Effect
  useEffect(() => {
    setIsLoading(true);
    try {
      const loadItem = <T,>(key: string, fallback: T[]): T[] => {
        const stored = localStorage.getItem(key);
        try { return stored ? JSON.parse(stored) : fallback; }
        catch (parseError) { console.warn(`DataContext: Failed to parse item ${key}, using fallback:`, parseError); return fallback; }
      };
      const loadSingleItem = <T,>(key: string, fallback: T): T => {
        const stored = localStorage.getItem(key);
         try { return stored ? JSON.parse(stored) : fallback; }
         catch (parseError) { console.warn(`DataContext: Failed to parse single item ${key}, using fallback:`, parseError); return fallback; }
      };

      setCustomers(loadItem(LOCAL_STORAGE_KEYS.CUSTOMERS, MOCK_CUSTOMERS));
      setInvoices(loadItem(LOCAL_STORAGE_KEYS.INVOICES, MOCK_INVOICES));
      setCompanyProfile(loadSingleItem(LOCAL_STORAGE_KEYS.COMPANY_PROFILE, MOCK_COMPANY_PROFILE));
      setProducts(loadItem(LOCAL_STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS));
      setWarehouses(loadItem(LOCAL_STORAGE_KEYS.WAREHOUSES, MOCK_WAREHOUSES));
      setProductStockLocations(loadItem(LOCAL_STORAGE_KEYS.PRODUCT_STOCK_LOCATIONS, MOCK_PRODUCT_STOCK_LOCATIONS));
      setStockTransactions(loadItem(LOCAL_STORAGE_KEYS.STOCK_TRANSACTIONS, MOCK_STOCK_TRANSACTIONS));
      setSuppliers(loadItem(LOCAL_STORAGE_KEYS.SUPPLIERS, MOCK_SUPPLIERS));
      setPurchaseOrders(loadItem(LOCAL_STORAGE_KEYS.PURCHASE_ORDERS, MOCK_PURCHASE_ORDERS));
      setSalespeople(loadItem(LOCAL_STORAGE_KEYS.SALESPEOPLE, MOCK_SALESPEOPLE));
      setSalesOrders(loadItem(LOCAL_STORAGE_KEYS.SALES_ORDERS, MOCK_SALES_ORDERS));

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
      setSalespeople(MOCK_SALESPEOPLE);
      setSalesOrders(MOCK_SALES_ORDERS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Data Saving Effects
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers)); }, [customers, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.INVOICES, JSON.stringify(invoices)); }, [invoices, isLoading]);
  useEffect(() => { if (!isLoading && companyProfile) localStorage.setItem(LOCAL_STORAGE_KEYS.COMPANY_PROFILE, JSON.stringify(companyProfile)); }, [companyProfile, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); }, [products, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses)); }, [warehouses, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCT_STOCK_LOCATIONS, JSON.stringify(productStockLocations)); }, [productStockLocations, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.STOCK_TRANSACTIONS, JSON.stringify(stockTransactions)); }, [stockTransactions, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers)); }, [suppliers, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(purchaseOrders)); }, [purchaseOrders, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.SALESPEOPLE, JSON.stringify(salespeople)); }, [salespeople, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.SALES_ORDERS, JSON.stringify(salesOrders)); }, [salesOrders, isLoading]);


  // --- Memoized Getter Functions ---
  const getCustomerById = useCallback((customerId: string) => findCustomerById(customers, customerId), [customers]);
  const getInvoiceById = useCallback((invoiceId: string) => findInvoiceById(invoices, invoiceId), [invoices]);
  const getProductById = useCallback((productId: string) => findProductById(products, productId), [products]);
  const getWarehouseById = useCallback((warehouseId: string) => findWarehouseById(warehouses, warehouseId), [warehouses]);
  const getSupplierById = useCallback((supplierId: string) => findSupplierById(suppliers, supplierId), [suppliers]);
  const getPurchaseOrderById = useCallback((poId: string) => findPurchaseOrderById(purchaseOrders, poId), [purchaseOrders]);
  const getSalespersonById = useCallback((salespersonId: string) => findSalespersonById(salespeople, salespersonId), [salespeople]);
  const getSalesOrderById = useCallback((soId: string) => findSalesOrderById(salesOrders, soId), [salesOrders]);

  const getInvoicesByCustomerId = useCallback((customerId: string) => invoices.filter(invoice => invoice.customerId === customerId), [invoices]);
  const getOutstandingBalanceByCustomerId = useCallback((customerId: string) => {
    return invoices
      .filter(invoice => invoice.customerId === customerId && invoice.status !== 'Paid' && invoice.status !== 'Cancelled')
      .reduce((sum, invoice) => sum + invoice.remainingBalance, 0);
  }, [invoices]);

  const getTotalStockForProduct = useCallback((productId: string): number => {
    return productStockLocations
      .filter(psl => psl.productId === productId)
      .reduce((sum, psl) => sum + psl.stockLevel, 0);
  }, [productStockLocations]);

  const getStockForProductInWarehouse = useCallback((productId: string, warehouseId: string): number => {
    const stockLocation = productStockLocations.find(psl => psl.productId === productId && psl.warehouseId === warehouseId);
    return stockLocation ? stockLocation.stockLevel : 0;
  }, [productStockLocations]);

  // --- Stock Transaction Logging ---
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

  // --- Product Stock Location Management ---
   const upsertProductStockLocation = useCallback((
    stockLocationUpdate: Pick<ProductStockLocation, 'productId' | 'warehouseId' | 'stockLevel'>,
    reason: StockAdjustmentReason | StockTransactionType,
    reference?: string
  ) => {
    setProductStockLocations(prev => {
      const { productId, warehouseId, stockLevel: newStockLevel } = stockLocationUpdate;
      const existingIndex = prev.findIndex(psl => psl.productId === productId && psl.warehouseId === warehouseId);
      let quantityChange: number;
      let transactionTypeForLog: StockTransactionType;

      if (existingIndex > -1) {
        const oldStockLevel = prev[existingIndex].stockLevel;
        quantityChange = newStockLevel - oldStockLevel;
        const updatedPsl = [...prev];
        updatedPsl[existingIndex] = { ...updatedPsl[existingIndex], stockLevel: newStockLevel, id: updatedPsl[existingIndex].id || `PSL-${productId}-${warehouseId}-${Date.now()}` };

        if (['Transfer Out', 'Transfer In', 'PO Receipt', 'Sale', 'Sale Return', 'Production Output', 'Production Input Consumption'].includes(reason)) {
          transactionTypeForLog = reason as StockTransactionType;
        } else { // Assume it's from stock adjustment form
            transactionTypeForLog = quantityChange > 0 ? 'Adjustment - Increase' : 'Adjustment - Decrease';
        }
        if (quantityChange !== 0) { // Only log if there's an actual change
          addStockTransaction({
            productId,
            warehouseId,
            type: transactionTypeForLog,
            quantityChange,
            newStockLevelAfterTransaction: newStockLevel,
            reason: reason, // The reason passed from the form or operation
            reference,
          });
        }
        return updatedPsl.sort((a, b) => (a.productId + a.warehouseId).localeCompare(b.productId + b.warehouseId));
      } else { // New stock location
        const newPsl: ProductStockLocation = {
          id: `PSL-${productId}-${warehouseId}-${Date.now()}`,
          productId,
          warehouseId,
          stockLevel: newStockLevel,
        };
        quantityChange = newStockLevel;
        if (['Transfer In', 'PO Receipt', 'Initial Stock Entry', 'Production Output'].includes(reason)) {
            transactionTypeForLog = reason as StockTransactionType;
        } else if (reason === 'Sale') {
             transactionTypeForLog = 'Sale';
        } else {
            transactionTypeForLog = quantityChange > 0 ? 'Adjustment - Increase' : 'Adjustment - Decrease';
        }

        if (quantityChange !== 0) {
          addStockTransaction({
            productId,
            warehouseId,
            type: transactionTypeForLog,
            quantityChange,
            newStockLevelAfterTransaction: newStockLevel,
            reason: reason,
            reference,
          });
        }
        return [...prev, newPsl].sort((a, b) => (a.productId + a.warehouseId).localeCompare(b.productId + b.warehouseId));
      }
    });
  }, [addStockTransaction]);

  // --- Stock Deduction/Return for Invoices ---
  const deductStockForInvoiceItem = useCallback((
    productId: string,
    sourceWarehouseId: string,
    quantityToDeductInBaseUnits: number,
    invoiceId: string
  ) => {
    if (quantityToDeductInBaseUnits <= 0) return;
    const currentStock = getStockForProductInWarehouse(productId, sourceWarehouseId);
    const newStockLevel = Math.max(0, currentStock - quantityToDeductInBaseUnits);
    const actualDeductedQuantity = currentStock - newStockLevel;

    if (actualDeductedQuantity > 0) {
        upsertProductStockLocation(
          { productId, warehouseId: sourceWarehouseId, stockLevel: newStockLevel },
          'Sale',
          `Invoice ${invoiceId}${quantityToDeductInBaseUnits > actualDeductedQuantity ? ' (Partial due to low stock)' : ''}`
        );
        if (quantityToDeductInBaseUnits > actualDeductedQuantity) {
            toast({
                title: "Stock Alert: Partial Deduction",
                description: `Only ${actualDeductedQuantity} units of ${getProductById(productId)?.name || productId} deducted for invoice ${invoiceId} from ${getWarehouseById(sourceWarehouseId)?.name || sourceWarehouseId}. Requested: ${quantityToDeductInBaseUnits}.`,
                variant: "default"
            });
        }
    }
  }, [getStockForProductInWarehouse, upsertProductStockLocation, getProductById, getWarehouseById]);

  const returnStockForInvoiceItem = useCallback((
    productId: string,
    sourceWarehouseId: string,
    quantityToReturnInBaseUnits: number,
    invoiceId: string
  ) => {
    if (quantityToReturnInBaseUnits <= 0) return;
    const currentStock = getStockForProductInWarehouse(productId, sourceWarehouseId);
    const newStockLevel = currentStock + quantityToReturnInBaseUnits;
    upsertProductStockLocation(
      { productId, warehouseId: sourceWarehouseId, stockLevel: newStockLevel },
      'Sale Return',
      `Invoice ${invoiceId} (Return/Cancel)`
    );
  }, [getStockForProductInWarehouse, upsertProductStockLocation]);


  // --- CRUD Operations ---
  const addCustomer = useCallback((customer: Customer) => setCustomers(prev => [...prev, customer].sort((a,b) => a.name.localeCompare(b.name))), []);
  const updateCustomer = useCallback((updatedCustomer: Customer) => setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteCustomer = useCallback((customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
  }, []);

  const addProduct = useCallback((productData: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: `PROD-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
      createdAt: new Date().toISOString(),
    };
    setProducts(prev => [...prev, newProduct].sort((a,b) => a.name.localeCompare(b.name)));
  }, []);
  const updateProduct = useCallback((updatedProduct: Product) => setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteProduct = useCallback((productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setProductStockLocations(prevPsl => prevPsl.filter(psl => psl.productId !== productId));
    setStockTransactions(prevTxn => prevTxn.filter(txn => txn.productId !== productId));
    setInvoices(prevInvoices => prevInvoices.map(inv => ({
        ...inv,
        items: inv.items.filter(item => item.productId !== productId)
    })));
  }, []);

  const addWarehouse = useCallback((warehouseData: Omit<Warehouse, 'id'>) => {
    const newWarehouse: Warehouse = { ...warehouseData, id: `WH-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
    setWarehouses(prev => [...prev, newWarehouse].sort((a,b) => a.name.localeCompare(b.name)));
  }, []);
  const updateWarehouse = useCallback((updatedWarehouse: Warehouse) => setWarehouses(prev => prev.map(wh => wh.id === updatedWarehouse.id ? updatedWarehouse : wh).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteWarehouse = useCallback((warehouseId: string) => {
    setWarehouses(prevWh => prevWh.filter(wh => wh.id !== warehouseId));
    setProductStockLocations(prevPsl => prevPsl.filter(psl => psl.warehouseId !== warehouseId));
    setStockTransactions(prevTxn => prevTxn.filter(txn => txn.warehouseId !== warehouseId));
  }, []);

  const addSupplier = useCallback((supplierData: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newSupplier: Supplier = { ...supplierData, id: `SUPP-${Date.now()}-${Math.random().toString(36).substring(2,7)}`, createdAt: new Date().toISOString() };
    setSuppliers(prev => [...prev, newSupplier].sort((a,b) => a.name.localeCompare(b.name)));
  }, []);
  const updateSupplier = useCallback((updatedSupplier: Supplier) => setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s).sort((a,b) => a.name.localeCompare(b.name))), []);
  const deleteSupplier = useCallback((supplierId: string) => setSuppliers(prev => prev.filter(s => s.id !== supplierId)), []);

  const addInvoice = useCallback((invoiceData: Omit<Invoice, 'customerName' | 'paymentHistory' | 'amountPaid' | 'remainingBalance'> & { items: Array<InvoiceItem & { sourceWarehouseId?: string }>}) => {
    const customer = getCustomerById(invoiceData.customerId);
    const newInvoice: Invoice = {
      ...invoiceData,
      customerName: customer?.name || 'N/A',
      paymentHistory: [],
      amountPaid: 0,
      remainingBalance: invoiceData.totalAmount,
    };
    setInvoices((prev) => [...prev, newInvoice].sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));

    if (newInvoice.status !== 'Cancelled') {
      newInvoice.items.forEach(item => {
        const productDetails = getProductById(item.productId || '');
        if (productDetails && item.productId && item.sourceWarehouseId) {
          let quantityToDeductInBaseUnits = item.quantity;
          if (item.unitType.toLowerCase() !== productDetails.unitType.toLowerCase()) {
            if (productDetails.packagingUnit && item.unitType.toLowerCase() === productDetails.packagingUnit.toLowerCase() && productDetails.itemsPerPackagingUnit) {
              quantityToDeductInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
            } else if (item.unitType.toLowerCase() === 'pcs' && productDetails.unitType.toLowerCase() !== 'pcs' && productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0) {
              quantityToDeductInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
            }
          }
          if (quantityToDeductInBaseUnits > 0) {
            deductStockForInvoiceItem(item.productId, item.sourceWarehouseId, quantityToDeductInBaseUnits, newInvoice.id);
          }
        } else if (productDetails && item.productId && !item.sourceWarehouseId && newInvoice.items.length > 0) {
            toast({ title: "Stock Deduction Skipped", description: `Item "${item.description}" on invoice ${newInvoice.id} is missing source warehouse.`, variant: "default" });
        }
      });
    }
  }, [getCustomerById, getProductById, deductStockForInvoiceItem]);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    const originalInvoice = findInvoiceById(invoices, updatedInvoice.id);

    if (originalInvoice && originalInvoice.status !== 'Cancelled') {
      originalInvoice.items.forEach(item => {
        const productDetails = getProductById(item.productId || '');
        if (productDetails && item.productId && item.sourceWarehouseId) {
           let quantityToReturnInBaseUnits = item.quantity;
           if (item.unitType.toLowerCase() !== productDetails.unitType.toLowerCase()) {
             if (productDetails.packagingUnit && item.unitType.toLowerCase() === productDetails.packagingUnit.toLowerCase() && productDetails.itemsPerPackagingUnit) {
               quantityToReturnInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
             } else if (item.unitType.toLowerCase() === 'pcs' && productDetails.unitType.toLowerCase() !== 'pcs' && productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0) {
               quantityToReturnInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
             }
           }
          if (quantityToReturnInBaseUnits > 0) {
            returnStockForInvoiceItem(item.productId, item.sourceWarehouseId, quantityToReturnInBaseUnits, updatedInvoice.id);
          }
        }
      });
    }

    if (updatedInvoice.status !== 'Cancelled') {
      updatedInvoice.items.forEach(item => {
        const productDetails = getProductById(item.productId || '');
         if (productDetails && item.productId && item.sourceWarehouseId) {
           let quantityToDeductInBaseUnits = item.quantity;
            if (item.unitType.toLowerCase() !== productDetails.unitType.toLowerCase()) {
              if (productDetails.packagingUnit && item.unitType.toLowerCase() === productDetails.packagingUnit.toLowerCase() && productDetails.itemsPerPackagingUnit) {
                quantityToDeductInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
              } else if (item.unitType.toLowerCase() === 'pcs' && productDetails.unitType.toLowerCase() !== 'pcs' && productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0) {
                quantityToDeductInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
              }
            }
           if (quantityToDeductInBaseUnits > 0) {
             deductStockForInvoiceItem(item.productId, item.sourceWarehouseId, quantityToDeductInBaseUnits, updatedInvoice.id);
           }
         } else if (productDetails && item.productId && !item.sourceWarehouseId && updatedInvoice.items.length > 0) {
             toast({ title: "Stock Deduction Skipped", description: `Item "${item.description}" on updated invoice ${updatedInvoice.id} is missing source warehouse.`, variant: "default" });
         }
      });
    }
    setInvoices((prev) => prev.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i)).sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));
  }, [invoices, getProductById, deductStockForInvoiceItem, returnStockForInvoiceItem]);

  const deleteInvoice = useCallback((invoiceId: string) => {
    const invoiceToDelete = findInvoiceById(invoices, invoiceId);
    if (invoiceToDelete && invoiceToDelete.status !== 'Cancelled') {
        invoiceToDelete.items.forEach(item => {
            const productDetails = getProductById(item.productId || '');
            if (productDetails && item.productId && item.sourceWarehouseId) {
                let quantityToReturnInBaseUnits = item.quantity;
                if (item.unitType.toLowerCase() !== productDetails.unitType.toLowerCase()) {
                  if (productDetails.packagingUnit && item.unitType.toLowerCase() === productDetails.packagingUnit.toLowerCase() && productDetails.itemsPerPackagingUnit) {
                    quantityToReturnInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
                  } else if (item.unitType.toLowerCase() === 'pcs' && productDetails.unitType.toLowerCase() !== 'pcs' && productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0) {
                    quantityToReturnInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
                  }
                }
                 if (quantityToReturnInBaseUnits > 0) {
                    returnStockForInvoiceItem(item.productId, item.sourceWarehouseId, quantityToReturnInBaseUnits, invoiceToDelete.id);
                 }
            }
        });
    }
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
  }, [invoices, getProductById, returnStockForInvoiceItem]);

  const updateCompanyProfile = useCallback((profileUpdate: Partial<CompanyProfile>) => {
    setCompanyProfile(prev => ({ ...(prev || MOCK_COMPANY_PROFILE), ...profileUpdate }));
  }, []);

  const addPurchaseOrder = useCallback((poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status' | 'items' | 'supplierName' | 'subtotal' | 'totalAmount'> & { items: Array<Omit<PurchaseOrderItem, 'id' | 'total' | 'quantityReceived' | 'productName'>> }) => {
    const supplier = getSupplierById(poData.supplierId);
    const itemsWithDetails = poData.items.map(item => {
      const product = getProductById(item.productId);
      return {
        ...item,
        id: item.id || `poi-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
        productName: product?.name || item.productId,
        total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        quantityReceived: 0,
      };
    });
    const subtotal = itemsWithDetails.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = 0;
    const totalAmount = subtotal + taxAmount;

    const newPO: PurchaseOrder = {
      id: `PO-${String(Date.now()).slice(-6)}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
      supplierId: poData.supplierId,
      supplierName: supplier?.name || poData.supplierId,
      orderDate: poData.orderDate,
      expectedDeliveryDate: poData.expectedDeliveryDate,
      items: itemsWithDetails,
      subtotal,
      taxAmount,
      totalAmount,
      status: 'Draft',
      notes: poData.notes,
      createdAt: new Date().toISOString(),
    };
    setPurchaseOrders(prev => [...prev, newPO].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
  }, [getSupplierById, getProductById]);

  const updatePurchaseOrder = useCallback((updatedPO: PurchaseOrder) => {
    setPurchaseOrders(prev =>
        prev.map(po => {
            if (po.id === updatedPO.id) {
                const itemsWithTotals = updatedPO.items.map(item => ({
                    ...item,
                    total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
                }));
                const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);
                const taxAmount = updatedPO.taxAmount || 0;
                const totalAmount = subtotal + taxAmount;
                let finalStatus = updatedPO.status;
                if (finalStatus === 'Draft' && itemsWithTotals.length > 0 && updatedPO.supplierId) {
                    finalStatus = 'Sent';
                }
                return { ...updatedPO, items: itemsWithTotals, subtotal, totalAmount, status: finalStatus, updatedAt: new Date().toISOString() };
            }
            return po;
        }).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    );
  }, []);

  const deletePurchaseOrder = useCallback((poId: string) => {
    setPurchaseOrders(prev => prev.filter(po => po.id !== poId));
  }, []);

  const cancelPurchaseOrder = useCallback((poId: string) => {
    setPurchaseOrders(prev => prev.map(po => po.id === poId ? { ...po, status: 'Cancelled', updatedAt: new Date().toISOString() } : po));
  }, []);

  const processPOReceipt = useCallback((
    poId: string,
    receivedItemsData: Array<{ poItemId: string; productId: string; quantityNewlyReceived: number; warehouseId: string; itemUnitType: ProductUnitType }>
  ) => {
    setPurchaseOrders(prevPOs => {
        const poIndex = prevPOs.findIndex(p => p.id === poId);
        if (poIndex === -1) return prevPOs;

        const updatedPO = JSON.parse(JSON.stringify(prevPOs[poIndex])) as PurchaseOrder;
        let anyStockUpdatedThisTime = false;

        updatedPO.items = updatedPO.items.map((item) => {
            const receivedInfo = receivedItemsData.find(ri => ri.poItemId === item.id);
            if (receivedInfo && receivedInfo.quantityNewlyReceived > 0) {
                const product = getProductById(receivedInfo.productId);
                if (!product) return item;

                let quantityToReceiveInBaseUnits = receivedInfo.quantityNewlyReceived;
                if (receivedInfo.itemUnitType.toLowerCase() !== product.unitType.toLowerCase()) {
                    if (product.packagingUnit && receivedInfo.itemUnitType.toLowerCase() === product.packagingUnit.toLowerCase() && product.itemsPerPackagingUnit) {
                        quantityToReceiveInBaseUnits = receivedInfo.quantityNewlyReceived * product.itemsPerPackagingUnit;
                    } else if (receivedInfo.itemUnitType.toLowerCase() === 'pcs' && product.unitType.toLowerCase() !== 'pcs' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
                        quantityToReceiveInBaseUnits = receivedInfo.quantityNewlyReceived / product.piecesInBaseUnit;
                    } else if (product.unitType.toLowerCase() === 'pcs' && product.piecesInBaseUnit === 1 && product.packagingUnit && receivedInfo.itemUnitType.toLowerCase() === product.packagingUnit.toLowerCase() && product.itemsPerPackagingUnit) {
                         quantityToReceiveInBaseUnits = receivedInfo.quantityNewlyReceived * product.itemsPerPackagingUnit;
                    }
                }

                const currentStockInWarehouse = getStockForProductInWarehouse(item.productId, receivedInfo.warehouseId);
                upsertProductStockLocation(
                    { productId: item.productId, warehouseId: receivedInfo.warehouseId, stockLevel: currentStockInWarehouse + quantityToReceiveInBaseUnits },
                    'PO Receipt',
                    `PO: ${poId} / Item: ${item.productId}`
                );
                anyStockUpdatedThisTime = true;
                return {
                    ...item,
                    quantityReceived: (item.quantityReceived || 0) + receivedInfo.quantityNewlyReceived,
                };
            }
            return item;
        });

        if (anyStockUpdatedThisTime) {
            const allItemsReceived = updatedPO.items.every(item => (item.quantityReceived || 0) >= item.quantity);
            if (allItemsReceived) {
                updatedPO.status = 'Fully Received';
            } else if (updatedPO.items.some(item => (item.quantityReceived || 0) > 0)) {
                 updatedPO.status = 'Partially Received';
            }
        }
        updatedPO.updatedAt = new Date().toISOString();
        const newPOs = [...prevPOs];
        newPOs[poIndex] = updatedPO;
        return newPOs.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    });
  }, [getProductById, getStockForProductInWarehouse, upsertProductStockLocation]);

  const addSalesperson = useCallback((salespersonData: Omit<Salesperson, 'id' | 'createdAt'>) => {
    const newSalesperson: Salesperson = {
      ...salespersonData,
      id: `SP-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
      createdAt: new Date().toISOString(),
    };
    setSalespeople(prev => [...prev, newSalesperson].sort((a,b) => a.name.localeCompare(b.name)));
  }, []);

  const updateSalesperson = useCallback((updatedSalesperson: Salesperson) => {
    setSalespeople(prev => prev.map(sp => sp.id === updatedSalesperson.id ? updatedSalesperson : sp).sort((a,b) => a.name.localeCompare(b.name)));
  }, []);

  const deleteSalesperson = useCallback((salespersonId: string) => {
    setSalespeople(prev => prev.filter(sp => sp.id !== salespersonId));
  }, []);

  const addSalesOrder = useCallback((orderData: Omit<SalesOrder, 'id' | 'createdAt' | 'status' | 'customerName' | 'salespersonName' | 'routeName' | 'subtotal' | 'totalAmount'> & { items: Array<Omit<SalesOrderItem, 'id'| 'total' | 'productName' | 'sourceWarehouseName'>> }) => {
    const customer = getCustomerById(orderData.customerId);
    const salesperson = orderData.salespersonId ? getSalespersonById(orderData.salespersonId) : undefined;

    const itemsWithDetails = orderData.items.map(item => {
        const product = getProductById(item.productId);
        const warehouse = item.sourceWarehouseId ? getWarehouseById(item.sourceWarehouseId) : undefined;
        return {
            ...item,
            id: `soi-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
            productName: product?.name || item.productId,
            sourceWarehouseName: warehouse?.name || item.sourceWarehouseId,
            total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        };
    });
    const subtotal = itemsWithDetails.reduce((sum, item) => sum + item.total, 0);

    const newOrder: SalesOrder = {
      id: `SO-${String(Date.now()).slice(-6)}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
      customerId: orderData.customerId,
      customerName: customer?.name || orderData.customerId,
      salespersonId: orderData.salespersonId,
      salespersonName: salesperson?.name || orderData.salespersonId,
      routeId: orderData.routeId, // Placeholder for route name
      routeName: orderData.routeId ? `Route ${orderData.routeId}` : undefined, // Placeholder for route name
      orderDate: orderData.orderDate,
      expectedDeliveryDate: orderData.expectedDeliveryDate,
      items: itemsWithDetails,
      subtotal: subtotal,
      totalAmount: subtotal,
      status: 'Draft',
      shippingAddress: orderData.shippingAddress || customer?.shippingAddress || customer?.billingAddress,
      billingAddress: orderData.billingAddress || customer?.billingAddress,
      notes: orderData.notes,
      createdAt: new Date().toISOString(),
    };
    setSalesOrders(prev => [...prev, newOrder].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
  }, [getCustomerById, getSalespersonById, getProductById, getWarehouseById]);

  const updateSalesOrder = useCallback((updatedOrder: SalesOrder) => {
     const itemsWithCalculatedTotals = updatedOrder.items.map(item => ({
        ...item,
        total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
     }));
     const newSubtotal = itemsWithCalculatedTotals.reduce((sum, item) => sum + item.total, 0);

     setSalesOrders(prev =>
      prev.map(order =>
        order.id === updatedOrder.id
          ? { ...updatedOrder, items: itemsWithCalculatedTotals, subtotal: newSubtotal, totalAmount: newSubtotal, updatedAt: new Date().toISOString() }
          : order
      ).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    );
  }, []);

  const deleteSalesOrder = useCallback((orderId: string) => {
    setSalesOrders(prev => prev.filter(order => order.id !== orderId));
  }, []);


  return (
    <DataContext.Provider
      value={{
        customers, invoices, products, warehouses, productStockLocations, stockTransactions, suppliers, purchaseOrders, salespeople, salesOrders, companyProfile, isLoading,
        addCustomer, updateCustomer, deleteCustomer,
        addInvoice, updateInvoice, deleteInvoice,
        updateCompanyProfile,
        getInvoicesByCustomerId, getCustomerById, getInvoiceById, getProductById, getWarehouseById, getOutstandingBalanceByCustomerId, getSupplierById, getPurchaseOrderById, getSalespersonById, getSalesOrderById,
        addProduct, updateProduct, deleteProduct,
        addWarehouse, updateWarehouse, deleteWarehouse,
        upsertProductStockLocation, addStockTransaction,
        getTotalStockForProduct, getStockForProductInWarehouse,
        addSupplier, updateSupplier, deleteSupplier,
        addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, cancelPurchaseOrder,
        processPOReceipt,
        addSalesperson, updateSalesperson, deleteSalesperson,
        addSalesOrder, updateSalesOrder, deleteSalesOrder,
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

    