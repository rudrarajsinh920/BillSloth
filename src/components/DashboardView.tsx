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
    { bg: 'bg-[#DDF5F6]', text: 'text-[#087F8C]', border: 'border-[#087F8C]/20' },
    { bg: 'bg-[#DDF7EF]', text: 'text-[#087F5B]', border: 'border-[#087F5B]/20' },
    { bg: 'bg-[#EDE9FE]', text: 'text-[#6D5CE8]', border: 'border-[#6D5CE8]/20' },
    { bg: 'bg-[#FFF0CC]', text: 'text-[#854D0E]', border: 'border-[#854D0E]/20' },
    { bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]', border: 'border-[#BE123C]/20' },
    { bg: 'bg-[#E0F2FE]', text: 'text-[#0284C7]', border: 'border-[#0284C7]/20' },
    { bg: 'bg-[#F1F5F9]', text: 'text-[#475569]', border: 'border-[#CBD5E1]' },
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

  // 30-Day Financial Maturity Heatmap Radar
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

  // Cash Outflow Maturity Horizon
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
        gradient: 'from-[#BE123C] to-[#E11D48]',
        textColor: 'text-[#BE123C]',
      },
      {
        id: 'week1',
        label: 'This Week (1–7 Days)',
        shortLabel: '1–7 Days',
        amount: week1Amt,
        count: week1Count,
        gradient: 'from-[#F59E0B] to-[#D97706]',
        textColor: 'text-[#854D0E]',
      },
      {
        id: 'week2',
        label: 'Next Week (8–14 Days)',
        shortLabel: '8–14 Days',
        amount: week2Amt,
        count: week2Count,
        gradient: 'from-[#087F8C] to-[#0284C7]',
        textColor: 'text-[#087F8C]',
      },
      {
        id: 'later',
        label: 'Horizon (15–30+ Days)',
        shortLabel: '15–30+ Days',
        amount: laterAmt,
        count: laterCount,
        gradient: 'from-[#6D5CE8] to-[#4F46E5]',
        textColor: 'text-[#6D5CE8]',
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
      'Utilities': { bar: 'bg-[#087F8C]', badge: 'bg-[#DDF5F6] text-[#087F8C] border-[#087F8C]/30' },
      'Software/SaaS': { bar: 'bg-[#6D5CE8]', badge: 'bg-[#EDE9FE] text-[#6D5CE8] border-[#6D5CE8]/30' },
      'Rent/Lease': { bar: 'bg-[#087F5B]', badge: 'bg-[#DDF7EF] text-[#087F5B] border-[#087F5B]/30' },
      'Telecom': { bar: 'bg-[#0284C7]', badge: 'bg-[#E0F2FE] text-[#0284C7] border-[#0284C7]/30' },
      'Insurance': { bar: 'bg-[#854D0E]', badge: 'bg-[#FFF0CC] text-[#854D0E] border-[#854D0E]/30' },
      'Supplies': { bar: 'bg-[#10B981]', badge: 'bg-[#ECFDF5] text-[#059669] border-[#059669]/30' },
      'Professional Services': { bar: 'bg-[#7C3AED]', badge: 'bg-[#F5F3FF] text-[#7C3AED] border-[#7C3AED]/30' },
      'Taxes': { bar: 'bg-[#BE123C]', badge: 'bg-[#FFE4E6] text-[#BE123C] border-[#BE123C]/30' },
      'Other': { bar: 'bg-[#64748B]', badge: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]' },
    };

    return Array.from(map.entries())
      .map(([category, info]) => ({
        category,
        amount: info.total,
        count: info.count,
        percentage: totalAmount > 0 ? Math.round((info.total / totalAmount) * 100) : 0,
        colors: categoryColors[category] || { bar: 'bg-[#64748B]', badge: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]' },
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [unpaidDocs]);

  // Recent 6 documents for activity ledger
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
    <div className="space-y-6 animate-in fade-in duration-200 text-[#172A35]">
      {/* Light-First Executive Command Center Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-[#DCE4E5] shadow-xs p-6 sm:p-7 text-[#172A35]">
        {/* Subtle decorative background surface */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#DDF5F6]/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#DDF7EF]/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Live Telemetry Chips Row */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
              {/* Air-gap beacon */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DDF7EF] text-[#087F5B] border border-[#087F5B]/30 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#087F5B] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#087F5B]"></span>
                </span>
                <span>Air-Gapped Vault</span>
              </span>

              {/* Local Gemma badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/30">
                <Cpu className="w-3.5 h-3.5 text-[#087F8C]" />
                <span>Gemma 2:2B On-Device</span>
              </span>

              {/* Zero cloud guarantee */}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DDF7EF] text-[#087F5B] border border-[#087F5B]/30">
                <Lock className="w-3 h-3 text-[#087F5B]" />
                <span>Zero Cloud Leaks</span>
              </span>
            </div>

            {/* Title with emblem */}
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-float-gentle select-none">🦥</span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#172A35]">
                  BillSloth Command Center
                </h1>
                <p className="text-xs text-[#526572] mt-0.5 max-w-xl leading-relaxed">
                  "Stop chasing bills. Know what needs attention." Organized on-device with open-weight Gemma 2 2B models and calm human verification gates.
                </p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => onNavigate('import')}
              className="px-4 py-2.5 rounded-xl bg-[#087F8C] hover:bg-[#066873] text-white text-xs font-bold shadow-sm inline-flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import Bill</span>
            </button>

            <button
              onClick={() => onNavigate('digest')}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#F7F8F5] border border-[#DCE4E5] text-[#172A35] text-xs font-semibold inline-flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <CalendarCheck2 className="w-4 h-4 text-[#087F8C]" />
              <span>Weekly Digest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Local AI Engine Notice */}
      {!ollamaAvailable && (
        <div className="financial-card p-4 border-l-4 border-l-[#087F8C] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-[#DDF5F6] text-[#087F8C] shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#172A35]">Local AI Engine on Standby.</span>{' '}
              <span className="text-[#526572]">
                All ledger management, categorization, and calculations are active. Connect your local Ollama runtime to enable Gemma 2 2B document extraction.
              </span>
            </div>
          </div>
          <button
            onClick={onOpenOllamaModal}
            className="text-xs font-bold text-[#087F8C] hover:text-[#066873] hover:underline shrink-0 self-start sm:self-auto"
          >
            Connection Guide →
          </button>
        </div>
      )}

      {/* 4 High-Contrast Light KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div
          onClick={() => onNavigate('documents')}
          className="financial-card-interactive p-5 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
        >
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#087F8C] to-[#087F5B]" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#526572] uppercase tracking-wider">
              Total Outstanding
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-[#172A35] font-mono tabular-nums tracking-tight">
              {formatCurrency(totalOutstanding)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/30 font-mono tabular-nums">
                {unpaidDocs.length} active bills
              </span>
              <span className="text-[11px] text-[#526572] font-medium">unsettled</span>
            </div>
          </div>
        </div>

        {/* Critical Overdue */}
        <div
          onClick={() => onNavigate('documents')}
          className={`financial-card-interactive p-5 flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
            overdueDocs.length > 0 ? '!border-[#BE123C]/40 bg-[#FFE4E6]/20' : ''
          }`}
        >
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#BE123C] to-[#E11D48]" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#BE123C] uppercase tracking-wider">
              Critical Overdue
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#FFE4E6] text-[#BE123C] border border-[#BE123C]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-[#BE123C] font-mono tabular-nums tracking-tight">
              {formatCurrency(overdueTotal)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono tabular-nums ${
                  overdueDocs.length > 0
                    ? 'bg-[#FFE4E6] text-[#BE123C] border border-[#BE123C]/40'
                    : 'bg-[#DDF7EF] text-[#087F5B] border border-[#087F5B]/30'
                }`}
              >
                {overdueDocs.length === 0 ? 'Zero Overdue' : `${overdueDocs.length} Overdue`}
              </span>
              <span className="text-[11px] text-[#526572] font-medium">
                {overdueDocs.length === 0 ? 'calm' : 'immediate action'}
              </span>
            </div>
          </div>
        </div>

        {/* Due Soon (7 Days) */}
        <div
          onClick={() => onNavigate('documents')}
          className="financial-card-interactive p-5 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
        >
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#854D0E] to-[#B45309]" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#854D0E] uppercase tracking-wider">
              Due Soon (7 Days)
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#FFF0CC] text-[#854D0E] border border-[#854D0E]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-[#172A35] font-mono tabular-nums tracking-tight">
              {formatCurrency(dueSoonTotal)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0CC] text-[#854D0E] border border-[#854D0E]/30 font-mono tabular-nums">
                {dueSoonDocs.length} bills
              </span>
              <span className="text-[11px] text-[#526572] font-medium">this week</span>
            </div>
          </div>
        </div>

        {/* Settled & Paid Archive */}
        <div
          onClick={() => onNavigate('documents')}
          className="financial-card-interactive p-5 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
        >
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#087F5B] to-[#047857]" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#087F5B] uppercase tracking-wider">
              Settled & Paid
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#DDF7EF] text-[#087F5B] border border-[#087F5B]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-[#087F5B] font-mono tabular-nums tracking-tight">
              {formatCurrency(paidTotal)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#DDF7EF] text-[#087F5B] border border-[#087F5B]/30 font-mono tabular-nums">
                {paidDocs.length} paid
              </span>
              <span className="text-[11px] text-[#526572] font-medium">archived</span>
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Financial Maturity Radar & Matrix Grid */}
      <section className="financial-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE4E5] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#087F8C]" />
              <h3 className="font-extrabold text-sm text-[#172A35]">
                30-Day Cash Maturity Radar
              </h3>
            </div>
            <p className="text-xs text-[#526572] mt-0.5">
              Interactive timeline density of upcoming maturity deadlines across the next 30 days
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-semibold text-[#526572]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F7F8F5] border border-[#DCE4E5]" />
              <span>Clear</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FFF0CC] border border-[#854D0E]/30" />
              <span className="text-[#854D0E]">Due Soon</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FFE4E6] border border-[#BE123C]/30" />
              <span className="text-[#BE123C]">Overdue</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#DDF7EF] border border-[#087F5B]/30" />
              <span className="text-[#087F5B]">Settled</span>
            </span>
          </div>
        </div>

        {/* 30-day interactive matrix blocks */}
        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-2">
          {heatmapDays.map((day, idx) => {
            const isToday = idx === 0;
            const hasBills = day.docs.length > 0;
            let cellStyle = 'bg-[#F7F8F5] hover:bg-white border-[#DCE4E5] text-[#526572]';

            if (day.hasOverdue) {
              cellStyle = 'bg-[#FFE4E6] hover:bg-[#FECDD3] border-[#BE123C]/40 text-[#BE123C]';
            } else if (day.hasUnpaid) {
              cellStyle = 'bg-[#FFF0CC] hover:bg-[#FDE68A] border-[#854D0E]/40 text-[#854D0E]';
            } else if (hasBills) {
              cellStyle = 'bg-[#DDF7EF] hover:bg-[#BBF7D0] border-[#087F5B]/40 text-[#087F5B]';
            }

            return (
              <button
                key={idx}
                onClick={() => setSelectedHeatmapDay(hasBills ? day : null)}
                title={`${format(day.date, 'MMM d, yyyy')}: ${day.docs.length} bills (${formatCurrency(day.total)})`}
                className={`p-2 rounded-xl border text-center transition-all hover:scale-105 active:scale-95 focus:outline-none relative group ${cellStyle}`}
              >
                {isToday && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#087F8C] ring-2 ring-white" />
                )}
                <span className="text-[10px] font-extrabold block leading-tight font-mono text-[#172A35]">
                  {format(day.date, 'd')}
                </span>
                <span className="text-[9px] uppercase tracking-tighter block text-[#526572] font-medium">
                  {format(day.date, 'EEE')}
                </span>
                {hasBills && (
                  <span className="text-[8px] font-extrabold font-mono block mt-0.5 truncate text-[#172A35]">
                    ${Math.round(day.total)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Drawer */}
        {selectedHeatmapDay && (
          <div className="mt-3 p-4 rounded-xl border border-[#DCE4E5] bg-[#F7F8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div>
              <span className="font-extrabold text-[#172A35]">
                {format(selectedHeatmapDay.date, 'EEEE, MMMM d, yyyy')}
              </span>
              <span className="text-[#526572] ml-2">
                — {selectedHeatmapDay.docs.length} bill{selectedHeatmapDay.docs.length === 1 ? '' : 's'} totaling{' '}
                <strong className="text-[#087F8C] font-mono">{formatCurrency(selectedHeatmapDay.docs.reduce((s, d) => s + (d.amount || 0), 0))}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('calendar')}
                className="px-3 py-1.5 rounded-lg bg-[#087F8C] hover:bg-[#066873] text-white font-bold transition-colors"
              >
                View on Calendar →
              </button>
              <button
                onClick={() => setSelectedHeatmapDay(null)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#DCE4E5] text-[#526572] hover:text-[#172A35]"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE4E5] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#087F8C]" />
                <h3 className="font-extrabold text-sm text-[#172A35]">Upcoming Cash Outflow Horizon</h3>
              </div>
              <p className="text-xs text-[#526572] mt-0.5">
                Maturity timeline of active payment obligations grouped by due dates
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums font-bold text-[#172A35] bg-[#F7F8F5] border border-[#DCE4E5] px-2.5 py-1 rounded-lg">
              Total: {formatCurrency(totalOutstanding)}
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 sm:gap-4 h-48 items-end pt-4 pb-2 px-3 bg-[#F7F8F5] rounded-xl border border-[#DCE4E5]">
              {horizonBreakdown.buckets.map((b) => {
                const heightPercent = horizonBreakdown.maxAmount > 0
                  ? Math.max(Math.round((b.amount / horizonBreakdown.maxAmount) * 100), b.amount > 0 ? 14 : 4)
                  : 4;

                return (
                  <div key={b.id} className="flex flex-col items-center h-full justify-end group">
                    {/* Amount Tooltip / Value */}
                    <span className="text-[11px] font-black font-mono tabular-nums text-[#172A35] mb-1 opacity-90 group-hover:scale-110 transition-transform text-center">
                      {formatCurrency(b.amount)}
                    </span>

                    {/* Visual Bar */}
                    <div className="w-full max-w-[52px] bg-[#E2E8F0] rounded-t-xl overflow-hidden flex flex-col justify-end h-36 border border-[#DCE4E5]">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full bg-gradient-to-t ${b.gradient} rounded-t-xl transition-all duration-300 group-hover:brightness-110 shadow-xs`}
                        title={`${b.label}: ${formatCurrency(b.amount)} (${b.count} bills)`}
                      />
                    </div>

                    {/* Bottom Label & Count */}
                    <div className="text-center mt-2.5">
                      <span className="text-[11px] font-extrabold text-[#172A35] block truncate">
                        {b.shortLabel}
                      </span>
                      <span className="text-[10px] text-[#526572] font-mono block font-medium">
                        {b.count} bill{b.count === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Segmented Category Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#172A35] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#087F8C]" />
                  <span>Category Outflow Share</span>
                </span>
                <span className="text-[11px] text-[#526572] font-mono">
                  {categoryBreakdown.length} active categories
                </span>
              </div>
              <div className="h-3 w-full bg-[#E2E8F0] rounded-full overflow-hidden flex border border-[#DCE4E5]">
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
            <div className="flex items-center justify-between border-b border-[#DCE4E5] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#087F8C]" />
                <h3 className="font-extrabold text-sm text-[#172A35]">Spending by Category</h3>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#087F8C] bg-[#DDF5F6] border border-[#087F8C]/30 px-2 py-0.5 rounded-full">
                Live Data
              </span>
            </div>

            {/* Categories List */}
            <div className="space-y-2 pt-3">
              {categoryBreakdown.length === 0 ? (
                <div className="py-6 text-center text-[#526572] text-xs">
                  <p className="font-medium text-[#172A35]">No active obligations.</p>
                  <p className="mt-1">All invoices are settled.</p>
                </div>
              ) : (
                categoryBreakdown.slice(0, 5).map((cat) => (
                  <div
                    key={cat.category}
                    className="p-2.5 rounded-xl border border-[#DCE4E5] bg-[#F7F8F5] flex items-center justify-between text-xs hover:bg-white transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-2.5 h-2.5 rounded-full ${cat.colors.bar} shrink-0`} />
                      <div className="truncate">
                        <span className="font-bold text-[#172A35] block truncate">{cat.category}</span>
                        <span className="text-[10px] text-[#526572] font-medium">
                          {cat.count} bill{cat.count === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-[#172A35] font-mono tabular-nums">
                        {formatCurrency(cat.amount)}
                      </div>
                      <span className="text-[10px] font-bold text-[#526572] font-mono tabular-nums">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                ))
              )}

              {needsReviewDocs.length > 0 && (
                <div className="mt-3 p-3 rounded-xl border border-[#854D0E]/30 bg-[#FFF0CC] flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Eye className="w-4 h-4 text-[#854D0E] shrink-0" />
                    <span className="font-bold text-[#172A35] truncate">
                      {needsReviewDocs.length} bill{needsReviewDocs.length === 1 ? '' : 's'} need check
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate('documents')}
                    className="text-[11px] font-extrabold text-[#854D0E] hover:underline shrink-0"
                  >
                    Review →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Privacy & Audit Signal Badge */}
          <div className="pt-3 border-t border-[#DCE4E5] flex items-center justify-between text-xs text-[#526572]">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#087F5B]">
              <ShieldCheck className="w-4 h-4 text-[#087F5B]" />
              <span>Immutable SQLite Ledger</span>
            </span>
            <button
              onClick={() => onNavigate('audit')}
              className="font-bold text-[#087F8C] hover:text-[#066873] hover:underline text-[11px]"
            >
              Audit Log →
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Critical Overdue Invoices (Priority Attention) */}
      {overdueDocs.length > 0 && (
        <section className="financial-card !border-[#BE123C]/40 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-[#BE123C]/20 flex items-center justify-between bg-[#FFE4E6]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-[#BE123C] text-white shadow-xs">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-[#BE123C] text-sm">Critical Overdue Invoices</h2>
                <p className="text-xs text-[#BE123C]/80">Bills that have passed their stated payment date</p>
              </div>
            </div>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#BE123C] text-white tabular-nums font-mono shadow-xs">
              {overdueDocs.length} Overdue ({formatCurrency(overdueTotal)})
            </span>
          </div>

          <div className="divide-y divide-[#DCE4E5]">
            {overdueDocs.map((doc) => {
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F8F5] transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 border ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-[#172A35]">
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
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#526572] mt-1 font-medium">
                        <span>Invoice: <span className="font-mono text-[#172A35] font-bold">{doc.invoice_number || '—'}</span></span>
                        <span>•</span>
                        <span>Category: {doc.category}</span>
                        <span>•</span>
                        <span className="font-bold text-[#BE123C] tabular-nums">
                          Due: {formatDueDate(doc.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-base font-black text-[#BE123C] font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[11px] text-[#526572] font-mono font-medium">{doc.currency}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onPrepareReminder(doc)}
                        title="Prepare reminder for human approval"
                        className="px-2.5 py-1.5 rounded-lg border border-[#DCE4E5] bg-white text-xs font-bold text-[#172A35] hover:bg-[#F7F8F5] hover:border-[#087F8C]/50 flex items-center gap-1 transition-all"
                      >
                        <BellRing className="w-3.5 h-3.5 text-[#087F8C]" />
                        <span>Reminder</span>
                      </button>
                      <button
                        onClick={() => onQuickMarkPaid(doc)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#DDF7EF] hover:bg-[#087F5B] text-[#087F5B] hover:text-white border border-[#087F5B]/30 text-xs font-bold transition-all shadow-xs"
                      >
                        Mark Paid
                      </button>
                      <button
                        onClick={() => onOpenReview(doc)}
                        className="p-1.5 text-[#526572] hover:text-[#087F8C] rounded-lg hover:bg-[#DDF5F6] transition-colors"
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
        <div className="px-6 py-4 border-b border-[#854D0E]/20 flex items-center justify-between bg-[#FFF0CC]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-[#854D0E] text-white shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-[#854D0E] text-sm">Due Soon (Next 7–14 Days)</h2>
              <p className="text-xs text-[#854D0E]/80">Bills approaching payment deadlines</p>
            </div>
          </div>
          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#854D0E] text-white tabular-nums font-mono shadow-xs">
            {dueSoonDocs.length} Pending ({formatCurrency(dueSoonTotal)})
          </span>
        </div>

        {dueSoonDocs.length === 0 ? (
          <div className="p-8 text-center text-[#526572] text-xs">
            <p className="font-bold text-[#172A35] text-sm">No Bills Due in the Next 7 Days</p>
            <p className="mt-1">Enjoy the breathing room. Your cash flow schedule is calm.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#DCE4E5]">
            {dueSoonDocs.map((doc) => {
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F8F5] transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 border ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-[#172A35]">
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
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#526572] mt-1 font-medium">
                        <span>Invoice: <span className="font-mono text-[#172A35] font-bold">{doc.invoice_number || '—'}</span></span>
                        <span>•</span>
                        <span>Category: {doc.category}</span>
                        <span>•</span>
                        <span className="font-bold text-[#854D0E] tabular-nums">
                          Due: {formatDueDate(doc.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-base font-black text-[#172A35] font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[11px] text-[#526572] font-mono font-medium">{doc.currency}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onPrepareReminder(doc)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#DCE4E5] bg-white text-xs font-bold text-[#172A35] hover:bg-[#F7F8F5] hover:border-[#087F8C]/50 flex items-center gap-1 transition-all"
                      >
                        <BellRing className="w-3.5 h-3.5 text-[#087F8C]" />
                        <span>Reminder</span>
                      </button>
                      <button
                        onClick={() => onQuickMarkPaid(doc)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#DDF7EF] hover:bg-[#087F5B] text-[#087F5B] hover:text-white border border-[#087F5B]/30 text-xs font-bold transition-all shadow-xs"
                      >
                        Mark Paid
                      </button>
                      <button
                        onClick={() => onOpenReview(doc)}
                        className="p-1.5 text-[#526572] hover:text-[#087F8C] rounded-lg hover:bg-[#DDF5F6] transition-colors"
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

      {/* Section 3: Recent Document Activity Ledger */}
      <section className="financial-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#DCE4E5] flex items-center justify-between bg-[#F7F8F5]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-white border border-[#DCE4E5] text-[#087F8C]">
              <FileText className="w-4 h-4 text-[#087F8C]" />
            </div>
            <div>
              <h2 className="font-extrabold text-[#172A35] text-sm">Recent Transactions Ledger</h2>
              <p className="text-xs text-[#526572]">Latest imported bills, receipts, and state transitions</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('documents')}
            className="text-xs font-bold text-[#087F8C] hover:text-[#066873] hover:underline inline-flex items-center gap-1"
          >
            <span>View All ({documents.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="p-8 text-center text-[#526572] text-xs">
            <p className="font-bold text-[#172A35] text-sm">No Document Activity Yet</p>
            <p className="mt-1">Import your first PDF or scanned receipt to start organizing.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#DCE4E5]">
            {recentActivity.map((doc) => {
              const computed = doc.computed_status || doc.status;
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenReview(doc)}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7F8F5] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border transition-transform group-hover:scale-110 shadow-2xs ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#172A35] group-hover:text-[#087F8C] transition-colors truncate">
                          {doc.vendor || doc.original_name}
                        </span>
                        {doc.is_sample === 1 && <SampleDataBadge />}
                        <StatusBadge status={computed} size="sm" />
                        <VerifiedBadge isVerified={doc.is_verified} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#526572] mt-0.5 truncate font-medium">
                        <span className="font-mono text-[#172A35]">{doc.original_name}</span>
                        <span>•</span>
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span className="tabular-nums font-semibold">Due: {doc.due_date || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-black text-[#172A35] font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[10px] text-[#526572] font-mono font-medium">{doc.currency}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#526572] group-hover:text-[#087F8C] group-hover:translate-x-1 transition-all" />
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
          <div className="px-6 py-4 border-b border-[#087F5B]/20 flex items-center justify-between bg-[#DDF7EF]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-[#087F5B] text-white shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-[#087F5B] text-sm">Settled & Paid Archive</h2>
                <p className="text-xs text-[#087F5B]/80">Completed payments safely archived</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#087F5B] text-white tabular-nums font-mono">
              {paidDocs.length} Paid ({formatCurrency(paidTotal)})
            </span>
          </div>

          <div className="divide-y divide-[#DCE4E5] max-h-60 overflow-y-auto">
            {paidDocs.map((doc) => {
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenReview(doc)}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-[#F7F8F5] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#172A35]">
                          {doc.vendor || 'Unknown Vendor'}
                        </span>
                        {doc.is_sample === 1 && <SampleDataBadge />}
                        <StatusBadge status="paid" size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#526572] mt-0.5 font-medium">
                        <span>Invoice: <span className="font-mono text-[#172A35]">{doc.invoice_number || '—'}</span></span>
                        <span>•</span>
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span className="tabular-nums">Verified: {doc.verified_at ? format(parseISO(doc.verified_at), 'MMM d') : 'Yes'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-black text-[#087F5B] font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[10px] text-[#526572] font-mono font-medium">{doc.currency}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#526572]" />
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
