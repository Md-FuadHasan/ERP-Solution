
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
  // reorderPoint?: number; // Local reorder point for this product in this warehouse
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
  | StockAdjustmentReason // All adjustment reasons are valid transaction types
  | 'Transfer Out'
  | 'Transfer In'
  | 'Sale'
  | 'Sale Return' // For when an invoice is deleted/cancelled or items returned
  | 'PO Receipt'
  | 'Production Output' // Future use: When finished goods are produced
  | 'Production Input Consumption'; // Future use: When raw materials are consumed for production


export interface StockTransaction {
  id: string;
  productId: string;
  productName?: string;
  warehouseId: string;
  warehouseName?: string;
  type: StockTransactionType;
  quantityChange: number; // Positive for increase, negative for decrease (in product's base unit)
  newStockLevelAfterTransaction: number; // Stock level in product's base unit for that warehouse
  date: string; // ISO string timestamp
  reason?: StockAdjustmentReason | string; // For adjustments, this is the specific reason. For others, can be notes.
  reference?: string; // e.g., Invoice ID, Transfer ID, PO Number, Adjustment Note
  userId?: string; // Placeholder for future user tracking
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
  id: string; // Unique ID for this PO item line
  productId: string;
  productName?: string; // For display convenience
  quantity: number; // Quantity ordered in unitType
  unitType: ProductUnitType; // Unit type for this specific PO line (e.g., Cartons, PCS)
  unitPrice: number; // Cost price from supplier for this unitType
  total: number; // quantity * unitPrice
  quantityReceived?: number; // Quantity received so far, in the PO line's unitType
}

export type POStatus = 'Draft' | 'Sent' | 'Partially Received' | 'Fully Received' | 'Cancelled';
export const ALL_PO_STATUSES: POStatus[] = ['Draft', 'Sent', 'Partially Received', 'Fully Received', 'Cancelled'];

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName?: string;
  orderDate: string; // ISO Date
  expectedDeliveryDate?: string; // ISO Date
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount?: number; // Tax from supplier, if any
  totalAmount: number;
  status: POStatus;
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
  taxRate: 0, // General tax is 0, VAT is primary
  vatRate: 15,
  excessTaxRate: 0,
};

const nearExpiryDate = new Date();
nearExpiryDate.setDate(new Date().getDate() + 20);

const furtherExpiryDate = new Date();
furtherExpiryDate.setMonth(new Date().getMonth() + 2);

const farFutureExpiry = new Date();
farFutureExpiry.setFullYear(new Date().getFullYear() + 1);


