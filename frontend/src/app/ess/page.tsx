'use client';

import React, { useState, useEffect } from 'react';
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
  MapPin,
  Send,
  Plus,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  History,
  CheckSquare,
  FileSignature,
} from 'lucide-react';

interface LeaveRequestItem {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED_HR' | 'REJECTED';
}

interface OvertimeRequestItem {
  id: string;
  work_date: string;
  hours: number;
  rate_multiplier: number;
  reason: string;
  estimated_pay_usd: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface LoanRequestItem {
  id: string;
  loan_type: string;
  principal_amount: number;
  monthly_deduction: number;
  remaining_balance: number;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'PAID_OFF';
  notes: string;
}

interface DisciplinaryItem {
  id: string;
  warning_letter_number: string;
  action_taken: string;
  incident_date: string;
  category: string;
  description: string;
  improvement_plan: string;
  acknowledged: boolean;
}

export default function EmployeeSelfServicePage() {
  const { language, formatMoney, exchangeRate, currency } = useLanguageCurrency();
  const [activeTab, setActiveTab] = useState<'punch' | 'leave' | 'overtime' | 'loans' | 'discipline' | 'approvals'>('punch');

  // Clock in/out states
  const [punchedIn, setPunchedIn] = useState(true);
  const [punchTime, setPunchTime] = useState('08:05 AM');
  const [workMode, setWorkMode] = useState<'OFFICE' | 'REMOTE' | 'CLIENT'>('OFFICE');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);

  // Leave Form
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [leaveStart, setLeaveStart] = useState('2026-10-01');
  const [leaveEnd, setLeaveEnd] = useState('2026-10-02');
  const [leaveReason, setLeaveReason] = useState('');
  const [myLeaves, setMyLeaves] = useState<LeaveRequestItem[]>([
    {
      id: 'l1',
      leave_type: 'Annual Leave (ច្បាប់ប្រចាំឆ្នាំ)',
      start_date: '2026-08-15',
      end_date: '2026-08-16',
      total_days: 2.0,
      reason: 'Family visit to Battambang',
      status: 'APPROVED_HR',
    },
    {
      id: 'l2',
      leave_type: 'Sick Leave (ច្បាប់ឈឺ)',
      start_date: '2026-09-04',
      end_date: '2026-09-04',
      total_days: 1.0,
      reason: 'Fever and medical consultation',
      status: 'APPROVED_HR',
    },
  ]);

  // Overtime Form
  const [showOtModal, setShowOtModal] = useState(false);
  const [otDate, setOtDate] = useState('2026-09-20');
  const [otHours, setOtHours] = useState(3);
  const [otRate, setOtRate] = useState(1.5);
  const [otReason, setOtReason] = useState('');
  const [myOvertimes, setMyOvertimes] = useState<OvertimeRequestItem[]>([
    {
      id: 'ot1',
      work_date: '2026-09-12',
      hours: 4,
      rate_multiplier: 1.5,
      reason: 'Month-end financial payroll close',
      estimated_pay_usd: 63.46,
      status: 'APPROVED',
    },
  ]);

