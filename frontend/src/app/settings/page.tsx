'use client';

import React, { useState } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import {
  Settings,
  Building,
  DollarSign,
  ShieldCheck,
  Bot,
  Save,
  CheckCircle2,
  Lock,
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
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
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Settings and regulatory parameters updated successfully!</span>
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
      </div>
    </div>
  );
}
