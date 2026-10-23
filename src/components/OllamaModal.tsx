import React, { useState } from 'react';
import { ShieldCheck, Cpu, RefreshCw, X, Terminal, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { OllamaStatus } from '../types';

interface OllamaModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: OllamaStatus | null;
  onRefresh: () => Promise<void>;
}

export const OllamaModal: React.FC<OllamaModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-border max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-border flex items-center justify-between bg-slate-light">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-blue-light text-brand-blue rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-navy-900 text-base">Local AI Engine (Ollama)</h3>
              <p className="text-xs text-slate-muted">Zero-cloud local invoice & receipt parser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-muted hover:text-navy-900 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status Banner */}
          {status?.available ? (
            <div className="p-3.5 rounded-lg border border-green-paid-border bg-green-paid-light flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-paid shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-paid">Ollama is Connected & Ready</p>
                <p className="text-xs text-navy-700 mt-0.5">
                  Connected to local daemon at <span className="font-mono">{status.url}</span>.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg border border-amber-warn-border bg-amber-warn-light flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-warn shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-warn">Local Ollama Model Offline</p>
                <p className="text-xs text-navy-700 mt-0.5">
                  Could not reach local daemon at <span className="font-mono">{status?.url || 'http://127.0.0.1:11434'}</span>.
                </p>
              </div>
            </div>
          )}

          {/* Privacy Guarantee */}
          <div className="p-3 rounded-lg border border-slate-border bg-cool-bg flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
            <div className="text-xs text-navy-700 space-y-1">
              <p className="font-semibold text-navy-900">Privacy & Data Safety Guarantee</p>
              <p>
                BillSloth strictly runs open-weight models on your local hardware. No bills, financial
                figures, vendor names, or document images ever leave your device.
              </p>
            </div>
          </div>

          {/* Models list or Startup Instructions */}
          {status?.available ? (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-muted">
                Available Local Models ({status.models.length})
              </h4>
              {status.models.length > 0 ? (
                <div className="border border-slate-border rounded-lg divide-y divide-slate-border max-h-40 overflow-y-auto">
                  {status.models.map((model) => (
                    <div
                      key={model}
                      className="px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-light"
                    >
                      <span className="font-mono font-medium text-navy-900">{model}</span>
                      {status.activeModel === model && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-blue-light text-brand-blue">
                          Active Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 border border-dashed border-slate-border rounded-lg text-xs text-slate-muted text-center">
                  No models installed. Run <span className="font-mono text-navy-900">ollama pull llama3.2</span> in your terminal.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-muted">
                How to Connect Local Ollama
              </h4>
              <div className="bg-navy-900 text-slate-100 p-3.5 rounded-lg text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-slate-400 border-b border-navy-700 pb-1.5">
                  <Terminal className="w-4 h-4" />
                  <span>Terminal Command</span>
                </div>
                <p className="text-emerald-400"># 1. Start Ollama locally</p>
                <p>ollama serve</p>
                <p className="text-emerald-400 mt-2"># 2. Pull a fast local model (in another tab)</p>
                <p>ollama pull llama3.2</p>
              </div>
              <p className="text-xs text-slate-muted">
                Once Ollama is running, click <strong className="text-navy-900">Retry Connection</strong> below.
                In the meantime, you can review and organize bills manually with full functionality!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-light border-t border-slate-border flex items-center justify-between">
          <a
            href="https://ollama.com/download"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-brand-blue hover:underline inline-flex items-center gap-1 font-medium"
          >
            <span>Download Ollama</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-border bg-white hover:bg-slate-100 text-navy-800 inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Retry Connection</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-navy-900 hover:bg-navy-800 text-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