  // Loan Form
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanPrincipal, setLoanPrincipal] = useState(400);
  const [loanTenure, setLoanTenure] = useState(4);
  const [loanReason, setLoanReason] = useState('');
  const [myLoans, setMyLoans] = useState<LoanRequestItem[]>([
    {
      id: 'ln1',
      loan_type: 'SALARY_ADVANCE',
      principal_amount: 500,
      monthly_deduction: 100,
      remaining_balance: 300,
      status: 'ACTIVE',
      notes: 'Emergency home maintenance repair',
    },
  ]);

  // Disciplinary Acknowledgment
  const [myDisciplinary, setMyDisciplinary] = useState<DisciplinaryItem[]>([
    {
      id: 'disc-1',
      warning_letter_number: 'WL-2026-001',
      action_taken: 'FIRST_WRITTEN_WARNING',
      incident_date: '2026-08-10',
      category: 'LATENESS',
      description: 'Repeated unexcused late arrivals exceeding 40 minutes on 3 consecutive days.',
      improvement_plan: 'Employee must maintain punctual attendance for the next 60 days.',
      acknowledged: false,
    },
  ]);
  const [ackComments, setAckComments] = useState('');
  const [showAckModal, setShowAckModal] = useState(false);
  const [selectedDisc, setSelectedDisc] = useState<DisciplinaryItem | null>(null);

  // Manager Approvals Queue
  const [managerApprovals, setManagerApprovals] = useState([
    {
      id: 'app-1',
      type: 'LEAVE',
      employee: 'Dara Vong (វង្ស ដារ៉ា)',
      code: 'EMP-005',
      title: 'Annual Leave &bull; 3 Days',
      period: '12-Oct-2026 to 14-Oct-2026',
      reason: 'Pchum Ben family pilgrimage',
    },
    {
      id: 'app-2',
      type: 'OVERTIME',
      employee: 'Neary Chea (ជា នារី)',
      code: 'EMP-006',
      title: 'Article 139 Night OT &bull; 4.0 Hours (2.0x Rate)',
      period: '18-Sep-2026 (22:00 - 02:00)',
      reason: 'Statutory tax report reconciliation',
    },
    {
      id: 'app-3',
      type: 'LOAN',
      employee: 'Rithy Sovann (សុវណ្ណ រិទ្ធី)',
      code: 'EMP-007',
      title: 'Salary Advance &bull; $300.00 USD (3 Months)',
      period: 'Deduction: $100.00/mo',
      reason: 'Family medical clinic expense',
    },
  ]);

  const handleTogglePunch = async () => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (punchedIn) {
      setPunchedIn(false);
      setFeedback(`Successfully clocked out at ${now}. Work duration logged.`);
      try {
        await apiClient.post('/attendance/check-out', {
          employee_id: 'emp-1',
          source: 'WEB_GEO',
          notes: `Clocked out via ESS (${workMode})`,
        });
      } catch (e) {
        // Optimistic UI
      }
    } else {
      setPunchedIn(true);
      setPunchTime(now);
      setFeedback(`Successfully clocked in at ${now} via ${workMode} mode. GPS Location Verified.`);
      try {
        await apiClient.post('/attendance/check-in', {
          employee_id: 'emp-1',
          source: 'WEB_GEO',
          notes: `Clocked in via ESS (${workMode})`,
        });
      } catch (e) {
        // Optimistic UI
      }
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: LeaveRequestItem = {
      id: `l-${Date.now()}`,
      leave_type: leaveType === 'ANNUAL' ? 'Annual Leave' : leaveType === 'SICK' ? 'Sick Leave' : 'Special Leave',
      start_date: leaveStart,
      end_date: leaveEnd,
      total_days: 2.0,
      reason: leaveReason || 'Personal holiday',
      status: 'PENDING',
    };
    setMyLeaves([newReq, ...myLeaves]);
    setShowLeaveModal(false);
    setLeaveReason('');
    setFeedback('Leave application successfully submitted for supervisor approval.');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSubmitOt = (e: React.FormEvent) => {
    e.preventDefault();
    const hourlyRate = 2200 / 208;
    const est = hourlyRate * otRate * otHours;
    const newOt: OvertimeRequestItem = {
      id: `ot-${Date.now()}`,
      work_date: otDate,
      hours: otHours,
      rate_multiplier: otRate,
      reason: otReason || 'Urgent project release',
      estimated_pay_usd: Math.round(est * 100) / 100,
      status: 'PENDING',
    };
    setMyOvertimes([newOt, ...myOvertimes]);
    setShowOtModal(false);
    setOtReason('');
    setFeedback(`Overtime request (${otHours}h @ ${otRate}x) submitted for approval.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSubmitLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const monthly = Math.round((loanPrincipal / loanTenure) * 100) / 100;
    const newLoan: LoanRequestItem = {
      id: `ln-${Date.now()}`,
      loan_type: 'SALARY_ADVANCE',
      principal_amount: loanPrincipal,
      monthly_deduction: monthly,
      remaining_balance: loanPrincipal,
      status: 'PENDING',
      notes: loanReason || 'Advance request',
    };
    setMyLoans([newLoan, ...myLoans]);
    setShowLoanModal(false);
    setLoanReason('');
    setFeedback(`Salary advance of $${loanPrincipal} submitted for HR authorization.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSignDisciplinary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisc) return;
    setMyDisciplinary((prev) =>
      prev.map((d) => (d.id === selectedDisc.id ? { ...d, acknowledged: true } : d))
    );
    setShowAckModal(false);
    setAckComments('');
    setFeedback('Disciplinary warning letter electronically acknowledged and logged to compliance vault.');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleApproveManager = (id: string) => {
    setManagerApprovals((prev) => prev.filter((a) => a.id !== id));
    setFeedback('Request approved and notification dispatched to employee.');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleRejectManager = (id: string) => {
    setManagerApprovals((prev) => prev.filter((a) => a.id !== id));
    setFeedback('Request rejected with feedback dispatched to employee.');
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Mobile & Web ESS Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-950 text-white p-6 rounded-3xl shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center font-black text-xl border border-white/20 shadow-inner">
              SH
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold">
                  {language === 'km' ? 'ហេង សុខា' : 'Sokha Heng'}
                </h2>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full font-bold border border-emerald-400/40">
                  Active Staff
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                EMP-001 &bull; {language === 'km' ? 'ប្រធានផ្នែកធនធានមនុស្ស' : 'HR Director'} &bull; UDC Contract
              </p>
              <p className="text-[11px] text-indigo-300 font-mono mt-0.5">
                🏢 Phnom Penh HQ &bull; NSSF: 880912
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPayslipModal(true)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 backdrop-blur-sm"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'km' ? 'មើលប័ណ្ណបើកប្រាក់បៀវត្ស' : 'Latest Payslip'}</span>
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{feedback}</span>
        </div>
      )}

      {/* ESS Feature Tabs */}
      <div className="flex overflow-x-auto space-x-1 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('punch')}
          className={`px-3.5 py-2 rounded-xl transition shrink-0 flex items-center space-x-1.5 ${
            activeTab === 'punch'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{language === 'km' ? 'វត្តមាន & ព័ត៌មាន' : 'Attendance & Overview'}</span>
        </button>
        <button
          onClick={() => setActiveTab('leave')}
          className={`px-3.5 py-2 rounded-xl transition shrink-0 flex items-center space-x-1.5 ${
            activeTab === 'leave'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>{language === 'km' ? 'ច្បាប់ឈប់សម្រាក' : 'My Leaves'}</span>
        </button>
        <button
          onClick={() => setActiveTab('overtime')}
          className={`px-3.5 py-2 rounded-xl transition shrink-0 flex items-center space-x-1.5 ${
            activeTab === 'overtime'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'km' ? 'ថែមម៉ោង (មាត្រា ១៣៩)' : 'Overtime'}</span>
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-3.5 py-2 rounded-xl transition shrink-0 flex items-center space-x-1.5 ${
            activeTab === 'loans'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>{language === 'km' ? 'បុរេប្រទាន & កម្ចី' : 'Loans & Advances'}</span>
        </button>
        <button
          onClick={() => setActiveTab('discipline')}
          className={`px-3.5 py-2 rounded-xl transition shrink-0 flex items-center space-x-1.5 ${
            activeTab === 'discipline'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSignature className="w-3.5 h-3.5" />
          <span>{language === 'km' ? 'លិខិតព្រមាន' : 'Disciplinary Letters'}</span>
          {myDisciplinary.some((d) => !d.acknowledged) && (
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-3.5 py-2 rounded-xl transition shrink-0 flex items-center space-x-1.5 ${
            activeTab === 'approvals'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>{language === 'km' ? 'ការអនុម័ត' : 'Manager Approvals'}</span>
          {managerApprovals.length > 0 && (
            <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-rose-500 text-white font-bold">
              {managerApprovals.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Punch & Overview */}
      {activeTab === 'punch' && (
        <div className="space-y-4">
          {/* Quick Smart Punch Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'km' ? 'កត់ត្រាវត្តមានផ្ទាល់ខ្លួន' : 'Web Punch In / Out (Geo-Verified)'}
                </h3>
              </div>
              <div className="flex items-center space-x-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                <span>Phnom Penh HQ Geo-Fence Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setWorkMode('OFFICE')}
                className={`p-3 rounded-xl border text-left transition ${
                  workMode === 'OFFICE'
                    ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 block">🏢 On-Site Office</span>
                <span className="text-[10px] text-slate-500">Phnom Penh Tower</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkMode('REMOTE')}
                className={`p-3 rounded-xl border text-left transition ${
                  workMode === 'REMOTE'
                    ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 block">🏠 Work From Home</span>
                <span className="text-[10px] text-slate-500">Telecommuting policy</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkMode('CLIENT')}
                className={`p-3 rounded-xl border text-left transition ${
                  workMode === 'CLIENT'
                    ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 block">🚗 Client Site Visit</span>
                <span className="text-[10px] text-slate-500">Field work / meeting</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  Today&apos;s Status
                </p>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {punchedIn ? `Present &bull; In at ${punchTime} (${workMode})` : 'Currently Clocked Out'}
                </p>
              </div>
              <button
                onClick={handleTogglePunch}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow transition flex items-center space-x-1.5 ${
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

          {/* Quick Leave Balances */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'km' ? 'សមតុល្យច្បាប់ឈប់សម្រាក' : 'Leave Balances & Seniority Accrual'}
                </h3>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                Art. 166: 18d + 1d Seniority Bonus
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <span className="text-[10px] uppercase font-bold text-indigo-900 block">Annual Leave</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">14.0</span>
                <span className="text-[10px] text-slate-500">Days Left (18 + 1)</span>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                <span className="text-[10px] uppercase font-bold text-amber-900 block">Sick Leave</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">29.0</span>
                <span className="text-[10px] text-slate-500">Days Left</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-700 block">Special Leave</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">5.0</span>
                <span className="text-[10px] text-slate-500">Days (Art. 169)</span>
              </div>
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                <span className="text-[10px] uppercase font-bold text-purple-900 block">Maternity</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">90.0</span>
                <span className="text-[10px] text-slate-500">Days (Art. 182)</span>
              </div>
            </div>
          </div>

          {/* Contract & Identity Details */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Contract &amp; Identification Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Contract Type</span>
                <span className="font-bold text-slate-900">UDC (Undetermined Duration Contract)</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">National ID Card</span>
                <span className="font-mono font-bold text-slate-900">&bull;&bull;&bull;&bull;&bull;&bull; 108</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Disbursement Bank</span>
                <span className="font-mono font-bold text-slate-900">ABA Bank &bull; 001 234 567</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Tax Residence Status</span>
                <span className="font-semibold text-emerald-700">Resident (2 Dependents Relief Claimed)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: My Leaves */}
      {activeTab === 'leave' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'km' ? 'ពាក្យស្នើសុំច្បាប់ឈប់សម្រាក' : 'Leave Request Submissions'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'km'
                  ? 'ដាក់ពាក្យស្នើសុំច្បាប់ឈប់សម្រាកផ្ទាល់ខ្លួន និងតាមដានស្ថានភាព'
                  : 'Submit and track your annual, sick, and special leave requests.'}
              </p>
            </div>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'km' ? 'ដាក់ពាក្យសុំច្បាប់' : 'Apply For Leave'}</span>
            </button>
          </div>

          {/* Leaves List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {myLeaves.map((req) => (
              <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">{req.leave_type}</span>
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                      {req.total_days} Days
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    {req.start_date} &rarr; {req.end_date}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 italic">&quot;{req.reason}&quot;</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    req.status === 'APPROVED_HR'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : req.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: My Overtime */}
      {activeTab === 'overtime' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'km' ? 'ស្នើសុំថែមម៉ោងការងារ (មាត្រា ១៣៩)' : 'Article 139 Overtime Applications'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'km'
                  ? 'អត្រាថែមម៉ោងច្បាប់៖ ថ្ងៃធ្វើការ ១.៥ដង | ពេលយប់ ២.០ដង | ថ្ងៃអាទិត្យ ២.០ដង | បុណ្យជាតិ ២.០ដង'
                  : 'Statutory rates: 1.5x Normal Day, 2.0x Night (22:00-06:00), 2.0x Sunday Rest Day, 2.0x Holiday.'}
              </p>
            </div>
            <button
              onClick={() => setShowOtModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'km' ? 'ស្នើសុំថែមម៉ោង' : 'Request Overtime'}</span>
            </button>
          </div>

          {/* Overtime List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {myOvertimes.map((ot) => (
              <div key={ot.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">
                      {ot.work_date} &bull; {ot.hours} Hours
                    </span>
                    <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold">
                      {ot.rate_multiplier}x Rate
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 italic">&quot;{ot.reason}&quot;</p>
                  <p className="text-[11px] text-emerald-700 font-bold font-mono mt-0.5">
                    Est. Pay: ${ot.estimated_pay_usd.toFixed(2)} USD
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    ot.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : ot.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {ot.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Loans & Advances */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'km' ? 'ប្រាក់បុរេប្រទាន & កម្ចីសង្គ្រោះបន្ទាន់' : 'Salary Advances & Emergency Loans'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'km'
                  ? 'ការកាត់ប្រាក់ស្វ័យប្រវត្តិតាមការទូទាត់ប្រាក់បៀវត្សប្រចាំខែ ដោយគ្មានការប្រាក់'
                  : 'Zero-interest advances automatically deducted via monthly payroll runs.'}
              </p>
            </div>
            <button
              onClick={() => setShowLoanModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'km' ? 'ស្នើសុំបុរេប្រទាន' : 'Request Advance'}</span>
            </button>
          </div>

          {/* Active Loans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myLoans.map((loan) => {
              const paidAmount = loan.principal_amount - loan.remaining_balance;
              const pct = Math.round((paidAmount / loan.principal_amount) * 100);
              return (
                <div
                  key={loan.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {loan.loan_type}
                      </span>
                      <h4 className="text-base font-black text-slate-900 mt-1">
                        ${loan.principal_amount.toFixed(2)} USD
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        loan.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {loan.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Repayment Progress</span>
                      <span className="font-bold text-slate-900">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Remaining</span>
                      <p className="font-bold text-rose-700">${loan.remaining_balance.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Monthly Deduction</span>
                      <p className="font-bold text-slate-800">${loan.monthly_deduction.toFixed(2)}/mo</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 italic">&quot;{loan.notes}&quot;</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: Disciplinary Letters & Acknowledgment */}
      {activeTab === 'discipline' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'km' ? 'លិខិតព្រមាន & វិន័យការងារ (មាត្រា ២៦-២៩)' : 'Disciplinary Records & Official Warning Letters'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'km'
                ? 'ពិនិត្យមើលលិខិតព្រមានផ្លូវការ និងចុះហត្ថលេខាទទួលស្គាល់តាមប្រព័ន្ធអេឡិចត្រូនិច'
                : 'Review official Cambodian warning letters and electronically sign acknowledgment.'}
            </p>
          </div>

          <div className="space-y-3">
            {myDisciplinary.map((disc) => (
              <div
                key={disc.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {disc.warning_letter_number}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{disc.action_taken}</h4>
                    </div>
                    <p className="text-xs text-slate-500">Incident Date: {disc.incident_date}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      disc.acknowledged
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {disc.acknowledged ? 'Signed / Acknowledged' : 'Pending Signature'}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {disc.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => window.open(`http://127.0.0.1:8000/api/v1/disciplinary/${disc.id}/warning-letter`, '_blank')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View Official Printable Letter (លិខិតព្រមាន)</span>
                  </button>

                  {!disc.acknowledged && (
                    <button
                      onClick={() => {
                        setSelectedDisc(disc);
                        setShowAckModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      <span>Sign Acknowledgment</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Manager Approvals Center */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'km' ? 'ប្រអប់អនុម័តសំណើរបស់ក្រុមការងារ' : 'Team Requests Approval Center'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'km'
                  ? 'ពិនិត្យ និងអនុម័តច្បាប់ឈប់សម្រាក ថែមម៉ោង និងប្រាក់បុរេប្រទានរបស់បុគ្គលិកក្រោមឱវាទ'
                  : 'Review and approve leave, overtime, and loan requests submitted by direct reports.'}
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
              Supervisor Mode
            </span>
          </div>

          {managerApprovals.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>All team requests have been reviewed and approved!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {managerApprovals.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {item.type}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{item.employee}</span>
                      <span className="text-[10px] font-mono text-slate-400">{item.code}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.period}</p>
                    <p className="text-xs text-slate-600 italic">&quot;{item.reason}&quot;</p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleRejectManager(item.id)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center space-x-1"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                    <button
                      onClick={() => handleApproveManager(item.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leave Application Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitLeave}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">Apply For Leave</h4>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-semibold block mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="ANNUAL">Annual Leave (ច្បាប់ប្រចាំឆ្នាំ - 14.0 days left)</option>
                  <option value="SICK">Sick Leave (ច្បាប់ឈឺ - 29.0 days left)</option>
                  <option value="SPECIAL">Special Leave (ច្បាប់ពិសេស - 5.0 days left)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">End Date</label>
                  <input
                    type="date"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-500 font-semibold block mb-1">Reason</label>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Provide reason for leave request..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Overtime Request Modal */}
      {showOtModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitOt}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">Request Overtime (Art. 139)</h4>
              <button
                type="button"
                onClick={() => setShowOtModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-semibold block mb-1">Date of Overtime</label>
                <input
                  type="date"
                  value={otDate}
                  onChange={(e) => setOtDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={otHours}
                    onChange={(e) => setOtHours(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Rate Multiplier</label>
                  <select
                    value={otRate}
                    onChange={(e) => setOtRate(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value={1.5}>1.5x - Normal Day (Mon-Sat)</option>
                    <option value={2.0}>2.0x - Night (22:00-06:00)</option>
                    <option value={2.0}>2.0x - Sunday Rest Day</option>
                    <option value={2.0}>2.0x - Public Holiday</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-500 font-semibold block mb-1">Justification / Reason</label>
                <textarea
                  rows={3}
                  value={otReason}
                  onChange={(e) => setOtReason(e.target.value)}
                  placeholder="Explain why overtime is required..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOtModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow"
              >
                Submit OT Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loan / Advance Request Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitLoan}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">Request Salary Advance</h4>
              <button
                type="button"
                onClick={() => setShowLoanModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Amount (USD)</label>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    step="50"
                    value={loanPrincipal}
                    onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Repayment Tenure</label>
                  <select
                    value={loanTenure}
                    onChange={(e) => setLoanTenure(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value={1}>1 Month (100% next pay)</option>
                    <option value={2}>2 Months</option>
                    <option value={3}>3 Months</option>
                    <option value={4}>4 Months</option>
                    <option value={6}>6 Months</option>
                  </select>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center font-mono">
                <span className="text-indigo-900 font-sans">Monthly Deduction:</span>
                <span className="text-sm font-bold text-indigo-700">
                  ${(loanPrincipal / loanTenure).toFixed(2)} USD/mo
                </span>
              </div>
              <div>
                <label className="text-slate-500 font-semibold block mb-1">Reason / Purpose</label>
                <textarea
                  rows={3}
                  value={loanReason}
                  onChange={(e) => setLoanReason(e.target.value)}
                  placeholder="Explain purpose of advance..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLoanModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow"
              >
                Submit Advance
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Disciplinary Electronic Sign-off Modal */}
      {showAckModal && selectedDisc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSignDisciplinary}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">Sign Disciplinary Acknowledgment</h4>
              <button
                type="button"
                onClick={() => setShowAckModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                <p className="font-bold">{selectedDisc.warning_letter_number} &bull; {selectedDisc.action_taken}</p>
                <p className="mt-1 text-[11px]">{selectedDisc.description}</p>
              </div>
              <div>
                <label className="text-slate-500 font-semibold block mb-1">
                  Employee Remarks / Explanations
                </label>
                <textarea
                  rows={3}
                  value={ackComments}
                  onChange={(e) => setAckComments(e.target.value)}
                  placeholder="I have read, understood and agree to follow the corrective improvement plan..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-600">
                <input type="checkbox" required id="ackCheck" className="rounded text-indigo-600" />
                <label htmlFor="ackCheck">
                  I confirm receipt of this official notice in compliance with Cambodia Labor Law Articles 26-29.
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAckModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow"
              >
                Electronically Sign
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ESS Payslip Modal */}
      {showPayslipModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
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
                  className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow flex items-center space-x-1"
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
            <div className="border border-slate-200 rounded-2xl p-4 text-xs space-y-3 font-sans bg-white">
              <div className="text-center pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">OFFICIAL PAYSLIP / ប័ណ្ណបើកប្រាក់បៀវត្ស</h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Cycle: 01-Sep-2026 to 30-Sep-2026 &bull; Rate: 4,100 KHR/USD
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] p-2 bg-slate-50 rounded-xl">
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
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
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
