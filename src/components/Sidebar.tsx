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
  onReplayIntro?: () => void;
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
  onReplayIntro,
}) => {
  const mainNav = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      iconColor: 'text-indigo-500',
    },
    {
      id: 'documents' as NavTab,
      label: 'Invoices & Bills',
      icon: Receipt,
      iconColor: 'text-cyan-500',
      badge: needsReviewCount > 0 ? needsReviewCount : undefined,
      badgeColor: 'bg-amber-500 text-white shadow-xs shadow-amber-500/30',
    },
    {
      id: 'calendar' as NavTab,
      label: 'Calendar Schedule',
      icon: Calendar,
      iconColor: 'text-blue-500',
    },
    {
      id: 'reminders' as NavTab,
      label: 'Reminders & Approvals',
      icon: BellRing,
      iconColor: 'text-violet-500',
      badge: pendingRemindersCount > 0 ? pendingRemindersCount : undefined,
      badgeColor: 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/30',
    },
    {
      id: 'digest' as NavTab,
      label: 'Weekly Digest',
      icon: CalendarCheck2,
      iconColor: 'text-teal-500',
    },
    {
      id: 'audit' as NavTab,
      label: 'System Audit Trail',
      icon: ShieldCheck,
      iconColor: 'text-emerald-500',
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl border-r border-slate-200/80 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
        <button
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          {/* Glowing Animated Sloth Emblem */}
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/35 transition-all">
              <div className="w-full h-full bg-navy-900 rounded-[14px] flex items-center justify-center text-xl text-white">
                <span className="animate-float-gentle inline-block">🦥</span>
              </div>
            </div>
            {/* Pulsing online beacon */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-navy-900 via-indigo-950 to-blue-900 bg-clip-text text-transparent">
                BillSloth
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                Local
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Private Financial Vault</p>
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

      {/* Navigation Links (FinCore & MySign layout with vibrant active state) */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 mb-2.5 block">
            Navigation
          </span>
          <nav className="space-y-1.5">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative overflow-hidden group ${
                    isActive
                      ? 'bg-gradient-to-r from-navy-900 via-indigo-950 to-navy-900 text-white shadow-md shadow-indigo-950/20'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/70'
                  }`}
                >
                  {/* Cyan neon left accent indicator on active */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-400 shadow-sm shadow-cyan-400/80" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-cyan-300' : item.iconColor
                      }`}
                    />
                    <span className={isActive ? 'font-bold' : 'font-medium'}>{item.label}</span>
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

        {/* AI & Operations (Showstopper gradient portal) */}
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 mb-2.5 block">
            AI Operations
          </span>
          <div className="space-y-2">
            {/* Ask Sloth AI with rainbow gradient border */}
            <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-sm shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all">
              <button
                onClick={() => {
                  onOpenAskModal();
                  onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] bg-white hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 text-xs font-bold text-indigo-950 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-md bg-indigo-50 text-indigo-600">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse-glow" />
                  </div>
                  <span className="bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                    Ask Sloth AI
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200/80 font-bold">
                  ⌘K
                </span>
              </button>
            </div>

            <button
              onClick={() => handleNavClick('import')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'import'
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/80'
              }`}
            >
              <UploadCloud className={`w-4 h-4 ${activeTab === 'import' ? 'text-cyan-300' : 'text-blue-500'}`} />
              <span>Import New Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Area: Futuristic Local AI Engine Card & Privacy Guarantee */}
      <div className="p-4 border-t border-slate-200/80 space-y-3 shrink-0">
        {/* On-Device AI Status Card */}
        <div
          onClick={onOpenOllamaModal}
          className="p-3.5 rounded-xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white hover:border-indigo-300/60 hover:shadow-md hover:shadow-indigo-500/10 cursor-pointer transition-all relative overflow-hidden group"
          title="Click to view local model status & Ollama connection"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl transition-colors ${
                  ollamaStatus?.available
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xs shadow-emerald-500/20'
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-200/60'
                }`}
              >
                <Cpu className="w-4 h-4" />
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

            {/* Glowing status orb */}
            <span className="relative flex h-2.5 w-2.5">
              {ollamaStatus?.available && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  ollamaStatus?.available ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              ></span>
            </span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 font-bold text-emerald-700">
              <Lock className="w-2.5 h-2.5 text-emerald-600" /> 100% Zero Cloud
            </span>
            <span className="font-semibold text-indigo-600 group-hover:underline">Guide →</span>
          </div>
        </div>

        {/* Sample Data Toggle Action */}
        <div className="flex items-center justify-between text-xs px-1 text-slate-500">
          <span className="text-[11px] font-medium">Interactive Demo:</span>
          {hasSampleData ? (
            <button
              onClick={onClearSample}
              disabled={loadingSample}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Sample</span>
            </button>
          ) : (
            <button
              onClick={onLoadSample}
              disabled={loadingSample}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Bot className="w-3 h-3 text-amber-500" />
              <span>Load Sample</span>
            </button>
          )}
        </div>

        {/* Replay Calm Sloth Intro */}
        {onReplayIntro && (
          <div className="flex items-center justify-between text-xs px-1 text-slate-500 pt-1.5 border-t border-slate-100">
            <span className="text-[11px] font-medium">Calm Sloth Intro:</span>
            <button
              onClick={onReplayIntro}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1"
            >
              <span>Play Intro ↺</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (Visible on lg: and up) */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Slide-out (Visible when toggled on mobile) */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-navy-900/50 backdrop-blur-xs transition-opacity"
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
