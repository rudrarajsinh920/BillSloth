import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Clock,
  Eye,
  CheckCircle2,
  UploadCloud,
  CalendarCheck2,
  BellRing,
  ArrowRight,
  DollarSign,
  FileText,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronRight,
  BarChart3,
  Calendar,
  Lock,
} from 'lucide-react';
import { DocumentItem } from '../types';
import { NavTab } from './Sidebar';
import { StatusBadge, VerifiedBadge, SampleDataBadge, ExtractionTelemetryBadge } from './StatusBadge';
import { format, parseISO, differenceInDays, addDays, isSameDay } from 'date-fns';

interface DashboardViewProps {
  documents: DocumentItem[];
  onOpenReview: (doc: DocumentItem) => void;
  onNavigate: (tab: NavTab) => void;
  onQuickMarkPaid: (doc: DocumentItem) => void;
  onPrepareReminder: (doc: DocumentItem) => void;
  onOpenOllamaModal: () => void;
  ollamaAvailable: boolean;
}

export const getVendorColor = (vendor: string = '') => {
  const palettes = [
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  ];
  let hash = 0;
  for (let i = 0; i < vendor.length; i++) {
    hash = vendor.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palettes[Math.abs(hash) % palettes.length];
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  documents,
  onOpenReview,
  onNavigate,
  onQuickMarkPaid,
  onPrepareReminder,
  onOpenOllamaModal,
  ollamaAvailable,
}) => {
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<{
    date: Date;
    docs: DocumentItem[];
  } | null>(null);

  // Categorize documents by computed status
  const overdueDocs = useMemo(
    () => documents.filter((d) => (d.computed_status || d.status) === 'overdue'),
    [documents]
  );
  const dueSoonDocs = useMemo(
    () => documents.filter((d) => (d.computed_status || d.status) === 'due_soon'),
    [documents]
  );
  const needsReviewDocs = useMemo(
    () => documents.filter((d) => (d.computed_status || d.status) === 'needs_review' || d.is_verified === 0),
    [documents]
  );
  const paidDocs = useMemo(
    () => documents.filter((d) => (d.computed_status || d.status) === 'paid'),
    [documents]
  );

  // Compute metrics
  const unpaidDocs = useMemo(
    () => documents.filter((d) => (d.computed_status || d.status) !== 'paid'),
    [documents]
  );
  const totalOutstanding = useMemo(
    () => unpaidDocs.reduce((sum, d) => sum + (d.amount || 0), 0),
    [unpaidDocs]
  );
  const overdueTotal = useMemo(
    () => overdueDocs.reduce((sum, d) => sum + (d.amount || 0), 0),
    [overdueDocs]
  );
  const dueSoonTotal = useMemo(
    () => dueSoonDocs.reduce((sum, d) => sum + (d.amount || 0), 0),
    [dueSoonDocs]
  );
  const paidTotal = useMemo(
    () => paidDocs.reduce((sum, d) => sum + (d.amount || 0), 0),
    [paidDocs]
  );

  // 30-Day Financial Maturity Heatmap Radar (Unique Futuristic Feature)
  const heatmapDays = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 30; i++) {
      const targetDate = addDays(today, i);
      const matchingDocs = documents.filter((doc) => {
        if (!doc.due_date) return false;
        try {
          return isSameDay(parseISO(doc.due_date), targetDate);
        } catch {
          return false;
        }
      });
      const dayTotal = matchingDocs.reduce((sum, d) => sum + (d.amount || 0), 0);
      const hasUnpaid = matchingDocs.some((d) => (d.computed_status || d.status) !== 'paid');
      const hasOverdue = matchingDocs.some((d) => (d.computed_status || d.status) === 'overdue');

      days.push({
        date: targetDate,
        docs: matchingDocs,
        total: dayTotal,
        hasUnpaid,
        hasOverdue,
      });
    }
    return days;
  }, [documents]);

  // Cash Outflow Maturity Horizon (FinCore Bar Chart inspired)
  const horizonBreakdown = useMemo(() => {
    const now = new Date();
    let overdueAmt = 0;
    let overdueCount = 0;
    let week1Amt = 0;
    let week1Count = 0;
    let week2Amt = 0;
    let week2Count = 0;
    let laterAmt = 0;
    let laterCount = 0;

    unpaidDocs.forEach((doc) => {
      const amt = doc.amount || 0;
      if (!doc.due_date) {
        laterAmt += amt;
        laterCount++;
        return;
      }
      try {
        const due = parseISO(doc.due_date);
        const diff = differenceInDays(due, now);
        if (diff < 0) {
          overdueAmt += amt;
          overdueCount++;
        } else if (diff <= 7) {
          week1Amt += amt;
          week1Count++;
        } else if (diff <= 14) {
          week2Amt += amt;
          week2Count++;
        } else {
          laterAmt += amt;
          laterCount++;
        }
      } catch {
        laterAmt += amt;
        laterCount++;
      }
    });

    const buckets = [
      {
        id: 'overdue',
        label: 'Critical Overdue',
        shortLabel: 'Overdue',
        amount: overdueAmt,
        count: overdueCount,
        gradient: 'from-rose-500 to-red-600',
        textColor: 'text-rose-600',
        glowColor: 'shadow-rose-500/30',
      },
      {
        id: 'week1',
        label: 'This Week (1–7 Days)',
        shortLabel: '1–7 Days',
        amount: week1Amt,
        count: week1Count,
        gradient: 'from-amber-400 to-orange-500',
        textColor: 'text-amber-700',
        glowColor: 'shadow-amber-500/30',
      },
      {
        id: 'week2',
        label: 'Next Week (8–14 Days)',
        shortLabel: '8–14 Days',
        amount: week2Amt,
        count: week2Count,
        gradient: 'from-blue-500 to-cyan-500',
        textColor: 'text-cyan-700',
        glowColor: 'shadow-cyan-500/30',
      },
      {
        id: 'later',
        label: 'Horizon (15–30+ Days)',
        shortLabel: '15–30+ Days',
        amount: laterAmt,
        count: laterCount,
        gradient: 'from-indigo-500 to-purple-600',
        textColor: 'text-indigo-600',
        glowColor: 'shadow-indigo-500/30',
      },
    ];

    const maxAmount = Math.max(...buckets.map((b) => b.amount), 1);
    return { buckets, maxAmount };
  }, [unpaidDocs]);

  // Category Breakdown (Deterministic from stored data)
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    let totalAmount = 0;

    unpaidDocs.forEach((d) => {
      const cat = d.category || 'Other';
      const amt = d.amount || 0;
      const current = map.get(cat) || { total: 0, count: 0 };
      map.set(cat, { total: current.total + amt, count: current.count + 1 });
      totalAmount += amt;
    });

    const categoryColors: Record<string, { bar: string; badge: string }> = {
      'Utilities': { bar: 'bg-gradient-to-r from-sky-400 to-cyan-500', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
      'Software/SaaS': { bar: 'bg-gradient-to-r from-blue-500 to-indigo-600', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
      'Rent/Lease': { bar: 'bg-gradient-to-r from-indigo-500 to-purple-600', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      'Telecom': { bar: 'bg-gradient-to-r from-teal-400 to-emerald-500', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
      'Insurance': { bar: 'bg-gradient-to-r from-amber-400 to-orange-500', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
      'Supplies': { bar: 'bg-gradient-to-r from-emerald-400 to-teal-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      'Professional Services': { bar: 'bg-gradient-to-r from-purple-500 to-pink-500', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
      'Taxes': { bar: 'bg-gradient-to-r from-rose-500 to-red-600', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
      'Other': { bar: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
    };

    return Array.from(map.entries())
      .map(([category, info]) => ({
        category,
        amount: info.total,
        count: info.count,
        percentage: totalAmount > 0 ? Math.round((info.total / totalAmount) * 100) : 0,
        colors: categoryColors[category] || { bar: 'bg-slate-500', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [unpaidDocs]);

  // Recent 6 documents for activity ledger (FinCore & MySign inspired)
  const recentActivity = useMemo(() => {
    return [...documents]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 6);
  }, [documents]);

  const formatCurrency = (val: number | null, curr = 'USD') => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(val);
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return 'No due date';
    try {
      const date = parseISO(dateStr);
      const daysDiff = differenceInDays(date, new Date());
      if (daysDiff < 0) {
        return `${Math.abs(daysDiff)}d overdue (${format(date, 'MMM d')})`;
      } else if (daysDiff === 0) {
        return `Today (${format(date, 'MMM d')})`;
      } else if (daysDiff === 1) {
        return `Tomorrow (${format(date, 'MMM d')})`;
      } else {
        return `In ${daysDiff}d (${format(date, 'MMM d')})`;
      }
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Futuristic Cyber-HUD Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-navy-900 border border-indigo-500/20 shadow-2xl p-6 sm:p-7 text-white">
        {/* Ambient mesh background orbs */}
        <div className="ambient-glow-blue -top-20 -left-20 opacity-30" />
        <div className="ambient-glow-cyan -bottom-20 -right-20 opacity-30" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Live Telemetry Chips Row */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
              {/* Air-gap beacon */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 backdrop-blur-md shadow-xs shadow-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span>Air-Gapped Vault</span>
              </span>

              {/* Local Gemma badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-200 border border-indigo-400/30 backdrop-blur-md">
                <Cpu className="w-3.5 h-3.5 text-cyan-300" />
                <span>Gemma 2:2B On-Device</span>
              </span>

              {/* Zero cloud guarantee */}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-200 border border-cyan-400/20 backdrop-blur-md">
                <Lock className="w-3 h-3 text-cyan-300" />
                <span>Zero Cloud Leaks</span>
              </span>
            </div>

            {/* Title with glowing emblem */}
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-float-gentle select-none">🦥</span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  BillSloth Command Center
                </h1>
                <p className="text-xs text-indigo-200/80 mt-0.5 max-w-xl leading-relaxed">
                  "Stop chasing bills. Know what needs attention." Organized on-device with open-weight Gemma 2 2B models and calm human verification gates.
                </p>
              </div>
            </div>
          </div>

          {/* Action CTAs with glowing gradient effects */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => onNavigate('import')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 inline-flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import Bill</span>
            </button>

            <button
              onClick={() => onNavigate('digest')}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold backdrop-blur-md inline-flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <CalendarCheck2 className="w-4 h-4 text-cyan-300" />
              <span>Weekly Digest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Local AI Engine Notice (Calm, informative preview indicator) */}
      {!ollamaAvailable && (
        <div className="financial-card p-4 border-l-4 border-l-indigo-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-gradient-to-r from-indigo-50/40 via-white to-white">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-navy-900">Local AI Engine on Standby.</span>{' '}
              <span className="text-slate-600">
                All ledger management, categorization, and calculations are active. Connect your local Ollama runtime to enable Gemma 2 2B document extraction.
              </span>
            </div>
          </div>
          <button
            onClick={onOpenOllamaModal}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline shrink-0 self-start sm:self-auto"
          >
            Connection Guide →
          </button>
        </div>
      )}

      {/* 4 Holographic Futuristic KPI Cards (FinCore + MySign style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div
          onClick={() => onNavigate('documents')}
          className="financial-card-interactive p-5 flex flex-col justify-between cursor-pointer group"
        >
          {/* Top Neon Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Outstanding
            </span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-50 to-cyan-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-navy-900 font-mono tabular-nums tracking-tight">
              {formatCurrency(totalOutstanding)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 font-mono tabular-nums">
                {unpaidDocs.length} active bills
              </span>
              <span className="text-[11px] text-slate-400 font-medium">unsettled</span>
            </div>
          </div>
        </div>

        {/* Critical Overdue */}
        <div
          onClick={() => onNavigate('documents')}
          className={`financial-card-interactive p-5 flex flex-col justify-between cursor-pointer group ${
            overdueDocs.length > 0 ? '!border-rose-300 bg-rose-50/20' : ''
          }`}
        >
          {/* Top Neon Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-pink-500" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Critical Overdue
            </span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-50 to-red-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-rose-600 font-mono tabular-nums tracking-tight">
              {formatCurrency(overdueTotal)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono tabular-nums ${
                  overdueDocs.length > 0
                    ? 'bg-rose-600 text-white shadow-xs shadow-rose-600/30'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {overdueDocs.length === 0 ? 'Zero Overdue' : `${overdueDocs.length} Overdue`}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {overdueDocs.length === 0 ? 'calm' : 'immediate action'}
              </span>
            </div>
          </div>
        </div>

        {/* Due Soon (7 Days) */}
        <div
          onClick={() => onNavigate('documents')}
          className="financial-card-interactive p-5 flex flex-col justify-between cursor-pointer group"
        >
          {/* Top Neon Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-500" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Due Soon (7 Days)
            </span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-50 to-orange-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-navy-900 font-mono tabular-nums tracking-tight">
              {formatCurrency(dueSoonTotal)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono tabular-nums">
                {dueSoonDocs.length} bills
              </span>
              <span className="text-[11px] text-slate-400 font-medium">this week</span>
            </div>
          </div>
        </div>

        {/* Settled & Paid Archive */}
        <div
          onClick={() => onNavigate('documents')}
          className="financial-card-interactive p-5 flex flex-col justify-between cursor-pointer group"
        >
          {/* Top Neon Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Settled & Paid
            </span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-50 to-teal-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums tracking-tight">
              {formatCurrency(paidTotal)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono tabular-nums">
                {paidDocs.length} paid
              </span>
              <span className="text-[11px] text-slate-400 font-medium">archived</span>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: 30-Day Financial Maturity Radar & Matrix Grid (Futuristic Heatmap) */}
      <section className="financial-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="font-extrabold text-sm text-navy-900">
                30-Day Cash Maturity Radar
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive timeline density of upcoming maturity deadlines across the next 30 days
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-200" />
              <span>Clear</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-300 border border-amber-400" />
              <span>Due Soon</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 border border-rose-500" />
              <span>Overdue</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 border border-emerald-500" />
              <span>Settled</span>
            </span>
          </div>
        </div>

        {/* 30-day interactive matrix blocks */}
        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-2">
          {heatmapDays.map((day, idx) => {
            const isToday = idx === 0;
            const hasBills = day.docs.length > 0;
            let cellStyle = 'bg-slate-50 hover:bg-slate-100 border-slate-200/70 text-slate-600';

            if (day.hasOverdue) {
              cellStyle = 'bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-800 shadow-xs shadow-rose-500/20';
            } else if (day.hasUnpaid) {
              cellStyle = 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 shadow-xs shadow-amber-500/20';
            } else if (hasBills) {
              cellStyle = 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-800';
            }

            return (
              <button
                key={idx}
                onClick={() => setSelectedHeatmapDay(hasBills ? day : null)}
                title={`${format(day.date, 'MMM d, yyyy')}: ${day.docs.length} bills (${formatCurrency(day.total)})`}
                className={`p-2 rounded-xl border text-center transition-all hover:scale-105 active:scale-95 focus:outline-none relative group ${cellStyle}`}
              >
                {isToday && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
                )}
                <span className="text-[10px] font-extrabold block leading-tight font-mono">
                  {format(day.date, 'd')}
                </span>
                <span className="text-[9px] uppercase tracking-tighter block text-slate-500 font-medium">
                  {format(day.date, 'EEE')}
                </span>
                {hasBills && (
                  <span className="text-[8px] font-extrabold font-mono block mt-0.5 truncate text-navy-900">
                    ${Math.round(day.total)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Drawer */}
        {selectedHeatmapDay && (
          <div className="mt-3 p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div>
              <span className="font-extrabold text-navy-900">
                {format(selectedHeatmapDay.date, 'EEEE, MMMM d, yyyy')}
              </span>
              <span className="text-slate-600 ml-2">
                — {selectedHeatmapDay.docs.length} bill{selectedHeatmapDay.docs.length === 1 ? '' : 's'} totaling{' '}
                <strong className="text-indigo-900 font-mono">{formatCurrency(selectedHeatmapDay.docs.reduce((s, d) => s + (d.amount || 0), 0))}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('calendar')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors"
              >
                View on Calendar →
              </button>
              <button
                onClick={() => setSelectedHeatmapDay(null)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-navy-900"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Middle Row: Cash Flow Maturity Horizon & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cash Flow Maturity Horizon Bar Chart */}
        <div className="lg:col-span-2 financial-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-navy-900">Upcoming Cash Outflow Horizon</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Maturity timeline of active payment obligations grouped by due dates
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums font-bold text-navy-900 bg-slate-100 px-2.5 py-1 rounded-lg">
              Total: {formatCurrency(totalOutstanding)}
            </span>
          </div>

          {/* SVG/CSS Bar Chart with Holographic Gradient Bars */}
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 sm:gap-4 h-48 items-end pt-4 pb-2 px-3 bg-gradient-to-b from-slate-50/80 to-white rounded-xl border border-slate-200/80">
              {horizonBreakdown.buckets.map((b) => {
                const heightPercent = horizonBreakdown.maxAmount > 0
                  ? Math.max(Math.round((b.amount / horizonBreakdown.maxAmount) * 100), b.amount > 0 ? 14 : 4)
                  : 4;

                return (
                  <div key={b.id} className="flex flex-col items-center h-full justify-end group">
                    {/* Amount Tooltip / Value on top of bar */}
                    <span className="text-[11px] font-black font-mono tabular-nums text-navy-900 mb-1 opacity-90 group-hover:scale-110 transition-transform text-center">
                      {formatCurrency(b.amount)}
                    </span>

                    {/* Visual Bar with glowing gradient */}
                    <div className="w-full max-w-[52px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-36">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full bg-gradient-to-t ${b.gradient} rounded-t-xl transition-all duration-300 group-hover:brightness-110 shadow-sm ${b.glowColor}`}
                        title={`${b.label}: ${formatCurrency(b.amount)} (${b.count} bills)`}
                      />
                    </div>

                    {/* Bottom Label & Count */}
                    <div className="text-center mt-2.5">
                      <span className="text-[11px] font-extrabold text-navy-900 block truncate">
                        {b.shortLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block font-medium">
                        {b.count} bill{b.count === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Segmented Category Progress Bar below the horizon chart */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-navy-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Category Outflow Share</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {categoryBreakdown.length} active categories
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {categoryBreakdown.map((cat) => (
                  <div
                    key={cat.category}
                    style={{ width: `${Math.max(cat.percentage, 4)}%` }}
                    className={`${cat.colors.bar} h-full transition-all`}
                    title={`${cat.category}: ${formatCurrency(cat.amount)} (${cat.percentage}%)`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Category Breakdown & Signals */}
        <div className="financial-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-navy-900">Spending by Category</h3>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                Live Data
              </span>
            </div>

            {/* Categories List */}
            <div className="space-y-2 pt-3">
              {categoryBreakdown.length === 0 ? (
                <div className="py-6 text-center text-slate-muted text-xs">
                  <p className="font-medium text-navy-800">No active obligations.</p>
                  <p className="mt-1">All invoices are settled.</p>
                </div>
              ) : (
                categoryBreakdown.slice(0, 5).map((cat) => (
                  <div
                    key={cat.category}
                    className="p-2.5 rounded-xl border border-slate-200/70 bg-slate-50/50 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-2.5 h-2.5 rounded-full ${cat.colors.bar} shrink-0`} />
                      <div className="truncate">
                        <span className="font-bold text-navy-900 block truncate">{cat.category}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {cat.count} bill{cat.count === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-navy-900 font-mono tabular-nums">
                        {formatCurrency(cat.amount)}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 font-mono tabular-nums">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                ))
              )}

              {needsReviewDocs.length > 0 && (
                <div className="mt-3 p-3 rounded-xl border border-amber-warn-border bg-amber-warn-light/30 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Eye className="w-4 h-4 text-amber-warn shrink-0" />
                    <span className="font-bold text-navy-900 truncate">
                      {needsReviewDocs.length} bill{needsReviewDocs.length === 1 ? '' : 's'} need check
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate('documents')}
                    className="text-[11px] font-extrabold text-amber-800 hover:underline shrink-0"
                  >
                    Review →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Privacy & Audit Signal Badge */}
          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-muted">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Immutable SQLite Ledger</span>
            </span>
            <button
              onClick={() => onNavigate('audit')}
              className="font-bold text-indigo-600 hover:underline text-[11px]"
            >
              Audit Log →
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Critical Overdue Invoices (Priority Attention) */}
      {overdueDocs.length > 0 && (
        <section className="financial-card !border-rose-300 overflow-hidden shadow-md shadow-rose-500/5">
          <div className="px-6 py-4 border-b border-rose-200/80 flex items-center justify-between bg-gradient-to-r from-rose-500/10 to-rose-500/5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-xs shadow-rose-500/30">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-navy-900 text-sm">Critical Overdue Invoices</h2>
                <p className="text-xs text-slate-400">Bills that have passed their stated payment date</p>
              </div>
            </div>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-600 text-white tabular-nums font-mono shadow-xs shadow-rose-600/30">
              {overdueDocs.length} Overdue ({formatCurrency(overdueTotal)})
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {overdueDocs.map((doc) => {
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 border ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-navy-900">
                          {doc.vendor || 'Unknown Vendor'}
                        </span>
                        {doc.is_sample === 1 && <SampleDataBadge />}
                        <StatusBadge status="overdue" size="sm" />
                        <VerifiedBadge isVerified={doc.is_verified} size="sm" />
                        <ExtractionTelemetryBadge
                          method={doc.extraction_method}
                          ocrConfidence={doc.ocr_confidence}
                          size="xs"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1 font-medium">
                        <span>Invoice: <span className="font-mono text-slate-600 font-bold">{doc.invoice_number || '—'}</span></span>
                        <span>•</span>
                        <span>Category: {doc.category}</span>
                        <span>•</span>
                        <span className="font-bold text-rose-600 tabular-nums">
                          Due: {formatDueDate(doc.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-base font-black text-rose-600 font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono font-medium">{doc.currency}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onPrepareReminder(doc)}
                        title="Prepare reminder for human approval"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-navy-800 hover:bg-slate-100 flex items-center gap-1 transition-all"
                      >
                        <BellRing className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Reminder</span>
                      </button>
                      <button
                        onClick={() => onQuickMarkPaid(doc)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs shadow-emerald-600/30"
                      >
                        Mark Paid
                      </button>
                      <button
                        onClick={() => onOpenReview(doc)}
                        className="p-1.5 text-slate-400 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Review Bill Details"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 2: Due Soon (Next 7–14 Days) */}
      <section className="financial-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-amber-500/5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-xs shadow-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-navy-900 text-sm">Due Soon (Next 7–14 Days)</h2>
              <p className="text-xs text-slate-400">Bills approaching payment deadlines</p>
            </div>
          </div>
          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-white tabular-nums font-mono shadow-xs shadow-amber-500/30">
            {dueSoonDocs.length} Pending ({formatCurrency(dueSoonTotal)})
          </span>
        </div>

        {dueSoonDocs.length === 0 ? (
          <div className="p-8 text-center text-slate-muted text-xs">
            <p className="font-bold text-navy-900 text-sm">No Bills Due in the Next 7 Days</p>
            <p className="mt-1">Enjoy the breathing room. Your cash flow schedule is calm.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {dueSoonDocs.map((doc) => {
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 border ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-navy-900">
                          {doc.vendor || 'Unknown Vendor'}
                        </span>
                        {doc.is_sample === 1 && <SampleDataBadge />}
                        <StatusBadge status="due_soon" size="sm" />
                        <VerifiedBadge isVerified={doc.is_verified} size="sm" />
                        <ExtractionTelemetryBadge
                          method={doc.extraction_method}
                          ocrConfidence={doc.ocr_confidence}
                          size="xs"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1 font-medium">
                        <span>Invoice: <span className="font-mono text-slate-600 font-bold">{doc.invoice_number || '—'}</span></span>
                        <span>•</span>
                        <span>Category: {doc.category}</span>
                        <span>•</span>
                        <span className="font-bold text-amber-700 tabular-nums">
                          Due: {formatDueDate(doc.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-base font-black text-navy-900 font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono font-medium">{doc.currency}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onPrepareReminder(doc)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-navy-800 hover:bg-slate-100 flex items-center gap-1 transition-all"
                      >
                        <BellRing className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Reminder</span>
                      </button>
                      <button
                        onClick={() => onQuickMarkPaid(doc)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs shadow-emerald-600/30"
                      >
                        Mark Paid
                      </button>
                      <button
                        onClick={() => onOpenReview(doc)}
                        className="p-1.5 text-slate-400 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Review Bill Details"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3: Recent Document Activity Ledger (FinCore Recent Transactions Table) */}
      <section className="financial-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-navy-900 to-indigo-950 text-white shadow-xs">
              <FileText className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-navy-900 text-sm">Recent Transactions Ledger</h2>
              <p className="text-xs text-slate-400">Latest imported bills, receipts, and state transitions</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('documents')}
            className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
          >
            <span>View All ({documents.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="p-8 text-center text-slate-muted text-xs">
            <p className="font-bold text-navy-900 text-sm">No Document Activity Yet</p>
            <p className="mt-1">Import your first PDF or scanned receipt to start organizing.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivity.map((doc) => {
              const computed = doc.computed_status || doc.status;
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenReview(doc)}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border transition-transform group-hover:scale-110 shadow-2xs ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-navy-900 group-hover:text-indigo-600 transition-colors truncate">
                          {doc.vendor || doc.original_name}
                        </span>
                        {doc.is_sample === 1 && <SampleDataBadge />}
                        <StatusBadge status={computed} size="sm" />
                        <VerifiedBadge isVerified={doc.is_verified} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 truncate font-medium">
                        <span className="font-mono text-slate-500">{doc.original_name}</span>
                        <span>•</span>
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span className="tabular-nums font-semibold">Due: {doc.due_date || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-black text-navy-900 font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">{doc.currency}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 4: Paid & Settled Archive */}
      {paidDocs.length > 0 && (
        <section className="financial-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xs shadow-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-navy-900 text-sm">Settled & Paid Archive</h2>
                <p className="text-xs text-slate-400">Completed payments safely archived</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 tabular-nums font-mono">
              {paidDocs.length} Paid ({formatCurrency(paidTotal)})
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {paidDocs.map((doc) => {
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenReview(doc)}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer opacity-90"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-navy-900">
                          {doc.vendor || 'Unknown Vendor'}
                        </span>
                        {doc.is_sample === 1 && <SampleDataBadge />}
                        <StatusBadge status="paid" size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-medium">
                        <span>Invoice: <span className="font-mono text-slate-500">{doc.invoice_number || '—'}</span></span>
                        <span>•</span>
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span className="tabular-nums">Verified: {doc.verified_at ? format(parseISO(doc.verified_at), 'MMM d') : 'Yes'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-700 font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">{doc.currency}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
