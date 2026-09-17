'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import apiClient from '@/lib/api';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  TrendingDown,
  ChevronRight,
  Sparkles,
  Receipt,
  User,
} from 'lucide-react';

interface LoanItem {
  id: string;
  employee_id?: string;
  employee_code?: string;
  code?: string;
  name_en?: string;
  employee_name?: string;
  name_kh?: string;
  employee_name_kh?: string;
  department?: string;
  loan_type: string;
  principal_amount?: number;
  principal_usd?: number;
  monthly_deduction_amount?: number;
  monthly_deduction_usd?: number;
  remaining_balance?: number;
  remaining_usd?: number;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'PAID_OFF' | 'CANCELLED';
  notes?: string;
}

const INITIAL_LOANS: LoanItem[] = [
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
    notes: 'Emergency medical assistance advance',
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
    notes: 'Relocation assistance advance',
  },
  {
    id: 'l3',
    code: 'EMP-004',
    name_en: 'Rathana Som',
    name_kh: 'សោម រតនា',
    department: 'Software Engineering',
    loan_type: 'COMPANY_LOAN',
    principal_usd: 400,
    monthly_deduction_usd: 100,
    remaining_usd: 0,
    start_date: '2026-04-01',
    end_date: '2026-07-31',
    status: 'PAID_OFF',
    notes: 'Equipment purchase loan',
  },
];

