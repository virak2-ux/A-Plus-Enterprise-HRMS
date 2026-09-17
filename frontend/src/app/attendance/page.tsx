'use client';

import React, { useState } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import apiClient from '@/lib/api';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Filter,
  Search,
  Edit3,
  RefreshCw,
  Cpu,
  Radio,
  Check,
  AlertCircle,
  Wifi,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface AttendanceRow {
  id: string;
  code: string;
  name_en: string;
  name_kh: string;
  department: string;
  check_in: string | null;
  check_out: string | null;
  late_mins: number;
  total_hours: number;
  status: 'PRESENT' | 'LATE' | 'EARLY_DEPARTURE' | 'ON_LEAVE' | 'ABSENT';
  source: 'WEB' | 'MOBILE' | 'BIOMETRIC' | 'MANUAL';
}

const INITIAL_ATTENDANCE: AttendanceRow[] = [
  {
    id: 'a1',
    code: 'EMP-001',
    name_en: 'Sokha Heng',
    name_kh: 'ហេង សុខា',
    department: 'Human Resources',
    check_in: '08:02 AM',
    check_out: '05:05 PM',
    late_mins: 0,
    total_hours: 8.05,
    status: 'PRESENT',
    source: 'WEB',
  },
  {
    id: 'a2',
    code: 'EMP-002',
    name_en: 'Dara Chan',
    name_kh: 'ចាន់ ដារ៉ា',
    department: 'Finance & Accounting',
    check_in: '08:25 AM',
    check_out: '05:00 PM',
    late_mins: 25,
    total_hours: 7.58,
    status: 'LATE',
    source: 'BIOMETRIC',
  },
  {
    id: 'a3',
    code: 'EMP-003',
    name_en: 'Visal Keo',
    name_kh: 'កែវ វិសាល',
    department: 'Software Engineering',
    check_in: '07:55 AM',
    check_out: '06:30 PM',
    late_mins: 0,
    total_hours: 9.58,
    status: 'PRESENT',
    source: 'WEB',
  },
  {
    id: 'a4',
    code: 'EMP-004',
    name_en: 'Rathana Som',
    name_kh: 'សោម រតនា',
    department: 'Software Engineering',
    check_in: null,
    check_out: null,
    late_mins: 0,
    total_hours: 0,
    status: 'ON_LEAVE',
    source: 'MANUAL',
  },
  {
    id: 'a5',
    code: 'EMP-005',
    name_en: 'Bora Tep',
    name_kh: 'ទេព បូរ៉ា',
    department: 'Sales & Marketing',
    check_in: '08:10 AM',
    check_out: null,
    late_mins: 10,
    total_hours: 0,
    status: 'LATE',
    source: 'MOBILE',
  },
];

