import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Calendar,
  UploadCloud,
  BellRing,
  CalendarCheck2,
  History,
  ShieldCheck,
  Sparkles,
  Trash2,
  Bot,
} from 'lucide-react';
import { OllamaStatus } from '../types';

export type NavTab = 'dashboard' | 'documents' | 'calendar' | 'import' | 'reminders' | 'digest' | 'audit';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  ollamaStatus: OllamaStatus | null;
  onOpenOllamaModal: () => void;
  onOpenAskModal: () => void;
  pendingRemindersCount: number;
  needsReviewCount: number;
  hasSampleData: boolean;
  onLoadSample: () => void;
  onClearSample: () => void;
  loadingSample: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  ollamaStatus,
  onOpenOllamaModal,
  onOpenAskModal,
  pendingRemindersCount,
  needsReviewCount,
  hasSampleData,
  onLoadSample,
  onClearSample,
  loadingSample,
}) => {
  const tabs: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'documents',
      label: 'Bills & Invoices',
      icon: Receipt,
      badge: needsReviewCount > 0 ? needsReviewCount : undefined,
      badgeColor: 'bg-amber-warn text-white',
    },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    {
      id: 'reminders',
      label: 'Reminders',
      icon: BellRing,
      badge: pendingRemindersCount > 0 ? pendingRemindersCount : undefined,
      badgeColor: 'bg-brand-blue text-white',
    },
    { id: 'digest', label: 'Weekly Digest', icon: CalendarCheck2 },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-navy-900 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-brand-blue transition-colors">
                <span>🦥</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-navy-900 tracking-tight">BillSloth</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Local</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-muted hidden lg:block leading-none mt-0.5">
                  Private on-device bill tracker
                </p>
              </div>
            </button>
          </div>

          {/* Navigation Items (Centered, sleek SaaS styling matching Reference Images 2 & 3) */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as NavTab)}
                  title={tab.label}
                  aria-label={tab.label}
                  className={`relative px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none ${
                    isActive
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                        isActive ? 'bg-white text-navy-900' : tab.badgeColor
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status & Primary Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Ask AI Pill Button (Prominent, polished SaaS search-style trigger) */}
            <button
              onClick={onOpenAskModal}
              title="Ask BillSloth Assistant powered by local Gemma 2 2B (Cmd+K)"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-navy-800 text-xs font-semibold border border-slate-200 transition-all shadow-xs group focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-blue group-hover:scale-110 transition-transform" />
              <span>Ask AI</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono font-medium text-slate-500 bg-white rounded border border-slate-200 shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Local AI Engine Status (Understated, calm, elegant status badge) */}
            <button
              onClick={onOpenOllamaModal}
              title={
                ollamaStatus?.available
                  ? `Local AI Online: ${ollamaStatus.activeModel || 'Gemma 2B'} connected at ${ollamaStatus.url}`
                  : 'Local AI on Standby. Click to inspect or connect local Ollama runtime.'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue ${
                ollamaStatus?.available
                  ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  ollamaStatus?.available ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="text-[11px] font-semibold hidden xl:inline">
                {ollamaStatus?.available ? 'Local AI: Ready' : 'Local AI: Standby'}
              </span>
            </button>

            {/* Primary Action: Import Bill (Matching Reference Image 2 & 3 CTA) */}
            <button
              onClick={() => onTabChange('import')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-semibold shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import Bill</span>
            </button>

            {/* Sample Data Toggle (Discreet icon button) */}
            {hasSampleData ? (
              <button
                onClick={onClearSample}
                disabled={loadingSample}
                title="Clear illustrative sample data"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onLoadSample}
                disabled={loadingSample}
                title="Load realistic sample bills for testing"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-navy-900 transition-colors disabled:opacity-50"
              >
                <Bot className="w-3.5 h-3.5 text-amber-warn" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
