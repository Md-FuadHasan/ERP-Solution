
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
  productId?: string; // ID of the product from the product catalog
  description: string;
  quantity: number;
  unitPrice: number; // This price NOW INCLUDES product-specific excise tax but is BEFORE invoice-level VAT
  total: number; // quantity * unitPrice (which includes excise)
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
  subtotal: number; // Sum of (item.quantity * (item.baseUnitPrice + item.unitExciseTax))
  taxAmount: number; // General tax (This is 0 if VAT is the primary tax after excise)
  vatAmount: number; // VAT on (subtotal including excise)
  totalAmount: number; // subtotal (incl. excise) + taxAmount (if any, likely 0) + vatAmount
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
  taxRate: number | string; // General Tax Rate Percentage (Now 0 as VAT is primary after excise)
  vatRate: number | string; // VAT Rate Percentage
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

export type ProductUnitType = 'PCS' | 'Cartons' | 'Liters' | 'Kgs' | 'Units' | 'ML';
export const PRODUCT_UNIT_TYPES: ProductUnitType[] = ['PCS', 'Cartons', 'Liters', 'Kgs', 'Units', 'ML'];


export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  unitType: ProductUnitType;      // Base unit for stockLevel & primary pricing (e.g., PCS, Carton)
  piecesInBaseUnit?: number;     // If unitType is a package (e.g., Carton), how many individual pieces it contains
  packagingUnit?: string;        // Optional LARGER sales package (e.g., Pallet, if unitType is Carton)
  itemsPerPackagingUnit?: number;// Number of 'unitType's in one 'packagingUnit'
  stockLevel: number;            // In terms of 'unitType'
  reorderPoint: number;          // In terms of 'unitType'
  costPrice: number;             // Cost per 'unitType'
  salePrice: number;             // Selling price for one 'unitType' (BEFORE excise tax, BEFORE VAT)
  exciseTax?: number;            // Excise tax amount PER 'unitType'
}