export const MOCK_PRODUCTS: Product[] = [
  { id: 'PROD001', name: 'Ice Cream Cone - Blueberry 80ml', sku: 'ICCBLUE80', category: 'Frozen', unitType: 'Cartons', piecesInBaseUnit: 24, packagingUnit: 'Pallet', itemsPerPackagingUnit: 100, basePrice: 1.1667, costPrice: 0.8333, exciseTax: 0.10, batchNo: 'B001A', productionDate: '2024-01-01', expiryDate: '2024-08-20T00:00:00.000Z', discountRate: 0, createdAt: new Date().toISOString(), globalReorderPoint: 10 }, // Base Price = 28/24, Cost = 20/24, Excise = 2.4/24
  { id: 'PROD002', name: 'LABAN - 900 ML (Bottle)', sku: 'LBN90020', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, basePrice: 0.90, costPrice: 0.60, exciseTax: 0.10, discountRate: 5, createdAt: new Date().toISOString(), expiryDate: '2024-09-05T00:00:00.000Z', globalReorderPoint: 240 },
  { id: 'PROD003', name: 'Cooking Cream 1080ml', sku: '330012', category: 'Dairy', unitType: 'Cartons', piecesInBaseUnit: 12, basePrice: 10.00, costPrice: 8.00, exciseTax: 0, createdAt: new Date().toISOString(), expiryDate: farFutureExpiry.toISOString(), globalReorderPoint: 30 }, // Base Price = 120/12, Cost = 96/12
  { id: 'PROD004', name: 'Al Rabie Juice 125ml - Orange', sku: '25027-ORG', category: 'Beverages', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 18, basePrice: 0.55, costPrice: 0.35, exciseTax: 0.02, createdAt: new Date().toISOString(), expiryDate: furtherExpiryDate.toISOString(), globalReorderPoint: 900 },
  { id: 'PROD005', name: 'Ice Cream Tub 1.8L - Vanilla', sku: '80012-VAN', category: 'Frozen', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 6, basePrice: 10.50, costPrice: 8.00, exciseTax: 0.50, createdAt: new Date().toISOString(), expiryDate: '2024-11-30T00:00:00.000Z', globalReorderPoint: 20 },
  { id: 'PROD006', name: 'UHT Milk 200ml', sku: '59012', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 18, basePrice: 0.70, costPrice: 0.45, exciseTax: 0, createdAt: new Date().toISOString(), expiryDate: furtherExpiryDate.toISOString(), globalReorderPoint: 1080 },
  { id: 'PROD007', name: 'Whipping Cream 1080ml', sku: '330011', category: 'Dairy', unitType: 'Cartons', piecesInBaseUnit: 12, basePrice: 11.50, costPrice: 9.50, exciseTax: 0, createdAt: new Date().toISOString(), expiryDate: farFutureExpiry.toISOString(), globalReorderPoint: 25 }, // Base Price = 138/12, Cost = 114/12
  { id: 'PROD008', name: 'Ice Cream Cone 120ml - Vanilla/Strawberry', sku: '12024-VS', category: 'Frozen', unitType: 'Cartons', piecesInBaseUnit: 24, basePrice: 1.40, costPrice: 1.00, exciseTax: 0.10, createdAt: new Date().toISOString(), expiryDate: '2024-12-30T00:00:00.000Z', globalReorderPoint: 20 }, // Base Price = 33.6/24, Cost = 24/24, Excise = 2.4/24
  { id: 'PROD009', name: 'Sugar - Bulk', sku: 'SUG001', category: 'Raw Materials', unitType: 'Kgs', piecesInBaseUnit: 1, basePrice: 0.90, costPrice: 0.70, exciseTax: 0, createdAt: new Date().toISOString(), globalReorderPoint: 200 },
  { id: 'PROD010', name: 'Carton Box - Medium', sku: 'BOXM001', category: 'Packaging', unitType: 'PCS', piecesInBaseUnit: 1, basePrice: 0.20, costPrice: 0.15, exciseTax: 0, createdAt: new Date().toISOString(), globalReorderPoint: 1000 },
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
  { id: 'PSL001', productId: 'PROD001', warehouseId: 'WH-HO-ICE', stockLevel: 50 }, // 50 Cartons of Blueberry Ice Cream
  { id: 'PSL002', productId: 'PROD001', warehouseId: 'WH-JED-01', stockLevel: 20 },
  { id: 'PSL003', productId: 'PROD001', warehouseId: 'WH-RIY-01', stockLevel: 8 },
  { id: 'PSL004', productId: 'PROD002', warehouseId: 'WH-HO-LABAN', stockLevel: 1000 }, // 1000 PCS of Laban
  { id: 'PSL005', productId: 'PROD002', warehouseId: 'WH-JED-01', stockLevel: 120 },
  { id: 'PSL006', productId: 'PROD004', warehouseId: 'WH-HO-TETRA', stockLevel: 2000 }, // 2000 PCS of Juice
  { id: 'PSL007', productId: 'PROD004', warehouseId: 'WH-RIY-01', stockLevel: 180 },
  { id: 'PSL008', productId: 'PROD004', warehouseId: 'WH-DAM-01', stockLevel: 90 },
  { id: 'PSL009', productId: 'PROD005', warehouseId: 'WH-HO-ICE', stockLevel: 100 }, // 100 PCS (Tubs) of Vanilla Ice Cream
  { id: 'PSL010', productId: 'PROD005', warehouseId: 'WH-JED-01', stockLevel: 15 },
  { id: 'PSL011', productId: 'PROD009', warehouseId: 'WH-HO-ICE', stockLevel: 500 }, // 500 Kgs of Sugar
  { id: 'PSL012', productId: 'PROD009', warehouseId: 'WH-HO-TETRA', stockLevel: 300 },
  { id: 'PSL013', productId: 'PROD008', warehouseId: 'WH-HO-ICE', stockLevel: 10 }, // 10 Cartons of Vanilla/Strawberry Ice Cream
];

