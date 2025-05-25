
import { 
  Home, Users, FileText, BarChart3, Settings, Building, Percent, UserCog, Database, Archive, ShoppingCart, Briefcase, Lightbulb, Package, Warehouse as WarehouseIcon, Truck, UserCheck, Files, TrendingUp, FilePlus2, Calculator, CreditCard, AreaChart, CalendarCheck, Banknote, Activity as ActivityIcon, SlidersHorizontal, ShieldQuestion, ShoppingBasket
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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

export const APP_NAME = "ProERP";

export const MAIN_NAV_SECTIONS: NavSection[] = [
  {
    title: 'DASHBOARD',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/analytics', label: 'Analytics', icon: TrendingUp, disabled: true },
    ],
  },
  {
    title: 'SALES & CRM',
    items: [
      { href: '/sales', label: 'Sales Management', icon: ShoppingCart },
      { href: '/sales-orders', label: 'Sales Orders', icon: Files },
      { href: '/customers', label: 'Customers', icon: Users },
      { href: '/invoices', label: 'Invoices', icon: FileText },
      { href: '/quotations', label: 'Quotations', icon: FilePlus2, disabled: true },
    ],
  },
  {
    title: 'INVENTORY & SUPPLY',
    items: [
      { href: '/inventory', label: 'Inventory', icon: Archive },
      { href: '/products', label: 'Products', icon: Package },
      { href: '/suppliers', label: 'Suppliers', icon: Truck },
      { href: '/warehouses', label: 'Warehouses', icon: WarehouseIcon },
      { href: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingBasket },
    ],
  },
  {
    title: 'FINANCE & ACCOUNTING',
    items: [
      { href: '/accounting', label: 'Accounting', icon: Calculator, disabled: true },
      { href: '/payments', label: 'Payments', icon: CreditCard, disabled: true },
      { href: '/financial-reports', label: 'Financial Reports', icon: AreaChart, disabled: true },
    ],
  },
  {
    title: 'HUMAN RESOURCES',
    items: [
      { href: '/employee-management', label: 'Employees', icon: Briefcase },
      { href: '/attendance', label: 'Attendance', icon: UserCheck, disabled: true }, 
      { href: '/payroll', label: 'Payroll', icon: Banknote, disabled: true },
    ],
  },
  {
    title: 'REPORTS & ANALYTICS',
    items: [
      { href: '/reports', label: 'Reports', icon: BarChart3 },
      { href: '/ai-suggestions', label: 'AI Insights', icon: Lightbulb }, 
      { href: '/activity', label: 'Activity', icon: ActivityIcon, disabled: true },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/user-management', label: 'User Management', icon: UserCog }, 
      { href: '/system-tools', label: 'System Tools', icon: SlidersHorizontal, disabled: true },
    ],
  },
];


export interface SettingsTab {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const SETTINGS_TABS: SettingsTab[] = [
  { value: 'company', label: 'Company Details', icon: Building },
  { value: 'tax', label: 'Tax Settings', icon: Percent },
  { value: 'users', label: 'App Users', icon: UserCog },
  { value: 'salespeople', label: 'Salespeople', icon: UserCheck }, 
  { value: 'storage', label: 'Data Storage', icon: Database },
];
