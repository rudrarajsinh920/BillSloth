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
  Trash2,
  Bot,
  X,
  Lock,
  Settings,
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
      iconColor: 'text-[#22D3EE]',
    },
    {
      id: 'documents' as NavTab,
      label: 'Invoices & Bills',
      icon: Receipt,
      iconColor: 'text-[#34D399]',
      badge: needsReviewCount > 0 ? needsReviewCount : undefined,
      badgeColor: 'bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/30',
    },
    {
      id: 'calendar' as NavTab,
      label: 'Calendar Schedule',
      icon: Calendar,
      iconColor: 'text-[#818CF8]',
    },
    {
      id: 'reminders' as NavTab,
      label: 'Reminders & Approvals',
      icon: BellRing,
      iconColor: 'text-[#FBBF24]',
      badge: pendingRemindersCount > 0 ? pendingRemindersCount : undefined,
      badgeColor: 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30',
    },
    {
      id: 'digest' as NavTab,
      label: 'Weekly Digest',
      icon: CalendarCheck2,
      iconColor: 'text-[#34D399]',
    },
    {
      id: 'audit' as NavTab,
      label: 'System Audit Trail',
      icon: ShieldCheck,
      iconColor: 'text-[#22D3EE]',
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#DCE4E5] select-none text-[#172A35]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#DCE4E5] flex items-center justify-between">
        <button
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          {/* Animated Sloth Emblem */}
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-[#DDF5F6] border border-[#087F8C]/30 flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
              <span className="animate-float-gentle inline-block">🦥</span>
            </div>
            {/* Online beacon */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#087F5B] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#087F5B] border-2 border-white"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-[#172A35]">
                BillSloth
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/30">
                Local
              </span>
            </div>
            <p className="text-[11px] text-[#526572] font-medium">Private Financial Vault</p>
          </div>
        </button>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-[#526572] hover:text-[#172A35] hover:bg-[#F7F8F5]"
          aria-label="Close navigation sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        <div>
          <span className="text-[10px] font-extrabold text-[#71828D] uppercase tracking-widest px-3 mb-2.5 block">
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
                      ? 'bg-[#DDF5F6] text-[#087F8C] font-bold border border-[#087F8C]/25 shadow-xs'
                      : 'text-[#526572] hover:text-[#172A35] hover:bg-[#F7F8F5]'
                  }`}
                >
                  {/* Teal left accent indicator on active */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#087F8C]" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-[#087F8C]' : 'text-[#526572]'
                      }`}
                    />
                    <span className={isActive ? 'font-bold text-[#172A35]' : 'font-medium'}>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono tabular-nums ${
                        isActive ? 'bg-[#087F8C] text-white' : item.badgeColor
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

        {/* AI & Operations */}
        <div>
          <span className="text-[10px] font-extrabold text-[#71828D] uppercase tracking-widest px-3 mb-2.5 block">
            AI Operations
          </span>
          <div className="space-y-2">
            {/* Ask BillSloth Portal */}
            <button
              onClick={() => {
                onOpenAskModal();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F7F8F5] hover:bg-white border border-[#DCE4E5] hover:border-[#087F8C]/50 text-xs font-bold text-[#172A35] transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-[#DDF5F6] text-[#087F8C]">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-[#172A35] group-hover:text-[#087F8C] transition-colors">
                  Ask BillSloth
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white text-[#526572] border border-[#DCE4E5] font-bold">
                ⌘K
              </span>
            </button>

            <button
              onClick={() => handleNavClick('import')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'import'
                  ? 'bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/25'
                  : 'text-[#526572] hover:text-[#172A35] hover:bg-[#F7F8F5]'
              }`}
            >
              <UploadCloud className={`w-4 h-4 ${activeTab === 'import' ? 'text-[#087F8C]' : 'text-[#087F5B]'}`} />
              <span>Import New Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Area: Assistant & Demo Controls */}
      <div className="p-4 border-t border-[#DCE4E5] space-y-3 shrink-0 bg-white">
        {/* Assistant Quick Access & Configuration Card */}
        <div
          onClick={onOpenOllamaModal}
          className="p-3.5 rounded-xl border border-[#DCE4E5] bg-[#F7F8F5] hover:border-[#087F8C]/50 hover:bg-white hover:shadow-xs cursor-pointer transition-all relative overflow-hidden group"
          title={ollamaStatus?.available ? "BillSloth Assistant (Local Engine Connected)" : "Assistant Settings & Model Configuration"}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/20">
                <Sparkles className="w-4 h-4 text-[#087F8C]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#172A35] block leading-tight">
                  BillSloth Assistant
                </span>
                <span className="text-[10px] text-[#087F5B] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B] inline-block animate-pulse"></span>
                  Ledger Intelligence Ready
                </span>
              </div>
            </div>

            <Settings className="w-4 h-4 text-[#526572] group-hover:text-[#087F8C] transition-colors" />
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#DCE4E5] flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 font-bold text-[#526572]">
              <Lock className="w-2.5 h-2.5 text-[#087F5B]" /> On-Device Privacy
            </span>
            <span className="font-semibold text-[#087F8C] group-hover:underline">Settings →</span>
          </div>
        </div>

        {/* Sample Data Toggle Action */}
        <div className="flex items-center justify-between text-xs px-1 text-[#526572]">
          <span className="text-[11px] font-medium">Interactive Demo:</span>
          {hasSampleData ? (
            <button
              onClick={onClearSample}
              disabled={loadingSample}
              className="text-[11px] font-bold text-[#BE123C] hover:underline inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Sample</span>
            </button>
          ) : (
            <button
              onClick={onLoadSample}
              disabled={loadingSample}
              className="text-[11px] font-bold text-[#087F8C] hover:underline inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Bot className="w-3 h-3 text-[#087F5B]" />
              <span>Load Sample</span>
            </button>
          )}
        </div>

        {/* Replay Calm Sloth Intro */}
        {onReplayIntro && (
          <div className="flex items-center justify-between text-xs px-1 text-[#526572] pt-1.5 border-t border-[#DCE4E5]">
            <span className="text-[11px] font-medium">Calm Sloth Intro:</span>
            <button
              onClick={onReplayIntro}
              className="text-[11px] font-bold text-[#087F8C] hover:underline inline-flex items-center gap-1"
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
            className="fixed inset-0 bg-[#0B1220]/75 backdrop-blur-xs transition-opacity"
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
