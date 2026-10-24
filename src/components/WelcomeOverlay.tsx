import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  ArrowRight,
  X,
  Lock,
} from 'lucide-react';

interface WelcomeOverlayProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ isOpen, onDismiss }) => {
  // Step in the animation sequence (0 through 5)
  const [step, setStep] = useState(0);

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onDismiss();
      }
      if (e.key === 'Enter' && isOpen && step >= 4) {
        onDismiss();
      }
    },
    [isOpen, onDismiss, step]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Staggered animation timer
  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      return;
    }

    if (prefersReducedMotion) {
      // Immediate reveal for users who prefer reduced motion
      setStep(5);
      return;
    }

    // Sequence stages:
    // 0ms: Logo & sloth
    // 400ms: Wordmark & tagline
    // 900ms: Illustrative sample bill card springs into view
    // 1500ms: Hero headline & supporting copy
    // 2100ms: Local privacy indicator
    // 2500ms: Ready with Get Started CTA
    const timers = [
      setTimeout(() => setStep(1), 100),
      setTimeout(() => setStep(2), 500),
      setTimeout(() => setStep(3), 1100),
      setTimeout(() => setStep(4), 1700),
      setTimeout(() => setStep(5), 2300),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isOpen, prefersReducedMotion]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-headline"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden text-center p-6 sm:p-10 select-none">
        {/* Subtle background ambient mesh glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-tr from-indigo-500/10 to-blue-500/15 filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-tr from-cyan-500/10 to-emerald-500/15 filter blur-3xl pointer-events-none" />

        {/* Top Controls: Tagline & Skip Button */}
        <div className="flex items-center justify-between w-full mb-6 relative z-10">
          <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
            Slow and Steady
          </span>

          <button
            onClick={onDismiss}
            aria-label="Skip welcome introduction"
            className="text-xs font-semibold text-slate-400 hover:text-navy-900 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none flex items-center gap-1"
          >
            <span>Skip</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1 & 2: Logo, Wordmark, and Sloth Identity */}
        <div
          className={`flex flex-col items-center transition-all duration-500 relative z-10 ${
            step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          {/* Sloth Mascot Emblem */}
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-navy-900 via-indigo-950 to-blue-900 p-[2px] shadow-xl shadow-indigo-500/20">
              <div className="w-full h-full bg-navy-900 rounded-[14px] flex items-center justify-center text-3xl">
                <span className="animate-float-gentle inline-block">🦥</span>
              </div>
            </div>
            {/* Pulsing online air-gap dot */}
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-navy-900 tracking-tight">
              BillSloth
            </h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Local AI
            </span>
          </div>
        </div>

        {/* 3: Illustrative Sample Bill Card (Gentle spring / slide-in) */}
        <div
          className={`mt-5 transition-all duration-600 relative z-10 ${
            step >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          <div className="max-w-xs mx-auto p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-200/90 shadow-lg shadow-slate-200/50 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-blue border border-blue-200/60 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-navy-900 block truncate">
                  Fiber Broadband
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Due in 5 days • Telecom
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-black text-navy-900 font-mono block tabular-nums">
                $79.00
              </span>
              <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5 justify-end">
                <CheckCircle2 className="w-2.5 h-2.5" /> Verified
              </span>
            </div>
          </div>
        </div>

        {/* 4: Hero Headline & Supporting Copy */}
        <div
          className={`mt-6 space-y-2 relative z-10 transition-all duration-600 ${
            step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <h1
            id="welcome-headline"
            className="text-lg sm:text-xl font-black text-navy-900 tracking-tight"
          >
            Bills handled. Peace of mind.
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-600 max-w-sm mx-auto leading-relaxed">
            Organize your bills, spot upcoming deadlines, and review AI-extracted details — while keeping your documents on your device.
          </p>
        </div>

        {/* 5: Compact Local-Privacy Indicator */}
        <div
          className={`mt-5 relative z-10 transition-all duration-500 ${
            step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>100% Air-Gapped Privacy</span>
            <span className="text-emerald-300">•</span>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Zero Cloud Transmission
            </span>
          </div>
        </div>

        {/* 6: Get Started Primary Action CTA */}
        <div
          className={`mt-7 relative z-10 transition-all duration-500 ${
            step >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <button
            onClick={onDismiss}
            autoFocus
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-navy-900 via-indigo-950 to-navy-900 hover:from-brand-blue hover:via-indigo-600 hover:to-cyan-600 text-white text-xs font-extrabold shadow-lg shadow-indigo-950/25 hover:shadow-indigo-600/35 inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">
            Press <kbd className="font-mono bg-slate-100 border border-slate-200 px-1 py-0.2 rounded text-slate-600">Enter</kbd> to continue or <kbd className="font-mono bg-slate-100 border border-slate-200 px-1 py-0.2 rounded text-slate-600">Esc</kbd> to skip
          </p>
        </div>
      </div>
    </div>
  );
};
