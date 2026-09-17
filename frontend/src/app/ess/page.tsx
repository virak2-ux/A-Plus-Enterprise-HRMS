'use client';

import React, { useState } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import apiClient from '@/lib/api';
import {
  Clock,
  CalendarCheck,
  FileText,
  DollarSign,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Printer,
  Sparkles,
  Building,
} from 'lucide-react';

export default function EmployeeSelfServicePage() {
  const { language, formatMoney, exchangeRate, currency } = useLanguageCurrency();
  const [punchedIn, setPunchedIn] = useState(true);
  const [punchTime, setPunchTime] = useState('08:05 AM');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);

  const handleTogglePunch = async () => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (punchedIn) {
      setPunchedIn(false);
      setFeedback(`Successfully clocked out at ${now}. Work duration computed.`);
      try {
        await apiClient.post('/attendance/check-out', {
          employee_id: 'emp-1',
          source: 'WEB',
          notes: 'Clocked out via ESS Portal',
        });
      } catch (e) {
        // Optimistic UI
      }
    } else {
      setPunchedIn(true);
      setPunchTime(now);
      setFeedback(`Successfully clocked in at ${now}. Status: Present.`);
      try {
        await apiClient.post('/attendance/check-in', {
          employee_id: 'emp-1',
          source: 'WEB',
          notes: 'Clocked in via ESS Portal',
        });
      } catch (e) {
        // Optimistic UI
      }
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Mobile ESS Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-6 rounded-2xl shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg border border-white/20">
              SH
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {language === 'km' ? 'ហេង សុខា' : 'Sokha Heng'}
              </h2>
              <p className="text-xs text-indigo-200">
                EMP-001 &bull; {language === 'km' ? 'ប្រធានផ្នែកធនធានមនុស្ស' : 'HR Director'}
              </p>
            </div>
          </div>
          <span className="text-[11px] bg-emerald-500/30 text-emerald-200 px-2.5 py-1 rounded-full font-semibold border border-emerald-500/40">
            Active Staff
          </span>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Quick Punch Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'km' ? 'កត់ត្រាវត្តមានផ្ទាល់ខ្លួន' : 'Daily Punch In / Out'}
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Today&apos;s Status
            </p>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {punchedIn ? `Present &bull; In at ${punchTime}` : 'Currently Clocked Out'}
            </p>
          </div>
          <button
            onClick={handleTogglePunch}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow transition flex items-center space-x-1.5 ${
              punchedIn
                ? 'bg-slate-800 hover:bg-slate-900'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{punchedIn ? 'Clock Out' : 'Clock In'}</span>
          </button>
        </div>
      </div>

      {/* Leave Balances Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'km' ? 'ច្បាប់ឈប់សម្រាករបស់ខ្ញុំ' : 'My Leave Balances'}
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-600 font-bold">Labor Law Compliant</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <span className="text-[10px] uppercase font-bold text-indigo-900 block">Annual Leave</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">14.0</span>
            <span className="text-[10px] text-slate-500">Days Remaining (1.5/mo)</span>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
            <span className="text-[10px] uppercase font-bold text-amber-900 block">Sick Leave</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">29.0</span>
            <span className="text-[10px] text-slate-500">Days Remaining</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-700 block">Special Leave</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">5.0</span>
            <span className="text-[10px] text-slate-500">Days Remaining</span>
          </div>
        </div>
      </div>

      {/* My Latest Payslip Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'km' ? 'ប័ណ្ណបើកប្រាក់បៀវត្សចុងក្រោយ' : 'Latest Payslip &bull; September 2026'}
            </h3>
          </div>
          <button
            onClick={() => setShowPayslipModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>View &amp; Print</span>
          </button>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs font-mono border border-slate-100">
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">Contract Salary (USD):</span>
            <span className="font-semibold text-slate-900">$2,200.00 USD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">Gross Salary (KHR):</span>
            <span>៛9,020,000</span>
          </div>
          <div className="flex justify-between text-emerald-700">
            <span className="font-sans">NSSF Pension (2% employee):</span>
            <span>-៛24,000</span>
          </div>
          <div className="flex justify-between text-amber-600">
            <span className="font-sans">GDT Tax on Salary (ToS):</span>
            <span>-៛549,000</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
            <span className="font-sans">Net Take-Home:</span>
            <span className="text-emerald-700 font-bold">
              {formatMoney(8447000)}
            </span>
          </div>
        </div>
      </div>

      {/* My Contract & Identification */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Contract &amp; Identification</h3>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Contract Type:</span>
            <span className="font-semibold text-slate-900">UDC (Undetermined Duration Contract)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">National ID Number:</span>
            <span className="font-mono text-slate-900">&bull;&bull;&bull;&bull;&bull;&bull; 108</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Bank Account (ABA):</span>
            <span className="font-mono text-slate-900">001 234 567 (HENG SOKHA)</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Cambodia Tax Residence:</span>
            <span className="font-semibold text-emerald-700">Resident (2 Dependents Relief Claimed)</span>
          </div>
        </div>
      </div>

      {/* ESS Payslip Modal */}
      {showPayslipModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">CamTech Solutions Co., Ltd.</h4>
                  <p className="text-[11px] text-slate-500">Bilingual Payslip &bull; ប័ណ្ណទូទាត់ប្រាក់បៀវត្ស</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-semibold shadow flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setShowPayslipModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Payslip Content Preview */}
            <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-3 font-sans bg-white">
              <div className="text-center pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">OFFICIAL PAYSLIP / ប័ណ្ណបើកប្រាក់បៀវត្ស</h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Cycle: 01-Sep-2026 to 30-Sep-2026 &bull; Rate: 4,100 KHR/USD
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] p-2 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-slate-500">Name:</span>{' '}
                  <span className="font-bold">Sokha Heng (ហេង សុខា)</span>
                </div>
                <div>
                  <span className="text-slate-500">Emp ID:</span>{' '}
                  <span className="font-mono font-bold">EMP-001</span>
                </div>
                <div>
                  <span className="text-slate-500">Department:</span> Human Resources
                </div>
                <div>
                  <span className="text-slate-500">Position:</span> HR Director
                </div>
                <div>
                  <span className="text-slate-500">NSSF Card:</span> NSSF-880912
                </div>
                <div>
                  <span className="text-slate-500">Tax Relief:</span> 2 Dependents (300,000៛)
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="font-bold text-indigo-900 text-[11px] border-b pb-1">
                    EARNINGS / ប្រាក់ចំណូល
                  </p>
                  <div className="mt-2 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-600">Base Salary:</span>
                      <span>$2,200.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-600">KHR Gross:</span>
                      <span>9,020,000៛</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-bold text-rose-900 text-[11px] border-b pb-1">
                    DEDUCTIONS / ការកាត់កង
                  </p>
                  <div className="mt-2 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-700">
                      <span className="font-sans text-slate-600">NSSF Pension (2%):</span>
                      <span>-24,000៛</span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span className="font-sans text-slate-600">Tax on Salary:</span>
                      <span>-549,000៛</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payout Banner */}
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide block">
                    Net Take-Home Pay
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono">Disbursed via ABA Bank</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-emerald-800 font-mono block">
                    8,447,000៛ KHR
                  </span>
                  <span className="text-[11px] text-emerald-600 font-mono font-bold">$2,060.24 USD</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowPayslipModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
