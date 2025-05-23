
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
  // unitPrice on invoice item = product.basePrice + product.exciseTax (for the chosen selling unit).
  // This price is BEFORE invoice-level VAT.
  unitPrice: number;
  total: number; // quantity * unitPrice
  unitType: 'Cartons' | 'PCS'; // Unit type for THIS line item
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
  // Subtotal = Sum of all (item.quantity * (item.unitPrice which is product.basePrice + product.exciseTax)).
  subtotal: number;
  taxAmount: number; // General tax on subtotal - this is now typically 0.
  // vatAmount = VAT on (subtotal).
  vatAmount: number;
  totalAmount: number; // subtotal + vatAmount.
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
  taxRate: number | string; // General tax rate - typically 0 if VAT is the main tax.
  vatRate: number | string; // VAT rate e.g. 15 for 15%
  excessTaxRate?: number | string;
}

export interface Manager {
  id: string;
  name: string;
  email: string;
  role: string;
}

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
  unitType: ProductUnitType;      // This is the primary unit for stockLevel & primary pricing
  piecesInBaseUnit?: number;      // If unitType is a package (e.g., Carton), how many individual pieces (e.g., PCS) does it contain?
  packagingUnit?: string;         // Optional LARGER sales package (e.g., Pallet, if unitType is Carton)
  itemsPerPackagingUnit?: number; // Number of 'unitType's in one 'packagingUnit' (e.g., 20 Cartons in 1 Pallet)
  basePrice: number;              // Base selling price for one 'unitType' (BEFORE any taxes)
  costPrice: number;              // Cost per 'unitType'
  exciseTax?: number;             // Excise tax amount PER 'unitType'
  batchNo?: string;
  productionDate?: string; // ISO string
  expiryDate?: string;     // ISO string
  discountRate?: number;   // Percentage e.g., 10 for 10%
  createdAt?: string;
  globalReorderPoint?: number;   // General reorder threshold for the product across all locations
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
  id: string; // Unique ID for this stock record, e.g., `${productId}-${warehouseId}` or UUID
  productId: string;
  warehouseId: string;
  stockLevel: number; // Stock of this product in this specific warehouse, in product's base units (product.unitType)
  reorderPoint?: number; // Optional, reorder point specific to this product in this warehouse
}

// Stock Transaction Types & Reasons
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
  | StockAdjustmentReason // All adjustment reasons are transaction types
  | 'Transfer Out'
  | 'Transfer In'
  | 'Sale'
  | 'Sale Return'
  | 'PO Receipt' // Stock received against a Purchase Order
  | 'Production Output' // From production to finished goods
  | 'Production Input Consumption'; // Raw materials consumed by production


export interface StockTransaction {
  id: string; // Unique ID for the transaction
  productId: string;
  productName?: string; // For easier display, can be denormalized
  warehouseId: string;
  warehouseName?: string; // For easier display, can be denormalized
  type: StockTransactionType;
  quantityChange: number; // Positive for increase, negative for decrease (in product's base unit type)
  newStockLevelAfterTransaction: number; // Stock level in the specific warehouse after this transaction
  date: string; // ISO string timestamp
  reason?: StockAdjustmentReason | string; // For adjustments, this is the reason. For others, it can be a note.
  reference?: string; // e.g., Invoice ID, Transfer ID, PO Number, Adjustment Note
  userId?: string; // Placeholder for future user tracking, who performed the action
}

// Supplier and Purchase Order Types
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
  id: string; // Unique ID for the PO line item
  productId: string;
  productName?: string; // Denormalized for display
  quantity: number; // Quantity ordered in unitType
  unitType: ProductUnitType; // The unit in which it was ordered (should match product.unitType or product.packagingUnit)
  unitPrice: number; // Price per unitType for this PO (cost price from supplier)
  total: number; // quantity * unitPrice
  quantityReceived?: number; // Quantity received so far, in unitType
}

