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
  AlertTriangle,
  TrendingUp,
  DollarSign,
  UserCheck,
  Award,
  ArrowUpRight,
  ShieldAlert,
  GitFork,
  PieChart,
} from 'lucide-react';
import apiClient from '@/lib/api';

interface OrgChartNode {
  id: string;
  employee_code: string;
  name_en: string;
  name_kh: string;
  gender: string;
  email: string;
  phone: string;
  position_title_en: string;
  position_title_kh: string;
  department_name_en: string;
  department_name_kh: string;
  employment_type: string;
  profile_photo_url: string | null;
  base_salary: number;
  salary_currency: string;
  direct_reports_count: number;
  total_subordinates_count: number;
  children: OrgChartNode[];
}

interface DeptBudgetMetric {
  department_id: string;
  code: string;
  name_en: string;
  name_kh: string;
  approved_headcount: number;
  actual_headcount: number;
  vacancies: number;
  utilization_pct: number;
  status: 'OPTIMAL' | 'UNDER_STAFFED' | 'OVER_BUDGET';
  monthly_budget_usd: number;
  actual_burden_usd: number;
  variance_usd: number;
  salary_band_violations: any[];
  positions_count: number;
}

interface BudgetSummary {
  total_approved_headcount: number;
  total_active_headcount: number;
  total_vacancies: number;
  overall_utilization_pct: number;
  total_monthly_budget_usd: number;
  total_actual_burden_usd: number;
  total_variance_usd: number;
  total_salary_band_violations: number;
}

