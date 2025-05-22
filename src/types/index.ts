
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
  productId?: string; // Link to the Product
  description: string;
  quantity: number;
  // unitPrice on invoice item = (product base price + product excise tax) for the chosen selling unit. Excludes invoice-level VAT.
  unitPrice: number;
  total: number; // quantity * unitPrice
  unitType: 'Cartons' | 'PCS';
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
  // Subtotal = Sum of all (item.quantity * (item.basePrice + item.exciseTax)).
  subtotal: number;
  taxAmount: number; // General tax - should be 0 if VAT is the primary consumption tax.
  // vatAmount = VAT on subtotal (which already includes item-specific excise).
  vatAmount: number;
  totalAmount: number; // subtotal + taxAmount + vatAmount.
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
  taxRate: number | string; // General tax rate - likely 0.
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
  unitType: ProductUnitType;      // Base unit for primary pricing.
  piecesInBaseUnit?: number;     // If unitType is a package (e.g., Carton), how many individual conceptual pieces (e.g., PCS) it contains.
  packagingUnit?: string;        // Optional LARGER sales package (e.g., Pallet, if unitType is Carton)
  itemsPerPackagingUnit?: number;// Number of 'unitType's in one 'packagingUnit' (e.g., 20 Cartons in 1 Pallet)
  basePrice: number;             // Base selling price for one 'unitType' (BEFORE any taxes)
  costPrice: number;             // Cost per 'unitType'
  exciseTax?: number;            // Excise tax amount PER 'unitType'
  batchNo?: string;
  productionDate?: string; // ISO string
  expiryDate?: string;     // ISO string
  discountRate?: number;   // Percentage e.g., 10 for 10%
  createdAt?: string;
  globalReorderPoint?: number; // General reorder threshold for the product across all locations
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  type: 'city_store' | 'production_store' | 'main_office_store';
}

export interface ProductStockLocation {
  id: string; // Unique ID for this stock record, e.g., `${productId}-${warehouseId}` or UUID
  productId: string;
  warehouseId: string;
  stockLevel: number; // Stock of this product in this specific warehouse, in product's base units (product.unitType)
  reorderPoint?: number; // Optional, reorder point specific to this product in this warehouse
  // Future: batchNo?: string; expiryDate?: string; (if tracked per location/batch)
}


export const MOCK_COMPANY_PROFILE: CompanyProfile = {
  name: 'InvoiceFlow Solutions Inc.',
  address: '123 App Dev Lane, Suite 404, Logic City, OS 12345',
  phone: '(555) 123-4567',
  email: 'hello@invoiceflow.com',
  taxRate: 0, // Assuming VAT is the primary tax
  vatRate: 15,
  excessTaxRate: 0,
};

const todayForMock = new Date();
const nearExpiryDate = new Date(todayForMock);
nearExpiryDate.setDate(todayForMock.getDate() + 20);

const furtherExpiryDate = new Date(todayForMock);
furtherExpiryDate.setDate(todayForMock.getDate() + 45);


