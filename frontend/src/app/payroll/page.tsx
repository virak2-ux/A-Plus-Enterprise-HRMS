'use client';

import React, { useState } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import {
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Download,
  Printer,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  DollarSign,
  ChevronDown,
} from 'lucide-react';

interface PayrollItemRow {
  code: string;
  name_en: string;
  name_kh: string;
  department: string;
  position: string;
  bank_name: string;
  bank_account: string;
  contract_salary_usd: number;
  gross_khr: number;
  nssf_pension_khr: number;
  tos_tax_khr: number;
  net_khr: number;
  net_usd: number;
}

const SAMPLE_PAYROLL_ITEMS: PayrollItemRow[] = [
  {
    code: 'EMP-001',
    name_en: 'Sokha Heng',
    name_kh: 'ហេង សុខា',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    bank_name: 'ABA Bank',
    bank_account: '001 234 567',
    contract_salary_usd: 2200,
    gross_khr: 9020000,
    nssf_pension_khr: 24000, // Capped at 1.2M ceiling
    tos_tax_khr: 993400,    // Progressive brackets after spouse+2 children rebate
    net_khr: 8002600,
    net_usd: 1951.85,
  },
  {
    code: 'EMP-002',
    name_en: 'Dara Chan',
    name_kh: 'ចាន់ ដារ៉ា',
    department: 'Human Resources',
    position: 'HR Officer',
    bank_name: 'ABA Bank',
    bank_account: '002 987 654',
    contract_salary_usd: 1100,
    gross_khr: 4510000,
    nssf_pension_khr: 24000,
    tos_tax_khr: 288600,
    net_khr: 4197400,
    net_usd: 1023.76,
  },
  {
    code: 'EMP-003',
    name_en: 'Visal Keo',
    name_kh: 'កែវ វិសាល',
    department: 'Finance',
    position: 'Chief Financial Officer',
    bank_name: 'ACLEDA Bank',
    bank_account: '100 554 321',
    contract_salary_usd: 1800,
    gross_khr: 7380000,
    nssf_pension_khr: 24000,
    tos_tax_khr: 720600,
    net_khr: 6635400,
    net_usd: 1618.39,
  },
  {
    code: 'EMP-004',
    name_en: 'Rathana Som',
    name_kh: 'សោម រតនា',
    department: 'Operations',
    position: 'Logistics Supervisor',
    bank_name: 'Canadia Bank',
    bank_account: '300 112 998',
    contract_salary_usd: 780,
    gross_khr: 3200000,
    nssf_pension_khr: 24000,
    tos_tax_khr: 142600,
    net_khr: 3033400,
    net_usd: 739.85,
  },
  {
    code: 'EMP-005',
    name_en: 'Bora Tep',
    name_kh: 'ទេព បូរ៉ា',
    department: 'Sales & Marketing',
    position: 'Account Executive',
    bank_name: 'ABA Bank',
    bank_account: '001 888 222',
    contract_salary_usd: 650,
    gross_khr: 2665000,
    nssf_pension_khr: 24000,
    tos_tax_khr: 89100,
    net_khr: 2551900,
    net_usd: 622.41,
  },
];

