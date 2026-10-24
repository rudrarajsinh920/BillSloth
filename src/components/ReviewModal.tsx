import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Save,
  Trash2,
  FileText,
  ShieldCheck,
  History,
  Sparkles,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { DocumentItem, BillCategory, DocumentStatus } from '../types';
import { StatusBadge, VerifiedBadge, SampleDataBadge, ExtractionTelemetryBadge } from './StatusBadge';
import { updateDocument, deleteDocument, extractDocumentFields, fetchDocumentById } from '../api/client';
import { format, parseISO } from 'date-fns';

interface ReviewModalProps {
  documentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDocumentUpdated: (doc: DocumentItem) => void;
  onDocumentDeleted: (id: string) => void;
  ollamaAvailable: boolean;
  onOpenOllamaModal: () => void;
}

const CATEGORIES: BillCategory[] = [
  'Utilities',
  'Software/SaaS',
  'Rent/Lease',
  'Telecom',
  'Insurance',
  'Supplies',
  'Professional Services',
  'Taxes',
  'Other',
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF'];

export const ReviewModal: React.FC<ReviewModalProps> = ({
  documentId,
  isOpen,
  onClose,
  onDocumentUpdated,
  onDocumentDeleted,
  ollamaAvailable,
  onOpenOllamaModal,
}) => {
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractionMsg, setExtractionMsg] = useState<{ type: 'success' | 'warn' | 'error'; text: string } | null>(null);

  // Form State
  const [vendor, setVendor] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<BillCategory>('Other');
  const [status, setStatus] = useState<DocumentStatus>('needs_review');
  const [isVerified, setIsVerified] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [rawText, setRawText] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (documentId && isOpen) {
      loadDoc(documentId);
    } else {
      setDoc(null);
      setExtractionMsg(null);
    }
  }, [documentId, isOpen]);

  // Keyboard accessibility: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadDoc = async (id: string) => {
    setLoading(true);
    setExtractionMsg(null);
    try {
      const data = await fetchDocumentById(id);
      setDoc(data);
      setVendor(data.vendor || '');
      setInvoiceNumber(data.invoice_number || '');
      setAmount(data.amount !== null && data.amount !== undefined ? String(data.amount) : '');
      setCurrency(data.currency || 'USD');
      setIssueDate(data.issue_date || '');
      setDueDate(data.due_date || '');
      setCategory(data.category || 'Other');
      setStatus(data.status || 'needs_review');
      setIsVerified(data.is_verified === 1);
      setPaymentReference(data.payment_reference || '');
      setNotes(data.notes || '');
      setRawText(data.raw_text || '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExtractionMsg({ type: 'error', text: `Failed to load document: ${msg}` });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !documentId) return null;

  const handleSave = async () => {
    if (!doc) return;
    setSaving(true);
    setExtractionMsg(null);
    try {
      const updated = await updateDocument(doc.id, {
        vendor: vendor.trim() || null,
        invoice_number: invoiceNumber.trim() || null,
        amount: amount.trim() ? parseFloat(amount) : null,
        currency,
        issue_date: issueDate || null,
        due_date: dueDate || null,
        category,
        status,
        is_verified: isVerified ? 1 : 0,
        payment_reference: paymentReference.trim() || null,
        notes: notes.trim() || null,
      });

      setDoc(updated);
      onDocumentUpdated(updated);
      setExtractionMsg({
        type: 'success',
        text: 'Invoice details saved and logged to audit trail.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExtractionMsg({ type: 'error', text: `Save failed: ${msg}` });
    } finally {
      setSaving(false);
    }
  };

  const handleExtractWithOllama = async () => {
    if (!doc) return;
    setExtracting(true);
    setExtractionMsg(null);

    try {
      const res = await extractDocumentFields(doc.id, rawText || undefined);
      if (!res.success) {
        if (res.reason === 'OLLAMA_OFFLINE') {
          setExtractionMsg({
            type: 'warn',
            text: 'Ollama is offline. Automatic AI extraction is paused. Review and edit fields manually, or start Ollama locally.',
          });
        } else {
          setExtractionMsg({
            type: 'error',
            text: res.message || 'Extraction failed.',
          });
        }
        return;
      }

      if (res.data) {
        await loadDoc(doc.id);
        onDocumentUpdated(res.data);
        setExtractionMsg({
          type: 'success',
          text: 'Fields extracted locally with Ollama. Review them below and check "Verify" once confirmed.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExtractionMsg({ type: 'error', text: `Extraction failed: ${msg}` });
    } finally {
      setExtracting(false);
    }
  };

  const handleDelete = async () => {
    if (!doc) return;
    const confirmDelete = window.confirm(
      'Are you sure you want to remove this document record? The original file will be safely preserved in local storage per data safety policy.'
    );
    if (!confirmDelete) return;

    try {
      await deleteDocument(doc.id);
      onDocumentDeleted(doc.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Error deleting record: ${msg}`);
    }
  };

  // Determine which fields are unverified
  const unverifiedList: string[] = [];
  if (!isVerified) {
    if (vendor) unverifiedList.push('Vendor');
    if (invoiceNumber) unverifiedList.push('Invoice #');
    if (amount) unverifiedList.push('Amount');
    if (dueDate) unverifiedList.push('Due Date');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-border w-full max-h-[94vh] flex flex-col overflow-hidden transition-all duration-200 ${
          showPreview ? 'max-w-6xl' : 'max-w-3xl'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-border flex items-center justify-between bg-slate-light shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-navy-900 text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-navy-900 text-base">
                  {vendor || doc?.original_name || 'Invoice Details Review'}
                </h2>
                {doc?.is_sample === 1 && <SampleDataBadge />}
                <StatusBadge status={status} size="sm" />
                <VerifiedBadge isVerified={isVerified} size="sm" />
              </div>
              <p className="text-xs text-slate-muted mt-0.5">
                File: <span className="font-mono text-navy-800">{doc?.original_name}</span> • ID: {doc?.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showPreview
                  ? 'border-brand-blue bg-brand-blue-light text-brand-blue hover:bg-brand-blue/10'
                  : 'border-slate-border bg-white text-navy-800 hover:bg-slate-100'
              }`}
              title={showPreview ? 'Hide document preview' : 'View original document side-by-side'}
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{showPreview ? 'Hide Preview' : 'Side-by-Side'}</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close review dialog"
              className="text-slate-muted hover:text-navy-900 p-1.5 rounded-lg hover:bg-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status / Message Banner */}
        {extractionMsg && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center gap-2 border-b shrink-0 ${
              extractionMsg.type === 'success'
                ? 'bg-green-paid-light text-green-paid border-green-paid-border'
                : extractionMsg.type === 'warn'
                ? 'bg-amber-warn-light text-amber-warn border-amber-warn-border'
                : 'bg-red-overdue-light text-red-overdue border-red-overdue-border'
            }`}
          >
            {extractionMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span className="font-medium">{extractionMsg.text}</span>
          </div>
        )}

        {/* Main Content Area: Side-by-Side Split or Single Column */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Left Column: Original Document Viewer */}
          {showPreview && (
            <div className="lg:w-1/2 flex flex-col bg-slate-100/70 border-b lg:border-b-0 lg:border-r border-slate-border p-4 overflow-hidden shrink-0 min-h-[320px] lg:min-h-0">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-navy-900">
                  <FileText className="w-4 h-4 text-brand-blue" />
                  <span className="truncate max-w-[220px]" title={doc?.original_name}>
                    {doc?.original_name || 'Original Document'}
                  </span>
                </div>
                {doc?.filename ? (
                  <a
                    href={`/uploads/${doc.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue hover:text-brand-blue-hover hover:underline inline-flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <span>Open In New Window</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                    Local Only
                  </span>
                )}
              </div>

              {/* Document Rendering */}
              {doc?.filename && doc.filename.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={`/uploads/${doc.filename}#toolbar=0`}
                  className="w-full flex-1 rounded-xl border border-slate-200 bg-white shadow-inner"
                  title="PDF Document Preview"
                />
              ) : doc?.filename && doc.filename.toLowerCase().match(/\.(png|jpg|jpeg|webp)$/) ? (
                <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-slate-200/50 rounded-xl border border-slate-200">
                  <img
                    src={`/uploads/${doc.filename}`}
                    alt={doc.original_name}
                    className="max-w-full max-h-[560px] object-contain rounded shadow-sm"
                  />
                </div>
              ) : (
                <div className="flex-1 p-4 bg-white rounded-xl border border-slate-200 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-3 font-mono text-xs">
                    <div className="border-b pb-2">
                      <h4 className="font-bold text-navy-900 text-sm">{doc?.vendor || 'Simulated Document'}</h4>
                      <p className="text-[11px] text-slate-500">Invoice: {doc?.invoice_number || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs whitespace-pre-wrap leading-relaxed text-slate-700">
                      {doc?.raw_text || 'No text extracted for preview.'}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 text-center pt-3 border-t">
                    Illustrative document representation stored in local database.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right Column: Editable Invoice Review Form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-muted text-xs">
              <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Loading invoice details...</span>
            </div>
          ) : (
            <>
              {/* Human-in-the-loop verification prompt */}
              {!isVerified && (
                <div className="p-4 rounded-xl border border-amber-warn-border bg-amber-warn-light/40 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-warn shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-amber-warn uppercase tracking-wider">
                        Unverified Financial Data
                      </h4>
                      <p className="text-xs text-navy-800 mt-0.5">
                        Extracted values must be verified by a human before automated scheduling or archiving.
                        {unverifiedList.length > 0 && (
                          <span className="block mt-1 font-medium text-slate-700">
                            Current unverified fields: {unverifiedList.join(', ')}.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-lg border border-amber-warn-border shadow-sm shrink-0">
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={(e) => {
                        setIsVerified(e.target.checked);
                        if (e.target.checked && status === 'needs_review') {
                          setStatus('due_soon'); // or approved
                        }
                      }}
                      className="w-4 h-4 text-brand-blue rounded border-slate-border focus:ring-brand-blue"
                    />
                    <span className="text-xs font-bold text-navy-900">Mark as Verified</span>
                  </label>
                </div>
              )}

              {/* Highlight Amount & Terms Box (Inspired by Reference Image 1 Details View) */}
              <div className="financial-card p-4 bg-navy-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                    Billed Amount
                  </span>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white mt-0.5">
                    {amount ? `${currency} ${parseFloat(amount || '0').toFixed(2)}` : '<Amount Not Extracted>'}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs border-t sm:border-t-0 sm:border-l border-navy-700 pt-2 sm:pt-0 sm:pl-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Payment Due</span>
                    <span className="font-semibold text-slate-100 tabular-nums">
                      {dueDate || 'None specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Status</span>
                    <span className="font-semibold text-emerald-400 capitalize">
                      {isVerified ? 'Human Verified' : status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Extraction Telemetry & Validation Flags */}
              {doc && (
                <div className="p-3.5 rounded-xl border border-slate-border bg-slate-light text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy-900 text-xs">Extraction Telemetry:</span>
                      {(() => {
                        let modelUsed: string | null = null;
                        if (doc.extraction_metadata) {
                          try {
                            const meta = JSON.parse(doc.extraction_metadata);
                            modelUsed = meta.modelUsed || meta.model || null;
                          } catch {
                            modelUsed = null;
                          }
                        }
                        return (
                          <ExtractionTelemetryBadge
                            method={doc.extraction_method}
                            ocrConfidence={doc.ocr_confidence}
                            modelUsed={modelUsed}
                          />
                        );
                      })()}
                    </div>
                    {doc.file_hash && (
                      <span className="text-[10px] font-mono tabular-nums text-slate-muted truncate max-w-xs" title={`SHA-256: ${doc.file_hash}`}>
                        SHA-256: {doc.file_hash.slice(0, 16)}...
                      </span>
                    )}
                  </div>

                  {(() => {
                    let flags: string[] = [];
                    try {
                      if (doc.validation_flags) flags = JSON.parse(doc.validation_flags);
                    } catch {
                      flags = [];
                    }
                    if (flags.length === 0) return null;
                    return (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200">
                        <span className="text-[11px] font-semibold text-amber-warn flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Validation Flags:</span>
                        </span>
                        {flags.map((flag) => (
                          <span
                            key={flag}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-warn-light text-amber-warn border border-amber-warn-border"
                          >
                            {flag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vendor */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-navy-900">Vendor / Payee</label>
                    {!isVerified && vendor && (
                      <span className="text-[10px] text-amber-warn font-medium">Unverified</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="e.g. Metro Grid Power, CloudScale Systems"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-border focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                  />
                </div>

                {/* Invoice Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-navy-900">Invoice / Bill #</label>
                    {!invoiceNumber ? (
                      <span className="text-[10px] text-slate-muted italic">Missing / Not found</span>
                    ) : (
                      !isVerified && <span className="text-[10px] text-amber-warn font-medium">Unverified</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-2026-901"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-border focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                  />
                </div>

                {/* Amount & Currency */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-navy-900">Amount & Currency</label>
                    {!amount && <span className="text-[10px] text-red-overdue font-medium">Missing Amount</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-3 pr-8 py-2 text-xs rounded-lg border border-slate-border font-mono tabular-nums font-medium focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                      />
                    </div>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="px-2.5 py-2 text-xs rounded-lg border border-slate-border font-mono tabular-nums bg-white focus:border-brand-blue"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BillCategory)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-border bg-white focus:border-brand-blue"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Issue Date */}
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-border font-mono tabular-nums focus:border-brand-blue"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-navy-900">Payment Due Date</label>
                    {!dueDate && <span className="text-[10px] text-amber-warn font-medium">No Due Date</span>}
                  </div>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-border font-mono tabular-nums focus:border-brand-blue"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Workflow Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-border bg-white focus:border-brand-blue"
                  >
                    <option value="needs_review">Needs Review (Unverified)</option>
                    <option value="due_soon">Due Soon (Pending Payment)</option>
                    <option value="overdue">Overdue (Immediate Action)</option>
                    <option value="approved">Approved (Ready for Settlement)</option>
                    <option value="paid">Paid (Archived)</option>
                  </select>
                </div>

                {/* Payment Reference */}
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">
                    Payment Method / Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. Card ending 4108, ACH confirmation"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-border focus:border-brand-blue"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
                  Private Notes & Instructions
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Deductible for tax year 2026, autopay disabled."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-border focus:border-brand-blue"
                />
              </div>

              {/* Local AI Extraction & Raw Document Text Drawer */}
              <div className="border border-slate-border rounded-xl p-4 bg-slate-light/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-navy-900">
                    <Cpu className="w-4 h-4 text-brand-blue" />
                    <span>Local Document Text & Ollama Extraction</span>
                  </div>
                  <button
                    onClick={handleExtractWithOllama}
                    disabled={extracting}
                    className="px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {extracting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-warn" />
                    )}
                    <span>Run Local AI Extraction</span>
                  </button>
                </div>

                {!ollamaAvailable && (
                  <p className="text-xs text-amber-warn flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Ollama is currently offline. You can edit the text or values manually, or{' '}
                      <button onClick={onOpenOllamaModal} className="underline font-semibold">
                        connect Ollama
                      </button>
                      . AI will not be falsely simulated.
                    </span>
                  </p>
                )}

                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={3}
                  placeholder="Extracted or pasted invoice text (OCR transcript). Edit or paste text to test local extraction."
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-border bg-white focus:border-brand-blue"
                />
              </div>

              {/* Audit Log for this Document */}
              {doc?.audit_logs && doc.audit_logs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-muted uppercase tracking-wider">
                    <History className="w-3.5 h-3.5" />
                    <span>Document Audit Trail ({doc.audit_logs.length})</span>
                  </div>
                  <div className="border border-slate-border rounded-lg divide-y divide-slate-border max-h-36 overflow-y-auto text-xs bg-white">
                    {doc.audit_logs.map((log) => (
                      <div key={log.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-navy-900">{log.action}</span>
                          <span className="text-[11px] text-slate-muted block truncate max-w-md">
                            {log.details}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-muted font-mono tabular-nums shrink-0">
                          {format(parseISO(log.timestamp), 'MMM d, HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-light border-t border-slate-border flex items-center justify-between shrink-0">
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-lg border border-red-overdue-border text-red-overdue hover:bg-red-50 text-xs font-medium inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-red-overdue focus-visible:outline-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Archive Document</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-border bg-white hover:bg-slate-100 text-navy-800 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-5 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save & Confirm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
