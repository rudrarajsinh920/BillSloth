import React, { useMemo } from 'react';
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
} from 'lucide-react';
import { DocumentItem } from '../types';
import { NavTab } from './Sidebar';
import { StatusBadge, VerifiedBadge, SampleDataBadge, ExtractionTelemetryBadge } from './StatusBadge';
import { format, parseISO, differenceInDays } from 'date-fns';

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

  // Cash Outflow Maturity Horizon (FinCore Bar Chart inspired)
  const horizonBreakdown = useMemo(() => {
    const now = new Date();
    let overdueAmt = 0;
    let overdueCount = 0;
    let week1Amt = 0; // 0 to 7 days
    let week1Count = 0;
    let week2Amt = 0; // 8 to 14 days
    let week2Count = 0;
    let laterAmt = 0; // >14 days
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
        barColor: 'bg-red-500',
        textColor: 'text-red-600',
      },
      {
        id: 'week1',
        label: 'This Week (1–7 Days)',
        shortLabel: '1–7 Days',
        amount: week1Amt,
        count: week1Count,
        barColor: 'bg-amber-500',
        textColor: 'text-amber-700',
      },
      {
        id: 'week2',
        label: 'Next Week (8–14 Days)',
        shortLabel: '8–14 Days',
        amount: week2Amt,
        count: week2Count,
        barColor: 'bg-brand-blue',
        textColor: 'text-brand-blue',
      },
      {
        id: 'later',
        label: 'Later (15–30+ Days)',
        shortLabel: '15–30+ Days',
        amount: laterAmt,
        count: laterCount,
        barColor: 'bg-indigo-600',
        textColor: 'text-indigo-600',
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

    const categoryColors: Record<string, string> = {
      'Utilities': 'bg-sky-500',
      'Software/SaaS': 'bg-brand-blue',
      'Rent/Lease': 'bg-indigo-600',
      'Telecom': 'bg-teal-500',
      'Insurance': 'bg-amber-500',
      'Supplies': 'bg-emerald-500',
      'Professional Services': 'bg-purple-500',
      'Taxes': 'bg-rose-500',
      'Other': 'bg-slate-400',
    };

    return Array.from(map.entries())
      .map(([category, info]) => ({
        category,
        amount: info.total,
        count: info.count,
        percentage: totalAmount > 0 ? Math.round((info.total / totalAmount) * 100) : 0,
        color: categoryColors[category] || 'bg-slate-500',
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
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Welcoming Header Banner (FinCore & MySign inspired) */}
      <div className="financial-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-navy-900 tracking-tight">
              Welcome back to BillSloth
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Slow & Steady
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Local • Zero Cloud AI</span>
            </span>
          </div>
          <p className="text-xs text-slate-muted mt-1.5 max-w-2xl leading-relaxed">
            "Stop chasing bills. Know what needs attention." Organized on-device with open-weight Gemma 2 2B models and calm human verification.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('import')}
            className="px-4 py-2.5 rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-semibold shadow-sm inline-flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import Document</span>
          </button>
          <button
            onClick={() => onNavigate('digest')}
            className="px-3.5 py-2.5 rounded-lg border border-slate-border bg-white hover:bg-slate-50 text-navy-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
          >
            <CalendarCheck2 className="w-4 h-4 text-brand-blue" />
            <span>Weekly Digest</span>
          </button>
        </div>
      </div>

      {/* Local AI Engine Notice (Calm, informative preview indicator) */}
      {!ollamaAvailable && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-navy-800">
          <div className="flex items-start sm:items-center gap-2.5">
            <Cpu className="w-4 h-4 text-brand-blue shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-semibold text-navy-900">Local AI Engine on Standby.</span>{' '}
              <span className="text-slate-600">
                All ledger management, categorization, and calculations are active. Connect your local Ollama runtime to enable Gemma 2 2B document extraction.
              </span>
            </div>
          </div>
          <button
            onClick={onOpenOllamaModal}
            className="text-xs font-semibold text-brand-blue hover:text-brand-blue-hover hover:underline underline-offset-2 shrink-0 self-start sm:self-auto"
          >
            Connection Guide →
          </button>
        </div>
      )}

      {/* 4 Polished Status Summary Cards (FinCore & MySign KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div
          onClick={() => onNavigate('documents')}
          className="financial-card-interactive p-5 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-muted uppercase tracking-wider">
              Total Outstanding
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-blue border border-blue-200/60 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-navy-900 font-mono tabular-nums">
              {formatCurrency(totalOutstanding)}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono tabular-nums">
                {unpaidDocs.length} active bills
              </span>
              <span className="text-[11px] text-slate-muted">across categories</span>
            </div>
          </div>
        </div>

        {/* Critical Overdue */}
        <div
          onClick={() => onNavigate('documents')}
          className={`financial-card-interactive p-5 flex flex-col justify-between cursor-pointer ${
            overdueDocs.length > 0 ? '!border-red-overdue-border bg-red-overdue-light/10' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-overdue uppercase tracking-wider">
              Critical Overdue
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-200/60 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-red-overdue font-mono tabular-nums">
              {formatCurrency(overdueTotal)}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full font-mono tabular-nums ${
                  overdueDocs.length > 0
                    ? 'bg-red-overdue text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {overdueDocs.length === 0 ? 'All Clear' : `${overdueDocs.length} Overdue`}
              </span>
              <span className="text-[11px] text-slate-muted">
                {overdueDocs.length === 0 ? 'Zero overdue' : 'Action required'}
              </span>
            </div>
          </div>
        </div>

        {/* Due Soon (7 Days) */}
        <div
          onClick={() => onNavigate('documents')}
          className="financial-card-interactive p-5 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-warn uppercase tracking-wider">
              Due Soon (7 Days)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-warn border border-amber-200/60 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-navy-900 font-mono tabular-nums">
              {formatCurrency(dueSoonTotal)}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono tabular-nums">
                {dueSoonDocs.length} bills
              </span>
              <span className="text-[11px] text-slate-muted">due in next 7 days</span>
            </div>
          </div>
        </div>

        {/* Settled & Paid Archive */}
        <div
          onClick={() => onNavigate('documents')}
          className="financial-card-interactive p-5 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Settled & Paid
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {formatCurrency(paidTotal)}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono tabular-nums">
                {paidDocs.length} paid
              </span>
              <span className="text-[11px] text-slate-muted">verified archive</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Cash Flow Maturity Horizon & Category Distribution (FinCore inspired) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cash Flow Maturity Horizon Bar Chart (FinCore Outflow Chart) */}
        <div className="lg:col-span-2 financial-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-border pb-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-blue" />
                <h3 className="font-bold text-sm text-navy-900">Upcoming Cash Outflow Horizon</h3>
              </div>
              <p className="text-xs text-slate-muted mt-0.5">
                Maturity timeline of active payment obligations grouped by due dates
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums font-bold text-navy-900 bg-slate-100 px-2.5 py-1 rounded-lg">
              Total Outstanding: {formatCurrency(totalOutstanding)}
            </span>
          </div>

          {/* SVG Bar Chart (FinCore inspired) */}
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 sm:gap-4 h-44 items-end pt-4 pb-2 px-2 bg-slate-50/60 rounded-xl border border-slate-200/60">
              {horizonBreakdown.buckets.map((b) => {
                const heightPercent = horizonBreakdown.maxAmount > 0
                  ? Math.max(Math.round((b.amount / horizonBreakdown.maxAmount) * 100), b.amount > 0 ? 12 : 4)
                  : 4;

                return (
                  <div key={b.id} className="flex flex-col items-center h-full justify-end group">
                    {/* Amount Tooltip / Value on top of bar */}
                    <span className="text-[11px] font-bold font-mono tabular-nums text-navy-900 mb-1 opacity-90 group-hover:scale-105 transition-transform text-center">
                      {formatCurrency(b.amount)}
                    </span>

                    {/* Visual Bar */}
                    <div className="w-full max-w-[48px] bg-slate-200/80 rounded-t-lg overflow-hidden flex flex-col justify-end h-32">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full ${b.barColor} rounded-t-lg transition-all duration-300 group-hover:brightness-110 shadow-2xs`}
                        title={`${b.label}: ${formatCurrency(b.amount)} (${b.count} bills)`}
                      />
                    </div>

                    {/* Bottom Label & Count */}
                    <div className="text-center mt-2">
                      <span className="text-[11px] font-semibold text-navy-900 block truncate">
                        {b.shortLabel}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
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
                <span className="font-semibold text-navy-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Category Outflow Share</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {categoryBreakdown.length} active categories
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {categoryBreakdown.map((cat) => (
                  <div
                    key={cat.category}
                    style={{ width: `${Math.max(cat.percentage, 4)}%` }}
                    className={`${cat.color} h-full transition-all`}
                    title={`${cat.category}: ${formatCurrency(cat.amount)} (${cat.percentage}%)`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Category Breakdown & Signals (FinCore & MySign style) */}
        <div className="financial-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-border pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-blue" />
                <h3 className="font-bold text-sm text-navy-900">Spending by Category</h3>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Live Data
              </span>
            </div>

            {/* Categories List */}
            <div className="space-y-2.5 pt-3">
              {categoryBreakdown.length === 0 ? (
                <div className="py-6 text-center text-slate-muted text-xs">
                  <p className="font-medium text-navy-800">No active obligations.</p>
                  <p className="mt-1">All invoices are settled.</p>
                </div>
              ) : (
                categoryBreakdown.slice(0, 5).map((cat) => (
                  <div
                    key={cat.category}
                    className="p-2.5 rounded-xl border border-slate-border bg-slate-50/60 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-2.5 h-2.5 rounded-full ${cat.color} shrink-0`} />
                      <div className="truncate">
                        <span className="font-semibold text-navy-900 block truncate">{cat.category}</span>
                        <span className="text-[10px] text-slate-muted">
                          {cat.count} bill{cat.count === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-navy-900 font-mono tabular-nums">
                        {formatCurrency(cat.amount)}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 font-mono tabular-nums">
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
                    <span className="font-semibold text-navy-900 truncate">
                      {needsReviewDocs.length} bill{needsReviewDocs.length === 1 ? '' : 's'} awaiting human check
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate('documents')}
                    className="text-[11px] font-bold text-amber-warn hover:underline shrink-0"
                  >
                    Review →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Privacy & Audit Signal Badge */}
          <div className="pt-3 border-t border-slate-border flex items-center justify-between text-xs text-slate-muted">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Immutable SQLite Ledger</span>
            </span>
            <button
              onClick={() => onNavigate('audit')}
              className="font-semibold text-brand-blue hover:underline text-[11px]"
            >
              View Audit Log →
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Critical Overdue Invoices (Priority Attention) */}
      {overdueDocs.length > 0 && (
        <section className="financial-card !border-red-overdue-border overflow-hidden">
          <div className="px-6 py-4 border-b border-red-overdue-border flex items-center justify-between bg-red-overdue-light/30">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-red-overdue text-white">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-navy-900 text-sm">Critical Overdue Invoices</h2>
                <p className="text-xs text-slate-muted">Bills that have passed their stated payment date</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-overdue text-white tabular-nums font-mono">
              {overdueDocs.length} Overdue ({formatCurrency(overdueTotal)})
            </span>
          </div>

          <div className="divide-y divide-slate-border">
            {overdueDocs.map((doc) => {
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-light/60 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-navy-900">
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
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-muted mt-1">
                        <span>Invoice: <span className="font-mono">{doc.invoice_number || '—'}</span></span>
                        <span>•</span>
                        <span>Category: {doc.category}</span>
                        <span>•</span>
                        <span className="font-semibold text-red-overdue tabular-nums">
                          Due: {formatDueDate(doc.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-base font-bold text-red-overdue font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[11px] text-slate-muted font-mono">{doc.currency}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onPrepareReminder(doc)}
                        title="Prepare reminder for human approval"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-border text-xs font-medium text-navy-800 hover:bg-slate-100 flex items-center gap-1 transition-colors"
                      >
                        <BellRing className="w-3.5 h-3.5 text-brand-blue" />
                        <span>Reminder</span>
                      </button>
                      <button
                        onClick={() => onQuickMarkPaid(doc)}
                        className="px-2.5 py-1.5 rounded-lg bg-green-paid hover:bg-green-700 text-white text-xs font-medium transition-colors"
                      >
                        Mark Paid
                      </button>
                      <button
                        onClick={() => onOpenReview(doc)}
                        className="p-1.5 text-slate-muted hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
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
        <div className="px-6 py-4 border-b border-slate-border flex items-center justify-between bg-amber-warn-light/30">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-warn text-white">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-navy-900 text-sm">Due Soon (Next 7–14 Days)</h2>
              <p className="text-xs text-slate-muted">Bills approaching payment deadlines</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-warn text-white tabular-nums font-mono">
            {dueSoonDocs.length} Pending ({formatCurrency(dueSoonTotal)})
          </span>
        </div>

        {dueSoonDocs.length === 0 ? (
          <div className="p-8 text-center text-slate-muted text-xs">
            <p className="font-semibold text-navy-900 text-sm">No Bills Due in the Next 7 Days</p>
            <p className="mt-1">Enjoy the breathing room. Your cash flow schedule is calm.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-border">
            {dueSoonDocs.map((doc) => {
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-light/60 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-navy-900">
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
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-muted mt-1">
                        <span>Invoice: <span className="font-mono">{doc.invoice_number || '—'}</span></span>
                        <span>•</span>
                        <span>Category: {doc.category}</span>
                        <span>•</span>
                        <span className="font-semibold text-amber-warn tabular-nums">
                          Due: {formatDueDate(doc.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-base font-bold text-navy-900 font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[11px] text-slate-muted font-mono">{doc.currency}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onPrepareReminder(doc)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-border text-xs font-medium text-navy-800 hover:bg-slate-100 flex items-center gap-1 transition-colors"
                      >
                        <BellRing className="w-3.5 h-3.5 text-brand-blue" />
                        <span>Prepare Reminder</span>
                      </button>
                      <button
                        onClick={() => onQuickMarkPaid(doc)}
                        className="px-2.5 py-1.5 rounded-lg bg-green-paid hover:bg-green-700 text-white text-xs font-medium transition-colors"
                      >
                        Mark Paid
                      </button>
                      <button
                        onClick={() => onOpenReview(doc)}
                        className="p-1.5 text-slate-muted hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
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
        <div className="px-6 py-4 border-b border-slate-border flex items-center justify-between bg-slate-light">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-navy-900 text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-navy-900 text-sm">Recent Transactions & Document Ledger</h2>
              <p className="text-xs text-slate-muted">Latest imported bills, receipts, and status changes</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('documents')}
            className="text-xs font-semibold text-brand-blue hover:underline inline-flex items-center gap-1"
          >
            <span>View All ({documents.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="p-8 text-center text-slate-muted text-xs">
            <p className="font-semibold text-navy-900 text-sm">No Document Activity Yet</p>
            <p className="mt-1">Import your first PDF or scanned receipt to start organizing.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-border">
            {recentActivity.map((doc) => {
              const computed = doc.computed_status || doc.status;
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenReview(doc)}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-light/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border transition-transform group-hover:scale-105 ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-navy-900 group-hover:text-brand-blue transition-colors truncate">
                          {doc.vendor || doc.original_name}
                        </span>
                        {doc.is_sample === 1 && <SampleDataBadge />}
                        <StatusBadge status={computed} size="sm" />
                        <VerifiedBadge isVerified={doc.is_verified} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-muted mt-0.5 truncate">
                        <span className="font-mono">{doc.original_name}</span>
                        <span>•</span>
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span className="tabular-nums">Due: {doc.due_date || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-navy-900 font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[10px] text-slate-muted font-mono">{doc.currency}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-muted group-hover:text-navy-900 group-hover:translate-x-0.5 transition-all" />
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
          <div className="px-6 py-4 border-b border-slate-border flex items-center justify-between bg-emerald-50/40">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-700 text-white">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-navy-900 text-sm">Settled & Paid Archive</h2>
                <p className="text-xs text-slate-muted">Completed payments safely archived</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 tabular-nums font-mono">
              {paidDocs.length} Paid ({formatCurrency(paidTotal)})
            </span>
          </div>

          <div className="divide-y divide-slate-border max-h-60 overflow-y-auto">
            {paidDocs.map((doc) => {
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenReview(doc)}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-light/60 transition-colors cursor-pointer opacity-90"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                    >
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-navy-900">
                          {doc.vendor || 'Unknown Vendor'}
                        </span>
                        {doc.is_sample === 1 && <SampleDataBadge />}
                        <StatusBadge status="paid" size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-muted mt-0.5">
                        <span>Invoice: <span className="font-mono">{doc.invoice_number || '—'}</span></span>
                        <span>•</span>
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span className="tabular-nums">Verified: {doc.verified_at ? format(parseISO(doc.verified_at), 'MMM d') : 'Yes'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-emerald-700 font-mono tabular-nums">
                        {formatCurrency(doc.amount, doc.currency)}
                      </div>
                      <span className="text-[10px] text-slate-muted font-mono">{doc.currency}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-muted" />
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
