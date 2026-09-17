import './globals.css';
import React from 'react';
import { LanguageCurrencyProvider } from '@/context/LanguageCurrencyContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata = {
  title: 'A Plus Enterprise HRMS',
  description: 'A Plus Enterprise Human Resource Management & Cambodia Deterministic Payroll System. Credit: @virak81',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-slate-100 transition-colors duration-200 selection:bg-indigo-500 selection:text-white relative">
        {/* Subtle Ambient Gen Z Background Glows */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10 dark:from-indigo-600/15 dark:via-purple-600/10" />
        <div className="fixed bottom-0 left-0 w-[450px] h-[450px] bg-gradient-to-tr from-cyan-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10 dark:from-cyan-600/10 dark:via-emerald-600/5" />

        <LanguageCurrencyProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full relative z-0">
                {children}
              </main>
            </div>
          </div>
        </LanguageCurrencyProvider>
      </body>
    </html>
  );
}
