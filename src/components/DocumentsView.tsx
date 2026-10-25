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
    if (!dateStr) return <span className="text-[#A8B7CC]">No due date</span>;
    try {
      const date = parseISO(dateStr);
      const daysDiff = differenceInDays(date, new Date());
      let badgeClass = 'text-[#F8FAFC] font-medium';
      if (daysDiff < 0) badgeClass = 'text-[#FB7185] font-bold';
      else if (daysDiff <= 7) badgeClass = 'text-[#FBBF24] font-bold';

      return (
        <span className={badgeClass}>
          {format(date, 'MMM d, yyyy')}
          <span className="text-[11px] block text-[#A8B7CC] font-normal">
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

  // Status Filter Tabs with counts
  const statusTabs = [
    {
      id: 'all',
      label: 'All Bills',
      count: documents.length,
      icon: FileText,
      activeColor: 'border-[#22D3EE] text-[#22D3EE] bg-[#162238]',
    },
    {
      id: 'needs_review',
      label: 'Needs Review',
      count: documents.filter((d) => (d.computed_status || d.status) === 'needs_review' || d.is_verified === 0).length,
      icon: Eye,
      activeColor: 'border-[#FBBF24] text-[#FBBF24] bg-[#FBBF24]/10',
    },
    {
      id: 'due_soon',
      label: 'Due Soon',
      count: documents.filter((d) => (d.computed_status || d.status) === 'due_soon').length,
      icon: Clock,
      activeColor: 'border-[#22D3EE] text-[#22D3EE] bg-[#22D3EE]/10',
    },
    {
      id: 'overdue',
      label: 'Overdue',
      count: documents.filter((d) => (d.computed_status || d.status) === 'overdue').length,
      icon: AlertCircle,
      activeColor: 'border-[#FB7185] text-[#FB7185] bg-[#FB7185]/10',
    },
    {
      id: 'paid',
      label: 'Paid',
      count: documents.filter((d) => (d.computed_status || d.status) === 'paid').length,
      icon: CheckCircle2,
      activeColor: 'border-[#34D399] text-[#34D399] bg-[#34D399]/10',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-[#F8FAFC]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight">Bills & Invoices Ledger</h1>
          <p className="text-xs text-[#A8B7CC] mt-1">
            Complete on-device ledger with verified amounts, payment terms, and categories
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <a
            href={CSV_EXPORT_URL}
            download="billsloth-invoices.csv"
            className="px-3 py-2 rounded-xl border border-[#29374D] bg-[#162238] hover:bg-[#1C2B46] text-[#A8B7CC] hover:text-[#F8FAFC] text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
            title="Download complete accounting records as CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>Export CSV</span>
          </a>
          <button
            onClick={onNavigateToImport}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] text-[#0B1220] text-xs font-black shadow-md shadow-[#22D3EE]/25 inline-flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:outline-none"
          >
            <FileText className="w-4 h-4" />
            <span>Import New Bill</span>
          </button>
        </div>
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {statusTabs.map((tab) => {
          const isActive = selectedStatus === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:outline-none ${
                isActive
                  ? `${tab.activeColor} shadow-sm`
                  : 'border-[#29374D] bg-[#111D32] text-[#A8B7CC] hover:border-[#3E516D] hover:text-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold truncate">{tab.label}</span>
              </div>
              <span
                className={`text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-[#0B1220] border border-current text-current' : 'bg-[#162238] text-[#A8B7CC] border border-[#29374D]'
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
          <Search className="w-4 h-4 text-[#A8B7CC] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vendor, invoice #, notes..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-[#29374D] bg-[#111D32] text-[#F8FAFC] placeholder-[#64748B] focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] focus-visible:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-[#A8B7CC] hover:text-[#F8FAFC]"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category & Sort controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-[#A8B7CC]">
            <Filter className="w-3.5 h-3.5 text-[#22D3EE]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-[#29374D] bg-[#111D32] text-[#F8FAFC] focus:border-[#22D3EE] focus-visible:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[#111D32] text-[#F8FAFC]">
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#A8B7CC]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#22D3EE]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'due_date' | 'amount' | 'vendor')}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-[#29374D] bg-[#111D32] text-[#F8FAFC] focus:border-[#22D3EE] focus-visible:outline-none"
            >
              <option value="due_date" className="bg-[#111D32] text-[#F8FAFC]">Due Date</option>
              <option value="amount" className="bg-[#111D32] text-[#F8FAFC]">Amount</option>
              <option value="vendor" className="bg-[#111D32] text-[#F8FAFC]">Vendor</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Switch to ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              className="px-2.5 py-1.5 rounded-xl border border-[#29374D] bg-[#111D32] text-xs text-[#F8FAFC] hover:bg-[#1C2B46] font-mono focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:outline-none"
            >
              {sortOrder === 'asc' ? 'ASC' : 'DESC'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Desktop Table + Mobile Cards */}
      {filteredDocuments.length === 0 ? (
        <div className="financial-card p-12 text-center text-[#A8B7CC] text-xs">
          <AlertCircle className="w-8 h-8 text-[#22D3EE] mx-auto mb-2 opacity-80" />
          <p className="font-semibold text-[#F8FAFC] text-sm">No Bills Found</p>
          <p className="mt-1">Try adjusting your filters or import a new document.</p>
        </div>
      ) : (
        <>
          {/* 1. Mobile Cards View (sm:hidden) */}
          <div className="space-y-3 sm:hidden">
            {filteredDocuments.map((doc) => {
              const computed = doc.computed_status || doc.status;
              const vendorStyle = getVendorColor(doc.vendor || '');
              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenReview(doc)}
                  className="financial-card p-4 space-y-3 cursor-pointer active:bg-[#1C2B46] transition-colors"
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
                          <span className="font-bold text-sm text-[#F8FAFC] truncate">
                            {doc.vendor || '<Unknown Vendor>'}
                          </span>
                          {doc.is_sample === 1 && <SampleDataBadge />}
                        </div>
                        <span className="text-[11px] text-[#A8B7CC] truncate block">
                          {doc.category}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={computed} size="sm" />
                  </div>

                  {/* Middle Strip: 3-Column Financial Summary */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-[#111D32] rounded-xl border border-[#29374D] text-center">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#A8B7CC] block">Amount</span>
                      <span className="text-xs font-bold text-[#F8FAFC] font-mono tabular-nums block mt-0.5">
                        {formatCurrency(doc.amount, doc.currency)}
                      </span>
                    </div>
                    <div className="border-x border-[#29374D]">
                      <span className="text-[10px] uppercase font-semibold text-[#A8B7CC] block">Invoice #</span>
                      <span className="text-xs font-mono text-[#F8FAFC] truncate block mt-0.5" title={doc.invoice_number || '—'}>
                        {doc.invoice_number || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#A8B7CC] block">Due Date</span>
                      <span className="text-[11px] font-semibold text-[#F8FAFC] tabular-nums block mt-0.5 truncate">
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
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40 hover:bg-[#34D399] hover:text-[#0B1220]"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => onPrepareReminder(doc)}
                        aria-label="Prepare Reminder"
                        className="p-1.5 text-[#A8B7CC] hover:text-[#22D3EE] rounded-lg hover:bg-[#111D32]"
                      >
                        <BellRing className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenReview(doc)}
                        aria-label="Review Details"
                        className="p-1.5 text-[#A8B7CC] hover:text-[#F8FAFC] rounded-lg hover:bg-[#111D32]"
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
                <thead className="bg-[#111D32] text-[#A8B7CC] border-b border-[#29374D] font-semibold uppercase tracking-wider text-[11px]">
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
                <tbody className="divide-y divide-[#29374D]">
                  {filteredDocuments.map((doc) => {
                    const computed = doc.computed_status || doc.status;
                    const vendorStyle = getVendorColor(doc.vendor || '');
                    return (
                      <tr
                        key={doc.id}
                        className="hover:bg-[#1C2B46] transition-colors group cursor-pointer"
                        onClick={() => onOpenReview(doc)}
                      >
                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={computed} size="sm" />
                        </td>

                        {/* Vendor & Document */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${vendorStyle.bg} ${vendorStyle.text} ${vendorStyle.border}`}
                            >
                              {doc.vendor ? doc.vendor.charAt(0).toUpperCase() : 'B'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-[#F8FAFC] text-sm group-hover:text-[#22D3EE] transition-colors">
                                  {doc.vendor || '<Unknown Vendor>'}
                                </span>
                                {doc.is_sample === 1 && <SampleDataBadge />}
                                <ExtractionTelemetryBadge
                                  method={doc.extraction_method}
                                  ocrConfidence={doc.ocr_confidence}
                                  size="xs"
                                />
                              </div>
                              <div className="text-[11px] text-[#A8B7CC] font-mono truncate max-w-xs mt-0.5">
                                {doc.invoice_number ? `#${doc.invoice_number} • ` : ''}
                                {doc.original_name}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-[#111D32] text-[#A8B7CC] border border-[#29374D]">
                            {doc.category}
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap tabular-nums">
                          {formatDueDate(doc.due_date)}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="font-bold text-sm text-[#F8FAFC] font-mono tabular-nums">
                            {formatCurrency(doc.amount, doc.currency)}
                          </div>
                          <span className="text-[10px] text-[#A8B7CC] font-mono">{doc.currency}</span>
                        </td>

                        {/* Verified Badge */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <VerifiedBadge isVerified={doc.is_verified} size="sm" />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {computed !== 'paid' && (
                              <button
                                onClick={() => onQuickMarkPaid(doc)}
                                title="Mark as Paid"
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40 hover:bg-[#34D399] hover:text-[#0B1220] transition-colors focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:outline-none"
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              onClick={() => onPrepareReminder(doc)}
                              title="Prepare Reminder"
                              aria-label="Prepare Reminder"
                              className="p-1.5 text-[#A8B7CC] hover:text-[#22D3EE] rounded-lg hover:bg-[#111D32] focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:outline-none"
                            >
                              <BellRing className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenReview(doc)}
                              title="Review Details"
                              aria-label="Review Details"
                              className="p-1.5 text-[#A8B7CC] hover:text-[#F8FAFC] rounded-lg hover:bg-[#111D32] focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:outline-none"
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
                              className="p-1.5 text-[#A8B7CC] hover:text-[#FB7185] rounded-lg hover:bg-[#FB7185]/15 focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:outline-none"
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
