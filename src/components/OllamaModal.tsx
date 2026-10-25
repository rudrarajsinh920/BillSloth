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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1220]/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-[#162238] rounded-2xl shadow-2xl border border-[#29374D] max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#29374D] flex items-center justify-between bg-[#111D32]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[#F8FAFC] text-base">Local AI Engine (Ollama)</h3>
              <p className="text-xs text-[#A8B7CC]">Zero-cloud local invoice & receipt parser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A8B7CC] hover:text-[#F8FAFC] p-1 rounded-lg hover:bg-[#1C2B46] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status Banner */}
          {status?.available ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg border border-[#34D399]/40 bg-[#111D32] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#34D399]">Ollama is Connected & Ready</p>
                  <p className="text-xs text-[#A8B7CC] mt-0.5">
                    Connected to local daemon at <span className="font-mono text-[#F8FAFC]">{status.url}</span>.
                  </p>
                </div>
              </div>

              {/* Gemma Detection Card */}
              {status.hasGemma ? (
                <div className="p-3 rounded-lg border border-[#22D3EE]/30 bg-[#22D3EE]/10 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#22D3EE] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#F8FAFC]">
                    <span className="font-semibold text-[#22D3EE]">Gemma Model Detected: </span>
                    BillSloth will prioritize <span className="font-mono font-medium text-[#22D3EE]">{status.activeModel}</span> for invoice field extraction.
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-[#FBBF24]/40 bg-[#111D32] flex flex-col gap-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#FBBF24] shrink-0 mt-0.5" />
                    <div className="text-xs text-[#F8FAFC]">
                      <span className="font-semibold text-[#FBBF24]">Gemma Model Not Found: </span>
                      BillSloth works best with open-weight Gemma 2 models. Fallback model: <span className="font-mono font-medium text-[#FBBF24]">{status.activeModel || 'None'}</span>.
                    </div>
                  </div>
                  <div className="bg-[#0B1220] border border-[#29374D] text-[#22D3EE] p-2.5 rounded-md text-xs font-mono flex items-center justify-between">
                    <span>ollama pull gemma2:2b</span>
                    <span className="text-[10px] text-[#A8B7CC] font-sans">Recommended (1.6GB)</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-lg border border-[#FBBF24]/40 bg-[#111D32] flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#FBBF24] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#FBBF24]">Local Ollama Model Offline</p>
                <p className="text-xs text-[#A8B7CC] mt-0.5">
                  Could not reach local daemon at <span className="font-mono text-[#F8FAFC]">{status?.url || 'http://127.0.0.1:11434'}</span>.
                </p>
              </div>
            </div>
          )}

          {/* Privacy Guarantee */}
          <div className="p-3 rounded-lg border border-[#29374D] bg-[#111D32] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
            <div className="text-xs text-[#A8B7CC] space-y-1">
              <p className="font-semibold text-[#F8FAFC]">Privacy & Data Safety Guarantee</p>
              <p>
                BillSloth strictly runs on-device. Scanned documents and receipts are extracted locally via Tesseract OCR and PDF parsers, then structured using local Gemma models. No financial figures ever leave your device.
              </p>
            </div>
          </div>

          {/* Models list or Startup Instructions */}
          {status?.available ? (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A8B7CC]">
                Available Local Models ({status.models.length})
              </h4>
              {status.models.length > 0 ? (
                <div className="border border-[#29374D] rounded-lg divide-y divide-[#29374D] max-h-40 overflow-y-auto bg-[#111D32]">
                  {status.models.map((model) => (
                    <div
                      key={model}
                      className="px-3 py-2 flex items-center justify-between text-xs hover:bg-[#1C2B46]"
                    >
                      <span className="font-mono font-medium text-[#F8FAFC]">{model}</span>
                      {status.activeModel === model && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
                          Active Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 border border-dashed border-[#29374D] rounded-lg text-xs text-[#A8B7CC] text-center">
                  No models installed. Run <span className="font-mono text-[#22D3EE]">ollama pull gemma2:2b</span> in your terminal.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A8B7CC]">
                How to Connect Local Ollama
              </h4>
              <div className="bg-[#0B1220] border border-[#29374D] text-[#F8FAFC] p-3.5 rounded-lg text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-[#A8B7CC] border-b border-[#29374D] pb-1.5">
                  <Terminal className="w-4 h-4 text-[#22D3EE]" />
                  <span>Terminal Command</span>
                </div>
                <p className="text-[#34D399]"># 1. Start Ollama locally</p>
                <p className="text-[#F8FAFC]">ollama serve</p>
                <p className="text-[#34D399] mt-2"># 2. Pull recommended Gemma model</p>
                <p className="text-[#F8FAFC]">ollama pull gemma2:2b</p>
              </div>
              <p className="text-xs text-[#A8B7CC]">
                Once Ollama is running, click <strong className="text-[#F8FAFC]">Retry Connection</strong> below.
                In the meantime, you can review and organize bills manually with full functionality!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#111D32] border-t border-[#29374D] flex items-center justify-between">
          <a
            href="https://ollama.com/download"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#22D3EE] hover:text-[#38BDF8] hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <span>Download Ollama</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#29374D] bg-[#162238] hover:bg-[#1C2B46] text-[#F8FAFC] inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Retry Connection</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0B1220] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