export type POStatus = 'Draft' | 'Sent' | 'Partially Received' | 'Fully Received' | 'Cancelled';
export const ALL_PO_STATUSES: POStatus[] = ['Draft', 'Sent', 'Partially Received', 'Fully Received', 'Cancelled'];

export interface PurchaseOrder {
  id: string; // e.g., PO-2024-001
  supplierId: string;
  supplierName?: string; // Denormalized
  orderDate: string; // ISO string
  expectedDeliveryDate?: string; // ISO string
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount?: number; // If applicable on POs (e.g. VAT on PO from supplier)
  totalAmount: number;
  status: POStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}


// MOCK DATA

export const MOCK_COMPANY_PROFILE: CompanyProfile = {
  name: 'InvoiceFlow Solutions Inc.',
  address: '123 App Dev Lane, Suite 404, Logic City, OS 12345',
  phone: '(555) 123-4567',
  email: 'hello@invoiceflow.com',
  taxRate: 0, // General tax rate - set to 0 as VAT is primary.
  vatRate: 15, // VAT rate e.g. 15 for 15%
  excessTaxRate: 0,
};

const nearExpiryDate = new Date();
nearExpiryDate.setDate(nearExpiryDate.getDate() + 25); // Approx 25 days from now

const furtherExpiryDate = new Date();
furtherExpiryDate.setDate(furtherExpiryDate.getDate() + 75); // Approx 75 days from now

const farFutureExpiry = new Date();
farFutureExpiry.setFullYear(farFutureExpiry.getFullYear() + 1);


