import React from 'react';
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
  AlertTriangle,
} from 'lucide-react';
import { DocumentItem } from '../types';
import { NavTab } from './Navbar';
import { StatusBadge, VerifiedBadge, SampleDataBadge } from './StatusBadge';
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
  const overdueDocs = documents.filter((d) => (d.computed_status || d.status) === 'overdue');
  const dueSoonDocs = documents.filter((d) => (d.computed_status || d.status) === 'due_soon');
  const needsReviewDocs = documents.filter(
    (d) => (d.computed_status || d.status) === 'needs_review' || d.is_verified === 0
  );
  const paidDocs = documents.filter((d) => (d.computed_status || d.status) === 'paid');

  // Compute metrics
  const totalOutstanding = documents
    .filter((d) => (d.computed_status || d.status) !== 'paid')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const overdueTotal = overdueDocs.reduce((sum, d) => sum + (d.amount || 0), 0);
  const dueSoonTotal = dueSoonDocs.reduce((sum, d) => sum + (d.amount || 0), 0);

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
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Top Banner / Philosophy Callout */}
      <div className="bg-white rounded-xl p-6 border border-slate-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-navy-900 tracking-tight">Slow and Steady Financial Clarity</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Week 3 Challenge
            </span>
          </div>
          <p className="text-sm text-slate-muted mt-1 max-w-2xl">
            BillSloth organizes your bills with local-first AI and tracks due dates without rushed automated payments.
            Every extraction requires human approval.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('import')}
            className="px-4 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-semibold shadow-sm inline-flex items-center gap-2 transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import Document</span>
          </button>
          <button
            onClick={() => onNavigate('digest')}
            className="px-3.5 py-2 rounded-lg border border-slate-border bg-white hover:bg-slate-50 text-navy-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <CalendarCheck2 className="w-4 h-4 text-brand-blue" />
            <span>Weekly Digest</span>
          </button>
        </div>
      </div>

      {/* Ollama Disconnected Warning Pill (if offline) */}
      {!ollamaAvailable && (
        <div className="bg-amber-warn-light/80 border border-amber-warn-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-navy-800">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-warn shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-semibold text-amber-warn">Local Ollama is offline.</span>{' '}
              Manual bill organization is fully active. You can run Ollama locally anytime to enable AI field extraction.
            </div>
          </div>
          <button
            onClick={onOpenOllamaModal}
            className="text-xs font-semibold text-amber-warn hover:underline underline-offset-2 shrink-0 self-start sm:self-auto"
          >
            View Setup Instructions →
          </button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div className="bg-white rounded-xl p-5 border border-slate-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-muted uppercase tracking-wider">Total Outstanding</span>
            <div className="p-2 rounded-lg bg-slate-light text-navy-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-navy-900 tabular-nums">
              {formatCurrency(totalOutstanding)}
            </div>
            <p className="text-xs text-slate-muted mt-1">
              Across {documents.filter((d) => (d.computed_status || d.status) !== 'paid').length} unpaid bills
            </p>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white rounded-xl p-5 border border-slate-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-red-overdue uppercase tracking-wider">Overdue</span>
            <div className="p-2 rounded-lg bg-red-overdue-light text-red-overdue">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-red-overdue tabular-nums">
              {formatCurrency(overdueTotal)}
            </div>
            <p className="text-xs text-slate-muted mt-1">
              {overdueDocs.length} bill{overdueDocs.length === 1 ? '' : 's'} require immediate attention
            </p>
          </div>
        </div>

        {/* Due Soon */}
        <div className="bg-white rounded-xl p-5 border border-slate-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-warn uppercase tracking-wider">Due Soon (7 Days)</span>
            <div className="p-2 rounded-lg bg-amber-warn-light text-amber-warn">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-navy-900 tabular-nums">
              {formatCurrency(dueSoonTotal)}
            </div>
            <p className="text-xs text-slate-muted mt-1">
              {dueSoonDocs.length} bill{dueSoonDocs.length === 1 ? '' : 's'} coming up this week
            </p>
          </div>
        </div>

        {/* Needs Review */}
        <div className="bg-white rounded-xl p-5 border border-slate-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-muted uppercase tracking-wider">Needs Review</span>
            <div className="p-2 rounded-lg bg-amber-warn-light text-amber-warn">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-navy-900 tabular-nums">
              {needsReviewDocs.length}
            </div>
            <p className="text-xs text-slate-muted mt-1">
              Unverified extractions pending human check
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Overdue Bills */}
      <section className="bg-white rounded-xl border border-slate-border shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-border flex items-center justify-between bg-red-overdue-light/30">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-red-overdue text-white">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-navy-900 text-sm">Overdue Invoices</h2>
              <p className="text-xs text-slate-muted">Bills that have passed their stated payment date</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-overdue text-white">
            {overdueDocs.length} Overdue
          </span>
        </div>

        {overdueDocs.length === 0 ? (
          <div className="p-8 text-center text-slate-muted text-xs">
            <CheckCircle2 className="w-8 h-8 text-green-paid mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-navy-900 text-sm">No Overdue Bills</p>
            <p className="mt-1">All invoices are settled or scheduled within reasonable dates.</p>
          </div>
        ) : (
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
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-navy-900">
                        {doc.vendor || 'Unknown Vendor'}
                      </span>
                      {doc.is_sample === 1 && <SampleDataBadge />}
                      <StatusBadge status="overdue" size="sm" />
                      <VerifiedBadge isVerified={doc.is_verified} size="sm" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-muted mt-1">
                      <span>Invoice: {doc.invoice_number || '—'}</span>
                      <span>•</span>
                      <span>Category: {doc.category}</span>
                      <span>•</span>
                      <span className="font-semibold text-red-overdue">
                        Due: {formatDueDate(doc.due_date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-base font-bold text-red-overdue tabular-nums">
                      {formatCurrency(doc.amount, doc.currency)}
                    </div>
                    <span className="text-[11px] text-slate-muted">{doc.currency}</span>
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
                      className="p-1.5 text-slate-muted hover:text-navy-900 rounded-lg hover:bg-slate-100"
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

      {/* Section 2: Due Soon (7-14 Days) */}
      <section className="bg-white rounded-xl border border-slate-border shadow-card overflow-hidden">
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
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-warn text-white">
            {dueSoonDocs.length} Pending
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
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-navy-900">
                        {doc.vendor || 'Unknown Vendor'}
                      </span>
                      {doc.is_sample === 1 && <SampleDataBadge />}
                      <StatusBadge status="due_soon" size="sm" />
                      <VerifiedBadge isVerified={doc.is_verified} size="sm" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-muted mt-1">
                      <span>Invoice: {doc.invoice_number || '—'}</span>
                      <span>•</span>
                      <span>Category: {doc.category}</span>
                      <span>•</span>
                      <span className="font-semibold text-amber-warn">
                        Due: {formatDueDate(doc.due_date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-base font-bold text-navy-900 tabular-nums">
                      {formatCurrency(doc.amount, doc.currency)}
                    </div>
                    <span className="text-[11px] text-slate-muted">{doc.currency}</span>
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
                      className="p-1.5 text-slate-muted hover:text-navy-900 rounded-lg hover:bg-slate-100"
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

      {/* Section 3: Needs Review */}
      <section className="bg-white rounded-xl border border-slate-border shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-border flex items-center justify-between bg-slate-light">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-navy-800 text-white">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-navy-900 text-sm">Needs Human Review</h2>
              <p className="text-xs text-slate-muted">
                Unverified AI extractions or newly imported documents requiring confirmation
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-navy-800">
            {needsReviewDocs.length} Needs Check
          </span>
        </div>

        {needsReviewDocs.length === 0 ? (
          <div className="p-8 text-center text-slate-muted text-xs">
            <CheckCircle2 className="w-8 h-8 text-green-paid mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-navy-900 text-sm">All Documents Verified</p>
            <p className="mt-1">Every imported document has been validated and confirmed by a human.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-border">
            {needsReviewDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-light/60 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-amber-warn-light text-amber-warn shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-navy-900">
                        {doc.vendor || doc.original_name}
                      </span>
                      {doc.is_sample === 1 && <SampleDataBadge />}
                      <VerifiedBadge isVerified={doc.is_verified} size="sm" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-muted mt-1">
                      <span>File: {doc.original_name}</span>
                      <span>•</span>
                      <span>Invoice: {doc.invoice_number || '<Unverified/Missing>'}</span>
                      <span>•</span>
                      <span>Due: {doc.due_date ? formatDueDate(doc.due_date) : '<Not Set>'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-base font-bold text-navy-900 tabular-nums">
                      {formatCurrency(doc.amount, doc.currency)}
                    </div>
                    <span className="text-[11px] text-slate-muted">{doc.currency}</span>
                  </div>
                  <button
                    onClick={() => onOpenReview(doc)}
                    className="px-3.5 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>Review & Verify</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 4: Paid Bills */}
      <section className="bg-white rounded-xl border border-slate-border shadow-card overflow-hidden">
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
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-paid-light text-green-paid border border-green-paid-border">
            {paidDocs.length} Paid
          </span>
        </div>

        {paidDocs.length === 0 ? (
          <div className="p-8 text-center text-slate-muted text-xs">
            <p className="font-semibold text-navy-900 text-sm">No Paid Invoices Recorded Yet</p>
            <p className="mt-1">When you settle bills, click "Mark Paid" to move them here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-border max-h-72 overflow-y-auto">
            {paidDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-light/60 transition-colors opacity-85"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-paid-light text-green-paid shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-navy-900">
                        {doc.vendor || 'Unknown Vendor'}
                      </span>
                      {doc.is_sample === 1 && <SampleDataBadge />}
                      <StatusBadge status="paid" size="sm" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-muted mt-0.5">
                      <span>Invoice: {doc.invoice_number || '—'}</span>
                      <span>•</span>
                      <span>Category: {doc.category}</span>
                      <span>•</span>
                      <span>Verified: {doc.verified_at ? format(parseISO(doc.verified_at), 'MMM d, yyyy') : 'Yes'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-paid tabular-nums">
                      {formatCurrency(doc.amount, doc.currency)}
                    </div>
                    <span className="text-[10px] text-slate-muted">Completed</span>
                  </div>
                  <button
                    onClick={() => onOpenReview(doc)}
                    className="p-1.5 text-slate-muted hover:text-navy-900 rounded-lg hover:bg-slate-100"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
