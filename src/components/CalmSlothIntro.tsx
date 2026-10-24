import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldCheck, CheckCircle2, X } from 'lucide-react';

interface CalmSlothIntroProps {
  onComplete: () => void;
  onSkip?: () => void;
}

/**
 * Bespoke Vector SVG Mascot: The Calm Sloth holding an invoice.
 * Handcrafted vector artwork designed specifically for BillSloth's brand.
 * 100% self-contained, 0KB network payload, zero external failure risk.
 */
const CalmSlothSvg: React.FC<{ isOrganizing: boolean }> = ({ isOrganizing }) => (
  <svg
    viewBox="0 0 160 160"
    className="w-32 h-32 sm:w-36 sm:h-36 drop-shadow-xl"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="BillSloth mascot: a friendly sloth organizing a bill"
    role="img"
  >
    {/* Soft ambient aura */}
    <circle cx="80" cy="80" r="72" fill="url(#slothGlow)" opacity="0.4" />

    {/* Body / Torso */}
    <ellipse cx="80" cy="118" rx="46" ry="38" fill="#8C7A68" />
    <ellipse cx="80" cy="120" rx="36" ry="28" fill="#A89684" />

    {/* Sloth Head */}
    <ellipse cx="80" cy="62" rx="42" ry="36" fill="#8C7A68" />

    {/* Light Cream Face Mask */}
    <path
      d="M50 64C50 48 63 38 80 38C97 38 110 48 110 64C110 78 96 88 80 88C64 88 50 78 50 64Z"
      fill="#F5EDE2"
    />

    {/* Distinctive Sloth Eye Patches */}
    <path
      d="M56 61C54 54 62 48 68 53C72 56 70 65 65 67C60 69 57 66 56 61Z"
      fill="#5C4D3E"
    />
    <path
      d="M104 61C106 54 98 48 92 53C88 56 90 65 95 67C100 69 103 66 104 61Z"
      fill="#5C4D3E"
    />

    {/* Calm, Peaceful Eyes (Smiling crescents) */}
    <path
      d="M59 62C61 59 65 59 67 62"
      stroke="#1E1B18"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M93 62C95 59 99 59 101 62"
      stroke="#1E1B18"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Sloth Snout & Friendly Smile */}
    <ellipse cx="80" cy="71" rx="10" ry="7" fill="#E4D5C3" />
    <ellipse cx="80" cy="68.5" rx="5" ry="3.5" fill="#2E261F" />
    <path
      d="M75 73C77 75.5 83 75.5 85 73"
      stroke="#2E261F"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Soft Pink Cheeks */}
    <circle cx="56" cy="71" r="4.5" fill="#F4B7B7" opacity="0.6" />
    <circle cx="104" cy="71" r="4.5" fill="#F4B7B7" opacity="0.6" />

    {/* Left Arm holding the invoice */}
    <path
      d="M42 96C36 104 38 116 52 114C58 113 62 108 60 100C58 92 48 90 42 96Z"
      fill="#7A6957"
    />
    {/* Claws on left hand */}
    <path d="M52 108L54 114M56 107L58 113M60 106L62 112" stroke="#EFE6DA" strokeWidth="2" strokeLinecap="round" />

    {/* Right Arm holding/organizing invoice */}
    <g className={`transition-transform duration-700 ease-out origin-top-right ${isOrganizing ? 'translate-x-1 -translate-y-1' : ''}`}>
      <path
        d="M118 96C124 104 122 116 108 114C102 113 98 108 100 100C102 92 112 90 118 96Z"
        fill="#7A6957"
      />
      {/* Claws on right hand */}
      <path d="M108 108L106 114M104 107L102 113M100 106L98 112" stroke="#EFE6DA" strokeWidth="2" strokeLinecap="round" />
    </g>

    {/* Linear Gradient Definitions */}
    <defs>
      <radialGradient id="slothGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
        <stop offset="60%" stopColor="#1E3A8A" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#111827" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const CalmSlothIntro: React.FC<CalmSlothIntroProps> = ({ onComplete, onSkip }) => {
  // Animation stage:
  // 0: Initial mount / dark background fade
  // 1: Sloth mascot appears (0.0s - 0.5s)
  // 2: Sloth organizes bill, invoice card glides in (0.5s - 1.2s)
  // 3: Wordmark & tagline reveal (1.2s - 1.9s)
  // 4: Headline & privacy indicator reveal (1.9s - 2.5s)
  // 5: Crossfade out into app dashboard (2.5s - 3.0s)
  const [stage, setStage] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const hasFinishedRef = useRef(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleFinish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsExiting(true);
    // Smooth 400ms crossfade into the dashboard
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

  // Animation timeline sequencing
  useEffect(() => {
    if (prefersReducedMotion) {
      // For reduced motion, brief 300ms gentle display then finish
      const t = setTimeout(handleFinish, 300);
      return () => clearTimeout(t);
    }

    // Sequence stages according to concept requirements
    const t0 = setTimeout(() => setStage(1), 50);    // 0.0s+: Mascot fades in
    const t1 = setTimeout(() => setStage(2), 550);   // 0.5s+: Sloth organizes invoice, bill glides in
    const t2 = setTimeout(() => setStage(3), 1250);  // 1.2s+: Wordmark & "Slow and Steady"
    const t3 = setTimeout(() => setStage(4), 1900);  // 1.9s+: "Bills handled. Peace of mind." & privacy
    const t4 = setTimeout(() => {
      setStage(5);
      handleFinish();                                // 2.5s - 2.8s: Natural crossfade into dashboard
    }, 2750);

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
      aria-label="BillSloth Welcome Introduction"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#111827] text-white select-none transition-opacity duration-400 ease-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background radial atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(37,99,235,0.18)_0%,transparent_65%)] pointer-events-none" />

      {/* Top Bar: Skip Action */}
      <div className="absolute top-5 right-5 sm:top-7 sm:right-8 z-20">
        <button
          onClick={handleSkip}
          aria-label="Skip introduction and go to dashboard"
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-slate-300 hover:text-white font-medium backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <span>Skip</span>
          <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-md w-full mx-auto px-6 py-8 text-center flex flex-col items-center">
        {/* 1 & 2: Calm Sloth Mascot & Gliding Invoice Card */}
        <div
          className={`relative transition-all duration-700 ease-out ${
            stage >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          {/* Mascot SVG */}
          <CalmSlothSvg isOrganizing={stage >= 2} />

          {/* Gliding Paper Invoice Card (0.5s - 1.2s) */}
          <div
            className={`absolute -bottom-2 -right-3 sm:-right-6 w-44 sm:w-48 bg-white/95 text-navy-900 rounded-xl p-2.5 shadow-2xl border border-slate-200/90 text-left transition-all duration-700 ease-out transform ${
              stage >= 2
                ? 'opacity-100 translate-y-0 rotate-[-2deg] scale-100'
                : 'opacity-0 translate-y-6 rotate-[-8deg] scale-90'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-bold text-slate-700 truncate">
                Acme Electric & Utilities
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 shrink-0">
                Due in 5d
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-1 text-[11px]">
              <span className="font-mono font-bold text-navy-900 tabular-nums">
                $128.50
              </span>
              <span className="text-[9px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> Organized
              </span>
            </div>
          </div>
        </div>

        {/* 3: Logo & Wordmark & Tagline (1.2s - 1.9s) */}
        <div
          className={`mt-6 space-y-1 transition-all duration-600 ease-out ${
            stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              BillSloth
            </h1>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Local AI
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Slow and Steady
          </p>
        </div>

        {/* 4: Headline, Supporting Copy, and Privacy Indicator (1.9s - 2.5s) */}
        <div
          className={`mt-5 space-y-3 transition-all duration-600 ease-out ${
            stage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-100">
            Bills handled. Peace of mind.
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
            Your bills, organized. Your documents, on your device.
          </p>

          {/* Local-First Privacy Shield Indicator */}
          <div className="pt-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% On-Device Privacy • Zero Cloud AI</span>
            </div>
          </div>
        </div>

        {/* Subtle Progress Arc / Pulse */}
        <div className="mt-8 flex items-center justify-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage >= 1 ? 'bg-blue-400 scale-100' : 'bg-white/20 scale-75'
            }`}
          />
          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage >= 2 ? 'bg-blue-400 scale-100' : 'bg-white/20 scale-75'
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
