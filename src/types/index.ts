
export type CustomerType = 'Credit' | 'Cash';
export const CUSTOMER_TYPES: CustomerType[] = ['Credit', 'Cash'];

export type InvoiceAgingDays = 30 | 60 | 90 | 180;
export const INVOICE_AGING_OPTIONS: InvoiceAgingDays[] = [30, 60, 90, 180];

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress?: string;
  createdAt: string;
  customerType: CustomerType;
  creditLimit?: number;
  invoiceAgingDays?: InvoiceAgingDays;
  registrationNumber?: string;
  vatNumber?: string;
}

export interface InvoiceItem {
  id:string;
  productId?: string;
  description: string;
  quantity: number;
  // unitPrice on invoice item = product.basePrice + product.exciseTax (for the chosen selling unit, before invoice-level VAT).
  unitPrice: number;
  total: number; // quantity * unitPrice
  unitType: 'Cartons' | 'PCS'; // Unit type for THIS line item
  sourceWarehouseId?: string; // ID of the warehouse this item's stock is drawn from
  sourceWarehouseName?: string; // Optional: For display convenience
}

export type PaymentProcessingStatus = 'Unpaid' | 'Partially Paid' | 'Fully Paid';
export const ALL_PAYMENT_PROCESSING_STATUSES: PaymentProcessingStatus[] = ['Unpaid', 'Partially Paid', 'Fully Paid'];

export type PaymentMethod = 'Cash' | 'Bank Transfer';
export const ALL_PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Bank Transfer'];

export interface PaymentRecord {
  id: string;
  paymentDate: string;
  amount: number;
  status: 'Full Payment' | 'Partial Payment';
  paymentMethod?: PaymentMethod;
  cashVoucherNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  onlineTransactionNumber?: string;
}

export type InvoiceStatus = 'Pending' | 'Partially Paid' | 'Overdue' | 'Paid' | 'Cancelled';
export const ALL_INVOICE_STATUSES: InvoiceStatus[] = ['Pending', 'Partially Paid', 'Overdue', 'Paid', 'Cancelled'];

export interface Invoice {
  id: string;
  customerId: string;
  customerName?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  // Subtotal = Sum of all (item.quantity * item.unitPrice), where item.unitPrice includes product base price + product excise tax.
  subtotal: number;
  taxAmount: number; // General tax on subtotal - should be 0 if VAT is the only primary consumption tax.
  // vatAmount = VAT on subtotal (which already includes product-specific excise taxes if unitPrice is set correctly).
  vatAmount: number;
  totalAmount: number; // subtotal + taxAmount (if any, likely 0) + vatAmount.
  status: InvoiceStatus;
  paymentProcessingStatus: PaymentProcessingStatus;
  amountPaid: number;
  remainingBalance: number;
  paymentHistory?: PaymentRecord[];
  paymentMethod?: PaymentMethod;
  cashVoucherNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  onlineTransactionNumber?: string;
}

export interface CompanyProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number | string; // General tax rate. Set to 0 if VAT is the primary tax.
  vatRate: number | string; // VAT rate e.g. 15 for 15%
  excessTaxRate?: number | string;
}

export interface Manager {
  id: string;
  name: string;
  email: string;
  role: string;
}
export const MOCK_MANAGERS: Manager[] = [];


export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface ReportSummary {
  summary: string;
  paymentTrends?: string;
  customerBalances?: string;
  actionableInsights?: string;
}

export type ProductCategory = 'Frozen' | 'Dairy' | 'Beverages' | 'Raw Materials' | 'Packaging';
export const PRODUCT_CATEGORIES: ProductCategory[] = ['Frozen', 'Dairy', 'Beverages', 'Raw Materials', 'Packaging'];

export type ProductUnitType = 'PCS' | 'Cartons' | 'Liters' | 'Kgs' | 'Units' | 'ML' | 'Pack';
export const PRODUCT_UNIT_TYPES: ProductUnitType[] = ['PCS', 'Cartons', 'Liters', 'Kgs', 'Units', 'ML', 'Pack'];


