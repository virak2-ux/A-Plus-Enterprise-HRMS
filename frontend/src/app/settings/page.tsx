'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import { API_BASE_URL, getValidAuthToken } from '@/lib/api';
import {
  Settings,
  Building,
  DollarSign,
  ShieldCheck,
  Bot,
  Save,
  CheckCircle2,
  Lock,
  Download,
  FileSpreadsheet,
  Archive,
  Database,
  RefreshCw,
  FileText,
  Server,
} from 'lucide-react';

export default function SettingsPage() {
  const { language, exchangeRate } = useLanguageCurrency();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [compNameKh, setCompNameKh] = useState('ក្រុមហ៊ុន ខេមតិច សូលូសិន ឯ.ក');
  const [compNameEn, setCompNameEn] = useState('CamTech Solutions Co., Ltd.');
  const [taxId, setTaxId] = useState('K008-987654321');
  const [nssfId, setNssfId] = useState('0098765432');
  const [rate, setRate] = useState(4100);
  const [dependentRebate, setDependentRebate] = useState(150000);
  const [nssfCeiling, setNssfCeiling] = useState(1200000);

  // AI Privacy States
  const [aiEnabled, setAiEnabled] = useState(false);
  const [allowEmployeeDataToAi, setAllowEmployeeDataToAi] = useState(false);
  const [allowSalaryDataToAi, setAllowSalaryDataToAi] = useState(false);
  const [saving, setSaving] = useState(false);

  // Download / Backup states
  const [downloading, setDownloading] = useState<string | null>(null);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = await getValidAuthToken();
        const res = await fetch(`${API_BASE_URL}/system/settings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          const d = json.data || {};
          if (d.company_name_kh) setCompNameKh(d.company_name_kh);
          if (d.company_name_en) setCompNameEn(d.company_name_en);
          if (d.tax_id) setTaxId(d.tax_id);
          if (d.nssf_id) setNssfId(d.nssf_id);
          if (d.exchange_rate) setRate(Number(d.exchange_rate));
          if (d.dependent_rebate) setDependentRebate(Number(d.dependent_rebate));
          if (d.nssf_ceiling) setNssfCeiling(Number(d.nssf_ceiling));
          if (d.ai_enabled !== undefined) setAiEnabled(Boolean(d.ai_enabled));
          if (d.allow_employee_data_to_ai !== undefined) setAllowEmployeeDataToAi(Boolean(d.allow_employee_data_to_ai));
          if (d.allow_salary_data_to_ai !== undefined) setAllowSalaryDataToAi(Boolean(d.allow_salary_data_to_ai));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getValidAuthToken();
      const payload = {
        company_name_kh: compNameKh,
        company_name_en: compNameEn,
        tax_id: taxId,
        nssf_id: nssfId,
        exchange_rate: rate,
        dependent_rebate: dependentRebate,
        nssf_ceiling: nssfCeiling,
        ai_enabled: aiEnabled,
        allow_employee_data_to_ai: allowEmployeeDataToAi,
        allow_salary_data_to_ai: allowSalaryDataToAi,
      };

      const res = await fetch(`${API_BASE_URL}/system/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = async (format: 'excel' | 'csv-zip' | string) => {
    try {
      setDownloading(format);
      const token = await getValidAuthToken();
      let url = `${API_BASE_URL}/system/backup/excel`;
      let defaultFilename = `a_plus_hrms_backup_${new Date().toISOString().slice(0, 10)}.xlsx`;

      if (format === 'csv-zip') {
        url = `${API_BASE_URL}/system/backup/csv`;
        defaultFilename = `a_plus_hrms_csv_backup_${new Date().toISOString().slice(0, 10)}.zip`;
      } else if (format !== 'excel') {
        url = `${API_BASE_URL}/system/backup/csv?table=${encodeURIComponent(format)}`;
        defaultFilename = `a_plus_hrms_${format}_${new Date().toISOString().slice(0, 10)}.csv`;
      }

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error(`Backup export request failed: ${res.status} ${res.statusText}`);
      }

      // Extract filename if Content-Disposition header is exposed
      const disposition = res.headers.get('Content-Disposition');
      let filename = defaultFilename;
      if (disposition && disposition.includes('filename=')) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '').trim();
        }
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setBackupSuccess(`Successfully downloaded ${filename}`);
      setTimeout(() => setBackupSuccess(null), 5000);
    } catch (err: any) {
      console.error('Backup download error:', err);
      alert('Failed to download system backup. Please check your admin privileges.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'ការកំណត់ប្រព័ន្ធ' : 'System & Regulatory Settings'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Configuration
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure company legal registration, Cambodia tax rules, NSSF ceilings, exchange rates, and AI privacy controls.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm self-start sm:self-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? (language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...') : (language === 'km' ? 'រក្សាទុកការកែប្រែ' : 'Save Changes')}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Settings and regulatory parameters updated successfully!</span>
        </div>
      )}

      {backupSuccess && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
          <span>{backupSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Registration Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Company Legal Profile</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Company Legal Name (English)</label>
              <input
                type="text"
                value={compNameEn}
                onChange={(e) => setCompNameEn(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Company Legal Name (Khmer ខ្មែរ)</label>
              <input
                type="text"
                value={compNameKh}
                onChange={(e) => setCompNameKh(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Cambodia TIN (ពន្ធដារ)</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">NSSF Enterprise ID (ប.ស.ស)</label>
                <input
                  type="text"
                  value={nssfId}
                  onChange={(e) => setNssfId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cambodia Statutory & Currency Rules */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Cambodia Statutory &amp; Currency Rules</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Active NBC Official Exchange Rate (USD → KHR)
              </label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                GDT Dependent Tax Relief (per spouse/minor child)
              </label>
              <input
                type="number"
                value={dependentRebate}
                onChange={(e) => setDependentRebate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
              />
              <span className="text-[10px] text-slate-400">Current GDT circular: 150,000 KHR per dependent</span>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                NSSF Maximum Contributory Wage Ceiling (KHR)
              </label>
              <input
                type="number"
                value={nssfCeiling}
                onChange={(e) => setNssfCeiling(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
              />
              <span className="text-[10px] text-slate-400">Standard statutory ceiling: 1,200,000 KHR</span>
            </div>
          </div>
        </div>

        {/* AI Gateway Privacy Shield */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">AI Privacy &amp; Data Shield</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
              Zero PII Leakage Guarantee
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <p className="font-bold text-slate-900">Enable AI Writing &amp; Assistant Gateway</p>
                <p className="text-[11px] text-slate-500">
                  Allow internal generative AI for drafting job descriptions and policy memos.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Send Employee Personal Data to AI</p>
                  <p className="text-[10px] text-slate-400">Strictly default: Disabled</p>
                </div>
                <input
                  type="checkbox"
                  disabled={!aiEnabled}
                  checked={allowEmployeeDataToAi}
                  onChange={(e) => setAllowEmployeeDataToAi(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Send Salary / Payroll Data to AI</p>
                  <p className="text-[10px] text-slate-400">Strictly default: Disabled</p>
                </div>
                <input
                  type="checkbox"
                  disabled={!aiEnabled}
                  checked={allowSalaryDataToAi}
                  onChange={(e) => setAllowSalaryDataToAi(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Data Backup & Disaster Recovery Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'km' ? 'ការបម្រុងទុកទិន្នន័យ & ការនាំចេញ (Backup & Recovery)' : 'System Data Backup & Disaster Recovery Export'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'km'
                    ? 'ទាញយកទិន្នន័យបម្រុងទុកទាំងមូលនៃប្រព័ន្ធជាទម្រង់ Microsoft Excel (.xlsx) ឬឯកសារបណ្ណសារ CSV (.zip) ជាមួយការគាំទ្រអក្សរខ្មែរ UTF-8 BOM'
                    : 'Export complete multi-entity database snapshots in Microsoft Excel (.xlsx) or compressed CSV (.zip) format with UTF-8 BOM Unicode support.'}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 self-start sm:self-auto flex items-center space-x-1">
              <Server className="w-3.5 h-3.5 inline mr-1" />
              <span>Full Snapshot Ready</span>
            </span>
          </div>

          {/* Backup Format Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Excel Backup Card */}
            <div className="p-5 rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/60 to-indigo-50/30 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Microsoft Excel Backup (.xlsx)</h4>
                    <p className="text-[11px] text-blue-700 font-medium">Multi-Tab Formatted Workbook</p>
                  </div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 pt-2">
                  <li className="flex items-center space-x-1.5">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>8 Categorized sheets: Staff, Org, Attendance, Leave, Payroll &amp; Audits</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>Pre-styled headers, auto-adjusted column dimensions &amp; formatted metrics</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>Ideal for executive reporting, offline analysis and institutional archives</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleDownloadBackup('excel')}
                disabled={downloading !== null}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {downloading === 'excel' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating Excel Backup...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Full Backup (Excel .xlsx)</span>
                  </>
                )}
              </button>
            </div>

            {/* CSV Archive Card */}
            <div className="p-5 rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-teal-50/30 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Complete CSV Archive (.zip)</h4>
                    <p className="text-[11px] text-emerald-700 font-medium">Standard RFC-4180 Tables (UTF-8 BOM)</p>
                  </div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 pt-2">
                  <li className="flex items-center space-x-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Compressed archive with separate CSV files for each entity table</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Byte-Order-Mark (BOM) encoded: opens cleanly in Windows Excel without font corruption</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Designed for database migrations, external ETL pipelines &amp; disaster restore</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleDownloadBackup('csv-zip')}
                disabled={downloading !== null}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {downloading === 'csv-zip' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Compressing CSV Archive...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Full Backup (CSV .zip)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Single-Table CSV Exports */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Direct Single-Table CSV Downloads (ទាញយកតារាងនីមួយៗ)
              </h4>
              <span className="text-[11px] text-slate-400">RFC-4180 UTF-8 BOM</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'employees', label: 'Employees (បុគ្គលិក)', count: 'Core Profiles' },
                { key: 'attendance', label: 'Attendance (វត្តមាន)', count: 'Punch Logs' },
                { key: 'leave', label: 'Leave Requests (ច្បាប់)', count: 'Applications' },
                { key: 'payroll', label: 'Payroll Ledger (បៀវត្ស)', count: 'Gross/Net/Taxes' },
                { key: 'departments', label: 'Departments (នាយកដ្ឋាន)', count: 'Org Units' },
                { key: 'positions', label: 'Positions (មុខតំណែង)', count: 'Job Grades' },
                { key: 'audit_logs', label: 'Audit Logs (សវនកម្ម)', count: 'Security Trail' },
                { key: 'settings', label: 'System Settings (ការកំណត់)', count: 'Parameters' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleDownloadBackup(item.key)}
                  disabled={downloading !== null}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-left transition flex items-center justify-between group disabled:opacity-50"
                >
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{item.count}</p>
                  </div>
                  {downloading === item.key ? (
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin shrink-0 ml-1" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Trail & Compliance Notice */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 flex items-start space-x-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Security &amp; Audit Compliance:</strong> All database backup exports are automatically logged in the immutable system audit trail with administrator credentials, timestamp, and client IP address. System credentials and password hashes are strictly omitted.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
