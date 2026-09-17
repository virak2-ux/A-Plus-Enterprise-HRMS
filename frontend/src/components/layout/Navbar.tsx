'use client';

import React from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import { Globe, DollarSign, Building, Bell, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { language, setLanguage, currency, setCurrency, t } = useLanguageCurrency();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left: Brand & Company Badge */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow">
            KH
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800 leading-tight">
              {t('app_name')}
            </h1>
            <div className="flex items-center text-xs text-slate-500 font-medium">
              <Building className="w-3 h-3 mr-1 text-slate-400" />
              {t('company_name')}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Controls & User Profile */}
      <div className="flex items-center space-x-3">
        {/* Language Switcher */}
        <div className="inline-flex rounded-md shadow-sm border border-slate-200 p-0.5 bg-slate-50">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs font-semibold rounded ${
              language === 'en'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('km')}
            className={`px-2.5 py-1 text-xs font-semibold rounded font-khmer ${
              language === 'km'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ខ្មែរ
          </button>
        </div>

        {/* Currency Switcher */}
        <div className="inline-flex rounded-md shadow-sm border border-slate-200 p-0.5 bg-slate-50">
          <button
            onClick={() => setCurrency('USD')}
            className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center ${
              currency === 'USD'
                ? 'bg-white text-emerald-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3 h-3 mr-0.5" /> USD
          </button>
          <button
            onClick={() => setCurrency('KHR')}
            className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center font-khmer ${
              currency === 'KHR'
                ? 'bg-white text-emerald-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ៛ KHR
          </button>
        </div>

        {/* Notifications */}
        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 relative">
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 bg-rose-500 rounded-full absolute top-1.5 right-1.5" />
        </button>

        {/* User Badge */}
        <div className="flex items-center pl-2 border-l border-slate-200 space-x-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800">Admin User</p>
            <p className="text-[10px] text-slate-500 font-medium">SUPER_ADMIN</p>
          </div>
        </div>
      </div>
    </header>
  );
};
