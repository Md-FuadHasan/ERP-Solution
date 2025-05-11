
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress?: string;
  createdAt: string; // Use string for date to simplify for now
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type PaymentProcessingStatus = 'Unpaid' | 'Partially Paid' | 'Fully Paid';
export const ALL_PAYMENT_PROCESSING_STATUSES: PaymentProcessingStatus[] = ['Unpaid', 'Partially Paid', 'Fully Paid'];

export interface PaymentRecord {
  id: string;
  paymentDate: string; // ISO string
  amount: number;
  status: 'Full Payment' | 'Partial Payment'; // Status of this specific payment
}

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
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  paymentProcessingStatus: PaymentProcessingStatus;
  amountPaid: number;
  remainingBalance: number;
  paymentHistory?: PaymentRecord[];
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

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
export const ALL_INVOICE_STATUSES: InvoiceStatus[] = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'CUST001', name: 'Alpha Solutions', email: 'contact@alpha.com', phone: '555-0101', billingAddress: '123 Tech Road, Silicon Valley, CA', createdAt: new Date().toISOString() },
  { id: 'CUST002', name: 'Beta Innovations', email: 'info@beta.dev', phone: '555-0102', billingAddress: '456 Code Avenue, Byte City, TX', createdAt: new Date().toISOString() },
  { id: 'CUST003', name: 'Gamma Services', email: 'support@gamma.io', phone: '555-0103', billingAddress: '789 Server Street, Cloud Town, WA', createdAt: new Date().toISOString() },
];

export const MOCK_INVOICES: Invoice[] = [
  { 
    id: 'INV-2024-001', customerId: 'CUST001', customerName: 'Alpha Solutions', 
    issueDate: '2024-07-01', dueDate: '2024-07-31', 
    items: [{ id: 'item1', description: 'Web Development', quantity: 1, unitPrice: 1200, total: 1200 }],
    subtotal: 1200, taxAmount: 120, vatAmount: 60, totalAmount: 1380, status: 'Paid',
    paymentProcessingStatus: 'Fully Paid', amountPaid: 1380, remainingBalance: 0,
    paymentHistory: [{ id: 'PAY-HIST-001', paymentDate: '2024-07-15T10:00:00Z', amount: 1380, status: 'Full Payment' }]
  },
  { 
    id: 'INV-2024-002', customerId: 'CUST002', customerName: 'Beta Innovations',
    issueDate: '2024-07-05', dueDate: '2024-08-04', 
    items: [{ id: 'item1', description: 'Cloud Consulting', quantity: 10, unitPrice: 300, total: 3000 }],
    subtotal: 3000, taxAmount: 300, vatAmount: 150, totalAmount: 3450, status: 'Sent',
    paymentProcessingStatus: 'Partially Paid', amountPaid: 1000, remainingBalance: 2450,
    paymentHistory: [{ id: 'PAY-HIST-002', paymentDate: '2024-07-20T14:30:00Z', amount: 1000, status: 'Partial Payment' }]
  },
  { 
    id: 'INV-2024-003', customerId: 'CUST001', customerName: 'Alpha Solutions',
    issueDate: '2024-06-10', dueDate: '2024-07-10', 
    items: [{ id: 'item1', description: 'Graphic Design', quantity: 5, unitPrice: 150, total: 750 }],
    subtotal: 750, taxAmount: 75, vatAmount: 37.5, totalAmount: 862.5, status: 'Overdue',
    paymentProcessingStatus: 'Unpaid', amountPaid: 0, remainingBalance: 862.5,
    paymentHistory: []
  },
   { 
    id: 'INV-2024-004', customerId: 'CUST003', customerName: 'Gamma Services',
    issueDate: '2024-07-15', dueDate: '2024-08-15', 
    items: [{ id: 'item1', description: 'SEO Optimization', quantity: 1, unitPrice: 500, total: 500 }],
    subtotal: 500, taxAmount: 50, vatAmount: 25, totalAmount: 575, status: 'Draft',
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