export default function PayrollPage() {
  const { t, formatMoney, currency, exchangeRate, language } = useLanguageCurrency();
  const [status, setStatus] = useState<'DRAFT' | 'CALCULATED' | 'APPROVED' | 'LOCKED'>('CALCULATED');
  const [items, setItems] = useState<PayrollItemRow[]>(SAMPLE_PAYROLL_ITEMS);
  const [selectedItem, setSelectedItem] = useState<PayrollItemRow | null>(null);
  const [payslipItem, setPayslipItem] = useState<PayrollItemRow | null>(null);
  const [showBankMenu, setShowBankMenu] = useState(false);

  const totalGrossKhr = items.reduce((acc, i) => acc + i.gross_khr, 0);
  const totalTaxKhr = items.reduce((acc, i) => acc + i.tos_tax_khr, 0);
  const totalNssfKhr = items.reduce((acc, i) => acc + i.nssf_pension_khr * 2, 0); // Employee + Employer
  const totalNetKhr = items.reduce((acc, i) => acc + i.net_khr, 0);

  const handleCalculate = () => {
    setStatus('CALCULATED');
  };

  const handleApprove = () => {
    setStatus('APPROVED');
  };

  const handleLock = () => {
    setStatus('LOCKED');
  };

  const downloadBankExport = (bankFormat: 'ABA' | 'ACLEDA' | 'UNIVERSAL') => {
    setShowBankMenu(false);
    let csvContent = '';
    if (bankFormat === 'ABA') {
      csvContent = 'Beneficiary Account,Beneficiary Name,Amount,Currency,Remarks,Employee Code\n';
      items.forEach((item) => {
        csvContent += `${item.bank_account},"${item.name_en}",${item.net_usd.toFixed(2)},USD,"March 2026 Salary",${item.code}\n`;
      });
    } else if (bankFormat === 'ACLEDA') {
      csvContent = 'No,Account Number,Account Name,Currency,Amount,Description,Staff ID\n';
      items.forEach((item, idx) => {
        csvContent += `${idx + 1},${item.bank_account},"${item.name_en}",USD,${item.net_usd.toFixed(2)},"Monthly Salary",${item.code}\n`;
      });
    } else {
      csvContent = 'Employee Code,Name EN,Name KH,Bank,Account No,Currency,Net Amount USD,Net Amount KHR\n';
      items.forEach((item) => {
        csvContent += `${item.code},"${item.name_en}","${item.name_kh}",${item.bank_name},${item.bank_account},USD,${item.net_usd.toFixed(2)},${item.net_khr}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Payroll_Disbursement_${bankFormat}_March_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">{t('payroll.title')}</h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                status === 'LOCKED'
                  ? 'bg-rose-100 text-rose-800'
                  : status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {status === 'LOCKED'
                ? t('payroll.status_locked')
                : status === 'APPROVED'
                ? t('payroll.status_approved')
                : t('payroll.status_review')}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{t('payroll.subtitle')}</p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 relative">
          {status !== 'LOCKED' && (
            <>
              <button
                onClick={handleCalculate}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Calculator className="w-4 h-4" />
                <span>{t('payroll.calculate_btn')}</span>
              </button>
              <button
                onClick={handleApprove}
                disabled={status === 'APPROVED'}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('payroll.approve_btn')}</span>
              </button>
              <button
                onClick={handleLock}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Lock className="w-4 h-4" />
                <span>{t('payroll.lock_btn')}</span>
              </button>
            </>
          )}

          {/* Bank Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBankMenu(!showBankMenu)}
              className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <Download className="w-4 h-4" />
              <span>Bank Export</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {showBankMenu && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Bank Template
                </div>
                <button
                  onClick={() => downloadBankExport('ABA')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium flex items-center justify-between"
                >
                  <span>ABA Bank iBanking CSV</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">ABA</span>
                </button>
                <button
                  onClick={() => downloadBankExport('ACLEDA')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium flex items-center justify-between"
                >
                  <span>ACLEDA Corporate CSV</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">ACLEDA</span>
                </button>
                <button
                  onClick={() => downloadBankExport('UNIVERSAL')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium flex items-center justify-between"
                >
                  <span>Universal Master Ledger</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Validation Status */}
      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold text-emerald-900">
            {t('payroll.validation_clear')}
          </span>
        </div>
        <span className="text-xs font-mono text-emerald-700 font-medium">
          Period: September 2026 &bull; NBC Rate: {exchangeRate.toLocaleString()} KHR/USD
        </span>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">{t('payroll.total_gross')}</p>
          <p className="text-xl font-bold text-slate-900 mt-2">{formatMoney(totalGrossKhr)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">{t('payroll.total_tax')}</p>
          <p className="text-xl font-bold text-amber-600 mt-2">{formatMoney(totalTaxKhr)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">{t('payroll.total_nssf')}</p>
          <p className="text-xl font-bold text-emerald-600 mt-2">{formatMoney(totalNssfKhr)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">{t('payroll.total_net')}</p>
          <p className="text-xl font-bold text-indigo-600 mt-2">{formatMoney(totalNetKhr)}</p>
        </div>
      </div>

      {/* Itemized Calculation Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Employee Payroll Ledger</h3>
          <span className="text-xs text-slate-400">5 active employees processed</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">{t('payroll.col_emp')}</th>
                <th className="px-5 py-3.5">{t('payroll.col_contract_salary')}</th>
                <th className="px-5 py-3.5">{t('payroll.col_gross')}</th>
                <th className="px-5 py-3.5">{t('payroll.col_nssf_pension')}</th>
                <th className="px-5 py-3.5">{t('payroll.col_tos')}</th>
                <th className="px-5 py-3.5 text-right font-bold text-slate-800">
                  {currency === 'USD' ? t('payroll.col_net_usd') : t('payroll.col_net_khr')}
                </th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((row) => (
                <tr key={row.code} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">
                      {language === 'km' ? row.name_kh : row.name_en}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{row.code}</div>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-700">
                    ${row.contract_salary_usd.toLocaleString()} USD
                  </td>
                  <td className="px-5 py-3.5 font-mono">៛{row.gross_khr.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-emerald-600 font-mono">
                    -៛{row.nssf_pension_khr.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-amber-600 font-mono">
                    -៛{row.tos_tax_khr.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-900 font-mono">
                    {currency === 'USD' ? `$${row.net_usd.toFixed(2)}` : `៛${row.net_khr.toLocaleString()}`}
                  </td>
                  <td className="px-5 py-3.5 text-center space-x-2">
                    <button
                      onClick={() => setSelectedItem(row)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                    >
                      Breakdown
                    </button>
                    <button
                      onClick={() => setPayslipItem(row)}
                      className="inline-flex items-center space-x-1 text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-2 py-1 rounded font-medium text-slate-700 transition"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Payslip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explainability Breakdown Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Calculation Trace: {selectedItem.name_en}
                </h4>
                <p className="text-xs text-slate-400 font-mono">{selectedItem.code}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span>Base Contract:</span>
                  <span>${selectedItem.contract_salary_usd} USD</span>
                </div>
                <div className="flex justify-between">
                  <span>NBC Rate Applied:</span>
                  <span>4,100 KHR/USD</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Gross Salary:</span>
                  <span>៛{selectedItem.gross_khr.toLocaleString()} KHR</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-lg space-y-1 text-emerald-900">
                <div className="font-bold">NSSF Contribution Rule:</div>
                <div className="flex justify-between text-[11px]">
                  <span>Pension Employee Deduction (2% capped at 1.2M):</span>
                  <span className="font-mono">-៛{selectedItem.nssf_pension_khr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Taxable Base after NSSF Deduction:</span>
                  <span className="font-mono">
                    ៛{(selectedItem.gross_khr - selectedItem.nssf_pension_khr).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-lg space-y-1 text-amber-900">
                <div className="font-bold">Cambodia GDT Tax on Salary (ToS):</div>
                <div className="text-[11px]">Progressive brackets applied under GDT Circular.</div>
                <div className="flex justify-between text-[11px] font-bold">
                  <span>Total Tax Deducted:</span>
                  <span className="font-mono">-៛{selectedItem.tos_tax_khr.toLocaleString()} KHR</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-lg flex justify-between items-center text-indigo-950 font-bold">
                <span>Final Net Payout:</span>
                <span className="text-sm font-mono">
                  ៛{selectedItem.net_khr.toLocaleString()} KHR (${selectedItem.net_usd.toFixed(2)} USD)
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Payslip Modal */}
      {payslipItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm">
                <Printer className="w-4 h-4" />
                <span>ប័ណ្ណបើកប្រាក់បៀវត្សរ៍ / Official Payslip</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print (PDF)</span>
                </button>
                <button
                  onClick={() => setPayslipItem(null)}
                  className="px-2.5 py-1 text-slate-400 hover:text-slate-600 text-sm font-semibold rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Payslip Document Body */}
            <div className="space-y-6 text-slate-800 text-xs">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">ក្រុមហ៊ុន ខេមថេក សូលូសិន ខូអិលធីឌី</h3>
                  <p className="text-slate-600 text-xs font-medium">CamTech Solutions Co., Ltd.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    TIN: <strong>K001-902384912</strong> &bull; NSSF: <strong>NSSF-99201</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-indigo-600 block">ប័ណ្ណបើកប្រាក់ខែ</span>
                  <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">MONTHLY PAYSLIP</span>
                  <div className="mt-1 inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold text-[10px]">
                    01/09/2026 – 30/09/2026
                  </div>
                </div>
              </div>

              {/* Employee Meta Grid */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Employee ID: </span>
                  <strong className="font-mono">{payslipItem.code}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Department: </span>
                  <strong>{payslipItem.department}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Khmer Name: </span>
                  <strong className="font-medium text-slate-900">{payslipItem.name_kh}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Position: </span>
                  <strong>{payslipItem.position}</strong>
                </div>
                <div>
                  <span className="text-slate-500">English Name: </span>
                  <strong>{payslipItem.name_en}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Bank Account: </span>
                  <strong className="font-mono">{payslipItem.bank_name}: {payslipItem.bank_account}</strong>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-emerald-50 px-3 py-2 text-emerald-900 font-bold border-b border-emerald-100 flex justify-between">
                    <span>EARNINGS</span>
                    <span>KHR</span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between">
                      <span>Base Contract Salary</span>
                      <span className="font-mono">${payslipItem.contract_salary_usd}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Earned Base Salary</span>
                      <span className="font-mono">៛{payslipItem.gross_khr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overtime & Allowances</span>
                      <span className="font-mono">៛0</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-emerald-800">
                      <span>Gross Salary</span>
                      <span className="font-mono">៛{payslipItem.gross_khr.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-rose-50 px-3 py-2 text-rose-900 font-bold border-b border-rose-100 flex justify-between">
                    <span>DEDUCTIONS</span>
                    <span>KHR</span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between">
                      <span>NSSF Pension (2%)</span>
                      <span className="font-mono text-rose-600">-៛{payslipItem.nssf_pension_khr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GDT Tax on Salary</span>
                      <span className="font-mono text-rose-600">-៛{payslipItem.tos_tax_khr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Loan Repayment</span>
                      <span className="font-mono text-rose-600">-៛0</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-rose-800">
                      <span>Total Deductions</span>
                      <span className="font-mono">-៛{(payslipItem.nssf_pension_khr + payslipItem.tos_tax_khr).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payout Banner */}
              <div className="bg-indigo-900 text-white p-4 rounded-xl flex justify-between items-center shadow-inner">
                <div>
                  <div className="font-bold text-sm">ប្រាក់បៀវត្សរ៍សុទ្ធត្រូវបើកផ្តល់</div>
                  <div className="text-[10px] text-indigo-300 uppercase">NET TAKE-HOME SALARY</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-mono font-extrabold text-cyan-300">
                    ៛{payslipItem.net_khr.toLocaleString()} KHR
                  </div>
                  <div className="text-xs text-indigo-200">Equivalent: ${payslipItem.net_usd.toFixed(2)} USD</div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[11px] text-slate-500 border-t border-slate-200">
                <div>
                  <div className="h-10 border-b border-slate-300 mb-1"></div>
                  <span>Prepared By (Payroll)</span>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-300 mb-1"></div>
                  <span>Approved By (Finance)</span>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-300 mb-1"></div>
                  <span>Employee Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
