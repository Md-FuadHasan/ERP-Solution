import { Home, Users, FileText, BarChart3, Settings, Building, Percent, UserCog, Database } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export interface SettingsTab {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const SETTINGS_TABS: SettingsTab[] = [
  { value: 'company', label: 'Company Details', icon: Building },
  { value: 'tax', label: 'Tax Settings', icon: Percent },
  { value: 'users', label: 'User Management', icon: UserCog },
  { value: 'storage', label: 'Data Storage', icon: Database },
];

export const APP_NAME = "InvoiceFlow";
