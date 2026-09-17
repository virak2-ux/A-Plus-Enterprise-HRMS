'use client';

import React, { useState } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
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
} from 'lucide-react';

interface ReviewScorecard {
  id: string;
  code: string;
  name_en: string;
  name_kh: string;
  department: string;
  position: string;
  cycle: string;
  self_score: number;
  manager_score: number;
  final_score: number;
  status: 'COMPLETED' | 'IN_REVIEW' | 'PENDING_SELF';
}

interface CourseItem {
  id: string;
  title_en: string;
  title_kh: string;
  provider: string;
  duration_hours: number;
  cost_usd: number;
  enrolled_count: number;
}

const SAMPLE_REVIEWS: ReviewScorecard[] = [
  {
    id: 'r1',
    code: 'EMP-001',
    name_en: 'Sokha Heng',
    name_kh: 'ហេង សុខា',
    department: 'Human Resources',
    position: 'HR Director',
    cycle: '2026 Mid-Year Review',
    self_score: 4.8,
    manager_score: 4.9,
    final_score: 4.85,
    status: 'COMPLETED',
  },
  {
    id: 'r2',
    code: 'EMP-003',
    name_en: 'Visal Keo',
    name_kh: 'កែវ វិសាល',
    department: 'Software Engineering',
    position: 'Senior Software Engineer',
    cycle: '2026 Mid-Year Review',
    self_score: 4.5,
    manager_score: 4.7,
    final_score: 4.6,
    status: 'COMPLETED',
  },
  {
    id: 'r3',
    code: 'EMP-004',
    name_en: 'Rathana Som',
    name_kh: 'សោម រតនា',
    department: 'Software Engineering',
    position: 'Software Engineer',
    cycle: '2026 Mid-Year Review',
    self_score: 4.0,
    manager_score: 4.2,
    final_score: 4.1,
    status: 'IN_REVIEW',
  },
];

const SAMPLE_COURSES: CourseItem[] = [
  {
    id: 'c1',
    title_en: 'Cambodia Labor Law & NSSF Compliance',
    title_kh: 'ច្បាប់ការងារកម្ពុជា និងអនុលោមភាព ប.ស.ស',
    provider: 'CamHR Legal Institute',
    duration_hours: 16,
    cost_usd: 250,
    enrolled_count: 8,
  },
  {
    id: 'c2',
    title_en: 'Cloud Architecture with PostgreSQL & Docker',
    title_kh: 'ស្ថាបត្យកម្ម Cloud ជាមួយ PostgreSQL & Docker',
    provider: 'TechCambodia Academy',
    duration_hours: 40,
    cost_usd: 500,
    enrolled_count: 14,
  },
  {
    id: 'c3',
    title_en: 'Financial Accounting & Cambodian Tax on Salary',
    title_kh: 'គណនេយ្យហិរញ្ញវត្ថុ និងពន្ធលើប្រាក់បៀវត្សកម្ពុជា',
    provider: 'KPMG Cambodia Training',
    duration_hours: 24,
    cost_usd: 350,
    enrolled_count: 6,
  },
];

export default function TalentPage() {
  const { language } = useLanguageCurrency();
  const [activeTab, setActiveTab] = useState<'PERFORMANCE' | 'TRAINING'>('PERFORMANCE');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'ការវាយតម្លៃ & ការបណ្តុះបណ្តាល' : 'Performance & Professional Training'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Talent Management
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Conduct 360 performance reviews, evaluate KPIs, and track employee certified training programs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
          <button
            onClick={() => setActiveTab('PERFORMANCE')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'PERFORMANCE'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Performance Reviews</span>
          </button>
          <button
            onClick={() => setActiveTab('TRAINING')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'TRAINING'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Training Courses</span>
          </button>
        </div>
      </div>

      {activeTab === 'PERFORMANCE' ? (
        <div className="space-y-4">
          {/* Performance Cycles Banner */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Active Review Cycle: 2026 Mid-Year Appraisal</h4>
                <p className="text-xs text-slate-500">Rating Scale: 1.0 (Needs Improvement) to 5.0 (Exceeds Expectations)</p>
              </div>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold border border-emerald-200">
              88% Completed
            </span>
          </div>

          {/* Performance Scorecards Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Department &amp; Position</th>
                  <th className="px-5 py-3.5">Self Score</th>
                  <th className="px-5 py-3.5">Manager Score</th>
                  <th className="px-5 py-3.5">Final Score</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SAMPLE_REVIEWS.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">
                        {language === 'km' ? rev.name_kh : rev.name_en}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{rev.code}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      <div>{rev.position}</div>
                      <div className="text-[10px] text-slate-400">{rev.department}</div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-700">{rev.self_score.toFixed(1)} / 5.0</td>
                    <td className="px-5 py-3.5 font-bold text-indigo-600">{rev.manager_score.toFixed(1)} / 5.0</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-1 font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{rev.final_score.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          rev.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {rev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SAMPLE_COURSES.map((course) => (
            <div
              key={course.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="text-[11px] font-mono text-indigo-600 font-bold uppercase">
                    {course.provider}
                  </span>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                    {course.duration_hours} Hours
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {language === 'km' ? course.title_kh : course.title_en}
                </h4>
                <p className="text-xs text-slate-400 mt-1 font-khmer">
                  {language === 'km' ? course.title_en : course.title_kh}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">${course.cost_usd} USD/seat</span>
                <span className="text-emerald-700 font-semibold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {course.enrolled_count} Enrolled
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
