'use client';

import React from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import {
  Globe,
  DollarSign,
  Building,
  Bell,
  User as UserIcon,
  Sun,
  Moon,
  Sparkles,
  MapPin,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { language, setLanguage, currency, setCurrency, theme, toggleTheme, t } = useLanguageCurrency();
  const [selectedBranch, setSelectedBranch] = React.useState('all');

  const branches = [
    { id: 'all', name_en: 'All Locations (HQ & Branches)', name_kh: 'គ្រប់ទីតាំង (ការិយាល័យកណ្តាល & សាខា)' },
    { id: 'pnh', name_en: 'Phnom Penh HQ', name_kh: 'ស្នាក់ការកណ្តាលភ្នំពេញ' },
    { id: 'rep', name_en: 'Siem Reap Regional Hub', name_kh: 'សាខាតំបន់សៀមរាប' },
    { id: 'kos', name_en: 'Sihanoukville Port Hub', name_kh: 'សាខាកំពង់ផែព្រះសីហនុ' },
  ];

  return (
    <header className="h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors duration-250">
      {/* Left: Brand, Company Badge & Branch Switcher */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="relative group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-glow-sm group-hover:shadow-glow transition-all duration-300 transform group-hover:scale-105">
              A+
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {t('app_name')}
              </h1>
              <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-sm">
                Pro
              </span>
              <span className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-800/50">
                @virak81
              </span>
            </div>
            <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <Building className="w-3 h-3 mr-1 text-slate-400 dark:text-slate-500" />
              {t('company_name')}
            </div>
          </div>
        </div>

        {/* Branch Context Selector with Gen Z Pill */}
        <div className="hidden lg:flex items-center pl-3 border-l border-slate-200/80 dark:border-slate-800">
          <div className="relative flex items-center">
            <MapPin className="w-3.5 h-3.5 text-indigo-500 absolute left-2.5 pointer-events-none" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-xs bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl pl-7 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="dark:bg-slate-900 dark:text-slate-200">
                  {language === 'km' ? b.name_kh : b.name_en}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Right: Theme Toggle, Controls & User Profile */}
      <div className="flex items-center space-x-3">
        {/* Global Dark Mode Switcher (Gen Z Smooth Pill) */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Global Dark Mode"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`relative p-2 rounded-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center ${
            theme === 'dark'
              ? 'bg-slate-800 text-amber-400 hover:bg-slate-700 border border-slate-700 shadow-inner'
              : 'bg-slate-100 text-indigo-600 hover:bg-slate-200 border border-slate-200 shadow-sm'
          }`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 transform rotate-0 hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-4 h-4 transform -rotate-12 hover:rotate-0 transition-transform duration-300" />
          )}
        </button>

        {/* Language Switcher */}
        <div className="inline-flex rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-0.5 bg-slate-100/70 dark:bg-slate-800/70">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              language === 'en'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('km')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg font-khmer transition ${
              language === 'km'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ខ្មែរ
          </button>
        </div>

        {/* Currency Switcher */}
        <div className="inline-flex rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-0.5 bg-slate-100/70 dark:bg-slate-800/70">
          <button
            onClick={() => setCurrency('USD')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center transition ${
              currency === 'USD'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-3 h-3 mr-0.5" /> USD
          </button>
          <button
            onClick={() => setCurrency('KHR')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center font-khmer transition ${
              currency === 'KHR'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ៛ KHR
          </button>
        </div>

        {/* Notifications with Pulsing Pill */}
        <button className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 relative transition">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-rose-500 rounded-full absolute top-1.5 right-1.5 shadow-sm" />
        </button>

        {/* User Badge with Gen Z Status Glow */}
        <div className="flex items-center pl-2 border-l border-slate-200/80 dark:border-slate-800 space-x-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-200 to-indigo-100 dark:from-slate-800 dark:to-indigo-950 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold border border-slate-200 dark:border-slate-700 shadow-inner">
              <UserIcon className="w-4 h-4" />
            </div>
            <span className="w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
              Admin User
            </p>
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-black tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
                SUPER_ADMIN
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
