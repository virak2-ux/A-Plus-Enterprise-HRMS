'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import {
  CalendarCheck,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertCircle,
  FileText,
  User,
  Calculator,
  Award,
  Sparkles,
  DollarSign,
} from 'lucide-react';

interface LeaveRequestItem {
  id: string;
  code: string;
  name_en: string;
  name_kh: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED_HR' | 'REJECTED';
}

interface PublicHoliday {
  date: string;
  name_kh: string;
  name_en: string;
  days: number;
}

const INITIAL_REQUESTS: LeaveRequestItem[] = [
  {
    id: 'lr-1',
    code: 'EMP-003',
    name_en: 'Visal Keo',
    name_kh: 'កែវ វិសាល',
    leave_type: 'Annual Leave',
    start_date: '2026-09-21',
    end_date: '2026-09-22',
    days: 2,
    reason: 'Family urgent ceremony in Siem Reap province.',
    status: 'PENDING',
  },
  {
    id: 'lr-2',
    code: 'EMP-004',
    name_en: 'Rathana Som',
    name_kh: 'សោម រតនា',
    leave_type: 'Sick Leave',
    start_date: '2026-09-17',
    end_date: '2026-09-17',
    days: 1,
    reason: 'Medical appointment with doctor certificate.',
    status: 'APPROVED_HR',
  },
  {
    id: 'lr-3',
    code: 'EMP-005',
    name_en: 'Bora Tep',
    name_kh: 'ទេព បូរ៉ា',
    leave_type: 'Special Leave',
    start_date: '2026-09-25',
    end_date: '2026-09-26',
    days: 2,
    reason: 'Personal wedding ceremony attendance.',
    status: 'PENDING',
  },
];

