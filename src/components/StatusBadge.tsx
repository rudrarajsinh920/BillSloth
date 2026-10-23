import React from 'react';
import { AlertCircle, Clock, CheckCircle2, Eye, ShieldAlert, Sparkles } from 'lucide-react';
import { DocumentStatus } from '../types';

interface StatusBadgeProps {
  status: DocumentStatus | string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1 font-medium';

  switch (status) {
    case 'overdue':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-red-overdue-border bg-red-overdue-light text-red-overdue font-semibold ${sizeClasses}`}
        >
          {showIcon && <AlertCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Overdue</span>
        </span>
      );

    case 'due_soon':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-amber-warn-border bg-amber-warn-light text-amber-warn font-semibold ${sizeClasses}`}
        >
          {showIcon && <Clock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Due Soon</span>
        </span>
      );

    case 'needs_review':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-amber-warn-border bg-amber-warn-light text-amber-warn font-semibold ${sizeClasses}`}
        >
          {showIcon && <Eye className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Needs Review</span>
        </span>
      );

    case 'paid':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-green-paid-border bg-green-paid-light text-green-paid font-semibold ${sizeClasses}`}
        >
          {showIcon && <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Paid</span>
        </span>
      );

    case 'approved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-brand-blue-light text-brand-blue font-semibold ${sizeClasses}`}
        >
          {showIcon && <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Approved</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-slate-border bg-slate-light text-navy-700 ${sizeClasses}`}
        >
          <span>{status}</span>
        </span>
      );
  }
};

export const VerifiedBadge: React.FC<{ isVerified: boolean | number; size?: 'sm' | 'md' }> = ({
  isVerified,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (isVerified) {
    return (
      <span
        title="Human verified and approved"
        className={`inline-flex items-center gap-1 rounded-full border border-green-paid-border bg-green-paid-light text-green-paid font-medium ${sizeClasses}`}
      >
        <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>Verified</span>
      </span>
    );
  }

  return (
    <span
      title="Field extracted or pending human review. Treat as unverified."
      className={`inline-flex items-center gap-1 rounded-full border border-amber-warn-border bg-amber-warn-light text-amber-warn font-medium ${sizeClasses}`}
    >
      <ShieldAlert className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>Unverified</span>
    </span>
  );
};

export const SampleDataBadge: React.FC = () => {
  return (
    <span
      title="This is illustrative sample data for evaluation. You can clear or edit it anytime."
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-200 text-slate-700 border border-slate-300"
    >
      <Sparkles className="w-2.5 h-2.5 text-slate-500" />
      <span>Sample</span>
    </span>
  );
};
