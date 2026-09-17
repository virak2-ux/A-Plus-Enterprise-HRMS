'use client';

import React, { useState, useMemo } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Search,
  Filter,
  UserPlus,
  ArrowUpDown,
  Eye,
  FileText,
  CheckCircle2,
  Building,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';

interface EmployeeRecord {
  id: string;
  code: string;
  name_en: string;
  name_kh: string;
  department: string;
  position_en: string;
  position_kh: string;
  status: 'ACTIVE' | 'PROBATION' | 'CONFIRMED' | 'RESIGNED';
  type: 'PERMANENT_UDC' | 'FIXED_TERM_FDC';
  join_date: string;
  base_salary_usd: number;
}

const INITIAL_EMPLOYEES: EmployeeRecord[] = [
  {
    id: '1',
    code: 'EMP-001',
    name_en: 'Sokha Heng',
    name_kh: 'ហេង សុខា',
    department: 'Human Resources',
    position_en: 'HR Director',
    position_kh: 'ប្រធានផ្នែកធនធានមនុស្ស',
    status: 'ACTIVE',
    type: 'PERMANENT_UDC',
    join_date: '2023-01-15',
    base_salary_usd: 2200,
  },
  {
    id: '2',
    code: 'EMP-002',
    name_en: 'Dara Chan',
    name_kh: 'ចាន់ ដារ៉ា',
    department: 'Finance & Accounting',
    position_en: 'Senior Accountant',
    position_kh: 'គណនេយ្យករជាន់ខ្ពស់',
    status: 'ACTIVE',
    type: 'PERMANENT_UDC',
    join_date: '2023-03-01',
    base_salary_usd: 1100,
  },
  {
    id: '3',
    code: 'EMP-003',
    name_en: 'Visal Keo',
    name_kh: 'កែវ វិសាល',
    department: 'Software Engineering',
    position_en: 'Senior Software Engineer',
    position_kh: 'វិស្វករផ្នែកទន់ជាន់ខ្ពស់',
    status: 'ACTIVE',
    type: 'PERMANENT_UDC',
    join_date: '2023-06-01',
    base_salary_usd: 1800,
  },
  {
    id: '4',
    code: 'EMP-004',
    name_en: 'Rathana Som',
    name_kh: 'សោម រតនា',
    department: 'Software Engineering',
    position_en: 'Software Engineer',
    position_kh: 'វិស្វករផ្នែកទន់',
    status: 'CONFIRMED',
    type: 'PERMANENT_UDC',
    join_date: '2024-02-01',
    base_salary_usd: 780,
  },
  {
    id: '5',
    code: 'EMP-005',
    name_en: 'Bora Tep',
    name_kh: 'ទេព បូរ៉ា',
    department: 'Sales & Marketing',
    position_en: 'Sales Executive',
    position_kh: 'មន្ត្រីទំនាក់ទំនងលក់',
    status: 'PROBATION',
    type: 'FIXED_TERM_FDC',
    join_date: '2024-05-10',
    base_salary_usd: 650,
  },
];

