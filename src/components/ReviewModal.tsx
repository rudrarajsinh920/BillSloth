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
} from 'lucide-react';
import { DocumentItem, BillCategory, DocumentStatus } from '../types';
import { StatusBadge, VerifiedBadge, SampleDataBadge } from './StatusBadge';
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

  useEffect(() => {
    if (documentId && isOpen) {
      loadDoc(documentId);
    } else {
      setDoc(null);
      setExtractionMsg(null);
    }
  }, [documentId, isOpen]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-border max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
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
          <button
            onClick={onClose}
            className="text-slate-muted hover:text-navy-900 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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

        {/* Scrollable Content */}
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
                        className="w-full pl-3 pr-8 py-2 text-xs rounded-lg border border-slate-border font-mono font-medium focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                      />
                    </div>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="px-2.5 py-2 text-xs rounded-lg border border-slate-border font-mono bg-white focus:border-brand-blue"
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
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-border font-mono focus:border-brand-blue"
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
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-border font-mono focus:border-brand-blue"
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
                        <span className="text-[10px] text-slate-muted font-mono shrink-0">
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

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-light border-t border-slate-border flex items-center justify-between shrink-0">
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-lg border border-red-overdue-border text-red-overdue hover:bg-red-50 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Archive Document</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-border bg-white hover:bg-slate-100 text-navy-800 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-5 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
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