export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  unitType: ProductUnitType;      // This is the primary unit for stockLevel & basePrice/exciseTax.
  piecesInBaseUnit?: number;      // If unitType is a package (e.g., Carton), how many individual pieces (e.g., PCS) does it contain?
  packagingUnit?: string;         // Optional LARGER sales package (e.g., Pallet, if unitType is Carton).
  itemsPerPackagingUnit?: number; // Number of 'unitType's in one 'packagingUnit' (e.g., 20 Cartons in 1 Pallet).
  basePrice: number;              // Base selling price for one 'unitType' (BEFORE any taxes).
  costPrice: number;              // Cost per 'unitType'.
  exciseTax?: number;             // Excise tax amount PER 'unitType'.
  batchNo?: string;
  productionDate?: string; // ISO string
  expiryDate?: string;     // ISO string
  discountRate?: number;   // Percentage e.g., 10 for 10%
  createdAt?: string;
  globalReorderPoint?: number;   // General reorder threshold for the product across all locations, in 'unitType'.
}

export type WarehouseType = 'city_store' | 'production_store' | 'main_office_store';
export const WAREHOUSE_TYPES: WarehouseType[] = ['city_store', 'production_store', 'main_office_store'];

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  type: WarehouseType;
}

export interface ProductStockLocation {
  id: string;
  productId: string;
  warehouseId: string;
  stockLevel: number; // Stock in Product.unitType (base units)
}

export const STOCK_ADJUSTMENT_REASONS = [
  "Initial Stock Entry",
  "Stock Take Gain",
  "Stock Take Loss",
  "Damaged Goods",
  "Expired Goods",
  "Goods Received (Manual)",
  "Internal Consumption",
  "Promotion/Sample",
  "Other Increase",
  "Other Decrease",
] as const;
export type StockAdjustmentReason = typeof STOCK_ADJUSTMENT_REASONS[number];

export type StockTransactionType =
  | StockAdjustmentReason 
  | 'Transfer Out'
  | 'Transfer In'
  | 'Sale'
  | 'Sale Return' 
  | 'PO Receipt'
  | 'Production Output' 
  | 'Production Input Consumption'; 


export interface StockTransaction {
  id: string;
  productId: string;
  productName?: string;
  warehouseId: string;
  warehouseName?: string;
  type: StockTransactionType;
  quantityChange: number; 
  newStockLevelAfterTransaction: number; 
  date: string; // ISO string timestamp
  reason?: StockAdjustmentReason | string; 
  reference?: string; 
  userId?: string; 
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string; 
  productId: string;
  productName?: string; 
  quantity: number; 
  unitType: ProductUnitType; 
  unitPrice: number; 
  total: number; 
  quantityReceived?: number; 
}

export type POStatus = 'Draft' | 'Sent' | 'Partially Received' | 'Fully Received' | 'Cancelled';
export const ALL_PO_STATUSES: POStatus[] = ['Draft', 'Sent', 'Partially Received', 'Fully Received', 'Cancelled'];

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName?: string;
  orderDate: string; 
  expectedDeliveryDate?: string; 
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount?: number; 
  totalAmount: number;
  status: POStatus;
  notes?: string;
  createdAt: string; 
  updatedAt?: string; 
}

// Sales Order Types
export type SalesOrderStatus = 'Draft' | 'Confirmed' | 'Processing' | 'Ready for Dispatch' | 'Dispatched' | 'Partially Invoiced' | 'Fully Invoiced' | 'Cancelled';
export const ALL_SALES_ORDER_STATUSES: SalesOrderStatus[] = ['Draft', 'Confirmed', 'Processing', 'Ready for Dispatch', 'Dispatched', 'Partially Invoiced', 'Fully Invoiced', 'Cancelled'];

export interface SalesOrderItem {
  id: string; // Unique ID for this sales order item line
  productId: string;
  productName?: string; // For display convenience
  quantity: number;
  unitType: ProductUnitType; // e.g., PCS or Cartons
  // Unit price is BEFORE invoice-level VAT, but AFTER product-level excise tax is added to product base price
  unitPrice: number;
  total: number; // quantity * unitPrice
  sourceWarehouseId?: string; // Warehouse fulfilling this item (important for multi-warehouse)
}

