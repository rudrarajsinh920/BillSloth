import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Calendar,
  BellRing,
  CalendarCheck2,
  ShieldCheck,
  UploadCloud,
  Sparkles,
  Cpu,
  Trash2,
  Bot,
  X,
  Lock,
} from 'lucide-react';
import { OllamaStatus } from '../types';

export type NavTab = 'dashboard' | 'documents' | 'calendar' | 'import' | 'reminders' | 'digest' | 'audit';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
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
  const mainNav = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'documents' as NavTab,
      label: 'Invoices & Bills',
      icon: Receipt,
      badge: needsReviewCount > 0 ? needsReviewCount : undefined,
      badgeColor: 'bg-amber-warn text-white',
    },
    {
      id: 'calendar' as NavTab,
      label: 'Calendar Schedule',
      icon: Calendar,
    },
    {
      id: 'reminders' as NavTab,
      label: 'Reminders & Approvals',
      icon: BellRing,
      badge: pendingRemindersCount > 0 ? pendingRemindersCount : undefined,
      badgeColor: 'bg-brand-blue text-white',
    },
    {
      id: 'digest' as NavTab,
      label: 'Weekly Digest',
      icon: CalendarCheck2,
    },
    {
      id: 'audit' as NavTab,
      label: 'System Audit Trail',
      icon: ShieldCheck,
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-border flex items-center justify-between">
        <button
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-white font-bold text-xl shadow-sm group-hover:bg-brand-blue transition-colors">
            <span>🦥</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-navy-900 tracking-tight">BillSloth</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                Local
              </span>
            </div>
            <p className="text-[11px] text-slate-muted font-medium">Private Financial Ledger</p>
          </div>
        </button>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100"
          aria-label="Close navigation sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links (Matching FinCore sidebar layout) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
            Navigation
          </span>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-navy-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono tabular-nums ${
                        isActive ? 'bg-white text-navy-900' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tools & AI Assistance */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
            AI & Operations
          </span>
          <div className="space-y-1">
            <button
              onClick={() => {
                onOpenAskModal();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-brand-blue bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-brand-blue" />
                <span>Ask Sloth AI</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white text-brand-blue border border-blue-200">
                ⌘K
              </span>
            </button>

            <button
              onClick={() => handleNavClick('import')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'import'
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/80'
              }`}
            >
              <UploadCloud className={`w-4 h-4 ${activeTab === 'import' ? 'text-white' : 'text-slate-400'}`} />
              <span>Import New Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Area: Local AI Engine Card & Privacy Guarantee */}
      <div className="p-4 border-t border-slate-border space-y-3 shrink-0">
        {/* On-Device AI Status Card */}
        <div
          onClick={onOpenOllamaModal}
          className="p-3 rounded-xl border border-slate-border bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer transition-colors"
          title="Click to view local model status & Ollama connection"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${ollamaStatus?.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-navy-900 block leading-tight">
                  Local Gemma 2B
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {ollamaStatus?.available ? 'Engine Connected' : 'Engine Standby'}
                </span>
              </div>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                ollamaStatus?.available ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
          </div>

          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <Lock className="w-2.5 h-2.5" /> Zero Cloud AI
            </span>
            <span className="underline hover:text-navy-900 font-medium">Status</span>
          </div>
        </div>

        {/* Sample Data Toggle Action */}
        <div className="flex items-center justify-between text-xs px-1 text-slate-500">
          <span className="text-[11px]">Illustrative Demo:</span>
          {hasSampleData ? (
            <button
              onClick={onClearSample}
              disabled={loadingSample}
              className="text-[11px] font-semibold text-red-600 hover:underline inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Sample</span>
            </button>
          ) : (
            <button
              onClick={onLoadSample}
              disabled={loadingSample}
              className="text-[11px] font-semibold text-brand-blue hover:underline inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Bot className="w-3 h-3 text-amber-warn" />
              <span>Load Sample</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (Visible on lg: and up) */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 border-r border-slate-border shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Slide-out (Visible when toggled on mobile) */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-navy-900/40 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
