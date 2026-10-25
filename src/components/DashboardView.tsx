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
    { bg: 'bg-[#22D3EE]/15', text: 'text-[#22D3EE]', border: 'border-[#22D3EE]/30' },
    { bg: 'bg-[#34D399]/15', text: 'text-[#34D399]', border: 'border-[#34D399]/30' },
    { bg: 'bg-[#818CF8]/15', text: 'text-[#818CF8]', border: 'border-[#818CF8]/30' },
    { bg: 'bg-[#FBBF24]/15', text: 'text-[#FBBF24]', border: 'border-[#FBBF24]/30' },
    { bg: 'bg-[#FB7185]/15', text: 'text-[#FB7185]', border: 'border-[#FB7185]/30' },
    { bg: 'bg-[#06B6D4]/15', text: 'text-[#06B6D4]', border: 'border-[#06B6D4]/30' },
    { bg: 'bg-[#A78BFA]/15', text: 'text-[#A78BFA]', border: 'border-[#A78BFA]/30' },
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
        gradient: 'from-[#FB7185] to-[#E11D48]',
        textColor: 'text-[#FB7185]',
        glowColor: 'shadow-[#FB7185]/30',
      },
      {
        id: 'week1',
        label: 'This Week (1–7 Days)',
        shortLabel: '1–7 Days',
        amount: week1Amt,
        count: week1Count,
        gradient: 'from-[#FBBF24] to-[#D97706]',
        textColor: 'text-[#FBBF24]',
        glowColor: 'shadow-[#FBBF24]/30',
      },
      {
        id: 'week2',
        label: 'Next Week (8–14 Days)',
        shortLabel: '8–14 Days',
        amount: week2Amt,
        count: week2Count,
        gradient: 'from-[#22D3EE] to-[#0284C7]',
        textColor: 'text-[#22D3EE]',
        glowColor: 'shadow-[#22D3EE]/30',
      },
      {
        id: 'later',
        label: 'Horizon (15–30+ Days)',
        shortLabel: '15–30+ Days',
        amount: laterAmt,
        count: laterCount,
        gradient: 'from-[#818CF8] to-[#6366F1]',
        textColor: 'text-[#818CF8]',
        glowColor: 'shadow-[#818CF8]/30',
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
      'Utilities': { bar: 'bg-[#22D3EE]', badge: 'bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/30' },
      'Software/SaaS': { bar: 'bg-[#818CF8]', badge: 'bg-[#818CF8]/15 text-[#818CF8] border-[#818CF8]/30' },
      'Rent/Lease': { bar: 'bg-[#34D399]', badge: 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30' },
      'Telecom': { bar: 'bg-[#06B6D4]', badge: 'bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30' },
      'Insurance': { bar: 'bg-[#FBBF24]', badge: 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30' },
      'Supplies': { bar: 'bg-[#10B981]', badge: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30' },
      'Professional Services': { bar: 'bg-[#A78BFA]', badge: 'bg-[#A78BFA]/15 text-[#A78BFA] border-[#A78BFA]/30' },
      'Taxes': { bar: 'bg-[#FB7185]', badge: 'bg-[#FB7185]/15 text-[#FB7185] border-[#FB7185]/30' },
      'Other': { bar: 'bg-[#64748B]', badge: 'bg-[#64748B]/15 text-[#64748B] border-[#64748B]/30' },
    };

    return Array.from(map.entries())
      .map(([category, info]) => ({
        category,
        amount: info.total,
        count: info.count,
        percentage: totalAmount > 0 ? Math.round((info.total / totalAmount) * 100) : 0,
        colors: categoryColors[category] || { bar: 'bg-[#64748B]', badge: 'bg-[#64748B]/15 text-[#64748B] border-[#64748B]/30' },
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
    <div className="space-y-6 animate-in fade-in duration-200 text-[#F8FAFC]">
      {/* Midnight Emerald + Electric Cyan Cyber-HUD Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#111D32] border border-[#29374D] shadow-2xl p-6 sm:p-7 text-[#F8FAFC]">
        {/* Ambient mesh background orbs */}
        <div className="ambient-glow-blue -top-20 -left-20 opacity-25" />
        <div className="ambient-glow-cyan -bottom-20 -right-20 opacity-25" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Live Telemetry Chips Row */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
              {/* Air-gap beacon */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 backdrop-blur-md shadow-xs shadow-[#34D399]/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34D399]"></span>
                </span>
                <span>Air-Gapped Vault</span>
              </span>

              {/* Local Gemma badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30 backdrop-blur-md">
                <Cpu className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Gemma 2:2B On-Device</span>
              </span>

              {/* Zero cloud guarantee */}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 backdrop-blur-md">
                <Lock className="w-3 h-3 text-[#34D399]" />
                <span>Zero Cloud Leaks</span>
              </span>
            </div>

            {/* Title with glowing emblem */}
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-float-gentle select-none">🦥</span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#F8FAFC]">
                  BillSloth Command Center
                </h1>
                <p className="text-xs text-[#A8B7CC] mt-0.5 max-w-xl leading-relaxed">
                  "Stop chasing bills. Know what needs attention." Organized on-device with open-weight Gemma 2 2B models and calm human verification gates.
                </p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => onNavigate('import')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] hover:brightness-110 text-[#0B1220] text-xs font-black shadow-lg shadow-[#22D3EE]/25 inline-flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import Bill</span>
            </button>

            <button
              onClick={() => onNavigate('digest')}
              className="px-3.5 py-2.5 rounded-xl bg-[#162238] hover:bg-[#1C2B46] border border-[#29374D] text-[#F8FAFC] text-xs font-semibold inline-flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <CalendarCheck2 className="w-4 h-4 text-[#22D3EE]" />
              <span>Weekly Digest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Local AI Engine Notice (Calm, informative preview indicator) */}
      {!ollamaAvailable && (
        <div className="financial-card p-4 border-l-4 border-l-[#22D3EE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[#162238]">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-[#22D3EE]/15 text-[#22D3EE] shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#F8FAFC]">Local AI Engine on Standby.</span>{' '}
              <span className="text-[#A8B7CC]">
                All ledger management, categorization, and calculations are active. Connect your local Ollama runtime to enable Gemma 2 2B document extraction.
              </span>
            </div>
          </div>
          <button
            onClick={onOpenOllamaModal}
            className="text-xs font-bold text-[#22D3EE] hover:underline shrink-0 self-start sm:self-auto"
          >
            Connection Guide →
          </button>
        </div>
      )}

      {/* 4 High-Contrast KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div
          onClick={() => onNavigate('documents')}
          className="financial-card-interactive p-5 flex flex-col justify-between cursor-pointer group"
        >
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#22D3EE] to-[#34D399]" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#A8B7CC] uppercase tracking-wider">
              Total Outstanding
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-[#F8FAFC] font-mono tabular-nums tracking-tight">
              {formatCurrency(totalOutstanding)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30 font-mono tabular-nums">
                {unpaidDocs.length} active bills
              </span>
              <span className="text-[11px] text-[#A8B7CC] font-medium">unsettled</span>
            </div>
          </div>
        </div>

        {/* Critical Overdue */}
        <div
          onClick={() => onNavigate('documents')}
          className={`financial-card-interactive p-5 flex flex-col justify-between cursor-pointer group ${
            overdueDocs.length > 0 ? '!border-[#FB7185]/50 bg-[#FB7185]/10' : ''
          }`}
        >
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FB7185] to-[#E11D48]" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#FB7185] uppercase tracking-wider">
              Critical Overdue
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-[#FB7185] font-mono tabular-nums tracking-tight">
              {formatCurrency(overdueTotal)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono tabular-nums ${
                  overdueDocs.length > 0
                    ? 'bg-[#FB7185] text-[#0B1220]'
                    : 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30'
                }`}
              >
                {overdueDocs.length === 0 ? 'Zero Overdue' : `${overdueDocs.length} Overdue`}
              </span>
              <span className="text-[11px] text-[#A8B7CC] font-medium">
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
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FBBF24] to-[#D97706]" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#FBBF24] uppercase tracking-wider">
              Due Soon (7 Days)
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-[#F8FAFC] font-mono tabular-nums tracking-tight">
              {formatCurrency(dueSoonTotal)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30 font-mono tabular-nums">
                {dueSoonDocs.length} bills
              </span>
              <span className="text-[11px] text-[#A8B7CC] font-medium">this week</span>
            </div>
          </div>
        </div>

        {/* Settled & Paid Archive */}
        <div
          onClick={() => onNavigate('documents')}
          className="financial-card-interactive p-5 flex flex-col justify-between cursor-pointer group"
        >
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#34D399] to-[#059669]" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#34D399] uppercase tracking-wider">
              Settled & Paid
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-[#34D399] font-mono tabular-nums tracking-tight">
              {formatCurrency(paidTotal)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 font-mono tabular-nums">
                {paidDocs.length} paid
              </span>
              <span className="text-[11px] text-[#A8B7CC] font-medium">archived</span>
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Financial Maturity Radar & Matrix Grid */}
      <section className="financial-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#29374D] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#22D3EE]" />
              <h3 className="font-extrabold text-sm text-[#F8FAFC]">
                30-Day Cash Maturity Radar
              </h3>
            </div>
            <p className="text-xs text-[#A8B7CC] mt-0.5">
              Interactive timeline density of upcoming maturity deadlines across the next 30 days
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-semibold text-[#A8B7CC]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#111D32] border border-[#29374D]" />
              <span>Clear</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FBBF24]/30 border border-[#FBBF24]" />
              <span className="text-[#FBBF24]">Due Soon</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FB7185]/30 border border-[#FB7185]" />
              <span className="text-[#FB7185]">Overdue</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#34D399]/30 border border-[#34D399]" />
              <span className="text-[#34D399]">Settled</span>
            </span>
          </div>
        </div>

        {/* 30-day interactive matrix blocks */}
        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-2">
          {heatmapDays.map((day, idx) => {
            const isToday = idx === 0;
            const hasBills = day.docs.length > 0;
            let cellStyle = 'bg-[#111D32] hover:bg-[#1C2B46] border-[#29374D] text-[#A8B7CC]';

            if (day.hasOverdue) {
              cellStyle = 'bg-[#FB7185]/15 hover:bg-[#FB7185]/25 border-[#FB7185]/40 text-[#FB7185] shadow-xs shadow-[#FB7185]/20';
            } else if (day.hasUnpaid) {
              cellStyle = 'bg-[#FBBF24]/15 hover:bg-[#FBBF24]/25 border-[#FBBF24]/40 text-[#FBBF24] shadow-xs shadow-[#FBBF24]/20';
            } else if (hasBills) {
              cellStyle = 'bg-[#34D399]/15 hover:bg-[#34D399]/25 border-[#34D399]/40 text-[#34D399]';
            }

            return (
              <button
                key={idx}
                onClick={() => setSelectedHeatmapDay(hasBills ? day : null)}
                title={`${format(day.date, 'MMM d, yyyy')}: ${day.docs.length} bills (${formatCurrency(day.total)})`}
                className={`p-2 rounded-xl border text-center transition-all hover:scale-105 active:scale-95 focus:outline-none relative group ${cellStyle}`}
              >
                {isToday && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#22D3EE] ring-2 ring-[#0B1220]" />
                )}
                <span className="text-[10px] font-extrabold block leading-tight font-mono text-[#F8FAFC]">
                  {format(day.date, 'd')}
                </span>
                <span className="text-[9px] uppercase tracking-tighter block text-[#A8B7CC] font-medium">
                  {format(day.date, 'EEE')}
                </span>
                {hasBills && (
                  <span className="text-[8px] font-extrabold font-mono block mt-0.5 truncate text-[#F8FAFC]">
                    ${Math.round(day.total)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Drawer */}
        {selectedHeatmapDay && (
          <div className="mt-3 p-4 rounded-xl border border-[#29374D] bg-[#111D32] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div>
              <span className="font-extrabold text-[#F8FAFC]">
                {format(selectedHeatmapDay.date, 'EEEE, MMMM d, yyyy')}
              </span>
              <span className="text-[#A8B7CC] ml-2">
                — {selectedHeatmapDay.docs.length} bill{selectedHeatmapDay.docs.length === 1 ? '' : 's'} totaling{' '}
                <strong className="text-[#22D3EE] font-mono">{formatCurrency(selectedHeatmapDay.docs.reduce((s, d) => s + (d.amount || 0), 0))}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('calendar')}
                className="px-3 py-1.5 rounded-lg bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0B1220] font-bold transition-colors"
              >
                View on Calendar →
              </button>
              <button
                onClick={() => setSelectedHeatmapDay(null)}
                className="px-2.5 py-1.5 rounded-lg bg-[#162238] border border-[#29374D] text-[#A8B7CC] hover:text-[#F8FAFC]"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#29374D] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#22D3EE]" />
                <h3 className="font-extrabold text-sm text-[#F8FAFC]">Upcoming Cash Outflow Horizon</h3>
              </div>
              <p className="text-xs text-[#A8B7CC] mt-0.5">
                Maturity timeline of active payment obligations grouped by due dates
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums font-bold text-[#F8FAFC] bg-[#111D32] border border-[#29374D] px-2.5 py-1 rounded-lg">
              Total: {formatCurrency(totalOutstanding)}
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 sm:gap-4 h-48 items-end pt-4 pb-2 px-3 bg-[#111D32] rounded-xl border border-[#29374D]">
              {horizonBreakdown.buckets.map((b) => {
                const heightPercent = horizonBreakdown.maxAmount > 0
                  ? Math.max(Math.round((b.amount / horizonBreakdown.maxAmount) * 100), b.amount > 0 ? 14 : 4)
                  : 4;

                return (
                  <div key={b.id} className="flex flex-col items-center h-full justify-end group">
                    {/* Amount Tooltip / Value */}
                    <span className="text-[11px] font-black font-mono tabular-nums text-[#F8FAFC] mb-1 opacity-90 group-hover:scale-110 transition-transform text-center">
                      {formatCurrency(b.amount)}
                    </span>

                    {/* Visual Bar */}
                    <div className="w-full max-w-[52px] bg-[#162238] rounded-t-xl overflow-hidden flex flex-col justify-end h-36 border border-[#29374D]/60">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full bg-gradient-to-t ${b.gradient} rounded-t-xl transition-all duration-300 group-hover:brightness-110 shadow-sm ${b.glowColor}`}
                        title={`${b.label}: ${formatCurrency(b.amount)} (${b.count} bills)`}
                      />
                    </div>

                    {/* Bottom Label & Count */}
                    <div className="text-center mt-2.5">
                      <span className="text-[11px] font-extrabold text-[#F8FAFC] block truncate">
                        {b.shortLabel}
                      </span>
                      <span className="text-[10px] text-[#A8B7CC] font-mono block font-medium">
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
                <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>Category Outflow Share</span>
                </span>
                <span className="text-[11px] text-[#A8B7CC] font-mono">
                  {categoryBreakdown.length} active categories
                </span>
              </div>
              <div className="h-3 w-full bg-[#111D32] rounded-full overflow-hidden flex border border-[#29374D]">
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
            <div className="flex items-center justify-between border-b border-[#29374D] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#22D3EE]" />
                <h3 className="font-extrabold text-sm text-[#F8FAFC]">Spending by Category</h3>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#22D3EE] bg-[#22D3EE]/15 border border-[#22D3EE]/30 px-2 py-0.5 rounded-full">
                Live Data
              </span>
            </div>

            {/* Categories List */}
            <div className="space-y-2 pt-3">
              {categoryBreakdown.length === 0 ? (
                <div className="py-6 text-center text-[#A8B7CC] text-xs">
                  <p className="font-medium text-[#F8FAFC]">No active obligations.</p>
                  <p className="mt-1">All invoices are settled.</p>
                </div>
              ) : (
                categoryBreakdown.slice(0, 5).map((cat) => (
                  <div
                    key={cat.category}
                    className="p-2.5 rounded-xl border border-[#29374D] bg-[#111D32] flex items-center justify-between text-xs hover:bg-[#1C2B46] transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-2.5 h-2.5 rounded-full ${cat.colors.bar} shrink-0`} />
                      <div className="truncate">
                        <span className="font-bold text-[#F8FAFC] block truncate">{cat.category}</span>
                        <span className="text-[10px] text-[#A8B7CC] font-medium">
                          {cat.count} bill{cat.count === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-[#F8FAFC] font-mono tabular-nums">
                        {formatCurrency(cat.amount)}
                      </div>
                      <span className="text-[10px] font-bold text-[#A8B7CC] font-mono tabular-nums">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                ))
              )}

              {needsReviewDocs.length > 0 && (
                <div className="mt-3 p-3 rounded-xl border border-[#FBBF24]/30 bg-[#FBBF24]/10 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Eye className="w-4 h-4 text-[#FBBF24] shrink-0" />
                    <span className="font-bold text-[#F8FAFC] truncate">
                      {needsReviewDocs.length} bill{needsReviewDocs.length === 1 ? '' : 's'} need check
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate('documents')}
                    className="text-[11px] font-extrabold text-[#FBBF24] hover:underline shrink-0"
                  >
                    Review →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Privacy & Audit Signal Badge */}
          <div className="pt-3 border-t border-[#29374D] flex items-center justify-between text-xs text-[#A8B7CC]">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#34D399]">
              <ShieldCheck className="w-4 h-4 text-[#34D399]" />
              <span>Immutable SQLite Ledger</span>
            </span>
            <button
              onClick={() => onNavigate('audit')}
              className="font-bold text-[#22D3EE] hover:underline text-[11px]"
            >
              Audit Log →
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Critical Overdue Invoices (Priority Attention) */}
      {overdueDocs.length > 0 && (
        <section className="financial-card !border-[#FB7185]/50 overflow-hidden shadow-md shadow-[#FB7185]/5">
          <div className="px-6 py-4 border-b border-[#FB7185]/30 flex items-center justify-between bg-[#FB7185]/10">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-gradient-to-tr from-[#FB7185] to-[#E11D48] text-[#0B1220] shadow-xs shadow-[#FB7185]/30">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-[#F8FAFC] text-sm">Critical Overdue Invoices</h2>
                <p className="text-xs text-[#A8B7CC]">Bills that have passed their stated payment date</p>
              </div>
            </div>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FB7185] text-[#0B1220] tabular-nums font-mono shadow-xs shadow-[#FB7185]/30">
              {overdueDocs.length} Overdue ({formatCurrency(overdueTotal)})
            </span>
          </div>

          <div className="divide-y divide-[#29374D]">
            {overdueDocs.map((doc) => {
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#1C2B46] transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 border ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-[#F8FAFC]">
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
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#A8B7CC] mt-1 font-medium">
                        <span>Invoice: <span className="font-mono text-[#F8FAFC] font-bold">{doc.invoice_number || '—'}</span></span>
                        <span>•</span>
                        <span>Category: {doc.category}</span>
                        <span>•</span>
                        <span className="font-bold text-[#FB7185] tabular-nums">
                          Due: {formatDueDate(doc.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-base font-black text-[#FB7185] font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[11px] text-[#A8B7CC] font-mono font-medium">{doc.currency}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onPrepareReminder(doc)}
                        title="Prepare reminder for human approval"
                        className="px-2.5 py-1.5 rounded-lg border border-[#29374D] bg-[#111D32] text-xs font-bold text-[#F8FAFC] hover:bg-[#1C2B46] hover:border-[#22D3EE]/50 flex items-center gap-1 transition-all"
                      >
                        <BellRing className="w-3.5 h-3.5 text-[#22D3EE]" />
                        <span>Reminder</span>
                      </button>
                      <button
                        onClick={() => onQuickMarkPaid(doc)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#34D399]/20 hover:bg-[#34D399] text-[#34D399] hover:text-[#0B1220] border border-[#34D399]/40 text-xs font-bold transition-all shadow-xs"
                      >
                        Mark Paid
                      </button>
                      <button
                        onClick={() => onOpenReview(doc)}
                        className="p-1.5 text-[#A8B7CC] hover:text-[#22D3EE] rounded-lg hover:bg-[#111D32] transition-colors"
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
        <div className="px-6 py-4 border-b border-[#FBBF24]/30 flex items-center justify-between bg-[#FBBF24]/10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-[#FBBF24] to-[#D97706] text-[#0B1220] shadow-xs shadow-[#FBBF24]/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-[#F8FAFC] text-sm">Due Soon (Next 7–14 Days)</h2>
              <p className="text-xs text-[#A8B7CC]">Bills approaching payment deadlines</p>
            </div>
          </div>
          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FBBF24] text-[#0B1220] tabular-nums font-mono shadow-xs shadow-[#FBBF24]/30">
            {dueSoonDocs.length} Pending ({formatCurrency(dueSoonTotal)})
          </span>
        </div>

        {dueSoonDocs.length === 0 ? (
          <div className="p-8 text-center text-[#A8B7CC] text-xs">
            <p className="font-bold text-[#F8FAFC] text-sm">No Bills Due in the Next 7 Days</p>
            <p className="mt-1">Enjoy the breathing room. Your cash flow schedule is calm.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#29374D]">
            {dueSoonDocs.map((doc) => {
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#1C2B46] transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 border ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-[#F8FAFC]">
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
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#A8B7CC] mt-1 font-medium">
                        <span>Invoice: <span className="font-mono text-[#F8FAFC] font-bold">{doc.invoice_number || '—'}</span></span>
                        <span>•</span>
                        <span>Category: {doc.category}</span>
                        <span>•</span>
                        <span className="font-bold text-[#FBBF24] tabular-nums">
                          Due: {formatDueDate(doc.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-base font-black text-[#F8FAFC] font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[11px] text-[#A8B7CC] font-mono font-medium">{doc.currency}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onPrepareReminder(doc)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#29374D] bg-[#111D32] text-xs font-bold text-[#F8FAFC] hover:bg-[#1C2B46] hover:border-[#22D3EE]/50 flex items-center gap-1 transition-all"
                      >
                        <BellRing className="w-3.5 h-3.5 text-[#22D3EE]" />
                        <span>Reminder</span>
                      </button>
                      <button
                        onClick={() => onQuickMarkPaid(doc)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#34D399]/20 hover:bg-[#34D399] text-[#34D399] hover:text-[#0B1220] border border-[#34D399]/40 text-xs font-bold transition-all shadow-xs"
                      >
                        Mark Paid
                      </button>
                      <button
                        onClick={() => onOpenReview(doc)}
                        className="p-1.5 text-[#A8B7CC] hover:text-[#22D3EE] rounded-lg hover:bg-[#111D32] transition-colors"
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
        <div className="px-6 py-4 border-b border-[#29374D] flex items-center justify-between bg-[#111D32]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-[#162238] border border-[#29374D] text-[#22D3EE]">
              <FileText className="w-4 h-4 text-[#22D3EE]" />
            </div>
            <div>
              <h2 className="font-extrabold text-[#F8FAFC] text-sm">Recent Transactions Ledger</h2>
              <p className="text-xs text-[#A8B7CC]">Latest imported bills, receipts, and state transitions</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('documents')}
            className="text-xs font-bold text-[#22D3EE] hover:underline inline-flex items-center gap-1"
          >
            <span>View All ({documents.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="p-8 text-center text-[#A8B7CC] text-xs">
            <p className="font-bold text-[#F8FAFC] text-sm">No Document Activity Yet</p>
            <p className="mt-1">Import your first PDF or scanned receipt to start organizing.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#29374D]">
            {recentActivity.map((doc) => {
              const computed = doc.computed_status || doc.status;
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenReview(doc)}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1C2B46] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border transition-transform group-hover:scale-110 shadow-2xs ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#F8FAFC] group-hover:text-[#22D3EE] transition-colors truncate">
                          {doc.vendor || doc.original_name}
                        </span>
                        {doc.is_sample === 1 && <SampleDataBadge />}
                        <StatusBadge status={computed} size="sm" />
                        <VerifiedBadge isVerified={doc.is_verified} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#A8B7CC] mt-0.5 truncate font-medium">
                        <span className="font-mono text-[#F8FAFC]">{doc.original_name}</span>
                        <span>•</span>
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span className="tabular-nums font-semibold">Due: {doc.due_date || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-black text-[#F8FAFC] font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[10px] text-[#A8B7CC] font-mono font-medium">{doc.currency}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#A8B7CC] group-hover:text-[#22D3EE] group-hover:translate-x-1 transition-all" />
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
          <div className="px-6 py-4 border-b border-[#34D399]/30 flex items-center justify-between bg-[#34D399]/10">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-gradient-to-tr from-[#34D399] to-[#059669] text-[#0B1220] shadow-xs shadow-[#34D399]/30">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-[#F8FAFC] text-sm">Settled & Paid Archive</h2>
                <p className="text-xs text-[#A8B7CC]">Completed payments safely archived</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40 tabular-nums font-mono">
              {paidDocs.length} Paid ({formatCurrency(paidTotal)})
            </span>
          </div>

          <div className="divide-y divide-[#29374D] max-h-60 overflow-y-auto">
            {paidDocs.map((doc) => {
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenReview(doc)}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-[#1C2B46] transition-colors cursor-pointer opacity-90"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#F8FAFC]">
                          {doc.vendor || 'Unknown Vendor'}
                        </span>
                        {doc.is_sample === 1 && <SampleDataBadge />}
                        <StatusBadge status="paid" size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#A8B7CC] mt-0.5 font-medium">
                        <span>Invoice: <span className="font-mono text-[#F8FAFC]">{doc.invoice_number || '—'}</span></span>
                        <span>•</span>
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span className="tabular-nums">Verified: {doc.verified_at ? format(parseISO(doc.verified_at), 'MMM d') : 'Yes'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-black text-[#34D399] font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[10px] text-[#A8B7CC] font-mono font-medium">{doc.currency}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#A8B7CC]" />
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
