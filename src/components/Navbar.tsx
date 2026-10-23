import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  UploadCloud,
  BellRing,
  CalendarCheck2,
  History,
  ShieldCheck,
  Cpu,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { OllamaStatus } from '../types';

export type NavTab = 'dashboard' | 'documents' | 'import' | 'reminders' | 'digest' | 'audit';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  ollamaStatus: OllamaStatus | null;
  onOpenOllamaModal: () => void;
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
    { id: 'import', label: 'Import Bill', icon: UploadCloud },
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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-border shadow-sm">
      {/* Top Banner with Product Promise and Privacy Guarantee */}
      <div className="bg-navy-900 text-slate-300 text-[11px] px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white tracking-wide">HACKTOBERFEST WEEK 3 — "SLOW AND STEADY"</span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-300 hidden sm:inline">"Stop chasing bills. Know what needs attention."</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Local-First Privacy (Zero Cloud AI)</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-brand-blue transition-colors">
                <span>🦥</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-navy-900 tracking-tight">BillSloth</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-brand-blue-light text-brand-blue">
                    Local
                  </span>
                </div>
                <p className="text-[11px] text-slate-muted hidden md:block">
                  Calm, human-in-the-loop bill tracker
                </p>
              </div>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as NavTab)}
                  className={`relative px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-navy-700 hover:text-navy-900 hover:bg-slate-light'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-muted'}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white text-brand-blue' : tab.badgeColor
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status Actions */}
          <div className="flex items-center gap-2.5">
            {/* Ollama Status Button */}
            <button
              onClick={onOpenOllamaModal}
              title="Click to view local Ollama AI status and available models"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-colors ${
                ollamaStatus?.available
                  ? 'border-green-paid-border bg-green-paid-light text-green-paid hover:bg-green-100'
                  : 'border-amber-warn-border bg-amber-warn-light text-amber-warn hover:bg-amber-100'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">
                {ollamaStatus?.available
                  ? `Ollama: ${ollamaStatus.activeModel || 'Ready'}`
                  : 'Ollama: Offline'}
              </span>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            </button>

            {/* Sample Data Toggle */}
            {hasSampleData ? (
              <button
                onClick={onClearSample}
                disabled={loadingSample}
                title="Clear all illustrative sample bills"
                className="px-2.5 py-1.5 rounded-lg border border-slate-border bg-white hover:bg-red-50 hover:text-red-overdue text-slate-muted text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Clear Sample Data</span>
              </button>
            ) : (
              <button
                onClick={onLoadSample}
                disabled={loadingSample}
                title="Load realistic sample bills for testing"
                className="px-2.5 py-1.5 rounded-lg border border-slate-border bg-white hover:bg-slate-50 text-navy-800 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-warn" />
                <span className="hidden xl:inline">Load Sample Data</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
