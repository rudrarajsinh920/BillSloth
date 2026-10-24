import React from 'react';
import {
  Menu,
  Search,
  Sparkles,
  UploadCloud,
  ShieldCheck,
  BellRing,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface TopHeaderProps {
  activeTab: NavTab;
  onOpenMobileSidebar: () => void;
  onOpenAskModal: () => void;
  onNavigateToImport: () => void;
  onNavigateToReminders: () => void;
  pendingRemindersCount: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onOpenAskModal,
  onNavigateToImport,
  onNavigateToReminders,
  pendingRemindersCount,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string; tag: string }> = {
    dashboard: {
      title: 'Financial Command Center',
      subtitle: 'Real-time obligations, cash outflows, and 30-day maturity radar',
      tag: 'Overview',
    },
    documents: {
      title: 'Invoices & Bills Ledger',
      subtitle: 'Complete on-device ledger with human verification gates',
      tag: 'Ledger',
    },
    calendar: {
      title: 'Due Date Calendar',
      subtitle: 'Monthly visual maturity schedule and settlement timelines',
      tag: 'Timeline',
    },
    import: {
      title: 'Document Ingestion Portal',
      subtitle: 'Import PDF or image statements with local OCR & Gemma 2B',
      tag: 'Ingestion',
    },
    reminders: {
      title: 'Reminders & Human Approvals',
      subtitle: 'Prepare, inspect, and approve calendar ICS notifications',
      tag: 'Approvals',
    },
    digest: {
      title: 'Weekly Executive Digest',
      subtitle: 'Automated executive summary and scheduled payment batches',
      tag: 'Executive',
    },
    audit: {
      title: 'System Audit Trail',
      subtitle: 'Cryptographic immutable activity log stored in SQLite',
      tag: 'Security',
    },
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button + Page Heading */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl border border-slate-200/80 text-navy-800 hover:bg-slate-100"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-tight bg-gradient-to-r from-navy-900 via-indigo-950 to-blue-900 bg-clip-text text-transparent">
                {current.title}
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70 uppercase tracking-wider">
                {current.tag}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Omnibar Search, Ask AI, Import CTA, Notification Icon */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search / Ask AI Omnibar (FinCore style with subtle focus glow) */}
          <button
            onClick={onOpenAskModal}
            className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-100/80 hover:bg-white border border-slate-200 text-slate-500 text-xs w-48 lg:w-64 transition-all shadow-2xs hover:border-indigo-300 hover:shadow-indigo-500/10 group focus:outline-none"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
            <span className="flex-1 text-left truncate text-slate-600 font-medium">Ask AI or search ledger...</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-white text-[9px] font-mono text-slate-500 border border-slate-200 shadow-2xs shrink-0 font-bold">
              ⌘K
            </kbd>
          </button>

          {/* Ask AI Pill Button */}
          <button
            onClick={onOpenAskModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 border border-indigo-200/80 text-xs font-bold shadow-2xs transition-all hover:scale-105 active:scale-95"
            title="Ask BillSloth Assistant (Local Gemma 2 2B)"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse-glow" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>

          {/* Reminders / Notification Bell */}
          <button
            onClick={onNavigateToReminders}
            className="relative p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-all hover:scale-105"
            title="Pending Reminders & Approvals"
          >
            <BellRing className="w-4 h-4" />
            {pendingRemindersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white text-[9px] font-extrabold flex items-center justify-center font-mono shadow-sm shadow-indigo-500/40">
                {pendingRemindersCount}
              </span>
            )}
          </button>

          {/* Quick Import Button with Futuristic Gradient */}
          <button
            onClick={onNavigateToImport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all hover:scale-105 active:scale-95"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import Bill</span>
          </button>

          {/* Profile / Privacy Indicator Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[1.5px] shadow-xs">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-sm">
                  <span>🦥</span>
                </div>
              </div>
            </div>
            <div className="hidden xl:block text-left">
              <span className="text-xs font-extrabold text-navy-900 block leading-tight">
                Local Vault
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> Air-Gapped
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