export interface SalesOrder {
  id: string;
  customerId: string;
  customerName?: string; // Denormalized for display
  salespersonId?: string; // Placeholder for user ID
  salespersonName?: string; // Denormalized
  routeId?: string; // Placeholder
  routeName?: string; // Denormalized
  orderDate: string; // ISO Date
  expectedDeliveryDate?: string; // ISO Date
  items: SalesOrderItem[];
  subtotal: number; // Sum of (item.total) which is (item.quantity * item.unitPrice)
  // Invoice-level VAT and Total Amount will be calculated when converting to Invoice
  // Or, we can store a pre-VAT total here if needed.
  totalAmount: number; // For Sales Order itself, this is likely same as subtotal if no SO-specific taxes/discounts
  status: SalesOrderStatus;
  shippingAddress?: string; // Can be copied from customer, or overridden
  billingAddress?: string; // Can be copied from customer, or overridden
  notes?: string;
  createdAt: string; // ISO Date
  updatedAt?: string; // ISO Date
}


// MOCK DATA

export const MOCK_COMPANY_PROFILE: CompanyProfile = {
  name: 'InvoiceFlow Solutions Inc.',
  address: '123 App Dev Lane, Suite 404, Logic City, OS 12345',
  phone: '(555) 123-4567',
  email: 'hello@invoiceflow.com',
  taxRate: 0, 
  vatRate: 15, 
  excessTaxRate: 0,
};


export const MOCK_PRODUCTS: Product[] = [
  { id: 'PROD001', name: 'Ice Cream Cone - Blueberry 80ml', sku: 'ICCBLUE80', category: 'Frozen', unitType: 'Cartons', piecesInBaseUnit: 24, packagingUnit: 'Pallet', itemsPerPackagingUnit: 100, basePrice: 1.1667, costPrice: 0.8333, exciseTax: 0.10, batchNo: 'B001A', productionDate: '2024-01-01T00:00:00.000Z', expiryDate: '2024-08-20T00:00:00.000Z', discountRate: 0, createdAt: '2024-01-01T00:00:00.000Z', globalReorderPoint: 10 },
  { id: 'PROD002', name: 'LABAN - 900 ML (Bottle)', sku: 'LBN90020', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, basePrice: 0.90, costPrice: 0.60, exciseTax: 0.10, discountRate: 5, createdAt: '2024-01-01T00:00:00.000Z', expiryDate: '2024-09-05T00:00:00.000Z', globalReorderPoint: 240 },
  { id: 'PROD003', name: 'Cooking Cream 1080ml', sku: '330012', category: 'Dairy', unitType: 'Cartons', piecesInBaseUnit: 12, basePrice: 10.00, costPrice: 8.00, exciseTax: 0, createdAt: '2024-01-01T00:00:00.000Z', expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(), globalReorderPoint: 30 },
  { id: 'PROD004', name: 'Al Rabie Juice 125ml - Orange', sku: '25027-ORG', category: 'Beverages', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 18, basePrice: 0.55, costPrice: 0.35, exciseTax: 0.02, createdAt: '2024-01-01T00:00:00.000Z', expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString(), globalReorderPoint: 900 },
  { id: 'PROD005', name: 'Ice Cream Tub 1.8L - Vanilla', sku: '80012-VAN', category: 'Frozen', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 6, basePrice: 10.50, costPrice: 8.00, exciseTax: 0.50, createdAt: '2024-01-01T00:00:00.000Z', expiryDate: '2024-11-30T00:00:00.000Z', globalReorderPoint: 20 },
  { id: 'PROD006', name: 'UHT Milk 200ml', sku: '59012', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 18, basePrice: 0.70, costPrice: 0.45, exciseTax: 0, createdAt: '2024-01-01T00:00:00.000Z', expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(), globalReorderPoint: 1080 },
  { id: 'PROD007', name: 'Whipping Cream 1080ml', sku: '330011', category: 'Dairy', unitType: 'Cartons', piecesInBaseUnit: 12, basePrice: 11.50, costPrice: 9.50, exciseTax: 0, createdAt: '2024-01-01T00:00:00.000Z', expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(), globalReorderPoint: 25 },
  { id: 'PROD008', name: 'Ice Cream Cone 120ml - Vanilla/Strawberry', sku: '12024-VS', category: 'Frozen', unitType: 'Cartons', piecesInBaseUnit: 24, basePrice: 1.40, costPrice: 1.00, exciseTax: 0.10, createdAt: '2024-01-01T00:00:00.000Z', expiryDate: '2024-12-30T00:00:00.000Z', globalReorderPoint: 20 },
  { id: 'PROD009', name: 'Sugar - Bulk', sku: 'SUG001', category: 'Raw Materials', unitType: 'Kgs', piecesInBaseUnit: 1, basePrice: 0.90, costPrice: 0.70, exciseTax: 0, createdAt: '2024-01-01T00:00:00.000Z', globalReorderPoint: 200 },
  { id: 'PROD010', name: 'Carton Box - Medium', sku: 'BOXM001', category: 'Packaging', unitType: 'PCS', piecesInBaseUnit: 1, basePrice: 0.20, costPrice: 0.15, exciseTax: 0, createdAt: '2024-01-01T00:00:00.000Z', globalReorderPoint: 1000 },
];

