'use client';

import React, { useState } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import {
  FileText,
  Upload,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Lock,
  Plus,
} from 'lucide-react';

interface DocumentRecord {
  id: string;
  code: string;
  employee_name_en: string;
  employee_name_kh: string;
  doc_type: 'NATIONAL_ID' | 'PASSPORT' | 'CONTRACT' | 'DEGREE' | 'CERTIFICATE';
  title: string;
  doc_number: string;
  issue_date: string;
  expiry_date: string | null;
  days_to_expiry: number | null;
  is_confidential: boolean;
}

const SAMPLE_DOCS: DocumentRecord[] = [
  {
    id: 'd1',
    code: 'EMP-001',
    employee_name_en: 'Sokha Heng',
    employee_name_kh: 'ហេង សុខា',
    doc_type: 'NATIONAL_ID',
    title: 'Cambodia National Identification Card',
    doc_number: '010203040',
    issue_date: '2020-05-10',
    expiry_date: '2030-05-10',
    days_to_expiry: 1330,
    is_confidential: true,
  },
  {
    id: 'd2',
    code: 'EMP-003',
    employee_name_en: 'Visal Keo',
    employee_name_kh: 'កែវ វិសាល',
    doc_type: 'PASSPORT',
    title: 'Kingdom of Cambodia Official Passport',
    doc_number: 'N01928374',
    issue_date: '2016-10-15',
    expiry_date: '2026-10-15',
    days_to_expiry: 28, // 30-day alert!
    is_confidential: true,
  },
  {
    id: 'd3',
    code: 'EMP-005',
    employee_name_en: 'Bora Tep',
    employee_name_kh: 'ទេព បូរ៉ា',
    doc_type: 'CONTRACT',
    title: 'Fixed Duration Employment Contract (FDC)',
    doc_number: 'CTR-EMP-005',
    issue_date: '2024-05-10',
    expiry_date: '2026-10-01',
    days_to_expiry: 14, // 14-day alert!
    is_confidential: true,
  },
  {
    id: 'd4',
    code: 'EMP-004',
    employee_name_en: 'Rathana Som',
    employee_name_kh: 'សោម រតនា',
    doc_type: 'DEGREE',
    title: 'Bachelor of Computer Science & Engineering',
    doc_number: 'RUPP-2023-99',
    issue_date: '2023-11-20',
    expiry_date: null,
    days_to_expiry: null,
    is_confidential: false,
  },
];

export default function DocumentsPage() {
  const { language } = useLanguageCurrency();
  const [docs, setDocs] = useState<DocumentRecord[]>(SAMPLE_DOCS);
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = docs.filter((d) => {
    if (filterType !== 'ALL' && d.doc_type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.employee_name_en.toLowerCase().includes(q) ||
        d.doc_number.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const expiringSoonCount = docs.filter(
    (d) => d.days_to_expiry !== null && d.days_to_expiry <= 30
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'មជ្ឈមណ្ឌលគ្រប់គ្រងឯកសារ' : 'Secure Document Center & Expiry Tracking'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Encrypted Private S3
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track National IDs, Passports, Contracts, Degrees, and automated document expiration notices (90, 60, 30, 7 days).
          </p>
        </div>

        <button
          onClick={() => alert('Secure Document Upload Dialog opened')}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Expiry Warning Banner */}
      {expiringSoonCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-900">
              {expiringSoonCount} document(s) expiring within 30 days. Renewal notice dispatched to HR.
            </span>
          </div>
          <span className="text-xs font-bold text-amber-800">Action Required</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by employee, title, ID..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Document Types</option>
            <option value="NATIONAL_ID">National ID</option>
            <option value="PASSPORT">Passport</option>
            <option value="CONTRACT">Contract</option>
            <option value="DEGREE">Degree / Certificate</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Document Title</th>
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Document #</th>
              <th className="px-5 py-3.5">Issue Date</th>
              <th className="px-5 py-3.5">Expiry Date</th>
              <th className="px-5 py-3.5">Expiry Status</th>
              <th className="px-5 py-3.5 text-center">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((doc) => {
              const isUrgent = doc.days_to_expiry !== null && doc.days_to_expiry <= 30;
              return (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                      {doc.is_confidential && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                      <span>{doc.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-800">
                      {language === 'km' ? doc.employee_name_kh : doc.employee_name_en}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{doc.code}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded">
                      {doc.doc_type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-700">{doc.doc_number}</td>
                  <td className="px-5 py-3.5 text-slate-600">{doc.issue_date}</td>
                  <td className="px-5 py-3.5 text-slate-900 font-mono">
                    {doc.expiry_date || 'Does not expire'}
                  </td>
                  <td className="px-5 py-3.5">
                    {doc.days_to_expiry !== null ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isUrgent
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {doc.days_to_expiry} days left
                      </span>
                    ) : (
                      <span className="text-slate-400">Permanent</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => alert(`Generating presigned temporary URL for ${doc.title}...`)}
                      className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                      title="Download Secure File"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