export const MOCK_PRODUCTS: Product[] = [
  { id: 'PROD3645224', name: 'Ice Cream Cone (vanilla) -120ml', sku: 'ICCV12030', category: 'Frozen', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 24, stockLevel: 50 * 24, reorderPoint: 10 * 24, costPrice: 0.50, salePrice: 0.80, exciseTax: 0.05 },
  { id: 'PROD5216208', name: 'LABAN - 900 ML', sku: 'LBN90020', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 12, stockLevel: 100 * 12, reorderPoint: 20 * 12, costPrice: 0.80, salePrice: 1.00, exciseTax: 0.10 }, // Adjusted cost/sale for PCS
  { id: 'PROD003', name: 'Cooking Cream 1080ml', sku: '330012', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 12, stockLevel: 150 * 12, reorderPoint: 30 * 12, costPrice: 1.00, salePrice: 1.20, exciseTax: 0 },
  { id: 'PROD004', name: 'Al Rabie Juice 125ml - Orange', sku: '25027-ORG', category: 'Beverages', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 18, stockLevel: 200 * 18, reorderPoint: 50 * 18, costPrice: 0.45, salePrice: 0.60, exciseTax: 0.02 },
  { id: 'PROD005', name: 'Ice Cream Tub 1.8L - Vanilla', sku: '80012-VAN', category: 'Frozen', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 6, stockLevel: 80 * 6, reorderPoint: 20 * 6, costPrice: 2.00, salePrice: 2.50, exciseTax: 0.50 },
  { id: 'PROD006', name: 'UHT Milk 200ml', sku: '59012', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 18, stockLevel: 300 * 18, reorderPoint: 60 * 18, costPrice: 0.60, salePrice: 0.75, exciseTax: 0 },
  { id: 'PROD007', name: 'Whipping Cream 1080ml', sku: '330011', category: 'Dairy', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 12, stockLevel: 120 * 12, reorderPoint: 25 * 12, costPrice: 1.10, salePrice: 1.30, exciseTax: 0 },
  { id: 'PROD008', name: 'Ice Cream Cone 120ml - Vanilla/Strawberry', sku: '12024-VS', category: 'Frozen', unitType: 'PCS', piecesInBaseUnit: 1, packagingUnit: 'Carton', itemsPerPackagingUnit: 24, stockLevel: 240 * 24, reorderPoint: 48 * 24, costPrice: 0.70, salePrice: 0.85, exciseTax: 0.03 },
  { id: 'PROD009', name: 'Sugar - Bulk', sku: 'SUG001', category: 'Raw Materials', unitType: 'Kgs', piecesInBaseUnit: 1, stockLevel: 1000, reorderPoint: 200, costPrice: 0.80, salePrice: 1.00, exciseTax: 0 }, // Assuming 1 Kg is the base unit
  { id: 'PROD010', name: 'Carton Box - Medium', sku: 'BOXM001', category: 'Packaging', unitType: 'PCS', piecesInBaseUnit: 1, stockLevel: 500, reorderPoint: 100, costPrice: 0.20, salePrice: 0.25, exciseTax: 0 },
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
    items: [{ id: 'item1',productId: 'PROD3645224', description: 'Ice Cream Cone (vanilla ) -120ml', quantity: 10, unitPrice: 0.85, total: 8.50, unitType: 'PCS' }], // unitPrice includes 0.05 excise
    subtotal: 8.50, // (0.80 base + 0.05 excise) * 10
    taxAmount: 0, // General tax assumed 0
    vatAmount: 1.28, // 15% on 8.50
    totalAmount: 9.78, // 8.50 + 1.28
    status: 'Paid',
    paymentProcessingStatus: 'Fully Paid', amountPaid: 9.78, remainingBalance: 0,
    paymentHistory: [{
      id: 'PAY-HIST-001', paymentDate: '2024-07-15T10:00:00Z', amount: 9.78, status: 'Full Payment',
      paymentMethod: 'Bank Transfer', bankName: 'Global Trust Bank', bankAccountNumber: '**** **** **** 1234', onlineTransactionNumber: 'TXN7890123'
    }],
    paymentMethod: 'Bank Transfer', bankName: 'Global Trust Bank', bankAccountNumber: '**** **** **** 1234', onlineTransactionNumber: 'TXN7890123'
  },
  {
    id: 'INV-2024002', customerId: 'CUST002', customerName: 'Beta Innovations',
    issueDate: '2024-07-05', dueDate: '2024-08-04',
    items: [{ id: 'item1', productId: 'PROD5216208', description: 'LABAN - 900 ML (Carton)', quantity: 1, unitPrice: 13.20 , total: 13.20, unitType: 'Cartons' }], // (1.00 base + 0.10 excise) * 12 PCS in Carton
    subtotal: 13.20,
    taxAmount: 0,
    vatAmount: 1.98, // 15% on 13.20
    totalAmount: 15.18, // 13.20 + 1.98
    status: 'Partially Paid',
    paymentProcessingStatus: 'Partially Paid', amountPaid: 10, remainingBalance: 5.18,
    paymentHistory: [{
      id: 'PAY-HIST-002', paymentDate: '2024-07-20T14:30:00Z', amount: 10, status: 'Partial Payment',
      paymentMethod: 'Cash', cashVoucherNumber: 'CVN00123'
    }],
    paymentMethod: 'Cash', cashVoucherNumber: 'CVN00123'
  },
  {
    id: 'INV-2024003', customerId: 'CUST001', customerName: 'Alpha Solutions',
    issueDate: '2024-06-10', dueDate: '2024-07-10',
    items: [{ id: 'item1', productId: 'PROD003', description: 'Cooking Cream 1080ml', quantity: 5, unitPrice: 1.20, total: 6.00, unitType: 'PCS' }], // 1.20 base + 0 excise
    subtotal: 6.00,
    taxAmount: 0,
    vatAmount: 0.90, // 15% on 6.00
    totalAmount: 6.90, // 6.00 + 0.90
    status: 'Overdue',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: 6.90,
    paymentHistory: []
  },
   {
    id: 'INV-2024004', customerId: 'CUST003', customerName: 'Gamma Services',
    issueDate: '2024-07-15', dueDate: '2024-08-15',
    items: [{ id: 'item1', description: 'SEO Optimization', quantity: 1, unitPrice: 500, total: 500, unitType: 'PCS' }], // Assuming 0 excise for service
    subtotal: 500,
    taxAmount: 0,
    vatAmount: 75,
    totalAmount: 575,
    status: 'Pending',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: 575,
    paymentHistory: []
  },
];

export const MOCK_COMPANY_PROFILE: CompanyProfile = {
  name: 'InvoiceFlow Solutions Inc.',
  address: '123 App Dev Lane, Suite 404, Logic City, OS 12345',
  phone: '(555) 123-4567',
  email: 'hello@invoiceflow.com',
  taxRate: 0, // General Tax set to 0, as VAT is primary
  vatRate: 15, // VAT: 15%
  excessTaxRate: 0
};

export const MOCK_MANAGERS: Manager[] = [
  { id: 'MGR001', name: 'Alice Wonderland', email: 'alice@invoiceflow.com', role: 'Administrator' },
  { id: 'MGR002', name: 'Bob The Builder', email: 'bob@invoiceflow.com', role: 'Invoice Manager' },
];

    