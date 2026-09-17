'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import {
  Building2,
  Users,
  Briefcase,
  Plus,
  ChevronRight,
  ChevronDown,
  Layers,
  Search,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import apiClient from '@/lib/api';

interface PositionItem {
  id: string;
  code: string;
  title_en: string;
  title_kh: string;
  job_grade: string;
  headcount_budget: number;
  min_salary: number;
  max_salary: number;
}

interface DepartmentItem {
  id: string;
  code: string;
  name_en: string;
  name_kh: string;
  positions: PositionItem[];
}

interface CompanyItem {
  id: string;
  name_en: string;
  name_kh: string;
  code: string;
  departments: DepartmentItem[];
}

const INITIAL_ORG_DATA: CompanyItem[] = [
  {
    id: 'c1',
    code: 'CAMTECH',
    name_en: 'CamTech Solutions Co., Ltd.',
    name_kh: 'ក្រុមហ៊ុន ខេមតិច សូលូសិន ឯ.ក',
    departments: [
      {
        id: 'd1',
        code: 'DEP-HR',
        name_en: 'Human Resources',
        name_kh: 'នាយកដ្ឋានធនធានមនុស្ស',
        positions: [
          {
            id: 'p1',
            code: 'POS-HRD',
            title_en: 'HR Director',
            title_kh: 'ប្រធានផ្នែកធនធានមនុស្ស',
            job_grade: 'GRADE-E1',
            headcount_budget: 1,
            min_salary: 1500,
            max_salary: 3000,
          },
          {
            id: 'p2',
            code: 'POS-HRO',
            title_en: 'HR Officer',
            title_kh: 'មន្ត្រីធនធានមនុស្ស',
            job_grade: 'GRADE-S1',
            headcount_budget: 2,
            min_salary: 500,
            max_salary: 900,
          },
        ],
      },
      {
        id: 'd2',
        code: 'DEP-FIN',
        name_en: 'Finance & Accounting',
        name_kh: 'នាយកដ្ឋានហិរញ្ញវត្ថុ',
        positions: [
          {
            id: 'p3',
            code: 'POS-ACC',
            title_en: 'Senior Accountant',
            title_kh: 'គណនេយ្យករជាន់ខ្ពស់',
            job_grade: 'GRADE-S2',
            headcount_budget: 2,
            min_salary: 800,
            max_salary: 1500,
          },
        ],
      },
      {
        id: 'd3',
        code: 'DEP-ENG',
        name_en: 'Software Engineering',
        name_kh: 'នាយកដ្ឋានវិស្វកម្មបច្ចេកវិទ្យា',
        positions: [
          {
            id: 'p4',
            code: 'POS-ENG-SR',
            title_en: 'Senior Software Engineer',
            title_kh: 'វិស្វករផ្នែកទន់ជាន់ខ្ពស់',
            job_grade: 'GRADE-S2',
            headcount_budget: 10,
            min_salary: 1200,
            max_salary: 2500,
          },
          {
            id: 'p5',
            code: 'POS-ENG-JR',
            title_en: 'Software Engineer',
            title_kh: 'វិស្វករផ្នែកទន់',
            job_grade: 'GRADE-S1',
            headcount_budget: 15,
            min_salary: 600,
            max_salary: 1200,
          },
        ],
      },
      {
        id: 'd4',
        code: 'DEP-SALES',
        name_en: 'Sales & Marketing',
        name_kh: 'នាយកដ្ឋានលក់ និងទីផ្សារ',
        positions: [
          {
            id: 'p6',
            code: 'POS-SALES',
            title_en: 'Sales Executive',
            title_kh: 'មន្ត្រីទំនាក់ទំនងលក់',
            job_grade: 'GRADE-S1',
            headcount_budget: 8,
            min_salary: 450,
            max_salary: 1000,
          },
        ],
      },
      {
        id: 'd5',
        code: 'DEP-OPS',
        name_en: 'Operations',
        name_kh: 'នាយកដ្ឋានប្រតិបត្តិការ',
        positions: [
          {
            id: 'p7',
            code: 'POS-OPS-MGR',
            title_en: 'Operations Manager',
            title_kh: 'ប្រធានផ្នែកប្រតិបត្តិការ',
            job_grade: 'GRADE-M1',
            headcount_budget: 1,
            min_salary: 1200,
            max_salary: 2200,
          },
        ],
      },
    ],
  },
];

