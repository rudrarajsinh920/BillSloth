import React from 'react';
import {
  Menu,
  Search,
  Sparkles,
  UploadCloud,
  ShieldCheck,
  BellRing,
  Zap,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface TopHeaderProps {
  activeTab: NavTab;
  onOpenMobileSidebar: () => void;
  onOpenAskModal: () => void;
  onNavigateToImport: () => void;
  onNavigateToReminders: () => void;
  pendingRemindersCount: number;
  onOpenAiSettings?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onOpenAskModal,
  onNavigateToImport,
  onNavigateToReminders,
  pendingRemindersCount,
  onOpenAiSettings,
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
    <header className="sticky top-0 z-20 bg-white border-b border-[#DCE4E5] px-4 sm:px-6 lg:px-8 py-3.5 transition-all text-[#172A35]">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button + Page Heading */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl border border-[#DCE4E5] text-[#172A35] hover:bg-[#F7F8F5]"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-tight text-[#172A35]">
                {current.title}
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/30 uppercase tracking-wider">
                {current.tag}
              </span>
            </div>
            <p className="text-[11px] text-[#526572] hidden sm:block font-medium">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Omnibar Search, Ask AI, Import CTA, Notification Icon */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search / Ask AI Omnibar */}
          <button
            onClick={onOpenAskModal}
            className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#F7F8F5] hover:bg-white border border-[#DCE4E5] text-[#526572] text-xs w-48 lg:w-64 transition-all hover:border-[#087F8C]/50 hover:text-[#172A35] group focus:outline-none"
          >
            <Search className="w-3.5 h-3.5 text-[#526572] group-hover:text-[#087F8C] transition-colors shrink-0" />
            <span className="flex-1 text-left truncate font-medium">Ask BillSloth or search...</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-white text-[9px] font-mono text-[#526572] border border-[#DCE4E5] shrink-0 font-bold">
              ⌘K
            </kbd>
          </button>

          {/* Ask BillSloth Pill Button */}
          <button
            onClick={onOpenAskModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DDF5F6] hover:bg-[#087F8C] text-[#087F8C] hover:text-white border border-[#087F8C]/30 text-xs font-bold transition-all hover:scale-105 active:scale-95"
            title="Ask BillSloth Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Ask BillSloth</span>
          </button>

          {/* Assistant Settings Button */}
          <button
            onClick={onOpenAiSettings || onOpenAskModal}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#DCE4E5] bg-white hover:bg-[#F7F8F5] hover:border-[#087F8C]/50 text-[#526572] hover:text-[#172A35] text-xs font-semibold transition-all hover:scale-105"
            title="Assistant Settings & Model Configuration"
          >
            <Zap className="w-3.5 h-3.5 text-[#526572]" />
            <span>Settings</span>
          </button>

          {/* Reminders / Notification Bell */}
          <button
            onClick={onNavigateToReminders}
            className="relative p-2 rounded-xl border border-[#DCE4E5] text-[#526572] hover:text-[#172A35] hover:bg-[#F7F8F5] transition-all hover:scale-105"
            title="Pending Reminders & Approvals"
          >
            <BellRing className="w-4 h-4" />
            {pendingRemindersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#087F8C] text-white text-[9px] font-black flex items-center justify-center font-mono shadow-xs">
                {pendingRemindersCount}
              </span>
            )}
          </button>

          {/* Quick Import Button with Primary Teal */}
          <button
            onClick={onNavigateToImport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#087F8C] hover:bg-[#066873] text-white text-xs font-extrabold shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import Bill</span>
          </button>

          {/* Profile / Privacy Indicator Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#DCE4E5]">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#DDF5F6] border border-[#087F8C]/25 p-[1px] flex items-center justify-center text-sm shadow-xs">
                <span>🦥</span>
              </div>
            </div>
            <div className="hidden xl:block text-left">
              <span className="text-xs font-extrabold text-[#172A35] block leading-tight">
                Local Vault
              </span>
              <span className="text-[10px] text-[#087F5B] font-bold flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> Air-Gapped
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
