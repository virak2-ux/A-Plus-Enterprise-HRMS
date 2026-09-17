'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import {
  AlertTriangle,
  FileText,
  ShieldAlert,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  Plus,
  UserX,
  Search,
  Check,
  Scale,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface DisciplinaryItem {
  id: string;
  employee_id: string;
  employee_code: string;
  employee_name: string;
  employee_name_kh: string;
  department_id: string;
  incident_date: string;
  category: string;
  description: string;
  action_taken: string;
  warning_letter_number: string;
  suspension_days: number;
  improvement_plan: string | null;
  acknowledged_by_employee: boolean;
  acknowledged_at: string | null;
  employee_comments: string | null;
  created_at: string;
}

interface EmployeeOption {
  id: string;
  employee_code: string;
  first_name_en: string;
  last_name_en: string;
  first_name_kh: string;
  last_name_kh: string;
}

export default function DisciplinaryPage() {
  const { language } = useLanguageCurrency();
  const [records, setRecords] = useState<DisciplinaryItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('POLICY_BREACH');
  const [actionTaken, setActionTaken] = useState('FIRST_WRITTEN_WARNING');
  const [suspensionDays, setSuspensionDays] = useState(3);
  const [description, setDescription] = useState('');
  const [improvementPlan, setImprovementPlan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Status message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/disciplinary', { headers });
      if (res.ok) {
        const json = await res.json();
        setRecords(json.data || []);
      }
    } catch (e) {
      console.error('Failed to load disciplinary records:', e);
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
        if (json.data?.length > 0) setSelectedEmpId(json.data[0].id);
      }
    } catch (e) {
      console.error('Failed to load employees:', e);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchEmployees();
  }, []);

  const handleIssueAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionTaken === 'SUSPENSION' && suspensionDays > 7) {
      setFeedback({
        type: 'error',
        message:
          language === 'km'
            ? 'មាត្រា ២៧ នៃច្បាប់ការងារកំណត់ថា ការព្យួរការងារដោយគ្មានប្រាក់ឈ្នួលមិនអាចលើសពី ៧ ថ្ងៃឡើយ។'
            : 'Cambodia Labor Law Article 27 limits disciplinary suspension without pay to a maximum of 7 days.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/disciplinary', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employee_id: selectedEmpId,
          incident_date: incidentDate,
          category,
          description,
          action_taken: actionTaken,
          suspension_days: actionTaken === 'SUSPENSION' ? suspensionDays : 0,
          improvement_plan: improvementPlan,
        }),
      });

      if (res.ok) {
        setFeedback({
          type: 'success',
          message:
            language === 'km' ? 'បានចេញលិខិតព្រមានវិន័យដោយជោគជ័យ' : 'Disciplinary warning action issued successfully',
        });
        setShowIssueModal(false);
        setDescription('');
        setImprovementPlan('');
        fetchRecords();
      } else {
        const err = await res.json();
        setFeedback({ type: 'error', message: err.detail || 'Action failed' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    } finally {
      setSubmitting(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/disciplinary/${id}/acknowledge`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ employee_comments: 'Acknowledged and signed.' }),
      });
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: language === 'km' ? 'បានកត់ត្រាហត្ថលេខាទទួលស្គាល់' : 'Employee acknowledgment recorded',
        });
        fetchRecords();
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const printWarningLetter = (id: string) => {
    window.open(`http://127.0.0.1:8000/api/v1/disciplinary/${id}/warning-letter`, '_blank');
  };

  const filtered = records.filter((r) => {
    const matchesCat = categoryFilter === 'ALL' || r.action_taken === categoryFilter;
    const matchesQuery =
      r.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      r.employee_code.toLowerCase().includes(search.toLowerCase()) ||
      r.warning_letter_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'វិន័យ & ការព្រមានបុគ្គលិក' : 'Disciplinary Actions & Warning Letters'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 flex items-center space-x-1">
              <Scale className="w-3.5 h-3.5 mr-1" />
              Art. 26-29 Compliant
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'km'
              ? 'គ្រប់គ្រងវិធានការវិន័យតាមច្បាប់ការងារកម្ពុជា ការចេញលិខិតព្រមានជាលាយលក្ខណ៍អក្សរ និងការព្យួរការងារមិនលើសពី ៧ ថ្ងៃ (មាត្រា ២៧)។'
              : 'Enforce progressive discipline per Cambodia Labor Law (verbal, 1st & 2nd written warnings, Article 27 max 7-day suspension, and Article 83 serious misconduct dismissals).'}
          </p>
        </div>

        <button
          onClick={() => setShowIssueModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'km' ? 'ចេញលិខិតព្រមាន' : 'Issue Disciplinary Action'}</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Cambodia Labor Law Progressive Discipline Guide Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            Step 1
          </span>
          <h4 className="text-xs font-bold text-slate-800 mt-2">
            {language === 'km' ? 'ការព្រមានដោយផ្ទាល់មាត់' : 'Verbal Warning'}
          </h4>
          <p className="text-[11px] text-slate-500 mt-1">Informal counseling & coaching.</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
            Step 2
          </span>
          <h4 className="text-xs font-bold text-slate-800 mt-2">
            {language === 'km' ? 'លិខិតព្រមានលើកទី១' : '1st Written Warning'}
          </h4>
          <p className="text-[11px] text-slate-500 mt-1">Formal notice with PIP.</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
            Step 3
          </span>
          <h4 className="text-xs font-bold text-slate-800 mt-2">
            {language === 'km' ? 'លិខិតព្រមានលើកទី២' : '2nd Written Warning'}
          </h4>
          <p className="text-[11px] text-slate-500 mt-1">Escalated official reprimand.</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm">
          <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
            Step 4 (Art. 27)
          </span>
          <h4 className="text-xs font-bold text-slate-900 mt-2">
            {language === 'km' ? 'ព្យួរការងារ (<= ៧ ថ្ងៃ)' : 'Suspension (Max 7 Days)'}
          </h4>
          <p className="text-[11px] text-slate-600 mt-1">Statutory cap: &le; 7 days without pay.</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
            Step 5 (Art. 83)
          </span>
          <h4 className="text-xs font-bold text-slate-800 mt-2">
            {language === 'km' ? 'បញ្ឈប់ពីការងារ' : 'Termination / Dismissal'}
          </h4>
          <p className="text-[11px] text-slate-500 mt-1">With notice or serious misconduct.</p>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: language === 'km' ? 'ទាំងអស់' : 'All Actions' },
            { id: 'FIRST_WRITTEN_WARNING', label: language === 'km' ? 'ព្រមានលើកទី១' : '1st Warning' },
            { id: 'SECOND_WRITTEN_WARNING', label: language === 'km' ? 'ព្រមានលើកទី២' : '2nd Warning' },
            { id: 'SUSPENSION', label: language === 'km' ? 'ព្យួរការងារ' : 'Suspension' },
            { id: 'TERMINATION', label: language === 'km' ? 'បញ្ចប់ការងារ' : 'Termination' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                categoryFilter === tab.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={language === 'km' ? 'ស្វែងរកបុគ្គលិក, លេខលិខិត...' : 'Search employee, ref number...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500 w-60"
          />
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3.5">{language === 'km' ? 'លេខលិខិត' : 'Ref Number'}</th>
                <th className="p-3.5">{language === 'km' ? 'បុគ្គលិក' : 'Employee'}</th>
                <th className="p-3.5">{language === 'km' ? 'កាលបរិច្ឆេទ' : 'Incident Date'}</th>
                <th className="p-3.5">{language === 'km' ? 'ប្រភេទកំហុស' : 'Category'}</th>
                <th className="p-3.5">{language === 'km' ? 'ចំណាត់ការវិន័យ' : 'Action Taken'}</th>
                <th className="p-3.5">{language === 'km' ? 'ការពិពណ៌នា' : 'Description'}</th>
                <th className="p-3.5 text-center">{language === 'km' ? 'ការយល់ព្រម' : 'Acknowledgment'}</th>
                <th className="p-3.5 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                    {language === 'km' ? 'កំពុងទាញយកទិន្នន័យ...' : 'Loading disciplinary records...'}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                    {language === 'km' ? 'គ្មានកំណត់ត្រាវិន័យទេ' : 'No disciplinary records found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5 font-mono font-bold text-rose-700">{r.warning_letter_number || '-'}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{r.employee_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.employee_code}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 font-mono">{r.incident_date}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {r.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          r.action_taken === 'SUSPENSION'
                            ? 'bg-purple-100 text-purple-800'
                            : r.action_taken === 'TERMINATION'
                            ? 'bg-red-100 text-red-900'
                            : r.action_taken.includes('WARNING')
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.action_taken.replace(/_/g, ' ')}
                        {r.action_taken === 'SUSPENSION' ? ` (${r.suspension_days}d)` : ''}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate" title={r.description}>
                      {r.description}
                    </td>
                    <td className="p-3.5 text-center">
                      {r.acknowledged_by_employee ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Signed</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAcknowledge(r.id)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                        >
                          Sign Now
                        </button>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => printWarningLetter(r.id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded text-[11px] font-bold transition shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Letter</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Disciplinary Action Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'km' ? 'ចេញលិខិតព្រមាន ឬវិធានការវិន័យ' : 'Issue Disciplinary Action & Warning'}
                </h3>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueAction} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'ជ្រើសរើសបុគ្គលិក' : 'Target Employee'} *
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-rose-500"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.employee_code} - {e.first_name_en} {e.last_name_en} ({e.last_name_kh} {e.first_name_kh})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'កាលបរិច្ឆេទកើតហេតុ' : 'Incident Date'} *
                  </label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ប្រភេទកំហុសឆ្គង' : 'Infraction Category'} *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                  >
                    <option value="POLICY_BREACH">Company Policy Breach</option>
                    <option value="LATENESS">Repeated Lateness / Tardiness</option>
                    <option value="UNEXCUSED_ABSENCE">Unexcused Absence (Article 83)</option>
                    <option value="INSUBORDINATION">Insubordination / Disobedience</option>
                    <option value="MISCONDUCT">General Misconduct</option>
                    <option value="SAFETY_VIOLATION">Workplace Safety Violation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'ចំណាត់ការវិន័យដែលត្រូវអនុវត្ត' : 'Progressive Action Taken'} *
                </label>
                <select
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-black"
                >
                  <option value="VERBAL_WARNING">Verbal Warning / Informal Coaching</option>
                  <option value="FIRST_WRITTEN_WARNING">First Written Warning Letter</option>
                  <option value="SECOND_WRITTEN_WARNING">Second Written Warning Letter</option>
                  <option value="FINAL_WARNING">Final Written Warning Letter</option>
                  <option value="SUSPENSION">Disciplinary Suspension Without Pay (Art. 27)</option>
                  <option value="TERMINATION">Termination of Employment Contract</option>
                </select>
              </div>

              {actionTaken === 'SUSPENSION' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-purple-900">
                      Suspension Days (Max 7 Days under Labor Law Art. 27):
                    </label>
                    <span className="font-black text-purple-700">{suspensionDays} Days</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={suspensionDays}
                    onChange={(e) => setSuspensionDays(parseInt(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-purple-700 italic">
                    &bull; Strict Compliance: Article 27 explicitly forbids suspensions exceeding 7 days.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'ការពិពណ៌នាលម្អិតអំពីកំហុស' : 'Factual Description'} *
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === 'km' ? 'រៀបរាប់អង្គហេតុ និងសកម្មភាពល្មើស...' : 'Detail specific incidents, dates, witnesses, and impact...'}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'ផែនការកែលម្អ & កាលកំណត់' : 'Corrective Actions & Timeline'}
                </label>
                <input
                  type="text"
                  value={improvementPlan}
                  onChange={(e) => setImprovementPlan(e.target.value)}
                  placeholder="e.g., Must improve punctuality over next 30 days without unexcused lateness."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm transition disabled:opacity-50"
                >
                  {submitting
                    ? language === 'km'
                      ? 'កំពុងចេញលិខិត...'
                      : 'Issuing...'
                    : language === 'km'
                    ? 'ចេញលិខិតព្រមាន'
                    : 'Issue Warning'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
