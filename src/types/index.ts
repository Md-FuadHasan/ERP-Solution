
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

// Updated InvoiceStatus type and const
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

// For dashboard charts
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
    subtotal: 1200, taxAmount: 120, vatAmount: 60, totalAmount: 1380, status: 'Paid', 
    paymentProcessingStatus: 'Fully Paid', amountPaid: 1380, remainingBalance: 0,
    paymentHistory: [{ 
      id: 'PAY-HIST-001', paymentDate: '2024-07-15T10:00:00Z', amount: 1380, status: 'Full Payment',
      paymentMethod: 'Bank Transfer', bankName: 'Global Trust Bank', bankAccountNumber: '**** **** **** 1234', onlineTransactionNumber: 'TXN7890123'
    }],
    paymentMethod: 'Bank Transfer', bankName: 'Global Trust Bank', bankAccountNumber: '**** **** **** 1234', onlineTransactionNumber: 'TXN7890123'
  },
  { 
    id: 'INV-2024002', customerId: 'CUST002', customerName: 'Beta Innovations',
    issueDate: '2024-07-05', dueDate: '2024-08-04', 
    items: [{ id: 'item1', description: 'Cloud Consulting', quantity: 10, unitPrice: 300, total: 3000, unitType: 'Cartons' }],
    subtotal: 3000, taxAmount: 300, vatAmount: 150, totalAmount: 3450, status: 'Partially Paid', 
    paymentProcessingStatus: 'Partially Paid', amountPaid: 1000, remainingBalance: 2450,
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
    subtotal: 750, taxAmount: 75, vatAmount: 37.5, totalAmount: 862.5, status: 'Overdue', 
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: 862.5,
    paymentHistory: []
  },
   { 
    id: 'INV-2024004', customerId: 'CUST003', customerName: 'Gamma Services',
    issueDate: '2024-07-15', dueDate: '2024-08-15', 
    items: [{ id: 'item1', description: 'SEO Optimization', quantity: 1, unitPrice: 500, total: 500, unitType: 'PCS' }],
    subtotal: 500, taxAmount: 50, vatAmount: 25, totalAmount: 575, status: 'Pending', 
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: 575,
    paymentHistory: []
  },
];

export const MOCK_COMPANY_PROFILE: CompanyProfile = {
  name: 'InvoiceFlow Solutions Inc.',
  address: '123 App Dev Lane, Suite 404, Logic City, OS 12345',
  phone: '(555) 123-4567',
  email: 'hello@invoiceflow.com',
  taxRate: 10, // 10%
  vatRate: 5,   // 5%
  excessTaxRate: 2 // 2%
};

export const MOCK_MANAGERS: Manager[] = [
  { id: 'MGR001', name: 'Alice Wonderland', email: 'alice@invoiceflow.com', role: 'Administrator' },
  { id: 'MGR002', name: 'Bob The Builder', email: 'bob@invoiceflow.com', role: 'Invoice Manager' },
];
