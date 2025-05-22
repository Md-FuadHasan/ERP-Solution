
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
  // Subtotal = Sum of all (item.quantity * (product.basePrice + product.exciseTax for that unit)).
  subtotal: number;
  taxAmount: number; // General tax - typically 0 if VAT is the main consumption tax.
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
  taxRate: number | string; // General tax rate (likely 0 if VAT is primary)
  vatRate: number | string; // VAT rate
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
  unitType: ProductUnitType;      // Base unit for stockLevel & primary pricing
  piecesInBaseUnit?: number;     // If unitType is a package (e.g., Carton), how many individual conceptual pieces (e.g., PCS) it contains.
  packagingUnit?: string;        // Optional LARGER sales package (e.g., Pallet, if unitType is Carton)
  itemsPerPackagingUnit?: number;// Number of 'unitType's in one 'packagingUnit' (e.g., 20 Cartons in 1 Pallet)
  // stockLevel: number; // REMOVED - will be managed per warehouse
  // reorderPoint: number; // REMOVED - will be managed per warehouse or globally
  basePrice: number;             // Base selling price for one 'unitType' (BEFORE any taxes)
  costPrice: number;             // Cost per 'unitType'
  exciseTax?: number;            // Excise tax amount PER 'unitType'
  batchNo?: string;
  productionDate?: string; // ISO string
  expiryDate?: string;     // ISO string
  discountRate?: number;   // Percentage e.g., 10 for 10%
  createdAt?: string;
  // New field for global reorder point if needed, or this could be per product-warehouse
  globalReorderPoint?: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  type: 'city_store' | 'production_store' | 'main_office_store'; // Added main_office_store
}

export interface ProductStockLocation {
  id: string; // Unique ID for this stock record, e.g., `${productId}-${warehouseId}` or UUID
  productId: string;
  warehouseId: string;
  stockLevel: number; // Stock of this product in this specific warehouse, in product's base units
  reorderPoint?: number; // Optional, reorder point specific to this product in this warehouse
  // Batch and expiry can be added here if tracked per location
  // batchNo?: string;
  // expiryDate?: string;
}


export const MOCK_COMPANY_PROFILE: CompanyProfile = {
  name: 'InvoiceFlow Solutions Inc.',
  address: '123 App Dev Lane, Suite 404, Logic City, OS 12345',
  phone: '(555) 123-4567',
  email: 'hello@invoiceflow.com',
  taxRate: 0,
  vatRate: 15,
  excessTaxRate: 0
};

const todayForMock = new Date();
const nearExpiryDate = new Date(todayForMock);
nearExpiryDate.setDate(todayForMock.getDate() + 20); // Approx 20 days from now

const furtherExpiryDate = new Date(todayForMock);
furtherExpiryDate.setDate(todayForMock.getDate() + 45);


