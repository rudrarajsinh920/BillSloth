import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Download,
  Search,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  Activity,
  Cpu,
  Lock,
} from 'lucide-react';
import { AuditLogItem } from '../types';
import { fetchAuditLogs, SYSTEM_BACKUP_URL } from '../api/client';
import { format, parseISO } from 'date-fns';

type EventCategory = 'all' | 'ai' | 'verification' | 'system';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getEventMeta = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('AI') || act.includes('OLLAMA') || act.includes('EXTRACT')) {
      return {
        category: 'ai' as EventCategory,
        label: 'Local AI Inference',
        icon: Bot,
        iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200/60',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    }
    if (act.includes('VERIF') || act.includes('APPROV') || act.includes('UPDATE')) {
      return {
        category: 'verification' as EventCategory,
        label: 'Human Verification',
        icon: CheckCircle2,
        iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (act.includes('REMIND')) {
      return {
        category: 'verification' as EventCategory,
        label: 'Payment Reminder',
        icon: Clock,
        iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    if (act.includes('UPLOAD') || act.includes('IMPORT') || act.includes('DOCUMENT')) {
      return {
        category: 'system' as EventCategory,
        label: 'Document Ledger',
        icon: FileText,
        iconBg: 'bg-blue-50 text-brand-blue border border-blue-200/60',
        badgeColor: 'bg-blue-50 text-brand-blue border-blue-200',
      };
    }
    return {
      category: 'system' as EventCategory,
      label: 'Security & System',
      icon: ShieldCheck,
      iconBg: 'bg-navy-50 text-navy-800 border border-slate-200',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  const formatEventTitle = (action: string): string => {
    const words = action.split('_');
    return words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const formatEventDetails = (detailsStr: string): string => {
    try {
      const parsed = JSON.parse(detailsStr);
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.query) return `Assistant query: "${parsed.query}"`;
        if (parsed.vendor) return `Vendor: ${parsed.vendor}${parsed.amount ? ` • $${parsed.amount}` : ''}`;
        return Object.entries(parsed)
          .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
          .join(' • ');
      }
      return String(parsed);
    } catch {
      return detailsStr;
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const meta = getEventMeta(log.action);
      if (selectedCategory !== 'all' && meta.category !== selectedCategory) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesAction = log.action.toLowerCase().includes(term);
        const matchesDetails = log.details.toLowerCase().includes(term);
        const matchesDoc = (log.document_id || '').toLowerCase().includes(term);
        if (!matchesAction && !matchesDetails && !matchesDoc) return false;
      }
      return true;
    });
  }, [logs, selectedCategory, searchTerm]);

  // Activity stats
  const aiEventsCount = logs.filter((l) => getEventMeta(l.action).category === 'ai').length;
  const verifEventsCount = logs.filter((l) => getEventMeta(l.action).category === 'verification').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-navy-900 tracking-tight">System Audit Trail</h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Immutable SQLite Log
            </span>
          </div>
          <p className="text-xs text-slate-muted mt-0.5">
            Cryptographic ledger tracking all local extractions, human approvals, and system state transitions
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <a
            href={SYSTEM_BACKUP_URL}
            download="billsloth-system-backup.json"
            className="px-3 py-1.5 rounded-lg border border-slate-border bg-white hover:bg-slate-50 text-navy-800 text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue"
            title="Download full JSON snapshot of database and audit trail"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Backup</span>
          </a>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-slate-border bg-white hover:bg-slate-50 text-navy-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Matching Reference Image 2 & 3 summary cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="financial-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider block">
              Total Logged Events
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-navy-900 mt-0.5 block">
              {logs.length}
            </span>
            <span className="text-[10px] text-slate-muted block mt-0.5">
              Recorded in local <code className="text-navy-900 font-mono">audit_logs</code>
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-navy-900 text-white">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="financial-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider block">
              Local AI Inferences
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-indigo-600 mt-0.5 block">
              {aiEventsCount}
            </span>
            <span className="text-[10px] text-slate-muted block mt-0.5">
              100% on-device Gemma 2 2B
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Cpu className="w-4 h-4" />
          </div>
        </div>

        <div className="financial-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider block">
              Human Sign-Offs
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-emerald-600 mt-0.5 block">
              {verifEventsCount}
            </span>
            <span className="text-[10px] text-slate-muted block mt-0.5">
              Zero automated payment without review
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Zero-Trust Notice (Sleek, integrated styling matching FinCore) */}
      <div className="financial-card p-3.5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-100/70 text-emerald-700 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-navy-900 block text-xs">
              Zero-Trust Audit Guarantee
            </span>
            <span className="text-[11px] text-slate-500">
              Every document extraction, field change, status transition, and AI response is cryptographically stored on your local disk.
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 hidden md:inline">
          Air-Gapped Privacy
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'All Activity', count: logs.length },
              { id: 'ai', label: 'AI Operations', count: aiEventsCount },
              { id: 'verification', label: 'Verifications', count: verifEventsCount },
              { id: 'system', label: 'System & Security', count: logs.length - aiEventsCount - verifEventsCount },
            ] as const
          ).map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-white border border-slate-border text-slate-600 hover:text-navy-900 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-border bg-white text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue"
          />
        </div>
      </div>

      {/* Activity Feed List (Matching Reference Image 2 'Recent Transactions' & Reference Image 3 'Recent Activity') */}
      <div className="financial-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-muted text-xs">
            <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading audit records...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-muted text-xs">
            <Activity className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-navy-900">No matching audit events</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {searchTerm ? 'Try adjusting your search filter' : 'Activity events will appear here as you interact with bills.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const meta = getEventMeta(log.action);
              const Icon = meta.icon;
              const formattedTitle = formatEventTitle(log.action);
              const formattedDetails = formatEventDetails(log.details);

              let formattedDate = log.timestamp;
              try {
                formattedDate = format(parseISO(log.timestamp), 'MMM d, yyyy • HH:mm:ss');
              } catch {
                // keep original
              }

              return (
                <div
                  key={log.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex items-start gap-3.5"
                >
                  {/* Event Icon Avatar */}
                  <div className={`p-2.5 rounded-xl shrink-0 ${meta.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Event Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-900 text-xs">
                          {formattedTitle}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.2 rounded-md font-mono border ${meta.badgeColor}`}
                        >
                          {log.action}
                        </span>
                        {log.document_id && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            #{log.document_id}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                        {formattedDate}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {formattedDetails}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
