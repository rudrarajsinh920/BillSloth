import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldCheck, CheckCircle2, FileText, X, Laptop } from 'lucide-react';

interface CalmSlothIntroProps {
  onComplete: () => void;
  onSkip?: () => void;
}

/**
 * Fallback Vector SVG Mascot in case the raster image fails to load.
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
    <circle cx="80" cy="80" r="70" fill="#1E3A8A" opacity="0.25" />
    <ellipse cx="80" cy="116" rx="44" ry="36" fill="#8C7A68" />
    <ellipse cx="80" cy="62" rx="40" ry="34" fill="#8C7A68" />
    <path
      d="M52 64C52 48 64 40 80 40C96 40 108 48 108 64C108 78 96 86 80 86C64 86 52 78 52 64Z"
      fill="#F5EDE2"
    />
    <path d="M57 61C55 54 63 48 69 53C73 56 71 65 66 67C61 69 58 66 57 61Z" fill="#5C4D3E" />
    <path d="M103 61C105 54 97 48 91 53C87 56 89 65 94 67C99 69 102 66 103 61Z" fill="#5C4D3E" />
    <circle cx="63" cy="61" r="2" fill="#1E1B18" />
    <circle cx="97" cy="61" r="2" fill="#1E1B18" />
    <ellipse cx="80" cy="70" rx="9" ry="6" fill="#E4D5C3" />
    <ellipse cx="80" cy="68" rx="4" ry="3" fill="#2E261F" />
    <path d="M76 72C78 74 82 74 84 72" stroke="#2E261F" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const CalmSlothIntro: React.FC<CalmSlothIntroProps> = ({ onComplete, onSkip }) => {
  // Animation stages:
  // 0 (0.00s - 0.05s): Midnight background & ambient lighting fade in
  // 1 (0.05s - 1.35s): Sloth walks in from outside left edge to center carrying small invoice
  // 2 (1.35s - 1.85s): Sloth stops beside card; invoice card settles into position with Due in 5d & ✓ Organized
  // 3 (1.85s - 2.35s): BillSloth wordmark, "SLOW AND STEADY", and headline reveal
  // 4 (2.35s - 2.85s): Supporting copy & privacy shield animation
  // 5 (2.85s - 3.25s): Smooth crossfade into working dashboard
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
    // Smooth 400ms crossfade into the real dashboard
    setTimeout(() => {
      onComplete();
    }, 400);
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    if (onSkip) onSkip();
    handleFinish();
  }, [handleFinish, onSkip]);

  // Keyboard navigation: Escape or Enter skips directly to dashboard
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

  // Staged timeline sequencing with strict cleanup
  useEffect(() => {
    if (prefersReducedMotion) {
      const t = setTimeout(handleFinish, 200);
      return () => clearTimeout(t);
    }

    const timers: NodeJS.Timeout[] = [];

    // 0.05s: Sloth begins walking in from outside the left edge carrying invoice
    timers.push(setTimeout(() => setStage(1), 50));

    // 1.35s: Sloth reaches center, halts beside card; invoice card settles with Due in 5d & Organized
    timers.push(setTimeout(() => setStage(2), 1350));

    // 1.85s: Wordmark "BillSloth" & tagline "SLOW AND STEADY" reveal
    timers.push(setTimeout(() => setStage(3), 1850));

    // 2.35s: Headline, supporting copy, and local privacy shield reveal
    timers.push(setTimeout(() => setStage(4), 2350));

    // 2.85s: Begin seamless crossfade into dashboard
    timers.push(
      setTimeout(() => {
        setStage(5);
        handleFinish();
      }, 2850)
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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0B1724] text-[#F5F8FA] select-none transition-opacity duration-400 ease-out overflow-hidden ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 1. Cinematic Environment: Deep Navy with Teal Highlight Ambient Halos */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(53,214,195,0.16)_0%,rgba(8,127,91,0.08)_35%,rgba(11,23,36,0.98)_80%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-[#35D6C3]/15 via-[#087F5B]/10 to-transparent blur-3xl pointer-events-none" />

      {/* Sparse, drifting ambient light specks */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <span className="absolute top-1/4 left-1/5 w-1.5 h-1.5 rounded-full bg-[#35D6C3] animate-pulse-glow" />
        <span className="absolute top-2/3 right-1/4 w-2 h-2 rounded-full bg-[#087F8C] animate-pulse-glow" style={{ animationDelay: '1.2s' }} />
        <span className="absolute bottom-1/4 left-1/3 w-1 h-1 rounded-full bg-[#6D5CE8] animate-pulse-glow" style={{ animationDelay: '0.6s' }} />
      </div>

      {/* Top Bar: Skip Button with visible focus state */}
      <div className="absolute top-5 right-5 sm:top-7 sm:right-8 z-30">
        <button
          onClick={handleSkip}
          autoFocus
          aria-label="Skip introduction and enter dashboard immediately"
          className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-[#AABBC9] hover:text-[#F5F8FA] font-medium backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35D6C3]"
        >
          <span>Skip</span>
          <X className="w-3.5 h-3.5 text-[#AABBC9] group-hover:text-[#F5F8FA] transition-colors" />
        </button>
      </div>

      {/* Central Story Composition */}
      <div className="relative z-10 max-w-xl w-full mx-auto px-4 sm:px-6 py-6 text-center flex flex-col items-center">
        {/* Hero Presentation Stage: Sloth Mascot & Settled Invoice Card Side-by-Side */}
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 min-h-[160px] sm:min-h-[175px] w-full">
          {/* Walking Mascot Container: Walks across screen from outside left edge to center */}
          <div
            className={`relative transition-all duration-500 ease-out z-20 ${
              stage >= 1 ? 'opacity-100' : 'opacity-0'
            } ${stage === 1 ? 'animate-teddy-entrance' : ''}`}
          >
            <div className={`relative ${stage === 1 ? 'animate-teddy-step' : 'animate-float-gentle'}`}>
              {/* Mascot Avatar Ring with Teal-Highlight Edge */}
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-[2.5px] bg-gradient-to-b from-[#35D6C3]/40 via-[#087F8C]/25 to-transparent shadow-2xl shadow-black/70 relative overflow-hidden bg-[#142536] mx-auto">
                {!imgError ? (
                  <img
                    src="/sloth-avatar.png"
                    alt="BillSloth 3D Mascot: A warm, friendly knitted sloth"
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

              {/* Natural soft shadow beneath sloth (moves in sync with walking cadence) */}
              <div
                className={`w-24 sm:w-32 h-3 rounded-full bg-black/45 blur-md mx-auto -mt-1.5 transition-all duration-300 ${
                  stage === 1 ? 'animate-teddy-shadow-step' : 'opacity-40'
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
                <div className="bg-[#142536]/95 text-[#F5F8FA] rounded-xl px-2.5 py-1.5 shadow-xl border border-[#29374D] flex items-center gap-1.5 backdrop-blur-md ring-1 ring-[#35D6C3]/40">
                  <div className="w-4 h-4 rounded-md bg-[#0B1724] text-[#35D6C3] border border-[#29374D] flex items-center justify-center shrink-0">
                    <FileText className="w-2.5 h-2.5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] font-black text-[#F5F8FA] block leading-tight">
                      Bill
                    </span>
                    <span className="text-[8px] font-bold text-[#FBBF24] font-mono block">
                      $128.50
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settled, Organized Card (Sloth brings bill into order right beside him) */}
          <div
            className={`w-full max-w-xs sm:w-80 transition-all duration-500 ease-out z-10 ${
              stage >= 2
                ? 'opacity-100 translate-x-0 scale-100 animate-card-settle'
                : 'opacity-0 -translate-x-6 scale-90 pointer-events-none'
            }`}
          >
            <div className="bg-[#142536]/95 text-[#F5F8FA] rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-[#29374D] text-left ring-2 ring-[#35D6C3] shadow-[#35D6C3]/20 backdrop-blur-md">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-xl bg-[#0B1724] text-[#35D6C3] border border-[#29374D] flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-[#F5F8FA] block truncate">
                      Broadband & Utilities
                    </span>
                    <span className="text-[10px] text-[#AABBC9] font-medium block">
                      Sample Illustrative Bill
                    </span>
                  </div>
                </div>

                {/* Due Date & Organized Status */}
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-[#F5F8FA] font-mono block tabular-nums">
                    $128.50
                  </span>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30">
                      Due in 5d
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 flex items-center gap-0.5 shadow-2xs">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Organized
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Brand & Wordmark Reveal (1.85s) */}
        <div
          className={`mt-4 space-y-1 transition-all duration-500 ease-out ${
            stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F5F8FA]">
              BillSloth
            </h1>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#35D6C3]/15 text-[#35D6C3] border border-[#35D6C3]/30">
              Local AI
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#AABBC9]">
            SLOW AND STEADY
          </p>
        </div>

        {/* 4. Headline, Supporting Copy, and Privacy Shield (2.35s) */}
        <div
          className={`mt-3.5 space-y-2.5 transition-all duration-500 ease-out ${
            stage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F5F8FA]">
            Bills handled. Peace of mind.
          </h2>
          <p className="text-xs sm:text-[13px] text-[#AABBC9] max-w-sm mx-auto leading-relaxed font-normal">
            Your bills, organized. Your documents, on your device.
          </p>

          {/* Privacy Shield with Device Outline & Subtle Pulsing Glow */}
          <div className="pt-1 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#35D6C3]/15 border border-[#35D6C3]/35 text-[#35D6C3] text-xs font-semibold shadow-sm animate-shield-glow">
              <Laptop className="w-3.5 h-3.5 text-[#35D6C3] shrink-0" />
              <span>On-Device Storage</span>
              <span className="text-[#35D6C3]/60">•</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#35D6C3] shrink-0" />
              <span>Zero Cloud AI Transmission</span>
            </div>
          </div>
        </div>

        {/* Minimalist Progress Indicator */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage >= 1 ? 'bg-[#35D6C3] scale-100' : 'bg-white/20 scale-75'
            }`}
          />
          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage >= 2 ? 'bg-[#35D6C3] scale-100' : 'bg-white/20 scale-75'
            }`}
          />
          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage >= 3 ? 'bg-[#087F8C] scale-100' : 'bg-white/20 scale-75'
            }`}
          />
          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage >= 4 ? 'bg-[#34D399] scale-100' : 'bg-white/20 scale-75'
            }`}
          />
        </div>
      </div>
    </aside>
  );
};
