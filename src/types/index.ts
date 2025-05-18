
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
  createdAt: string; // Use string for date to simplify for now
  customerType: CustomerType;
  creditLimit?: number;
  invoiceAgingDays?: InvoiceAgingDays;
  registrationNumber?: string; // CR - Customer Registration Number
  vatNumber?: string; // VAT Number
}

export interface InvoiceItem {
  id:string;
  description: string;
  quantity: number;
  unitPrice: number; // This price will be inclusive of product-specific excise tax, but exclusive of invoice-level general tax/VAT
  total: number;
  unitType: 'Cartons' | 'PCS'; // Made mandatory
}

export type PaymentProcessingStatus = 'Unpaid' | 'Partially Paid' | 'Fully Paid';
export const ALL_PAYMENT_PROCESSING_STATUSES: PaymentProcessingStatus[] = ['Unpaid', 'Partially Paid', 'Fully Paid'];

export type PaymentMethod = 'Cash' | 'Bank Transfer';
export const ALL_PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Bank Transfer'];

export interface PaymentRecord {
  id: string;
  paymentDate: string; // ISO string
  amount: number;
  status: 'Full Payment' | 'Partial Payment'; // Status of this specific payment
  paymentMethod?: PaymentMethod;
  cashVoucherNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  onlineTransactionNumber?: string;
}

export type InvoiceStatus = 'Pending' | 'Partially Paid' | 'Overdue' | 'Paid' | 'Cancelled';
export const ALL_INVOICE_STATUSES: InvoiceStatus[] = ['Pending', 'Partially Paid', 'Overdue', 'Paid', 'Cancelled'];

export interface Invoice {
  id: string; // Editable invoice number
  customerId: string;
  customerName?: string; // Denormalized for display
  issueDate: string; // Use string for date
  dueDate: string; // Use string for date
  items: InvoiceItem[];
  subtotal: number; // Sum of (item.quantity * item.unitPrice_with_excise)
  taxAmount: number; // General tax on subtotal
  vatAmount: number; // VAT on subtotal (or subtotal + general tax if applicable)
  totalAmount: number;
  status: InvoiceStatus;
  paymentProcessingStatus: PaymentProcessingStatus;
  amountPaid: number;
  remainingBalance: number;
  paymentHistory?: PaymentRecord[];
  paymentMethod?: PaymentMethod; // Last payment method used
  cashVoucherNumber?: string; // Last cash voucher used
  bankName?: string; // Last bank name used
  bankAccountNumber?: string; // Last bank account used
  onlineTransactionNumber?: string; // Last transaction number used
}

export interface CompanyProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number | string; // General Tax Rate Percentage, allow string for form input
  vatRate: number | string; // VAT Rate Percentage
  excessTaxRate?: number | string; // This might be re-purposed or reviewed. Current invoice logic uses taxRate & vatRate.
}

export interface Manager {
  id: string;
  name: string;
  email: string;
  role: string; // e.g., 'Admin', 'Invoice Manager'
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string; // Optional fill color for chart segments
}

export interface ReportSummary {
  summary: string;
  paymentTrends?: string;
  customerBalances?: string;
  actionableInsights?: string;
}

export type ProductCategory = 'Frozen' | 'Dairy' | 'Beverages' | 'Raw Materials' | 'Packaging';
export type ProductUnitType = 'PCS' | 'Cartons' | 'Liters' | 'Kgs' | 'Units' | 'ML';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  unitType: ProductUnitType; // Base unit for stock keeping
  packagingUnit?: string;
  itemsPerPackagingUnit?: number;
  stockLevel: number;
  reorderPoint: number;
  costPrice: number; // Cost to the company for one base unit
  salePrice: number; // Selling price for one base unit (BEFORE excise tax, BEFORE VAT)
  exciseTax?: number; // Excise tax amount PER BASE UNIT
}

