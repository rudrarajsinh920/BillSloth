import React, { useEffect, useState } from 'react';
import {
  Menu,
  Sparkles,
  UploadCloud,
  ShieldCheck,
  BellRing,
  Zap,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { getActiveAiEngine } from '../api/gemini';

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
  const [engineLabel, setEngineLabel] = useState<string>('Local AI');

  useEffect(() => {
    const syncEngine = () => {
      try {
        const eng = getActiveAiEngine();
        if (eng === 'gemini') {
          setEngineLabel('Gemini');
        } else if (eng === 'ollama') {
          setEngineLabel('Gemma 2B');
        } else {
          setEngineLabel('Smart AI');
        }
      } catch {
        setEngineLabel('Local AI');
      }
    };
    syncEngine();
    window.addEventListener('storage', syncEngine);
    window.addEventListener('focus', syncEngine);
    return () => {
      window.removeEventListener('storage', syncEngine);
      window.removeEventListener('focus', syncEngine);
    };
  }, []);

  const titles: Record<NavTab, { title: string; subtitle: string; tag: string }> = {
    dashboard: {
      title: 'Financial Command Center',
      subtitle: 'Real-time obligations, cash outflows, and 30-day maturity radar',
      tag: 'Live Ledger',
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
      title: 'Reminders & Approvals',
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
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#DCE4E5] px-4 sm:px-6 lg:px-8 py-3 transition-all text-[#172A35] shadow-[0_1px_3px_rgba(23,42,53,0.03)]">
      {/* Microscopic top accent highlight */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#087F8C]/35 to-transparent pointer-events-none" />

      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Side: Mobile Menu Button + Page Heading (Never Wraps) */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl border border-[#DCE4E5] text-[#172A35] hover:bg-[#F7F8F5] transition-colors shrink-0"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-[#172A35] whitespace-nowrap">
                {current.title}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/25 uppercase tracking-wider shrink-0 shadow-2xs">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#087F8C] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#087F8C]" />
                </span>
                {current.tag}
              </span>
            </div>
            <p className="text-[11px] text-[#526572] hidden md:block truncate max-w-xs xl:max-w-md font-medium mt-0.5">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Center: Signature AI Omnibar (Unifies Search + Ask BillSloth) */}
        <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-2 hidden sm:block">
          <button
            onClick={onOpenAskModal}
            className="w-full group flex items-center justify-between gap-2.5 px-3.5 py-1.5 rounded-full bg-[#F7F8F5] hover:bg-white border border-[#DCE4E5] hover:border-[#087F8C]/40 text-[#526572] hover:text-[#172A35] transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            title="Ask BillSloth Assistant or search ledger (⌘K)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-[#DDF5F6] text-[#087F8C] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="w-3 h-3" />
              </div>
              <span className="text-xs font-medium truncate text-left text-[#526572] group-hover:text-[#172A35]">
                Ask BillSloth or search...
              </span>
            </div>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded-md bg-white border border-[#DCE4E5] text-[10px] font-mono font-bold text-[#526572] group-hover:border-[#087F8C]/30 shadow-2xs shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Side: Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mobile search trigger */}
          <button
            onClick={onOpenAskModal}
            className="sm:hidden p-2 rounded-xl border border-[#DCE4E5] text-[#526572] hover:text-[#087F8C] hover:bg-[#F7F8F5] transition-colors"
            title="Search & Ask Assistant"
            aria-label="Search and Ask"
          >
            <Sparkles className="w-4 h-4 text-[#087F8C]" />
          </button>

          {/* AI Engine Status Pill (Interactive) */}
          <button
            onClick={onOpenAiSettings || onOpenAskModal}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#DCE4E5] bg-[#F7F8F5] hover:bg-white hover:border-[#087F8C]/40 text-[#526572] hover:text-[#172A35] text-[11px] font-bold transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
            title="Configure AI Assistant Engine (Gemini, Gemma 2B, or Local)"
          >
            <Zap className="w-3 h-3 text-[#087F8C] group-hover:scale-110 transition-transform" />
            <span className="font-mono text-[10px] uppercase tracking-wider">{engineLabel}</span>
          </button>

          {/* Pending Reminders / Notifications Bell */}
          <button
            onClick={onNavigateToReminders}
            className="relative p-2 rounded-xl border border-[#DCE4E5] bg-white hover:bg-[#F7F8F5] text-[#526572] hover:text-[#172A35] hover:border-[#087F8C]/40 transition-all hover:scale-105 active:scale-95 shadow-2xs"
            title={pendingRemindersCount > 0 ? `${pendingRemindersCount} pending bill approvals` : 'Reminders & Approvals'}
            aria-label="Pending Reminders"
          >
            <BellRing className="w-4 h-4" />
            {pendingRemindersCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BE123C] opacity-75" />
                <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-[#BE123C] text-white text-[9px] font-black font-mono shadow-xs">
                  {pendingRemindersCount}
                </span>
              </span>
            )}
          </button>

          {/* Primary Action: Import Bill CTA */}
          <button
            onClick={onNavigateToImport}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#087F8C] hover:bg-[#066873] text-white text-xs font-black shadow-xs hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Import Bill</span>
          </button>

          {/* Signature Air-Gapped Vault Security Seal */}
          <div
            className="hidden xl:flex items-center gap-2 pl-2.5 py-0.5 border-l border-[#DCE4E5] shrink-0"
            title="100% On-Device Financial Ledger — Air-Gapped & Encrypted"
          >
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#DDF7EF]/80 border border-[#087F5B]/25 shadow-2xs">
              <span className="text-base select-none">🦥</span>
              <div className="text-left">
                <span className="text-[11px] font-extrabold text-[#172A35] block leading-tight">
                  Local Vault
                </span>
                <span className="text-[9px] text-[#087F5B] font-black flex items-center gap-0.5 leading-tight tracking-wider uppercase">
                  <ShieldCheck className="w-2.5 h-2.5" /> Air-Gapped
                </span>
              </div>
            </div>
          </div>

          {/* Compact Vault Badge on medium/laptop screens */}
          <div
            className="xl:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-[#DDF7EF] border border-[#087F5B]/25 text-sm shadow-2xs shrink-0 relative"
            title="Local Vault — 100% Air-Gapped"
          >
            <span className="select-none">🦥</span>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#087F5B] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-2 h-2" />
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
