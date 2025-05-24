
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
  SalesOrder, // Added
  SalesOrderStatus, // Added
  SalesOrderItem // Added
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
  MOCK_SALES_ORDERS // Added
} from '@/types';
import { toast } from '@/hooks/use-toast'; 

// --- Plain Helper Finder Functions ---
const findCustomerById = (customers: Customer[], customerId: string) => customers.find(c => c.id === customerId);
const findInvoiceById = (invoices: Invoice[], invoiceId: string) => invoices.find(i => i.id === invoiceId);
const findProductById = (products: Product[], productId: string) => products.find(p => p.id === productId);
const findWarehouseById = (warehouses: Warehouse[], warehouseId: string) => warehouses.find(wh => wh.id === warehouseId);
const findSupplierById = (suppliers: Supplier[], supplierId: string) => suppliers.find(s => s.id === supplierId);
const findPurchaseOrderById = (purchaseOrders: PurchaseOrder[], poId: string) => purchaseOrders.find(po => po.id === poId);
const findSalesOrderById = (salesOrders: SalesOrder[], soId: string) => salesOrders.find(so => so.id === soId); // Added

interface DataContextType {
  customers: Customer[];
  invoices: Invoice[];
  products: Product[];
  warehouses: Warehouse[];
  productStockLocations: ProductStockLocation[];
  stockTransactions: StockTransaction[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[]; // Added
  companyProfile: CompanyProfile | null;
  isLoading: boolean;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'customerName' | 'paymentHistory' | 'amountPaid' | 'remainingBalance'> & { items: Array<InvoiceItem & { sourceWarehouseId: string }>}) => void;
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
  addPurchaseOrder: (poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status' | 'subtotal' | 'taxAmount' | 'totalAmount' | 'supplierName' | 'items'> & { items: Array<Omit<PurchaseOrderItem, 'id' | 'total' | 'quantityReceived'>> }) => void;
  updatePurchaseOrder: (po: PurchaseOrder) => void;
  deletePurchaseOrder: (poId: string) => void;
  cancelPurchaseOrder: (poId: string) => void;
  getPurchaseOrderById: (poId: string) => PurchaseOrder | undefined;
  processPOReceipt: (poId: string, receivedItemsData: Array<{ poItemId: string; productId: string; quantityNewlyReceived: number; warehouseId: string; itemUnitType: ProductUnitType }>) => void;
  addSalesOrder: (orderData: Omit<SalesOrder, 'id' | 'createdAt' | 'status' | 'totalAmount' | 'customerName' | 'salespersonName' | 'routeName'>) => void; // Added
  updateSalesOrder: (order: SalesOrder) => void; // Added
  deleteSalesOrder: (orderId: string) => void; // Added
  getSalesOrderById: (orderId: string) => SalesOrder | undefined; // Added
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
  SALES_ORDERS: 'invoiceflow_sales_orders', // Added
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
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]); // Added
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data Loading Effect
  useEffect(() => {
    setIsLoading(true);
    try {
      const loadItem = <T,>(key: string, fallback: T[]): T[] => {
        const stored = localStorage.getItem(key);
        try {
          return stored ? JSON.parse(stored) : fallback;
        } catch (parseError) {
          console.warn(`DataContext: Failed to parse item ${key} from localStorage, using fallback:`, parseError);
          return fallback;
        }
      };
      const loadSingleItem = <T,>(key: string, fallback: T): T => {
        const stored = localStorage.getItem(key);
         try {
          return stored ? JSON.parse(stored) : fallback;
        } catch (parseError) {
          console.warn(`DataContext: Failed to parse single item ${key} from localStorage, using fallback:`, parseError);
          return fallback;
        }
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
      setSalesOrders(loadItem(LOCAL_STORAGE_KEYS.SALES_ORDERS, MOCK_SALES_ORDERS)); // Added

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
      setSalesOrders(MOCK_SALES_ORDERS); // Added
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
  useEffect(() => { if (!isLoading) localStorage.setItem(LOCAL_STORAGE_KEYS.SALES_ORDERS, JSON.stringify(salesOrders)); }, [salesOrders, isLoading]); // Added

  // --- Memoized Getter Functions ---
  const getCustomerById = useCallback((customerId: string) => findCustomerById(customers, customerId), [customers]);
  const getInvoiceById = useCallback((invoiceId: string) => findInvoiceById(invoices, invoiceId), [invoices]);
  const getProductById = useCallback((productId: string) => findProductById(products, productId), [products]);
  const getWarehouseById = useCallback((warehouseId: string) => findWarehouseById(warehouses, warehouseId), [warehouses]);
  const getSupplierById = useCallback((supplierId: string) => findSupplierById(suppliers, supplierId), [suppliers]);
  const getPurchaseOrderById = useCallback((poId: string) => findPurchaseOrderById(purchaseOrders, poId), [purchaseOrders]);
  const getSalesOrderById = useCallback((soId: string) => findSalesOrderById(salesOrders, soId), [salesOrders]); // Added

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
            reason: reason as StockAdjustmentReason, // This is fine, as reason for adjustment IS the reason
            reference,
          });
        }
        return updatedPsl.sort((a, b) => (a.productId + a.warehouseId).localeCompare(b.productId + b.warehouseId));
      } else { 
        const newPsl: ProductStockLocation = {
          id: `PSL-${productId}-${warehouseId}-${Date.now()}`,
          productId,
          warehouseId,
          stockLevel: newStockLevel,
        };
        quantityChange = newStockLevel;

        if (['Transfer In', 'PO Receipt', 'Initial Stock Entry', 'Production Output'].includes(reason)) {
            transactionTypeForLog = reason as StockTransactionType;
        } else if (reason === 'Sale') { // Should not typically happen for a new stock location via sale.
             transactionTypeForLog = 'Sale';
        }
         else {
            transactionTypeForLog = quantityChange > 0 ? 'Adjustment - Increase' : 'Adjustment - Decrease';
        }
        
        if (quantityChange !== 0) { 
          addStockTransaction({
            productId,
            warehouseId,
            type: transactionTypeForLog,
            quantityChange,
            newStockLevelAfterTransaction: newStockLevel,
            reason: reason as StockAdjustmentReason,
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
    quantityToDeduct: number, // This quantity is already in product's base units
    invoiceId: string
  ) => {
    if (quantityToDeduct <= 0) return;
    const currentStock = getStockForProductInWarehouse(productId, sourceWarehouseId);
    const newStockLevel = Math.max(0, currentStock - quantityToDeduct);
    const actualDeductedQuantity = currentStock - newStockLevel;

    if (actualDeductedQuantity > 0) {
        upsertProductStockLocation(
          { productId, warehouseId: sourceWarehouseId, stockLevel: newStockLevel },
          'Sale',
          `Invoice ${invoiceId}`
        );
    } else if (quantityToDeduct > 0) {
        console.warn(`Insufficient stock for product ${productId} in warehouse ${sourceWarehouseId} to fulfill invoice ${invoiceId}. Tried to deduct ${quantityToDeduct}, only ${actualDeductedQuantity} was possible.`);
        toast({
            title: "Stock Alert",
            description: `Insufficient stock for an item on invoice ${invoiceId}. Actual stock for product ${productId} in warehouse ${sourceWarehouseId} is ${currentStock}.`,
            variant: "destructive"
        });
    }
  }, [getStockForProductInWarehouse, upsertProductStockLocation]);

  const returnStockForInvoiceItem = useCallback((
    productId: string,
    sourceWarehouseId: string, 
    quantityToReturn: number, // This quantity is already in product's base units
    invoiceId: string
  ) => {
    if (quantityToReturn <= 0) return;
    const currentStock = getStockForProductInWarehouse(productId, sourceWarehouseId);
    const newStockLevel = currentStock + quantityToReturn;
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
    // Consider deleting associated invoices or reassigning - for now, just customer deletion
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

  const addInvoice = useCallback((invoiceData: Omit<Invoice, 'customerName' | 'paymentHistory' | 'amountPaid' | 'remainingBalance'> & { items: Array<InvoiceItem & { sourceWarehouseId: string }>}) => {
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
            // Case 1: Invoice item is in a LARGER packaging unit than product's base unit (e.g., selling Cartons, product base unit is PCS)
            if (productDetails.unitType.toLowerCase() === 'pcs' && productDetails.packagingUnit?.toLowerCase() === item.unitType.toLowerCase() && productDetails.itemsPerPackagingUnit && productDetails.itemsPerPackagingUnit > 0) {
              quantityToDeductInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
            }
            // Case 2: Invoice item is in PCS, but product's base unit is a package (e.g., selling PCS, product base unit is Cartons)
            else if (item.unitType.toLowerCase() === 'pcs' && productDetails.unitType.toLowerCase() !== 'pcs' && productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0) {
              quantityToDeductInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
            }
          }
          if (quantityToDeductInBaseUnits > 0) {
            deductStockForInvoiceItem(item.productId, item.sourceWarehouseId, quantityToDeductInBaseUnits, newInvoice.id);
          }
        } else if (productDetails && item.productId && !item.sourceWarehouseId && newInvoice.items.length > 0) {
            console.warn(`Invoice item ${item.description} for invoice ${newInvoice.id} is missing a source warehouse. Stock not deducted.`);
            toast({ title: "Stock Deduction Skipped", description: `Item "${item.description}" on invoice ${newInvoice.id} is missing source warehouse.`, variant: "default" });
        }
      });
    }
  }, [getCustomerById, getProductById, deductStockForInvoiceItem]);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    const originalInvoice = invoices.find(inv => inv.id === updatedInvoice.id);

    if (originalInvoice && originalInvoice.status !== 'Cancelled') {
      originalInvoice.items.forEach(item => {
        const productDetails = getProductById(item.productId || '');
        if (productDetails && item.productId && item.sourceWarehouseId) {
           let quantityToReturnInBaseUnits = item.quantity;
           if (item.unitType.toLowerCase() !== productDetails.unitType.toLowerCase()) {
             if (productDetails.unitType.toLowerCase() === 'pcs' && productDetails.packagingUnit?.toLowerCase() === item.unitType.toLowerCase() && productDetails.itemsPerPackagingUnit && productDetails.itemsPerPackagingUnit > 0) {
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
              if (productDetails.unitType.toLowerCase() === 'pcs' && productDetails.packagingUnit?.toLowerCase() === item.unitType.toLowerCase() && productDetails.itemsPerPackagingUnit && productDetails.itemsPerPackagingUnit > 0) {
                quantityToDeductInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
              } else if (item.unitType.toLowerCase() === 'pcs' && productDetails.unitType.toLowerCase() !== 'pcs' && productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0) {
                quantityToDeductInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
              }
            }
           if (quantityToDeductInBaseUnits > 0) {
             deductStockForInvoiceItem(item.productId, item.sourceWarehouseId, quantityToDeductInBaseUnits, updatedInvoice.id);
           }
         } else if (productDetails && item.productId && !item.sourceWarehouseId && updatedInvoice.items.length > 0) {
             console.warn(`Updated invoice item ${item.description} for invoice ${updatedInvoice.id} is missing a source warehouse. Stock not deducted.`);
             toast({ title: "Stock Deduction Skipped", description: `Item "${item.description}" on updated invoice ${updatedInvoice.id} is missing source warehouse.`, variant: "default" });
         }
      });
    }
    setInvoices((prev) => prev.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i)).sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));
  }, [invoices, getProductById, deductStockForInvoiceItem, returnStockForInvoiceItem]);

  const deleteInvoice = useCallback((invoiceId: string) => {
    const invoiceToDelete = invoices.find(inv => inv.id === invoiceId);
    if (invoiceToDelete && invoiceToDelete.status !== 'Cancelled') {
        invoiceToDelete.items.forEach(item => {
            const productDetails = getProductById(item.productId || '');
            if (productDetails && item.productId && item.sourceWarehouseId) {
                let quantityToReturnInBaseUnits = item.quantity;
                if (item.unitType.toLowerCase() !== productDetails.unitType.toLowerCase()) {
                  if (productDetails.unitType.toLowerCase() === 'pcs' && productDetails.packagingUnit?.toLowerCase() === item.unitType.toLowerCase() && productDetails.itemsPerPackagingUnit && productDetails.itemsPerPackagingUnit > 0) {
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

  const addPurchaseOrder = useCallback((poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status' | 'subtotal' | 'taxAmount' | 'totalAmount' | 'supplierName' | 'items'> & { items: Array<Omit<PurchaseOrderItem, 'id'| 'total' | 'quantityReceived'>> }) => {
    const supplier = getSupplierById(poData.supplierId);
    const itemsWithTotalsAndReceived = poData.items.map(item => ({
        ...item,
        id: item.id || `poi-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
        total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        quantityReceived: 0,
    }));
    const subtotal = itemsWithTotalsAndReceived.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = 0;
    const totalAmount = subtotal + taxAmount;
    const newPO: PurchaseOrder = {
      ...poData,
      id: `PO-${String(Date.now()).slice(-6)}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
      supplierName: supplier?.name || poData.supplierId,
      createdAt: new Date().toISOString(),
      status: 'Draft',
      items: itemsWithTotalsAndReceived,
      subtotal,
      taxAmount,
      totalAmount,
    };
    setPurchaseOrders(prev => [...prev, newPO].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
  }, [getSupplierById]);

  const updatePurchaseOrder = useCallback((updatedPO: PurchaseOrder) => {
    const itemsWithTotals = updatedPO.items.map(item => ({
        ...item,
        total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    }));
    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = updatedPO.taxAmount || 0;
    const totalAmount = subtotal + taxAmount;

    let finalStatus = updatedPO.status;
    if (updatedPO.status === 'Draft' && itemsWithTotals.length > 0 && updatedPO.supplierId) {
        finalStatus = 'Sent';
    }

    setPurchaseOrders(prev =>
        prev.map(po =>
            po.id === updatedPO.id
            ? {
                ...updatedPO,
                items: itemsWithTotals,
                subtotal,
                totalAmount,
                status: finalStatus,
                updatedAt: new Date().toISOString()
              }
            : po
        ).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
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
                // Convert PO item unit to product's base unit for stock update
                if (receivedInfo.itemUnitType.toLowerCase() !== product.unitType.toLowerCase()) {
                    // Scenario 1: PO is in a larger package (e.g., Cartons), product base unit is PCS
                    if (product.unitType.toLowerCase() === 'pcs' && product.packagingUnit?.toLowerCase() === receivedInfo.itemUnitType.toLowerCase() && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                        quantityToReceiveInBaseUnits = receivedInfo.quantityNewlyReceived * product.itemsPerPackagingUnit;
                    }
                    // Scenario 2: PO is in PCS, product base unit is a package (e.g., Cartons)
                    else if (receivedInfo.itemUnitType.toLowerCase() === 'pcs' && product.unitType.toLowerCase() !== 'pcs' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
                         quantityToReceiveInBaseUnits = receivedInfo.quantityNewlyReceived / product.piecesInBaseUnit;
                    }
                    // Add other conversion logic if needed
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
            } else {
                updatedPO.status = 'Partially Received';
            }
        }

        updatedPO.updatedAt = new Date().toISOString();
        const newPOs = [...prevPOs];
        newPOs[poIndex] = updatedPO;
        return newPOs.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    });
  }, [getProductById, upsertProductStockLocation, getStockForProductInWarehouse]);

  // --- Sales Order CRUD Placeholders ---
  const addSalesOrder = useCallback((orderData: Omit<SalesOrder, 'id' | 'createdAt' | 'status' | 'totalAmount' | 'customerName' | 'salespersonName' | 'routeName'>) => {
    const customer = getCustomerById(orderData.customerId);
    const itemsWithTotals = orderData.items.map(item => ({
      ...item,
      id: item.id || `soi-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
      total: (item.quantity || 0) * (item.unitPrice || 0),
    }));
    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);

    const newOrder: SalesOrder = {
      ...orderData,
      id: `SO-${String(Date.now()).slice(-6)}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
      customerName: customer?.name || orderData.customerId,
      salespersonName: orderData.salespersonId ? `Salesperson ${orderData.salespersonId}` : 'N/A', // Placeholder
      routeName: orderData.routeId ? `Route ${orderData.routeId}` : 'N/A', // Placeholder
      createdAt: new Date().toISOString(),
      status: 'Draft',
      items: itemsWithTotals,
      subtotal: subtotal,
      totalAmount: subtotal, // Assuming no SO-specific taxes/discounts for now
    };
    setSalesOrders(prev => [...prev, newOrder].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
  }, [getCustomerById]);

  const updateSalesOrder = useCallback((updatedOrder: SalesOrder) => {
     const itemsWithTotals = updatedOrder.items.map(item => ({
      ...item,
      total: (item.quantity || 0) * (item.unitPrice || 0),
    }));
    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);

    setSalesOrders(prev =>
      prev.map(order =>
        order.id === updatedOrder.id
          ? { ...updatedOrder, items: itemsWithTotals, subtotal: subtotal, totalAmount: subtotal, updatedAt: new Date().toISOString() }
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
        customers, invoices, products, warehouses, productStockLocations, stockTransactions, suppliers, purchaseOrders, salesOrders, companyProfile, isLoading,
        addCustomer, updateCustomer, deleteCustomer,
        addInvoice, updateInvoice, deleteInvoice,
        updateCompanyProfile,
        getInvoicesByCustomerId, getCustomerById, getInvoiceById, getProductById, getWarehouseById, getOutstandingBalanceByCustomerId, getSupplierById, getPurchaseOrderById, getSalesOrderById,
        addProduct, updateProduct, deleteProduct,
        addWarehouse, updateWarehouse, deleteWarehouse,
        upsertProductStockLocation, addStockTransaction,
        getTotalStockForProduct, getStockForProductInWarehouse,
        addSupplier, updateSupplier, deleteSupplier,
        addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, cancelPurchaseOrder,
        processPOReceipt,
        addSalesOrder, updateSalesOrder, deleteSalesOrder, // Added
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