export const MOCK_PRODUCTS: Product[] = [
  { id: 'PROD001', name: 'Ice Cream Cone - Blueberry 80ml', sku: 'ICCBLUE80', category: 'Frozen', unitType: 'Cartons', piecesInBaseUnit: 24, packagingUnit: 'Master Case', itemsPerPackagingUnit: 4, basePrice: 3.00, costPrice: 1.50, exciseTax: 0.20, batchNo: 'B001A', productionDate: '2024-01-01', expiryDate: '2024-12-20', discountRate: 0, createdAt: new Date().toISOString(), globalReorderPoint: 10 },
  { id: 'PROD002', name: 'LABAN - 900 ML (Bottle)', sku: 'LBN90020', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, basePrice: 1.00, costPrice: 0.60, exciseTax: 0.10, discountRate: 5, createdAt: new Date().toISOString(), expiryDate: nearExpiryDate.toISOString(), globalReorderPoint: 240 },
  { id: 'PROD003', name: 'Cooking Cream 1080ml', sku: '330012', category: 'Dairy', unitType: 'Cartons', piecesInBaseUnit: 12, basePrice: 11.00, costPrice: 8.00, exciseTax: 0, createdAt: new Date().toISOString(), expiryDate: farFutureExpiry.toISOString(), globalReorderPoint: 30 },
  { id: 'PROD004', name: 'Al Rabie Juice 125ml - Orange', sku: '25027-ORG', category: 'Beverages', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 18, basePrice: 0.60, costPrice: 0.35, exciseTax: 0.02, createdAt: new Date().toISOString(), expiryDate: nearExpiryDate.toISOString(), globalReorderPoint: 900 },
  { id: 'PROD005', name: 'Ice Cream Tub 1.8L - Vanilla', sku: '80012-VAN', category: 'Frozen', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 6, basePrice: 11.50, costPrice: 9.00, exciseTax: 0.50, createdAt: new Date().toISOString(), expiryDate: '2024-11-30', globalReorderPoint: 20 },
  { id: 'PROD006', name: 'UHT Milk 200ml', sku: '59012', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 18, basePrice: 0.75, costPrice: 0.40, exciseTax: 0, createdAt: new Date().toISOString(), expiryDate: furtherExpiryDate.toISOString(), globalReorderPoint: 1080 },
  { id: 'PROD007', name: 'Whipping Cream 1080ml', sku: '330011', category: 'Dairy', unitType: 'Cartons', piecesInBaseUnit: 12, basePrice: 12.50, costPrice: 9.50, exciseTax: 0, createdAt: new Date().toISOString(), expiryDate: farFutureExpiry.toISOString(), globalReorderPoint: 25 },
  { id: 'PROD008', name: 'Ice Cream Cone 120ml - Vanilla/Strawberry', sku: '12024-VS', category: 'Frozen', unitType: 'Cartons', piecesInBaseUnit: 24, basePrice: 3.10, costPrice: 1.60, exciseTax: 0.25, createdAt: new Date().toISOString(), expiryDate: '2024-12-30', globalReorderPoint: 20 },
  { id: 'PROD009', name: 'Sugar - Bulk', sku: 'SUG001', category: 'Raw Materials', unitType: 'Kgs', piecesInBaseUnit: 1, basePrice: 1.00, costPrice: 0.70, exciseTax: 0, createdAt: new Date().toISOString(), globalReorderPoint: 200 },
  { id: 'PROD010', name: 'Carton Box - Medium', sku: 'BOXM001', category: 'Packaging', unitType: 'PCS', piecesInBaseUnit: 1, basePrice: 0.25, costPrice: 0.15, exciseTax: 0, createdAt: new Date().toISOString(), globalReorderPoint: 1000 },
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

// Helper function to calculate invoice item total (base + excise)
const calculateInvoiceItemTotal = (productId: string, quantity: number, unitType: 'PCS' | 'Cartons'): { unitPrice: number; total: number } => {
  const product = MOCK_PRODUCTS.find(p => p.id === productId);
  if (!product) return { unitPrice: 0, total: 0 };

  let itemBasePricePerSellingUnit = 0;
  let itemExciseTaxPerSellingUnit = 0;

  if (unitType.toLowerCase() === 'pcs') {
    // Selling individual pieces
    itemBasePricePerSellingUnit = product.basePrice / (product.piecesInBaseUnit || 1);
    itemExciseTaxPerSellingUnit = (product.exciseTax || 0) / (product.piecesInBaseUnit || 1);
  } else if (unitType.toLowerCase() === product.unitType.toLowerCase()) {
    // Selling in the product's base unit type (which might be a carton/pack)
    itemBasePricePerSellingUnit = product.basePrice;
    itemExciseTaxPerSellingUnit = product.exciseTax || 0;
  } else if (product.packagingUnit && unitType.toLowerCase() === product.packagingUnit.toLowerCase() && product.itemsPerPackagingUnit) {
    // Selling in the product's larger packaging unit
    itemBasePricePerSellingUnit = product.basePrice * product.itemsPerPackagingUnit;
    itemExciseTaxPerSellingUnit = (product.exciseTax || 0) * product.itemsPerPackagingUnit;
  } else {
    // Fallback or mismatch - assume selling in base units
    itemBasePricePerSellingUnit = product.basePrice;
    itemExciseTaxPerSellingUnit = product.exciseTax || 0;
  }
  const unitPriceIncludingExcise = itemBasePricePerSellingUnit + itemExciseTaxPerSellingUnit;
  return { unitPrice: unitPriceIncludingExcise, total: unitPriceIncludingExcise * quantity };
};

const createInvoiceTotals = (items: InvoiceItem[], companyProfile: CompanyProfile) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0); // Subtotal includes item-level excise
  const vatRate = (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : Number(companyProfile.vatRate) || 0) / 100;
  const vatAmount = subtotal * vatRate;
  const totalAmount = subtotal + vatAmount;
  return { subtotal, taxAmount: 0, vatAmount, totalAmount }; // taxAmount (general tax) is 0
};

const item1Inv1 = calculateInvoiceItemTotal('PROD001', 2, 'Cartons');
const item1Inv2 = calculateInvoiceItemTotal('PROD002', 12, 'PCS');
const item1Inv3 = calculateInvoiceItemTotal('PROD003', 5, 'Cartons');
const item1Inv4 = calculateInvoiceItemTotal('PROD004', 18, 'PCS'); // Selling 1 full carton as PCS