export const MOCK_STOCK_TRANSACTIONS: StockTransaction[] = [];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'CUST001', name: 'Alpha Solutions', email: 'contact@alpha.com', phone: '555-0101', billingAddress: '123 Tech Road, Silicon Valley, CA', createdAt: new Date().toISOString(), customerType: 'Credit', creditLimit: 5000, invoiceAgingDays: 30, registrationNumber: 'CRN12345ALPHA', vatNumber: 'VATALPHA001' },
  { id: 'CUST002', name: 'Beta Innovations', email: 'info@beta.dev', phone: '555-0102', billingAddress: '456 Code Avenue, Byte City, TX', createdAt: new Date().toISOString(), customerType: 'Cash', registrationNumber: 'CRNBETA67890', vatNumber: 'VATBETA002' },
  { id: 'CUST003', name: 'Gamma Services', email: 'support@gamma.io', phone: '555-0103', billingAddress: '789 Server Street, Cloud Town, WA', createdAt: new Date().toISOString(), customerType: 'Credit', creditLimit: 10000, invoiceAgingDays: 60, registrationNumber: 'CRNGAMMA00112', vatNumber: 'VATGAMMA003' },
];

// Helper to calculate invoice item unitPrice based on product's basePrice + exciseTax
const calculateInvoiceItemUnitPrice = (productId: string, quantity: number, unitType: 'PCS' | 'Cartons'): { unitPrice: number; description: string } => {
  const product = MOCK_PRODUCTS.find(p => p.id === productId);
  if (!product) return { unitPrice: 0, description: 'Product not found' };

  let basePriceForUnit = product.basePrice;
  let exciseTaxForUnit = product.exciseTax || 0;

  if (unitType.toLowerCase() === 'cartons') {
    // If selling by 'Cartons', check if the product's primary 'unitType' is PCS and it has packaging info
    if (product.unitType.toLowerCase() === 'pcs' && product.packagingUnit?.toLowerCase() === 'carton' && product.itemsPerPackagingUnit) {
      basePriceForUnit = product.basePrice * product.itemsPerPackagingUnit;
      exciseTaxForUnit = (product.exciseTax || 0) * product.itemsPerPackagingUnit;
    } else if (product.unitType.toLowerCase() !== 'cartons') {
      // Ambiguous: trying to sell in Cartons but product.unitType isn't PCS with Carton packaging, nor is unitType Cartons
      // Default to base unit price + excise. This might need more specific handling.
      console.warn(`Ambiguous carton sale for product ${productId}. Using base unit price.`);
    }
    // If product.unitType *is* 'Cartons', basePriceForUnit and exciseTaxForUnit are already correct for one carton.
  } else if (unitType.toLowerCase() === 'pcs') {
    // If selling by 'PCS', check if the product's primary 'unitType' is a package
    if (product.unitType.toLowerCase() !== 'pcs' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
      basePriceForUnit = product.basePrice / product.piecesInBaseUnit;
      exciseTaxForUnit = (product.exciseTax || 0) / product.piecesInBaseUnit;
    }
    // If product.unitType *is* 'PCS', basePriceForUnit and exciseTaxForUnit are already correct for one PCS.
  }
  return { unitPrice: basePriceForUnit + exciseTaxForUnit, description: product.name };
};


const createInvoiceTotals = (items: InvoiceItem[], companyProfile: CompanyProfile) => {
  // Subtotal already includes product-specific excise taxes via item.unitPrice
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const generalTaxAmount = 0; // Assuming general taxRate is 0, and VAT is the main tax
  const vatRate = (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : Number(companyProfile.vatRate) || 0) / 100;
  const vatAmount = subtotal * vatRate; // VAT on the (Base+Excise) subtotal
  const totalAmount = subtotal + vatAmount;
  return { subtotal, taxAmount: generalTaxAmount, vatAmount, totalAmount };
};

const item1Inv1Details = calculateInvoiceItemUnitPrice('PROD001', 2, 'Cartons');
const inv1Totals = createInvoiceTotals([{ id: 'item1-inv1', productId: 'PROD001', ...item1Inv1Details, quantity: 2, unitType: 'Cartons', total: item1Inv1Details.unitPrice * 2 }], MOCK_COMPANY_PROFILE);

