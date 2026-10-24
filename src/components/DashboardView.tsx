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
} from 'lucide-react';
import { DocumentItem } from '../types';
import { NavTab } from './Navbar';
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

  // Recent 5 documents for activity table (Reference 2 / Reference 3 inspired)
  const recentActivity = useMemo(() => {
    return [...documents]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5);
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
        return `${Math.abs(daysDiff)} day${Math.abs(daysDiff) === 1 ? '' : 's'} ago (${format(date, 'MMM d')})`;
      } else if (daysDiff === 0) {
        return `Today (${format(date, 'MMM d')})`;
      } else if (daysDiff === 1) {
        return `Tomorrow (${format(date, 'MMM d')})`;
      } else {
        return `In ${daysDiff} days (${format(date, 'MMM d')})`;
      }
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Welcoming Header Banner (Inspired by Reference Image 2 & 3) */}
      <div className="financial-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-navy-900 tracking-tight">
              Welcome back to BillSloth
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Slow & Steady
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-paid-light text-green-paid border border-green-paid-border flex items-center gap-1">
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

      {/* 4 Polished Status Summary Cards (Inspired by Reference 1, 2, and 3) */}
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
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-navy-900 font-mono tabular-nums">
              {formatCurrency(totalOutstanding)}
            </div>
            <p className="text-xs text-slate-muted mt-1 tabular-nums font-medium">
              {unpaidDocs.length} unpaid bill{unpaidDocs.length === 1 ? '' : 's'} across all categories
            </p>
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
            <div className="w-9 h-9 rounded-lg bg-red-overdue-light text-red-overdue flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-red-overdue font-mono tabular-nums">
              {formatCurrency(overdueTotal)}
            </div>
            <p className="text-xs text-red-overdue mt-1 tabular-nums font-semibold">
              {overdueDocs.length === 0 ? 'Zero overdue bills — all calm' : `${overdueDocs.length} bill${overdueDocs.length === 1 ? '' : 's'} require immediate action`}
            </p>
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
            <div className="w-9 h-9 rounded-lg bg-amber-warn-light text-amber-warn flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-navy-900 font-mono tabular-nums">
              {formatCurrency(dueSoonTotal)}
            </div>
            <p className="text-xs text-slate-muted mt-1 tabular-nums font-medium">
              {dueSoonDocs.length} bill{dueSoonDocs.length === 1 ? '' : 's'} scheduled this week
            </p>
          </div>
        </div>

        {/* Needs Human Review */}
        <div
          onClick={() => onNavigate('documents')}
          className="financial-card-interactive p-5 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-muted uppercase tracking-wider">
              Needs Review
            </span>
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-navy-700 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-navy-900 font-mono tabular-nums">
              {needsReviewDocs.length}
            </div>
            <p className="text-xs text-slate-muted mt-1 tabular-nums font-medium">
              Unverified extractions awaiting check
            </p>
          </div>
        </div>
      </div>

      {/* Middle Row: Financial Overview & Alerts Panel (Inspired by Reference 2 & 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cash Flow Demand by Category (Deterministic Breakdown) */}
        <div className="lg:col-span-2 financial-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-border pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-blue" />
                <h3 className="font-bold text-sm text-navy-900">Cash Flow Demand by Category</h3>
              </div>
              <p className="text-xs text-slate-muted mt-0.5">
                Exact breakdown of unpaid obligations calculated directly from your stored invoices
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums font-bold text-navy-900 bg-slate-100 px-2.5 py-1 rounded-lg">
              Total: {formatCurrency(totalOutstanding)}
            </span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="py-8 text-center text-slate-muted text-xs">
              <p className="font-medium text-navy-800">No active bills to categorize.</p>
              <p className="mt-1">All invoices are settled or none have been imported yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Segmented Stacked Progress Bar (Inspired by Reference Image 3 "Most Signed File") */}
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

              {/* Category Breakdown Table / Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {categoryBreakdown.map((cat) => (
                  <div
                    key={cat.category}
                    className="p-3 rounded-lg border border-slate-border bg-slate-light/40 flex items-center justify-between text-xs hover:bg-slate-light transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`w-2.5 h-2.5 rounded-full ${cat.color} shrink-0`} />
                      <div className="truncate">
                        <span className="font-semibold text-navy-900 block truncate">{cat.category}</span>
                        <span className="text-[11px] text-slate-muted">
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
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Alerts & Data Safety Hub (Inspired by Reference Image 2 Alerts & Reference Image 3 Checklist) */}
        <div className="financial-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-border pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-brand-blue" />
                <h3 className="font-bold text-sm text-navy-900">Calm Alerts & Signals</h3>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Live Status
              </span>
            </div>

            <div className="space-y-3 pt-3">
              {/* Overdue alert */}
              {overdueDocs.length > 0 ? (
                <div className="p-3 rounded-lg border border-red-overdue-border bg-red-overdue-light/40 text-xs text-red-overdue space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{overdueDocs.length} Overdue Invoices</span>
                    </span>
                    <span className="font-mono tabular-nums">{formatCurrency(overdueTotal)}</span>
                  </div>
                  <p className="text-[11px] text-navy-800 leading-normal">
                    Requires immediate review or reminder export.
                  </p>
                  <button
                    onClick={() => onNavigate('documents')}
                    className="text-[11px] font-bold text-red-overdue hover:underline flex items-center gap-1"
                  >
                    <span>View Overdue Bills</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-green-paid-border bg-green-paid-light/40 text-xs text-green-paid flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>No overdue bills. Your obligations are clear.</span>
                </div>
              )}

              {/* Needs Review alert */}
              {needsReviewDocs.length > 0 && (
                <div className="p-3 rounded-lg border border-amber-warn-border bg-amber-warn-light/40 text-xs text-amber-warn space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{needsReviewDocs.length} Unverified Extractions</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-navy-800 leading-normal">
                    AI fields are held unverified until human review confirms them.
                  </p>
                  <button
                    onClick={() => onNavigate('documents')}
                    className="text-[11px] font-bold text-amber-warn hover:underline flex items-center gap-1"
                  >
                    <span>Review Unverified Bills</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Local AI Status Pill */}
              <div className="p-3 rounded-lg border border-slate-border bg-cool-bg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-navy-900">
                    <Cpu className="w-3.5 h-3.5 text-brand-blue" />
                    <span>Local AI Engine</span>
                  </div>
                  {ollamaAvailable ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-paid-light text-green-paid border border-green-paid-border">
                      Gemma 2:2b Ready
                    </span>
                  ) : (
                    <button
                      onClick={onOpenOllamaModal}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-warn-light text-amber-warn border border-amber-warn-border hover:underline"
                    >
                      Ollama Offline
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-muted leading-relaxed">
                  Inference runs 100% on local hardware. Zero financial data is ever transmitted to cloud APIs.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-border flex items-center justify-between text-xs text-slate-muted">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-paid" />
              <span>Immutable SQLite Audit Trail</span>
            </span>
            <button
              onClick={() => onNavigate('audit')}
              className="font-semibold text-brand-blue hover:underline"
            >
              View Log →
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Overdue Invoices (Priority Attention) */}
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
            {overdueDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-light/60 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-red-overdue-light text-red-overdue shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
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
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
            {dueSoonDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-light/60 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-amber-warn-light text-amber-warn shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
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
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Recent Document Activity Ledger (Inspired by Reference 2 Recent Transactions & Reference 3 Recent Activity) */}
      <section className="financial-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-border flex items-center justify-between bg-slate-light">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-navy-800 text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-navy-900 text-sm">Recent Document Activity</h2>
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
              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenReview(doc)}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-light/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-navy-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                      {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-navy-900 group-hover:text-brand-blue transition-colors">
                          {doc.vendor || doc.original_name}
                        </span>
                        {doc.is_sample === 1 && <SampleDataBadge />}
                        <StatusBadge status={computed} size="sm" />
                        <VerifiedBadge isVerified={doc.is_verified} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-muted mt-0.5">
                        <span className="font-mono">{doc.original_name}</span>
                        <span>•</span>
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span className="tabular-nums">Due: {doc.due_date || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
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
          <div className="px-6 py-4 border-b border-slate-border flex items-center justify-between bg-green-paid-light/20">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-green-paid text-white">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-navy-900 text-sm">Settled & Paid Invoices</h2>
                <p className="text-xs text-slate-muted">Completed payments safely archived</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-paid-light text-green-paid border border-green-paid-border tabular-nums font-mono">
              {paidDocs.length} Paid
            </span>
          </div>

          <div className="divide-y divide-slate-border max-h-60 overflow-y-auto">
            {paidDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onOpenReview(doc)}
                className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-light/60 transition-colors cursor-pointer opacity-85"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-paid-light text-green-paid shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
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
                    <div className="text-sm font-semibold text-green-paid font-mono tabular-nums">
                      {formatCurrency(doc.amount, doc.currency)}
                    </div>
                    <span className="text-[10px] text-slate-muted font-mono">{doc.currency}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-muted" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
