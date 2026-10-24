import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  AlertCircle,
  Clock,
  Eye,
  BellRing,
  ArrowRight,
} from 'lucide-react';
import { WeeklyDigestData, DocumentItem } from '../types';
import { NavTab } from './Navbar';
import { fetchWeeklyDigest } from '../api/client';
import { SampleDataBadge } from './StatusBadge';
import { format } from 'date-fns';

interface WeeklyDigestViewProps {
  onOpenReview: (doc: DocumentItem) => void;
  onNavigate: (tab: NavTab) => void;
}

export const WeeklyDigestView: React.FC<WeeklyDigestViewProps> = ({
  onOpenReview,
  onNavigate,
}) => {
  const [digest, setDigest] = useState<WeeklyDigestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadDigest();
  }, []);

  const loadDigest = async () => {
    setLoading(true);
    try {
      const data = await fetchWeeklyDigest();
      setDigest(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!digest) return;
    navigator.clipboard.writeText(digest.markdown_digest);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-muted text-xs">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span>Synthesizing weekly financial calm digest...</span>
      </div>
    );
  }

  if (!digest) {
    return (
      <div className="p-8 text-center text-red-overdue text-xs">
        Failed to load weekly digest.
      </div>
    );
  }

  const { metrics, overdueBills, dueSoonBills, needsReviewBills, pendingReminders } = digest;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="financial-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-navy-900 tracking-tight">Weekly Financial Calm Digest</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Slow & Steady
            </span>
          </div>
          <p className="text-xs text-slate-muted mt-1">
            Generated on {format(new Date(), 'EEEE, MMMM d, yyyy')} • 100% on-device summary
          </p>
        </div>

        <button
          onClick={handleCopyMarkdown}
          className="px-4 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Copied Markdown!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Digest (Markdown)</span>
            </>
          )}
        </button>
      </div>

      {/* 4 Digest Stat Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="financial-card p-4">
          <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider block">
            Total Outstanding
          </span>
          <span className="text-xl font-bold text-navy-900 mt-1 block tabular-nums font-mono">
            {formatCurrency(metrics.totalOutstanding)}
          </span>
        </div>

        <div className="financial-card p-4">
          <span className="text-[11px] font-semibold text-red-overdue uppercase tracking-wider block">
            Overdue Balance
          </span>
          <span className="text-xl font-bold text-red-overdue mt-1 block tabular-nums font-mono">
            {formatCurrency(metrics.overdueAmount)}
          </span>
        </div>

        <div className="financial-card p-4">
          <span className="text-[11px] font-semibold text-amber-warn uppercase tracking-wider block">
            Due Next 7 Days
          </span>
          <span className="text-xl font-bold text-navy-900 mt-1 block tabular-nums font-mono">
            {formatCurrency(metrics.dueSoonAmount)}
          </span>
        </div>

        <div className="financial-card p-4">
          <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider block">
            Pending Reminders
          </span>
          <span className="text-xl font-bold text-brand-blue mt-1 block tabular-nums font-mono">
            {metrics.pendingRemindersCount}
          </span>
        </div>
      </div>

      {/* Critical Overdue Section */}
      {overdueBills.length > 0 && (
        <div className="financial-card !border-red-overdue-border overflow-hidden">
          <div className="px-5 py-3.5 bg-red-overdue-light/40 border-b border-red-overdue-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-overdue" />
              <h3 className="font-bold text-xs text-red-overdue uppercase tracking-wider">
                Critical Overdue Invoices ({overdueBills.length})
              </h3>
            </div>
            <span className="text-xs font-bold text-red-overdue tabular-nums font-mono">
              {formatCurrency(metrics.overdueAmount)}
            </span>
          </div>

          <div className="divide-y divide-slate-border">
            {overdueBills.map((bill) => (
              <div
                key={bill.id}
                onClick={() => onOpenReview(bill)}
                className="p-4 flex items-center justify-between hover:bg-slate-light/60 transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-navy-900">{bill.vendor || 'Unknown Vendor'}</span>
                    {bill.is_sample === 1 && <SampleDataBadge />}
                  </div>
                  <span className="text-xs text-red-overdue font-semibold tabular-nums">
                    Due date was {bill.due_date || 'past'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-red-overdue tabular-nums font-mono">
                    {formatCurrency(bill.amount || 0)}
                  </div>
                  <span className="text-[11px] text-slate-muted">{bill.currency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due This Week Section */}
      <div className="financial-card overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-light border-b border-slate-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-warn" />
            <h3 className="font-semibold text-xs text-navy-900 uppercase tracking-wider">
              Cash Flow Needs This Week ({dueSoonBills.length})
            </h3>
          </div>
          <span className="text-xs font-bold text-navy-900 tabular-nums font-mono">
            {formatCurrency(metrics.dueSoonAmount)}
          </span>
        </div>

        {dueSoonBills.length === 0 ? (
          <div className="p-6 text-center text-slate-muted text-xs">
            No bills scheduled for payment within the next 7 days.
          </div>
        ) : (
          <div className="divide-y divide-slate-border">
            {dueSoonBills.map((bill) => (
              <div
                key={bill.id}
                onClick={() => onOpenReview(bill)}
                className="p-4 flex items-center justify-between hover:bg-slate-light/60 transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-navy-900">{bill.vendor || 'Unknown Vendor'}</span>
                    {bill.is_sample === 1 && <SampleDataBadge />}
                    <span className="text-[11px] text-slate-muted font-normal">• {bill.category}</span>
                  </div>
                  <span className="text-xs text-amber-warn font-medium tabular-nums">Due: {bill.due_date}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-navy-900 tabular-nums font-mono">
                    {formatCurrency(bill.amount || 0)}
                  </div>
                  <span className="text-[11px] text-slate-muted">{bill.currency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unverified Items Needing Review */}
      {needsReviewBills.length > 0 && (
        <div className="financial-card overflow-hidden">
          <div className="px-5 py-3.5 bg-amber-warn-light/30 border-b border-slate-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-warn" />
              <h3 className="font-semibold text-xs text-navy-900 uppercase tracking-wider">
                Unverified Bills Awaiting Validation ({needsReviewBills.length})
              </h3>
            </div>
          </div>

          <div className="p-4 divide-y divide-slate-border">
            {needsReviewBills.map((bill) => (
              <div
                key={bill.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-xs text-navy-900">
                    {bill.vendor || bill.original_name}
                  </span>
                  <span className="text-xs text-slate-muted block mt-0.5">
                    File: {bill.original_name} • Amount: <span className="tabular-nums font-mono">${bill.amount || 0}</span>
                  </span>
                </div>
                <button
                  onClick={() => onOpenReview(bill)}
                  className="px-3 py-1 rounded-lg border border-slate-border bg-white hover:bg-slate-50 text-navy-800 text-xs font-medium inline-flex items-center gap-1"
                >
                  <span>Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminders Awaiting Human Approval */}
      {pendingReminders.length > 0 && (
        <div className="financial-card overflow-hidden">
          <div className="px-5 py-3.5 bg-brand-blue-light/40 border-b border-slate-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-brand-blue" />
              <h3 className="font-semibold text-xs text-navy-900 uppercase tracking-wider">
                Reminders Prepared For Human Approval ({pendingReminders.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('reminders')}
              className="text-xs text-brand-blue hover:underline font-semibold"
            >
              Manage Reminders →
            </button>
          </div>

          <div className="p-4 divide-y divide-slate-border">
            {pendingReminders.map((rem) => (
              <div key={rem.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-navy-900">{rem.title}</span>
                  <span className="text-xs text-slate-muted block">Scheduled: {rem.reminder_date}</span>
                </div>
                <button
                  onClick={() => onNavigate('reminders')}
                  className="px-3 py-1 rounded-lg border border-slate-border text-xs text-navy-800 hover:bg-slate-50"
                >
                  Approve / Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Markdown Output Preview */}
      <div className="bg-navy-900 text-slate-300 rounded-xl p-5 border border-navy-800 shadow-card space-y-2">
        <div className="flex items-center justify-between border-b border-navy-800 pb-2">
          <span className="text-xs font-mono font-semibold text-slate-400">
            Exportable Markdown Digest
          </span>
          <button
            onClick={handleCopyMarkdown}
            className="text-xs text-brand-blue hover:text-white font-medium transition-colors"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
        <pre className="text-xs font-mono whitespace-pre-wrap text-slate-300 max-h-60 overflow-y-auto leading-relaxed">
          {digest.markdown_digest}
        </pre>
      </div>
    </div>
  );
};
