import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Download } from 'lucide-react';
import { AuditLogItem } from '../types';
import { fetchAuditLogs, SYSTEM_BACKUP_URL } from '../api/client';
import { format, parseISO } from 'date-fns';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy-900 tracking-tight">System Audit Trail</h1>
          <p className="text-xs text-slate-muted mt-1">
            Complete, immutable log of all local actions, extractions, and human approvals
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href={SYSTEM_BACKUP_URL}
            download="billsloth-system-backup.json"
            className="px-3.5 py-2 rounded-lg border border-slate-border bg-white hover:bg-slate-50 text-navy-800 text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue"
            title="Download complete snapshot of documents, reminders, and audit trail"
          >
            <Download className="w-3.5 h-3.5 text-slate-muted" />
            <span>Export Backup</span>
          </a>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg border border-slate-border bg-white hover:bg-slate-50 text-navy-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Log</span>
          </button>
        </div>
      </div>

      <div className="financial-card p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
        <div className="text-xs text-navy-800 space-y-1">
          <p className="font-semibold text-navy-900">Zero-Trust Transparency</p>
          <p className="text-slate-muted leading-relaxed">
            Every document import, AI extraction attempt, human verification, status change, and reminder action
            is recorded in your local SQLite <code className="px-1 py-0.5 bg-slate-100 rounded text-navy-900 font-mono text-[11px]">audit_logs</code> table.
            This ensures complete auditability of your financial records without external telemetry.
          </p>
        </div>
      </div>

      <div className="financial-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-muted text-xs">
            <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading audit records...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-muted text-xs">
            No audit records logged yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-border">
            {logs.map((log) => {
              let parsedDetails = log.details;
              try {
                parsedDetails = JSON.stringify(JSON.parse(log.details), null, 2);
              } catch {
                // leave as string
              }

              return (
                <div key={log.id} className="p-4 space-y-1.5 hover:bg-slate-light/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-navy-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {log.action}
                      </span>
                      {log.document_id && (
                        <span className="text-[11px] font-mono text-slate-muted">
                          Doc: {log.document_id}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-slate-muted">
                      {format(parseISO(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-700 bg-slate-light p-2.5 rounded-lg border border-slate-border whitespace-pre-wrap overflow-x-auto max-h-32">
                    {parsedDetails}
                  </pre>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
