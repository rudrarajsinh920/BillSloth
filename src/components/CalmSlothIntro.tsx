import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldCheck, CheckCircle2, FileText, X, Laptop } from 'lucide-react';

interface CalmSlothIntroProps {
  onComplete: () => void;
  onSkip?: () => void;
}

/**
 * Handcrafted Vector SVG Mascot fallback in case the raster image fails to load.
 * 100% self-contained so the intro NEVER produces a broken or blank layout.
 */
const FallbackSlothSvg: React.FC = () => (
  <svg
    viewBox="0 0 160 160"
    className="w-28 h-28 sm:w-36 sm:h-36 drop-shadow-2xl mx-auto"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="BillSloth mascot"
    role="img"
  >
    <circle cx="80" cy="80" r="72" fill="#10363A" opacity="0.8" />
    <circle cx="80" cy="80" r="68" stroke="#36D399" strokeWidth="2" strokeOpacity="0.4" />
    <ellipse cx="80" cy="116" rx="44" ry="36" fill="#8C7A68" />
    <ellipse cx="80" cy="62" rx="40" ry="34" fill="#8C7A68" />
    <path
      d="M52 64C52 48 64 40 80 40C96 40 108 48 108 64C108 78 96 86 80 86C64 86 52 78 52 64Z"
      fill="#FFF2D8"
    />
    <path d="M57 61C55 54 63 48 69 53C73 56 71 65 66 67C61 69 58 66 57 61Z" fill="#5C4D3E" />
    <path d="M103 61C105 54 97 48 91 53C87 56 89 65 94 67C99 69 102 66 103 61Z" fill="#5C4D3E" />
    <circle cx="63" cy="61" r="2.5" fill="#071F24" />
    <circle cx="97" cy="61" r="2.5" fill="#071F24" />
    <ellipse cx="80" cy="70" rx="9" ry="6" fill="#E4D5C3" />
    <ellipse cx="80" cy="68" rx="4" ry="3" fill="#2E261F" />
    <path d="M76 72C78 74 82 74 84 72" stroke="#2E261F" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const CalmSlothIntro: React.FC<CalmSlothIntroProps> = ({ onComplete, onSkip }) => {
  /**
   * Cinematic Staged Timeline:
   * Stage 0 (0.00s - 0.10s): Scene 1 — A Quiet Beginning. Deep midnight-teal with soft emerald light pool on the left.
   * Stage 1 (0.10s - 1.45s): Scene 2 — The Sloth Arrives. Walks in from beyond left edge across the screen carrying bill.
   * Stage 2 (1.45s - 2.15s): Scene 3 — The Bill Is Organized. Sloth halts and presents the bill; floating card settles with Due in 4d & ✓ Organized.
   * Stage 3 (2.15s - 2.80s): Scene 4 — The Brand Reveal. Wordmark "BILLSLOTH", "SLOW AND STEADY", headline, and subtext.
   * Stage 4 (2.80s - 3.35s): Privacy shield illuminates with electric turquoise highlight.
   * Stage 5 (3.35s - 3.75s): Scene 5 — Enter Command Center. Natural settle and smooth dissolve into real dashboard.
   */
  const [stage, setStage] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const hasFinishedRef = useRef(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleFinish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsExiting(true);
    // Smooth 420ms dissolve into the real dashboard
    setTimeout(() => {
      onComplete();
    }, 420);
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    if (onSkip) onSkip();
    handleFinish();
  }, [handleFinish, onSkip]);

  // Keyboard controls: Escape or Enter immediately skips to dashboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSkip]);

  // Sequenced timeline with strict timer cleanup
  useEffect(() => {
    if (prefersReducedMotion) {
      const t = setTimeout(handleFinish, 180);
      return () => clearTimeout(t);
    }

    const timers: NodeJS.Timeout[] = [];

    // 0.10s: Scene 2 — Sloth begins walking from beyond the left edge carrying invoice
    timers.push(setTimeout(() => setStage(1), 100));

    // 1.45s: Scene 3 — Sloth reaches station, pauses, and the invoice settles into the organized floating card
    timers.push(setTimeout(() => setStage(2), 1450));

    // 2.15s: Scene 4 — Brand reveal: "BILLSLOTH", "SLOW AND STEADY", "Bills handled. Peace of mind."
    timers.push(setTimeout(() => setStage(3), 2150));

    // 2.80s: Privacy shield emblem illuminates with soft turquoise glow
    timers.push(setTimeout(() => setStage(4), 2800));

    // 3.35s: Scene 5 — Begin smooth dissolve into the command center
    timers.push(
      setTimeout(() => {
        setStage(5);
        handleFinish();
      }, 3350)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [handleFinish, prefersReducedMotion]);

  return (
    <aside
      role="region"
      aria-label="BillSloth Welcome Experience"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#071F24] text-[#F8FAF7] select-none transition-all duration-450 ease-out overflow-hidden ${
        isExiting ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Atmospheric Lighting: Deep Midnight Teal with Soft Emerald Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(54,211,153,0.14)_0%,rgba(16,54,58,0.35)_40%,#071F24_85%)] pointer-events-none" />

      {/* Pool of emerald light on the left indicating where the sloth arrives */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full bg-gradient-to-tr from-[#36D399]/18 via-[#42E8C4]/12 to-transparent blur-3xl pointer-events-none animate-pulse duration-1000" />

      {/* Subtle depth lighting across bottom horizon */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[720px] h-[280px] bg-[#10363A]/40 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle atmospheric accents */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <span className="absolute top-1/4 left-1/5 w-1.5 h-1.5 rounded-full bg-[#42E8C4] animate-pulse" />
        <span className="absolute top-2/3 right-1/4 w-2 h-2 rounded-full bg-[#36D399] animate-pulse" style={{ animationDelay: '1.2s' }} />
      </div>

      {/* Top Bar: Skip Button with visible keyboard focus ring */}
      <div className="absolute top-5 right-5 sm:top-7 sm:right-8 z-30">
        <button
          onClick={handleSkip}
          autoFocus
          aria-label="Skip introduction and enter dashboard immediately"
          className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#10363A]/80 hover:bg-[#10363A] border border-[#36D399]/25 hover:border-[#42E8C4]/50 text-xs text-[#B8D2CE] hover:text-[#F8FAF7] font-semibold backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#42E8C4] cursor-pointer shadow-sm"
        >
          <span>Skip</span>
          <X className="w-3.5 h-3.5 text-[#B8D2CE] group-hover:text-[#F8FAF7] transition-colors" />
        </button>
      </div>

      {/* Central Story Composition */}
      <div className="relative z-10 max-w-xl w-full mx-auto px-4 sm:px-6 py-6 text-center flex flex-col items-center">
        {/* Presentation Stage: Sloth Mascot & Floating Settled Card */}
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 min-h-[160px] sm:min-h-[175px] w-full">
          {/* Walking Mascot Container: Travels across screen from outside left edge to center */}
          <div
            className={`relative transition-all duration-500 ease-out z-20 ${
              stage >= 1 ? 'opacity-100' : 'opacity-0'
            } ${stage === 1 ? 'animate-sloth-travel' : ''}`}
          >
            <div className={`relative ${stage === 1 ? 'animate-sloth-waddle' : 'animate-float-gentle'}`}>
              {/* Mascot Avatar Ring with Emerald & Electric Turquoise Edge */}
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-[2.5px] bg-gradient-to-b from-[#42E8C4]/60 via-[#36D399]/30 to-[#10363A] shadow-2xl shadow-black/85 relative overflow-hidden bg-[#10363A] mx-auto ring-1 ring-[#36D399]/30">
                {!imgError ? (
                  <img
                    src="/sloth-avatar.png"
                    alt="BillSloth Mascot: A warm, knitted sloth bringing bills into order"
                    className={`w-full h-full object-cover rounded-full transition-opacity duration-500 ${
                      imgLoaded ? 'opacity-100' : 'opacity-95'
                    }`}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <FallbackSlothSvg />
                )}
              </div>

              {/* Natural soft shadow beneath sloth (synchronous with walking gait) */}
              <div
                className={`w-24 sm:w-32 h-3 rounded-full bg-black/60 blur-md mx-auto -mt-1.5 transition-all duration-300 ${
                  stage === 1 ? 'animate-sloth-shadow' : 'opacity-40'
                }`}
              />

              {/* Small Carried Bill held in paws during walk */}
              <div
                className={`absolute -bottom-1 -right-1 sm:right-1 z-30 transition-all duration-400 ease-out ${
                  stage === 1
                    ? 'opacity-100 scale-100 rotate-[-4deg]'
                    : 'opacity-0 scale-75 pointer-events-none'
                }`}
              >
                <div className="bg-[#10363A]/95 text-[#F8FAF7] rounded-xl px-2.5 py-1.5 shadow-xl border border-[#36D399]/30 flex items-center gap-1.5 backdrop-blur-md ring-1 ring-[#42E8C4]/40">
                  <div className="w-4 h-4 rounded-md bg-[#071F24] text-[#42E8C4] border border-[#36D399]/30 flex items-center justify-center shrink-0">
                    <FileText className="w-2.5 h-2.5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] font-black text-[#F8FAF7] block leading-tight">
                      Bill
                    </span>
                    <span className="text-[8px] font-bold text-[#FFF2D8] font-mono block">
                      $142.50
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settled, Organized Card (Bill expands into an elegant financial record) */}
          <div
            className={`w-full max-w-xs sm:w-80 transition-all duration-500 ease-out z-10 ${
              stage >= 2
                ? 'opacity-100 translate-x-0 scale-100 animate-bill-card-present'
                : 'opacity-0 -translate-x-6 scale-90 pointer-events-none'
            }`}
          >
            <div className="bg-[#10363A]/95 text-[#F8FAF7] rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-[#36D399]/30 text-left ring-2 ring-[#42E8C4]/50 shadow-[#36D399]/20 backdrop-blur-md">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-xl bg-[#071F24] text-[#42E8C4] border border-[#36D399]/30 flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-[#F8FAF7] block truncate">
                      Metro Grid Power & Light
                    </span>
                    <span className="text-[10px] text-[#B8D2CE] font-medium block">
                      Sample Illustrative Bill
                    </span>
                  </div>
                </div>

                {/* Due Date & Organized Status */}
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-[#FFF2D8] font-mono block tabular-nums">
                    $142.50
                  </span>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FBBF24]/20 text-[#FFF2D8] border border-[#FBBF24]/40">
                      Due in 4d
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#36D399]/20 text-[#36D399] border border-[#36D399]/40 flex items-center gap-0.5 shadow-2xs">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Organized
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scene 4: Brand & Wordmark Reveal */}
        <div
          className={`mt-4 sm:mt-5 space-y-1 transition-all duration-500 ease-out ${
            stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F8FAF7]">
              BILLSLOTH
            </h1>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#36D399]/15 text-[#42E8C4] border border-[#42E8C4]/30 shadow-2xs">
              FINANCIAL COMMAND
            </span>
          </div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#FFF2D8]">
            SLOW AND STEADY
          </p>
        </div>

        {/* Supporting Copy & Privacy Shield */}
        <div
          className={`mt-3.5 space-y-2.5 transition-all duration-500 ease-out ${
            stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F8FAF7]">
            Bills handled. Peace of mind.
          </h2>
          <p className="text-xs sm:text-[13px] text-[#B8D2CE] max-w-sm mx-auto leading-relaxed font-normal">
            Your bills, organized. Your documents, on your device.
          </p>

          {/* Privacy Shield with Device Outline & Turquoise Highlight */}
          <div
            className={`pt-1 flex items-center justify-center transition-all duration-500 ${
              stage >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10363A]/90 border border-[#42E8C4]/40 text-[#42E8C4] text-xs font-semibold shadow-sm animate-emerald-aura">
              <Laptop className="w-3.5 h-3.5 text-[#36D399] shrink-0" />
              <span>On-Device Storage</span>
              <span className="text-[#36D399]/60">•</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#36D399] shrink-0" />
              <span>Zero Cloud AI Transmission</span>
            </div>
          </div>
        </div>

        {/* Minimalist Progress Rhythm Dots */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage >= 1 ? 'bg-[#42E8C4] scale-100' : 'bg-white/20 scale-75'
            }`}
          />
          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage >= 2 ? 'bg-[#36D399] scale-100' : 'bg-white/20 scale-75'
            }`}
          />
          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage >= 3 ? 'bg-[#FFF2D8] scale-100' : 'bg-white/20 scale-75'
            }`}
          />
          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage >= 4 ? 'bg-[#36D399] scale-100' : 'bg-white/20 scale-75'
            }`}
          />
        </div>
      </div>
    </aside>
  );
};
export default CalmSlothIntro;
