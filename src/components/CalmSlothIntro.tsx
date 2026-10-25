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
    className="w-32 h-32 sm:w-36 sm:h-36 drop-shadow-2xl mx-auto"
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
  // 0 (0.0s - 0.4s): Midnight background & ambient light emerge
  // 1 (0.3s - 0.8s): Sloth emerges smoothly; scattered document cards appear
  // 2 (0.8s - 1.6s): Document cards glide together into organized invoice card with blue highlight
  // 3 (1.4s - 2.2s): BillSloth wordmark, tagline, and headline appear
  // 4 (2.0s - 2.6s): Privacy shield & device indicator reveal
  // 5 (2.6s - 3.0s): Smooth crossfade into live dashboard
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

  // Staged timeline sequencing
  useEffect(() => {
    if (prefersReducedMotion) {
      const t = setTimeout(handleFinish, 300);
      return () => clearTimeout(t);
    }

    const t0 = setTimeout(() => setStage(1), 50);    // 0.0s - 0.4s: Mascot emerges
    const t1 = setTimeout(() => setStage(2), 750);   // 0.8s - 1.4s: Documents glide & organize
    const t2 = setTimeout(() => setStage(3), 1400);  // 1.4s - 2.0s: Wordmark & headline
    const t3 = setTimeout(() => setStage(4), 2000);  // 2.0s - 2.6s: Privacy reveal
    const t4 = setTimeout(() => {
      setStage(5);
      handleFinish();                                // 2.6s - 3.0s: Seamless dashboard transition
    }, 2800);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [handleFinish, prefersReducedMotion]);

  return (
    <aside
      role="region"
      aria-label="BillSloth Welcome Experience"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#090D16] text-white select-none transition-opacity duration-400 ease-out overflow-hidden ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 1. Cinematic Environment: Midnight Navy with Deep Radial Halos */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(14,165,233,0.14)_0%,rgba(37,99,235,0.12)_35%,rgba(9,13,22,0.98)_80%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Sparse, drifting ambient light specks */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <span className="absolute top-1/4 left-1/5 w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse-glow" />
        <span className="absolute top-2/3 right-1/4 w-2 h-2 rounded-full bg-blue-400 animate-pulse-glow" style={{ animationDelay: '1.2s' }} />
        <span className="absolute bottom-1/4 left-1/3 w-1 h-1 rounded-full bg-indigo-300 animate-pulse-glow" style={{ animationDelay: '0.6s' }} />
      </div>

      {/* Top Bar: Skip Button with visible focus state */}
      <div className="absolute top-5 right-5 sm:top-7 sm:right-8 z-30">
        <button
          onClick={handleSkip}
          autoFocus
          aria-label="Skip introduction and enter dashboard immediately"
          className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-slate-300 hover:text-white font-medium backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <span>Skip</span>
          <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Central Story Composition */}
      <div className="relative z-10 max-w-lg w-full mx-auto px-6 py-8 text-center flex flex-col items-center">
        {/* Layered Composition: Mascot + Transforming Bill Story */}
        <div className="relative flex flex-col items-center">
          {/* Mascot Container with Ambient Backlight Halo */}
          <div
            className={`relative transition-all duration-700 ease-out ${
              stage >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-90'
            }`}
          >
            {/* Glowing Aperture Ring & Soft Shadow */}
            <div className="relative group">
              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full p-[2px] bg-gradient-to-b from-cyan-400/30 via-blue-500/20 to-transparent shadow-2xl shadow-blue-950/60 relative overflow-hidden">
                {!imgError ? (
                  <img
                    src="/sloth-avatar.png"
                    alt="BillSloth 3D Mascot: A warm, friendly knitted sloth"
                    className={`w-full h-full object-cover rounded-full transition-opacity duration-500 animate-float-gentle ${
                      imgLoaded ? 'opacity-100' : 'opacity-90'
                    }`}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <FallbackSlothSvg />
                )}
              </div>

              {/* Natural soft shadow beneath sloth */}
              <div className="w-32 sm:w-40 h-3 rounded-full bg-black/40 blur-md mx-auto -mt-1.5" />
            </div>
          </div>

          {/* Miniature Product Story: Scattered Papers Gliding into One Clean Organized Bill */}
          <div className="relative -mt-6 sm:-mt-8 z-20 w-64 sm:w-72 h-20">
            {/* Scattered Paper A (drifting in from left, then merging) */}
            <div
              className={`absolute left-0 top-0 w-36 bg-white/70 backdrop-blur-xs rounded-lg p-2 shadow-md border border-slate-200 text-left transition-all duration-700 ease-out ${
                stage === 1
                  ? 'opacity-80 -translate-x-5 -translate-y-2 -rotate-12 scale-90'
                  : stage >= 2
                  ? 'opacity-0 translate-x-12 translate-y-2 rotate-0 scale-75 pointer-events-none'
                  : 'opacity-0 -translate-x-12'
              }`}
            >
              <div className="h-2 w-16 bg-slate-300 rounded-sm mb-1" />
              <div className="h-1.5 w-20 bg-slate-200 rounded-sm" />
            </div>

            {/* Scattered Paper B (drifting in from right, then merging) */}
            <div
              className={`absolute right-0 top-1 w-36 bg-white/70 backdrop-blur-xs rounded-lg p-2 shadow-md border border-slate-200 text-left transition-all duration-700 ease-out ${
                stage === 1
                  ? 'opacity-80 translate-x-5 translate-y-1 rotate-12 scale-90'
                  : stage >= 2
                  ? 'opacity-0 -translate-x-12 translate-y-1 rotate-0 scale-75 pointer-events-none'
                  : 'opacity-0 translate-x-12'
              }`}
            >
              <div className="h-2 w-14 bg-slate-300 rounded-sm mb-1" />
              <div className="h-1.5 w-18 bg-slate-200 rounded-sm" />
            </div>

            {/* Unified, Organized Invoice Card (glides into focus with cyan/blue highlight) */}
            <div
              className={`absolute inset-x-0 top-0 bg-white/95 text-navy-900 rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-slate-200 text-left transition-all duration-600 ease-out ${
                stage >= 2
                  ? 'opacity-100 translate-y-0 scale-100 ring-2 ring-cyan-400/80 shadow-cyan-500/20'
                  : 'opacity-0 translate-y-4 scale-90'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="text-[11px] font-bold text-navy-900 block truncate">
                      Broadband & Utilities
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium block">
                      Sample Illustrative Bill
                    </span>
                  </div>
                </div>

                {/* Due Date & Organized Status */}
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-navy-900 font-mono block tabular-nums">
                    $128.50
                  </span>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                      Due in 5d
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Organized
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Brand & Wordmark Reveal (1.4s - 2.0s) */}
        <div
          className={`mt-4 space-y-1 transition-all duration-600 ease-out ${
            stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              BillSloth
            </h1>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              Local AI
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Slow and Steady
          </p>
        </div>

        {/* 4. Headline, Supporting Copy, and Privacy Shield (2.0s - 2.6s) */}
        <div
          className={`mt-4 space-y-2.5 transition-all duration-600 ease-out ${
            stage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-100">
            Bills handled. Peace of mind.
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-300 max-w-sm mx-auto leading-relaxed font-normal">
            Your bills, organized. Your documents, on your device.
          </p>

          {/* Privacy Shield with Device Outline */}
          <div className="pt-1 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold shadow-sm">
              <Laptop className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>On-Device Storage</span>
              <span className="text-emerald-400/60">•</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Zero Cloud AI Transmission</span>
            </div>
          </div>
        </div>

        {/* Minimalist Progress Indicator */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage >= 1 ? 'bg-cyan-400 scale-100' : 'bg-white/20 scale-75'
            }`}
          />
          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage >= 2 ? 'bg-cyan-400 scale-100' : 'bg-white/20 scale-75'
            }`}
          />
          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage >= 3 ? 'bg-blue-400 scale-100' : 'bg-white/20 scale-75'
            }`}
          />
          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage >= 4 ? 'bg-emerald-400 scale-100' : 'bg-white/20 scale-75'
            }`}
          />
        </div>
      </div>
    </aside>
  );
};
