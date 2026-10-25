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
      badgeColor: 'bg-[#FBBF24] text-[#0B1220]',
    },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    {
      id: 'reminders',
      label: 'Reminders',
      icon: BellRing,
      badge: pendingRemindersCount > 0 ? pendingRemindersCount : undefined,
      badgeColor: 'bg-[#22D3EE] text-[#0B1220]',
    },
    { id: 'digest', label: 'Weekly Digest', icon: CalendarCheck2 },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#111D32] border-b border-[#29374D] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-[#162238] border border-[#29374D] flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:border-[#22D3EE] transition-colors">
                <span>🦥</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-[#F8FAFC] tracking-tight">BillSloth</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#34D399]" />
                    <span>Local</span>
                  </span>
                </div>
                <p className="text-[11px] text-[#A8B7CC] hidden lg:block leading-none mt-0.5">
                  Private on-device bill tracker
                </p>
              </div>
            </button>
          </div>

          {/* Navigation Items */}
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
                  className={`relative px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:outline-none ${
                    isActive
                      ? 'bg-[#162238] text-[#22D3EE] border border-[#22D3EE]/40 shadow-sm'
                      : 'text-[#A8B7CC] hover:text-[#F8FAFC] hover:bg-[#162238]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#22D3EE]' : 'text-[#64748B]'}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                        isActive ? 'bg-[#22D3EE] text-[#0B1220]' : tab.badgeColor
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
            {/* Ask AI Pill Button */}
            <button
              onClick={onOpenAskModal}
              title="Ask BillSloth Assistant powered by local Gemma 2 2B (Cmd+K)"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#162238] hover:bg-[#1C2B46] text-[#F8FAFC] text-xs font-semibold border border-[#29374D] transition-all shadow-sm group focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#22D3EE] group-hover:scale-110 transition-transform" />
              <span>Ask AI</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono font-medium text-[#A8B7CC] bg-[#111D32] rounded border border-[#29374D]">
                ⌘K
              </kbd>
            </button>

            {/* Local AI Engine Status */}
            <button
              onClick={onOpenOllamaModal}
              title={
                ollamaStatus?.available
                  ? `Local AI Online: ${ollamaStatus.activeModel || 'Gemma 2B'} connected at ${ollamaStatus.url}`
                  : 'Local AI on Standby. Click to inspect or connect local Ollama runtime.'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${
                ollamaStatus?.available
                  ? 'border-[#34D399]/40 bg-[#34D399]/15 text-[#34D399] hover:bg-[#34D399]/25'
                  : 'border-[#29374D] bg-[#162238] text-[#A8B7CC] hover:bg-[#1C2B46]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  ollamaStatus?.available ? 'bg-[#34D399] animate-pulse' : 'bg-[#64748B]'
                }`}
              />
              <span className="text-[11px] font-semibold hidden xl:inline">
                {ollamaStatus?.available ? 'Local AI: Ready' : 'Local AI: Standby'}
              </span>
            </button>

            {/* Primary Action: Import Bill */}
            <button
              onClick={() => onTabChange('import')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0B1220] text-xs font-bold shadow-md transition-colors focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import Bill</span>
            </button>

            {/* Sample Data Toggle */}
            {hasSampleData ? (
              <button
                onClick={onClearSample}
                disabled={loadingSample}
                title="Clear illustrative sample data"
                className="p-1.5 rounded-lg border border-[#FB7185]/40 bg-[#162238] hover:bg-[#FB7185]/15 text-[#FB7185] transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onLoadSample}
                disabled={loadingSample}
                title="Load realistic sample bills for testing"
                className="p-1.5 rounded-lg border border-[#29374D] bg-[#162238] hover:bg-[#1C2B46] text-[#A8B7CC] hover:text-[#F8FAFC] transition-colors disabled:opacity-50"
              >
                <Bot className="w-3.5 h-3.5 text-[#FBBF24]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
