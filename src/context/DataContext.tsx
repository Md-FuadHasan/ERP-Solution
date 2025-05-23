
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

// Plain helper finder functions (defined outside the component)
const findCustomerById = (customers: Customer[], customerId: string) => customers.find(c => c.id === customerId);
const findInvoiceById = (invoices: Invoice[], invoiceId: string) => invoices.find(i => i.id === invoiceId);
const findProductById = (products: Product[], productId: string) => products.find(p => p.id === productId);
const findWarehouseById = (warehouses: Warehouse[], warehouseId: string) => warehouses.find(wh => wh.id === warehouseId);
const findSupplierById = (suppliers: Supplier[], supplierId: string) => suppliers.find(s => s.id === supplierId);
const findPurchaseOrderById = (purchaseOrders: PurchaseOrder[], poId: string) => purchaseOrders.find(po => po.id === poId);


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
  addInvoice: (invoice: Omit<Invoice, 'customerName' | 'paymentHistory' | 'amountPaid' | 'remainingBalance'>) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (invoiceId: string) => void;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => void;
  getInvoicesByCustomerId: (customerId: string) => Invoice[];
  getCustomerById: (customerId: string) => Customer | undefined;
  getInvoiceById: (invoiceId: string) => Invoice | undefined;
  getOutstandingBalanceByCustomerId: (customerId: string) => number;
  addProduct: (product: Omit<Product, 'createdAt' | 'id' | 'stockLevel'>) => void;
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
  getTotalStockForProduct: (productId: string) => number;
  getStockForProductInWarehouse: (productId: string, warehouseId: string) => number;
  addStockTransaction: (transaction: Omit<StockTransaction, 'id' | 'date' | 'productName' | 'warehouseName'>) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  getSupplierById: (supplierId: string) => Supplier | undefined;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status' | 'subtotal' | 'taxAmount' | 'totalAmount' | 'supplierName' | 'items'> & { items: Array<Omit<PurchaseOrderItem, 'total' | 'quantityReceived'>> }) => void;
  updatePurchaseOrder: (po: PurchaseOrder) => void;
  deletePurchaseOrder: (poId: string) => void;
  cancelPurchaseOrder: (poId: string) => void;
  getPurchaseOrderById: (poId: string) => PurchaseOrder | undefined;
  processPOReceipt: (poId: string, receivedItemsData: Array<{ poItemId: string; productId: string; quantityNewlyReceived: number; warehouseId: string; itemUnitType: ProductUnitType }>) => void;
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

  // --- Getter Functions ---
  const getCustomerById = useCallback((customerId: string) => findCustomerById(customers, customerId), [customers]);
  const getInvoiceById = useCallback((invoiceId: string) => findInvoiceById(invoices, invoiceId), [invoices]);
  const getProductById = useCallback((productId: string) => findProductById(products, productId), [products]);
  const getWarehouseById = useCallback((warehouseId: string) => findWarehouseById(warehouses, warehouseId), [warehouses]);
  const getSupplierById = useCallback((supplierId: string) => findSupplierById(suppliers, supplierId), [suppliers]);
  const getPurchaseOrderById = useCallback((poId: string) => findPurchaseOrderById(purchaseOrders, poId), [purchaseOrders]);
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
        updatedPsl[existingIndex] = { ...updatedPsl[existingIndex], stockLevel: newStockLevel };

        if (['Transfer Out', 'Transfer In', 'PO Receipt', 'Sale', 'Sale Return'].includes(reason)) {
          transactionTypeForLog = reason as StockTransactionType;
        } else {
          transactionTypeForLog = quantityChange >= 0 ? 'Adjustment - Increase' : 'Adjustment - Decrease';
        }
        
        addStockTransaction({
          productId,
          warehouseId,
          type: transactionTypeForLog,
          quantityChange,
          newStockLevelAfterTransaction: newStockLevel,
          reason: reason as StockAdjustmentReason, 
          reference,
        });
        return updatedPsl.sort((a, b) => (a.productId + a.warehouseId).localeCompare(b.productId + b.warehouseId));
      } else {
        const newPsl: ProductStockLocation = {
          id: `PSL-${productId}-${warehouseId}-${Date.now()}`,
          productId,
          warehouseId,
          stockLevel: newStockLevel,
        };
        quantityChange = newStockLevel;

        if (['Transfer In', 'PO Receipt', 'Initial Stock Entry'].includes(reason)) {
            transactionTypeForLog = reason as StockTransactionType;
        } else {
            transactionTypeForLog = 'Adjustment - Increase'; 
        }
        
        addStockTransaction({
          productId,
          warehouseId,
          type: transactionTypeForLog,
          quantityChange,
          newStockLevelAfterTransaction: newStockLevel,
          reason: reason as StockAdjustmentReason,
          reference,
        });
        return [...prev, newPsl].sort((a, b) => (a.productId + a.warehouseId).localeCompare(b.productId + b.warehouseId));
      }
    });
  }, [addStockTransaction]);

  // --- Stock Deduction/Return for Invoices ---
  const deductStockForInvoiceItem = useCallback((
    productId: string,
    warehouseId: string,
    quantityToDeductInBaseUnits: number,
    invoiceId: string
  ) => {
    if (quantityToDeductInBaseUnits <= 0) return;
    const currentStock = getStockForProductInWarehouse(productId, warehouseId);
    const newStockLevel = Math.max(0, currentStock - quantityToDeductInBaseUnits);
    const actualDeductedQuantity = currentStock - newStockLevel; 

    if (actualDeductedQuantity > 0) {
        upsertProductStockLocation(
          { productId, warehouseId, stockLevel: newStockLevel },
          'Sale',
          `Invoice ${invoiceId}`
        );
    }
  }, [getStockForProductInWarehouse, upsertProductStockLocation]);

  const returnStockForInvoiceItem = useCallback((
    productId: string,
    warehouseId: string,
    quantityToReturnInBaseUnits: number,
    invoiceId: string
  ) => {
    if (quantityToReturnInBaseUnits <= 0) return;
    const currentStock = getStockForProductInWarehouse(productId, warehouseId);
    const newStockLevel = currentStock + quantityToReturnInBaseUnits;
    upsertProductStockLocation(
      { productId, warehouseId, stockLevel: newStockLevel },
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

  const addProduct = useCallback((productData: Omit<Product, 'createdAt' | 'id' | 'stockLevel'>) => {
    const newProduct: Product = {
     ...productData,
     id: `PROD${String(Date.now()).slice(-5)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
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
  
  const addInvoice = useCallback((invoiceData: Omit<Invoice, 'customerName' | 'paymentHistory' | 'amountPaid' | 'remainingBalance'>) => {
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
        if (productDetails && item.productId) {
          let quantityToDeductInBaseUnits = item.quantity;
          if (item.unitType.toLowerCase() !== productDetails.unitType.toLowerCase()) {
            if (productDetails.packagingUnit?.toLowerCase() === item.unitType.toLowerCase() && productDetails.itemsPerPackagingUnit && productDetails.itemsPerPackagingUnit > 0) {
              quantityToDeductInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
            } else if (item.unitType.toLowerCase() === 'pcs' && productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0 && productDetails.unitType.toLowerCase() !== 'pcs') {
              quantityToDeductInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
            }
          }
          const sourceWarehouse = productStockLocations.find(psl => psl.productId === item.productId && psl.stockLevel >= quantityToDeductInBaseUnits) || productStockLocations.find(psl => psl.productId === item.productId);
          const sourceWarehouseId = sourceWarehouse ? sourceWarehouse.warehouseId : (warehouses.length > 0 ? warehouses[0].id : undefined);

          if (sourceWarehouseId && quantityToDeductInBaseUnits > 0) {
            deductStockForInvoiceItem(item.productId, sourceWarehouseId, quantityToDeductInBaseUnits, newInvoice.id);
          }
        }
      });
    }
  }, [getCustomerById, getProductById, warehouses, productStockLocations, deductStockForInvoiceItem]); 

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    const originalInvoice = invoices.find(inv => inv.id === updatedInvoice.id);
    
    if (originalInvoice && originalInvoice.status !== 'Cancelled') {
      originalInvoice.items.forEach(item => {
        const productDetails = getProductById(item.productId || '');
        if (productDetails && item.productId) {
           let quantityToReturnInBaseUnits = item.quantity;
           if (item.unitType.toLowerCase() !== productDetails.unitType.toLowerCase()) {
             if (productDetails.packagingUnit?.toLowerCase() === item.unitType.toLowerCase() && productDetails.itemsPerPackagingUnit && productDetails.itemsPerPackagingUnit > 0) {
               quantityToReturnInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
             } else if (item.unitType.toLowerCase() === 'pcs' && productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0 && productDetails.unitType.toLowerCase() !== 'pcs') {
               quantityToReturnInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
             }
           }
          const sourceWarehouse = productStockLocations.find(psl => psl.productId === item.productId);
          const sourceWarehouseId = sourceWarehouse ? sourceWarehouse.warehouseId : (warehouses.length > 0 ? warehouses[0].id : undefined);
          if (sourceWarehouseId && quantityToReturnInBaseUnits > 0) {
            returnStockForInvoiceItem(item.productId, sourceWarehouseId, quantityToReturnInBaseUnits, updatedInvoice.id);
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
              if (productDetails.packagingUnit?.toLowerCase() === item.unitType.toLowerCase() && productDetails.itemsPerPackagingUnit && productDetails.itemsPerPackagingUnit > 0) {
                quantityToDeductInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
              } else if (item.unitType.toLowerCase() === 'pcs' && productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0 && productDetails.unitType.toLowerCase() !== 'pcs') {
                quantityToDeductInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
              }
            }
            const sourceWarehouse = productStockLocations.find(psl => psl.productId === item.productId && psl.stockLevel >= quantityToDeductInBaseUnits)  || productStockLocations.find(psl => psl.productId === item.productId);
            const sourceWarehouseId = sourceWarehouse ? sourceWarehouse.warehouseId : (warehouses.length > 0 ? warehouses[0].id : undefined);
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
                if (item.unitType.toLowerCase() !== productDetails.unitType.toLowerCase()) {
                  if (productDetails.packagingUnit?.toLowerCase() === item.unitType.toLowerCase() && productDetails.itemsPerPackagingUnit && productDetails.itemsPerPackagingUnit > 0) {
                    quantityToReturnInBaseUnits = item.quantity * productDetails.itemsPerPackagingUnit;
                  } else if (item.unitType.toLowerCase() === 'pcs' && productDetails.piecesInBaseUnit && productDetails.piecesInBaseUnit > 0 && productDetails.unitType.toLowerCase() !== 'pcs') {
                    quantityToReturnInBaseUnits = item.quantity / productDetails.piecesInBaseUnit;
                  }
                }
                const sourceWarehouse = productStockLocations.find(psl => psl.productId === item.productId); 
                const sourceWarehouseId = sourceWarehouse ? sourceWarehouse.warehouseId : (warehouses.length > 0 ? warehouses[0].id : undefined);
                 if (sourceWarehouseId && quantityToReturnInBaseUnits > 0) {
                    returnStockForInvoiceItem(item.productId, sourceWarehouseId, quantityToReturnInBaseUnits, invoiceToDelete.id);
                 }
            }
        });
    }
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
  }, [invoices, getProductById, warehouses, productStockLocations, returnStockForInvoiceItem]);
  
  const updateCompanyProfile = useCallback((profileUpdate: Partial<CompanyProfile>) => {
    setCompanyProfile(prev => ({ ...(prev || MOCK_COMPANY_PROFILE), ...profileUpdate }));
  }, []);

  const addPurchaseOrder = useCallback((poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status' | 'subtotal' | 'taxAmount' | 'totalAmount' | 'supplierName' | 'items'> & { items: Array<Omit<PurchaseOrderItem, 'total' | 'quantityReceived'>> }) => {
    const supplier = getSupplierById(poData.supplierId);
    const itemsWithTotalsAndReceived = poData.items.map(item => ({
        ...item,
        id: item.id || `poi-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
        total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        quantityReceived: 0,
    }));
    const subtotal = itemsWithTotalsAndReceived.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = 0; // Assuming no tax on PO for now
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
    const taxAmount = updatedPO.taxAmount || 0; // Preserve if exists, else 0
    const totalAmount = subtotal + taxAmount;

    let finalStatus = updatedPO.status;
    if (updatedPO.status === 'Draft' && itemsWithTotals.length > 0) {
        finalStatus = 'Sent'; // Auto-transition from Draft to Sent if items exist
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

        const updatedPO = JSON.parse(JSON.stringify(prevPOs[poIndex])); 
        let anyStockUpdatedThisTime = false;

        updatedPO.items = updatedPO.items.map((item: PurchaseOrderItem) => {
            const receivedInfo = receivedItemsData.find(ri => ri.poItemId === item.id);
            if (receivedInfo && receivedInfo.quantityNewlyReceived > 0) {
                const product = getProductById(receivedInfo.productId);
                if (!product) return item;

                let quantityInBaseUnits = receivedInfo.quantityNewlyReceived;
                if (receivedInfo.itemUnitType.toLowerCase() !== product.unitType.toLowerCase()) {
                    if (product.packagingUnit?.toLowerCase() === receivedInfo.itemUnitType.toLowerCase() && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
                         quantityInBaseUnits = receivedInfo.quantityNewlyReceived * product.itemsPerPackagingUnit; // PO was for larger packages, convert to base for stock
                    } else if (receivedInfo.itemUnitType.toLowerCase() === 'pcs' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0 && product.unitType.toLowerCase() !== 'pcs') {
                         quantityInBaseUnits = receivedInfo.quantityNewlyReceived / product.piecesInBaseUnit; // PO was for PCS, product stocked in packages
                    }
                }
                
                upsertProductStockLocation(
                    { productId: item.productId, warehouseId: receivedInfo.warehouseId, stockLevel: getStockForProductInWarehouse(item.productId, receivedInfo.warehouseId) + quantityInBaseUnits },
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

        if (anyStockUpdatedThisTime) { // Only update status if something was actually received in this transaction
            const allItemsReceived = updatedPO.items.every((item: PurchaseOrderItem) => (item.quantityReceived || 0) >= item.quantity);
            if (allItemsReceived) {
                updatedPO.status = 'Fully Received';
            } else { // If not all fully received, but some were received this time or previously
                updatedPO.status = 'Partially Received';
            }
        }
        
        updatedPO.updatedAt = new Date().toISOString();
        const newPOs = [...prevPOs];
        newPOs[poIndex] = updatedPO;
        return newPOs.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    });
  }, [getProductById, upsertProductStockLocation, getStockForProductInWarehouse]);


  return (
    <DataContext.Provider
      value={{
        customers, invoices, products, warehouses, productStockLocations, stockTransactions, suppliers, purchaseOrders, companyProfile, isLoading,
        addCustomer, updateCustomer, deleteCustomer,
        addInvoice, updateInvoice, deleteInvoice,
        updateCompanyProfile,
        getInvoicesByCustomerId, getCustomerById, getInvoiceById, getProductById, getWarehouseById, getOutstandingBalanceByCustomerId, getSupplierById, getPurchaseOrderById,
        addProduct, updateProduct, deleteProduct,
        addWarehouse, updateWarehouse, deleteWarehouse,
        upsertProductStockLocation, addStockTransaction,
        getTotalStockForProduct, getStockForProductInWarehouse,
        addSupplier, updateSupplier, deleteSupplier,
        addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, cancelPurchaseOrder,
        processPOReceipt,
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


    