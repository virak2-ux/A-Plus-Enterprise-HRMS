'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import apiClient from '@/lib/api';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Star,
  Plus,
  Search,
  FileBadge,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface ReviewScorecard {
  id: string;
  code: string;
  name_en: string;
  name_kh: string;
  department: string;
  position: string;
  cycle?: string;
  self_score: number | null;
  manager_score: number | null;
  final_score: number | null;
  strengths?: string;
  development_goals?: string;
  status: 'COMPLETED' | 'IN_REVIEW' | 'PENDING_SELF';
}

interface CourseItem {
  id: string;
  title_en: string;
  title_kh: string;
  provider: string;
  duration_hours: number;
  cost: number;
  currency: string;
  description?: string;
}

const INITIAL_REVIEWS: ReviewScorecard[] = [
  {
    id: 'r1',
    code: 'EMP-001',
    name_en: 'Sokha Heng',
    name_kh: 'ហេង សុខា',
    department: 'Human Resources',
    position: 'HR Director',
    self_score: 4.8,
    manager_score: 4.9,
    final_score: 4.85,
    strengths: 'Organizational restructuring, labor law compliance, team leadership.',
    development_goals: 'Executive MBA strategy expansion.',
    status: 'COMPLETED',
  },
  {
    id: 'r2',
    code: 'EMP-003',
    name_en: 'Visal Keo',
    name_kh: 'កែវ វិសាល',
    department: 'Software Engineering',
    position: 'Senior Software Engineer',
    self_score: 4.5,
    manager_score: 4.8,
    final_score: 4.68,
    strengths: 'Full-stack delivery, scalable system architecture, high code reliability.',
    development_goals: 'Cross-functional engineering mentorship.',
    status: 'COMPLETED',
  },
  {
    id: 'r3',
    code: 'EMP-002',
    name_en: 'Dara Chan',
    name_kh: 'ចាន់ ដារ៉ា',
    department: 'Finance & Accounting',
    position: 'Senior Accountant',
    self_score: 4.2,
    manager_score: 4.5,
    final_score: 4.38,
    strengths: 'Punctual GDT tax filings, zero bank reconciliation discrepancies.',
    development_goals: 'Advanced financial modeling certification.',
    status: 'COMPLETED',
  },
];

const INITIAL_COURSES: CourseItem[] = [
  {
    id: 'c1',
    title_en: 'Cambodia Labor Law & Statutory Payroll Compliance',
    title_kh: 'ច្បាប់ការងារកម្ពុជា និងការអនុលោមប្រាក់បៀវត្ស',
    provider: 'Ministry of Labour & CamHR Institute',
    duration_hours: 16.0,
    cost: 150.0,
    currency: 'USD',
    description: 'Comprehensive study of Prakas 443 on Seniority Indemnity and GDT Circular on Salary Tax.',
  },
  {
    id: 'c2',
    title_en: 'Occupational Health & Safety (NSSF Standards)',
    title_kh: 'សុខភាព និងសុវត្ថិភាពការងារ (ស្តង់ដារ ប.ស.ស)',
    provider: 'National Social Security Fund (NSSF)',
    duration_hours: 8.0,
    cost: 0.0,
    currency: 'USD',
    description: 'Mandatory enterprise occupational risk prevention, ergonomics, and emergency protocols.',
  },
  {
    id: 'c3',
    title_en: 'Advanced Enterprise Full-Stack Engineering',
    title_kh: 'វិស្វកម្មផ្នែកទន់កម្រិតខ្ពស់',
    provider: 'CamTech Academy',
    duration_hours: 40.0,
    cost: 300.0,
    currency: 'USD',
    description: 'FastAPI, Next.js, PostgreSQL microservices architecture and automated testing.',
  },
];