export const MOCK_PRODUCTS: Product[] = [
  { id: 'PROD001', name: 'Ice Cream Cone - Blueberry 80ml (Carton)', sku: 'ICCBLUE80', category: 'Frozen', unitType: 'Cartons', piecesInBaseUnit: 24, basePrice: 18.00, costPrice: 12.00, exciseTax: 1.20, batchNo: 'B001A', productionDate: '2024-01-01', expiryDate: '2024-08-20', discountRate: 0, createdAt: new Date().toISOString(), globalReorderPoint: 10 }, // 10 Cartons. Base price per Carton, Excise per Carton.
  { id: 'PROD002', name: 'LABAN - 900 ML (Bottle)', sku: 'LBN90020', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, basePrice: 1.00, costPrice: 0.60, exciseTax: 0.10, discountRate: 5, createdAt: new Date().toISOString(), expiryDate: '2024-12-31', globalReorderPoint: 240 }, // Price per Bottle
  { id: 'PROD003', name: 'Cooking Cream 1080ml (Carton)', sku: '330012', category: 'Dairy', unitType: 'Cartons', piecesInBaseUnit: 12, basePrice: 13.20, costPrice: 9.60, exciseTax: 0, createdAt: new Date().toISOString(), expiryDate: '2025-01-15', globalReorderPoint: 30 }, // Price per Carton. 1 Carton = 12 PCS of 1080ml (assuming PCS refers to individual cream packs inside)
  { id: 'PROD004', name: 'Al Rabie Juice 125ml - Orange (PCS)', sku: '25027-ORG', category: 'Beverages', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 18, basePrice: 0.60, costPrice: 0.35, exciseTax: 0.02, createdAt: new Date().toISOString(), expiryDate: '2024-09-05', globalReorderPoint: 900 }, // Price per PCS. Also sold in Cartons of 18 PCS.
  { id: 'PROD005', name: 'Ice Cream Tub 1.8L - Vanilla (Tub)', sku: '80012-VAN', category: 'Frozen', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 6, basePrice: 2.50, costPrice: 1.50, exciseTax: 0.50, createdAt: new Date().toISOString(), expiryDate: '2024-11-30', globalReorderPoint: 120 }, // Price per Tub (PCS). Also sold in Cartons of 6 Tubs.
  { id: 'PROD006', name: 'UHT Milk 200ml (PCS)', sku: '59012', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 18, basePrice: 0.75, costPrice: 0.40, exciseTax: 0, createdAt: new Date().toISOString(), expiryDate: '2024-10-15', globalReorderPoint: 1080 },
  { id: 'PROD007', name: 'Whipping Cream 1080ml (Carton)', sku: '330011', category: 'Dairy', unitType: 'Cartons', piecesInBaseUnit: 12, basePrice: 15.60, costPrice: 10.80, exciseTax: 0, createdAt: new Date().toISOString(), globalReorderPoint: 25 },
  { id: 'PROD008', name: 'Ice Cream Cone 120ml - Vanilla/Strawberry (Carton)', sku: '12024-VS', category: 'Frozen', unitType: 'Cartons', piecesInBaseUnit: 24, basePrice: 18.80, costPrice: 13.20, exciseTax: 0.72, createdAt: new Date().toISOString(), expiryDate: '2024-09-30', globalReorderPoint: 48 },
  { id: 'PROD009', name: 'Sugar - Bulk (KG)', sku: 'SUG001', category: 'Raw Materials', unitType: 'Kgs', piecesInBaseUnit: 1, basePrice: 1.00, costPrice: 0.70, exciseTax: 0, createdAt: new Date().toISOString(), globalReorderPoint: 200 },
  { id: 'PROD010', name: 'Carton Box - Medium (PCS)', sku: 'BOXM001', category: 'Packaging', unitType: 'PCS', piecesInBaseUnit: 1, basePrice: 0.25, costPrice: 0.15, exciseTax: 0, createdAt: new Date().toISOString(), globalReorderPoint: 100 },
];

export const MOCK_WAREHOUSES: Warehouse[] = [
  { id: 'WH-PROD-ICE', name: 'Ice Cream Production Store', location: 'Head Office - Production City', type: 'production_store' },
  { id: 'WH-PROD-TETRA', name: 'Tetra Production Store', location: 'Head Office - Production City', type: 'production_store' },
  { id: 'WH-PROD-LABAN', name: 'Laban Production Store', location: 'Head Office - Production City', type: 'production_store' },
  { id: 'WH-JED-01', name: 'Jeddah Central Warehouse', location: 'Jeddah', type: 'city_store' },
  { id: 'WH-RIY-01', name: 'Riyadh Main Warehouse', location: 'Riyadh', type: 'city_store' },
  { id: 'WH-DAM-01', name: 'Dammam Regional Hub', location: 'Dammam', type: 'city_store' },
  { id: 'WH-MAK-01', name: 'Makkah City Store', location: 'Makkah', type: 'city_store' },
  { id: 'WH-MED-01', name: 'Madinah City Store', location: 'Madinah', type: 'city_store' },
  { id: 'WH-TAB-01', name: 'Tabuk City Store', location: 'Tabuk', type: 'city_store' },
  { id: 'WH-ABH-01', name: 'Abha City Store', location: 'Abha', type: 'city_store' },
  { id: 'WH-JIZ-01', name: 'Jizan City Store', location: 'Jizan', type: 'city_store' },
  { id: 'WH-QAS-01', name: 'Qassim City Store', location: 'Qassim', type: 'city_store' },
  { id: 'WH-HAI-01', name: 'Hail City Store', location: 'Hail', type: 'city_store' },
];