export const MOCK_WAREHOUSES: Warehouse[] = [
  { id: 'WH-HO-ICE', name: 'Ice Cream Store (HO)', location: 'Head Office - Production City', type: 'main_office_store' },
  { id: 'WH-HO-TETRA', name: 'Tetra Store (HO)', location: 'Head Office - Production City', type: 'main_office_store' },
  { id: 'WH-HO-LABAN', name: 'Laban Store (HO)', location: 'Head Office - Production City', type: 'main_office_store' },
  { id: 'WH-JED-01', name: 'Jeddah Central Warehouse', location: 'Jeddah', type: 'city_store' },
  { id: 'WH-RIY-01', name: 'Riyadh Main Warehouse', location: 'Riyadh', type: 'city_store' },
  { id: 'WH-DAM-01', name: 'Dammam Regional Hub', location: 'Dammam', type: 'city_store' },
  { id: 'WH-MAK-01', name: 'Makkah City Store', location: 'Makkah', type: 'city_store' },
  { id: 'WH-MED-01', name: 'Madinah City Store', location: 'Madinah', type: 'city_store' },
  { id: 'WH-TAB-01', name: 'Tabuk City Store', location: 'Tabuk', type: 'city_store' },
  { id: 'WH-ABH-01', name: 'Abha City Store', location: 'Abha', type: 'city_store' },
];

export const MOCK_PRODUCT_STOCK_LOCATIONS: ProductStockLocation[] = [
  { id: 'PSL001', productId: 'PROD001', warehouseId: 'WH-HO-ICE', stockLevel: 50 }, 
  { id: 'PSL002', productId: 'PROD001', warehouseId: 'WH-JED-01', stockLevel: 20 },
  { id: 'PSL003', productId: 'PROD001', warehouseId: 'WH-RIY-01', stockLevel: 8 },
  { id: 'PSL004', productId: 'PROD002', warehouseId: 'WH-HO-LABAN', stockLevel: 1000 }, 
  { id: 'PSL005', productId: 'PROD002', warehouseId: 'WH-JED-01', stockLevel: 120 },
  { id: 'PSL006', productId: 'PROD004', warehouseId: 'WH-HO-TETRA', stockLevel: 2000 }, 
  { id: 'PSL007', productId: 'PROD004', warehouseId: 'WH-RIY-01', stockLevel: 180 },
  { id: 'PSL008', productId: 'PROD004', warehouseId: 'WH-DAM-01', stockLevel: 90 },
  { id: 'PSL009', productId: 'PROD005', warehouseId: 'WH-HO-ICE', stockLevel: 100 }, 
  { id: 'PSL010', productId: 'PROD005', warehouseId: 'WH-JED-01', stockLevel: 15 },
  { id: 'PSL011', productId: 'PROD009', warehouseId: 'WH-HO-ICE', stockLevel: 500 }, 
  { id: 'PSL012', productId: 'PROD009', warehouseId: 'WH-HO-TETRA', stockLevel: 300 },
  { id: 'PSL013', productId: 'PROD008', warehouseId: 'WH-HO-ICE', stockLevel: 10 }, 
];

