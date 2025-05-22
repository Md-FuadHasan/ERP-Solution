
'use client';

import type React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from 'lucide-react';

export type InvoiceFilterStatus = 'all' | 'paid' | 'unpaid' | 'partially-paid' | 'cancelled'; // Added 'cancelled'

interface StatusFilterDropdownProps {
  selectedStatus: InvoiceFilterStatus;
  onStatusChange: (status: InvoiceFilterStatus) => void;
  className?: string;
}

const filterOptions: { value: InvoiceFilterStatus; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid/Pending' },
  { value: 'partially-paid', label: 'Partially Paid' },
  { value: 'cancelled', label: 'Cancelled' }, // Added 'cancelled' option
];

export function StatusFilterDropdown({ selectedStatus, onStatusChange, className }: StatusFilterDropdownProps) {
  return (
    <div className={`relative ${className || ''}`}>
      <Select value={selectedStatus} onValueChange={(value) => onStatusChange(value as InvoiceFilterStatus)}>
        <SelectTrigger className="w-full md:w-[200px] pl-10"> {/* Added pl-10 for left padding */}
           <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Filter by status..." />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
