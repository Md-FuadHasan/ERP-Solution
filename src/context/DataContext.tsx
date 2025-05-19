
'use client';
import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Customer, Invoice, CompanyProfile, PaymentRecord, Product } from '@/types';
import { MOCK_CUSTOMERS, MOCK_INVOICES, MOCK_COMPANY_PROFILE, MOCK_PRODUCTS } from '@/types';

interface DataContextType {
  customers: Customer[];
  invoices: Invoice[];
  products: Product[];
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
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  CUSTOMERS: 'invoiceflow_customers',
  INVOICES: 'invoiceflow_invoices',
  COMPANY_PROFILE: 'invoiceflow_company_profile',
  PRODUCTS: 'invoiceflow_products',
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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

      const storedProducts = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(MOCK_PRODUCTS);
      }

    } catch (error) {
      console.error("DataContext: Failed to load data from localStorage, using mocks:", error);
      setCustomers(MOCK_CUSTOMERS);
      setInvoices(MOCK_INVOICES);
      setCompanyProfile(MOCK_COMPANY_PROFILE);
      setProducts(MOCK_PRODUCTS);
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

  // Save products to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      } catch (error) {
        console.error("Failed to save products to localStorage:", error);
      }
    }
  }, [products, isLoading]);


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
    // Optionally, also delete associated invoices or handle them differently
    // For now, just deleting customer, invoices remain (orphaned or could be filtered out in UI)
  }, []);

  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => [invoice, ...prev]);

    // Deduct stock if invoice is not cancelled
    if (invoice.status !== 'Cancelled') {
      setProducts((currentProducts) => {
        const updatedProducts = currentProducts.map(p => ({ ...p })); // Create a mutable copy

        invoice.items.forEach(item => {
          if (!item.productId) return; 

          const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
          if (productIndex !== -1) {
            const product = updatedProducts[productIndex];
            let quantityToDeduct = item.quantity;

            if (item.unitType === 'Cartons' && product.packagingUnit && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
              quantityToDeduct = item.quantity * product.itemsPerPackagingUnit;
            }
            
            updatedProducts[productIndex] = {
              ...product,
              stockLevel: Math.max(0, product.stockLevel - quantityToDeduct),
            };
          }
        });
        return updatedProducts;
      });
    }
  }, []);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    const originalInvoice = invoices.find(inv => inv.id === updatedInvoice.id);

    setProducts((currentProducts) => {
      let tempProducts = currentProducts.map(p => ({ ...p }));

      // 1. Return stock from the original invoice items (if it existed and wasn't cancelled)
      if (originalInvoice && originalInvoice.status !== 'Cancelled') {
        originalInvoice.items.forEach(item => {
          if (!item.productId) return;
          const productIndex = tempProducts.findIndex(p => p.id === item.productId);
          if (productIndex !== -1) {
            const product = tempProducts[productIndex];
            let quantityToAddBack = item.quantity;
            if (item.unitType === 'Cartons' && product.packagingUnit && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
              quantityToAddBack = item.quantity * product.itemsPerPackagingUnit;
            }
            tempProducts[productIndex] = {
              ...product,
              stockLevel: product.stockLevel + quantityToAddBack,
            };
          }
        });
      }

      // 2. Deduct stock for the new/updated invoice items (if not cancelled)
      if (updatedInvoice.status !== 'Cancelled') {
        updatedInvoice.items.forEach(item => {
          if (!item.productId) return;
          const productIndex = tempProducts.findIndex(p => p.id === item.productId);
          if (productIndex !== -1) {
            const product = tempProducts[productIndex];
            let quantityToDeduct = item.quantity;
            if (item.unitType === 'Cartons' && product.packagingUnit && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
              quantityToDeduct = item.quantity * product.itemsPerPackagingUnit;
            }
            tempProducts[productIndex] = {
              ...product,
              stockLevel: Math.max(0, product.stockLevel - quantityToDeduct),
            };
          }
        });
      }
      return tempProducts;
    });

    setInvoices((prev) =>
      prev.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i))
    );
  }, [invoices]); // Important: add invoices to dependency array

  const deleteInvoice = useCallback((invoiceId: string) => {
    const invoiceToDelete = invoices.find(inv => inv.id === invoiceId);
    if (invoiceToDelete && invoiceToDelete.status !== 'Cancelled') {
      setProducts((currentProducts) => {
        const updatedProducts = currentProducts.map(p => ({ ...p }));
        invoiceToDelete.items.forEach(item => {
          if (!item.productId) return;
          const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
          if (productIndex !== -1) {
            const product = updatedProducts[productIndex];
            let quantityToAddBack = item.quantity;
            if (item.unitType === 'Cartons' && product.packagingUnit && product.itemsPerPackagingUnit && product.itemsPerPackagingUnit > 0) {
              quantityToAddBack = item.quantity * product.itemsPerPackagingUnit;
            }
            updatedProducts[productIndex] = {
              ...product,
              stockLevel: product.stockLevel + quantityToAddBack,
            };
          }
        });
        return updatedProducts;
      });
    }
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
  }, [invoices]); // Important: add invoices to dependency array

  const updateCompanyProfile = useCallback((profileUpdate: Partial<CompanyProfile>) => {
    setCompanyProfile((prev) => ({ ...prev, ...profileUpdate }));
  }, []);

  const addProduct = useCallback((product: Product) => {
    setProducts((prev) => [product, ...prev]);
  }, []);

  const updateProduct = useCallback((updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
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
        products,
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
        addProduct,
        updateProduct,
        deleteProduct,
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
