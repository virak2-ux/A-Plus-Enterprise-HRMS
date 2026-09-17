'use client';

import React, { useState } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import {
  Users,
  CheckCircle2,
  DollarSign,
  Clock,
  ArrowUpRight,
  TrendingUp,
  UserPlus,
  Calculator,
  ShieldCheck,
  Building,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const { t, formatMoney, currency } = useLanguageCurrency();
  const [punchMessage, setPunchMessage] = useState<string | null>(null);

  // Mock data reflecting realistic enterprise distribution
  const deptData = [
    { name: 'Software Eng', count: 24 },
    { name: 'Sales & Mktg', count: 12 },
    { name: 'Operations', count: 8 },
    { name: 'Finance', count: 5 },
    { name: 'HR', count: 3 },
  ];

  // Payroll components in KHR
  const payrollExpenseKhr = 174250000; // ~$42,500 USD
  const payrollComposition = [
    { name: 'Net Salary', value: 148500000, color: '#4f46e5' },
    { name: 'Tax on Salary (ToS)', value: 16250000, color: '#f59e0b' },
    { name: 'NSSF Contributions', value: 9500000, color: '#10b981' },
  ];

  const handlePunch = (type: 'IN' | 'OUT') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setPunchMessage(
      type === 'IN'
        ? `Successfully clocked in at ${timeStr}. Status: Present`
        : `Successfully clocked out at ${timeStr}. Duration logged.`
    );
    setTimeout(() => setPunchMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {t('dashboard.welcome')}, Administrator
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Phnom Penh (GMT+7)
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t('dashboard.executive_summary')} &bull; A Plus Enterprise &bull;{' '}
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold font-mono text-xs">Credit: @virak81</span>
          </p>
        </div>

        {/* Quick Punch Bar */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handlePunch('IN')}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Clock className="w-4 h-4" />
            <span>{t('dashboard.clock_in')}</span>
          </button>
          <button
            onClick={() => handlePunch('OUT')}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Clock className="w-4 h-4" />
            <span>{t('dashboard.clock_out')}</span>
          </button>
        </div>
      </div>

      {punchMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{punchMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Headcount */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              {t('dashboard.total_headcount')}
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900">52</p>
            <div className="flex items-center text-xs text-emerald-600 mt-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>+3 new hires this month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              {t('dashboard.active_rate')}
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900">98.1%</p>
            <p className="text-xs text-slate-500 mt-1">51 active, 1 on probation</p>
          </div>
        </div>

        {/* Card 3: Monthly Payroll Expense */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              {t('dashboard.monthly_payroll')}
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900 truncate">
              {formatMoney(payrollExpenseKhr)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {currency === 'USD' ? `~៛${(payrollExpenseKhr).toLocaleString()} KHR` : `~$42,500.00 USD`}
            </p>
          </div>
        </div>

        {/* Card 4: Attendance & Punctuality */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              {t('dashboard.attendance_rate')}
            </span>
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900">96.4%</p>
            <div className="flex items-center text-xs text-emerald-600 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              <span>+1.2% punctuality improvement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Headcount by Department */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">
            {t('dashboard.headcount_by_dept')}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payroll Expense Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">
            {t('dashboard.payroll_trend')} ({currency})
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={payrollComposition}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {payrollComposition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => formatMoney(val)}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cambodia Regulatory & Statutory Compliance Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold">Cambodia Regulatory Compliance Active</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              GDT Tax on Salary (ToS) progressive brackets, NSSF Health &amp; Pension ceilings, and Labor Law Art. 89 Seniority rules are actively enforced.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-mono font-medium rounded-md border border-emerald-500/30">
            NBC Rate: 4,100 KHR/USD
          </span>
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-mono font-medium rounded-md border border-indigo-500/30">
            NSSF Ceiling: 1.2M KHR
          </span>
        </div>
      </div>
    </div>
  );
}
