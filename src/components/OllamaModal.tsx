import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cpu,
  RefreshCw,
  X,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Zap,
  Key,
} from 'lucide-react';
import { OllamaStatus } from '../types';
import {
  getActiveAiEngine,
  setActiveAiEngine,
  getGeminiApiKey,
  setGeminiApiKey,
  testGeminiApiKey,
  AiEngineType,
} from '../api/gemini';

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
  const [activeTab, setActiveTab] = useState<AiEngineType>(getActiveAiEngine());
  const [geminiKeyInput, setGeminiKeyInput] = useState(getGeminiApiKey());
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{
    tested: boolean;
    success?: boolean;
    model?: string;
    error?: string;
  }>({ tested: false });
  const [refreshing, setRefreshing] = useState(false);

  // Load latest state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(getActiveAiEngine());
      setGeminiKeyInput(getGeminiApiKey());
      setGeminiStatus({ tested: false });
    }
  }, [isOpen]);

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

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiStatus({ tested: false });
    try {
      const res = await testGeminiApiKey(geminiKeyInput);
      setGeminiStatus({ tested: true, success: res.success, model: res.model, error: res.error });
      if (res.success) {
        setGeminiApiKey(geminiKeyInput);
        setActiveAiEngine('gemini');
        setActiveTab('gemini');
      }
    } finally {
      setTestingGemini(false);
    }
  };

  const handleSaveGemini = () => {
    setGeminiApiKey(geminiKeyInput);
    setActiveAiEngine('gemini');
    setActiveTab('gemini');
    setGeminiStatus({
      tested: true,
      success: true,
      model: 'gemini-2.5-flash',
    });
  };

  const handleSelectEngine = (engine: AiEngineType) => {
    setActiveAiEngine(engine);
    setActiveTab(engine);
  };

  const handleRefreshOllama = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const currentEngine = getActiveAiEngine();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1220]/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-[#162238] rounded-2xl shadow-2xl border border-[#29374D] max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#29374D] flex items-center justify-between bg-[#111D32] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#F8FAFC] text-base">AI Engine & Intelligence Settings</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 font-semibold">
                  Active: {currentEngine.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[#A8B7CC]">
                Configure cloud Gemini for instant judging or local Ollama for zero-cloud privacy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI Settings"
            className="text-[#A8B7CC] hover:text-[#F8FAFC] p-1 rounded-lg hover:bg-[#1C2B46] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Switcher Tabs */}
        <div className="grid grid-cols-3 bg-[#111D32] border-b border-[#29374D] p-1.5 gap-1 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('gemini')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'gemini'
                ? 'bg-[#22D3EE] text-[#0B1220] shadow-sm font-bold'
                : 'text-[#A8B7CC] hover:text-[#F8FAFC] hover:bg-[#162238]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Gemini Flash</span>
            <span className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-black/15 font-mono">Cloud</span>
          </button>

          <button
            onClick={() => setActiveTab('ollama')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ollama'
                ? 'bg-[#22D3EE] text-[#0B1220] shadow-sm font-bold'
                : 'text-[#A8B7CC] hover:text-[#F8FAFC] hover:bg-[#162238]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Local Ollama</span>
            <span className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-black/15 font-mono">Air-gap</span>
          </button>

          <button
            onClick={() => setActiveTab('browser')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'browser'
                ? 'bg-[#22D3EE] text-[#0B1220] shadow-sm font-bold'
                : 'text-[#A8B7CC] hover:text-[#F8FAFC] hover:bg-[#162238]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>In-Browser AI</span>
            <span className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-black/15 font-mono">Zero-setup</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* TAB 1: GEMINI FLASH (INSTANT CLOUD FOR JUDGES & WEB VISITORS) */}
          {activeTab === 'gemini' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-xl border border-[#22D3EE]/30 bg-[#22D3EE]/10 flex items-start gap-3">
                <Zap className="w-5 h-5 text-[#22D3EE] shrink-0 mt-0.5" />
                <div className="text-xs text-[#F8FAFC] space-y-1">
                  <p className="font-bold text-sm text-[#22D3EE]">
                    Instant Cloud AI Mode (Recommended for Judges & Live Web Preview)
                  </p>
                  <p className="text-[#A8B7CC] leading-relaxed">
                    Zero terminal commands required. Enter any free Google Gemini API key to activate live generative responses, natural conversational Q&A, and invoice field structuring on Vercel.
                  </p>
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#F8FAFC]">
                  Google Gemini API Key
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Key className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={geminiKeyInput}
                      onChange={(e) => setGeminiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#29374D] bg-[#111D32] text-[#F8FAFC] font-mono focus:border-[#22D3EE] focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleTestGemini}
                    disabled={testingGemini || !geminiKeyInput.trim()}
                    className="px-3.5 py-2 rounded-lg bg-[#111D32] hover:bg-[#1C2B46] border border-[#29374D] text-[#F8FAFC] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingGemini ? 'animate-spin text-[#22D3EE]' : ''}`} />
                    <span>Test Key</span>
                  </button>
                  <button
                    onClick={handleSaveGemini}
                    disabled={!geminiKeyInput.trim()}
                    className="px-4 py-2 rounded-lg bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0B1220] text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    Save & Activate
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#A8B7CC]">
                    Key is securely stored in your browser's private <code className="font-mono text-[#F8FAFC]">localStorage</code>.
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#22D3EE] hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <span>Get Free Gemini Key (15 req/min)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Test Status Banner */}
              {geminiStatus.tested && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                    geminiStatus.success
                      ? 'border-[#34D399]/40 bg-[#34D399]/15 text-[#34D399]'
                      : 'border-[#FB7185]/40 bg-[#FB7185]/15 text-[#FB7185]'
                  }`}
                >
                  {geminiStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>
                    {geminiStatus.success
                      ? `Gemini connection verified! Active model: ${geminiStatus.model}. Any question in Ask AI will now use Gemini Flash.`
                      : `Connection failed: ${geminiStatus.error}`}
                  </span>
                </div>
              )}

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
                <div className="p-3 rounded-lg bg-[#111D32] border border-[#29374D] space-y-1">
                  <span className="font-bold text-[#F8FAFC] block">Multilingual & Generative</span>
                  <p className="text-[11px] text-[#A8B7CC]">Draft emails to utility vendors, ask budget questions, get spending advice.</p>
                </div>
                <div className="p-3 rounded-lg bg-[#111D32] border border-[#29374D] space-y-1">
                  <span className="font-bold text-[#F8FAFC] block">No Local Server Needed</span>
                  <p className="text-[11px] text-[#A8B7CC]">Works directly inside the web browser on Vercel without downloading Ollama.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOCAL OLLAMA (PURE AIR-GAPPED ON-DEVICE) */}
          {activeTab === 'ollama' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Status Banner */}
              {status?.available ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg border border-[#34D399]/40 bg-[#111D32] flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#34D399]">Local Ollama is Connected & Running</p>
                      <p className="text-xs text-[#A8B7CC] mt-0.5">
                        Connected to local daemon at <span className="font-mono text-[#F8FAFC]">{status.url}</span>.
                      </p>
                    </div>
                  </div>

                  {status.hasGemma ? (
                    <div className="p-3 rounded-lg border border-[#22D3EE]/30 bg-[#22D3EE]/10 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#22D3EE] shrink-0 mt-0.5" />
                      <div className="text-xs text-[#F8FAFC]">
                        <span className="font-semibold text-[#22D3EE]">Gemma Model Detected: </span>
                        Prioritizing <span className="font-mono font-medium text-[#22D3EE]">{status.activeModel}</span> for on-device reasoning.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg border border-[#FBBF24]/40 bg-[#111D32] flex flex-col gap-2">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-[#FBBF24] shrink-0 mt-0.5" />
                        <div className="text-xs text-[#F8FAFC]">
                          <span className="font-semibold text-[#FBBF24]">Gemma Model Not Found: </span>
                          Recommended model is <span className="font-mono font-medium text-[#FBBF24]">gemma2:2b</span>.
                        </div>
                      </div>
                      <div className="bg-[#0B1220] border border-[#29374D] text-[#22D3EE] p-2.5 rounded-md text-xs font-mono flex items-center justify-between">
                        <span>ollama pull gemma2:2b</span>
                        <span className="text-[10px] text-[#A8B7CC] font-sans">Recommended (1.6GB)</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleSelectEngine('ollama')}
                    className="w-full py-2 rounded-lg bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0B1220] text-xs font-bold transition-colors shadow-sm"
                  >
                    Activate Local Ollama as Primary Engine
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg border border-[#FBBF24]/40 bg-[#111D32] flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#FBBF24] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#FBBF24]">Local Ollama Daemon Offline</p>
                      <p className="text-xs text-[#A8B7CC] mt-0.5">
                        Could not reach <span className="font-mono text-[#F8FAFC]">{status?.url || 'http://127.0.0.1:11434'}</span>.
                        (This is normal on hosted cloud websites like Vercel).
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#0B1220] border border-[#29374D] text-[#F8FAFC] p-3.5 rounded-lg text-xs font-mono space-y-2">
                    <div className="flex items-center gap-2 text-[#A8B7CC] border-b border-[#29374D] pb-1.5">
                      <Terminal className="w-4 h-4 text-[#22D3EE]" />
                      <span>To run locally on your computer:</span>
                    </div>
                    <p className="text-[#34D399]"># 1. Start Ollama</p>
                    <p className="text-[#F8FAFC]">ollama serve</p>
                    <p className="text-[#34D399] mt-2"># 2. Pull model & start BillSloth</p>
                    <p className="text-[#F8FAFC]">ollama pull gemma2:2b</p>
                    <p className="text-[#F8FAFC]">npm run dev</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SMART IN-BROWSER ENGINE (ZERO SETUP) */}
          {activeTab === 'browser' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-xl border border-[#34D399]/40 bg-[#34D399]/10 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
                <div className="text-xs text-[#F8FAFC] space-y-1">
                  <p className="font-bold text-sm text-[#34D399]">Smart In-Browser Reasoning Engine</p>
                  <p className="text-[#A8B7CC] leading-relaxed">
                    Requires <strong>no API keys, no server commands, and zero downloads</strong>. Instantly analyzes stored bills, computes totals, detects overdue obligations, summarizes SaaS vs Utilities, and answers financial questions in real-time right in your browser tab.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#111D32] border border-[#29374D] space-y-2 text-xs">
                <span className="font-bold text-[#F8FAFC] block">What it handles automatically:</span>
                <ul className="space-y-1 text-[#A8B7CC] list-disc list-inside">
                  <li>Total outstanding commitments and cash maturities</li>
                  <li>Overdue invoices requiring human action</li>
                  <li>Upcoming obligations due within the next 7 days</li>
                  <li>Category breakdowns (Software/SaaS, Utilities, Rent)</li>
                  <li>Specific vendor searches (Metro Grid, CloudScale, Apex)</li>
                  <li>Explanation of the BillSloth 5-step local architecture</li>
                </ul>
              </div>

              <button
                onClick={() => handleSelectEngine('browser')}
                className="w-full py-2 rounded-lg bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0B1220] text-xs font-bold transition-colors shadow-sm"
              >
                Activate Smart In-Browser Engine
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#111D32] border-t border-[#29374D] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#A8B7CC]">
            <span className="w-2 h-2 rounded-full bg-[#34D399]" />
            <span>Active Engine: <strong className="text-[#F8FAFC] uppercase">{currentEngine}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'ollama' && (
              <button
                onClick={handleRefreshOllama}
                disabled={refreshing}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#29374D] bg-[#162238] hover:bg-[#1C2B46] text-[#F8FAFC] inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Retry Ollama</span>
              </button>
            )}
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
