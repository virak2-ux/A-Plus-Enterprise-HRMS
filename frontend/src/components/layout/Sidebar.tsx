'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarCheck,
  Calculator,
  UserCheck,
  Award,
  FileBarChart,
  ShieldCheck,
  Settings,
  LogOut,
  CreditCard,
  FileText,
  UserMinus,
  Bot,
  Smartphone,
  Timer,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { t, language } = useLanguageCurrency();

  const navigationItems = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('nav.employees'), href: '/employees', icon: Users },
    { name: t('nav.organization'), href: '/organization', icon: Building2 },
    { name: t('nav.attendance'), href: '/attendance', icon: Clock },
    { name: language === 'km' ? 'ថែមម៉ោង & វេនការងារ' : 'Overtime & Shifts', href: '/overtime', icon: Timer, badge: 'Art. 139' },
    { name: t('nav.leave'), href: '/leave', icon: CalendarCheck },
    { name: t('nav.payroll'), href: '/payroll', icon: Calculator, badge: 'Cambodia GDT' },
    { name: language === 'km' ? 'ប្រាក់កម្ចី & បុរេប្រទាន' : 'Loans & Advances', href: '/loans', icon: CreditCard },
    { name: language === 'km' ? 'ឯកសារបុគ្គលិក' : 'Documents & Expiry', href: '/documents', icon: FileText },
    { name: t('nav.recruitment'), href: '/recruitment', icon: UserCheck },
    { name: t('nav.talent'), href: '/talent', icon: Award },
    { name: language === 'km' ? 'ការបញ្ចប់កិច្ចសន្យា' : 'Offboarding', href: '/offboarding', icon: UserMinus },
    { name: t('nav.reports'), href: '/reports', icon: FileBarChart },
    { name: 'AI HR Assistant', href: '/ai-assistant', icon: Bot, badge: 'Private' },
    { name: 'Employee Portal (ESS)', href: '/ess', icon: Smartphone, badge: 'Mobile' },
    { name: t('nav.audit_logs'), href: '/audit-logs', icon: ShieldCheck },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0">
      <div className="overflow-y-auto max-h-[calc(100vh-8rem)] pr-1">
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Enterprise HR
        </div>
        <nav className="space-y-1 mt-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-medium shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-3 border-t border-slate-800">
        <button
          onClick={() => {
            localStorage.removeItem('hrms_token');
            window.location.href = '/';
          }}
          className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  );
};
