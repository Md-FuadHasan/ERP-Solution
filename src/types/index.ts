
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
  // Subtotal = Sum of all (item.quantity * (product base price + product excise tax)).
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
  taxRate: number | string; // General tax rate
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
  piecesInBaseUnit?: number;     // If unitType is a package (e.g., Carton), how many individual conceptual pieces (e.g., PCS) it contains
  packagingUnit?: string;        // Optional LARGER sales package (e.g., Pallet, if unitType is Carton)
  itemsPerPackagingUnit?: number;// Number of 'unitType's in one 'packagingUnit'
  stockLevel: number;            // In terms of 'unitType'
  reorderPoint: number;          // In terms of 'unitType'
  basePrice: number;             // Base selling price for one 'unitType' (BEFORE any taxes)
  costPrice: number;             // Cost per 'unitType'
  exciseTax?: number;            // Excise tax amount PER 'unitType'
  batchNo?: string;
  productionDate?: string; // ISO string
  expiryDate?: string;     // ISO string
  discountRate?: number;   // Percentage e.g., 10 for 10%
  createdAt?: string;
}

export const MOCK_COMPANY_PROFILE: CompanyProfile = {
  name: 'InvoiceFlow Solutions Inc.',
  address: '123 App Dev Lane, Suite 404, Logic City, OS 12345',
  phone: '(555) 123-4567',
  email: 'hello@invoiceflow.com',
  taxRate: 0, // General tax set to 0
  vatRate: 15, // VAT at 15%
  excessTaxRate: 0
};

// Assuming "today" for testing is around late July 2024
// To make this always testable, you might need to adjust dates or clear local storage before running
const todayForMock = new Date();
const nearExpiryDate = new Date(todayForMock);
nearExpiryDate.setDate(todayForMock.getDate() + 15); // Expires in 15 days

const furtherExpiryDate = new Date(todayForMock);
furtherExpiryDate.setDate(todayForMock.getDate() + 45); // Expires in 45 days


