import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed from GeistSans to Inter
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from '@/components/ui/sidebar';

const inter = Inter({ // Changed from geistSans to inter
  variable: '--font-inter', // Changed variable name
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'InvoiceFlow',
  description: 'Customer and Invoice Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}> {/* Updated font variable */}
        <SidebarProvider defaultOpen={true}>
          {children}
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