const totals1 = createInvoiceTotals([{ id: 'item1-inv1', productId: 'PROD001', description: MOCK_PRODUCTS.find(p=>p.id==='PROD001')?.name || '', quantity: 2, unitType: 'Cartons', unitPrice: item1Inv1.unitPrice, total: item1Inv1.total }], MOCK_COMPANY_PROFILE);
const totals2 = createInvoiceTotals([{ id: 'item1-inv2', productId: 'PROD002', description: MOCK_PRODUCTS.find(p=>p.id==='PROD002')?.name || '', quantity: 12, unitType: 'PCS', unitPrice: item1Inv2.unitPrice, total: item1Inv2.total }], MOCK_COMPANY_PROFILE);
const totals3 = createInvoiceTotals([{ id: 'item1-inv3', productId: 'PROD003', description: MOCK_PRODUCTS.find(p=>p.id==='PROD003')?.name || '', quantity: 5, unitType: 'Cartons', unitPrice: item1Inv3.unitPrice, total: item1Inv3.total }], MOCK_COMPANY_PROFILE);
const totals4 = createInvoiceTotals([{ id: 'item1-inv4', productId: 'PROD004', description: MOCK_PRODUCTS.find(p=>p.id==='PROD004')?.name || '', quantity: 18, unitType: 'PCS', unitPrice: item1Inv4.unitPrice, total: item1Inv4.total }], MOCK_COMPANY_PROFILE);


export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'INV-2024001', customerId: 'CUST001', customerName: 'Alpha Solutions',
    issueDate: '2024-07-01', dueDate: '2024-07-31',
    items: [{ id: 'item1-inv1', productId: 'PROD001', description: MOCK_PRODUCTS.find(p=>p.id==='PROD001')?.name || '', quantity: 2, unitType: 'Cartons', unitPrice: item1Inv1.unitPrice, total: item1Inv1.total }],
    subtotal: totals1.subtotal, taxAmount: totals1.taxAmount, vatAmount: totals1.vatAmount, totalAmount: totals1.totalAmount,
    status: 'Paid',
    paymentProcessingStatus: 'Fully Paid', amountPaid: totals1.totalAmount, remainingBalance: 0,
    paymentHistory: [{
      id: 'PAY-HIST-001', paymentDate: '2024-07-15T10:00:00Z', amount: totals1.totalAmount, status: 'Full Payment',
      paymentMethod: 'Bank Transfer', bankName: 'Global Trust Bank', bankAccountNumber: '**** **** **** 1234', onlineTransactionNumber: 'TXN7890123'
    }],
    paymentMethod: 'Bank Transfer', bankName: 'Global Trust Bank', bankAccountNumber: '**** **** **** 1234', onlineTransactionNumber: 'TXN7890123'
  },
  {
    id: 'INV-2024002', customerId: 'CUST002', customerName: 'Beta Innovations',
    issueDate: '2024-07-05', dueDate: '2024-08-04',
    items: [{ id: 'item1-inv2', productId: 'PROD002', description: MOCK_PRODUCTS.find(p=>p.id==='PROD002')?.name || '', quantity: 12, unitType: 'PCS', unitPrice: item1Inv2.unitPrice, total: item1Inv2.total }],
    subtotal: totals2.subtotal, taxAmount: totals2.taxAmount, vatAmount: totals2.vatAmount, totalAmount: totals2.totalAmount,
    status: 'Partially Paid',
    paymentProcessingStatus: 'Partially Paid', amountPaid: 10, remainingBalance: totals2.totalAmount - 10,
    paymentHistory: [{
      id: 'PAY-HIST-002', paymentDate: '2024-07-20T14:30:00Z', amount: 10, status: 'Partial Payment',
      paymentMethod: 'Cash', cashVoucherNumber: 'CVN00123'
    }],
    paymentMethod: 'Cash', cashVoucherNumber: 'CVN00123'
  },
  {
    id: 'INV-2024003', customerId: 'CUST001', customerName: 'Alpha Solutions',
    issueDate: '2024-06-10', dueDate: '2024-07-10',
    items: [{ id: 'item1-inv3', productId: 'PROD003', description: MOCK_PRODUCTS.find(p=>p.id==='PROD003')?.name || '', quantity: 5, unitType: 'Cartons', unitPrice: item1Inv3.unitPrice, total: item1Inv3.total }],
    subtotal: totals3.subtotal, taxAmount: totals3.taxAmount, vatAmount: totals3.vatAmount, totalAmount: totals3.totalAmount,
    status: 'Overdue',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: totals3.totalAmount,
    paymentHistory: []
  },
   {
    id: 'INV-2024004', customerId: 'CUST003', customerName: 'Gamma Services',
    issueDate: '2024-07-15', dueDate: '2024-08-15',
    items: [{ id: 'item1-inv4', productId: 'PROD004', description: MOCK_PRODUCTS.find(p=>p.id==='PROD004')?.name || '', quantity: 18, unitType: 'PCS', unitPrice: item1Inv4.unitPrice, total: item1Inv4.total }], // Represents one full carton sold as 18 PCS
    subtotal: totals4.subtotal, taxAmount: totals4.taxAmount, vatAmount: totals4.vatAmount, totalAmount: totals4.totalAmount,
    status: 'Pending',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: totals4.totalAmount,
    paymentHistory: []
  },
];

