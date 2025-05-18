
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
  unitPrice: number;
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
  subtotal: number;
  taxAmount: number;
  vatAmount: number;
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
  taxRate: number | string; // Percentage, allow string for form input
  vatRate: number | string; // Percentage
  excessTaxRate?: number | string; // Percentage
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
  id: string; // Can be the 'Code' from the sheet
  name: string; // From 'Item Description'
  sku: string; // Usually same as 'Code' or a variation
  category: ProductCategory;
  unitType: ProductUnitType; // Base unit for stock keeping (e.g., PCS if the price is per piece)
  packagingUnit?: string; // e.g., "Carton", "Box", "Pack"
  itemsPerPackagingUnit?: number; // From 'Item QTY Per Carton'
  stockLevel: number; // Dummy value
  reorderPoint: number; // Dummy value
  costPrice: number; // Cost to the company for one base unit
  salePrice: number; // Selling price for one base unit (e.g., "PCS Price" from sheet)
}

export const MOCK_PRODUCTS: Product[] = [
  { id: 'PROD3645224', name: 'Ice Cream Cone (vanilla ) -120ml', sku: 'ICCV12030', category: 'Frozen', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 24, stockLevel: 50, reorderPoint: 10, costPrice: 0.00, salePrice: 1.00 },
  { id: 'PROD5216208', name: 'LABAN - 900 ML', sku: 'LBN90020', category: 'Dairy', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 12, stockLevel: 100, reorderPoint: 20, costPrice: 0.00, salePrice: 7.50 },
  { id: '330012', name: 'Cooking Cream 1080ml (1x12 PCS)', sku: '330012', category: 'Dairy', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 12, stockLevel: 150, reorderPoint: 30, costPrice: 8.50, salePrice: 10.50 },
  { id: '25027-ORG', name: 'Al Rabie Juice 125ml - Orange (1x18 PCS)', sku: '25027-ORG', category: 'Beverages', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 18, stockLevel: 200, reorderPoint: 50, costPrice: 0.45, salePrice: 0.60 },
  { id: '80012-VAN', name: 'Ice Cream Tub 1.8L - Vanilla (1x6 PCS)', sku: '80012-VAN', category: 'Frozen', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 6, stockLevel: 80, reorderPoint: 20, costPrice: 9.00, salePrice: 11.50 },
  { id: '59012', name: 'UHT Milk 200ml (1x18 PCS)', sku: '59012', category: 'Dairy', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 18, stockLevel: 300, reorderPoint: 60, costPrice: 0.60, salePrice: 0.75 },
  { id: '330011', name: 'Whipping Cream 1080ml (1x12 PCS)', sku: '330011', category: 'Dairy', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 12, stockLevel: 120, reorderPoint: 25, costPrice: 6.00, salePrice: 7.50 },
  { id: '12024', name: 'Ice Cream Cone 120ml - Vanilla/Strawberry (1x24 PCS)', sku: '12024-VS', category: 'Frozen', unitType: 'PCS', packagingUnit: 'Carton', itemsPerPackagingUnit: 24, stockLevel: 240, reorderPoint: 48, costPrice: 0.70, salePrice: 0.90 },
  { id: 'PROD001_OLD', name: 'Vanilla Ice Cream 1L Tub (Old)', sku: 'VIC001_OLD', category: 'Frozen', unitType: 'PCS', stockLevel: 10, reorderPoint: 50, costPrice: 2.50, salePrice: 5.99, packagingUnit: 'Carton', itemsPerPackagingUnit: 6 },
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
    items: [{ id: 'item1', description: 'Web Development', quantity: 1, unitPrice: 1200, total: 1200, unitType: 'PCS' }],
    subtotal: 1200, taxAmount: 120, vatAmount: 180, totalAmount: 1500, status: 'Paid', // Assuming 15% VAT for example
    paymentProcessingStatus: 'Fully Paid', amountPaid: 1500, remainingBalance: 0,
    paymentHistory: [{
      id: 'PAY-HIST-001', paymentDate: '2024-07-15T10:00:00Z', amount: 1500, status: 'Full Payment',
      paymentMethod: 'Bank Transfer', bankName: 'Global Trust Bank', bankAccountNumber: '**** **** **** 1234', onlineTransactionNumber: 'TXN7890123'
    }],
    paymentMethod: 'Bank Transfer', bankName: 'Global Trust Bank', bankAccountNumber: '**** **** **** 1234', onlineTransactionNumber: 'TXN7890123'
  },
  {
    id: 'INV-2024002', customerId: 'CUST002', customerName: 'Beta Innovations',
    issueDate: '2024-07-05', dueDate: '2024-08-04',
    items: [{ id: 'item1', description: 'Cloud Consulting', quantity: 10, unitPrice: 300, total: 3000, unitType: 'Cartons' }],
    subtotal: 3000, taxAmount: 300, vatAmount: 450, totalAmount: 3750, status: 'Partially Paid',
    paymentProcessingStatus: 'Partially Paid', amountPaid: 1000, remainingBalance: 2750,
    paymentHistory: [{
      id: 'PAY-HIST-002', paymentDate: '2024-07-20T14:30:00Z', amount: 1000, status: 'Partial Payment',
      paymentMethod: 'Cash', cashVoucherNumber: 'CVN00123'
    }],
    paymentMethod: 'Cash', cashVoucherNumber: 'CVN00123'
  },
  {
    id: 'INV-2024003', customerId: 'CUST001', customerName: 'Alpha Solutions',
    issueDate: '2024-06-10', dueDate: '2024-07-10',
    items: [{ id: 'item1', description: 'Graphic Design', quantity: 5, unitPrice: 150, total: 750, unitType: 'PCS' }],
    subtotal: 750, taxAmount: 75, vatAmount: 112.5, totalAmount: 937.5, status: 'Overdue',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: 937.5,
    paymentHistory: []
  },
   {
    id: 'INV-2024004', customerId: 'CUST003', customerName: 'Gamma Services',
    issueDate: '2024-07-15', dueDate: '2024-08-15',
    items: [{ id: 'item1', description: 'SEO Optimization', quantity: 1, unitPrice: 500, total: 500, unitType: 'PCS' }],
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
  taxRate: 10, // 10%
  vatRate: 15,   // 15%
  excessTaxRate: 0
};

export const MOCK_MANAGERS: Manager[] = [
  { id: 'MGR001', name: 'Alice Wonderland', email: 'alice@invoiceflow.com', role: 'Administrator' },
  { id: 'MGR002', name: 'Bob The Builder', email: 'bob@invoiceflow.com', role: 'Invoice Manager' },
];
    
    



