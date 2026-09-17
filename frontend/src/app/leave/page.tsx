'use client';

import React, { useState } from 'react';
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
  const { t, language } = useLanguageCurrency();
  const [requests, setRequests] = useState<LeaveRequestItem[]>(INITIAL_REQUESTS);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedType, setSelectedType] = useState('Annual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'ការសុំច្បាប់ឈប់សម្រាក' : 'Leave Management & Balances'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Cambodia Labor Law Art. 166
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'km'
              ? 'ការគ្រប់គ្រងច្បាប់សម្រាកប្រចាំឆ្នាំ (១៨ថ្ងៃ) ច្បាប់ឈឺ និងការអនុម័តច្បាប់ដោយផ្ទាល់។'
              : 'Statutory annual leave (1.5 days/month = 18 days/yr), sick leave, and approval workflows.'}
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'km' ? 'ដាក់ពាក្យសុំច្បាប់' : 'Request Leave'}</span>
        </button>
      </div>

      {/* Statutory Leave Entitlement Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase">
            <span>Annual Leave (ច្បាប់ប្រចាំឆ្នាំ)</span>
            <span className="text-emerald-600 font-bold">18 Days/Yr</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">14.0</p>
            <span className="text-xs text-slate-500 font-medium">Days Remaining</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '77%' }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase">
            <span>Sick Leave (ច្បាប់ឈឺ)</span>
            <span className="text-amber-600 font-bold">Paid Scheme</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">29.0</p>
            <span className="text-xs text-slate-500 font-medium">Days Remaining</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '96%' }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase">
            <span>Special Leave (ច្បាប់ពិសេស)</span>
            <span className="text-indigo-600 font-bold">Family Events</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">5.0</p>
            <span className="text-xs text-slate-500 font-medium">Days Allocated</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase">
            <span>Maternity Leave (មាតុភាព)</span>
            <span className="text-rose-600 font-bold">90 Days</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">90.0</p>
            <span className="text-xs text-slate-500 font-medium">Labor Law Art. 182</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
            <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Leave Requests &amp; Approvals</h3>
          <span className="text-xs text-slate-500 font-medium">
            {requests.filter((r) => r.status === 'PENDING').length} Pending HR Review
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Leave Type</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5">Days</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">
                      {language === 'km' ? req.name_kh : req.name_en}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{req.code}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-slate-800">{req.leave_type}</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">
                    {req.start_date} → {req.end_date}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-slate-900">{req.days} Day{req.days > 1 ? 's' : ''}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate" title={req.reason}>
                    {req.reason}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        req.status === 'APPROVED_HR'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : req.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {req.status === 'APPROVED_HR'
                        ? 'Approved'
                        : req.status === 'PENDING'
                        ? 'Pending'
                        : 'Rejected'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {req.status === 'PENDING' ? (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold shadow-sm transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded text-[11px] font-semibold transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900">Request Time Off</h4>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Leave Category</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Annual Leave">Annual Leave (ច្បាប់ប្រចាំឆ្នាំ)</option>
                  <option value="Sick Leave">Sick Leave (ច្បាប់ឈឺ)</option>
                  <option value="Special Leave">Special Leave (ច្បាប់ពិសេស)</option>
                  <option value="Maternity Leave">Maternity Leave (មាតុភាព)</option>
                  <option value="Unpaid Leave">Unpaid Leave (គ្មានប្រាក់ឈ្នួល)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Reason / Justification</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain reason for leave request..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