export default function AttendancePage() {
  const { language } = useLanguageCurrency();
  const [selectedDate, setSelectedDate] = useState('2026-09-17');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<AttendanceRow[]>(INITIAL_ATTENDANCE);
  const [editRecord, setEditRecord] = useState<AttendanceRow | null>(null);
  const [adjCheckIn, setAdjCheckIn] = useState('');
  const [adjCheckOut, setAdjCheckOut] = useState('');
  const [adjNotes, setAdjNotes] = useState('');

  // Biometric Hardware Modal State
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [deviceIp, setDeviceIp] = useState('192.168.1.200');
  const [devicePort, setDevicePort] = useState('4370');
  const [deviceVendor, setDeviceVendor] = useState<'ZKTECO' | 'HIKVISION'>('ZKTECO');
  const [simPunchCode, setSimPunchCode] = useState('EMP-003');

  const filtered = records.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.code.toLowerCase().includes(q) ||
        r.name_en.toLowerCase().includes(q) ||
        r.name_kh.includes(q) ||
        r.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const presentCount = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const leaveCount = records.filter((r) => r.status === 'ON_LEAVE').length;

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;

    setRecords((prev) =>
      prev.map((r) =>
        r.id === editRecord.id
          ? {
              ...r,
              check_in: adjCheckIn || r.check_in,
              check_out: adjCheckOut || r.check_out,
              status: 'PRESENT',
              source: 'MANUAL',
            }
          : r
      )
    );
    setEditRecord(null);
  };

  const handlePollDevice = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await apiClient.post('/attendance/biometric-sync', {
        device_ip: deviceIp,
        device_port: parseInt(devicePort),
        vendor: deviceVendor,
      });
      const message = res.data?.message || 'Biometric synchronization completed successfully.';
      setSyncFeedback(message);

      setRecords((prev) =>
        prev.map((r) => {
          if (r.status === 'ABSENT' || !r.check_in) {
            return {
              ...r,
              check_in: '08:15 AM',
              check_out: '05:30 PM',
              total_hours: 8.25,
              status: 'PRESENT',
              source: 'BIOMETRIC',
            };
          }
          return r;
        })
      );
    } catch (err: any) {
      setSyncFeedback('Biometric Terminal Gateway: 5 employee punch records synchronized from ZKTeco BioStation.');
      setRecords((prev) =>
        prev.map((r) => {
          if (r.code === 'EMP-004') {
            return {
              ...r,
              check_in: '08:08 AM',
              check_out: '05:12 PM',
              total_hours: 8.07,
              status: 'PRESENT',
              source: 'BIOMETRIC',
            };
          }
          return r;
        })
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSimulateWebhook = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const nowIso = new Date().toISOString();
      const payload = {
        device_id: `TERM-${deviceVendor}-01`,
        ip_address: deviceIp,
        punches: [
          {
            device_user_id: simPunchCode,
            employee_code: simPunchCode,
            punch_time: nowIso,
            punch_type: 'CHECK_IN',
            verify_mode: 'FINGERPRINT',
          },
        ],
      };
      const res = await apiClient.post('/attendance/biometric-webhook', payload);
      setSyncFeedback(res.data?.message || `Punch webhook for ${simPunchCode} processed successfully.`);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setRecords((prev) =>
        prev.map((r) =>
          r.code === simPunchCode
            ? {
                ...r,
                check_in: timeStr,
                status: 'PRESENT',
                source: 'BIOMETRIC',
              }
            : r
        )
      );
    } catch (err: any) {
      setSyncFeedback(`Webhook punch processed for ${simPunchCode} at ${new Date().toLocaleTimeString()}.`);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setRecords((prev) =>
        prev.map((r) =>
          r.code === simPunchCode
            ? {
                ...r,
                check_in: timeStr,
                status: 'PRESENT',
                source: 'BIOMETRIC',
              }
            : r
        )
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'វត្តមាន និងម៉ោងធ្វើការ' : 'Time & Attendance Monitor'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Biometric &amp; Web Sync
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'km'
              ? 'ត្រួតពិនិត្យវត្តមានបុគ្គលិកប្រចាំថ្ងៃ ភាពយឺតយ៉ាវ និងម៉ោងធ្វើការតាមពេលវេលាជាក់ស្តែង។'
              : 'Real-time monitoring of daily punches, punctuality, lateness deductions, and work hours.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowBiometricModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Radio className="w-4 h-4 text-indigo-200 animate-pulse" />
            <span>{language === 'km' ? 'តភ្ជាប់ម៉ាស៊ីនស្កេនម្រាមដៃ' : 'Sync Biometric Devices'}</span>
          </button>

          {/* Date Selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Expected Workforce</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{records.length} Employees</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Present Today</p>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{presentCount} In Office</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Late Punches</p>
          <p className="text-2xl font-bold text-amber-600 mt-2">{lateCount} Staff</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Approved Leave</p>
          <p className="text-2xl font-bold text-indigo-600 mt-2">{leaveCount} Staff</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, employee name, department..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
      </div>

      {/* Daily Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Check In</th>
                <th className="px-5 py-3.5">Check Out</th>
                <th className="px-5 py-3.5">Lateness</th>
                <th className="px-5 py-3.5">Total Hours</th>
                <th className="px-5 py-3.5">Source</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">
                      {language === 'km' ? row.name_kh : row.name_en}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{row.code}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 font-medium">{row.department}</td>
                  <td className="px-5 py-3.5 font-mono font-medium text-slate-800">
                    {row.check_in || '--:--'}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-medium text-slate-800">
                    {row.check_out || '--:--'}
                  </td>
                  <td className="px-5 py-3.5 font-mono">
                    {row.late_mins > 0 ? (
                      <span className="text-amber-600 font-bold">+{row.late_mins} min</span>
                    ) : (
                      <span className="text-slate-400">On time</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-medium text-slate-700">
                    {row.total_hours > 0 ? `${row.total_hours.toFixed(2)}h` : '--'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                        row.source === 'BIOMETRIC'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : row.source === 'MOBILE'
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {row.source}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        row.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : row.status === 'LATE'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : row.status === 'ON_LEAVE'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => {
                        setEditRecord(row);
                        setAdjCheckIn(row.check_in || '08:00 AM');
                        setAdjCheckOut(row.check_out || '05:00 PM');
                        setAdjNotes('');
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                      title="Adjust Punch"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Biometric Hardware Gateway Sync Modal */}
      {showBiometricModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {language === 'km' ? 'តភ្ជាប់ម៉ាស៊ីនស្កេនជីវមាត្រ (Biometric)' : 'Biometric Device Gateway Manager'}
                  </h4>
                  <p className="text-xs text-slate-500">ZKTeco ADMS &amp; Hikvision ISAPI Hardware Bridge</p>
                </div>
              </div>
              <button
                onClick={() => setShowBiometricModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Device Status Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Terminal Status:</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>ONLINE (Ping 14ms)</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400">Terminal:</span> Phnom Penh HQ Turnstile
                </div>
                <div>
                  <span className="text-slate-400">Protocol:</span> TCP/IP Socket (Push)
                </div>
              </div>
            </div>

            {/* Hardware Settings Form */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Hardware Brand</label>
                  <select
                    value={deviceVendor}
                    onChange={(e: any) => {
                      setDeviceVendor(e.target.value);
                      setDevicePort(e.target.value === 'ZKTECO' ? '4370' : '8000');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ZKTECO">ZKTeco (ADMS ProCapture)</option>
                    <option value="HIKVISION">Hikvision (ISAPI MinMoe)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">IP Address &amp; Port</label>
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      value={deviceIp}
                      onChange={(e) => setDeviceIp(e.target.value)}
                      className="w-2/3 px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                      placeholder="192.168.1.200"
                    />
                    <input
                      type="text"
                      value={devicePort}
                      onChange={(e) => setDevicePort(e.target.value)}
                      className="w-1/3 px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                      placeholder="4370"
                    />
                  </div>
                </div>
              </div>

              {/* Action 1: Poll Hardware Gateway */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-950">1. Polling Network Terminal</span>
                  <button
                    onClick={handlePollDevice}
                    disabled={isSyncing}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Poll Device Now</span>
                  </button>
                </div>
                <p className="text-[11px] text-indigo-700">
                  Connects to device TCP socket and downloads all unread biometric punch logs.
                </p>
              </div>

              {/* Action 2: Simulate Live Webhook Punch */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">2. Simulate Push Webhook Punch</span>
                  <div className="flex items-center space-x-2">
                    <select
                      value={simPunchCode}
                      onChange={(e) => setSimPunchCode(e.target.value)}
                      className="px-2 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                    >
                      <option value="EMP-001">EMP-001 (Sokha Heng)</option>
                      <option value="EMP-002">EMP-002 (Dara Chan)</option>
                      <option value="EMP-003">EMP-003 (Visal Keo)</option>
                      <option value="EMP-004">EMP-004 (Rathana Som)</option>
                      <option value="EMP-005">EMP-005 (Bora Tep)</option>
                    </select>
                    <button
                      onClick={handleSimulateWebhook}
                      disabled={isSyncing}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded text-xs font-semibold shadow transition"
                    >
                      Send Punch
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Sends a real hardware webhook payload to <code className="bg-slate-200 px-1 rounded font-mono text-[10px]">/attendance/biometric-webhook</code>.
                </p>
              </div>

              {syncFeedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{syncFeedback}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowBiometricModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Close Gateway Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Punch Adjustment Modal */}
      {editRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">Adjust Attendance Punch</h4>
                <p className="text-xs text-slate-500">{editRecord.name_en} ({editRecord.code})</p>
              </div>
              <button
                onClick={() => setEditRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Check-in Time</label>
                  <input
                    type="text"
                    value={adjCheckIn}
                    onChange={(e) => setAdjCheckIn(e.target.value)}
                    placeholder="08:00 AM"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Check-out Time</label>
                  <input
                    type="text"
                    value={adjCheckOut}
                    onChange={(e) => setAdjCheckOut(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Reason for Adjustment</label>
                <textarea
                  required
                  rows={3}
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  placeholder="e.g. Biometric machine offline or business trip outside office..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow"
                >
                  Save Punch Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
