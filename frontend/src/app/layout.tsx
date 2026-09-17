import './globals.css';
import React from 'react';
import { LanguageCurrencyProvider } from '@/context/LanguageCurrencyContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata = {
  title: 'Cambodia Enterprise HRMS',
  description: 'Production-ready Cambodia Human Resource Management & Deterministic Payroll System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <LanguageCurrencyProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
                {children}
              </main>
            </div>
          </div>
        </LanguageCurrencyProvider>
      </body>
    </html>
  );
}