export const MOCK_PRODUCTS: Product[] = [
  { id: 'PROD001', name: 'Ice Cream Cone (Vanilla) - 120ml', sku: 'ICCV12030', category: 'Frozen', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 24, costPrice: 0.30, basePrice: 0.80, exciseTax: 0.05, batchNo: 'B001', productionDate: '2023-01-01', expiryDate: nearExpiryDate.toISOString().split('T')[0], discountRate: 0, createdAt: new Date().toISOString(), globalReorderPoint: 240 }, // 240 PCS (10 Cartons)
  { id: 'PROD002', name: 'LABAN - 900 ML', sku: 'LBN90020', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 12, costPrice: 0.60, basePrice: 1.00, exciseTax: 0.10, discountRate: 5, createdAt: new Date().toISOString(), expiryDate: '2024-12-31', globalReorderPoint: 240 }, // 240 PCS (20 Cartons)
  { id: 'PROD003', name: 'Cooking Cream 1080ml', sku: '330012', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 12, costPrice: 0.80, basePrice: 1.20, exciseTax: 0, createdAt: new Date().toISOString(), expiryDate: '2025-01-15', globalReorderPoint: 360 },
  { id: 'PROD004', name: 'Al Rabie Juice 125ml - Orange', sku: '25027-ORG', category: 'Beverages', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 18, costPrice: 0.35, basePrice: 0.60, exciseTax: 0.02, createdAt: new Date().toISOString(), expiryDate: furtherExpiryDate.toISOString().split('T')[0], globalReorderPoint: 900 },
  { id: 'PROD005', name: 'Ice Cream Tub 1.8L - Vanilla', sku: '80012-VAN', category: 'Frozen', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 6, costPrice: 1.50, basePrice: 2.50, exciseTax: 0.50, createdAt: new Date().toISOString(), expiryDate: '2024-11-30', globalReorderPoint: 120 }, // 120 PCS (20 Cartons)
  { id: 'PROD006', name: 'UHT Milk 200ml', sku: '59012', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 18, costPrice: 0.40, basePrice: 0.75, exciseTax: 0, createdAt: new Date().toISOString(), expiryDate: '2024-10-15', globalReorderPoint: 1080 },
  { id: 'PROD007', name: 'Whipping Cream 1080ml', sku: '330011', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 12, costPrice: 0.90, basePrice: 1.30, exciseTax: 0, createdAt: new Date().toISOString(), globalReorderPoint: 300 },
  { id: 'PROD008', name: 'Ice Cream Cone 120ml - Vanilla/Strawberry', sku: '12024-VS', category: 'Frozen', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 24, costPrice: 0.35, basePrice: 0.85, exciseTax: 0.03, createdAt: new Date().toISOString(), expiryDate: '2024-09-30', globalReorderPoint: 1152 },
  { id: 'PROD009', name: 'Sugar - Bulk', sku: 'SUG001', category: 'Raw Materials', unitType: 'Kgs', piecesInBaseUnit: 1, costPrice: 0.70, basePrice: 1.00, exciseTax: 0, createdAt: new Date().toISOString(), globalReorderPoint: 200 },
  { id: 'PROD010', name: 'Carton Box - Medium', sku: 'BOXM001', category: 'Packaging', unitType: 'PCS', piecesInBaseUnit: 1, costPrice: 0.15, basePrice: 0.25, exciseTax: 0, createdAt: new Date().toISOString(), globalReorderPoint: 100 },
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
  // PROD001: Vanilla Cone. Base Unit: PCS. 24 PCS/Carton. Global Reorder: 240 PCS (10 Cartons)
  { id: 'PSL001', productId: 'PROD001', warehouseId: 'WH-PROD-ICE', stockLevel: 500, reorderPoint: 100 }, // 500 PCS
  { id: 'PSL002', productId: 'PROD001', warehouseId: 'WH-JED-01', stockLevel: 240, reorderPoint: 48 },   // 10 Cartons
  { id: 'PSL003', productId: 'PROD001', warehouseId: 'WH-RIY-01', stockLevel: 120, reorderPoint: 24 },   // 5 Cartons

  // PROD002: LABAN. Base Unit: PCS. 12 PCS/Carton. Global Reorder: 240 PCS (20 Cartons)
  { id: 'PSL004', productId: 'PROD002', warehouseId: 'WH-PROD-LABAN', stockLevel: 1000, reorderPoint: 200 },
  { id: 'PSL005', productId: 'PROD002', warehouseId: 'WH-JED-01', stockLevel: 120, reorderPoint: 24 },  // 10 Cartons

  // PROD004: Al Rabie Juice. Base Unit: PCS. 18 PCS/Carton. Global Reorder: 900 PCS (50 Cartons)
  { id: 'PSL006', productId: 'PROD004', warehouseId: 'WH-PROD-TETRA', stockLevel: 2000, reorderPoint: 400 },
  { id: 'PSL007', productId: 'PROD004', warehouseId: 'WH-RIY-01', stockLevel: 180, reorderPoint: 36 }, // 10 Cartons
  { id: 'PSL008', productId: 'PROD004', warehouseId: 'WH-DAM-01', stockLevel: 90, reorderPoint: 18 },   // 5 Cartons

  // PROD005: Ice Cream Tub Vanilla. Base Unit: PCS. 6 PCS/Carton. Global Reorder: 120 PCS (20 Cartons)
  { id: 'PSL009', productId: 'PROD005', warehouseId: 'WH-PROD-ICE', stockLevel: 50, reorderPoint: 60 }, // Low stock (global reorder is 120 PCS)
  { id: 'PSL010', productId: 'PROD005', warehouseId: 'WH-JED-01', stockLevel: 12, reorderPoint: 30 },  // Low stock (2 cartons vs 5 cartons reorder for this location)

  // Raw Material PROD009 (Sugar)
  { id: 'PSL011', productId: 'PROD009', warehouseId: 'WH-PROD-ICE', stockLevel: 500, reorderPoint: 100 }, // 500 kgs
  { id: 'PSL012', productId: 'PROD009', warehouseId: 'WH-PROD-TETRA', stockLevel: 300, reorderPoint: 50 }, // 300 kgs
  { id: 'PSL013', productId: 'PROD009', warehouseId: 'WH-PROD-LABAN', stockLevel: 250, reorderPoint: 50 }, // 250 kgs
];