export const MOCK_PRODUCT_STOCK_LOCATIONS: ProductStockLocation[] = [
  // PROD001: Ice Cream Cone - Blueberry 80ml (Carton). Base Unit: Cartons. piecesInBaseUnit: 24. globalReorderPoint: 10 Cartons
  { id: 'PSL001-PROD001-WH-PROD-ICE', productId: 'PROD001', warehouseId: 'WH-PROD-ICE', stockLevel: 50, reorderPoint: 5 }, // 50 Cartons
  { id: 'PSL002-PROD001-WH-JED-01', productId: 'PROD001', warehouseId: 'WH-JED-01', stockLevel: 20, reorderPoint: 2 },   // 20 Cartons
  { id: 'PSL003-PROD001-WH-RIY-01', productId: 'PROD001', warehouseId: 'WH-RIY-01', stockLevel: 8, reorderPoint: 1 },    // 8 Cartons (Low Stock)

  // PROD002: LABAN - 900 ML (Bottle). Base Unit: PCS. piecesInBaseUnit: 1. globalReorderPoint: 240 PCS
  { id: 'PSL004-PROD002-WH-PROD-LABAN', productId: 'PROD002', warehouseId: 'WH-PROD-LABAN', stockLevel: 1000, reorderPoint: 100 },
  { id: 'PSL005-PROD002-WH-JED-01', productId: 'PROD002', warehouseId: 'WH-JED-01', stockLevel: 120, reorderPoint: 24 },

  // PROD004: Al Rabie Juice 125ml - Orange (PCS). Base Unit: PCS. piecesInBaseUnit: 1. packagingUnit: Carton, itemsPerPackagingUnit: 18. globalReorderPoint: 900 PCS
  { id: 'PSL006-PROD004-WH-PROD-TETRA', productId: 'PROD004', warehouseId: 'WH-PROD-TETRA', stockLevel: 2000, reorderPoint: 200 },
  { id: 'PSL007-PROD004-WH-RIY-01', productId: 'PROD004', warehouseId: 'WH-RIY-01', stockLevel: 180, reorderPoint: 36 },
  { id: 'PSL008-PROD004-WH-DAM-01', productId: 'PROD004', warehouseId: 'WH-DAM-01', stockLevel: 90, reorderPoint: 18 },

  // PROD005: Ice Cream Tub 1.8L - Vanilla (Tub). Base Unit: PCS. piecesInBaseUnit: 1. packagingUnit: Carton, itemsPerPackagingUnit: 6. globalReorderPoint: 120 PCS
  { id: 'PSL009-PROD005-WH-PROD-ICE', productId: 'PROD005', warehouseId: 'WH-PROD-ICE', stockLevel: 100, reorderPoint: 20 },
  { id: 'PSL010-PROD005-WH-JED-01', productId: 'PROD005', warehouseId: 'WH-JED-01', stockLevel: 12, reorderPoint: 6 }, // Low Stock

  // PROD009: Sugar - Bulk (KG). Base Unit: Kgs.
  { id: 'PSL011-PROD009-WH-PROD-ICE', productId: 'PROD009', warehouseId: 'WH-PROD-ICE', stockLevel: 500, reorderPoint: 100 },
  { id: 'PSL012-PROD009-WH-PROD-TETRA', productId: 'PROD009', warehouseId: 'WH-PROD-TETRA', stockLevel: 300, reorderPoint: 50 },
  { id: 'PSL013-PROD009-WH-PROD-LABAN', productId: 'PROD009', warehouseId: 'WH-PROD-LABAN', stockLevel: 250, reorderPoint: 50 },
];


