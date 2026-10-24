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
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Financial Overview',
      subtitle: 'Real-time obligations, cash outflows, and maturity tracking',
    },
    documents: {
      title: 'Invoices & Bills Ledger',
      subtitle: 'Complete on-device ledger with human verification gates',
    },
    calendar: {
      title: 'Due Date Calendar',
      subtitle: 'Monthly visual maturity schedule and settlement timelines',
    },
    import: {
      title: 'Document Ingestion',
      subtitle: 'Import PDF or image statements with local OCR & Gemma 2B',
    },
    reminders: {
      title: 'Reminders & Human Approvals',
      subtitle: 'Prepare, inspect, and approve calendar ICS notifications',
    },
    digest: {
      title: 'Weekly Executive Digest',
      subtitle: 'Automated executive summary and scheduled payment batches',
    },
    audit: {
      title: 'System Audit Trail',
      subtitle: 'Cryptographic immutable activity log stored in SQLite',
    },
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-border px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button + Page Heading */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl border border-slate-border text-navy-800 hover:bg-slate-100"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-navy-900 tracking-tight leading-tight">
              {current.title}
            </h1>
            <p className="text-[11px] text-slate-muted hidden sm:block">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Omnibar Search, Ask AI, Import CTA, Notification Icon */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search / Ask AI Omnibar (Matching FinCore search) */}
          <button
            onClick={onOpenAskModal}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 text-xs w-48 lg:w-64 transition-all shadow-2xs group"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-navy-900 shrink-0" />
            <span className="flex-1 text-left truncate text-slate-600 font-medium">Search or ask AI...</span>
            <kbd className="px-1.5 py-0.2 rounded bg-white text-[9px] font-mono text-slate-500 border border-slate-200 shadow-2xs shrink-0">
              ⌘K
            </kbd>
          </button>

          {/* Ask AI Pill Button */}
          <button
            onClick={onOpenAskModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-brand-blue border border-blue-200 text-xs font-semibold shadow-2xs transition-colors"
            title="Ask BillSloth Assistant (Local Gemma 2 2B)"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>

          {/* Reminders / Notification Bell */}
          <button
            onClick={onNavigateToReminders}
            className="relative p-2 rounded-xl border border-slate-border text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors"
            title="Pending Reminders & Approvals"
          >
            <BellRing className="w-4 h-4" />
            {pendingRemindersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-blue text-white text-[9px] font-bold flex items-center justify-center font-mono">
                {pendingRemindersCount}
              </span>
            )}
          </button>

          {/* Quick Import Button */}
          <button
            onClick={onNavigateToImport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-navy-900 hover:bg-brand-blue text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import Bill</span>
          </button>

          {/* Profile / Privacy Indicator Badge (Matching FinCore user badge) */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm shadow-2xs select-none">
              <span>🦥</span>
            </div>
            <div className="hidden xl:block text-left">
              <span className="text-xs font-bold text-navy-900 block leading-tight">
                Local Vault
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> Air-Gapped
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