export default function OrganizationPage() {
  const { t, formatMoney, language, exchangeRate } = useLanguageCurrency();
  const [orgData, setOrgData] = useState<CompanyItem[]>(INITIAL_ORG_DATA);
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({
    d1: true,
    d2: true,
    d3: true,
    d4: true,
    d5: true,
  });
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptNameEn, setNewDeptNameEn] = useState('');
  const [newDeptNameKh, setNewDeptNameKh] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  const toggleDept = (id: string) => {
    setExpandedDepts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptNameEn || !newDeptCode) return;

    const newDept: DepartmentItem = {
      id: `d-${Date.now()}`,
      code: newDeptCode.toUpperCase(),
      name_en: newDeptNameEn,
      name_kh: newDeptNameKh || newDeptNameEn,
      positions: [],
    };

    setOrgData((prev) => [
      {
        ...prev[0],
        departments: [...prev[0].departments, newDept],
      },
    ]);
    setShowAddDeptModal(false);
    setNewDeptNameEn('');
    setNewDeptNameKh('');
    setNewDeptCode('');
  };

  const totalPositions = orgData[0].departments.reduce(
    (acc, d) => acc + d.positions.reduce((pAcc, p) => pAcc + p.headcount_budget, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'រចនាសម្ព័ន្ធស្ថាប័ន & តួនាទី' : 'Organization & Position Hierarchy'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              {orgData[0].code}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'km'
              ? 'គ្រប់គ្រងដេប៉ាតឺម៉ង់ តួនាទីការងារ ថ្នាក់កម្រិតការងារ និងកូតាបុគ្គលិកដែលបានអនុម័ត។'
              : 'Manage company departments, position definitions, job grades, and approved headcount budgets.'}
          </p>
        </div>

        <button
          onClick={() => setShowAddDeptModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'km' ? 'បន្ថែមដេប៉ាតឺម៉ង់ថ្មី' : 'Add Department'}</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Departments</p>
            <p className="text-2xl font-bold text-slate-900">{orgData[0].departments.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Defined Positions</p>
            <p className="text-2xl font-bold text-slate-900">
              {orgData[0].departments.reduce((acc, d) => acc + d.positions.length, 0)}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Headcount Capacity</p>
            <p className="text-2xl font-bold text-slate-900">{totalPositions} Seats</p>
          </div>
        </div>
      </div>

      {/* Visual Hierarchy Tree */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        {/* Company Node */}
        <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg">
              {orgData[0].code.slice(0, 3)}
            </div>
            <div>
              <h3 className="text-base font-bold">
                {language === 'km' ? orgData[0].name_kh : orgData[0].name_en}
              </h3>
              <p className="text-xs text-slate-400 font-khmer">
                {language === 'km' ? orgData[0].name_en : orgData[0].name_kh}
              </p>
            </div>
          </div>
          <span className="text-xs bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full border border-indigo-500/40">
            Headquarters &bull; Phnom Penh
          </span>
        </div>

        {/* Departments List */}
        <div className="space-y-3 pt-2">
          {orgData[0].departments.map((dept) => {
            const isExpanded = expandedDepts[dept.id];
            const deptHeadcount = dept.positions.reduce((acc, p) => acc + p.headcount_budget, 0);

            return (
              <div key={dept.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleDept(dept.id)}
                  className="w-full bg-slate-50 hover:bg-slate-100/80 p-4 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <div className="text-left">
                      <span className="font-bold text-sm text-slate-900">
                        {language === 'km' ? dept.name_kh : dept.name_en}
                      </span>
                      <span className="ml-2 text-xs font-mono text-slate-400">({dept.code})</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold border border-indigo-100">
                      {dept.positions.length} Positions &bull; {deptHeadcount} Headcount
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-white divide-y divide-slate-100">
                    {dept.positions.length > 0 ? (
                      dept.positions.map((pos) => (
                        <div
                          key={pos.id}
                          className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-50/50 px-2 rounded-lg transition"
                        >
                          <div className="flex items-center space-x-3">
                            <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                            <div>
                              <div className="font-semibold text-slate-900">
                                {language === 'km' ? pos.title_kh : pos.title_en}
                              </div>
                              <div className="text-[11px] text-slate-400 font-khmer">
                                {language === 'km' ? pos.title_en : pos.title_kh}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-medium">
                              {pos.job_grade}
                            </span>
                            <span className="text-slate-600 font-medium">
                              Budget Band:{' '}
                              <strong className="text-slate-900 font-mono">
                                ${pos.min_salary} - ${pos.max_salary} USD
                              </strong>
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              {pos.headcount_budget} Seat{pos.headcount_budget > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">
                        No positions defined in this department yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900">Add New Department</h4>
              <button
                onClick={() => setShowAddDeptModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDept} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Department Code (e.g. DEP-MKT)
                </label>
                <input
                  type="text"
                  required
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  placeholder="DEP-..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Department Name (English)
                </label>
                <input
                  type="text"
                  required
                  value={newDeptNameEn}
                  onChange={(e) => setNewDeptNameEn(e.target.value)}
                  placeholder="e.g. Marketing & Communications"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Department Name (Khmer ខ្មែរ)
                </label>
                <input
                  type="text"
                  value={newDeptNameKh}
                  onChange={(e) => setNewDeptNameKh(e.target.value)}
                  placeholder="ឧ. នាយកដ្ឋានទីផ្សារ និងទំនាក់ទំនង"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-khmer"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