export const MOCK_PRODUCTS: Product[] = [
  { id: 'PROD3645224', name: 'Ice Cream Cone (vanilla ) -120ml', sku: 'ICCV12030', category: 'Frozen', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 24, stockLevel: 50, reorderPoint: 10, costPrice: 0.50, salePrice: 0.80, exciseTax: 0.05 }, // 0.80 base + 0.05 excise = 0.85 before VAT
  { id: 'PROD5216208', name: 'LABAN - 900 ML', sku: 'LBN90020', category: 'Dairy', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 12, stockLevel: 100, reorderPoint: 20, costPrice: 6.00, salePrice: 7.00, exciseTax: 0.10 }, // 7.00 base + 0.10 excise = 7.10 before VAT
  { id: '330012', name: 'Cooking Cream 1080ml', sku: '330012', category: 'Dairy', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 12, stockLevel: 150, reorderPoint: 30, costPrice: 8.50, salePrice: 10.00 }, // No excise
  { id: '25027-ORG', name: 'Al Rabie Juice 125ml - Orange', sku: '25027-ORG', category: 'Beverages', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 18, stockLevel: 200, reorderPoint: 50, costPrice: 0.45, salePrice: 0.60, exciseTax: 0.02 },
  { id: '80012-VAN', name: 'Ice Cream Tub 1.8L - Vanilla', sku: '80012-VAN', category: 'Frozen', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 6, stockLevel: 80, reorderPoint: 20, costPrice: 9.00, salePrice: 11.00, exciseTax: 0.50 },
  { id: '59012', name: 'UHT Milk 200ml', sku: '59012', category: 'Dairy', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 18, stockLevel: 300, reorderPoint: 60, costPrice: 0.60, salePrice: 0.75 },
  { id: '330011', name: 'Whipping Cream 1080ml', sku: '330011', category: 'Dairy', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 12, stockLevel: 120, reorderPoint: 25, costPrice: 6.00, salePrice: 7.00 },
  { id: '12024', name: 'Ice Cream Cone 120ml - Vanilla/Strawberry', sku: '12024-VS', category: 'Frozen', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 24, stockLevel: 240, reorderPoint: 48, costPrice: 0.70, salePrice: 0.85, exciseTax: 0.03 },
  { id: 'MAT001', name: 'Sugar - Bulk', sku: 'SUG001', category: 'Raw Materials', unitType: 'Kgs', stockLevel: 1000, reorderPoint: 200, costPrice: 0.80, salePrice: 1.00 },
  { id: 'PACK001', name: 'Carton Box - Medium', sku: 'BOXM001', category: 'Packaging', unitType: 'PCS', stockLevel: 500, reorderPoint: 100, costPrice: 0.20, salePrice: 0.25 },
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
    // Assuming product with ID 'PROD3645224' has salePrice 0.80, exciseTax 0.05. Unit price = 0.85
    items: [{ id: 'item1', description: 'Ice Cream Cone (vanilla ) -120ml', quantity: 10, unitPrice: 0.85, total: 8.50, unitType: 'PCS' }],
    subtotal: 8.50, taxAmount: 0.85, vatAmount: 1.28, totalAmount: 10.63, status: 'Paid',
    paymentProcessingStatus: 'Fully Paid', amountPaid: 10.63, remainingBalance: 0,
    paymentHistory: [{
      id: 'PAY-HIST-001', paymentDate: '2024-07-15T10:00:00Z', amount: 10.63, status: 'Full Payment',
      paymentMethod: 'Bank Transfer', bankName: 'Global Trust Bank', bankAccountNumber: '**** **** **** 1234', onlineTransactionNumber: 'TXN7890123'
    }],
    paymentMethod: 'Bank Transfer', bankName: 'Global Trust Bank', bankAccountNumber: '**** **** **** 1234', onlineTransactionNumber: 'TXN7890123'
  },
  {
    id: 'INV-2024002', customerId: 'CUST002', customerName: 'Beta Innovations',
    issueDate: '2024-07-05', dueDate: '2024-08-04',
    // Assuming product 'PROD5216208' is LABAN, salePrice 7.00, exciseTax 0.10 (per PCS). itemsPerPackagingUnit 12.
    // Unit Price for Carton = (7.00 + 0.10) * 12 = 7.10 * 12 = 85.20
    items: [{ id: 'item1', description: 'LABAN - 900 ML (Carton)', quantity: 1, unitPrice: 85.20, total: 85.20, unitType: 'Cartons' }],
    subtotal: 85.20, taxAmount: 8.52, vatAmount: 12.78, totalAmount: 106.50, status: 'Partially Paid',
    paymentProcessingStatus: 'Partially Paid', amountPaid: 50, remainingBalance: 56.50,
    paymentHistory: [{
      id: 'PAY-HIST-002', paymentDate: '2024-07-20T14:30:00Z', amount: 50, status: 'Partial Payment',
      paymentMethod: 'Cash', cashVoucherNumber: 'CVN00123'
    }],
    paymentMethod: 'Cash', cashVoucherNumber: 'CVN00123'
  },
  {
    id: 'INV-2024003', customerId: 'CUST001', customerName: 'Alpha Solutions',
    issueDate: '2024-06-10', dueDate: '2024-07-10',
    // Assuming product '330012' is Cooking Cream, salePrice 10.00, no excise.
    items: [{ id: 'item1', description: 'Cooking Cream 1080ml', quantity: 5, unitPrice: 10.00, total: 50.00, unitType: 'PCS' }],
    subtotal: 50.00, taxAmount: 5.00, vatAmount: 7.50, totalAmount: 62.50, status: 'Overdue',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: 62.50,
    paymentHistory: []
  },
   {
    id: 'INV-2024004', customerId: 'CUST003', customerName: 'Gamma Services',
    issueDate: '2024-07-15', dueDate: '2024-08-15',
    items: [{ id: 'item1', description: 'SEO Optimization', quantity: 1, unitPrice: 500, total: 500, unitType: 'PCS' }], // Generic item
    subtotal: 500, taxAmount: 50, vatAmount: 75, totalAmount: 625, status: 'Pending',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: 625,
    paymentHistory: []
  },
];

export const MOCK_COMPANY_PROFILE: CompanyProfile = {
  name: 'InvoiceFlow Solutions Inc.',
  address: '123 App Dev Lane, Suite 404, Logic City, OS 12345',
  phone: '(555) 123-4567',
  email: 'hello@invoiceflow.com',
  taxRate: 10, // General Tax: 10%
  vatRate: 15, // VAT: 15%
  excessTaxRate: 0 // Not actively used by invoice calc logic as is.
};

export const MOCK_MANAGERS: Manager[] = [
  { id: 'MGR001', name: 'Alice Wonderland', email: 'alice@invoiceflow.com', role: 'Administrator' },
  { id: 'MGR002', name: 'Bob The Builder', email: 'bob@invoiceflow.com', role: 'Invoice Manager' },
];
