import React, { useState, useEffect } from 'react';
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
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg border border-green-paid-border bg-green-paid-light flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-paid shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-paid">Ollama is Connected & Ready</p>
                  <p className="text-xs text-navy-700 mt-0.5">
                    Connected to local daemon at <span className="font-mono">{status.url}</span>.
                  </p>
                </div>
              </div>

              {/* Gemma Detection Card */}
              {status.hasGemma ? (
                <div className="p-3 rounded-lg border border-brand-blue/30 bg-brand-blue-light/50 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                  <div className="text-xs text-navy-800">
                    <span className="font-semibold text-brand-blue">Gemma Model Detected: </span>
                    BillSloth will prioritize <span className="font-mono font-medium">{status.activeModel}</span> for invoice field extraction.
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-amber-warn-border bg-amber-warn-light flex flex-col gap-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-warn shrink-0 mt-0.5" />
                    <div className="text-xs text-navy-800">
                      <span className="font-semibold text-amber-warn">Gemma Model Not Found: </span>
                      BillSloth works best with open-weight Gemma 2 models. Fallback model: <span className="font-mono font-medium">{status.activeModel || 'None'}</span>.
                    </div>
                  </div>
                  <div className="bg-navy-900 text-slate-100 p-2.5 rounded-md text-xs font-mono flex items-center justify-between">
                    <span>ollama pull gemma2:2b</span>
                    <span className="text-[10px] text-slate-400 font-sans">Recommended (1.6GB)</span>
                  </div>
                </div>
              )}
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
                BillSloth strictly runs on-device. Scanned documents and receipts are extracted locally via Tesseract OCR and PDF parsers, then structured using local Gemma models. No financial figures ever leave your device.
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
                  No models installed. Run <span className="font-mono text-navy-900">ollama pull gemma2:2b</span> in your terminal.
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
                <p className="text-emerald-400 mt-2"># 2. Pull recommended Gemma model</p>
                <p>ollama pull gemma2:2b</p>
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
