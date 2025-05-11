'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback }
  from 'react';
import type { Invoice, Customer, CompanyProfile, PaymentRecord } from '@/types';
import { MOCK_INVOICES, MOCK_CUSTOMERS, MOCK_COMPANY_PROFILE } from '@/types';

interface DataContextState {
  invoices: Invoice[];
  customers: Customer[];
  companyProfile: CompanyProfile;
  isLoading: boolean;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (invoiceId: string) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => void;
  getCustomerById: (customerId: string) => Customer | undefined;
  getInvoicesByCustomerId: (customerId: string) => Invoice[];
}

const DataContext = createContext<DataContextState | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  INVOICES: 'invoiceflow_invoices',
  CUSTOMERS: 'invoiceflow_customers',
  COMPANY_PROFILE: 'invoiceflow_companyProfile',
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(MOCK_COMPANY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on initial mount
  useEffect(() => {
    try {
      const storedInvoices = localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICES);
      if (storedInvoices) {
        setInvoices(JSON.parse(storedInvoices));
      } else {
        setInvoices(MOCK_INVOICES); // Initialize with mock if nothing in localStorage
      }

      const storedCustomers = localStorage.getItem(LOCAL_STORAGE_KEYS.CUSTOMERS);
      if (storedCustomers) {
        setCustomers(JSON.parse(storedCustomers));
      } else {
        setCustomers(MOCK_CUSTOMERS);
      }

      const storedCompanyProfile = localStorage.getItem(LOCAL_STORAGE_KEYS.COMPANY_PROFILE);
      if (storedCompanyProfile) {
        setCompanyProfile(JSON.parse(storedCompanyProfile));
      } else {
        setCompanyProfile(MOCK_COMPANY_PROFILE);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      // Fallback to mocks if localStorage fails
      setInvoices(MOCK_INVOICES);
      setCustomers(MOCK_CUSTOMERS);
      setCompanyProfile(MOCK_COMPANY_PROFILE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save invoices to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    }
  }, [invoices, isLoading]);

  // Save customers to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }
  }, [customers, isLoading]);

  // Save companyProfile to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.COMPANY_PROFILE, JSON.stringify(companyProfile));
    }
  }, [companyProfile, isLoading]);


  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prevInvoices) => [invoice, ...prevInvoices]);
  }, []);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    setInvoices((prevInvoices) =>
      prevInvoices.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
    );
  }, []);

  const deleteInvoice = useCallback((invoiceId: string) => {
    setInvoices((prevInvoices) => prevInvoices.filter((inv) => inv.id !== invoiceId));
  }, []);

  const addCustomer = useCallback((customer: Customer) => {
    setCustomers((prevCustomers) => [customer, ...prevCustomers]);
  }, []);

  const updateCustomer = useCallback((updatedCustomer: Customer) => {
    setCustomers((prevCustomers) =>
      prevCustomers.map((cust) => (cust.id === updatedCustomer.id ? updatedCustomer : cust))
    );
  }, []);

  const deleteCustomer = useCallback((customerId: string) => {
    setCustomers((prevCustomers) => prevCustomers.filter((cust) => cust.id !== customerId));
  }, []);

  const updateCompanyProfile = useCallback((profileUpdate: Partial<CompanyProfile>) => {
    setCompanyProfile((prevProfile) => ({ ...prevProfile, ...profileUpdate }));
  }, []);

  const getCustomerById = useCallback((customerId: string) => {
    return customers.find(c => c.id === customerId);
  }, [customers]);

  const getInvoicesByCustomerId = useCallback((customerId: string) => {
    return invoices.filter(inv => inv.customerId === customerId);
  }, [invoices]);

  const contextValue = {
    invoices,
    customers,
    companyProfile,
    isLoading,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    updateCompanyProfile,
    getCustomerById,
    getInvoicesByCustomerId,
  };

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextState => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
