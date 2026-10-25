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
import { NavTab } from './Sidebar';
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
      <div className="py-20 text-center text-[#526572] text-xs">
        <div className="w-8 h-8 border-2 border-[#087F8C] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span>Synthesizing weekly financial calm digest...</span>
      </div>
    );
  }

  if (!digest) {
    return (
      <div className="p-8 text-center text-[#BE123C] text-xs">
        Failed to load weekly digest.
      </div>
    );
  }

  const { metrics, overdueBills, dueSoonBills, needsReviewBills, pendingReminders } = digest;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150 text-[#172A35]">
      {/* Header */}
      <div className="bg-white border border-[#DCE4E5] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#172A35] tracking-tight">Weekly Financial Calm Digest</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/30">
              Slow & Steady
            </span>
          </div>
          <p className="text-xs text-[#526572] mt-1">
            Generated on {format(new Date(), 'EEEE, MMMM d, yyyy')} • 100% on-device summary
          </p>
        </div>

        <button
          onClick={handleCopyMarkdown}
          className="px-4 py-2 rounded-xl bg-[#087F8C] hover:bg-[#066873] text-white text-xs font-bold shadow-xs inline-flex items-center gap-2 transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Copied Markdown!</span>
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
        <div className="bg-white border border-[#DCE4E5] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#526572] uppercase tracking-wider block">
            Total Outstanding
          </span>
          <span className="text-xl font-bold text-[#172A35] mt-1 block tabular-nums font-mono">
            {formatCurrency(metrics.totalOutstanding)}
          </span>
        </div>

        <div className="bg-white border border-[#BE123C]/30 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#BE123C] uppercase tracking-wider block">
            Overdue Balance
          </span>
          <span className="text-xl font-bold text-[#BE123C] mt-1 block tabular-nums font-mono">
            {formatCurrency(metrics.overdueAmount)}
          </span>
        </div>

        <div className="bg-white border border-[#854D0E]/30 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#854D0E] uppercase tracking-wider block">
            Due Next 7 Days
          </span>
          <span className="text-xl font-bold text-[#854D0E] mt-1 block tabular-nums font-mono">
            {formatCurrency(metrics.dueSoonAmount)}
          </span>
        </div>

        <div className="bg-white border border-[#DCE4E5] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#526572] uppercase tracking-wider block">
            Pending Reminders
          </span>
          <span className="text-xl font-bold text-[#087F8C] mt-1 block tabular-nums font-mono">
            {metrics.pendingRemindersCount}
          </span>
        </div>
      </div>

      {/* Critical Overdue Section */}
      {overdueBills.length > 0 && (
        <div className="bg-white border border-[#BE123C]/30 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-[#FFE4E6] border-b border-[#BE123C]/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#BE123C]" />
              <h3 className="font-bold text-xs text-[#BE123C] uppercase tracking-wider">
                Critical Overdue Invoices ({overdueBills.length})
              </h3>
            </div>
            <span className="text-xs font-bold text-[#BE123C] tabular-nums font-mono">
              {formatCurrency(metrics.overdueAmount)}
            </span>
          </div>

          <div className="divide-y divide-[#DCE4E5]">
            {overdueBills.map((bill) => (
              <div
                key={bill.id}
                onClick={() => onOpenReview(bill)}
                className="p-4 flex items-center justify-between hover:bg-[#F7F8F5] transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#172A35]">{bill.vendor || 'Unknown Vendor'}</span>
                    {bill.is_sample === 1 && <SampleDataBadge />}
                  </div>
                  <span className="text-xs text-[#BE123C] font-semibold tabular-nums">
                    Due date was {bill.due_date || 'past'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-[#BE123C] tabular-nums font-mono">
                    {formatCurrency(bill.amount || 0)}
                  </div>
                  <span className="text-[11px] text-[#526572]">{bill.currency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due This Week Section */}
      <div className="bg-white border border-[#DCE4E5] rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-[#FFF0CC] border-b border-[#854D0E]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#854D0E]" />
            <h3 className="font-semibold text-xs text-[#854D0E] uppercase tracking-wider">
              Cash Flow Needs This Week ({dueSoonBills.length})
            </h3>
          </div>
          <span className="text-xs font-bold text-[#854D0E] tabular-nums font-mono">
            {formatCurrency(metrics.dueSoonAmount)}
          </span>
        </div>

        {dueSoonBills.length === 0 ? (
          <div className="p-6 text-center text-[#526572] text-xs">
            No bills scheduled for payment within the next 7 days.
          </div>
        ) : (
          <div className="divide-y divide-[#DCE4E5]">
            {dueSoonBills.map((bill) => (
              <div
                key={bill.id}
                onClick={() => onOpenReview(bill)}
                className="p-4 flex items-center justify-between hover:bg-[#F7F8F5] transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#172A35]">{bill.vendor || 'Unknown Vendor'}</span>
                    {bill.is_sample === 1 && <SampleDataBadge />}
                    <span className="text-[11px] text-[#526572] font-normal">• {bill.category}</span>
                  </div>
                  <span className="text-xs text-[#854D0E] font-medium tabular-nums">Due: {bill.due_date}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-[#172A35] font-mono tabular-nums">
                    {formatCurrency(bill.amount || 0)}
                  </div>
                  <span className="text-[11px] text-[#526572]">{bill.currency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unverified Items Needing Review */}
      {needsReviewBills.length > 0 && (
        <div className="bg-white border border-[#854D0E]/30 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-[#FFF0CC] border-b border-[#854D0E]/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#854D0E]" />
              <h3 className="font-semibold text-xs text-[#854D0E] uppercase tracking-wider">
                Unverified Bills Awaiting Validation ({needsReviewBills.length})
              </h3>
            </div>
          </div>

          <div className="p-4 divide-y divide-[#DCE4E5]">
            {needsReviewBills.map((bill) => (
              <div
                key={bill.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-xs text-[#172A35]">
                    {bill.vendor || bill.original_name}
                  </span>
                  <span className="text-xs text-[#526572] block mt-0.5">
                    File: {bill.original_name} • Amount: <span className="tabular-nums font-mono text-[#087F8C]">${bill.amount || 0}</span>
                  </span>
                </div>
                <button
                  onClick={() => onOpenReview(bill)}
                  className="px-3 py-1 rounded-lg border border-[#DCE4E5] bg-white hover:bg-[#F7F8F5] text-[#172A35] text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <span>Review</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#087F8C]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminders Awaiting Human Approval */}
      {pendingReminders.length > 0 && (
        <div className="bg-white border border-[#DCE4E5] rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-[#F7F8F5] border-b border-[#DCE4E5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-[#087F8C]" />
              <h3 className="font-semibold text-xs text-[#172A35] uppercase tracking-wider">
                Reminders Prepared For Human Approval ({pendingReminders.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('reminders')}
              className="text-xs text-[#087F8C] hover:text-[#066873] hover:underline font-semibold"
            >
              Manage Reminders →
            </button>
          </div>

          <div className="p-4 divide-y divide-[#DCE4E5]">
            {pendingReminders.map((rem) => (
              <div key={rem.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-[#172A35]">{rem.title}</span>
                  <span className="text-xs text-[#526572] block">Scheduled: {rem.reminder_date}</span>
                </div>
                <button
                  onClick={() => onNavigate('reminders')}
                  className="px-3 py-1 rounded-lg border border-[#DCE4E5] bg-white text-xs text-[#172A35] hover:bg-[#F7F8F5] transition-colors"
                >
                  Approve / Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Markdown Output Preview */}
      <div className="bg-[#F7F8F5] text-[#526572] rounded-xl p-5 border border-[#DCE4E5] shadow-xs space-y-2">
        <div className="flex items-center justify-between border-b border-[#DCE4E5] pb-2">
          <span className="text-xs font-mono font-semibold text-[#526572]">
            Exportable Markdown Digest
          </span>
          <button
            onClick={handleCopyMarkdown}
            className="text-xs text-[#087F8C] hover:text-[#066873] font-semibold transition-colors"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
        <pre className="text-xs font-mono whitespace-pre-wrap text-[#172A35] max-h-60 overflow-y-auto leading-relaxed">
          {digest.markdown_digest}
        </pre>
      </div>
    </div>
  );
};
