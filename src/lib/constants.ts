import {
 Building, Percent, UserCog, Database, ShoppingCart, Package, ReceiptText, Settings, DollarSign, LucideIcon, LayoutDashboard, BarChart2, Users, Clock, Activity, Wand2, Banknote, ShoppingBag, User, FileText, Wrench, FileLineChart, Car
} from 'lucide-react';

export const APP_NAME = "ProERP";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const MAIN_NAV_SECTIONS: NavSection[] = [
  {
    title: 'DASHBOARD',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    ],
  },
 {
    title: 'Sales & CRM',
    items: [
 { href: '/sales', label: 'Sales', icon: ShoppingCart },
 { href: '/customers', label: 'Customers', icon: Users }, // Assuming Users for customers
 { href: '/invoices', label: 'Invoices', icon: ReceiptText },
 { href: '/quotations', label: 'Quotations', icon: FileText }, // Assuming FileText for quotations
 { href: '/vansales', label: 'Van Sales', icon: Car }, // Added Van Sales
    ],
  },
  {
    title: 'INVENTORY & SUPPLY',
    items: [
      { href: '/inventory', label: 'Inventory', icon: Package },
      { href: '/products', label: 'Products', icon: Package },
      { href: '/suppliers', label: 'Suppliers', icon: Building },
      { href: '/warehouses', label: 'Warehouses', icon: Building },
    ],
  },
  {
    title: 'FINANCE & ACCOUNTING',
    items: [
      { href: '/accounting', label: 'Accounting', icon: Banknote }, // Assuming a general accounting page
      { href: '/payments', label: 'Payments', icon: DollarSign }, // Assuming a payments page
 { href: '/financial-reports', label: 'Financial Reports', icon: FileText },
    ],
  },
  {
    title: 'Human Resources',
    items: [
      { href: '/employee-manager', label: 'Employees', icon: Users },
      { href: '/attendance', label: 'Attendance', icon: Clock },
      { href: '/payroll', label: 'Payroll', icon: DollarSign },
    ],
  },
  {
    title: 'Administration',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/user-management', label: 'User Management', icon: Users }, // Using Users for user management
      { href: '/system-tools', label: 'System Tools', icon: Wrench }, // Using Wrench for system tools
    ],
  },
  {
    title: 'REPORTS & ANALYTICS',
    items: [
      { href: '/reports', label: 'Reports', icon: FileLineChart }, // Assuming FileLineChart for reports
      { href: '/ai-suggestions', label: 'AI Insights', icon: Wand2 }, // Using Wand2 for AI suggestions
      { href: '/activity', label: 'Activity', icon: Activity }, // Using Activity for activity log
    ],
  }
];
export interface SettingsTab {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const SETTINGS_TABS: SettingsTab[] = [
  { value: 'company', label: 'Company Details', icon: Building },
  { value: 'tax', label: 'Tax Settings', icon: Percent },
  { value: 'storage', label: 'Data Storage', icon: Database },
];
