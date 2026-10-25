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
    <header className="sticky top-0 z-20 bg-[#111D32] border-b border-[#29374D] px-4 sm:px-6 lg:px-8 py-3.5 transition-all text-[#F8FAFC]">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button + Page Heading */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl border border-[#29374D] text-[#F8FAFC] hover:bg-[#162238]"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-tight text-[#F8FAFC]">
                {current.title}
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30 uppercase tracking-wider">
                {current.tag}
              </span>
            </div>
            <p className="text-[11px] text-[#A8B7CC] hidden sm:block font-medium">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Omnibar Search, Ask AI, Import CTA, Notification Icon */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search / Ask AI Omnibar */}
          <button
            onClick={onOpenAskModal}
            className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#162238] hover:bg-[#1C2B46] border border-[#29374D] text-[#A8B7CC] text-xs w-48 lg:w-64 transition-all hover:border-[#22D3EE]/50 hover:text-[#F8FAFC] group focus:outline-none"
          >
            <Search className="w-3.5 h-3.5 text-[#A8B7CC] group-hover:text-[#22D3EE] transition-colors shrink-0" />
            <span className="flex-1 text-left truncate font-medium">Ask BillSloth or search ledger...</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-[#0B1220] text-[9px] font-mono text-[#A8B7CC] border border-[#29374D] shrink-0 font-bold">
              ⌘K
            </kbd>
          </button>

          {/* Ask BillSloth Pill Button */}
          <button
            onClick={onOpenAskModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#162238] hover:bg-[#1C2B46] text-[#22D3EE] border border-[#29374D] hover:border-[#22D3EE]/50 text-xs font-bold transition-all hover:scale-105 active:scale-95"
            title="Ask BillSloth Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#22D3EE] animate-pulse-glow" />
            <span className="hidden sm:inline">Ask BillSloth</span>
          </button>

          {/* Assistant Settings Button */}
          <button
            onClick={onOpenAiSettings || onOpenAskModal}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#29374D] bg-[#162238] hover:bg-[#1C2B46] hover:border-[#22D3EE]/50 text-[#A8B7CC] hover:text-[#F8FAFC] text-xs font-semibold transition-all hover:scale-105"
            title="Assistant Settings & Model Configuration"
          >
            <Zap className="w-3.5 h-3.5 text-[#A8B7CC]" />
            <span>Settings</span>
          </button>

          {/* Reminders / Notification Bell */}
          <button
            onClick={onNavigateToReminders}
            className="relative p-2 rounded-xl border border-[#29374D] text-[#A8B7CC] hover:text-[#F8FAFC] hover:bg-[#162238] transition-all hover:scale-105"
            title="Pending Reminders & Approvals"
          >
            <BellRing className="w-4 h-4" />
            {pendingRemindersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#22D3EE] text-[#0B1220] text-[9px] font-black flex items-center justify-center font-mono shadow-sm shadow-[#22D3EE]/40">
                {pendingRemindersCount}
              </span>
            )}
          </button>

          {/* Quick Import Button with Electric Cyan Gradient */}
          <button
            onClick={onNavigateToImport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] hover:brightness-110 text-[#0B1220] text-xs font-extrabold shadow-md shadow-[#22D3EE]/25 transition-all hover:scale-105 active:scale-95"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import Bill</span>
          </button>

          {/* Profile / Privacy Indicator Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#29374D]">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#22D3EE] to-[#34D399] p-[1.5px] shadow-xs">
                <div className="w-full h-full bg-[#162238] rounded-full flex items-center justify-center text-sm">
                  <span>🦥</span>
                </div>
              </div>
            </div>
            <div className="hidden xl:block text-left">
              <span className="text-xs font-extrabold text-[#F8FAFC] block leading-tight">
                Local Vault
              </span>
              <span className="text-[10px] text-[#34D399] font-bold flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> Air-Gapped
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