export const MOCK_STOCK_TRANSACTIONS: StockTransaction[] = [];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'CUST001', name: 'Alpha Solutions', email: 'contact@alpha.com', phone: '555-0101', billingAddress: '123 Tech Road, Silicon Valley, CA', createdAt: new Date().toISOString(), customerType: 'Credit', creditLimit: 5000, invoiceAgingDays: 30, registrationNumber: 'CRN12345ALPHA', vatNumber: 'VATALPHA001' },
  { id: 'CUST002', name: 'Beta Innovations', email: 'info@beta.dev', phone: '555-0102', billingAddress: '456 Code Avenue, Byte City, TX', createdAt: new Date().toISOString(), customerType: 'Cash', registrationNumber: 'CRNBETA67890', vatNumber: 'VATBETA002' },
  { id: 'CUST003', name: 'Gamma Services', email: 'support@gamma.io', phone: '555-0103', billingAddress: '789 Server Street, Cloud Town, WA', createdAt: new Date().toISOString(), customerType: 'Credit', creditLimit: 10000, invoiceAgingDays: 60, registrationNumber: 'CRNGAMMA00112', vatNumber: 'VATGAMMA003' },
];


const getInvoiceItemUnitPrice = (productId: string, unitType: 'PCS' | 'Cartons'): number => {
  const product = MOCK_PRODUCTS.find(p => p.id === productId);
  if (!product) return 0;

  let priceForUnit = product.basePrice;
  let exciseForUnit = product.exciseTax || 0;

  if (unitType.toLowerCase() === 'cartons') {
    if (product.unitType.toLowerCase() === 'pcs' && product.packagingUnit?.toLowerCase() === 'carton' && product.itemsPerPackagingUnit) {
      priceForUnit = product.basePrice * product.itemsPerPackagingUnit;
      exciseForUnit = (product.exciseTax || 0) * product.itemsPerPackagingUnit;
    } else if (product.unitType.toLowerCase() !== 'cartons' && product.packagingUnit?.toLowerCase() === 'carton' && product.itemsPerPackagingUnit) {
      // This case handles if base unit is, e.g., Kgs, but it's sold in Cartons (defined in packagingUnit)
      priceForUnit = product.basePrice * product.itemsPerPackagingUnit;
      exciseForUnit = (product.exciseTax || 0) * product.itemsPerPackagingUnit;
    }
    // If product.unitType is already 'Cartons', priceForUnit and exciseForUnit are correct
  } else if (unitType.toLowerCase() === 'pcs') {
    if (product.unitType.toLowerCase() !== 'pcs' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
      priceForUnit = product.basePrice / product.piecesInBaseUnit;
      exciseForUnit = (product.exciseTax || 0) / product.piecesInBaseUnit;
    }
    // If product.unitType is 'PCS', priceForUnit and exciseForUnit are correct
  }
  return priceForUnit + exciseForUnit;
};

const createInvoiceTotals = (items: InvoiceItem[], companyProfile: CompanyProfile) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0); // item.total is already quantity * (basePrice + exciseTax)
  const generalTaxAmount = 0; // taxRate from companyProfile is 0
  const vatRate = (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : Number(companyProfile.vatRate) || 0) / 100;
  const vatAmount = subtotal * vatRate;
  const totalAmount = subtotal + vatAmount;
  return { subtotal, taxAmount: generalTaxAmount, vatAmount, totalAmount };
};

const inv1Item1UnitPrice = getInvoiceItemUnitPrice('PROD001', 'Cartons');
const inv1Totals = createInvoiceTotals([{ id: 'item1-inv1', productId: 'PROD001', description: 'Ice Cream Cone - Blueberry 80ml', quantity: 2, unitPrice: inv1Item1UnitPrice, unitType: 'Cartons', total: inv1Item1UnitPrice * 2, sourceWarehouseId: 'WH-HO-ICE' }], MOCK_COMPANY_PROFILE);

