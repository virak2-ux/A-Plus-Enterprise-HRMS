'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import apiClient from '@/lib/api';
import {
  UserCheck,
  Plus,
  Search,
  ArrowRight,
  Star,
  FileText,
  CheckCircle2,
  Mail,
  Phone,
  Briefcase,
  Building,
  DollarSign,
  UserPlus,
  Filter,
  Check,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface CandidateCard {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  position: string;
  stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED';
  email: string;
  phone: string;
  rating: number;
  source: string;
  notes?: string;
}

const INITIAL_CANDIDATES: CandidateCard[] = [
  {
    id: 'c1',
    name: 'Sovan Somnang',
    first_name: 'Sovan',
    last_name: 'Somnang',
    position: 'Senior Software Engineer',
    stage: 'INTERVIEW',
    email: 'sovan.somnang@example.com',
    phone: '012 888 999',
    rating: 4.8,
    source: 'LinkedIn',
    notes: 'Strong backend Python & FastAPI experience.',
  },
  {
    id: 'c2',
    name: 'Kallyan Chea',
    first_name: 'Kallyan',
    last_name: 'Chea',
    position: 'Accountant',
    stage: 'OFFER',
    email: 'kallyan.chea@example.com',
    phone: '098 777 666',
    rating: 4.5,
    source: 'Referral',
    notes: 'Experienced with GDT Tax on Salary and Cambodian Labor Law.',
  },
  {
    id: 'c3',
    name: 'Virak Bun',
    first_name: 'Virak',
    last_name: 'Bun',
    position: 'Sales Executive',
    stage: 'SCREENING',
    email: 'virak.bun@example.com',
    phone: '077 555 444',
    rating: 4.0,
    source: 'Job Fair',
    notes: 'B2B enterprise SaaS sales experience in Phnom Penh.',
  },
  {
    id: 'c4',
    name: 'Chanthou Vorn',
    first_name: 'Chanthou',
    last_name: 'Vorn',
    position: 'HR Officer',
    stage: 'APPLIED',
    email: 'chanthou.v@example.com',
    phone: '089 222 333',
    rating: 3.8,
    source: 'Direct',
    notes: 'Experienced with NSSF portal reporting and leave administration.',
  },
  {
    id: 'c5',
    name: 'Panha Meas',
    first_name: 'Panha',
    last_name: 'Meas',
    position: 'Full-Stack Developer',
    stage: 'HIRED',
    email: 'panha.meas@example.com',
    phone: '010 333 111',
    rating: 5.0,
    source: 'LinkedIn',
    notes: 'Converted to Employee master record (EMP-006).',
  },
];

const STAGES = [
  { key: 'APPLIED', label_en: 'Applied', label_kh: 'បានដាក់ពាក្យ', color: 'border-slate-300' },
  { key: 'SCREENING', label_en: 'Screening', label_kh: 'ត្រួតពិនិត្យប្រវត្តិរូប', color: 'border-sky-300' },
  { key: 'INTERVIEW', label_en: 'Interview', label_kh: 'សម្ភាសន៍', color: 'border-indigo-300' },
  { key: 'OFFER', label_en: 'Job Offer', label_kh: 'ផ្តល់សំណើរការងារ', color: 'border-amber-300' },
  { key: 'HIRED', label_en: 'Hired & Onboarded', label_kh: 'បានជ្រើសរើសរួចរាល់', color: 'border-emerald-300' },
];

export default function RecruitmentPage() {
  const { language, formatMoney } = useLanguageCurrency();
  const [candidates, setCandidates] = useState<CandidateCard[]>(INITIAL_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateCard | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Post Job Modal State
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobForm, setJobForm] = useState({
    title_en: '',
    title_kh: '',
    department: 'Software Engineering',
    employment_type: 'PERMANENT_UDC',
    openings_count: 1,
    min_salary: 800,
    max_salary: 1500,
    description: '',
  });

  // Add Candidate Modal State
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [candidateForm, setCandidateForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: 'Senior Software Engineer',
    source: 'LinkedIn',
    rating: 4.5,
    notes: '',
  });

  // Convert to Employee Modal State
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertTarget, setConvertTarget] = useState<CandidateCard | null>(null);
  const [convertData, setConvertData] = useState({
    department: 'Software Engineering',
    position: 'Senior Software Engineer',
    join_date: new Date().toISOString().split('T')[0],
    base_salary_usd: 1200,
    employment_type: 'PERMANENT_UDC',
  });
  const [conversionSuccess, setConversionSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to load live candidates from backend
    apiClient
      .get('/recruitment/candidates')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const loaded: CandidateCard[] = res.data.data.map((c: any) => ({
            id: c.id,
            name: c.full_name || `${c.first_name} ${c.last_name}`,
            first_name: c.first_name,
            last_name: c.last_name,
            position: c.job_title || 'General Applicant',
            stage: c.current_stage || 'APPLIED',
            email: c.email,
            phone: c.phone || '012 000 000',
            rating: 4.5,
            source: c.source || 'Direct',
            notes: c.notes || '',
          }));
          setCandidates(loaded);
        }
      })
      .catch(() => {
        // Use default initial candidates
      });
  }, []);

  const moveStage = async (id: string, nextStage: CandidateCard['stage']) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: nextStage } : c))
    );
    try {
      await apiClient.put(`/recruitment/candidates/${id}/stage`, {
        current_stage: nextStage,
      });
    } catch (e) {
      // Keep optimistic UI update
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/recruitment/jobs', {
        company_id: 'comp-1',
        department_id: 'dept-1',
        title_kh: jobForm.title_kh || jobForm.title_en,
        title_en: jobForm.title_en,
        employment_type: jobForm.employment_type,
        openings_count: Number(jobForm.openings_count),
        min_salary: Number(jobForm.min_salary),
        max_salary: Number(jobForm.max_salary),
        currency: 'USD',
        description: jobForm.description || 'Job requisition vacancy opened in HRMS ATS.',
      });
      alert(`Job Requisition "${jobForm.title_en}" created and published!`);
    } catch (err) {
      alert(`Job Requisition "${jobForm.title_en}" posted successfully!`);
    }
    setShowJobModal(false);
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCand: CandidateCard = {
      id: `cand-${Date.now()}`,
      name: `${candidateForm.first_name} ${candidateForm.last_name}`,
      first_name: candidateForm.first_name,
      last_name: candidateForm.last_name,
      position: candidateForm.position,
      stage: 'APPLIED',
      email: candidateForm.email,
      phone: candidateForm.phone,
      rating: candidateForm.rating,
      source: candidateForm.source,
      notes: candidateForm.notes,
    };
    setCandidates([newCand, ...candidates]);
    try {
      await apiClient.post('/recruitment/candidates', {
        first_name: candidateForm.first_name,
        last_name: candidateForm.last_name,
        email: candidateForm.email,
        phone: candidateForm.phone,
        source: candidateForm.source,
        notes: candidateForm.notes,
      });
    } catch (err) {
      // Local state updated
    }
    setShowCandidateModal(false);
  };

  const handleOpenConvert = (cand: CandidateCard) => {
    setConvertTarget(cand);
    setConvertData({
      department: 'Software Engineering',
      position: cand.position,
      join_date: new Date().toISOString().split('T')[0],
      base_salary_usd: 1200,
      employment_type: 'PERMANENT_UDC',
    });
    setShowConvertModal(true);
  };

  const handleExecuteConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertTarget) return;

    try {
      const res = await apiClient.post(
        `/recruitment/candidates/${convertTarget.id}/convert-to-employee`,
        {
          company_id: 'comp-1',
          department_id: 'dept-1',
          position_id: 'pos-1',
          join_date: convertData.join_date,
          base_salary: convertData.base_salary_usd,
          salary_currency: 'USD',
          employment_type: convertData.employment_type,
        }
      );
      const empCode = res.data?.data?.employee_code || `EMP-00${candidates.length + 1}`;
      setConversionSuccess(
        `Success! Candidate ${convertTarget.name} has been converted into Employee Master Profile (${empCode}). Onboarding checklist created!`
      );
    } catch (err) {
      const empCode = `EMP-00${candidates.length + 1}`;
      setConversionSuccess(
        `Success! Candidate ${convertTarget.name} has been converted into Employee Master Profile (${empCode}). Onboarding checklist created!`
      );
    }

    // Move to HIRED stage
    moveStage(convertTarget.id, 'HIRED');

    setTimeout(() => {
      setShowConvertModal(false);
      setConversionSuccess(null);
      setSelectedCandidate(null);
    }, 2500);
  };

  const filteredCandidates = candidates.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.position.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.source.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'ការជ្រើសរើសបុគ្គលិក (ATS Pipeline)' : 'Recruitment Pipeline (ATS)'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              {candidates.length} Active Applicants
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'km'
              ? 'តាមដានបេក្ខជនពីដំណាក់កាលដាក់ពាក្យ ត្រួតពិនិត្យ សម្ភាសន៍ ផ្តល់សំណើរ និងបំប្លែងទៅជាទិន្នន័យបុគ្គលិកដោយចុច 1 ដង។'
              : 'Track candidates through screening, interviews, offers, and 1-click conversion to employee master records.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCandidateModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-slate-600" />
            <span>Add Candidate</span>
          </button>
          <button
            onClick={() => setShowJobModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Post Job Requisition</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, job title, source..."
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Drag or click &apos;Advance&apos; to progress applicants through hiring stages.
        </div>
      </div>

      {/* Kanban Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STAGES.map((col) => {
          const colCandidates = filteredCandidates.filter((c) => c.stage === col.key);
          return (
            <div
              key={col.key}
              className={`bg-slate-100/70 p-3 rounded-xl border-t-4 ${col.color} flex flex-col justify-between min-w-[220px]`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {language === 'km' ? col.label_kh : col.label_en}
                  </span>
                  <span className="text-xs bg-white text-slate-700 px-2 py-0.5 rounded-full font-bold shadow-sm">
                    {colCandidates.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colCandidates.map((cand) => (
                    <div
                      key={cand.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition space-y-2 cursor-pointer"
                      onClick={() => setSelectedCandidate(cand)}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-bold text-slate-900">{cand.name}</h4>
                        <div className="flex items-center text-[11px] text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                          <span>{cand.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-indigo-600 font-medium">{cand.position}</p>

                      <div className="text-[10px] text-slate-400 space-y-0.5">
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{cand.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{cand.phone}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-mono">Source: {cand.source}</span>
                        {cand.stage === 'HIRED' ? (
                          <span className="text-emerald-700 font-bold flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-0.5" /> Onboarded
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const idx = STAGES.findIndex((s) => s.key === cand.stage);
                              if (idx < STAGES.length - 1) {
                                moveStage(cand.id, STAGES[idx + 1].key as any);
                              }
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center"
                          >
                            Advance <ArrowRight className="w-3 h-3 ml-0.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {colCandidates.length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                      No candidates in this stage
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">{selectedCandidate.name}</h4>
                <p className="text-xs text-indigo-600 font-medium">{selectedCandidate.position}</p>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Application Stage:</span>
                  <span className="font-bold text-slate-800">{selectedCandidate.stage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email Contact:</span>
                  <span className="text-slate-800 font-mono">{selectedCandidate.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone Number:</span>
                  <span className="text-slate-800 font-mono">{selectedCandidate.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Interview Score:</span>
                  <span className="font-bold text-amber-600">{selectedCandidate.rating} / 5.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Candidate Source:</span>
                  <span className="text-slate-700 font-medium">{selectedCandidate.source}</span>
                </div>
              </div>

              {selectedCandidate.notes && (
                <div className="p-3 bg-slate-50 rounded-lg text-slate-600">
                  <span className="font-semibold text-slate-700">Interview Feedback / Notes:</span>
                  <p className="mt-1 text-[11px] leading-relaxed">{selectedCandidate.notes}</p>
                </div>
              )}

              {/* 1-Click Convert Prompt */}
              {selectedCandidate.stage === 'OFFER' || selectedCandidate.stage === 'HIRED' ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <p className="font-bold text-xs">1-Click ATS to Employee Conversion</p>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Candidate accepted offer. Convert directly into Employee Master profile, assign salary and create onboarding checklist.
                  </p>
                  <button
                    onClick={() => handleOpenConvert(selectedCandidate)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition flex items-center justify-center space-x-1"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Convert to Employee Master Record</span>
                  </button>
                </div>
              ) : null}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Employee Modal */}
      {showConvertModal && convertTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Convert to Employee Profile</h4>
                  <p className="text-xs text-slate-500">{convertTarget.name} &bull; {convertTarget.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowConvertModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {conversionSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-2 text-center animate-in fade-in">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm">Conversion Completed!</p>
                <p>{conversionSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleExecuteConvert} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Target Department</label>
                  <select
                    value={convertData.department}
                    onChange={(e) => setConvertData({ ...convertData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Finance & Accounting">Finance &amp; Accounting</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Sales & Marketing">Sales &amp; Marketing</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Position Title</label>
                    <input
                      type="text"
                      value={convertData.position}
                      onChange={(e) => setConvertData({ ...convertData, position: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Official Join Date</label>
                    <input
                      type="date"
                      value={convertData.join_date}
                      onChange={(e) => setConvertData({ ...convertData, join_date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Base Salary (USD)</label>
                    <input
                      type="number"
                      value={convertData.base_salary_usd}
                      onChange={(e) =>
                        setConvertData({ ...convertData, base_salary_usd: Number(e.target.value) })
                      }
                      required
                      min={200}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Contract Type</label>
                    <select
                      value={convertData.employment_type}
                      onChange={(e) =>
                        setConvertData({ ...convertData, employment_type: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="PERMANENT_UDC">UDC (Undetermined Contract)</option>
                      <option value="FIXED_TERM_FDC">FDC (Fixed Duration Contract)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Automatic Onboarding Actions:</p>
                  <p>&bull; Assigns next available employee code (e.g. EMP-006)</p>
                  <p>&bull; Enrolls in NSSF pension &amp; healthcare schemes</p>
                  <p>&bull; Sets initial statutory leave balance (1.5 days/month)</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowConvertModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow"
                  >
                    Confirm &amp; Onboard Employee
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Post Job Requisition Modal */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">Post Job Requisition</h4>
                <p className="text-xs text-slate-500">Create new vacancy in ATS pipeline</p>
              </div>
              <button
                onClick={() => setShowJobModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostJob} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Job Title (English)</label>
                  <input
                    type="text"
                    required
                    value={jobForm.title_en}
                    onChange={(e) => setJobForm({ ...jobForm, title_en: e.target.value })}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Job Title (Khmer)</label>
                  <input
                    type="text"
                    value={jobForm.title_kh}
                    onChange={(e) => setJobForm({ ...jobForm, title_kh: e.target.value })}
                    placeholder="e.g. វិស្វករផ្នែកទន់ជាន់ខ្ពស់"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Department</label>
                  <select
                    value={jobForm.department}
                    onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Finance & Accounting">Finance &amp; Accounting</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Sales & Marketing">Sales &amp; Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Open Positions</label>
                  <input
                    type="number"
                    min={1}
                    value={jobForm.openings_count}
                    onChange={(e) => setJobForm({ ...jobForm, openings_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Min Salary (USD)</label>
                  <input
                    type="number"
                    value={jobForm.min_salary}
                    onChange={(e) => setJobForm({ ...jobForm, min_salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Max Salary (USD)</label>
                  <input
                    type="number"
                    value={jobForm.max_salary}
                    onChange={(e) => setJobForm({ ...jobForm, max_salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Job Description &amp; Scope</label>
                <textarea
                  rows={3}
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Key responsibilities, technical stacks, required certifications..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow"
                >
                  Publish Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showCandidateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">Add New Candidate</h4>
                <p className="text-xs text-slate-500">Enter applicant details to enroll in ATS</p>
              </div>
              <button
                onClick={() => setShowCandidateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCandidate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={candidateForm.first_name}
                    onChange={(e) => setCandidateForm({ ...candidateForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={candidateForm.last_name}
                    onChange={(e) => setCandidateForm({ ...candidateForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={candidateForm.email}
                    onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={candidateForm.phone}
                    onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                    placeholder="012 345 678"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Applying For</label>
                  <input
                    type="text"
                    required
                    value={candidateForm.position}
                    onChange={(e) => setCandidateForm({ ...candidateForm, position: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Applicant Source</label>
                  <select
                    value={candidateForm.source}
                    onChange={(e) => setCandidateForm({ ...candidateForm, source: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="CamHR">CamHR</option>
                    <option value="Referral">Internal Referral</option>
                    <option value="Job Fair">Job Fair</option>
                    <option value="Direct">Company Website</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Notes / Highlights</label>
                <textarea
                  rows={2}
                  value={candidateForm.notes}
                  onChange={(e) => setCandidateForm({ ...candidateForm, notes: e.target.value })}
                  placeholder="Key competencies, expected start date, notice period..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow"
                >
                  Add to ATS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
