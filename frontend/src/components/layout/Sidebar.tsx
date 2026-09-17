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
  ShieldAlert,
  Zap,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { t, language } = useLanguageCurrency();

  const navigationItems = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('nav.employees'), href: '/employees', icon: Users },
    { name: t('nav.organization'), href: '/organization', icon: Building2 },
    { name: t('nav.attendance'), href: '/attendance', icon: Clock },
    { name: language === 'km' ? 'ថែមម៉ោង & វេនការងារ' : 'Overtime & Shifts', href: '/overtime', icon: Timer, badge: 'Art. 139', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { name: t('nav.leave'), href: '/leave', icon: CalendarCheck },
    { name: t('nav.payroll'), href: '/payroll', icon: Calculator, badge: 'Cambodia GDT', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    { name: language === 'km' ? 'ប្រាក់កម្ចី & បុរេប្រទាន' : 'Loans & Advances', href: '/loans', icon: CreditCard },
    { name: language === 'km' ? 'ឯកសារបុគ្គលិក' : 'Documents & Expiry', href: '/documents', icon: FileText },
    { name: t('nav.recruitment'), href: '/recruitment', icon: UserCheck },
    { name: t('nav.talent'), href: '/talent', icon: Award },
    { name: language === 'km' ? 'វិន័យ & ការព្រមាន' : 'Disciplinary & Warnings', href: '/disciplinary', icon: ShieldAlert, badge: 'Art. 27', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { name: language === 'km' ? 'ការបញ្ចប់កិច្ចសន្យា' : 'Offboarding', href: '/offboarding', icon: UserMinus },
    { name: t('nav.reports'), href: '/reports', icon: FileBarChart },
    { name: 'AI HR Assistant', href: '/ai-assistant', icon: Bot, badge: 'Private', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    { name: 'Employee Portal (ESS)', href: '/ess', icon: Smartphone, badge: 'Mobile', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    { name: t('nav.audit_logs'), href: '/audit-logs', icon: ShieldCheck },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900/95 dark:bg-[#070b14]/95 backdrop-blur-2xl text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0 border-r border-slate-800/80 transition-colors duration-250">
      <div className="overflow-y-auto max-h-[calc(100vh-9.5rem)] pr-1">
        <div className="px-3 py-1.5 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Enterprise Hub
          </span>
          <span className="flex items-center space-x-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>LIVE</span>
          </span>
        </div>

        <nav className="space-y-1 mt-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 transform ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-glow-sm scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 dark:hover:bg-slate-800/40 hover:translate-x-1'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono font-bold shrink-0 border ${
                      item.badgeColor || 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        {/* Quick System Badge with Credit */}
        <div className="p-2.5 rounded-xl bg-slate-800/40 dark:bg-slate-900/60 border border-slate-800 space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-slate-200">A Plus Enterprise</span>
            </div>
            <span className="font-mono text-[9px] text-indigo-400 font-bold bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-800/60">
              v1.0 Pro
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-800/50">
            <span>Author</span>
            <span className="font-mono text-indigo-400 font-semibold">Credit: @virak81</span>
          </div>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('hrms_token');
            window.location.href = '/';
          }}
          className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  );
};
