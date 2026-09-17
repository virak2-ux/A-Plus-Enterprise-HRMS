'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Shield,
  Search,
  Filter,
  Users,
  Timer,
  Moon,
  Sun,
  Award,
} from 'lucide-react';

interface OvertimeRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  total_hours: number;
  day_type: string;
  multiplier_rate: number;
  payable_hours: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  payroll_status: 'UNPROCESSED' | 'PROCESSED';
  created_at: string;
}

interface EmployeeOption {
  id: string;
  employee_code: string;
  first_name_en: string;
  last_name_en: string;
  first_name_kh: string;
  last_name_kh: string;
  base_salary: number;
  salary_currency: string;
}

export default function OvertimePage() {
  const { language, formatMoney, exchangeRate } = useLanguageCurrency();
  const [requests, setRequests] = useState<OvertimeRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [otDate, setOtDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [totalHours, setTotalHours] = useState('2.0');
  const [dayType, setDayType] = useState('NORMAL_DAY');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Status message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchOvertime = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/overtime', { headers });
      if (res.ok) {
        const json = await res.json();
        setRequests(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching overtime:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/employees', { headers });
      if (res.ok) {
        const json = await res.json();
        setEmployees(json.data || []);
        if (json.data?.length > 0) {
          setSelectedEmployeeId(json.data[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching employees:', e);
    }
  };

  useEffect(() => {
    fetchOvertime();
    fetchEmployees();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/overtime/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: language === 'km' ? `បានកែប្រែស្ថានភាពទៅ ${newStatus}` : `Status updated to ${newStatus}`,
        });
        fetchOvertime();
      } else {
        const err = await res.json();
        setFeedback({ type: 'error', message: err.detail || 'Action failed' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/overtime/batch-approve', {
        method: 'POST',
        headers,
        body: JSON.stringify({ request_ids: selectedIds, status: 'APPROVED' }),
      });
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: language === 'km' ? `បានអនុម័តសំណើចំនួន ${selectedIds.length} ដោយជោគជ័យ` : `Successfully approved ${selectedIds.length} requests`,
        });
        setSelectedIds([]);
        fetchOvertime();
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const startDateTime = `${otDate}T${startTime}:00Z`;
      const endDateTime = `${otDate}T${endTime}:00Z`;
      const res = await fetch('http://127.0.0.1:8000/api/v1/overtime', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employee_id: selectedEmployeeId,
          date: otDate,
          start_time: startDateTime,
          end_time: endDateTime,
          total_hours: parseFloat(totalHours) || 1.0,
          day_type: dayType,
          reason,
        }),
      });

      if (res.ok) {
        setFeedback({
          type: 'success',
          message: language === 'km' ? 'បានដាក់ស្នើសំណើថែមម៉ោងដោយជោគជ័យ' : 'Overtime request submitted successfully',
        });
        setShowModal(false);
        setReason('');
        fetchOvertime();
      } else {
        const err = await res.json();
        setFeedback({ type: 'error', message: err.detail || 'Submission failed' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    } finally {
      setSubmitting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Filtered requests
  const filtered = requests.filter((r) => {
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'PROCESSED' ? r.payroll_status === 'PROCESSED' : r.status === filterStatus);
    const matchesQuery =
      r.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  // Calculate estimated multiplier
  const multiplierPreview =
    dayType === 'WEEKLY_REST_DAY' || dayType === 'PUBLIC_HOLIDAY' || dayType === 'NIGHT_SHIFT' ? 2.0 : 1.5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'ការគ្រប់គ្រងថែមម៉ោង & វេនការងារ' : 'Overtime & Shift Management'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Art. 139 Compliant
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'km'
              ? 'ត្រួតពិនិត្យ និងអនុម័តម៉ោងបន្ថែមតាមច្បាប់ការងារកម្ពុជា (១៥០% ថ្ងៃធម្មតា, ២០០% វេនយប់/ថ្ងៃឈប់សម្រាក) និងបញ្ចូលទៅក្នុងប្រាក់ខែដោយស្វ័យប្រវត្តិ។'
              : 'Record, monitor and approve overtime per Cambodia Labor Law (150% normal day, 200% night/rest day/holiday) with automated payroll ingestion.'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'km' ? 'ស្នើសុំថែមម៉ោង' : 'Request Overtime'}</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Cambodia Labor Law Article 139 Reference Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {language === 'km' ? 'ថ្ងៃធ្វើការធម្មតា' : 'Normal Working Day'}
              </h4>
            </div>
            <p className="text-2xl font-black text-blue-600 mt-1">150% (1.5x)</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Labor Law Art. 139 &para;1</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {language === 'km' ? 'វេនយប់ (២២:០០ - ០៦:០០)' : 'Night Shift Overtime'}
              </h4>
            </div>
            <p className="text-2xl font-black text-purple-600 mt-1">200% (2.0x)</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Labor Law Art. 139 &para;2</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {language === 'km' ? 'ថ្ងៃឈប់ប្រចាំសប្តាហ៍' : 'Weekly Rest Day'}
              </h4>
            </div>
            <p className="text-2xl font-black text-amber-600 mt-1">200% (2.0x)</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Sunday Mandate (Art. 139 &para;3)</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {language === 'km' ? 'បុណ្យជាតិមានប្រាក់ឈ្នួល' : 'Paid Public Holiday'}
              </h4>
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-1">200% (2.0x)</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Prakas 443 & Holiday Decree</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, Batch Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterStatus === st ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL'
                ? language === 'km' ? 'ទាំងអស់' : 'All Requests'
                : st === 'PENDING'
                ? language === 'km' ? 'រង់ចាំ' : 'Pending'
                : st === 'APPROVED'
                ? language === 'km' ? 'បានអនុម័ត' : 'Approved'
                : st === 'REJECTED'
                ? language === 'km' ? 'បានបដិសេធ' : 'Rejected'
                : language === 'km' ? 'បានបញ្ចូលប្រាក់ខែ' : 'Payroll Processed'}
            </button>
          ))}
        </div>

        {/* Search & Batch Action */}
        <div className="flex items-center space-x-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchApprove}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{language === 'km' ? `អនុម័ត (${selectedIds.length})` : `Approve Selected (${selectedIds.length})`}</span>
            </button>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={language === 'km' ? 'ស្វែងរកបុគ្គលិក, មូលហេតុ...' : 'Search employee, reason...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-52"
            />
          </div>
        </div>
      </div>

      {/* Overtime Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3.5 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filtered.filter(r => r.status === 'PENDING').length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filtered.filter(r => r.status === 'PENDING').map(r => r.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">{language === 'km' ? 'បុគ្គលិក' : 'Employee'}</th>
                <th className="p-3.5">{language === 'km' ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                <th className="p-3.5">{language === 'km' ? 'ប្រភេទថ្ងៃ' : 'Day Type'}</th>
                <th className="p-3.5 text-center">{language === 'km' ? 'ម៉ោងសរុប' : 'Hours'}</th>
                <th className="p-3.5 text-center">{language === 'km' ? 'មេគុណ' : 'Rate'}</th>
                <th className="p-3.5 text-center">{language === 'km' ? 'ម៉ោងគិតលុយ' : 'Payable Hours'}</th>
                <th className="p-3.5">{language === 'km' ? 'មូលហេតុ' : 'Reason'}</th>
                <th className="p-3.5">{language === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="p-3.5">{language === 'km' ? 'ប្រាក់ខែ' : 'Payroll Status'}</th>
                <th className="p-3.5 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 font-medium">
                    {language === 'km' ? 'កំពុងទាញយកទិន្នន័យ...' : 'Loading overtime records...'}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 font-medium">
                    {language === 'km' ? 'គ្មានកំណត់ត្រាថែមម៉ោងទេ' : 'No overtime requests found matching your filter.'}
                  </td>
                </tr>
              ) : (
                filtered.map((ot) => {
                  const isPending = ot.status === 'PENDING';
                  return (
                    <tr key={ot.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5">
                        {isPending ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(ot.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds([...selectedIds, ot.id]);
                              } else {
                                setSelectedIds(selectedIds.filter((id) => id !== ot.id));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        ) : null}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{ot.employee_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{ot.employee_code}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">{ot.date}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ot.day_type === 'NORMAL_DAY'
                              ? 'bg-blue-50 text-blue-700'
                              : ot.day_type === 'NIGHT_SHIFT'
                              ? 'bg-purple-50 text-purple-700'
                              : ot.day_type === 'WEEKLY_REST_DAY'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {ot.day_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-700">{ot.total_hours}h</td>
                      <td className="p-3.5 text-center font-black text-indigo-600">{ot.multiplier_rate}x</td>
                      <td className="p-3.5 text-center font-black text-slate-900 bg-slate-50/50">
                        {ot.payable_hours}h
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate" title={ot.reason}>
                        {ot.reason}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ot.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ot.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ot.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            ot.payroll_status === 'PROCESSED'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ot.payroll_status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleStatusUpdate(ot.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition"
                            >
                              {language === 'km' ? 'អនុម័ត' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(ot.id, 'REJECTED')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-semibold transition"
                            >
                              {language === 'km' ? 'បដិសេធ' : 'Reject'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {language === 'km' ? 'បានសម្រេចរួច' : 'Settled'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Overtime Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'km' ? 'ស្នើសុំការថែមម៉ោងថ្មី' : 'Submit Overtime Request'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'ជ្រើសរើសបុគ្គលិក' : 'Employee'} *
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.employee_code} - {e.first_name_en} {e.last_name_en} ({e.salary_currency} {e.base_salary})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'កាលបរិច្ឆេទ' : 'Overtime Date'} *
                  </label>
                  <input
                    type="date"
                    value={otDate}
                    onChange={(e) => setOtDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ប្រភេទថ្ងៃថែមម៉ោង' : 'Overtime Day Type'} *
                  </label>
                  <select
                    value={dayType}
                    onChange={(e) => setDayType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                  >
                    <option value="NORMAL_DAY">Normal Day (1.5x - 150%)</option>
                    <option value="NIGHT_SHIFT">Night Shift (2.0x - 200%)</option>
                    <option value="WEEKLY_REST_DAY">Weekly Rest Day / Sunday (2.0x - 200%)</option>
                    <option value="PUBLIC_HOLIDAY">Paid Public Holiday (2.0x - 200%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ម៉ោងចាប់ផ្តើម' : 'Start Time'}
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ម៉ោងបញ្ចប់' : 'End Time'}
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ចំនួនម៉ោង' : 'Total Hours'} *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={totalHours}
                    onChange={(e) => setTotalHours(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>
              </div>

              {/* Pay Preview Card */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Statutory Multiplier (Art. 139):</span>
                  <span className="font-black text-indigo-700">{multiplierPreview}x</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Total Paid Equivalency:</span>
                  <span className="font-bold text-slate-900">
                    {(parseFloat(totalHours) || 0) * multiplierPreview} paid hours
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'មូលហេតុការងារចាំបាច់' : 'Business Justification'} *
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={language === 'km' ? 'បញ្ជាក់ពីមូលហេតុ និងភារកិច្ចដែលត្រូវធ្វើ...' : 'State the business reason and tasks accomplished...'}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition disabled:opacity-50"
                >
                  {submitting
                    ? language === 'km' ? 'កំពុងដាក់ស្នើ...' : 'Submitting...'
                    : language === 'km' ? 'ដាក់ស្នើសំណើ' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
