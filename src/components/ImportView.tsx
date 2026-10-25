import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  HardDrive,
  FileCheck,
  Copy,
} from 'lucide-react';
import { uploadDocument, UploadResponse } from '../api/client';
import { DocumentItem } from '../types';
import { ExtractionTelemetryBadge } from './StatusBadge';

interface ImportViewProps {
  onDocumentImported: (doc: DocumentItem) => void;
  onOpenReview: (doc: DocumentItem) => void;
}

export const ImportView: React.FC<ImportViewProps> = ({
  onDocumentImported,
  onOpenReview,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentUpload, setRecentUpload] = useState<DocumentItem | null>(null);
  const [recentInfo, setRecentInfo] = useState<UploadResponse['extraction_info'] | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    file: File;
    existingDoc: DocumentItem;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

  const handleFile = async (file: File, force = false) => {
    setError(null);
    setDuplicateWarning(null);

    if (!allowedTypes.includes(file.type)) {
      setError(`Unsupported file type (${file.type || 'unknown'}). Please upload a PDF, JPG, or PNG document.`);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('File exceeds 25MB maximum local limit.');
      return;
    }

    setUploading(true);
    setProgressStep('Computing SHA-256 hash and checking duplicates...');

    try {
      setTimeout(() => {
        setProgressStep('Extracting text locally (PDF text / Tesseract OCR)...');
      }, 350);

      const res = await uploadDocument(file, force);

      if (res.is_duplicate && !force) {
        setDuplicateWarning({
          file,
          existingDoc: res.data,
          message: res.message || 'Duplicate document detected.',
        });
        setUploading(false);
        setProgressStep(null);
        return;
      }

      setRecentUpload(res.data);
      setRecentInfo(res.extraction_info || null);
      onDocumentImported(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to import document: ${msg}`);
    } finally {
      setUploading(false);
      setProgressStep(null);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150 text-[#172A35]">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#172A35] tracking-tight">Import Financial Document</h1>
        <p className="text-xs text-[#526572] mt-1">
          Add invoices, utility bills, receipts, or statement scans. Saved strictly to your local storage.
        </p>
      </div>

      {/* Local Privacy Pledge Card */}
      <div className="bg-white border border-[#DCE4E5] rounded-xl p-4 flex items-start gap-4 shadow-xs">
        <div className="p-2.5 rounded-lg bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/20 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#172A35] text-sm">100% Local-First Processing Guarantee</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DDF7EF] text-[#087F5B] border border-[#087F5B]/30">
              Zero Cloud API
            </span>
          </div>
          <p className="text-[#526572] leading-relaxed">
            Your bills and invoices are never sent to external cloud AI endpoints without your consent.
            Files are retained in your local <code className="px-1.5 py-0.5 bg-[#F7F8F5] border border-[#DCE4E5] rounded text-[#087F8C] font-mono text-[11px]">./data/uploads/</code> folder.
            Text is parsed with local PDF extraction and on-device Tesseract OCR, followed by structured AI field extraction.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#087F8C] bg-[#DDF5F6]/40 scale-[1.01]'
            : 'border-[#DCE4E5] bg-white hover:border-[#087F8C]/60 hover:bg-[#F7F8F5] shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F7F8F5] text-[#087F8C] mx-auto flex items-center justify-center border border-[#DCE4E5] shadow-xs">
            {uploading ? (
              <div className="w-6 h-6 border-2 border-[#087F8C] border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-[#172A35]">
              {uploading ? (progressStep || 'Processing document locally...') : 'Drop your invoice or receipt here'}
            </h3>
            <p className="text-xs text-[#526572] mt-1">
              {uploading
                ? 'Extracting text and analyzing invoice fields on your hardware...'
                : <>or <span className="text-[#087F8C] font-semibold hover:underline">browse files</span> from your computer</>}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 text-xs text-[#526572]">
            <span className="px-2.5 py-1 rounded-md bg-[#F7F8F5] border border-[#DCE4E5] font-mono text-[11px] text-[#526572]">PDF</span>
            <span className="px-2.5 py-1 rounded-md bg-[#F7F8F5] border border-[#DCE4E5] font-mono text-[11px] text-[#526572]">JPG</span>
            <span className="px-2.5 py-1 rounded-md bg-[#F7F8F5] border border-[#DCE4E5] font-mono text-[11px] text-[#526572]">PNG</span>
            <span>• Max 25 MB • SHA-256 Verified</span>
          </div>
        </div>
      </div>

      {/* Duplicate Warning Banner */}
      {duplicateWarning && (
        <div className="p-4 rounded-xl border border-[#854D0E]/30 bg-[#FFF0CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#172A35] shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-start gap-2.5">
            <Copy className="w-5 h-5 text-[#854D0E] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#854D0E] block text-sm">Duplicate Document Detected</span>
              <p className="text-[#526572] mt-0.5">
                {duplicateWarning.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenReview(duplicateWarning.existingDoc)}
              className="px-3 py-1.5 rounded-lg bg-[#087F8C] hover:bg-[#066873] text-white font-bold shadow-xs transition-colors"
            >
              View Existing Record
            </button>
            <button
              onClick={() => handleFile(duplicateWarning.file, true)}
              className="px-3 py-1.5 rounded-lg border border-[#854D0E]/40 text-[#854D0E] hover:bg-white font-semibold transition-colors"
            >
              Re-import Anyway
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl border border-[#BE123C]/30 bg-[#FFE4E6] flex items-start gap-3 text-xs text-[#BE123C] shadow-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Import Error:</span> {error}
          </div>
        </div>
      )}

      {/* Success Banner / Immediate Review Trigger */}
      {recentUpload && (
        <div className="bg-white border border-[#087F5B]/40 rounded-xl p-5 space-y-3 shadow-xs animate-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#DDF7EF] text-[#087F5B] border border-[#087F5B]/30 shrink-0 mt-0.5">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#172A35]">{recentUpload.vendor || recentUpload.original_name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FFF0CC] text-[#854D0E] border border-[#854D0E]/30 font-semibold">
                    Needs Human Review
                  </span>
                </div>
                <p className="text-xs text-[#526572] mt-0.5">
                  File: <code className="font-mono text-[#172A35]">{recentUpload.original_name}</code> ({(recentUpload.file_size / 1024).toFixed(1)} KB)
                  {recentUpload.file_hash && ` • SHA-256: ${recentUpload.file_hash.slice(0, 10)}...`}
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenReview(recentUpload)}
              className="px-4 py-2 rounded-lg bg-[#087F8C] hover:bg-[#066873] text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-colors shrink-0"
            >
              <span>Review Invoice Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Extraction telemetry pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#DCE4E5] text-[11px]">
            <ExtractionTelemetryBadge
              method={recentUpload.extraction_method}
              ocrConfidence={recentUpload.ocr_confidence}
              modelUsed={recentInfo?.model_used}
              isGemma={recentInfo?.is_gemma}
            />
            {recentUpload.amount !== null && (
              <span className="px-2 py-0.5 rounded bg-[#DDF7EF] text-[#087F5B] border border-[#087F5B]/30 font-mono tabular-nums font-semibold">
                Extracted: ${recentUpload.amount.toFixed(2)} {recentUpload.currency}
              </span>
            )}
            {recentUpload.due_date && (
              <span className="px-2 py-0.5 rounded bg-[#FFF0CC] text-[#854D0E] border border-[#854D0E]/30 font-mono tabular-nums font-medium">
                Due: {recentUpload.due_date}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3 Safety & Architecture Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="bg-white border border-[#DCE4E5] rounded-xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#172A35]">
            <HardDrive className="w-4 h-4 text-[#087F8C]" />
            <span>Local Disk Retention</span>
          </div>
          <p className="text-xs text-[#526572] leading-relaxed">
            Per policy, your original files are never automatically deleted. SHA-256 hashing protects against accidental duplicate imports.
          </p>
        </div>

        <div className="bg-white border border-[#DCE4E5] rounded-xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#172A35]">
            <Sparkles className="w-4 h-4 text-[#087F8C]" />
            <span>AI Field Structuring</span>
          </div>
          <p className="text-xs text-[#526572] leading-relaxed">
            Invoice vendor, due date, invoice number, and amounts are automatically parsed and structured for review.
          </p>
        </div>

        <div className="bg-white border border-[#DCE4E5] rounded-xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#172A35]">
            <CheckCircle2 className="w-4 h-4 text-[#087F5B]" />
            <span>Human Approval Gate</span>
          </div>
          <p className="text-xs text-[#526572] leading-relaxed">
            All extracted amounts, dates, and vendors are tagged as unverified until you validate or edit them. No automatic payments or email dispatch.
          </p>
        </div>
      </div>
    </div>
  );
};