export default function TalentPage() {
  const { language } = useLanguageCurrency();
  const [reviews, setReviews] = useState<ReviewScorecard[]>(INITIAL_REVIEWS);
  const [courses, setCourses] = useState<CourseItem[]>(INITIAL_COURSES);
  const [activeTab, setActiveTab] = useState<'APPRAISALS' | 'TRAINING'>('APPRAISALS');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

  // Review Form
  const [reviewForm, setReviewForm] = useState({
    employee_code: 'EMP-004',
    employee_id: 'emp-4',
    employee_name: 'Rathana Som',
    department: 'Software Engineering',
    position: 'Software Engineer',
    self_score: 4.2,
    manager_score: 4.6,
    strengths: 'Clean automated testing, agile team collaboration.',
    development_goals: 'Distributed systems performance tuning.',
  });

  // Enroll Form
  const [enrollForm, setEnrollForm] = useState({
    employee_code: 'EMP-003',
    employee_id: 'emp-3',
    score: 95,
  });

  useEffect(() => {
    // Attempt live fetch
    apiClient
      .get('/talent/reviews')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const loaded: ReviewScorecard[] = res.data.data.map((r: any) => ({
            id: r.id,
            code: r.employee_code,
            name_en: r.employee_name,
            name_kh: r.employee_name_kh,
            department: r.department,
            position: r.position,
            self_score: r.self_score,
            manager_score: r.manager_score,
            final_score: r.final_score,
            strengths: r.strengths,
            development_goals: r.development_goals,
            status: r.status,
          }));
          setReviews(loaded);
        }
      })
      .catch(() => {});

    apiClient
      .get('/talent/courses')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setCourses(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const final = Math.round((reviewForm.self_score * 0.4 + reviewForm.manager_score * 0.6) * 100) / 100;
    const newRev: ReviewScorecard = {
      id: `rev-${Date.now()}`,
      code: reviewForm.employee_code,
      name_en: reviewForm.employee_name,
      name_kh: reviewForm.employee_name,
      department: reviewForm.department,
      position: reviewForm.position,
      self_score: reviewForm.self_score,
      manager_score: reviewForm.manager_score,
      final_score: final,
      strengths: reviewForm.strengths,
      development_goals: reviewForm.development_goals,
      status: 'COMPLETED',
    };
    setReviews([newRev, ...reviews]);
    setShowReviewModal(false);

    try {
      await apiClient.post('/talent/reviews', {
        cycle_id: 'cycle-1',
        employee_id: reviewForm.employee_id,
        self_score: reviewForm.self_score,
        self_comments: 'Self evaluation completed',
        manager_score: reviewForm.manager_score,
        manager_comments: 'Manager evaluation approved',
        strengths: reviewForm.strengths,
        development_goals: reviewForm.development_goals,
      });
    } catch (err) {
      // optimistic
    }
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    alert(
      `Employee ${enrollForm.employee_code} enrolled in "${selectedCourse.title_en}". Certificate generated.`
    );
    setShowEnrollModal(false);

    try {
      await apiClient.post(`/talent/courses/${selectedCourse.id}/enroll`, {
        employee_id: enrollForm.employee_id,
        completion_date: new Date().toISOString().split('T')[0],
        score: enrollForm.score,
      });
    } catch (err) {
      // optimistic
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'ការគ្រប់គ្រងទេពកោសល្យ & បណ្តុះបណ្តាល' : 'Talent & Performance Management'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              360 Appraisals
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'km'
              ? 'ការវាយតម្លៃសមត្ថភាព 360 ដឺក្រេ ផែនការអភិវឌ្ឍន៍បុគ្គល និងវគ្គបណ្តុះបណ្តាលវិជ្ជាជីវៈអនុលោមច្បាប់ការងារ។'
              : '360-degree performance evaluations, weighted KPI scoring, strengths mapping, and certified compliance training programs.'}
          </p>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('APPRAISALS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'APPRAISALS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Performance Appraisals
          </button>
          <button
            onClick={() => setActiveTab('TRAINING')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'TRAINING'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Training &amp; Academy
          </button>
        </div>
      </div>

      {activeTab === 'APPRAISALS' ? (
        <div className="space-y-4">
          {/* Action Row */}
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2026 Enterprise Appraisal Cycle
              </h3>
              <p className="text-[11px] text-slate-500">
                Formula: Final Score = (Self Score &times; 40%) + (Manager Score &times; 60%)
              </p>
            </div>
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Submit 360 Review</span>
            </button>
          </div>

          {/* Reviews Scorecard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{r.name_en}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {r.code} &bull; {r.position}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {r.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Self Evaluation:</span>
                    <span className="font-bold text-slate-700 font-mono">
                      {r.self_score ? `${r.self_score} / 5.0` : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Manager Rating:</span>
                    <span className="font-bold text-indigo-600 font-mono">
                      {r.manager_score ? `${r.manager_score} / 5.0` : '--'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-900">Weighted Final:</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-extrabold text-slate-900 font-mono text-sm">
                        {r.final_score?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {r.strengths && (
                  <div className="text-[11px] text-slate-600 bg-indigo-50/40 p-2.5 rounded-lg">
                    <p className="font-bold text-indigo-950">Key Strengths:</p>
                    <p className="mt-0.5 leading-relaxed">{r.strengths}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {courses.map((c) => (
              <div
                key={c.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-600">
                    <GraduationCap className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                      {c.provider}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{c.title_en}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{c.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Duration:</span>{' '}
                    <span className="font-semibold text-slate-800">{c.duration_hours} hrs</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCourse(c);
                      setShowEnrollModal(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-sm transition"
                  >
                    Enroll Staff
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">Submit 360 Appraisal</h4>
                <p className="text-xs text-slate-500">Record scorecards and development objectives</p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Employee</label>
                <select
                  value={reviewForm.employee_code}
                  onChange={(e) => {
                    const code = e.target.value;
                    const map: any = {
                      'EMP-001': { id: 'emp-1', name: 'Sokha Heng', dept: 'Human Resources', pos: 'HR Director' },
                      'EMP-002': { id: 'emp-2', name: 'Dara Chan', dept: 'Finance & Accounting', pos: 'Senior Accountant' },
                      'EMP-003': { id: 'emp-3', name: 'Visal Keo', dept: 'Software Engineering', pos: 'Senior Software Engineer' },
                      'EMP-004': { id: 'emp-4', name: 'Rathana Som', dept: 'Software Engineering', pos: 'Software Engineer' },
                      'EMP-005': { id: 'emp-5', name: 'Bora Tep', dept: 'Sales & Marketing', pos: 'Sales Executive' },
                    };
                    setReviewForm({
                      ...reviewForm,
                      employee_code: code,
                      employee_id: map[code].id,
                      employee_name: map[code].name,
                      department: map[code].dept,
                      position: map[code].pos,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="EMP-004">EMP-004 - Rathana Som (Software Engineering)</option>
                  <option value="EMP-005">EMP-005 - Bora Tep (Sales & Marketing)</option>
                  <option value="EMP-002">EMP-002 - Dara Chan (Finance & Accounting)</option>
                  <option value="EMP-003">EMP-003 - Visal Keo (Software Engineering)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Self Score (1 - 5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={reviewForm.self_score}
                    onChange={(e) => setReviewForm({ ...reviewForm, self_score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Manager Score (1 - 5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={reviewForm.manager_score}
                    onChange={(e) => setReviewForm({ ...reviewForm, manager_score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Observed Strengths</label>
                <textarea
                  rows={2}
                  value={reviewForm.strengths}
                  onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Development Goals</label>
                <textarea
                  rows={2}
                  value={reviewForm.development_goals}
                  onChange={(e) => setReviewForm({ ...reviewForm, development_goals: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow"
                >
                  Finalize Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Enrollment Modal */}
      {showEnrollModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">Enroll Staff in Course</h4>
                <p className="text-xs text-slate-500">{selectedCourse.title_en}</p>
              </div>
              <button
                onClick={() => setShowEnrollModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Select Employee</label>
                <select
                  value={enrollForm.employee_code}
                  onChange={(e) => {
                    const code = e.target.value;
                    const idMap: any = { 'EMP-001': 'emp-1', 'EMP-002': 'emp-2', 'EMP-003': 'emp-3', 'EMP-004': 'emp-4', 'EMP-005': 'emp-5' };
                    setEnrollForm({ ...enrollForm, employee_code: code, employee_id: idMap[code] });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="EMP-003">EMP-003 - Visal Keo</option>
                  <option value="EMP-001">EMP-001 - Sokha Heng</option>
                  <option value="EMP-002">EMP-002 - Dara Chan</option>
                  <option value="EMP-004">EMP-004 - Rathana Som</option>
                  <option value="EMP-005">EMP-005 - Bora Tep</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Exam / Completion Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={enrollForm.score}
                  onChange={(e) => setEnrollForm({ ...enrollForm, score: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow"
                >
                  Certify &amp; Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