const inv2Item1UnitPrice = getInvoiceItemUnitPrice('PROD002', 'PCS');
const inv2Totals = createInvoiceTotals([{ id: 'item1-inv2', productId: 'PROD002', description: 'LABAN - 900 ML (Bottle)', quantity: 12, unitPrice: inv2Item1UnitPrice, unitType: 'PCS', total: inv2Item1UnitPrice * 12, sourceWarehouseId: 'WH-HO-LABAN' }], MOCK_COMPANY_PROFILE);

const inv3Item1UnitPrice = getInvoiceItemUnitPrice('PROD003', 'Cartons');
const inv3Totals = createInvoiceTotals([{ id: 'item1-inv3', productId: 'PROD003', description: 'Cooking Cream 1080ml', quantity: 5, unitPrice: inv3Item1UnitPrice, unitType: 'Cartons', total: inv3Item1UnitPrice * 5, sourceWarehouseId: 'WH-HO-TETRA' }], MOCK_COMPANY_PROFILE);

const inv4Item1UnitPrice = getInvoiceItemUnitPrice('PROD004', 'Cartons');
const inv4Totals = createInvoiceTotals([{ id: 'item1-inv4', productId: 'PROD004', description: 'Al Rabie Juice 125ml - Orange', quantity: 1, unitType: 'Cartons', total: inv4Item1UnitPrice * 1, sourceWarehouseId: 'WH-RIY-01' }], MOCK_COMPANY_PROFILE);


export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'INV-2024001', customerId: 'CUST001', customerName: 'Alpha Solutions',
    issueDate: '2024-07-01', dueDate: '2024-07-31',
    items: [{ id: 'item1-inv1', productId: 'PROD001', description: 'Ice Cream Cone - Blueberry 80ml', quantity: 2, unitPrice: inv1Item1UnitPrice, unitType: 'Cartons', total: inv1Item1UnitPrice * 2, sourceWarehouseId: 'WH-HO-ICE' }],
    subtotal: inv1Totals.subtotal, taxAmount: inv1Totals.taxAmount, vatAmount: inv1Totals.vatAmount, totalAmount: inv1Totals.totalAmount,
    status: 'Paid',
    paymentProcessingStatus: 'Fully Paid', amountPaid: inv1Totals.totalAmount, remainingBalance: 0,
    paymentHistory: [{
      id: 'PAY-HIST-001', paymentDate: '2024-07-15T10:00:00Z', amount: inv1Totals.totalAmount, status: 'Full Payment',
      paymentMethod: 'Bank Transfer', bankName: 'Global Trust Bank', bankAccountNumber: '**** **** **** 1234', onlineTransactionNumber: 'TXN7890123'
    }],
    paymentMethod: 'Bank Transfer', bankName: 'Global Trust Bank', bankAccountNumber: '**** **** **** 1234', onlineTransactionNumber: 'TXN7890123'
  },
  {
    id: 'INV-2024002', customerId: 'CUST002', customerName: 'Beta Innovations',
    issueDate: '2024-07-05', dueDate: '2024-08-04',
    items: [{ id: 'item1-inv2', productId: 'PROD002', description: 'LABAN - 900 ML (Bottle)', quantity: 12, unitPrice: inv2Item1UnitPrice, unitType: 'PCS', total: inv2Item1UnitPrice * 12, sourceWarehouseId: 'WH-HO-LABAN' }],
    subtotal: inv2Totals.subtotal, taxAmount: inv2Totals.taxAmount, vatAmount: inv2Totals.vatAmount, totalAmount: inv2Totals.totalAmount,
    status: 'Partially Paid',
    paymentProcessingStatus: 'Partially Paid', amountPaid: 10, remainingBalance: inv2Totals.totalAmount - 10,
    paymentHistory: [{
      id: 'PAY-HIST-002', paymentDate: '2024-07-20T14:30:00Z', amount: 10, status: 'Partial Payment',
      paymentMethod: 'Cash', cashVoucherNumber: 'CVN00123'
    }],
    paymentMethod: 'Cash', cashVoucherNumber: 'CVN00123'
  },
  {
    id: 'INV-2024003', customerId: 'CUST001', customerName: 'Alpha Solutions',
    issueDate: '2024-06-10', dueDate: '2024-07-10',
    items: [{ id: 'item1-inv3', productId: 'PROD003', description: 'Cooking Cream 1080ml', quantity: 5, unitPrice: inv3Item1UnitPrice, unitType: 'Cartons', total: inv3Item1UnitPrice * 5, sourceWarehouseId: 'WH-HO-TETRA' }],
    subtotal: inv3Totals.subtotal, taxAmount: inv3Totals.taxAmount, vatAmount: inv3Totals.vatAmount, totalAmount: inv3Totals.totalAmount,
    status: 'Overdue',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: inv3Totals.totalAmount,
    paymentHistory: []
  },
   {
    id: 'INV-2024004', customerId: 'CUST003', customerName: 'Gamma Services',
    issueDate: '2024-07-15', dueDate: '2024-08-15',
    items: [{ id: 'item1-inv4', productId: 'PROD004', description: 'Al Rabie Juice 125ml - Orange', quantity: 1, unitPrice: inv4Item1UnitPrice, unitType: 'Cartons', total: inv4Item1UnitPrice * 1, sourceWarehouseId: 'WH-RIY-01' }],
    subtotal: inv4Totals.subtotal, taxAmount: inv4Totals.taxAmount, vatAmount: inv4Totals.vatAmount, totalAmount: inv4Totals.totalAmount,
    status: 'Pending',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: inv4Totals.totalAmount,
    paymentHistory: []
  },
];