export default function OrganizationPage() {
  const { language, formatMoney, exchangeRate } = useLanguageCurrency();
  const [activeTab, setActiveTab] = useState<'chart' | 'budget' | 'bands'>('chart');
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<OrgChartNode[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [deptBudgets, setDeptBudgets] = useState<DeptBudgetMetric[]>([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [selectedNode, setSelectedNode] = useState<OrgChartNode | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [treeRes, budgetRes] = await Promise.all([
        apiClient.get('/organization/hierarchy-chart'),
        apiClient.get('/organization/budget-analysis'),
      ]);
      if (treeRes.data?.data) {
        setTreeData(treeRes.data.data);
      }
      if (budgetRes.data?.data) {
        setBudgetSummary(budgetRes.data.data.company_summary);
        setDeptBudgets(budgetRes.data.data.departments || []);
      }
    } catch (e) {
      console.error('Failed to load organization data', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: OrgChartNode, level: number = 0) => {
    const isCollapsed = collapsedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;

    const matchesSearch =
      !searchTerm ||
      node.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.name_kh.includes(searchTerm) ||
      node.position_title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.department_name_en.toLowerCase().includes(searchTerm.toLowerCase());

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          onClick={() => setSelectedNode(node)}
          className={`relative z-10 w-72 p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
            matchesSearch
              ? 'bg-white border-slate-200 hover:border-indigo-400'
              : 'bg-slate-50/60 border-slate-200/60 opacity-40'
          } ${selectedNode?.id === node.id ? 'ring-2 ring-indigo-600 border-indigo-600' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner ${
                  level === 0
                    ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white'
                    : level === 1
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {node.name_en
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {language === 'km' ? node.name_kh : node.name_en}
                </h4>
                <p className="text-[11px] text-indigo-600 font-medium line-clamp-1">
                  {language === 'km' ? node.position_title_kh : node.position_title_en}
                </p>
                <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">
                  {node.employee_code}
                </span>
              </div>
            </div>

            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(node.id);
                }}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
                title={isCollapsed ? 'Expand Reports' : 'Collapse Reports'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-medium">
              {language === 'km' ? node.department_name_kh : node.department_name_en}
            </span>
            {hasChildren && (
              <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {node.direct_reports_count} {language === 'km' ? 'កូនចៅផ្ទាល់' : 'Reports'}
              </span>
            )}
          </div>
        </div>

        {/* Tree Line Connector to Children */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical stem from parent */}
            <div className="w-0.5 h-6 bg-slate-300"></div>

            {/* Horizontal branch bar */}
            <div className="flex justify-center relative pt-2">
              <div className="flex space-x-6 items-start">
                {node.children.map((child) => (
                  <div key={child.id} className="relative flex flex-col items-center">
                    {/* Stem into child */}
                    <div className="w-0.5 h-4 bg-slate-300 -mt-2 mb-2"></div>
                    {renderTreeNode(child, level + 1)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>
              {language === 'km'
                ? 'រចនាសម្ព័ន្ធស្ថាប័ន & ផែនការបុគ្គលិក'
                : 'Organization Chart & Headcount Budgeting'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'km'
              ? 'គ្រប់គ្រងខ្សែបណ្តោយស្ថាប័ន ឋានានុក្រមរបាយការណ៍ និងការត្រួតពិនិត្យថវិកាប្រាក់បៀវត្ស'
              : 'Interactive reporting hierarchy, approved headcount quotas, and compensation band compliance.'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'chart'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'ប្លង់រចនាសម្ព័ន្ធ' : 'Visual Org Chart'}</span>
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'budget'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'ផែនការ & ថវិកា' : 'Headcount & Budgeting'}</span>
          </button>
          <button
            onClick={() => setActiveTab('bands')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'bands'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'កម្រិតប្រាក់ខែ' : 'Salary Bands Matrix'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      {budgetSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'km' ? 'កូតាបុគ្គលិកអនុម័ត' : 'Approved Headcount'}
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-slate-900">
                {budgetSummary.total_approved_headcount}
              </span>
              <span className="text-xs text-slate-500">Seats</span>
            </div>
            <span className="text-[10px] text-indigo-600 font-medium">Board Authorized</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'km' ? 'បុគ្គលិកកំពុងបំពេញការងារ' : 'Active Headcount'}
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-emerald-600">
                {budgetSummary.total_active_headcount}
              </span>
              <span className="text-xs text-slate-500">
                ({budgetSummary.overall_utilization_pct}%)
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">
              {budgetSummary.total_vacancies} Open Vacancies
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'km' ? 'ថវិកាប្រាក់បៀវត្សប្រចាំខែ' : 'Monthly Salary Budget'}
            </span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-xl font-black text-slate-900">
                ${budgetSummary.total_monthly_budget_usd.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">USD</span>
            </div>
            <span className="text-[10px] text-slate-500">
              Actual: ${budgetSummary.total_actual_burden_usd.toLocaleString()}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'km' ? 'ស្ថានភាពអនុលោមភាពកម្រិតប្រាក់ខែ' : 'Salary Band Compliance'}
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span
                className={`text-2xl font-black ${
                  budgetSummary.total_salary_band_violations > 0
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {budgetSummary.total_salary_band_violations === 0
                  ? '100%'
                  : `${budgetSummary.total_salary_band_violations} Flags`}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">
              {budgetSummary.total_salary_band_violations === 0
                ? 'All salaries in approved bands'
                : 'Salaries outside Grade min/max'}
            </span>
          </div>
        </div>
      )}

      {/* TAB 1: Visual Org Chart */}
      {activeTab === 'chart' && (
        <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6 shadow-inner space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  language === 'km'
                    ? 'ស្វែងរកតាមឈ្មោះ តួនាទី ឬនាយកដ្ឋាន...'
                    : 'Search by employee, title, or department...'
                }
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => setCollapsedNodes({})}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
              >
                {language === 'km' ? 'ពង្រីកទាំងអស់' : 'Expand All'}
              </button>
              <button
                onClick={() => {
                  const collapsed: Record<string, boolean> = {};
                  const collapseAll = (nodes: OrgChartNode[]) => {
                    for (const n of nodes) {
                      if (n.children && n.children.length > 0) {
                        collapsed[n.id] = true;
                        collapseAll(n.children);
                      }
                    }
                  };
                  collapseAll(treeData);
                  setCollapsedNodes(collapsed);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
              >
                {language === 'km' ? 'បង្រួមទាំងអស់' : 'Collapse All'}
              </button>
            </div>
          </div>

          {/* Org Chart Canvas */}
          <div className="overflow-x-auto py-8 px-4 flex justify-center min-h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center space-x-2 text-slate-400 text-xs py-20">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Building Organizational Tree...</span>
              </div>
            ) : treeData.length > 0 ? (
              <div className="flex flex-col space-y-12 items-center">
                {treeData.map((rootNode) => renderTreeNode(rootNode, 0))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">
                No active employee hierarchy found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Headcount & Budgeting Breakdown */}
      {activeTab === 'budget' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deptBudgets.map((dept) => {
              const fillPct = Math.min(100, dept.utilization_pct);
              return (
                <div
                  key={dept.department_id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {dept.code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {language === 'km' ? dept.name_kh : dept.name_en}
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        dept.status === 'OPTIMAL'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : dept.status === 'OVER_BUDGET'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {dept.status}
                    </span>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 font-medium">Headcount Fill Rate</span>
                      <span className="font-bold text-slate-900">
                        {dept.actual_headcount} / {dept.approved_headcount} ({dept.utilization_pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          dept.status === 'OVER_BUDGET'
                            ? 'bg-rose-500'
                            : dept.status === 'OPTIMAL'
                            ? 'bg-emerald-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${fillPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Monthly Budget
                      </span>
                      <p className="font-bold text-slate-800">${dept.monthly_budget_usd.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Actual Payroll
                      </span>
                      <p className="font-bold text-slate-800">${dept.actual_burden_usd.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      {dept.vacancies > 0 ? (
                        <span className="text-amber-600 font-medium">
                          {dept.vacancies} open position{dept.vacancies > 1 ? 's' : ''} to recruit
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Fully staffed</span>
                      )}
                    </span>
                    <span className="text-slate-400">{dept.positions_count} Job Titles</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Job Grading & Salary Bands Matrix */}
      {activeTab === 'bands' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'km' ? 'តារាងកម្រិតប្រាក់បៀវត្សតាមតួនាទី' : 'Position Salary Grade & Bands Matrix'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'km'
                  ? 'កំណត់កម្រិតប្រាក់បៀវត្សអប្បបរមា និងអតិបរមាស្របតាមស្ដង់ដារទីផ្សារកម្ពុជា'
                  : 'Authorized compensation bands with minimum and maximum thresholds for Cambodian enterprises.'}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
              USD / KHR Benchmark
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Position Title</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Approved Quota</th>
                  <th className="py-2.5 px-3">Min Salary (USD)</th>
                  <th className="py-2.5 px-3">Max Salary (USD)</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">GRADE-E1</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">HR Director</td>
                  <td className="py-2.5 px-3 text-slate-600">Human Resources</td>
                  <td className="py-2.5 px-3 font-mono">1</td>
                  <td className="py-2.5 px-3 font-mono">$1,500.00</td>
                  <td className="py-2.5 px-3 font-mono">$3,000.00</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Compliant
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">GRADE-E1</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">Finance Director</td>
                  <td className="py-2.5 px-3 text-slate-600">Finance &amp; Accounting</td>
                  <td className="py-2.5 px-3 font-mono">1</td>
                  <td className="py-2.5 px-3 font-mono">$1,500.00</td>
                  <td className="py-2.5 px-3 font-mono">$3,000.00</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Compliant
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">GRADE-S2</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">Senior Software Engineer</td>
                  <td className="py-2.5 px-3 text-slate-600">Software Engineering</td>
                  <td className="py-2.5 px-3 font-mono">10</td>
                  <td className="py-2.5 px-3 font-mono">$1,200.00</td>
                  <td className="py-2.5 px-3 font-mono">$2,500.00</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Compliant
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">GRADE-S1</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">Software Engineer</td>
                  <td className="py-2.5 px-3 text-slate-600">Software Engineering</td>
                  <td className="py-2.5 px-3 font-mono">15</td>
                  <td className="py-2.5 px-3 font-mono">$600.00</td>
                  <td className="py-2.5 px-3 font-mono">$1,200.00</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Compliant
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">GRADE-S1</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">Sales Executive</td>
                  <td className="py-2.5 px-3 text-slate-600">Sales &amp; Marketing</td>
                  <td className="py-2.5 px-3 font-mono">8</td>
                  <td className="py-2.5 px-3 font-mono">$450.00</td>
                  <td className="py-2.5 px-3 font-mono">$1,000.00</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Compliant
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Member Quick Detail Modal */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-base shadow">
                  {selectedNode.name_en
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {selectedNode.name_en} ({selectedNode.name_kh})
                  </h3>
                  <p className="text-xs text-indigo-600">{selectedNode.position_title_en}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Employee Code:</span>
                <span className="font-mono font-bold text-slate-800">{selectedNode.employee_code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Department:</span>
                <span className="font-medium text-slate-800">{selectedNode.department_name_en}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Direct Reports:</span>
                <span className="font-bold text-indigo-700">{selectedNode.direct_reports_count} people</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Work Email:</span>
                <span className="text-slate-800 font-mono">{selectedNode.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Contract Type:</span>
                <span className="font-semibold text-emerald-700">{selectedNode.employment_type}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Base Salary:</span>
                <span className="font-mono font-bold text-slate-900">
                  ${selectedNode.base_salary.toLocaleString()} {selectedNode.salary_currency}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedNode(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
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
