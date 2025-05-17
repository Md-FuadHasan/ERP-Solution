
'use client';
import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Customer, Invoice, CompanyProfile, PaymentRecord } from '@/types';
import { MOCK_CUSTOMERS, MOCK_INVOICES, MOCK_COMPANY_PROFILE } from '@/types';

interface DataContextType {
  customers: Customer[];
  invoices: Invoice[];
  companyProfile: CompanyProfile;
  isLoading: boolean;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (invoiceId: string) => void;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => void;
  getInvoicesByCustomerId: (customerId: string) => Invoice[];
  getCustomerById: (customerId: string) => Customer | undefined;
  getInvoiceById: (invoiceId: string) => Invoice | undefined;
  getOutstandingBalanceByCustomerId: (customerId: string) => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  CUSTOMERS: 'invoiceflow_customers',
  INVOICES: 'invoiceflow_invoices',
  COMPANY_PROFILE: 'invoiceflow_company_profile',
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(MOCK_COMPANY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on initial mount
  useEffect(() => {
    setIsLoading(true);
    try {
      const storedCustomers = localStorage.getItem(LOCAL_STORAGE_KEYS.CUSTOMERS);
      if (storedCustomers) {
        setCustomers(JSON.parse(storedCustomers));
      } else {
        setCustomers(MOCK_CUSTOMERS); 
      }

      const storedInvoices = localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICES);
      if (storedInvoices) {
        setInvoices(JSON.parse(storedInvoices));
      } else {
        setInvoices(MOCK_INVOICES); 
      }

      const storedProfile = localStorage.getItem(LOCAL_STORAGE_KEYS.COMPANY_PROFILE);
      if (storedProfile) {
        setCompanyProfile(JSON.parse(storedProfile));
      } else {
        setCompanyProfile(MOCK_COMPANY_PROFILE); 
      }
    } catch (error) {
      console.error("DataContext: Failed to load data from localStorage, using mocks:", error);
      setCustomers(MOCK_CUSTOMERS);
      setInvoices(MOCK_INVOICES);
      setCompanyProfile(MOCK_COMPANY_PROFILE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save customers to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      } catch (error) {
        console.error("Failed to save customers to localStorage:", error);
      }
    }
  }, [customers, isLoading]);

  // Save invoices to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      } catch (error) {
        console.error("Failed to save invoices to localStorage:", error);
      }
    }
  }, [invoices, isLoading]);

  // Save company profile to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.COMPANY_PROFILE, JSON.stringify(companyProfile));
      } catch (error) {
        console.error("Failed to save company profile to localStorage:", error);
      }
    }
  }, [companyProfile, isLoading]);


  const addCustomer = useCallback((customer: Customer) => {
    setCustomers((prev) => [customer, ...prev]);
  }, []);

  const updateCustomer = useCallback((updatedCustomer: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );
  }, []);

  const deleteCustomer = useCallback((customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    setInvoices((prevInvoices) => prevInvoices.filter(inv => inv.customerId !== customerId));
  }, []);

  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => [invoice, ...prev]);
  }, []);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i))
    );
  }, []);

  const deleteInvoice = useCallback((invoiceId: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
  }, []);

  const updateCompanyProfile = useCallback((profileUpdate: Partial<CompanyProfile>) => {
    setCompanyProfile((prev) => ({ ...prev, ...profileUpdate }));
  }, []);

  const getInvoicesByCustomerId = useCallback((customerId: string) => {
    return invoices.filter(invoice => invoice.customerId === customerId);
  }, [invoices]);

  const getCustomerById = useCallback((customerId: string) => {
    return customers.find(customer => customer.id === customerId);
  }, [customers]);

  const getInvoiceById = useCallback((invoiceId: string) => {
    return invoices.find(invoice => invoice.id === invoiceId);
  }, [invoices]);

  const getOutstandingBalanceByCustomerId = useCallback((customerId: string) => {
    return invoices
      .filter(invoice => invoice.customerId === customerId && invoice.status !== 'Paid' && invoice.status !== 'Cancelled')
      .reduce((sum, invoice) => sum + invoice.remainingBalance, 0);
  }, [invoices]);

  return (
    <DataContext.Provider
      value={{
        customers,
        invoices,
        companyProfile,
        isLoading,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        updateCompanyProfile,
        getInvoicesByCustomerId,
        getCustomerById,
        getInvoiceById,
        getOutstandingBalanceByCustomerId,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
