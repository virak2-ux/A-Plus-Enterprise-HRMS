'use client';

import React, { useState } from 'react';
import { useLanguageCurrency } from '@/context/LanguageCurrencyContext';
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
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  content: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'AI',
    content:
      'Hello! I am your Cambodia HRMS AI Assistant. I can assist you with Cambodia Labor Law inquiries, drafting job requisitions, explaining payslip tax brackets, or formulating onboarding checklists.\n\n*Note: Strict privacy is enabled. Your personal employee files and salary records remain strictly confidential and are not exposed.*',
    timestamp: '06:50 AM',
  },
];

export default function AIAssistantPage() {
  const { language } = useLanguageCurrency();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (text?: string) => {
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

    setTimeout(() => {
      let aiReply = '';
      const p = promptToSend.toLowerCase();

      if (p.includes('seniority') || p.includes('art. 89') || p.includes('indemnity')) {
        aiReply =
          '**Under Cambodia Labor Law (Prakas 443 & Law on Social Security):**\n\n- **UDC Contracts**: Seniority indemnity is paid semi-annually (15 days/year total) divided into:\n  - 7.5 days paid in **June**.\n  - 7.5 days paid in **December**.\n- For employees working less than 6 months, if they complete 1 to 6 months, they receive 7.5 days.\n- **Tax Status**: Seniority indemnity payments under the statutory ceiling are exempt from Cambodia Tax on Salary (ToS).';
      } else if (p.includes('tax') || p.includes('bracket') || p.includes('tos')) {
        aiReply =
          '**Cambodia General Department of Taxation (GDT) Progressive Brackets:**\n\n- `0 - 1,500,000 KHR`: **0%**\n- `1,500,001 - 2,000,000 KHR`: **5%**\n- `2,000,001 - 8,500,000 KHR`: **10%**\n- `8,500,001 - 12,500,000 KHR`: **15%**\n- `12,500,001+ KHR`: **20%**\n\n*Statutory Deductions*: Each qualifying dependent spouse or child grants a **150,000 KHR/month** direct deduction from the taxable salary base before progressive brackets apply.';
      } else if (p.includes('job description') || p.includes('software engineer')) {
        aiReply =
          '### Job Description: Senior Full-Stack Engineer\n\n**Location**: Phnom Penh, Cambodia (Hybrid)\n**Department**: Software Engineering\n**Key Responsibilities**:\n- Architect scalable enterprise SaaS platforms using Next.js, FastAPI, and PostgreSQL.\n- Implement high-performance data processing pipelines with Redis and Celery.\n- Collaborate with product and design teams to deliver bilingual (Khmer/English) UX.\n- Ensure strict OWASP cybersecurity and data privacy compliance.';
      } else {
        aiReply =
          `I have processed your query: "${promptToSend}".\n\nBased on your enterprise HR policies and Cambodia regulations, all workflows are compliant with standard Ministry of Labor and Vocational Training (MoLVT) requirements. Would you like me to formulate an official document or explain further?`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'AI',
        content: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 h-[calc(100vh-8rem)] flex flex-col justify-between">
      {/* Header & Privacy Status */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>Cambodia HR &amp; Compliance AI Gateway</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                Privacy Shield Active
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Assists with labor regulations, payslip tax explanations, and HR communications.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>No PII / Salary Data Exposed</span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-5 overflow-y-auto space-y-4 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-3 ${m.sender === 'USER' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                m.sender === 'USER' ? 'bg-slate-800' : 'bg-indigo-600'
              }`}
            >
              {m.sender === 'USER' ? 'U' : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`p-4 rounded-2xl max-w-xl leading-relaxed whitespace-pre-wrap ${
                m.sender === 'USER'
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                  : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none'
              }`}
            >
              <div>{m.content}</div>
              <span
                className={`text-[10px] mt-1.5 block text-right ${
                  m.sender === 'USER' ? 'text-indigo-200' : 'text-slate-400'
                }`}
              >
                {m.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs italic">
            <Bot className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>AI is analyzing labor guidelines and drafting response...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex flex-wrap gap-2 shrink-0">
        <button
          onClick={() => handleSend('Explain Cambodia Labor Law Art. 89 Seniority Indemnity rules')}
          className="text-[11px] px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-full border border-indigo-200 transition"
        >
          Seniority Indemnity (Art. 89)
        </button>
        <button
          onClick={() => handleSend('What are the official Cambodia GDT Tax on Salary brackets and dependent relief?')}
          className="text-[11px] px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium rounded-full border border-amber-200 transition"
        >
          GDT Tax on Salary Brackets
        </button>
        <button
          onClick={() => handleSend('Draft a Job Description for a Senior Full-Stack Engineer in Phnom Penh')}
          className="text-[11px] px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium rounded-full border border-emerald-200 transition"
        >
          Draft Job Description
        </button>
      </div>

      {/* Input Box */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-2 shrink-0">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about Cambodia labor regulations, tax calculations, or HR drafting..."
          className="flex-1 px-3 py-2 text-xs focus:outline-none bg-transparent"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputPrompt.trim() || isTyping}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}