const item1Inv2Details = calculateInvoiceItemUnitPrice('PROD002', 12, 'PCS');
const inv2Totals = createInvoiceTotals([{ id: 'item1-inv2', productId: 'PROD002', ...item1Inv2Details, quantity: 12, unitType: 'PCS', total: item1Inv2Details.unitPrice * 12 }], MOCK_COMPANY_PROFILE);

const item1Inv3Details = calculateInvoiceItemUnitPrice('PROD003', 5, 'Cartons');
const inv3Totals = createInvoiceTotals([{ id: 'item1-inv3', productId: 'PROD003', ...item1Inv3Details, quantity: 5, unitType: 'Cartons', total: item1Inv3Details.unitPrice * 5 }], MOCK_COMPANY_PROFILE);

const item1Inv4Details = calculateInvoiceItemUnitPrice('PROD004', 1, 'Cartons');
const inv4Totals = createInvoiceTotals([{ id: 'item1-inv4', productId: 'PROD004', ...item1Inv4Details, quantity: 1, unitType: 'Cartons', total: item1Inv4Details.unitPrice * 1 }], MOCK_COMPANY_PROFILE);


export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'INV-2024001', customerId: 'CUST001', customerName: 'Alpha Solutions',
    issueDate: '2024-07-01', dueDate: '2024-07-31',
    items: [{ id: 'item1-inv1', productId: 'PROD001', ...item1Inv1Details, quantity: 2, unitType: 'Cartons', total: item1Inv1Details.unitPrice * 2 }],
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
    items: [{ id: 'item1-inv2', productId: 'PROD002', ...item1Inv2Details, quantity: 12, unitType: 'PCS', total: item1Inv2Details.unitPrice * 12 }],
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
    items: [{ id: 'item1-inv3', productId: 'PROD003', ...item1Inv3Details, quantity: 5, unitType: 'Cartons', total: item1Inv3Details.unitPrice * 5 }],
    subtotal: inv3Totals.subtotal, taxAmount: inv3Totals.taxAmount, vatAmount: inv3Totals.vatAmount, totalAmount: inv3Totals.totalAmount,
    status: 'Overdue',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: inv3Totals.totalAmount,
    paymentHistory: []
  },
   {
    id: 'INV-2024004', customerId: 'CUST003', customerName: 'Gamma Services',
    issueDate: '2024-07-15', dueDate: '2024-08-15',
    items: [{ id: 'item1-inv4', productId: 'PROD004', ...item1Inv4Details, quantity: 1, unitType: 'Cartons', total: item1Inv4Details.unitPrice * 1 }],
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

// Helper for PO Item cost price (cost price from supplier)
const getPOCostPrice = (productId: string, unitType: ProductUnitType): number => {
  const product = MOCK_PRODUCTS.find(p => p.id === productId);
  if (!product) return 0;

  // If PO unitType matches product's base unitType (product.unitType)
  if (unitType.toLowerCase() === product.unitType.toLowerCase()) {
    return product.costPrice;
  }
  // If PO unitType matches product's packagingUnit (larger sales package)
  if (product.packagingUnit && product.itemsPerPackagingUnit && unitType.toLowerCase() === product.packagingUnit.toLowerCase()) {
    return product.costPrice * product.itemsPerPackagingUnit;
  }
  // If PO unitType is PCS, but product's base unitType is a package with piecesInBaseUnit
  if (unitType.toLowerCase() === 'pcs' && product.unitType.toLowerCase() !== 'pcs' && product.piecesInBaseUnit && product.piecesInBaseUnit > 0) {
    return product.costPrice / product.piecesInBaseUnit;
  }
  console.warn(`getPOCostPrice: Ambiguous unit match for product ${productId} (PO unit: ${unitType}, Product base unit: ${product.unitType}). Defaulting to base cost price.`);
  return product.costPrice;
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
      // Product PROD004 has unitType: PCS, packagingUnit: Carton, itemsPerPackagingUnit: 18
      // So, ordering by "Cartons" means ordering 18 PCS per carton.
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

    