'use client';

import React, { useState } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import {
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Lock,
  Clock,
  User,
  Layers,
} from 'lucide-react';

interface AuditItem {
  id: string;
  user: string;
  role: string;
  action: string;
  module: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  ip_address: string;
  old_values: any;
  new_values: any;
}

const SAMPLE_AUDIT_LOGS: AuditItem[] = [
  {
    id: 'aud-001',
    user: 'admin@cambodia-hrms.com',
    role: 'SUPER_ADMIN',
    action: 'LOCK_PAYROLL',
    module: 'payroll',
    entity_type: 'PayrollRun',
    entity_id: 'pr-sep-2026',
    timestamp: '2026-09-17 06:40:15 UTC',
    ip_address: '127.0.0.1',
    old_values: { status: 'APPROVED' },
    new_values: { status: 'LOCKED', locked_at: '2026-09-17T06:40:15Z' },
  },
  {
    id: 'aud-002',
    user: 'payroll@cambodia-hrms.com',
    role: 'PAYROLL_OFFICER',
    action: 'CALCULATE_PAYROLL',
    module: 'payroll',
    entity_type: 'PayrollRun',
    entity_id: 'pr-sep-2026',
    timestamp: '2026-09-17 06:35:22 UTC',
    ip_address: '192.168.1.45',
    old_values: null,
    new_values: { total_net_khr: '24400900', employees_count: 5, rate: 4100 },
  },
  {
    id: 'aud-003',
    user: 'hrmanager@cambodia-hrms.com',
    role: 'HR_MANAGER',
    action: 'APPROVE_LEAVE',
    module: 'leave',
    entity_type: 'LeaveRequest',
    entity_id: 'lr-002',
    timestamp: '2026-09-17 06:15:00 UTC',
    ip_address: '192.168.1.50',
    old_values: { status: 'PENDING' },
    new_values: { status: 'APPROVED_HR', approved_by: 'hrmanager' },
  },
  {
    id: 'aud-004',
    user: 'hrmanager@cambodia-hrms.com',
    role: 'HR_MANAGER',
    action: 'CREATE',
    module: 'employee',
    entity_type: 'Employee',
    entity_id: 'EMP-005',
    timestamp: '2026-09-17 05:50:10 UTC',
    ip_address: '192.168.1.50',
    old_values: null,
    new_values: { employee_code: 'EMP-005', name_en: 'Bora Tep', salary: '650 USD' },
  },
  {
    id: 'aud-005',
    user: 'admin@cambodia-hrms.com',
    role: 'SUPER_ADMIN',
    action: 'LOGIN',
    module: 'auth',
    entity_type: 'User',
    entity_id: 'usr-admin',
    timestamp: '2026-09-17 05:30:00 UTC',
    ip_address: '127.0.0.1',
    old_values: null,
    new_values: { session_started: true },
  },
];

export default function AuditLogsPage() {
  const { language } = useLanguageCurrency();
  const [logs] = useState<AuditItem[]>(SAMPLE_AUDIT_LOGS);
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [inspectLog, setInspectLog] = useState<AuditItem | null>(null);

  const filtered = logs.filter((item) => {
    if (moduleFilter !== 'ALL' && item.module !== moduleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.user.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.entity_type.toLowerCase().includes(q) ||
        item.entity_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'កំណត់ហេតុសវនកម្មប្រព័ន្ធ' : 'Enterprise Audit Trail & Compliance'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 flex items-center space-x-1">
              <Lock className="w-3 h-3 mr-1" /> Immutable Append-Only
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Every critical action (salary changes, payroll calculations, approvals, status updates) is recorded with full historical diffs.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor, action, record ID..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Modules</option>
            <option value="payroll">Payroll Engine</option>
            <option value="employee">Employee Master</option>
            <option value="leave">Leave Workflows</option>
            <option value="auth">Authentication</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor (User)</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Module</th>
                <th className="px-5 py-3.5">Entity</th>
                <th className="px-5 py-3.5">IP Address</th>
                <th className="px-5 py-3.5 text-center">Diff Inspector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-5 py-3.5 font-sans font-semibold text-slate-900">{log.user}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                      {log.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        log.action.includes('LOCK') || log.action.includes('DELETE')
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : log.action.includes('APPROVE')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : log.action.includes('CALCULATE')
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 uppercase font-sans font-medium">
                    {log.module}
                  </td>
                  <td className="px-5 py-3.5 text-slate-800">
                    {log.entity_type} <span className="text-slate-400">({log.entity_id})</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{log.ip_address}</td>
                  <td className="px-5 py-3.5 text-center font-sans">
                    <button
                      onClick={() => setInspectLog(log)}
                      className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                      title="Inspect Snapshot Changes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot Diff Modal */}
      {inspectLog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Audit Snapshot Diff &bull; {inspectLog.action}
                </h4>
                <p className="text-xs text-slate-400 font-mono">Log ID: {inspectLog.id}</p>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">OPERATING USER</span>
                  <span className="font-semibold text-slate-800">{inspectLog.user}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CLIENT IP ADDRESS</span>
                  <span className="font-semibold text-slate-800">{inspectLog.ip_address}</span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 mb-1">Historical Before / After JSON Diff:</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-lg">
                    <span className="text-rose-700 font-bold block mb-1">Previous Values:</span>
                    <pre className="font-mono text-[10px] text-slate-700 overflow-x-auto whitespace-pre-wrap">
                      {inspectLog.old_values ? JSON.stringify(inspectLog.old_values, null, 2) : 'null (Created)'}
                    </pre>
                  </div>
                  <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                    <span className="text-emerald-700 font-bold block mb-1">Updated Values:</span>
                    <pre className="font-mono text-[10px] text-slate-700 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(inspectLog.new_values, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
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
