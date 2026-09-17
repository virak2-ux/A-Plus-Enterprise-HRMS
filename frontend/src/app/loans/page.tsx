'use client';

import React, { useState } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';

interface LoanItem {
  id: string;
  code: string;
  name_en: string;
  name_kh: string;
  department: string;
  loan_type: 'SALARY_ADVANCE' | 'EMERGENCY_LOAN';
  principal_usd: number;
  monthly_deduction_usd: number;
  remaining_usd: number;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'PAID_OFF';
}

const SAMPLE_LOANS: LoanItem[] = [
  {
    id: 'l1',
    code: 'EMP-002',
    name_en: 'Dara Chan',
    name_kh: 'ចាន់ ដារ៉ា',
    department: 'Finance & Accounting',
    loan_type: 'SALARY_ADVANCE',
    principal_usd: 500,
    monthly_deduction_usd: 100,
    remaining_usd: 200,
    start_date: '2026-07-01',
    end_date: '2026-11-30',
    status: 'ACTIVE',
  },
  {
    id: 'l2',
    code: 'EMP-005',
    name_en: 'Bora Tep',
    name_kh: 'ទេព បូរ៉ា',
    department: 'Sales & Marketing',
    loan_type: 'SALARY_ADVANCE',
    principal_usd: 300,
    monthly_deduction_usd: 60,
    remaining_usd: 120,
    start_date: '2026-08-01',
    end_date: '2026-12-31',
    status: 'ACTIVE',
  },
  {
    id: 'l3',
    code: 'EMP-004',
    name_en: 'Rathana Som',
    name_kh: 'សោម រតនា',
    department: 'Software Engineering',
    loan_type: 'EMERGENCY_LOAN',
    principal_usd: 400,
    monthly_deduction_usd: 100,
    remaining_usd: 0,
    start_date: '2026-04-01',
    end_date: '2026-07-31',
    status: 'PAID_OFF',
  },
];

export default function LoansPage() {
  const { language, formatMoney, exchangeRate, currency } = useLanguageCurrency();
  const [loans, setLoans] = useState<LoanItem[]>(SAMPLE_LOANS);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [empCode, setEmpCode] = useState('EMP-003');
  const [principal, setPrincipal] = useState(300);
  const [months, setMonths] = useState(3);

  const totalOutstandingUsd = loans.reduce((acc, l) => acc + l.remaining_usd, 0);
  const monthlyDeductionsUsd = loans
    .filter((l) => l.status === 'ACTIVE')
    .reduce((acc, l) => acc + l.monthly_deduction_usd, 0);

  const handleIssueLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const monthlyDeduct = Math.round(principal / months);
    const newLoan: LoanItem = {
      id: `l-${Date.now()}`,
      code: empCode,
      name_en: 'Visal Keo',
      name_kh: 'កែវ វិសាល',
      department: 'Software Engineering',
      loan_type: 'SALARY_ADVANCE',
      principal_usd: principal,
      monthly_deduction_usd: monthlyDeduct,
      remaining_usd: principal,
      start_date: '2026-10-01',
      end_date: '2026-12-31',
      status: 'ACTIVE',
    };

    setLoans([newLoan, ...loans]);
    setShowIssueModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'ប្រាក់កម្ចី & បុរេប្រទានបៀវត្ស' : 'Loans & Salary Advances'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Payroll Linked
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage company loans and emergency salary advances with automatic monthly payroll deduction schedules.
          </p>
        </div>

        <button
          onClick={() => setShowIssueModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Advance / Loan</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Outstanding Principal</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatMoney(totalOutstandingUsd * exchangeRate)}
          </p>
          <p className="text-xs text-slate-400 mt-1">${totalOutstandingUsd.toLocaleString()} USD</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Monthly Payroll Deductions</p>
          <p className="text-2xl font-bold text-amber-600 mt-2">
            {formatMoney(monthlyDeductionsUsd * exchangeRate)}
          </p>
          <p className="text-xs text-slate-400 mt-1">${monthlyDeductionsUsd.toLocaleString()} USD / month</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Active Repayment Plans</p>
          <p className="text-2xl font-bold text-indigo-600 mt-2">
            {loans.filter((l) => l.status === 'ACTIVE').length} Active
          </p>
          <p className="text-xs text-slate-400 mt-1">100% recovered on schedule</p>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Loan &amp; Advance Repayment Ledger</h3>
          <span className="text-xs text-slate-400">Integrated into Monthly Payroll deductions</span>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Department</th>
              <th className="px-5 py-3.5">Type</th>
              <th className="px-5 py-3.5">Principal</th>
              <th className="px-5 py-3.5">Monthly Deduction</th>
              <th className="px-5 py-3.5">Outstanding Balance</th>
              <th className="px-5 py-3.5">Period</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loans.map((loan) => (
              <tr key={loan.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-900">
                    {language === 'km' ? loan.name_kh : loan.name_en}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{loan.code}</div>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{loan.department}</td>
                <td className="px-5 py-3.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700">
                    {loan.loan_type}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-bold text-slate-900">
                  {formatMoney(loan.principal_usd * exchangeRate)}
                </td>
                <td className="px-5 py-3.5 font-mono text-amber-600 font-bold">
                  -{formatMoney(loan.monthly_deduction_usd * exchangeRate)}
                </td>
                <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                  {formatMoney(loan.remaining_usd * exchangeRate)}
                </td>
                <td className="px-5 py-3.5 text-slate-500 font-mono">
                  {loan.start_date} → {loan.end_date}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      loan.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {loan.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Issue Advance Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900">Issue Salary Advance</h4>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueLoan} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Employee</label>
                <select
                  value={empCode}
                  onChange={(e) => setEmpCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="EMP-003">EMP-003 &bull; Visal Keo (Software Eng)</option>
                  <option value="EMP-001">EMP-001 &bull; Sokha Heng (HR)</option>
                  <option value="EMP-004">EMP-004 &bull; Rathana Som (Software Eng)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Principal Amount ($ USD)</label>
                <input
                  type="number"
                  required
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Repayment Term (Months)</label>
                <select
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value={1}>1 Month (Full next payroll deduction)</option>
                  <option value={2}>2 Months</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                </select>
              </div>

              <div className="p-3 bg-indigo-50 rounded-lg text-indigo-950 font-mono">
                <div className="flex justify-between">
                  <span>Monthly Payroll Deduction:</span>
                  <span className="font-bold">${Math.round(principal / months)} USD/mo</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow"
                >
                  Authorize Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