export const MOCK_MANAGERS: Manager[] = [];

export const MOCK_SUPPLIERS: Supplier[] = [
    { id: 'SUPP001', name: 'Global Packaging Solutions', email: 'sales@gps.com', phone: '555-0201', address: '1 Packing Way, Industrial Zone', contactPerson: 'Mr. Boxwell', createdAt: new Date().toISOString() },
    { id: 'SUPP002', name: 'FarmFresh Ingredients Co.', email: 'orders@farmfresh.com', phone: '555-0202', address: '23 Orchard Lane, Countryside', contactPerson: 'Ms. Berry', createdAt: new Date().toISOString() },
    { id: 'SUPP003', name: 'SweetnerPro Ltd.', email: 'contact@sweetner.pro', phone: '555-0203', address: '15 Sugar Mill Road, Factoria', contactPerson: 'Mr. Cane', createdAt: new Date().toISOString() },
];

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-001',
    supplierId: 'SUPP002',
    orderDate: '2024-07-01T00:00:00.000Z',
    expectedDeliveryDate: '2024-07-10T00:00:00.000Z',
    items: [
      { id: 'poi-001-1', productId: 'PROD009', quantity: 100, unitType: 'Kgs', unitPrice: 0.65, total: 65, quantityReceived: 0 },
      { id: 'poi-001-2', productId: 'PROD010', quantity: 500, unitType: 'PCS', unitPrice: 0.14, total: 70, quantityReceived: 0 },
    ],
    subtotal: 135,
    taxAmount: 0,
    totalAmount: 135,
    status: 'Sent',
    notes: 'Urgent order for sugar and medium boxes.',
    createdAt: '2024-07-01T00:00:00.000Z',
  },
  {
    id: 'PO-002',
    supplierId: 'SUPP001',
    orderDate: '2024-07-15T00:00:00.000Z',
    items: [
      { id: 'poi-002-1', productId: 'PROD010', quantity: 1000, unitType: 'PCS', unitPrice: 0.13, total: 130, quantityReceived: 0 },
    ],
    subtotal: 130,
    taxAmount: 0,
    totalAmount: 130,
    status: 'Draft',
    notes: 'Monthly restock of medium carton boxes.',
    createdAt: '2024-07-15T00:00:00.000Z',
  }
];