export default function LeavePage() {
  const { t, language, formatMoney, exchangeRate } = useLanguageCurrency();
  const [requests, setRequests] = useState<LeaveRequestItem[]>(INITIAL_REQUESTS);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showEncashModal, setShowEncashModal] = useState(false);

  // Form states
  const [selectedType, setSelectedType] = useState('Annual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Encashment Preview States
  const [encashBaseSalary, setEncashBaseSalary] = useState(800);
  const [encashDays, setEncashDays] = useState(6.0);

  const token = typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/leave/public-holidays', { headers });
        if (res.ok) {
          const json = await res.json();
          setHolidays(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load holidays:', err);
      }
    };

    const fetchRequests = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/leave/requests', { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            const mapped: LeaveRequestItem[] = json.data.map((r: any) => ({
              id: r.id,
              code: r.employee_code,
              name_en: r.employee_name,
              name_kh: r.employee_name_kh,
              leave_type: r.leave_type_name_en,
              start_date: r.start_date,
              end_date: r.end_date,
              days: r.total_days,
              reason: r.reason,
              status: r.status,
            }));
            setRequests(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to load requests:', err);
      }
    };

    fetchHolidays();
    fetchRequests();
  }, []);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

    const newReq: LeaveRequestItem = {
      id: `lr-${Date.now()}`,
      code: 'EMP-001',
      name_en: 'Sokha Heng',
      name_kh: 'ហេង សុខា',
      leave_type: selectedType,
      start_date: startDate,
      end_date: endDate,
      days: diffDays,
      reason,
      status: 'PENDING',
    };

    setRequests([newReq, ...requests]);
    setShowApplyModal(false);
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const handleApprove = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED_HR' } : r))
    );
  };

  const handleReject = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED' } : r))
    );
  };

  // Encashment math: Daily wage = Base Salary / 26 days per Article 167
  const encashDailyWageUsd = encashBaseSalary / 26;
  const encashTotalUsd = encashDailyWageUsd * encashDays;
  const encashTotalKhr = encashTotalUsd * exchangeRate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'ការសុំច្បាប់ & ការគ្រប់គ្រងច្បាប់សម្រាក' : 'Leave Management & Statutory Entitlements'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Labor Law Art. 166 &amp; 167
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'km'
              ? 'ច្បាប់ឈប់សម្រាកប្រចាំឆ្នាំ (១៨ថ្ងៃ + ១ថ្ងៃរៀងរាល់៣ឆ្នាំអតីតភាព) ការទូទាត់ប្រាក់សំណងច្បាប់ដែលនៅសល់ និងថ្ងៃបុណ្យជាតិ (ប្រកាស ៤៤៣)។'
              : 'Statutory annual leave (18 days base + 1 day per 3 years seniority), unused leave encashment, and Cambodia public holidays.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowEncashModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Calculator className="w-4 h-4" />
            <span>{language === 'km' ? 'គណនាសំណងច្បាប់ (Art. 167)' : 'Encashment Calculator'}</span>
          </button>

          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'km' ? 'ដាក់ពាក្យសុំច្បាប់' : 'Request Leave'}</span>
          </button>
        </div>
      </div>

      {/* Statutory Leave Entitlement Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 uppercase">
            <span>Annual (ច្បាប់ប្រចាំឆ្នាំ)</span>
            <span className="text-emerald-600 font-bold">18 Days</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">14.0</p>
            <span className="text-xs text-slate-500 font-medium">Remaining</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">1.5 days/month (Art. 166)</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-sm">
          <div className="flex justify-between items-center text-[11px] font-bold text-indigo-700 uppercase">
            <span>Seniority Bonus (អតីតភាព)</span>
            <span className="text-indigo-600 font-bold">+1d / 3yrs</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-black text-indigo-700">+2.0</p>
            <span className="text-xs text-indigo-600 font-bold">6+ Yrs Service</span>
          </div>
          <p className="text-[10px] text-indigo-600/80 mt-2">Labor Law Art. 166 &para;2</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 uppercase">
            <span>Sick Leave (ច្បាប់ឈឺ)</span>
            <span className="text-amber-600 font-bold">Paid</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">29.0</p>
            <span className="text-xs text-slate-500 font-medium">Days Left</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Medical Cert Required</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 uppercase">
            <span>Special (ច្បាប់ពិសេស)</span>
            <span className="text-slate-600 font-bold">Family</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">5.0</p>
            <span className="text-xs text-slate-500 font-medium">Allocated</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Wedding / Bereavement</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 uppercase">
            <span>Maternity (មាតុភាព)</span>
            <span className="text-rose-600 font-bold">90 Days</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">90.0</p>
            <span className="text-xs text-slate-500 font-medium">Days</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Labor Law Art. 182</p>
        </div>
      </div>

      {/* Main Grid: Leave Requests Table + Public Holiday Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Leave Requests Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'km' ? 'ពាក្យស្នើសុំច្បាប់សម្រាក' : 'Leave Requests & Approvals'}
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {requests.filter((r) => r.status === 'PENDING').length} Pending Review
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Leave Type</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3 text-center">Days</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {language === 'km' ? req.name_kh : req.name_en}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{req.code}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{req.leave_type}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                        {req.start_date} → {req.end_date}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-slate-900">{req.days}d</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            req.status === 'APPROVED_HR'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : req.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-xs transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded text-[10px] font-bold transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Cambodia Official Public Holidays Schedule */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {language === 'km' ? 'បុណ្យជាតិផ្លូវការ (ប្រកាស ៤៤៣)' : 'Statutory Holidays (Prakas 443)'}
              </h3>
            </div>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
              2026
            </span>
          </div>

          <div className="overflow-y-auto max-h-[380px] space-y-2 pr-1">
            {holidays.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Loading holidays schedule...</p>
            ) : (
              holidays.map((h, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-100 text-xs flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-bold text-slate-800">
                      {language === 'km' ? h.name_kh : h.name_en}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{h.date}</div>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded shrink-0">
                    {h.days} Day Paid
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Leave Encashment Calculator Modal */}
      {showEncashModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'km' ? 'គណនាសំណងច្បាប់ដែលនៅសល់' : 'Unused Leave Encashment Calculator'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Cambodia Labor Law Article 167</p>
                </div>
              </div>
              <button
                onClick={() => setShowEncashModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Monthly Base Salary (USD)
                  </label>
                  <input
                    type="number"
                    value={encashBaseSalary}
                    onChange={(e) => setEncashBaseSalary(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Unused Leave (Days)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={encashDays}
                    onChange={(e) => setEncashDays(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>
              </div>

              {/* Formula explanation */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Standard Working Days:</span>
                  <span className="font-bold text-slate-800">26 Days / Month</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Wage Rate:</span>
                  <span className="font-bold text-slate-800">${encashDailyWageUsd.toFixed(2)} / Day</span>
                </div>
                <div className="flex justify-between">
                  <span>Exchange Rate:</span>
                  <span className="font-bold text-slate-800">{exchangeRate} KHR / USD</span>
                </div>
              </div>

              {/* Calculated Result Box */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                <p className="text-xs font-semibold text-emerald-800">
                  {language === 'km' ? 'ប្រាក់សំណងច្បាប់ត្រូវទូទាត់សរុប' : 'Total Statutory Encashment Payout'}
                </p>
                <p className="text-2xl font-black text-emerald-700">
                  ${encashTotalUsd.toFixed(2)} USD
                </p>
                <p className="text-xs font-bold text-emerald-800/80">
                  ≈ {formatMoney(encashTotalKhr)}
                </p>
              </div>

              <div className="text-[10px] text-slate-500 italic">
                * Under Article 167, annual leave cannot be replaced by compensatory indemnity except in cases of employment contract expiration or termination.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowEncashModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900">Request Time Off</h4>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                >
                  <option value="Annual Leave">Annual Leave (ច្បាប់ប្រចាំឆ្នាំ)</option>
                  <option value="Sick Leave">Sick Leave (ច្បាប់ឈឺ)</option>
                  <option value="Special Leave">Special Leave (ច្បាប់ពិសេស)</option>
                  <option value="Maternity Leave">Maternity Leave (ច្បាប់មាតុភាព)</option>
                  <option value="Unpaid Leave">Unpaid Leave (ច្បាប់គ្មានប្រាក់ឈ្នួល)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Handover Notes</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder="Provide brief details on your leave purpose..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
