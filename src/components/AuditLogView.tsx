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
        iconBg: 'bg-[#818CF8]/15 text-[#818CF8] border border-[#818CF8]/30',
        badgeColor: 'bg-[#818CF8]/15 text-[#818CF8] border border-[#818CF8]/30',
      };
    }
    if (act.includes('VERIF') || act.includes('APPROV') || act.includes('UPDATE')) {
      return {
        category: 'verification' as EventCategory,
        label: 'Human Verification',
        icon: CheckCircle2,
        iconBg: 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30',
        badgeColor: 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30',
      };
    }
    if (act.includes('REMIND')) {
      return {
        category: 'verification' as EventCategory,
        label: 'Payment Reminder',
        icon: Clock,
        iconBg: 'bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30',
        badgeColor: 'bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30',
      };
    }
    if (act.includes('UPLOAD') || act.includes('IMPORT') || act.includes('DOCUMENT')) {
      return {
        category: 'system' as EventCategory,
        label: 'Document Ledger',
        icon: FileText,
        iconBg: 'bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30',
        badgeColor: 'bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30',
      };
    }
    return {
      category: 'system' as EventCategory,
      label: 'Security & System',
      icon: ShieldCheck,
      iconBg: 'bg-[#111D32] text-[#A8B7CC] border border-[#29374D]',
      badgeColor: 'bg-[#111D32] text-[#A8B7CC] border border-[#29374D]',
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
            <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight">System Audit Trail</h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#111D32] text-[#22D3EE] border border-[#29374D]">
              Immutable SQLite Log
            </span>
          </div>
          <p className="text-xs text-[#A8B7CC] mt-0.5">
            Cryptographic ledger tracking all local extractions, human approvals, and system state transitions
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <a
            href={SYSTEM_BACKUP_URL}
            download="billsloth-system-backup.json"
            className="px-3 py-1.5 rounded-lg border border-[#29374D] bg-[#162238] hover:bg-[#1C2B46] text-[#F8FAFC] text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
            title="Download full JSON snapshot of database and audit trail"
          >
            <Download className="w-3.5 h-3.5 text-[#A8B7CC]" />
            <span>Export Backup</span>
          </a>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-[#29374D] bg-[#162238] hover:bg-[#1C2B46] text-[#F8FAFC] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#A8B7CC] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#162238] border border-[#29374D] rounded-xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-semibold text-[#A8B7CC] uppercase tracking-wider block">
              Total Logged Events
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#F8FAFC] mt-0.5 block">
              {logs.length}
            </span>
            <span className="text-[10px] text-[#A8B7CC] block mt-0.5">
              Recorded in local <code className="text-[#22D3EE] font-mono">audit_logs</code>
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#111D32] text-[#22D3EE] border border-[#29374D]">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#162238] border border-[#29374D] rounded-xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-semibold text-[#A8B7CC] uppercase tracking-wider block">
              Local AI Inferences
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#818CF8] mt-0.5 block">
              {aiEventsCount}
            </span>
            <span className="text-[10px] text-[#A8B7CC] block mt-0.5">
              100% on-device Gemma 2 2B
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#818CF8]/15 text-[#818CF8] border border-[#818CF8]/30">
            <Cpu className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#162238] border border-[#29374D] rounded-xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-semibold text-[#A8B7CC] uppercase tracking-wider block">
              Human Sign-Offs
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#34D399] mt-0.5 block">
              {verifEventsCount}
            </span>
            <span className="text-[10px] text-[#A8B7CC] block mt-0.5">
              Zero automated payment without review
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Zero-Trust Notice */}
      <div className="bg-[#162238] border border-[#29374D] rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-[#F8FAFC] block text-xs">
              Zero-Trust Audit Guarantee
            </span>
            <span className="text-[11px] text-[#A8B7CC]">
              Every document extraction, field change, status transition, and AI response is cryptographically stored on your local disk.
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-[#34D399] bg-[#34D399]/15 border border-[#34D399]/30 px-2.5 py-0.5 rounded-full shrink-0 hidden md:inline font-semibold">
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
                    ? 'bg-[#22D3EE] text-[#0B1220] font-bold shadow-md'
                    : 'bg-[#162238] border border-[#29374D] text-[#A8B7CC] hover:text-[#F8FAFC] hover:bg-[#1C2B46]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-[#0B1220]/20 text-[#0B1220]' : 'bg-[#111D32] text-[#A8B7CC] border border-[#29374D]'
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
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#29374D] bg-[#162238] text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#22D3EE]"
          />
        </div>
      </div>

      {/* Activity Feed List */}
      <div className="bg-[#162238] border border-[#29374D] rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-[#A8B7CC] text-xs">
            <div className="w-6 h-6 border-2 border-[#22D3EE] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading audit records...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-[#A8B7CC] text-xs">
            <Activity className="w-6 h-6 text-[#64748B] mx-auto mb-2" />
            <p className="font-semibold text-[#F8FAFC]">No matching audit events</p>
            <p className="text-[11px] text-[#A8B7CC] mt-0.5">
              {searchTerm ? 'Try adjusting your search filter' : 'Activity events will appear here as you interact with bills.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#29374D]">
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
                  className="p-3.5 sm:p-4 hover:bg-[#1C2B46] transition-colors flex items-start gap-3.5"
                >
                  {/* Event Icon Avatar */}
                  <div className={`p-2.5 rounded-xl shrink-0 ${meta.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Event Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F8FAFC] text-xs">
                          {formattedTitle}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.2 rounded-md font-mono border ${meta.badgeColor}`}
                        >
                          {log.action}
                        </span>
                        {log.document_id && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#111D32] text-[#A8B7CC] border border-[#29374D]">
                            #{log.document_id}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-[#A8B7CC] shrink-0">
                        {formattedDate}
                      </span>
                    </div>

                    <p className="text-xs text-[#A8B7CC] leading-relaxed font-normal">
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
