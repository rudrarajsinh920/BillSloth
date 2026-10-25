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
  Zap,
} from 'lucide-react';
import { OllamaStatus } from '../types';
import { getActiveAiEngine, getGeminiApiKey } from '../api/gemini';

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
    <div className="flex flex-col h-full bg-[#111D32] border-r border-[#29374D] select-none text-[#F8FAFC]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#29374D] flex items-center justify-between">
        <button
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          {/* Glowing Animated Sloth Emblem */}
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#22D3EE] to-[#34D399] p-[1.5px] shadow-lg shadow-[#22D3EE]/15 group-hover:shadow-[#22D3EE]/30 transition-all">
              <div className="w-full h-full bg-[#0B1220] rounded-[14px] flex items-center justify-center text-xl text-white">
                <span className="animate-float-gentle inline-block">🦥</span>
              </div>
            </div>
            {/* Pulsing online beacon */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#34D399] border-2 border-[#111D32]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-[#F8FAFC]">
                BillSloth
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
                Local
              </span>
            </div>
            <p className="text-[11px] text-[#A8B7CC] font-medium">Private Financial Vault</p>
          </div>
        </button>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-[#A8B7CC] hover:text-[#F8FAFC] hover:bg-[#162238]"
          aria-label="Close navigation sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links (Midnight Emerald + Electric Cyan design system) */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        <div>
          <span className="text-[10px] font-extrabold text-[#A8B7CC]/70 uppercase tracking-widest px-3 mb-2.5 block">
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
                      ? 'bg-[#162238] text-[#22D3EE] border border-[#29374D] shadow-sm shadow-[#22D3EE]/5'
                      : 'text-[#A8B7CC] hover:text-[#F8FAFC] hover:bg-[#162238]/60'
                  }`}
                >
                  {/* Cyan neon left accent indicator on active */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#22D3EE] shadow-sm shadow-[#22D3EE]/80" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-[#22D3EE]' : item.iconColor
                      }`}
                    />
                    <span className={isActive ? 'font-bold text-[#F8FAFC]' : 'font-medium'}>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono tabular-nums ${
                        isActive ? 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30' : item.badgeColor
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
          <span className="text-[10px] font-extrabold text-[#A8B7CC]/70 uppercase tracking-widest px-3 mb-2.5 block">
            AI Operations
          </span>
          <div className="space-y-2">
            {/* Ask Sloth AI Portal */}
            <button
              onClick={() => {
                onOpenAskModal();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#162238] hover:bg-[#1C2B46] border border-[#29374D] hover:border-[#22D3EE]/50 text-xs font-bold text-[#F8FAFC] transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-[#22D3EE]/15 text-[#22D3EE]">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse-glow" />
                </div>
                <span className="text-[#F8FAFC] group-hover:text-[#22D3EE] transition-colors">
                  Ask Sloth AI
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#0B1220] text-[#22D3EE] border border-[#29374D] font-bold">
                ⌘K
              </span>
            </button>

            <button
              onClick={() => handleNavClick('import')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'import'
                  ? 'bg-[#162238] text-[#22D3EE] border border-[#29374D]'
                  : 'text-[#A8B7CC] hover:text-[#F8FAFC] hover:bg-[#162238]/60'
              }`}
            >
              <UploadCloud className={`w-4 h-4 ${activeTab === 'import' ? 'text-[#22D3EE]' : 'text-[#34D399]'}`} />
              <span>Import New Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Area: Futuristic Local AI Engine Card & Privacy Guarantee */}
      <div className="p-4 border-t border-[#29374D] space-y-3 shrink-0">
        {/* On-Device AI Status Card */}
        {(() => {
          const engine = getActiveAiEngine();
          const hasGeminiKey = Boolean(getGeminiApiKey());
          const isGemini = engine === 'gemini' && hasGeminiKey;
          const isOllamaOnline = engine === 'ollama' && Boolean(ollamaStatus?.available);

          return (
            <div
              onClick={onOpenOllamaModal}
              className="p-3.5 rounded-xl border border-[#29374D] bg-[#162238] hover:border-[#22D3EE]/60 hover:shadow-md hover:shadow-[#22D3EE]/10 cursor-pointer transition-all relative overflow-hidden group"
              title="Click to configure AI Engine (Gemini Cloud or Local Ollama)"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl transition-colors ${
                      isGemini
                        ? 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30'
                        : isOllamaOnline
                        ? 'bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30'
                        : 'bg-[#818CF8]/15 text-[#818CF8] border border-[#818CF8]/30'
                    }`}
                  >
                    {isGemini ? <Zap className="w-4 h-4" /> : isOllamaOnline ? <Cpu className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#F8FAFC] block leading-tight">
                      {isGemini ? 'Gemini 2.5 Flash' : isOllamaOnline ? 'Local Gemma 2B' : 'In-Browser AI'}
                    </span>
                    <span className="text-[10px] text-[#A8B7CC] font-medium">
                      {isGemini ? 'Cloud AI Active' : isOllamaOnline ? 'On-Device Online' : 'Zero-Setup Ready'}
                    </span>
                  </div>
                </div>

                {/* Glowing status orb */}
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isGemini ? 'bg-[#22D3EE]' : isOllamaOnline ? 'bg-[#34D399]' : 'bg-[#818CF8]'
                    }`}
                  ></span>
                </span>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#29374D] flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 font-bold text-[#34D399]">
                  <Lock className="w-2.5 h-2.5 text-[#34D399]" /> {isGemini ? 'API Key Guarded' : '100% Zero Cloud'}
                </span>
                <span className="font-semibold text-[#22D3EE] group-hover:underline">Settings →</span>
              </div>
            </div>
          );
        })()}

        {/* Sample Data Toggle Action */}
        <div className="flex items-center justify-between text-xs px-1 text-[#A8B7CC]">
          <span className="text-[11px] font-medium">Interactive Demo:</span>
          {hasSampleData ? (
            <button
              onClick={onClearSample}
              disabled={loadingSample}
              className="text-[11px] font-bold text-[#FB7185] hover:text-[#FB7185]/80 hover:underline inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Sample</span>
            </button>
          ) : (
            <button
              onClick={onLoadSample}
              disabled={loadingSample}
              className="text-[11px] font-bold text-[#22D3EE] hover:text-[#22D3EE]/80 hover:underline inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Bot className="w-3 h-3 text-[#34D399]" />
              <span>Load Sample</span>
            </button>
          )}
        </div>

        {/* Replay Calm Sloth Intro */}
        {onReplayIntro && (
          <div className="flex items-center justify-between text-xs px-1 text-[#A8B7CC] pt-1.5 border-t border-[#29374D]">
            <span className="text-[11px] font-medium">Calm Sloth Intro:</span>
            <button
              onClick={onReplayIntro}
              className="text-[11px] font-bold text-[#22D3EE] hover:underline inline-flex items-center gap-1"
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
