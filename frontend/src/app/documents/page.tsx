'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import apiClient from '@/lib/api';
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
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileBadge,
} from 'lucide-react';

interface DocumentRecord {
  id: string;
  code: string;
  employee_code?: string;
  employee_name?: string;
  employee_name_en?: string;
  employee_name_kh?: string;
  document_type: string;
  title: string;
  document_number?: string;
  issue_date?: string | null;
  expiry_date?: string | null;
  days_to_expiry?: number | null;
  is_confidential: boolean;
}

const INITIAL_DOCS: DocumentRecord[] = [
  {
    id: 'd1',
    code: 'EMP-001',
    employee_name_en: 'Sokha Heng',
    employee_name_kh: 'ហេង សុខា',
    document_type: 'NATIONAL_ID',
    title: 'Cambodia National Identification Card',
    document_number: '010203040',
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
    document_type: 'PASSPORT',
    title: 'Kingdom of Cambodia Official Passport',
    document_number: 'N01928374',
    issue_date: '2016-10-15',
    expiry_date: '2026-10-15',
    days_to_expiry: 28, // Critical alert!
    is_confidential: true,
  },
  {
    id: 'd3',
    code: 'EMP-005',
    employee_name_en: 'Bora Tep',
    employee_name_kh: 'ទេព បូរ៉ា',
    document_type: 'LABOR_BOOK',
    title: 'Cambodia Ministry of Labour Employment Book (Carnet de Travail)',
    document_number: 'LB-998822',
    issue_date: '2022-01-10',
    expiry_date: '2026-11-10',
    days_to_expiry: 54, // Warning alert!
    is_confidential: false,
  },
];

