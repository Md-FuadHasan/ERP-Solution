import React from 'react';
import type { Invoice, Customer, CompanyProfile, InvoiceItem } from '@/types';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils'; // Assuming cn is available for class concatenation
import { Badge } from '@/components/ui/badge'; // Assuming Badge is available
import { getStatusBadgeVariant } from '@/lib/invoiceUtils'; // Assuming this utility exists
import { QrCode } from 'lucide-react'; // Assuming lucide-react is used
import { QRCodeCanvas } from 'qrcode.react'; // Assuming qrcode.react is used

interface InvoiceTaxViewProps {
  invoice: Invoice;
  customer: Customer | null;
  companyProfile: CompanyProfile | null;
  warehouses: { id: string; name: string }[]; // Assuming warehouses are needed for item source
}

const InvoiceTaxView: React.FC<InvoiceTaxViewProps> = ({ invoice, customer, companyProfile, warehouses }) => {
  if (!invoice || !companyProfile || !customer) {
    return <div className="p-6 text-destructive">Error: Invoice, Company Profile, or Customer data is missing.</div>;
  }

  // Basic QR code value - can be expanded based on local requirements (e.g., Zakat, Tax and Customs Authority format)
  const qrCodeValue = `Invoice ID: ${invoice.id}
Total Amount: ${invoice.totalAmount.toFixed(2)}
VAT: ${invoice.vatAmount.toFixed(2)}
Issue Date: ${format(new Date(invoice.issueDate), 'yyyy-MM-dd')}`;

  const vatRatePercent = companyProfile?.vatRate ? (typeof companyProfile.vatRate === 'string' ? parseFloat(companyProfile.vatRate) : Number(companyProfile.vatRate)) : 0;

  return (
    <div className="p-6 space-y-6 print:p-4 sm:print:p-6 text-foreground bg-background print:bg-transparent">
      {/* Company and Customer Header */}
      <header className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print:gap-4 print:mb-4">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground mb-1">Company Details</p>
              <p className="font-semibold text-lg text-foreground print:text-base">{companyProfile.name}</p>
            </div>
            {/* Company Logo Placeholder */}
            <div className="w-24 h-24 bg-muted flex items-center justify-center text-muted-foreground rounded-md print:w-16 print:h-16 print:text-sm">
              Company Logo
            </div>
          </div>
          <div className="text-sm text-muted-foreground print:text-xs">
            <p>CR: [Your CR Number]</p> {/* Placeholder */}
            <p>VAT: {companyProfile.vatNumber || '[Your VAT Number]'}</p>
            <p>Address: <span className="whitespace-pre-line leading-relaxed">{companyProfile.address}</span></p>
            <p>Phone: {companyProfile.phone}</p>
            <p>Email: {companyProfile.email}</p>
          </div>
        </div>

        <div className="md:text-right">
           <p className="text-xs uppercase font-semibold text-muted-foreground mb-1">Customer Details</p>
           <p className="font-semibold text-lg text-foreground print:text-base">{customer.name}</p>
           <div className="text-sm text-muted-foreground print:text-xs mt-4 md:mt-0">
              <p>Customer ID: {customer.id}</p>
              <p>CR: [Customer CR Number]</p> {/* Placeholder */}
              <p>VAT: {customer.vatNumber || '[Customer VAT Number]'}</p>
              <p>Address: <span className="whitespace-pre-line leading-relaxed">{customer.billingAddress}</span></p>
              <p>Phone: {customer.phone}</p>
              <p>Email: {customer.email}</p>
           </div>
        </div>
      </header>

       {/* Invoice Title and Info */}
       <section className="mb-8 print:mb-4">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground print:text-2xl">TAX INVOICE</h1>
                <Badge variant={getStatusBadgeVariant(invoice.status)} className="text-base px-4 py-1.5 print:hidden">
                    {invoice.status}
                </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground print:text-xs">
                 <div>
                    <p>Invoice No # {invoice.id}</p>
                 </div>
                 <div className="text-right">
                    <p>Date: {format(new Date(invoice.issueDate), 'MMMM d, yyyy')}</p>
                 </div>
            </div>
       </section>

      {/* Order Summary */}
      <section className="mb-8 print:mb-4">
        <h2 className="text-xl font-semibold mb-4 text-foreground print:text-lg print:mb-2">Order Summary</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50 print:bg-muted">
              <TableRow>
                <TableHead className="min-w-[100px] pl-4 sm:pl-6 print:pl-2 print:min-w-[80px] text-xs print:text-2xs">Item Code</TableHead>
                <TableHead className="min-w-[200px] print:min-w-[150px] text-xs print:text-2xs">Item Name</TableHead>
                 {/* Added Unit Price, Qty, Amount, Discount, VAT, Total as per image */}
                <TableHead className="w-24 text-center print:w-auto text-xs print:text-2xs">Unit Price</TableHead>
                 <TableHead className="w-24 text-center print:w-auto text-xs print:text-2xs">Qty</TableHead>
                <TableHead className="w-24 text-right print:w-auto text-xs print:text-2xs">Amount</TableHead>
                <TableHead className="w-24 text-right print:w-auto text-xs print:text-2xs">Discount</TableHead>
                <TableHead className="w-24 text-right print:w-auto text-xs print:text-2xs">VAT ({vatRatePercent.toFixed(0)}%)</TableHead>
                <TableHead className="w-32 text-right pr-4 sm:pr-6 print:pr-2 print:w-auto text-xs print:text-2xs">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item: InvoiceItem, index: number) => {
                // Assuming item structure includes unitPrice, quantity, total, discount, vat, and itemCode
                const itemCode = (item as any).itemCode || 'N/A'; // Assuming itemCode exists
                const discount = (item as any).discount || 0; // Assuming discount exists
                const itemVatAmount = ((item.quantity || 0) * (item.unitPrice || 0) - discount) * (vatRatePercent / 100);
                const itemTotalWithVAT = ((item.quantity || 0) * (item.unitPrice || 0)) - discount + itemVatAmount;

                return (
                  <TableRow key={item.id || index} className="even:bg-muted/20 print:even:bg-muted/50">
                    <TableCell className="font-medium text-foreground py-2 pl-4 sm:pl-6 print:pl-2 print:py-1 text-xs print:text-2xs">{itemCode}</TableCell>
                    <TableCell className="text-foreground py-2 print:py-1 text-xs print:text-2xs">{item.description}</TableCell>
                     {/* Updated cells based on new table structure */}
                    <TableCell className="text-center text-muted-foreground py-2 print:py-1 text-xs print:text-2xs">${(typeof item.unitPrice === 'number' ? item.unitPrice : 0).toFixed(2)}</TableCell>
                    <TableCell className="text-center text-muted-foreground py-2 print:py-1 text-xs print:text-2xs">{item.quantity}</TableCell>
                    <TableCell className="text-right text-muted-foreground py-2 print:py-1 text-xs print:text-2xs">${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-destructive py-2 print:py-1 text-xs print:text-2xs">${discount.toFixed(2)}</TableCell> {/* Display discount */}
                    <TableCell className="text-right text-muted-foreground py-2 print:py-1 text-xs print:text-2xs">${itemVatAmount.toFixed(2)}</TableCell> {/* Display item VAT */}
                    <TableCell className="text-right font-medium text-foreground py-2 pr-4 sm:pr-6 print:pr-2 print:py-1 text-xs print:text-2xs">${itemTotalWithVAT.toFixed(2)}</TableCell> {/* Display total with VAT */}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

       {/* Totals and QR Code */}
       <section className="flex flex-col-reverse md:flex-row justify-between items-start mb-8 gap-8 print:mb-4 print:gap-4">
           <div className="w-full md:w-auto flex flex-col items-center md:items-start print:hidden">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center"><QrCode className="w-4 h-4 mr-2"/>Scan for Details</h3> {/* Updated text */}
                <div className="p-2 border rounded-lg inline-block bg-white shadow-sm"> {/* Reduced padding */}
                    <QRCodeCanvas value={qrCodeValue} size={100} bgColor="#ffffff" fgColor="#000000" level="Q" /> {/* Reduced size */}
                </div>
            </div>
            <div className="w-full md:max-w-sm space-y-2.5 text-sm border p-4 sm:p-6 rounded-lg bg-muted/40 print:p-3 print:space-y-1.5"> {/* Adjusted spacing */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sub-Total:</span> {/* Changed label */}
                <span className="font-medium text-foreground">${(typeof invoice.subtotal === 'number' ? invoice.subtotal : 0).toFixed(2)}</span>
              </div>
              {/* Assuming Total Discount exists in invoice data or can be calculated */}
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Discount:</span> {/* Added label */}
                    <span className="font-medium text-destructive">-${(invoice.items.reduce((sum, item) => sum + ((item as any).discount || 0), 0)).toFixed(2)}</span> {/* Assuming discount exists on items */}
                </div>
              {invoice.vatAmount > 0 && (
                <div className="flex justify-between">
                    <span className="text-muted-foreground">VAT ({vatRatePercent.toFixed(0)}%):</span>
                    <span className="font-medium text-foreground">${(typeof invoice.vatAmount === 'number' ? invoice.vatAmount : 0).toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-3 !bg-border print:my-1" /> {/* Adjusted margin */}
              <div className="flex justify-between text-base font-semibold print:text-sm"> {/* Adjusted font size */}
                <span className="text-foreground">Total Billing Amount:</span> {/* Changed label */}
                <span className="text-foreground">${(typeof invoice.totalAmount === 'number' ? invoice.totalAmount : 0).toFixed(2)}</span>
              </div>
               <div className="flex justify-between text-green-600 dark:text-green-400 print:text-sm"> {/* Adjusted font size and color */}
                <span className="font-medium">Amount Paid:</span>
                <span className="font-semibold">${(typeof invoice.amountPaid === 'number' ? invoice.amountPaid : 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold print:text-base"> {/* Adjusted font size */}
                <span className="text-foreground">Balance Due:</span>
                <span className={`${(typeof invoice.remainingBalance === 'number' ? invoice.remainingBalance : 0) > 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>{/* Adjusted color classes */}
                  ${(typeof invoice.remainingBalance === 'number' ? invoice.remainingBalance : 0).toFixed(2)}
                </span>
              </div>
            </div>
       </section>

      {/* Terms and Conditions */}
      <section className="mb-8 print:mb-4 text-sm text-muted-foreground print:text-xs">
        <h3 className="text-base font-semibold mb-2 text-foreground print:text-sm print:mb-1">Terms & Conditions:</h3> {/* Adjusted font size */}
        <ol className="list-decimal list-inside space-y-1"> {/* Added list styling */}
            <li>Payment is due within 30 days from the invoice date.</li>
            <li>Please include the invoice number on your payment.</li>
            <li>A late fee of 1.5% per month will be charged on overdue amounts.</li>
        </ol>
      </section>

       {/* Footer Message */}
        <div className="mt-12 text-center text-xs text-muted-foreground print:mt-6"> {/* Adjusted margin */}
            <p>Thank you for your business!</p>
            {companyProfile && <p>If you have any questions concerning this invoice, please contact [Your Contact Person/Department] at [Your Contact Phone] or [Your Contact Email].</p>} {/* Added contact placeholder text */}
        </div>
    </div>
  );
};

export default InvoiceTaxView;