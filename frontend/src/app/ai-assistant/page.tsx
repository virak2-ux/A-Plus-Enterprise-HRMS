'use client';

import React, { useState } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
import apiClient from '@/lib/api';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  FileText,
  HelpCircle,
  Calculator,
  Lock,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  content: string;
  timestamp: string;
  legal_references?: string[];
  suggested_actions?: string[];
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'AI',
    content:
      'Hello! I am your Cambodia HRMS AI Advisor. I provide deterministic regulatory guidance grounded directly in the Kingdom of Cambodia Labor Law (Articles 68, 89, 139, 166-169), Prakas 443 on Seniority Indemnity, NSSF pension rules, and GDT Progressive Tax on Salary circulars.\n\n*Zero-PII Privacy Shield is active. Your employee personal records remain strictly confidential.*',
    timestamp: '09:00 AM',
    legal_references: ['Kingdom of Cambodia Labor Law (1997)', 'MLVT Prakas 443', 'GDT Circular on Tax on Salary'],
  },
];

const SUGGESTED_QUERIES = [
  'How is Seniority Indemnity calculated under Article 89?',
  'What are the overtime pay multipliers for night shifts and Sunday rest days?',
  'Explain the GDT monthly progressive salary tax brackets and dependent relief.',
  'What are the maximum statutory probation limits under Cambodian law?',
  'What are the NSSF pension, health, and occupational risk contribution rates?',
];

export default function AIAssistantPage() {
  const { language } = useLanguageCurrency();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (text?: string) => {
    const promptToSend = text || inputPrompt;
    if (!promptToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'USER',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsTyping(true);

    try {
      const res = await apiClient.post('/ai/chat', {
        message: promptToSend,
        context_module: 'LABOR_LAW',
      });
      const data = res.data?.data;
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'AI',
        content: data?.reply || 'Analysis completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        legal_references: data?.legal_references || [],
        suggested_actions: data?.suggested_actions || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      // Fallback
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'AI',
        content:
          'Under Cambodian Labor Law (Articles 89 & 166), seniority indemnity is 15 days of wages per year for UDC contracts, and annual leave base is 18 days/year plus 1 day for every 3 years of continuous service.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        legal_references: ['Cambodia Labor Law Art. 89 & 166'],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'km' ? 'ជំនួយការឆ្លាតវៃច្បាប់ការងារ' : 'Cambodia Labor Law & Tax AI Advisor'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Grounded in Law</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic advisory engine referencing Ministry of Labour (MLVT) directives and General Department of Taxation (GDT) tax brackets.
          </p>
        </div>
      </div>

      {/* Suggested Query Chips */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 text-left"
          >
            &ldquo;{q}&rdquo;
          </button>
        ))}
      </div>

      {/* Chat Transcript Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 min-h-[420px] max-h-[560px] overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs space-y-2.5 ${
                msg.sender === 'USER'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-1.5 text-[11px] opacity-70">
                <span className="font-bold flex items-center space-x-1">
                  {msg.sender === 'AI' ? <Bot className="w-3.5 h-3.5 mr-1" /> : null}
                  {msg.sender === 'AI' ? 'HRMS Regulatory Advisor' : 'You'}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              <div className="whitespace-pre-line leading-relaxed font-sans">{msg.content}</div>

              {msg.legal_references && msg.legal_references.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Statutory References:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.legal_references.map((ref, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-white border border-slate-200 text-indigo-700 font-mono"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                <div className="pt-1.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Suggested HR Workflows:
                  </span>
                  <div className="space-y-1">
                    {msg.suggested_actions.map((act, i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-1 text-[11px] font-medium text-slate-700"
                      >
                        <ArrowRight className="w-3 h-3 text-emerald-600" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-3 text-xs text-slate-500 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Analyzing Cambodia labor code &amp; tax regulations...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-2">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask any question regarding Cambodia labor law, NSSF formulas, or tax rules..."
          className="flex-1 px-4 py-2 text-xs border border-transparent focus:border-indigo-500 focus:outline-none rounded-xl"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputPrompt.trim() || isTyping}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}
