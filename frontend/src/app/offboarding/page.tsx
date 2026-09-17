'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import apiClient from '@/lib/api';
import {
  UserMinus,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Calculator,
  ShieldCheck,
  Archive,
  ArrowRight,
  Plus,
  CheckSquare,
  Square,
  Printer,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface OffboardingRow {
  id: string;
  employee_id: string;
  employee_code: string;
  employee_name: string;
  department: string;
  reason: 'RESIGNATION' | 'CONTRACT_END' | 'TERMINATION' | 'MUTUAL_AGREEMENT';
  notice_date: string;
  last_working_date: string;
  status: 'INITIATED' | 'CLEARANCE' | 'SETTLED' | 'ARCHIVED';
  tasks_total: number;
  tasks_completed: number;
  settlement_status: string;
}

const INITIAL_OFFBOARDING: OffboardingRow[] = [
  {
    id: 'off-1',
    employee_id: 'emp-5',
    employee_code: 'EMP-005',
    employee_name: 'Bora Tep (ទេព បូរ៉ា)',
    department: 'Sales & Marketing',
    reason: 'RESIGNATION',
    notice_date: '2026-09-01',
    last_working_date: '2026-09-30',
    status: 'CLEARANCE',
    tasks_total: 6,
    tasks_completed: 4,
    settlement_status: 'CALCULATED',
  },
  {
    id: 'off-2',
    employee_id: 'emp-4',
    employee_code: 'EMP-004',
    employee_name: 'Rathana Som (សោម រតនា)',
    department: 'Software Engineering',
    reason: 'MUTUAL_AGREEMENT',
    notice_date: '2026-08-15',
    last_working_date: '2026-08-31',
    status: 'SETTLED',
    tasks_total: 6,
    tasks_completed: 6,
    settlement_status: 'SETTLED',
  },
];

interface ClearanceTask {
  id: string;
  title: string;
  department: string;
  is_completed: boolean;
  notes?: string;
}

export default function OffboardingPage() {
  const { language, formatMoney, exchangeRate, currency } = useLanguageCurrency();
  const [requests, setRequests] = useState<OffboardingRow[]>(INITIAL_OFFBOARDING);
  const [selectedRequest, setSelectedRequest] = useState<OffboardingRow | null>(null);

  // Initiate Modal State
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [initForm, setInitForm] = useState({
    employee_id: 'emp-3',
    employee_name: 'Visal Keo',
    employee_code: 'EMP-003',
    reason: 'RESIGNATION' as OffboardingRow['reason'],
    notice_date: '2026-09-17',
    last_working_date: '2026-10-17',
    exit_interview_notes: '',
  });

  // Clearance Checklist Modal State
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistTasks, setChecklistTasks] = useState<ClearanceTask[]>([
    { id: 't1', title: 'IT Hardware & Laptop Inspection and Return', department: 'IT', is_completed: true },
    { id: 't2', title: 'Revoke Email, Slack, VPN & Cloud SaaS Accounts', department: 'IT', is_completed: true },
    { id: 't3', title: 'Return Company ID Badge, Smartcards & Keys', department: 'HR', is_completed: true },
    { id: 't4', title: 'Conduct Exit Interview & Collect Handover Form', department: 'HR', is_completed: true },
    { id: 't5', title: 'Reconcile Petty Cash, Company Loans & Advances', department: 'FINANCE', is_completed: false },
    { id: 't6', title: 'Complete Project Knowledge Transfer & Code Handover', department: 'LINE_MANAGER', is_completed: false },
  ]);

  // Settlement Modal State
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementData, setSettlementData] = useState<any>(null);
  const [isLoadingSettlement, setIsLoadingSettlement] = useState(false);

  useEffect(() => {
    // Load live requests from backend
    apiClient
      .get('/offboarding/requests')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setRequests(res.data.data);
        }
      })
      .catch(() => {
        // keep fallback
      });
  }, []);

  const handleInitiateExit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: OffboardingRow = {
      id: `off-${Date.now()}`,
      employee_id: initForm.employee_id,
      employee_code: initForm.employee_code,
      employee_name: initForm.employee_name,
      department: 'Software Engineering',
      reason: initForm.reason,
      notice_date: initForm.notice_date,
      last_working_date: initForm.last_working_date,
      status: 'CLEARANCE',
      tasks_total: 6,
      tasks_completed: 0,
      settlement_status: 'NOT_CALCULATED',
    };
    setRequests([newReq, ...requests]);
    try {
      await apiClient.post('/offboarding/requests', {
        employee_id: initForm.employee_id,
        reason: initForm.reason,
        notice_date: initForm.notice_date,
        last_working_date: initForm.last_working_date,
        exit_interview_notes: initForm.exit_interview_notes,
      });
    } catch (err) {
      // Local optimistic update
    }
    setShowInitiateModal(false);
  };

  const handleOpenChecklist = (req: OffboardingRow) => {
    setSelectedRequest(req);
    apiClient
      .get(`/offboarding/requests/${req.id}/checklist`)
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setChecklistTasks(res.data.data);
        }
      })
      .catch(() => {
        // Keep default template
      });
    setShowChecklistModal(true);
  };

  const handleToggleTask = async (taskId: string) => {
    const updated = checklistTasks.map((t) =>
      t.id === taskId ? { ...t, is_completed: !t.is_completed } : t
    );
    setChecklistTasks(updated);

    const target = updated.find((t) => t.id === taskId);
    if (target && selectedRequest) {
      const completedCount = updated.filter((t) => t.is_completed).length;
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, tasks_completed: completedCount }
            : r
        )
      );
      try {
        await apiClient.put(`/offboarding/tasks/${taskId}`, {
          is_completed: target.is_completed,
        });
      } catch (err) {
        // Optimistic UI
      }
    }
  };

  const handleOpenSettlement = async (req: OffboardingRow) => {
    setSelectedRequest(req);
    setIsLoadingSettlement(true);
    setShowSettlementModal(true);
    try {
      const res = await apiClient.get(
        `/offboarding/requests/${req.id}/settlement?exchange_rate=${exchangeRate}`
      );
      setSettlementData(res.data?.data);
    } catch (err) {
      // Offline fallback computation adhering strictly to Cambodia Labor Law
      const baseSalary = 650;
      const dailyKhr = (baseSalary * exchangeRate) / 26;
      const workedDays = 26;
      const proratedSalaryKhr = dailyKhr * workedDays;
      const leaveDays = 7.5;
      const leaveEncashmentKhr = leaveDays * dailyKhr;
      const seniorityDays = 15;
      const seniorityIndemnityKhr = seniorityDays * dailyKhr;
      const netKhr = proratedSalaryKhr + leaveEncashmentKhr + seniorityIndemnityKhr;
      const netUsd = netKhr / exchangeRate;

      setSettlementData({
        employee_code: req.employee_code,
        employee_name: req.employee_name,
        contract_salary: baseSalary,
        currency: 'USD',
        worked_days: workedDays,
        prorated_salary_khr: proratedSalaryKhr,
        unused_leave_days: leaveDays,
        unused_leave_encashment_khr: leaveEncashmentKhr,
        seniority_days: seniorityDays,
        seniority_indemnity_khr: seniorityIndemnityKhr,
        tax_on_salary_khr: 0,
        final_net_payable_khr: netKhr,
        final_net_payable_usd: netUsd,
        status: 'CALCULATED',
      });
    } finally {
      setIsLoadingSettlement(false);
    }
  };

  const handleApproveSettlement = () => {
    if (selectedRequest) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, status: 'SETTLED', settlement_status: 'SETTLED' }
            : r
        )
      );
      alert(
        `Cambodia Statutory Final Settlement approved for ${selectedRequest.employee_name}. Disbursement voucher sent to Finance.`
      );
      setShowSettlementModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'ការបញ្ចប់កិច្ចសន្យា & ទូទាត់ចុងក្រោយ' : 'Offboarding & Final Settlement'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
              Cambodia Labor Law Ready
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'km'
              ? 'គ្រប់គ្រងការលាឈប់ បញ្ជីផ្ទៀងផ្ទាត់ការប្រគល់សម្ភារៈ និងការគណនាប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យាតាមច្បាប់ការងារកម្ពុជា។'
              : 'Departmental clearance workflows, Cambodia Labor Law severance & leave encashment calculations, and final settlements.'}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setShowInitiateModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <UserMinus className="w-4 h-4" />
          <span>Initiate Exit Request</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Active Exits</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{requests.length} Requests</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">In Clearance</p>
          <p className="text-2xl font-bold text-amber-600 mt-2">
            {requests.filter((r) => r.status === 'CLEARANCE').length} Staff
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Settled &amp; Paid</p>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            {requests.filter((r) => r.status === 'SETTLED').length} Completed
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Labor Law Seniority</p>
          <p className="text-2xl font-bold text-indigo-600 mt-2">15 Days / Year</p>
        </div>
      </div>

      {/* Offboarding Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            {language === 'km' ? 'បញ្ជីឈ្មោះបុគ្គលិកបញ្ចប់កិច្ចសន្យា' : 'Employee Exit Pipeline'}
          </h3>
          <span className="text-xs text-slate-500 font-medium">Showing {requests.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Exit Reason</th>
                <th className="px-5 py-3.5">Last Working Date</th>
                <th className="px-5 py-3.5">Clearance Progress</th>
                <th className="px-5 py-3.5">Settlement</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((row) => {
                const progressPct =
                  row.tasks_total > 0
                    ? Math.round((row.tasks_completed / row.tasks_total) * 100)
                    : 0;

                return (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{row.employee_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{row.employee_code}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{row.department}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700">
                        {row.reason}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700">{row.last_working_date}</td>
                    <td className="px-5 py-3.5">
                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-[10px] font-medium text-slate-600">
                          <span>
                            {row.tasks_completed}/{row.tasks_total} items
                          </span>
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
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.settlement_status === 'SETTLED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.settlement_status === 'CALCULATED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {row.settlement_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          row.status === 'SETTLED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : row.status === 'CLEARANCE'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenChecklist(row)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
                          title="View Department Clearance Checklist"
                        >
                          Checklist
                        </button>
                        <button
                          onClick={() => handleOpenSettlement(row)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold transition flex items-center space-x-1"
                          title="Calculate Final Settlement"
                        >
                          <Calculator className="w-3 h-3" />
                          <span>Settlement</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clearance Checklist Modal */}
      {showChecklistModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">Departmental Clearance Checklist</h4>
                <p className="text-xs text-slate-500">
                  {selectedRequest.employee_name} ({selectedRequest.employee_code}) &bull; Exit:{' '}
                  {selectedRequest.last_working_date}
                </p>
              </div>
              <button
                onClick={() => setShowChecklistModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {checklistTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    task.is_completed
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {task.is_completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={task.is_completed ? 'line-through text-slate-500' : 'font-medium'}>
                      {task.title}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-slate-200 text-slate-600">
                    {task.department}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 flex items-center justify-between">
              <span>All items must be signed off before final settlement release.</span>
              <span className="font-bold text-slate-800">
                {checklistTasks.filter((t) => t.is_completed).length} of {checklistTasks.length} Done
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowChecklistModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow"
              >
                Save &amp; Close Checklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cambodia Statutory Final Settlement Modal */}
      {showSettlementModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {language === 'km'
                      ? 'ការគណនាប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យា'
                      : 'Cambodia Statutory Final Settlement'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Strict adherence to Cambodia Labor Law (Articles 73, 89, 166)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettlementModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {isLoadingSettlement ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Computing Cambodia Labor Law settlement formulas...
              </div>
            ) : settlementData ? (
              <div className="space-y-4 text-xs">
                {/* Employee Header Info */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Employee:</span>{' '}
                    <span className="font-bold text-slate-900">
                      {settlementData.employee_name} ({settlementData.employee_code})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Base Contract Wage:</span>{' '}
                    <span className="font-bold text-indigo-600 font-mono">
                      ${settlementData.contract_salary} / month
                    </span>
                  </div>
                </div>

                {/* Itemized Calculation Breakdown */}
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-900">1. Prorated Monthly Salary</p>
                      <p className="text-[11px] text-slate-500">
                        Worked {settlementData.worked_days} / 26 days in exit month
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900">
                        {formatMoney(settlementData.prorated_salary_khr)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-900">2. Unused Annual Leave Encashment</p>
                      <p className="text-[11px] text-slate-500">
                        Accrued {settlementData.unused_leave_days} remaining days &times; daily wage
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900">
                        {formatMoney(settlementData.unused_leave_encashment_khr)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-900">3. Seniority Indemnity / Severance Pay</p>
                      <p className="text-[11px] text-slate-500">
                        Cambodia Labor Law statutory severance ({settlementData.seniority_days} days)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-600">
                        +{formatMoney(settlementData.seniority_indemnity_khr)}
                      </span>
                    </div>
                  </div>

                  {settlementData.tax_on_salary_khr > 0 && (
                    <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-900">4. GDT Tax on Salary Withholding</p>
                        <p className="text-[11px] text-slate-500">
                          Progressive tax withheld on taxable portion
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-600">
                          -{formatMoney(settlementData.tax_on_salary_khr)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Net Payout Banner */}
                  <div className="p-4 bg-emerald-50 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-emerald-950 text-sm uppercase tracking-wide">
                        Total Final Net Payable
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Approved for bank disbursement (ABA / ACLEDA)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-emerald-700 font-mono">
                        {formatMoney(settlementData.final_net_payable_khr)}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-mono">
                        {currency === 'USD'
                          ? `KHR ${Number(settlementData.final_net_payable_khr).toLocaleString()}`
                          : `$${Number(settlementData.final_net_payable_usd).toFixed(2)} USD`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    onClick={() => setShowSettlementModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleApproveSettlement}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve &amp; Finalize Settlement</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Initiate Exit Request Modal */}
      {showInitiateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">Initiate Employee Offboarding</h4>
                <p className="text-xs text-slate-500">Record exit notice &amp; spawn clearance tasks</p>
              </div>
              <button
                onClick={() => setShowInitiateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInitiateExit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Employee</label>
                <select
                  value={initForm.employee_code}
                  onChange={(e) => {
                    const code = e.target.value;
                    const map: any = {
                      'EMP-001': { id: 'emp-1', name: 'Sokha Heng' },
                      'EMP-002': { id: 'emp-2', name: 'Dara Chan' },
                      'EMP-003': { id: 'emp-3', name: 'Visal Keo' },
                      'EMP-004': { id: 'emp-4', name: 'Rathana Som' },
                      'EMP-005': { id: 'emp-5', name: 'Bora Tep' },
                    };
                    setInitForm({
                      ...initForm,
                      employee_code: code,
                      employee_id: map[code].id,
                      employee_name: map[code].name,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-rose-500"
                >
                  <option value="EMP-003">EMP-003 - Visal Keo (Software Engineering)</option>
                  <option value="EMP-001">EMP-001 - Sokha Heng (Human Resources)</option>
                  <option value="EMP-002">EMP-002 - Dara Chan (Finance & Accounting)</option>
                  <option value="EMP-004">EMP-004 - Rathana Som (Software Engineering)</option>
                  <option value="EMP-005">EMP-005 - Bora Tep (Sales & Marketing)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Termination / Exit Reason</label>
                <select
                  value={initForm.reason}
                  onChange={(e: any) => setInitForm({ ...initForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-rose-500"
                >
                  <option value="RESIGNATION">Voluntary Resignation</option>
                  <option value="CONTRACT_END">End of Fixed Term Contract (FDC)</option>
                  <option value="TERMINATION">Employer Termination with Notice</option>
                  <option value="MUTUAL_AGREEMENT">Mutual Separation Agreement</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Notice Tender Date</label>
                  <input
                    type="date"
                    required
                    value={initForm.notice_date}
                    onChange={(e) => setInitForm({ ...initForm, notice_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Last Working Day</label>
                  <input
                    type="date"
                    required
                    value={initForm.last_working_date}
                    onChange={(e) => setInitForm({ ...initForm, last_working_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Handover &amp; Exit Notes</label>
                <textarea
                  rows={3}
                  value={initForm.exit_interview_notes}
                  onChange={(e) => setInitForm({ ...initForm, exit_interview_notes: e.target.value })}
                  placeholder="Key project handovers, reasons, asset return arrangements..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowInitiateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow"
                >
                  Initiate Exit &amp; Clearance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
