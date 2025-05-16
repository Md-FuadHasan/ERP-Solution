
import * as React from "react";

// Assuming this is a utility function like clsx or similar for merging class names
import { cn } from "@/lib/utils";

// The main Table component, wrapped in a div for responsive overflow
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    {/* The <table> element should contain all table content (caption, thead, tbody, tfoot) */}
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    >
      {children}
    </table>
  </div>
));
Table.displayName = "Table";

// Table Header component
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => (
  // Thead element for table header group
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props}>
    {children}
  </thead>
));
TableHeader.displayName = "TableHeader";

// Table Body component
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => (
  // Tbody element for table body group
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  >
    {children}
  </tbody>
));
TableBody.displayName = "TableBody";

// Table Footer component
const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => (
  // Tfoot element for table footer group
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  >
    {children}
  </tfoot>
));
TableFooter.displayName = "TableFooter";

// Table Row component
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, children, ...props }, ref) => (
  // Tr element for table rows
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  >{children}</tr>
));
TableRow.displayName = "TableRow";

// Table Head Cell component
const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, children, ...props }, ref) => (
  // Th element for table header cells
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 py-2 text-left align-middle font-bold text-foreground sm:px-4 [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  >
    {children}
  </th>
));
TableHead.displayName = "TableHead";

// Table Cell component
const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, children, ...props }, ref) => (
  // Td element for table data cells
  <td
    ref={ref}
    className={cn("px-2 py-2 align-middle text-xs sm:px-4 [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  >
    {children}
  </td>
));
TableCell.displayName = "TableCell";

// Table Caption component
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, children, ...props }, ref) => (
  // Caption element for table caption
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  >
    {children}
  </caption>
));
TableCaption.displayName = "TableCaption";

// Export the components for use
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