export const MOCK_SUPPLIERS: Supplier[] = [
    { id: 'SUPP001', name: 'Global Packaging Solutions', email: 'sales@gps.com', phone: '555-0201', address: '1 Packing Way, Industrial Zone', contactPerson: 'Mr. Boxwell', createdAt: new Date().toISOString() },
    { id: 'SUPP002', name: 'FarmFresh Ingredients Co.', email: 'orders@farmfresh.com', phone: '555-0202', address: '23 Orchard Lane, Countryside', contactPerson: 'Ms. Berry', createdAt: new Date().toISOString() },
    { id: 'SUPP003', name: 'SweetnerPro Ltd.', email: 'contact@sweetner.pro', phone: '555-0203', address: '15 Sugar Mill Road, Factoria', contactPerson: 'Mr. Cane', createdAt: new Date().toISOString() },
];


const getPOCostPrice = (productId: string, unitType: ProductUnitType): number => {
  const product = MOCK_PRODUCTS.find(p => p.id === productId);
  if (!product) return 0;

  let costPriceForUnit = product.costPrice;

  if (unitType.toLowerCase() === 'cartons') {
    if (product.unitType.toLowerCase() === 'pcs' && product.packagingUnit?.toLowerCase() === 'carton' && product.itemsPerPackagingUnit) {
      costPriceForUnit = product.costPrice * product.itemsPerPackagingUnit;
    } else if (product.unitType.toLowerCase() !== 'cartons' && product.packagingUnit?.toLowerCase() === 'carton' && product.itemsPerPackagingUnit) {
      costPriceForUnit = product.costPrice * product.itemsPerPackagingUnit;
    }
  } else if (unitType.toLowerCase() === 'pcs') {
    if (product.unitType.toLowerCase() !== 'pcs' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
      costPriceForUnit = product.costPrice / product.piecesInBaseUnit;
    }
  }
  return costPriceForUnit;
};


