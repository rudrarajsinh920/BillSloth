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
    if (act.includes('AI') || act.includes('EXTRACT') || act.includes('INFER')) {
      return {
        category: 'ai' as EventCategory,
        label: 'Local AI Inference',
        icon: Bot,
        iconBg: 'bg-[#EDE9FE] text-[#6D5CE8] border border-[#6D5CE8]/30',
        badgeColor: 'bg-[#EDE9FE] text-[#6D5CE8] border border-[#6D5CE8]/30',
      };
    }
    if (act.includes('VERIF') || act.includes('APPROV') || act.includes('UPDATE')) {
      return {
        category: 'verification' as EventCategory,
        label: 'Human Verification',
        icon: CheckCircle2,
        iconBg: 'bg-[#DDF7EF] text-[#087F5B] border border-[#087F5B]/30',
        badgeColor: 'bg-[#DDF7EF] text-[#087F5B] border border-[#087F5B]/30',
      };
    }
    if (act.includes('REMIND')) {
      return {
        category: 'verification' as EventCategory,
        label: 'Payment Reminder',
        icon: Clock,
        iconBg: 'bg-[#FFF0CC] text-[#854D0E] border border-[#854D0E]/30',
        badgeColor: 'bg-[#FFF0CC] text-[#854D0E] border border-[#854D0E]/30',
      };
    }
    if (act.includes('UPLOAD') || act.includes('IMPORT') || act.includes('DOCUMENT')) {
      return {
        category: 'system' as EventCategory,
        label: 'Document Ledger',
        icon: FileText,
        iconBg: 'bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/30',
        badgeColor: 'bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/30',
      };
    }
    return {
      category: 'system' as EventCategory,
      label: 'Security & System',
      icon: ShieldCheck,
      iconBg: 'bg-[#F7F8F5] text-[#526572] border border-[#DCE4E5]',
      badgeColor: 'bg-[#F7F8F5] text-[#526572] border border-[#DCE4E5]',
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
    <div className="space-y-6 animate-in fade-in duration-150 text-[#172A35]">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#172A35] tracking-tight">System Audit Trail</h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/30">
              Immutable SQLite Log
            </span>
          </div>
          <p className="text-xs text-[#526572] mt-0.5">
            Cryptographic ledger tracking all local extractions, human approvals, and system state transitions
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <a
            href={SYSTEM_BACKUP_URL}
            download="billsloth-system-backup.json"
            className="px-3 py-1.5 rounded-xl border border-[#DCE4E5] bg-white hover:bg-[#F7F8F5] text-[#172A35] text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#087F8C]"
            title="Download full JSON snapshot of database and audit trail"
          >
            <Download className="w-3.5 h-3.5 text-[#526572]" />
            <span>Export Backup</span>
          </a>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl border border-[#DCE4E5] bg-white hover:bg-[#F7F8F5] text-[#172A35] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#526572] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#DCE4E5] rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-semibold text-[#526572] uppercase tracking-wider block">
              Total Logged Events
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#172A35] mt-0.5 block">
              {logs.length}
            </span>
            <span className="text-[10px] text-[#526572] block mt-0.5">
              Recorded in local <code className="text-[#087F8C] font-mono">audit_logs</code>
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/20">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#DCE4E5] rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-semibold text-[#526572] uppercase tracking-wider block">
              Local AI Inferences
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#6D5CE8] mt-0.5 block">
              {aiEventsCount}
            </span>
            <span className="text-[10px] text-[#526572] block mt-0.5">
              Gemini 3.8 & Local Ledger
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#EDE9FE] text-[#6D5CE8] border border-[#6D5CE8]/30">
            <Cpu className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#DCE4E5] rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-semibold text-[#526572] uppercase tracking-wider block">
              Human Sign-Offs
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#087F5B] mt-0.5 block">
              {verifEventsCount}
            </span>
            <span className="text-[10px] text-[#526572] block mt-0.5">
              Zero automated payment without review
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#DDF7EF] text-[#087F5B] border border-[#087F5B]/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Zero-Trust Notice */}
      <div className="bg-white border border-[#DCE4E5] rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#DDF7EF] text-[#087F5B] border border-[#087F5B]/30 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-[#172A35] block text-xs">
              Zero-Trust Audit Guarantee
            </span>
            <span className="text-[11px] text-[#526572]">
              Every document extraction, field change, status transition, and AI response is cryptographically stored on your local disk.
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-[#087F5B] bg-[#DDF7EF] border border-[#087F5B]/30 px-2.5 py-0.5 rounded-full shrink-0 hidden md:inline font-semibold">
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
                    ? 'bg-[#087F8C] text-white font-bold shadow-xs'
                    : 'bg-white border border-[#DCE4E5] text-[#526572] hover:text-[#172A35] hover:bg-[#F7F8F5]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#F7F8F5] text-[#526572] border border-[#DCE4E5]'
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
          <Search className="w-3.5 h-3.5 text-[#526572] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#DCE4E5] bg-white text-[#172A35] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#087F8C]"
          />
        </div>
      </div>

      {/* Activity Feed List */}
      <div className="bg-white border border-[#DCE4E5] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-[#526572] text-xs">
            <div className="w-6 h-6 border-2 border-[#087F8C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading audit records...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-[#526572] text-xs">
            <Activity className="w-6 h-6 text-[#94A3B8] mx-auto mb-2" />
            <p className="font-semibold text-[#172A35]">No matching audit events</p>
            <p className="text-[11px] text-[#526572] mt-0.5">
              {searchTerm ? 'Try adjusting your search filter' : 'Activity events will appear here as you interact with bills.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#DCE4E5]">
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
                  className="p-3.5 sm:p-4 hover:bg-[#F7F8F5] transition-colors flex items-start gap-3.5"
                >
                  {/* Event Icon Avatar */}
                  <div className={`p-2.5 rounded-xl shrink-0 ${meta.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Event Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#172A35] text-xs">
                          {formattedTitle}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md font-mono border ${meta.badgeColor}`}
                        >
                          {log.action}
                        </span>
                        {log.document_id && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#F7F8F5] text-[#526572] border border-[#DCE4E5]">
                            #{log.document_id}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-[#526572] shrink-0">
                        {formattedDate}
                      </span>
                    </div>

                    <p className="text-xs text-[#526572] leading-relaxed font-normal">
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