export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'CUST001', name: 'Alpha Solutions', email: 'contact@alpha.com', phone: '555-0101', billingAddress: '123 Tech Road, Silicon Valley, CA', createdAt: new Date().toISOString(), customerType: 'Credit', creditLimit: 5000, invoiceAgingDays: 30, registrationNumber: 'CRN12345ALPHA', vatNumber: 'VATALPHA001' },
  { id: 'CUST002', name: 'Beta Innovations', email: 'info@beta.dev', phone: '555-0102', billingAddress: '456 Code Avenue, Byte City, TX', createdAt: new Date().toISOString(), customerType: 'Cash', registrationNumber: 'CRNBETA67890', vatNumber: 'VATBETA002' },
  { id: 'CUST003', name: 'Gamma Services', email: 'support@gamma.io', phone: '555-0103', billingAddress: '789 Server Street, Cloud Town, WA', createdAt: new Date().toISOString(), customerType: 'Credit', creditLimit: 10000, invoiceAgingDays: 60, registrationNumber: 'CRNGAMMA00112', vatNumber: 'VATGAMMA003' },
];

// Helper for MOCK_INVOICES calculation
const calculateInvoiceTotals = (items: InvoiceItem[], companyProfile: CompanyProfile) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const generalTaxRate = (typeof companyProfile.taxRate === 'string' ? parseFloat(companyProfile.taxRate) : companyProfile.taxRate) / 100;
  const vatRate = (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : companyProfile.vatRate) / 100;

  const taxAmount = subtotal * generalTaxRate; // General tax, likely 0 if VAT is primary
  const amountForVat = subtotal + taxAmount;
  const vatAmount = amountForVat * vatRate;
  const totalAmount = subtotal + taxAmount + vatAmount;
  return { subtotal, taxAmount, vatAmount, totalAmount };
};

const mockInvoiceItems1: InvoiceItem[] = [
  { id: 'item1-inv1', productId: 'PROD001', description: 'Ice Cream Cone - Blueberry 80ml (Carton)', quantity: 2, unitPrice: (18.00 + 1.20), total: (18.00 + 1.20) * 2, unitType: 'Cartons' } // Price per Carton
];
const totals1 = calculateInvoiceTotals(mockInvoiceItems1, MOCK_COMPANY_PROFILE);

const mockInvoiceItems2: InvoiceItem[] = [
  { id: 'item1-inv2', productId: 'PROD002', description: 'LABAN - 900 ML (Bottle)', quantity: 12, unitPrice: (1.00 + 0.10), total: (1.00 + 0.10) * 12, unitType: 'PCS' } // Price per PCS
];
const totals2 = calculateInvoiceTotals(mockInvoiceItems2, MOCK_COMPANY_PROFILE);

const mockInvoiceItems3: InvoiceItem[] = [
  { id: 'item1-inv3', productId: 'PROD003', description: 'Cooking Cream 1080ml (Carton)', quantity: 5, unitPrice: (13.20 + 0), total: (13.20 + 0) * 5, unitType: 'Cartons' }
];
const totals3 = calculateInvoiceTotals(mockInvoiceItems3, MOCK_COMPANY_PROFILE);

const mockInvoiceItems4: InvoiceItem[] = [
  { id: 'item1-inv4', productId: 'PROD004', description: 'Al Rabie Juice 125ml - Orange (PCS)', quantity: 18, unitPrice: (0.60 + 0.02), total: (0.60 + 0.02) * 18, unitType: 'PCS' }
];
const totals4 = calculateInvoiceTotals(mockInvoiceItems4, MOCK_COMPANY_PROFILE);


export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'INV-2024001', customerId: 'CUST001', customerName: 'Alpha Solutions',
    issueDate: '2024-07-01', dueDate: '2024-07-31',
    items: mockInvoiceItems1,
    ...totals1,
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
    items: mockInvoiceItems2,
    ...totals2,
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
    items: mockInvoiceItems3,
    ...totals3,
    status: 'Overdue',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: totals3.totalAmount,
    paymentHistory: []
  },
   {
    id: 'INV-2024004', customerId: 'CUST003', customerName: 'Gamma Services',
    issueDate: '2024-07-15', dueDate: '2024-08-15',
    items: mockInvoiceItems4,
    ...totals4,
    status: 'Pending',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: totals4.totalAmount,
    paymentHistory: []
  },
];

export const MOCK_MANAGERS: Manager[] = [
  { id: 'MGR001', name: 'Alice Wonderland', email: 'alice@invoiceflow.com', role: 'Administrator' },
  { id: 'MGR002', name: 'Bob The Builder', email: 'bob@invoiceflow.com', role: 'Invoice Manager' },
];

    