export default function LoansPage() {
  const { language, formatMoney, exchangeRate, currency } = useLanguageCurrency();
  const [loans, setLoans] = useState<LoanItem[]>(INITIAL_LOANS);
  const [search, setSearch] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanItem | null>(null);
  const [repayAmount, setRepayAmount] = useState(50);

  // Form State
  const [issueForm, setIssueForm] = useState({
    employee_code: 'EMP-003',
    employee_id: 'emp-3',
    employee_name: 'Visal Keo',
    loan_type: 'SALARY_ADVANCE',
    principal_usd: 300,
    tenure_months: 3,
    start_date: '2026-10-01',
    notes: '',
  });

  useEffect(() => {
    apiClient
      .get('/loans')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const loaded: LoanItem[] = res.data.data.map((l: any) => ({
            id: l.id,
            employee_id: l.employee_id,
            code: l.employee_code,
            name_en: l.employee_name,
            name_kh: l.employee_name_kh,
            department: l.department,
            loan_type: l.loan_type,
            principal_usd: l.principal_amount,
            monthly_deduction_usd: l.monthly_deduction_amount,
            remaining_usd: l.remaining_balance,
            start_date: l.start_date,
            end_date: l.end_date,
            status: l.status,
            notes: l.notes,
          }));
          setLoans(loaded);
        }
      })
      .catch(() => {
        // use fallback
      });
  }, []);

  const totalOutstandingUsd = loans.reduce(
    (acc, l) => acc + (l.remaining_usd ?? l.remaining_balance ?? 0),
    0
  );
  const monthlyDeductionsUsd = loans
    .filter((l) => l.status === 'ACTIVE')
    .reduce((acc, l) => acc + (l.monthly_deduction_usd ?? l.monthly_deduction_amount ?? 0), 0);

  const handleIssueLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const monthlyDeduct = Math.round(issueForm.principal_usd / issueForm.tenure_months);
    const newLoan: LoanItem = {
      id: `l-${Date.now()}`,
      code: issueForm.employee_code,
      name_en: issueForm.employee_name,
      name_kh: issueForm.employee_name,
      department: 'Software Engineering',
      loan_type: issueForm.loan_type,
      principal_usd: issueForm.principal_usd,
      monthly_deduction_usd: monthlyDeduct,
      remaining_usd: issueForm.principal_usd,
      start_date: issueForm.start_date,
      end_date: '2026-12-31',
      status: 'ACTIVE',
      notes: issueForm.notes,
    };

    setLoans([newLoan, ...loans]);
    setShowIssueModal(false);

    try {
      await apiClient.post('/loans', {
        employee_id: issueForm.employee_id,
        loan_type: issueForm.loan_type,
        principal_amount: issueForm.principal_usd,
        currency: 'USD',
        tenure_months: issueForm.tenure_months,
        start_date: issueForm.start_date,
        notes: issueForm.notes,
      });
    } catch (err) {
      // optimistic update
    }
  };

  const handleRepaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    const currentRem = selectedLoan.remaining_usd ?? selectedLoan.remaining_balance ?? 0;
    const newRem = Math.max(0, currentRem - repayAmount);
    const newStatus: LoanItem['status'] = newRem === 0 ? 'PAID_OFF' : 'ACTIVE';

    setLoans((prev) =>
      prev.map((l) =>
        l.id === selectedLoan.id
          ? { ...l, remaining_usd: newRem, remaining_balance: newRem, status: newStatus }
          : l
      )
    );
    setShowRepayModal(false);

    try {
      await apiClient.post(`/loans/${selectedLoan.id}/repay`, {
        amount: repayAmount,
        notes: 'Manual payment recorded in HRMS portal',
      });
    } catch (err) {
      // optimistic update
    }
  };

  const filteredLoans = loans.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const code = l.code || l.employee_code || '';
    const name = l.name_en || l.employee_name || '';
    return code.toLowerCase().includes(q) || name.toLowerCase().includes(q);
  });

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
              Automated Payroll Deduction
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'km'
              ? 'គ្រប់គ្រងប្រាក់កម្ចីបុគ្គលិក បុរេប្រទានបន្ទាន់ និងកាលវិភាគកាត់ប្រាក់បៀវត្សស្វ័យប្រវត្តិតាមវដ្ត payroll។'
              : 'Manage company loans and emergency salary advances with automatic monthly payroll deduction schedules.'}
          </p>
        </div>

        <button
          onClick={() => setShowIssueModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Advance / Loan</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Outstanding Principal</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {formatMoney(totalOutstandingUsd * exchangeRate)}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-mono">${totalOutstandingUsd.toFixed(2)} USD</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Monthly Payroll Deductions</p>
          <p className="text-2xl font-bold text-amber-600 mt-2 font-mono">
            {formatMoney(monthlyDeductionsUsd * exchangeRate)}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            ${monthlyDeductionsUsd.toFixed(2)} USD / cycle
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Active Repayment Plans</p>
          <p className="text-2xl font-bold text-indigo-600 mt-2">
            {loans.filter((l) => l.status === 'ACTIVE').length} Active Plans
          </p>
          <p className="text-xs text-slate-400 mt-1">Directly deducted from gross wages</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee name or code..."
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Deductions automatically feed into deterministic Cambodia payroll calculation.
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Loan Type</th>
                <th className="px-5 py-3.5 text-right">Principal</th>
                <th className="px-5 py-3.5 text-right">Monthly Deduction</th>
                <th className="px-5 py-3.5 text-right">Remaining</th>
                <th className="px-5 py-3.5">Repayment Progress</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLoans.map((l) => {
                const principal = l.principal_usd ?? l.principal_amount ?? 1;
                const remaining = l.remaining_usd ?? l.remaining_balance ?? 0;
                const monthly = l.monthly_deduction_usd ?? l.monthly_deduction_amount ?? 0;
                const paid = principal - remaining;
                const progressPct = Math.min(100, Math.round((paid / principal) * 100));

                return (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">
                        {l.name_en || l.employee_name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{l.code || l.employee_code}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700">
                        {l.loan_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                      {formatMoney(principal * exchangeRate)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-amber-600">
                      -{formatMoney(monthly * exchangeRate)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-800">
                      {formatMoney(remaining * exchangeRate)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-[10px] font-medium text-slate-600">
                          <span>${paid} paid</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              progressPct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          l.status === 'ACTIVE'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {l.status === 'ACTIVE' ? (
                        <button
                          onClick={() => {
                            setSelectedLoan(l);
                            setRepayAmount(monthly);
                            setShowRepayModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
                        >
                          Repay
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold">Settled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Advance Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">Issue Salary Advance / Loan</h4>
                <p className="text-xs text-slate-500">Authorize loan disbursement with payroll deduction</p>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueLoan} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Borrowing Employee</label>
                <select
                  value={issueForm.employee_code}
                  onChange={(e) => {
                    const code = e.target.value;
                    const map: any = {
                      'EMP-001': { id: 'emp-1', name: 'Sokha Heng' },
                      'EMP-002': { id: 'emp-2', name: 'Dara Chan' },
                      'EMP-003': { id: 'emp-3', name: 'Visal Keo' },
                      'EMP-004': { id: 'emp-4', name: 'Rathana Som' },
                      'EMP-005': { id: 'emp-5', name: 'Bora Tep' },
                    };
                    setIssueForm({
                      ...issueForm,
                      employee_code: code,
                      employee_id: map[code].id,
                      employee_name: map[code].name,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="EMP-003">EMP-003 - Visal Keo (Software Engineering)</option>
                  <option value="EMP-001">EMP-001 - Sokha Heng (Human Resources)</option>
                  <option value="EMP-002">EMP-002 - Dara Chan (Finance & Accounting)</option>
                  <option value="EMP-004">EMP-004 - Rathana Som (Software Engineering)</option>
                  <option value="EMP-005">EMP-005 - Bora Tep (Sales & Marketing)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Advance Type</label>
                  <select
                    value={issueForm.loan_type}
                    onChange={(e) => setIssueForm({ ...issueForm, loan_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SALARY_ADVANCE">Emergency Salary Advance</option>
                    <option value="COMPANY_LOAN">Company Loan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Principal (USD)</label>
                  <input
                    type="number"
                    min={50}
                    value={issueForm.principal_usd}
                    onChange={(e) =>
                      setIssueForm({ ...issueForm, principal_usd: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={issueForm.tenure_months}
                    onChange={(e) =>
                      setIssueForm({ ...issueForm, tenure_months: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Deduction Start Date</label>
                  <input
                    type="date"
                    value={issueForm.start_date}
                    onChange={(e) => setIssueForm({ ...issueForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Deduction:</span>
                  <span className="font-bold text-amber-600 font-mono">
                    ${Math.round(issueForm.principal_usd / issueForm.tenure_months)} USD / month
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">In Cambodian Riel:</span>
                  <span className="font-mono font-medium text-slate-700">
                    ៛
                    {Math.round(
                      (issueForm.principal_usd / issueForm.tenure_months) * exchangeRate
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Reason / Justification</label>
                <textarea
                  rows={2}
                  value={issueForm.notes}
                  onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                  placeholder="Emergency family expense, medical needs..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
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
                  Approve &amp; Issue Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Repayment Modal */}
      {showRepayModal && selectedLoan && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">Record Ad-Hoc Repayment</h4>
                <p className="text-xs text-slate-500">{selectedLoan.name_en || selectedLoan.employee_name}</p>
              </div>
              <button
                onClick={() => setShowRepayModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRepaymentSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Balance:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    ${selectedLoan.remaining_usd ?? selectedLoan.remaining_balance ?? 0} USD
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Payment Amount (USD)</label>
                <input
                  type="number"
                  min={10}
                  max={selectedLoan.remaining_usd ?? selectedLoan.remaining_balance ?? 100}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRepayModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