export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'CUST001', name: 'Alpha Solutions', email: 'contact@alpha.com', phone: '555-0101', billingAddress: '123 Tech Road, Silicon Valley, CA', createdAt: new Date().toISOString(), customerType: 'Credit', creditLimit: 5000, invoiceAgingDays: 30, registrationNumber: 'CRN12345ALPHA', vatNumber: 'VATALPHA001' },
  { id: 'CUST002', name: 'Beta Innovations', email: 'info@beta.dev', phone: '555-0102', billingAddress: '456 Code Avenue, Byte City, TX', createdAt: new Date().toISOString(), customerType: 'Cash', registrationNumber: 'CRNBETA67890', vatNumber: 'VATBETA002' },
  { id: 'CUST003', name: 'Gamma Services', email: 'support@gamma.io', phone: '555-0103', billingAddress: '789 Server Street, Cloud Town, WA', createdAt: new Date().toISOString(), customerType: 'Credit', creditLimit: 10000, invoiceAgingDays: 60, registrationNumber: 'CRNGAMMA00112', vatNumber: 'VATGAMMA003' },
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'INV-2024001', customerId: 'CUST001', customerName: 'Alpha Solutions',
    issueDate: '2024-07-01', dueDate: '2024-07-31',
    items: [{ id: 'item1',productId: 'PROD001', description: 'Ice Cream Cone (Vanilla) - 120ml', quantity: 10, unitPrice: (0.80 + 0.05), total: (0.80 + 0.05) * 10, unitType: 'PCS' }],
    subtotal: (0.80 + 0.05) * 10, // Base + Excise
    taxAmount: 0,
    vatAmount: ((0.80 + 0.05) * 10) * (MOCK_COMPANY_PROFILE.vatRate as number / 100),
    totalAmount: ((0.80 + 0.05) * 10) + (((0.80 + 0.05) * 10) * (MOCK_COMPANY_PROFILE.vatRate as number / 100)),
    status: 'Paid',
    paymentProcessingStatus: 'Fully Paid', amountPaid: ((0.80 + 0.05) * 10) + (((0.80 + 0.05) * 10) * (MOCK_COMPANY_PROFILE.vatRate as number / 100)), remainingBalance: 0,
    paymentHistory: [{
      id: 'PAY-HIST-001', paymentDate: '2024-07-15T10:00:00Z', amount: ((0.80 + 0.05) * 10) * (1 + (MOCK_COMPANY_PROFILE.vatRate as number / 100)), status: 'Full Payment',
      paymentMethod: 'Bank Transfer', bankName: 'Global Trust Bank', bankAccountNumber: '**** **** **** 1234', onlineTransactionNumber: 'TXN7890123'
    }],
    paymentMethod: 'Bank Transfer', bankName: 'Global Trust Bank', bankAccountNumber: '**** **** **** 1234', onlineTransactionNumber: 'TXN7890123'
  },
  {
    id: 'INV-2024002', customerId: 'CUST002', customerName: 'Beta Innovations',
    issueDate: '2024-07-05', dueDate: '2024-08-04',
    items: [{ id: 'item1', productId: 'PROD002', description: 'LABAN - 900 ML (Carton)', quantity: 1, unitPrice: (1.00 + 0.10) * 12, total: (1.00 + 0.10) * 12 * 1, unitType: 'Cartons' }],
    subtotal: (1.00 + 0.10) * 12 * 1, // Product Base Price + Product Excise Tax
    taxAmount: 0, // Assuming general tax is 0
    vatAmount: ((1.00 + 0.10) * 12 * 1) * (MOCK_COMPANY_PROFILE.vatRate as number / 100),
    totalAmount: ((1.00 + 0.10) * 12 * 1) + (((1.00 + 0.10) * 12 * 1) * (MOCK_COMPANY_PROFILE.vatRate as number / 100)),
    status: 'Partially Paid',
    paymentProcessingStatus: 'Partially Paid', amountPaid: 10, remainingBalance: (((1.00 + 0.10) * 12 * 1) + (((1.00 + 0.10) * 12 * 1) * (MOCK_COMPANY_PROFILE.vatRate as number / 100))) - 10,
    paymentHistory: [{
      id: 'PAY-HIST-002', paymentDate: '2024-07-20T14:30:00Z', amount: 10, status: 'Partial Payment',
      paymentMethod: 'Cash', cashVoucherNumber: 'CVN00123'
    }],
    paymentMethod: 'Cash', cashVoucherNumber: 'CVN00123'
  },
  {
    id: 'INV-2024003', customerId: 'CUST001', customerName: 'Alpha Solutions',
    issueDate: '2024-06-10', dueDate: '2024-07-10',
    items: [{ id: 'item1', productId: 'PROD003', description: 'Cooking Cream 1080ml', quantity: 5, unitPrice: (1.20 + 0), total: (1.20 + 0) * 5, unitType: 'PCS' }],
    subtotal: (1.20 + 0) * 5,
    taxAmount: 0,
    vatAmount: ((1.20 + 0) * 5) * (MOCK_COMPANY_PROFILE.vatRate as number / 100),
    totalAmount: ((1.20 + 0) * 5) + (((1.20 + 0) * 5) * (MOCK_COMPANY_PROFILE.vatRate as number / 100)),
    status: 'Overdue',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: ((1.20 + 0) * 5) + (((1.20 + 0) * 5) * (MOCK_COMPANY_PROFILE.vatRate as number / 100)),
    paymentHistory: []
  },
   {
    id: 'INV-2024004', customerId: 'CUST003', customerName: 'Gamma Services',
    issueDate: '2024-07-15', dueDate: '2024-08-15',
    items: [{ id: 'item1', productId: 'PROD004', description: 'Al Rabie Juice 125ml - Orange', quantity: 1, unitPrice: (0.60 + 0.02), total: (0.60 + 0.02) * 1, unitType: 'PCS' }],
    subtotal: (0.60 + 0.02) * 1,
    taxAmount: 0,
    vatAmount: ((0.60 + 0.02) * 1) * (MOCK_COMPANY_PROFILE.vatRate as number / 100),
    totalAmount: ((0.60 + 0.02) * 1) + (((0.60 + 0.02) * 1) * (MOCK_COMPANY_PROFILE.vatRate as number / 100)),
    status: 'Pending',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: ((0.60 + 0.02) * 1) + (((0.60 + 0.02) * 1) * (MOCK_COMPANY_PROFILE.vatRate as number / 100)),
    paymentHistory: []
  },
];

export const MOCK_MANAGERS: Manager[] = [
  { id: 'MGR001', name: 'Alice Wonderland', email: 'alice@invoiceflow.com', role: 'Administrator' },
  { id: 'MGR002', name: 'Bob The Builder', email: 'bob@invoiceflow.com', role: 'Invoice Manager' },
];

    