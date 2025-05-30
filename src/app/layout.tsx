
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from '@/components/ui/sidebar';
import { DataProvider } from '@/context/DataContext';

const inter = Inter({
  variable: '--font-inter',
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
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning={true}>
        <DataProvider>
          <SidebarProvider defaultOpen={true}>
            {children}
          </SidebarProvider>
        </DataProvider>
        <Toaster />
      </body>
    </html>
  );
}
