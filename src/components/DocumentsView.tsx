import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  BellRing,
  Eye,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  Download,
} from 'lucide-react';
import { DocumentItem, BillCategory } from '../types';
import { StatusBadge, VerifiedBadge, SampleDataBadge, ExtractionTelemetryBadge } from './StatusBadge';
import { getVendorColor } from './DashboardView';
import { format, parseISO, differenceInDays } from 'date-fns';
import { CSV_EXPORT_URL } from '../api/client';

interface DocumentsViewProps {
  documents: DocumentItem[];
  onOpenReview: (doc: DocumentItem) => void;
  onQuickMarkPaid: (doc: DocumentItem) => void;
  onPrepareReminder: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
  onNavigateToImport: () => void;
}

const CATEGORIES: Array<BillCategory | 'All'> = [
  'All',
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

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onOpenReview,
  onQuickMarkPaid,
  onPrepareReminder,
  onDeleteDocument,
  onNavigateToImport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'due_date' | 'amount' | 'vendor'>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter & Sort
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        const computed = doc.computed_status || doc.status;

        // Status Filter
        if (selectedStatus !== 'all') {
          if (selectedStatus === 'needs_review' && doc.is_verified === 0) {
            // Include unverified items
          } else if (computed !== selectedStatus) {
            return false;
          }
        }

        // Category Filter
        if (selectedCategory !== 'All' && doc.category !== selectedCategory) {
          return false;
        }

        // Search Filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchesVendor = (doc.vendor || '').toLowerCase().includes(term);
          const matchesInvoice = (doc.invoice_number || '').toLowerCase().includes(term);
          const matchesName = (doc.original_name || '').toLowerCase().includes(term);
          const matchesNotes = (doc.notes || '').toLowerCase().includes(term);
          if (!matchesVendor && !matchesInvoice && !matchesName && !matchesNotes) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'due_date') {
          const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          diff = dateA - dateB;
        } else if (sortBy === 'amount') {
          diff = (a.amount || 0) - (b.amount || 0);
        } else if (sortBy === 'vendor') {
          diff = (a.vendor || '').localeCompare(b.vendor || '');
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [documents, selectedStatus, selectedCategory, searchTerm, sortBy, sortOrder]);

  const formatCurrency = (val: number | null, curr = 'USD') => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(val);
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return <span className="text-slate-400">No due date</span>;
    try {
      const date = parseISO(dateStr);
      const daysDiff = differenceInDays(date, new Date());
      let badgeClass = 'text-navy-800 font-medium';
      if (daysDiff < 0) badgeClass = 'text-red-overdue font-bold';
      else if (daysDiff <= 7) badgeClass = 'text-amber-warn font-bold';

      return (
        <span className={badgeClass}>
          {format(date, 'MMM d, yyyy')}
          <span className="text-[11px] block text-slate-muted font-normal">
            {daysDiff < 0
              ? `${Math.abs(daysDiff)}d overdue`
              : daysDiff === 0
              ? 'Today'
              : `In ${daysDiff}d`}
          </span>
        </span>
      );
    } catch {
      return dateStr;
    }
  };

  // Status Filter Tabs with counts (Inspired by Reference Image 1 top bar)
  const statusTabs = [
    {
      id: 'all',
      label: 'All Bills',
      count: documents.length,
      icon: FileText,
      activeColor: 'border-navy-900 text-navy-900 bg-slate-100',
    },
    {
      id: 'needs_review',
      label: 'Needs Review',
      count: documents.filter((d) => (d.computed_status || d.status) === 'needs_review' || d.is_verified === 0).length,
      icon: Eye,
      activeColor: 'border-amber-warn text-amber-warn bg-amber-warn-light/40',
    },
    {
      id: 'due_soon',
      label: 'Due Soon',
      count: documents.filter((d) => (d.computed_status || d.status) === 'due_soon').length,
      icon: Clock,
      activeColor: 'border-brand-blue text-brand-blue bg-blue-50',
    },
    {
      id: 'overdue',
      label: 'Overdue',
      count: documents.filter((d) => (d.computed_status || d.status) === 'overdue').length,
      icon: AlertCircle,
      activeColor: 'border-red-overdue text-red-overdue bg-red-overdue-light/40',
    },
    {
      id: 'paid',
      label: 'Paid',
      count: documents.filter((d) => (d.computed_status || d.status) === 'paid').length,
      icon: CheckCircle2,
      activeColor: 'border-green-paid text-green-paid bg-green-paid-light/40',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy-900 tracking-tight">Bills & Invoices Ledger</h1>
          <p className="text-xs text-slate-muted mt-1">
            Complete on-device ledger with verified amounts, payment terms, and categories
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <a
            href={CSV_EXPORT_URL}
            download="billsloth-invoices.csv"
            className="px-3 py-2 rounded-lg border border-slate-border bg-white hover:bg-slate-50 text-navy-800 text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue"
            title="Download complete accounting records as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-muted" />
            <span>Export CSV</span>
          </a>
          <button
            onClick={onNavigateToImport}
            className="px-4 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
          >
            <FileText className="w-4 h-4" />
            <span>Import New Bill</span>
          </button>
        </div>
      </div>

      {/* Status Filter Cards / Pills (Inspired by Reference Image 1 top counters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {statusTabs.map((tab) => {
          const isActive = selectedStatus === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none ${
                isActive
                  ? `${tab.activeColor} border-current shadow-sm`
                  : 'border-slate-border bg-white text-slate-muted hover:border-slate-300 hover:text-navy-900'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold truncate">{tab.label}</span>
              </div>
              <span
                className={`text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white shadow-xs text-navy-900' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar & Search */}
      <div className="financial-card p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vendor, invoice #, notes..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-border focus:border-brand-blue focus:ring-1 focus:ring-brand-blue focus-visible:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-navy-900"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category & Sort controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-muted">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-border bg-white text-navy-800 focus:border-brand-blue focus-visible:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-muted">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'due_date' | 'amount' | 'vendor')}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-border bg-white text-navy-800 focus:border-brand-blue focus-visible:outline-none"
            >
              <option value="due_date">Due Date</option>
              <option value="amount">Amount</option>
              <option value="vendor">Vendor</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Switch to ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              className="px-2 py-1.5 rounded-lg border border-slate-border text-xs text-navy-800 hover:bg-slate-50 font-mono focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
            >
              {sortOrder === 'asc' ? 'ASC' : 'DESC'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Desktop Table + Mobile Cards */}
      {filteredDocuments.length === 0 ? (
        <div className="financial-card p-12 text-center text-slate-muted text-xs">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="font-semibold text-navy-900 text-sm">No Bills Found</p>
          <p className="mt-1">Try adjusting your filters or import a new document.</p>
        </div>
      ) : (
        <>
          {/* 1. Mobile Cards View (sm:hidden) — Inspired by Reference Image 1 Mobile Invoice Cards */}
          <div className="space-y-3 sm:hidden">
            {filteredDocuments.map((doc) => {
              const computed = doc.computed_status || doc.status;
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenReview(doc)}
                  className="financial-card p-4 space-y-3 cursor-pointer active:bg-slate-light/60 transition-colors"
                >
                  {/* Top line: Avatar + Vendor + Status badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                      >
                        {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-navy-900 truncate">
                            {doc.vendor || '<Unknown Vendor>'}
                          </span>
                          {doc.is_sample === 1 && <SampleDataBadge />}
                        </div>
                        <span className="text-[11px] text-slate-muted truncate block">
                          {doc.category}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={computed} size="sm" />
                  </div>

                  {/* Middle Strip: 3-Column Financial Summary (Inspired by Reference Image 1) */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-light rounded-lg border border-slate-border text-center">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Amount</span>
                      <span className="text-xs font-bold text-navy-900 font-mono tabular-nums block mt-0.5">
                        {formatCurrency(doc.amount, doc.currency)}
                      </span>
                    </div>
                    <div className="border-x border-slate-200">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Invoice #</span>
                      <span className="text-xs font-mono text-navy-900 truncate block mt-0.5" title={doc.invoice_number || '—'}>
                        {doc.invoice_number || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Due Date</span>
                      <span className="text-[11px] font-semibold text-navy-900 tabular-nums block mt-0.5 truncate">
                        {doc.due_date || 'No Date'}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry & Action Bar */}
                  <div
                    className="flex items-center justify-between pt-1 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      <ExtractionTelemetryBadge
                        method={doc.extraction_method}
                        ocrConfidence={doc.ocr_confidence}
                        size="xs"
                      />
                      <VerifiedBadge isVerified={doc.is_verified} size="sm" />
                    </div>

                    <div className="flex items-center gap-1">
                      {computed !== 'paid' && (
                        <button
                          onClick={() => onQuickMarkPaid(doc)}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-green-paid-light text-green-paid border border-green-paid-border hover:bg-green-paid hover:text-white"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => onPrepareReminder(doc)}
                        aria-label="Prepare Reminder"
                        className="p-1.5 text-slate-muted hover:text-brand-blue rounded hover:bg-slate-100"
                      >
                        <BellRing className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenReview(doc)}
                        aria-label="Review Details"
                        className="p-1.5 text-slate-muted hover:text-navy-900 rounded hover:bg-slate-100"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Desktop High-Density Table View (hidden sm:block) */}
          <div className="financial-card overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-light text-slate-muted border-b border-slate-border font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Vendor & Document</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Verified</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-border">
                  {filteredDocuments.map((doc) => {
                    const computed = doc.computed_status || doc.status;
                    const vendorStyle = getVendorColor(doc.vendor || '');
                    return (
                      <tr
                        key={doc.id}
                        className="hover:bg-slate-light/60 transition-colors group cursor-pointer"
                        onClick={() => onOpenReview(doc)}
                      >
                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusBadge status={computed} size="sm" />
                        </td>

                        {/* Vendor & Document */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                            >
                              {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-navy-900 text-sm">
                                  {doc.vendor || '<Unknown Vendor>'}
                                </span>
                                {doc.is_sample === 1 && <SampleDataBadge />}
                                <ExtractionTelemetryBadge
                                  method={doc.extraction_method}
                                  ocrConfidence={doc.ocr_confidence}
                                  size="xs"
                                />
                              </div>
                              <div className="text-[11px] text-slate-muted font-mono truncate max-w-xs mt-0.5">
                                {doc.invoice_number ? `#${doc.invoice_number} • ` : ''}
                                {doc.original_name}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                            {doc.category}
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="py-3 px-4 whitespace-nowrap tabular-nums">
                          {formatDueDate(doc.due_date)}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="font-bold text-sm text-navy-900 font-mono tabular-nums">
                            {formatCurrency(doc.amount, doc.currency)}
                          </div>
                          <span className="text-[10px] text-slate-muted font-mono">{doc.currency}</span>
                        </td>

                        {/* Verified Badge */}
                        <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <VerifiedBadge isVerified={doc.is_verified} size="sm" />
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {computed !== 'paid' && (
                              <button
                                onClick={() => onQuickMarkPaid(doc)}
                                title="Mark as Paid"
                                className="px-2.5 py-1 rounded text-[11px] font-semibold bg-green-paid-light text-green-paid border border-green-paid-border hover:bg-green-paid hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              onClick={() => onPrepareReminder(doc)}
                              title="Prepare Reminder"
                              aria-label="Prepare Reminder"
                              className="p-1 text-slate-muted hover:text-brand-blue rounded hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
                            >
                              <BellRing className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenReview(doc)}
                              title="Review Details"
                              aria-label="Review Details"
                              className="p-1 text-slate-muted hover:text-navy-900 rounded hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                const confirmDelete = window.confirm(
                                  'Remove this document record? Original file will be preserved in local storage.'
                                );
                                if (confirmDelete) onDeleteDocument(doc.id);
                              }}
                              title="Archive Record"
                              aria-label="Archive Record"
                              className="p-1 text-slate-muted hover:text-red-overdue rounded hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
