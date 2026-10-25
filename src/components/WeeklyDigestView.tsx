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
      <div className="bg-[#162238] border border-[#29374D] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight">Weekly Financial Calm Digest</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
              Slow & Steady
            </span>
          </div>
          <p className="text-xs text-[#A8B7CC] mt-1">
            Generated on {format(new Date(), 'EEEE, MMMM d, yyyy')} • 100% on-device summary
          </p>
        </div>

        <button
          onClick={handleCopyMarkdown}
          className="px-4 py-2 rounded-lg bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0B1220] text-xs font-bold shadow-md inline-flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-[#0B1220]" />
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
        <div className="bg-[#162238] border border-[#29374D] rounded-xl p-4 shadow-lg">
          <span className="text-[11px] font-semibold text-[#A8B7CC] uppercase tracking-wider block">
            Total Outstanding
          </span>
          <span className="text-xl font-bold text-[#F8FAFC] mt-1 block tabular-nums font-mono">
            {formatCurrency(metrics.totalOutstanding)}
          </span>
        </div>

        <div className="bg-[#162238] border border-[#FB7185]/40 rounded-xl p-4 shadow-lg">
          <span className="text-[11px] font-semibold text-[#FB7185] uppercase tracking-wider block">
            Overdue Balance
          </span>
          <span className="text-xl font-bold text-[#FB7185] mt-1 block tabular-nums font-mono">
            {formatCurrency(metrics.overdueAmount)}
          </span>
        </div>

        <div className="bg-[#162238] border border-[#29374D] rounded-xl p-4 shadow-lg">
          <span className="text-[11px] font-semibold text-[#FBBF24] uppercase tracking-wider block">
            Due Next 7 Days
          </span>
          <span className="text-xl font-bold text-[#FBBF24] mt-1 block tabular-nums font-mono">
            {formatCurrency(metrics.dueSoonAmount)}
          </span>
        </div>

        <div className="bg-[#162238] border border-[#29374D] rounded-xl p-4 shadow-lg">
          <span className="text-[11px] font-semibold text-[#A8B7CC] uppercase tracking-wider block">
            Pending Reminders
          </span>
          <span className="text-xl font-bold text-[#22D3EE] mt-1 block tabular-nums font-mono">
            {metrics.pendingRemindersCount}
          </span>
        </div>
      </div>

      {/* Critical Overdue Section */}
      {overdueBills.length > 0 && (
        <div className="bg-[#162238] border border-[#FB7185]/40 rounded-xl overflow-hidden shadow-lg">
          <div className="px-5 py-3.5 bg-[#111D32] border-b border-[#FB7185]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#FB7185]" />
              <h3 className="font-bold text-xs text-[#FB7185] uppercase tracking-wider">
                Critical Overdue Invoices ({overdueBills.length})
              </h3>
            </div>
            <span className="text-xs font-bold text-[#FB7185] tabular-nums font-mono">
              {formatCurrency(metrics.overdueAmount)}
            </span>
          </div>

          <div className="divide-y divide-[#29374D]">
            {overdueBills.map((bill) => (
              <div
                key={bill.id}
                onClick={() => onOpenReview(bill)}
                className="p-4 flex items-center justify-between hover:bg-[#1C2B46] transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#F8FAFC]">{bill.vendor || 'Unknown Vendor'}</span>
                    {bill.is_sample === 1 && <SampleDataBadge />}
                  </div>
                  <span className="text-xs text-[#FB7185] font-semibold tabular-nums">
                    Due date was {bill.due_date || 'past'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-[#FB7185] tabular-nums font-mono">
                    {formatCurrency(bill.amount || 0)}
                  </div>
                  <span className="text-[11px] text-[#A8B7CC]">{bill.currency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due This Week Section */}
      <div className="bg-[#162238] border border-[#29374D] rounded-xl overflow-hidden shadow-lg">
        <div className="px-5 py-3.5 bg-[#111D32] border-b border-[#29374D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FBBF24]" />
            <h3 className="font-semibold text-xs text-[#F8FAFC] uppercase tracking-wider">
              Cash Flow Needs This Week ({dueSoonBills.length})
            </h3>
          </div>
          <span className="text-xs font-bold text-[#F8FAFC] tabular-nums font-mono">
            {formatCurrency(metrics.dueSoonAmount)}
          </span>
        </div>

        {dueSoonBills.length === 0 ? (
          <div className="p-6 text-center text-[#A8B7CC] text-xs">
            No bills scheduled for payment within the next 7 days.
          </div>
        ) : (
          <div className="divide-y divide-[#29374D]">
            {dueSoonBills.map((bill) => (
              <div
                key={bill.id}
                onClick={() => onOpenReview(bill)}
                className="p-4 flex items-center justify-between hover:bg-[#1C2B46] transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#F8FAFC]">{bill.vendor || 'Unknown Vendor'}</span>
                    {bill.is_sample === 1 && <SampleDataBadge />}
                    <span className="text-[11px] text-[#A8B7CC] font-normal">• {bill.category}</span>
                  </div>
                  <span className="text-xs text-[#FBBF24] font-medium tabular-nums">Due: {bill.due_date}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-[#F8FAFC] tabular-nums font-mono">
                    {formatCurrency(bill.amount || 0)}
                  </div>
                  <span className="text-[11px] text-[#A8B7CC]">{bill.currency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unverified Items Needing Review */}
      {needsReviewBills.length > 0 && (
        <div className="bg-[#162238] border border-[#FBBF24]/40 rounded-xl overflow-hidden shadow-lg">
          <div className="px-5 py-3.5 bg-[#111D32] border-b border-[#29374D] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#FBBF24]" />
              <h3 className="font-semibold text-xs text-[#FBBF24] uppercase tracking-wider">
                Unverified Bills Awaiting Validation ({needsReviewBills.length})
              </h3>
            </div>
          </div>

          <div className="p-4 divide-y divide-[#29374D]">
            {needsReviewBills.map((bill) => (
              <div
                key={bill.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-xs text-[#F8FAFC]">
                    {bill.vendor || bill.original_name}
                  </span>
                  <span className="text-xs text-[#A8B7CC] block mt-0.5">
                    File: {bill.original_name} • Amount: <span className="tabular-nums font-mono text-[#22D3EE]">${bill.amount || 0}</span>
                  </span>
                </div>
                <button
                  onClick={() => onOpenReview(bill)}
                  className="px-3 py-1 rounded-lg border border-[#29374D] bg-[#111D32] hover:bg-[#1C2B46] text-[#F8FAFC] text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <span>Review</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#22D3EE]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminders Awaiting Human Approval */}
      {pendingReminders.length > 0 && (
        <div className="bg-[#162238] border border-[#29374D] rounded-xl overflow-hidden shadow-lg">
          <div className="px-5 py-3.5 bg-[#111D32] border-b border-[#29374D] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-[#22D3EE]" />
              <h3 className="font-semibold text-xs text-[#F8FAFC] uppercase tracking-wider">
                Reminders Prepared For Human Approval ({pendingReminders.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('reminders')}
              className="text-xs text-[#22D3EE] hover:underline font-semibold"
            >
              Manage Reminders →
            </button>
          </div>

          <div className="p-4 divide-y divide-[#29374D]">
            {pendingReminders.map((rem) => (
              <div key={rem.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-[#F8FAFC]">{rem.title}</span>
                  <span className="text-xs text-[#A8B7CC] block">Scheduled: {rem.reminder_date}</span>
                </div>
                <button
                  onClick={() => onNavigate('reminders')}
                  className="px-3 py-1 rounded-lg border border-[#29374D] bg-[#111D32] text-xs text-[#F8FAFC] hover:bg-[#1C2B46] transition-colors"
                >
                  Approve / Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Markdown Output Preview */}
      <div className="bg-[#111D32] text-[#A8B7CC] rounded-xl p-5 border border-[#29374D] shadow-lg space-y-2">
        <div className="flex items-center justify-between border-b border-[#29374D] pb-2">
          <span className="text-xs font-mono font-semibold text-[#A8B7CC]">
            Exportable Markdown Digest
          </span>
          <button
            onClick={handleCopyMarkdown}
            className="text-xs text-[#22D3EE] hover:text-[#38BDF8] font-semibold transition-colors"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
        <pre className="text-xs font-mono whitespace-pre-wrap text-[#A8B7CC] max-h-60 overflow-y-auto leading-relaxed">
          {digest.markdown_digest}
        </pre>
      </div>
    </div>
  );
};