export default function DocumentsPage() {
  const { language } = useLanguageCurrency();
  const [documents, setDocuments] = useState<DocumentRecord[]>(INITIAL_DOCS);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [docForm, setDocForm] = useState({
    employee_code: 'EMP-002',
    employee_id: 'emp-2',
    document_type: 'PASSPORT',
    title: 'Kingdom of Cambodia Official Passport',
    document_number: 'N00998877',
    issue_date: '2022-01-01',
    expiry_date: '2027-01-01',
    file_url: 'https://vault.camtech.com.kh/docs/n00998877.pdf',
  });

  useEffect(() => {
    apiClient
      .get('/documents')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const loaded: DocumentRecord[] = res.data.data.map((d: any) => ({
            id: d.id,
            code: d.employee_code,
            employee_name_en: d.employee_name,
            employee_name_kh: d.employee_name_kh,
            document_type: d.document_type,
            title: d.title,
            document_number: d.document_number,
            issue_date: d.issue_date,
            expiry_date: d.expiry_date,
            days_to_expiry: d.days_to_expiry,
            is_confidential: d.is_confidential,
          }));
          setDocuments(loaded);
        }
      })
      .catch(() => {});
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expiry = new Date(docForm.expiry_date);
    const today = new Date();
    const daysLeft = Math.round((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

    const newDoc: DocumentRecord = {
      id: `doc-${Date.now()}`,
      code: docForm.employee_code,
      employee_name_en: 'Dara Chan',
      employee_name_kh: 'ចាន់ ដារ៉ា',
      document_type: docForm.document_type,
      title: docForm.title,
      document_number: docForm.document_number,
      issue_date: docForm.issue_date,
      expiry_date: docForm.expiry_date,
      days_to_expiry: daysLeft,
      is_confidential: true,
    };

    setDocuments([newDoc, ...documents]);
    setShowUploadModal(false);

    try {
      await apiClient.post('/documents', {
        employee_id: docForm.employee_id,
        document_type: docForm.document_type,
        title: docForm.title,
        document_number: docForm.document_number,
        file_url: docForm.file_url,
        issue_date: docForm.issue_date,
        expiry_date: docForm.expiry_date,
        is_confidential: true,
      });
    } catch (err) {
      // optimistic
    }
  };

  const filteredDocs = documents.filter((d) => {
    if (typeFilter !== 'ALL' && d.document_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.code.toLowerCase().includes(q) ||
        (d.employee_name_en && d.employee_name_en.toLowerCase().includes(q)) ||
        d.title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = documents.filter(
    (d) => d.days_to_expiry !== null && d.days_to_expiry !== undefined && d.days_to_expiry <= 30
  ).length;

  const warningCount = documents.filter(
    (d) =>
      d.days_to_expiry !== null &&
      d.days_to_expiry !== undefined &&
      d.days_to_expiry > 30 &&
      d.days_to_expiry <= 60
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'បណ្ណសារឯកសារ & តាមដានសុពលភាព' : 'Document Vault & Expiration Radar'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Encrypted Storage
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'km'
              ? 'រក្សាទុកឯកសារផ្លូវការ អត្តសញ្ញាណប័ណ្ណ លិខិតឆ្លងដែន សៀវភៅការងារ និងតាមដានការផុតកំណត់ស្វ័យប្រវត្តិ។'
              : 'Secure encrypted repository for employee national IDs, passports, labor books, and automated renewal alerts.'}
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Expiry Alerts Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wide flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Critical Expiry (&le; 30 Days)</span>
            </span>
            <p className="text-2xl font-bold text-rose-950 font-mono">{criticalCount} Documents</p>
          </div>
          <span className="px-2.5 py-1 rounded text-xs font-bold bg-rose-600 text-white">Action Required</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Upcoming Warning (&le; 60 Days)</span>
            </span>
            <p className="text-2xl font-bold text-amber-950 font-mono">{warningCount} Documents</p>
          </div>
          <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-600 text-white">Renewal Prep</span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Valid &amp; Compliant</span>
            </span>
            <p className="text-2xl font-bold text-emerald-950 font-mono">
              {documents.length - criticalCount - warningCount} Documents
            </p>
          </div>
          <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-600 text-white">Protected</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document title, employee code..."
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="NATIONAL_ID">National ID</option>
            <option value="PASSPORT">Passport</option>
            <option value="LABOR_BOOK">Labor Book (Carnet)</option>
            <option value="CONTRACT">Employment Contract</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Document Details</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Document Number</th>
                <th className="px-5 py-3.5">Expiry Date</th>
                <th className="px-5 py-3.5">Radar Status</th>
                <th className="px-5 py-3.5 text-center">Security</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => {
                const days = doc.days_to_expiry;
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{doc.employee_name_en}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{doc.code}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900">{doc.title}</div>
                      <div className="text-[10px] text-slate-400">Issued: {doc.issue_date || 'N/A'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                        {doc.document_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-800 font-medium">
                      {doc.document_number || '--'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700 font-medium">
                      {doc.expiry_date || 'Does not expire'}
                    </td>
                    <td className="px-5 py-3.5">
                      {days !== null && days !== undefined ? (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            days <= 30
                              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                              : days <= 60
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {days <= 0 ? 'EXPIRED' : `${days} days left`}
                        </span>
                      ) : (
                        <span className="text-slate-400">Lifetime</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center space-x-1 text-[11px] text-slate-500 font-medium">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span>Encrypted</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">Upload &amp; Register Document</h4>
                <p className="text-xs text-slate-500">Store in encrypted vault and activate expiry alerts</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Employee</label>
                <select
                  value={docForm.employee_code}
                  onChange={(e) => {
                    const code = e.target.value;
                    const map: any = { 'EMP-001': 'emp-1', 'EMP-002': 'emp-2', 'EMP-003': 'emp-3', 'EMP-004': 'emp-4', 'EMP-005': 'emp-5' };
                    setDocForm({ ...docForm, employee_code: code, employee_id: map[code] });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="EMP-002">EMP-002 - Dara Chan (Finance)</option>
                  <option value="EMP-001">EMP-001 - Sokha Heng (HR)</option>
                  <option value="EMP-003">EMP-003 - Visal Keo (Engineering)</option>
                  <option value="EMP-004">EMP-004 - Rathana Som (Engineering)</option>
                  <option value="EMP-005">EMP-005 - Bora Tep (Sales)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Document Category</label>
                  <select
                    value={docForm.document_type}
                    onChange={(e) => setDocForm({ ...docForm, document_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PASSPORT">Passport</option>
                    <option value="NATIONAL_ID">National ID Card</option>
                    <option value="LABOR_BOOK">Labor Book (Carnet de Travail)</option>
                    <option value="WORK_PERMIT">Foreigner Work Permit</option>
                    <option value="CONTRACT">Employment Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Document Number</label>
                  <input
                    type="text"
                    required
                    value={docForm.document_number}
                    onChange={(e) => setDocForm({ ...docForm, document_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={docForm.issue_date}
                    onChange={(e) => setDocForm({ ...docForm, issue_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Expiration Date</label>
                  <input
                    type="date"
                    required
                    value={docForm.expiry_date}
                    onChange={(e) => setDocForm({ ...docForm, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow"
                >
                  Encrypt &amp; Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