export const MOCK_PRODUCTS: Product[] = [
  { id: 'PROD001', name: 'Ice Cream Cone (Vanilla) - 120ml', sku: 'ICCV12030', category: 'Frozen', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 24, stockLevel: 5 * 24, reorderPoint: 10 * 24, costPrice: 0.30, basePrice: 0.80, exciseTax: 0.05, batchNo: 'B001', productionDate: '2023-01-01', expiryDate: nearExpiryDate.toISOString().split('T')[0], discountRate: 0, createdAt: new Date().toISOString() },
  { id: 'PROD002', name: 'LABAN - 900 ML', sku: 'LBN90020', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 12, stockLevel: 100 * 12, reorderPoint: 20 * 12, costPrice: 0.60, basePrice: 1.00, exciseTax: 0.10, discountRate: 5, createdAt: new Date().toISOString(), expiryDate: '2024-12-31' },
  { id: 'PROD003', name: 'Cooking Cream 1080ml', sku: '330012', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 12, stockLevel: 150 * 12, reorderPoint: 30 * 12, costPrice: 0.80, basePrice: 1.20, exciseTax: 0, createdAt: new Date().toISOString(), expiryDate: '2025-01-15' },
  { id: 'PROD004', name: 'Al Rabie Juice 125ml - Orange', sku: '25027-ORG', category: 'Beverages', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 18, stockLevel: 200 * 18, reorderPoint: 50 * 18, costPrice: 0.35, basePrice: 0.60, exciseTax: 0.02, createdAt: new Date().toISOString(), expiryDate: furtherExpiryDate.toISOString().split('T')[0] },
  { id: 'PROD005', name: 'Ice Cream Tub 1.8L - Vanilla', sku: '80012-VAN', category: 'Frozen', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 6, stockLevel: 80 * 6, reorderPoint: 20 * 6, costPrice: 1.50, basePrice: 2.50, exciseTax: 0.50, createdAt: new Date().toISOString(), expiryDate: '2024-11-30' },
  { id: 'PROD006', name: 'UHT Milk 200ml', sku: '59012', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 18, stockLevel: 300 * 18, reorderPoint: 60 * 18, costPrice: 0.40, basePrice: 0.75, exciseTax: 0, createdAt: new Date().toISOString(), expiryDate: '2024-10-15' },
  { id: 'PROD007', name: 'Whipping Cream 1080ml', sku: '330011', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 12, stockLevel: 120 * 12, reorderPoint: 25 * 12, costPrice: 0.90, basePrice: 1.30, exciseTax: 0, createdAt: new Date().toISOString() }, // No expiry for testing
  { id: 'PROD008', name: 'Ice Cream Cone 120ml - Vanilla/Strawberry', sku: '12024-VS', category: 'Frozen', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 24, stockLevel: 240 * 24, reorderPoint: 48 * 24, costPrice: 0.35, basePrice: 0.85, exciseTax: 0.03, createdAt: new Date().toISOString(), expiryDate: '2024-09-30' },
  { id: 'PROD009', name: 'Sugar - Bulk', sku: 'SUG001', category: 'Raw Materials', unitType: 'Kgs', piecesInBaseUnit: 1, stockLevel: 1000, reorderPoint: 200, costPrice: 0.70, basePrice: 1.00, exciseTax: 0, createdAt: new Date().toISOString() },
  { id: 'PROD010', name: 'Carton Box - Medium', sku: 'BOXM001', category: 'Packaging', unitType: 'PCS', piecesInBaseUnit: 1, stockLevel: 500, reorderPoint: 100, costPrice: 0.15, basePrice: 0.25, exciseTax: 0, createdAt: new Date().toISOString() },
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
    taxAmount: 0, // General tax is 0
    vatAmount: ((0.80 + 0.05) * 10) * (MOCK_COMPANY_PROFILE.vatRate as number / 100),
    totalAmount: ((0.80 + 0.05) * 10) * (1 + (MOCK_COMPANY_PROFILE.vatRate as number / 100)),
    status: 'Paid',
    paymentProcessingStatus: 'Fully Paid', amountPaid: ((0.80 + 0.05) * 10) * (1 + (MOCK_COMPANY_PROFILE.vatRate as number / 100)), remainingBalance: 0,
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
    subtotal: (1.00 + 0.10) * 12 * 1, // Base + Excise per PCS, times items in carton
    taxAmount: 0,
    vatAmount: ((1.00 + 0.10) * 12 * 1) * (MOCK_COMPANY_PROFILE.vatRate as number / 100),
    totalAmount: ((1.00 + 0.10) * 12 * 1) * (1 + (MOCK_COMPANY_PROFILE.vatRate as number / 100)),
    status: 'Partially Paid',
    paymentProcessingStatus: 'Partially Paid', amountPaid: 10, remainingBalance: (((1.00 + 0.10) * 12 * 1) * (1 + (MOCK_COMPANY_PROFILE.vatRate as number / 100))) - 10,
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
    subtotal: (1.20 + 0) * 5, // Base + Excise
    taxAmount: 0,
    vatAmount: ((1.20 + 0) * 5) * (MOCK_COMPANY_PROFILE.vatRate as number / 100),
    totalAmount: ((1.20 + 0) * 5) * (1 + (MOCK_COMPANY_PROFILE.vatRate as number / 100)),
    status: 'Overdue',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: ((1.20 + 0) * 5) * (1 + (MOCK_COMPANY_PROFILE.vatRate as number / 100)),
    paymentHistory: []
  },
   {
    id: 'INV-2024004', customerId: 'CUST003', customerName: 'Gamma Services',
    issueDate: '2024-07-15', dueDate: '2024-08-15',
    items: [{ id: 'item1', productId: 'PROD004', description: 'Al Rabie Juice 125ml - Orange', quantity: 1, unitPrice: (0.60 + 0.02), total: (0.60 + 0.02) * 1, unitType: 'PCS' }],
    subtotal: (0.60 + 0.02) * 1, // Base + Excise
    taxAmount: 0,
    vatAmount: ((0.60 + 0.02) * 1) * (MOCK_COMPANY_PROFILE.vatRate as number / 100),
    totalAmount: ((0.60 + 0.02) * 1) * (1 + (MOCK_COMPANY_PROFILE.vatRate as number / 100)),
    status: 'Pending',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: ((0.60 + 0.02) * 1) * (1 + (MOCK_COMPANY_PROFILE.vatRate as number / 100)),
    paymentHistory: []
  },
];

export const MOCK_MANAGERS: Manager[] = [
  { id: 'MGR001', name: 'Alice Wonderland', email: 'alice@invoiceflow.com', role: 'Administrator' },
  { id: 'MGR002', name: 'Bob The Builder', email: 'bob@invoiceflow.com', role: 'Invoice Manager' },
];

    
