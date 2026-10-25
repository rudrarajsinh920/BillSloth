import React from 'react';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  Eye,
  ShieldAlert,
  Sparkles,
  FileText,
  Scan,
  Cpu,
} from 'lucide-react';
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
  const sizeClasses = isSm ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1 font-semibold';

  switch (status) {
    case 'overdue':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-[#FB7185]/35 bg-[#FB7185]/15 text-[#FB7185] font-semibold ${sizeClasses}`}
        >
          {showIcon && <AlertCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Overdue</span>
        </span>
      );

    case 'due_soon':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-[#FBBF24]/35 bg-[#FBBF24]/15 text-[#FBBF24] font-semibold ${sizeClasses}`}
        >
          {showIcon && <Clock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Due Soon</span>
        </span>
      );

    case 'needs_review':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-[#FBBF24]/35 bg-[#FBBF24]/15 text-[#FBBF24] font-semibold ${sizeClasses}`}
        >
          {showIcon && <Eye className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Needs Review</span>
        </span>
      );

    case 'paid':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-[#34D399]/35 bg-[#34D399]/15 text-[#34D399] font-semibold ${sizeClasses}`}
        >
          {showIcon && <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Paid</span>
        </span>
      );

    case 'approved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-[#22D3EE]/35 bg-[#22D3EE]/15 text-[#22D3EE] font-semibold ${sizeClasses}`}
        >
          {showIcon && <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Approved</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-[#29374D] bg-[#162238] text-[#A8B7CC] ${sizeClasses}`}
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
        className={`inline-flex items-center gap-1 rounded-full border border-[#34D399]/35 bg-[#34D399]/15 text-[#34D399] font-semibold ${sizeClasses}`}
      >
        <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>Verified</span>
      </span>
    );
  }

  return (
    <span
      title="Field extracted or pending human review. Treat as unverified."
      className={`inline-flex items-center gap-1 rounded-full border border-[#FBBF24]/35 bg-[#FBBF24]/15 text-[#FBBF24] font-medium ${sizeClasses}`}
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
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#111D32] text-[#A8B7CC] border border-[#29374D]"
    >
      <Sparkles className="w-2.5 h-2.5 text-[#22D3EE]" />
      <span>Sample</span>
    </span>
  );
};

export interface ExtractionTelemetryBadgeProps {
  method?: string | null;
  ocrConfidence?: number | null;
  modelUsed?: string | null;
  isGemma?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export const ExtractionTelemetryBadge: React.FC<ExtractionTelemetryBadgeProps> = ({
  method,
  ocrConfidence,
  modelUsed,
  isGemma,
  size = 'sm',
}) => {
  const isXs = size === 'xs';
  const isSm = size === 'sm';
  const sizeClasses = isXs ? 'text-[9px] px-1.5 py-0.2' : isSm ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (!method && !modelUsed) return null;

  return (
    <div className="inline-flex items-center gap-1 flex-wrap">
      {/* Method & Confidence */}
      {method === 'local_ocr' && (
        <span
          title={`Extracted locally with Tesseract OCR (Measured confidence: ${ocrConfidence || 0}%)`}
          className={`inline-flex items-center gap-1 rounded-md border border-[#29374D] bg-[#162238] text-[#A8B7CC] font-medium ${sizeClasses}`}
        >
          <Scan className={isXs ? 'w-2.5 h-2.5 text-[#22D3EE]' : 'w-3 h-3 text-[#22D3EE]'} />
          <span>Local OCR</span>
          {ocrConfidence !== null && ocrConfidence !== undefined && (
            <span className="font-mono text-[#F8FAFC] tabular-nums font-semibold">
              {ocrConfidence}%
            </span>
          )}
        </span>
      )}

      {method === 'pdf_text' && (
        <span
          title="Extracted locally from embedded PDF text stream (95% advisory confidence)"
          className={`inline-flex items-center gap-1 rounded-md border border-[#29374D] bg-[#162238] text-[#A8B7CC] font-medium ${sizeClasses}`}
        >
          <FileText className={isXs ? 'w-2.5 h-2.5 text-[#22D3EE]' : 'w-3 h-3 text-[#22D3EE]'} />
          <span>PDF Text</span>
          <span className="font-mono text-[#F8FAFC] tabular-nums">95%</span>
        </span>
      )}

      {/* Local AI Model Badge */}
      {modelUsed && (
        <span
          title={`Structured locally with ${modelUsed} on your device`}
          className={`inline-flex items-center gap-1 rounded-md border border-[#22D3EE]/35 bg-[#22D3EE]/15 text-[#22D3EE] font-medium ${sizeClasses}`}
        >
          <Cpu className={isXs ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          <span>{isGemma || /gemma/i.test(modelUsed) ? 'Gemma 2' : modelUsed}</span>
        </span>
      )}
    </div>
  );
};