export default function EmployeesPage() {
  const { t, formatMoney, language, exchangeRate } = useLanguageCurrency();
  const [data, setData] = useState<EmployeeRecord[]>(INITIAL_EMPLOYEES);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStatus, setImportStatus] = useState<'IDLE' | 'PARSED' | 'COMMITTED'>('IDLE');

  const [newEmp, setNewEmp] = useState({
    name_en: '',
    name_kh: '',
    department: 'Software Engineering',
    position_en: '',
    position_kh: '',
    type: 'PERMANENT_UDC' as 'PERMANENT_UDC' | 'FIXED_TERM_FDC',
    join_date: '2026-03-01',
    base_salary_usd: 1200,
  });

  const sampleImportRows: EmployeeRecord[] = [
    {
      id: 'imp-1',
      code: `EMP-00${data.length + 1}`,
      name_en: 'Channary Ouk',
      name_kh: 'អ៊ុក ចាន់ណារី',
      department: 'Software Engineering',
      position_en: 'QA Automation Engineer',
      position_kh: 'វិស្វករតេស្តស្វ័យប្រវត្តិ',
      status: 'ACTIVE',
      type: 'PERMANENT_UDC',
      join_date: '2026-03-15',
      base_salary_usd: 1400,
    },
    {
      id: 'imp-2',
      code: `EMP-00${data.length + 2}`,
      name_en: 'Samnang Phea',
      name_kh: 'ភា សំណាង',
      department: 'Finance & Accounting',
      position_en: 'Financial Analyst',
      position_kh: 'អ្នកវិភាគហិរញ្ញវត្ថុ',
      status: 'CONFIRMED',
      type: 'PERMANENT_UDC',
      join_date: '2026-03-15',
      base_salary_usd: 1350,
    },
  ];

  const handleDownloadTemplate = () => {
    const csvContent =
      'employee_code,first_name_kh,last_name_kh,first_name_en,last_name_en,gender,date_of_birth,phone_primary,email_work,department_name,position_title,join_date,base_salary,salary_currency,employment_type,bank_name,bank_account_number,is_resident_for_tax,spouse_dependent_count,minor_children_count\n' +
      'EMP-010,សុវណ្ណ,លឹម,Sovann,Lim,MALE,1992-05-14,+855 12 888 999,sovann.lim@camtech.com.kh,Software Engineering,Senior Backend Engineer,2026-03-01,1600.00,USD,PERMANENT_UDC,ABA Bank,001 555 999,TRUE,1,2\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Cambodia_HRMS_Employee_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name_en) return;
    const nextCode = `EMP-${String(data.length + 1).padStart(3, '0')}`;
    const created: EmployeeRecord = {
      id: String(Date.now()),
      code: nextCode,
      name_en: newEmp.name_en,
      name_kh: newEmp.name_kh || newEmp.name_en,
      department: newEmp.department,
      position_en: newEmp.position_en || 'Staff',
      position_kh: newEmp.position_kh || 'បុគ្គលិក',
      status: 'ACTIVE',
      type: newEmp.type,
      join_date: newEmp.join_date,
      base_salary_usd: Number(newEmp.base_salary_usd),
    };
    setData([created, ...data]);
    setShowAddModal(false);
    setNewEmp({
      name_en: '',
      name_kh: '',
      department: 'Software Engineering',
      position_en: '',
      position_kh: '',
      type: 'PERMANENT_UDC',
      join_date: '2026-03-01',
      base_salary_usd: 1200,
    });
  };

  const handleCommitImport = () => {
    setData([...sampleImportRows, ...data]);
    setImportStatus('COMMITTED');
    setTimeout(() => {
      setShowImportModal(false);
      setImportStatus('IDLE');
    }, 1200);
  };

  const filteredData = useMemo(() => {
    if (selectedDept === 'ALL') return data;
    return data.filter((emp) => emp.department === selectedDept);
  }, [data, selectedDept]);

  const columns = useMemo<ColumnDef<EmployeeRecord>[]>(
    () => [
      {
        accessorKey: 'code',
        header: t('employees.col_code'),
        cell: ({ getValue }) => (
          <span className="font-mono font-semibold text-slate-900 text-xs bg-slate-100 px-2 py-1 rounded">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'name_en',
        header: language === 'km' ? t('employees.col_name_kh') : t('employees.col_name_en'),
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-slate-900">
              {language === 'km' ? row.original.name_kh : row.original.name_en}
            </div>
            <div className="text-xs text-slate-400 font-khmer">
              {language === 'km' ? row.original.name_en : row.original.name_kh}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'department',
        header: t('employees.col_department'),
        cell: ({ row }) => (
          <div>
            <div className="text-xs font-medium text-slate-700">{row.original.department}</div>
            <div className="text-[11px] text-slate-500 font-khmer">
              {language === 'km' ? row.original.position_kh : row.original.position_en}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('employees.col_status'),
        cell: ({ getValue }) => {
          const val = getValue<string>();
          const styles: Record<string, string> = {
            ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            CONFIRMED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            PROBATION: 'bg-amber-50 text-amber-700 border-amber-200',
            RESIGNED: 'bg-rose-50 text-rose-700 border-rose-200',
          };
          return (
            <span
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                styles[val] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {val}
            </span>
          );
        },
      },
      {
        accessorKey: 'type',
        header: t('employees.col_type'),
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return (
            <span className="text-xs text-slate-600 font-mono">
              {val === 'PERMANENT_UDC' ? 'UDC (Permanent)' : 'FDC (Fixed)'}
            </span>
          );
        },
      },
      {
        accessorKey: 'join_date',
        header: t('employees.col_join_date'),
        cell: ({ getValue }) => <span className="text-xs text-slate-600">{getValue<string>()}</span>,
      },
      {
        id: 'actions',
        header: t('employees.col_actions'),
        cell: ({ row }) => (
          <button
            onClick={() => setSelectedEmployee(row.original)}
            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
        ),
      },
    ],
    [t, language]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('employees.title')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t('employees.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Bulk Import</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('employees.add_employee')}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t('employees.search_placeholder')}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">{t('employees.filter_dept')}</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance & Accounting">Finance & Accounting</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Sales & Marketing">Sales & Marketing</option>
            </select>
          </div>
        </div>
      </div>

      {/* TanStack Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-5 py-3.5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-3.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-8 text-center text-slate-400 text-sm">
                    No matching employee records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {table.getRowModel().rows.length} of {filteredData.length} records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 360 Degree Employee Profile Drawer / Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedEmployee.name_en}</h3>
                  <p className="text-xs text-slate-500 font-khmer">{selectedEmployee.name_kh}</p>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Profile Details */}
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Employee Code:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedEmployee.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Department:</span>
                    <span className="font-semibold text-slate-800">{selectedEmployee.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Position:</span>
                    <span className="font-semibold text-slate-800">{selectedEmployee.position_en}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Contract Type:</span>
                    <span className="font-mono text-slate-800">{selectedEmployee.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Join Date:</span>
                    <span className="text-slate-800">{selectedEmployee.join_date}</span>
                  </div>
                </div>

                {/* Compensation Card (Protected) */}
                <div className="bg-indigo-50/50 p-4 rounded-lg space-y-2 border border-indigo-100">
                  <div className="text-indigo-900 font-bold flex items-center justify-between">
                    <span>Statutory Compensation</span>
                    <span className="text-[10px] bg-indigo-200/60 text-indigo-800 px-1.5 py-0.5 rounded">
                      Authorized Only
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-slate-600">Base Salary:</span>
                    <span className="font-bold text-slate-900">
                      {formatMoney(selectedEmployee.base_salary_usd * exchangeRate)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Contract Currency:</span>
                    <span className="font-semibold text-slate-900">USD ($)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Payment Channel:</span>
                    <span className="text-slate-900">ABA Bank Transfer</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add New Employee</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddEmployeeSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Full Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={newEmp.name_en}
                    onChange={(e) => setNewEmp({ ...newEmp, name_en: e.target.value })}
                    placeholder="e.g. Socheat Roeun"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Full Name (Khmer)</label>
                  <input
                    type="text"
                    value={newEmp.name_kh}
                    onChange={(e) => setNewEmp({ ...newEmp, name_kh: e.target.value })}
                    placeholder="e.g. រឿន សុជាត"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 font-khmer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Department</label>
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance & Accounting">Finance & Accounting</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Position Title</label>
                  <input
                    type="text"
                    value={newEmp.position_en}
                    onChange={(e) => setNewEmp({ ...newEmp, position_en: e.target.value })}
                    placeholder="e.g. Fullstack Developer"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Contract Type</label>
                  <select
                    value={newEmp.type}
                    onChange={(e) => setNewEmp({ ...newEmp, type: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="PERMANENT_UDC">UDC (Perm)</option>
                    <option value="FIXED_TERM_FDC">FDC (Fixed)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Join Date</label>
                  <input
                    type="date"
                    value={newEmp.join_date}
                    onChange={(e) => setNewEmp({ ...newEmp, join_date: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Salary (USD)</label>
                  <input
                    type="number"
                    value={newEmp.base_salary_usd}
                    onChange={(e) => setNewEmp({ ...newEmp, base_salary_usd: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-sm"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Excel/CSV Import Wizard Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Bulk Employee Excel / CSV Onboarding</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Template Download Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">1. Download Template Spreadsheet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Includes mandatory fields for Cambodia GDT Tax, NSSF number, and ABA Bank account structure.
                </p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition shrink-0 ml-4"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Get Template (.csv)</span>
              </button>
            </div>

            {/* Upload & Dry Run Diagnostic Preview */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800">2. Dry-Run Validation Preview</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ✓ 2 Valid Rows Detected &bull; 0 Errors
                </span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Department</th>
                      <th className="p-2.5">Position</th>
                      <th className="p-2.5 text-right">Salary (USD)</th>
                      <th className="p-2.5 text-center">Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {sampleImportRows.map((r) => (
                      <tr key={r.code} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-indigo-600">{r.code}</td>
                        <td className="p-2.5">{r.name_en} ({r.name_kh})</td>
                        <td className="p-2.5">{r.department}</td>
                        <td className="p-2.5">{r.position_en}</td>
                        <td className="p-2.5 text-right font-mono">${r.base_salary_usd}</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">PASS</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commit controls */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Audited & committed to PostgreSQL in isolated transaction.
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommitImport}
                  disabled={importStatus === 'COMMITTED'}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{importStatus === 'COMMITTED' ? 'Successfully Enrolled!' : 'Commit & Import to HRMS'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