export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-001',
    supplierId: 'SUPP002',
    supplierName: 'FarmFresh Ingredients Co.',
    orderDate: '2024-07-10T00:00:00.000Z',
    expectedDeliveryDate: '2024-07-20T00:00:00.000Z',
    items: [
      { id: 'poi-001-1', productId: 'PROD009', productName: 'Sugar - Bulk', quantity: 100, unitType: 'Kgs', unitPrice: getPOCostPrice('PROD009', 'Kgs'), total: getPOCostPrice('PROD009', 'Kgs')*100, quantityReceived: 50 },
    ],
    subtotal: getPOCostPrice('PROD009', 'Kgs')*100,
    taxAmount: 0,
    totalAmount: getPOCostPrice('PROD009', 'Kgs')*100,
    status: 'Partially Received',
    notes: 'Urgent order for sugar.',
    createdAt: '2024-07-10T00:00:00.000Z',
  },
  {
    id: 'PO-002',
    supplierId: 'SUPP001',
    supplierName: 'Global Packaging Solutions',
    orderDate: '2024-07-15T00:00:00.000Z',
    expectedDeliveryDate: '2024-07-25T00:00:00.000Z',
    items: [
      { id: 'poi-002-1', productId: 'PROD010', productName: 'Carton Box - Medium', quantity: 500, unitType: 'PCS', unitPrice: getPOCostPrice('PROD010', 'PCS'), total: getPOCostPrice('PROD010', 'PCS')*500, quantityReceived: 500 },
    ],
    subtotal: getPOCostPrice('PROD010', 'PCS')*500,
    taxAmount: 0,
    totalAmount: getPOCostPrice('PROD010', 'PCS')*500,
    status: 'Fully Received',
    notes: 'Monthly restock of medium carton boxes.',
    createdAt: '2024-07-15T00:00:00.000Z',
  },
  {
    id: 'PO-003',
    supplierId: 'SUPP003',
    supplierName: 'SweetnerPro Ltd.',
    orderDate: '2024-07-20T00:00:00.000Z',
    expectedDeliveryDate: '2024-07-30T00:00:00.000Z',
    items: [
      { id: 'poi-003-1', productId: 'PROD001', productName: 'Ice Cream Cone - Blueberry 80ml', quantity: 10, unitType: 'Cartons', unitPrice: getPOCostPrice('PROD001', 'Cartons'), total: getPOCostPrice('PROD001', 'Cartons')*10, quantityReceived: 0 },
    ],
    subtotal: getPOCostPrice('PROD001', 'Cartons')*10,
    taxAmount: 0,
    totalAmount: getPOCostPrice('PROD001', 'Cartons')*10,
    status: 'Sent',
    notes: 'Order for Blueberry Ice Cream Cones.',
    createdAt: '2024-07-20T00:00:00.000Z',
  },
  {
    id: 'PO-004',
    supplierId: 'SUPP002',
    supplierName: 'FarmFresh Ingredients Co.',
    orderDate: '2024-07-22T00:00:00.000Z',
    expectedDeliveryDate: '2024-08-01T00:00:00.000Z',
    items: [
      { id: 'poi-004-1', productId: 'PROD002', productName: 'LABAN - 900 ML (Bottle)', quantity: 200, unitType: 'PCS', unitPrice: getPOCostPrice('PROD002', 'PCS'), total: getPOCostPrice('PROD002', 'PCS')*200, quantityReceived: 200 },
    ],
    subtotal: getPOCostPrice('PROD002', 'PCS')*200,
    taxAmount: 0,
    totalAmount: getPOCostPrice('PROD002', 'PCS')*200,
    status: 'Fully Received',
    notes: 'Regular Laban order.',
    createdAt: '2024-07-22T00:00:00.000Z',
  },
  {
    id: 'PO-005',
    supplierId: 'SUPP001',
    supplierName: 'Global Packaging Solutions',
    orderDate: '2024-07-25T00:00:00.000Z',
    expectedDeliveryDate: '2024-08-05T00:00:00.000Z',
    items: [
      { id: 'poi-005-1', productId: 'PROD004', productName: 'Al Rabie Juice 125ml - Orange', quantity: 50, unitType: 'Cartons', unitPrice: getPOCostPrice('PROD004', 'Cartons'), total: getPOCostPrice('PROD004', 'Cartons')*50, quantityReceived: 0 },
    ],
    subtotal: getPOCostPrice('PROD004', 'Cartons')*50,
    taxAmount: 0,
    totalAmount: getPOCostPrice('PROD004', 'Cartons')*50,
    status: 'Draft',
    notes: 'Juice packaging order.',
    createdAt: '2024-07-25T00:00:00.000Z',
  }
];

export const MOCK_SALES_ORDERS: SalesOrder[] = [];
