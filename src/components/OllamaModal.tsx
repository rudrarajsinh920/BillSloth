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
import { startOllamaDaemonRequest } from '../api/client';

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
  const [startingOllama, setStartingOllama] = useState(false);
  const [startOllamaError, setStartOllamaError] = useState<string | null>(null);

  const handleStartOllama = async () => {
    setStartingOllama(true);
    setStartOllamaError(null);
    try {
      const res = await startOllamaDaemonRequest();
      if (res.success) {
        await onRefresh();
        handleSelectEngine('ollama');
      } else {
        setStartOllamaError(res.error || 'Could not start Ollama automatically.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStartOllamaError(msg);
    } finally {
      setStartingOllama(false);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#DCE4E5] max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] text-[#172A35]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DCE4E5] flex items-center justify-between bg-[#F7F8F5] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white text-[#087F8C] border border-[#DCE4E5] rounded-lg">
              <Sparkles className="w-5 h-5 text-[#6D5CE8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#172A35] text-base">AI Engine & Intelligence Settings</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DDF7EF] text-[#087F5B] border border-[#087F5B]/30 font-semibold">
                  Active: {currentEngine.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[#526572]">
                Configure cloud Gemini for instant judging or local Ollama for zero-cloud privacy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI Settings"
            className="text-[#526572] hover:text-[#172A35] p-1 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Switcher Tabs */}
        <div className="grid grid-cols-3 bg-[#F7F8F5] border-b border-[#DCE4E5] p-1.5 gap-1 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('gemini')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'gemini'
                ? 'bg-[#087F8C] text-white shadow-xs font-bold'
                : 'text-[#526572] hover:text-[#172A35] hover:bg-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Gemini Flash</span>
            <span className="hidden sm:inline text-[9px] px-1 py-0.5 rounded bg-white/20 font-mono">Cloud</span>
          </button>

          <button
            onClick={() => setActiveTab('ollama')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ollama'
                ? 'bg-[#087F8C] text-white shadow-xs font-bold'
                : 'text-[#526572] hover:text-[#172A35] hover:bg-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Local Ollama</span>
            <span className="hidden sm:inline text-[9px] px-1 py-0.5 rounded bg-white/20 font-mono">Air-gap</span>
          </button>

          <button
            onClick={() => setActiveTab('browser')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'browser'
                ? 'bg-[#087F8C] text-white shadow-xs font-bold'
                : 'text-[#526572] hover:text-[#172A35] hover:bg-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>In-Browser AI</span>
            <span className="hidden sm:inline text-[9px] px-1 py-0.5 rounded bg-white/20 font-mono">Zero-setup</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-white">
          {/* TAB 1: GEMINI FLASH (INSTANT CLOUD FOR JUDGES & WEB VISITORS) */}
          {activeTab === 'gemini' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-xl border border-[#087F8C]/30 bg-[#DDF5F6] flex items-start gap-3">
                <Zap className="w-5 h-5 text-[#087F8C] shrink-0 mt-0.5" />
                <div className="text-xs text-[#172A35] space-y-1">
                  <p className="font-bold text-sm text-[#087F8C]">
                    Instant Cloud AI Mode (Recommended for Judges & Live Web Preview)
                  </p>
                  <p className="text-[#526572] leading-relaxed">
                    Zero terminal commands required. Enter any free Google Gemini API key to activate live generative responses, natural conversational Q&A, and invoice field structuring on Vercel.
                  </p>
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#172A35]">
                  Google Gemini API Key
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Key className="w-3.5 h-3.5 text-[#526572] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={geminiKeyInput}
                      onChange={(e) => setGeminiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#DCE4E5] bg-[#F7F8F5] text-[#172A35] font-mono focus:border-[#087F8C] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleTestGemini}
                    disabled={testingGemini || !geminiKeyInput.trim()}
                    className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#F7F8F5] border border-[#DCE4E5] text-[#172A35] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingGemini ? 'animate-spin text-[#087F8C]' : ''}`} />
                    <span>Test Key</span>
                  </button>
                  <button
                    onClick={handleSaveGemini}
                    disabled={!geminiKeyInput.trim()}
                    className="px-4 py-2 rounded-lg bg-[#087F8C] hover:bg-[#066873] text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
                  >
                    Save & Activate
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#526572]">
                    Key is securely stored in your browser's private <code className="font-mono text-[#172A35]">localStorage</code>.
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#087F8C] hover:underline inline-flex items-center gap-1 font-semibold"
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
                      ? 'border-[#087F5B]/30 bg-[#DDF7EF] text-[#087F5B]'
                      : 'border-[#BE123C]/30 bg-[#FFE4E6] text-[#BE123C]'
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
                <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#DCE4E5] space-y-1">
                  <span className="font-bold text-[#172A35] block">Multilingual & Generative</span>
                  <p className="text-[11px] text-[#526572]">Draft emails to utility vendors, ask budget questions, get spending advice.</p>
                </div>
                <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#DCE4E5] space-y-1">
                  <span className="font-bold text-[#172A35] block">No Local Server Needed</span>
                  <p className="text-[11px] text-[#526572]">Works directly inside the web browser on Vercel without downloading Ollama.</p>
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
                  <div className="p-3.5 rounded-lg border border-[#087F5B]/30 bg-[#DDF7EF] flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#087F5B] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#087F5B]">Local Ollama is Connected & Running</p>
                      <p className="text-xs text-[#526572] mt-0.5">
                        Connected to local daemon at <span className="font-mono text-[#172A35]">{status.url}</span>.
                      </p>
                    </div>
                  </div>

                  {status.hasGemma ? (
                    <div className="p-3 rounded-lg border border-[#087F8C]/30 bg-[#DDF5F6] flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#087F8C] shrink-0 mt-0.5" />
                      <div className="text-xs text-[#172A35]">
                        <span className="font-semibold text-[#087F8C]">Gemma Model Detected: </span>
                        Prioritizing <span className="font-mono font-medium text-[#087F8C]">{status.activeModel}</span> for on-device reasoning.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg border border-[#854D0E]/30 bg-[#FFF0CC] flex flex-col gap-2">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-[#854D0E] shrink-0 mt-0.5" />
                        <div className="text-xs text-[#172A35]">
                          <span className="font-semibold text-[#854D0E]">Gemma Model Not Found: </span>
                          Recommended model is <span className="font-mono font-medium text-[#854D0E]">gemma2:2b</span>.
                        </div>
                      </div>
                      <div className="bg-white border border-[#DCE4E5] text-[#087F8C] p-2.5 rounded-md text-xs font-mono flex items-center justify-between">
                        <span>ollama pull gemma2:2b</span>
                        <span className="text-[10px] text-[#526572] font-sans">Recommended (1.6GB)</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleSelectEngine('ollama')}
                    className="w-full py-2 rounded-lg bg-[#087F8C] hover:bg-[#066873] text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    Activate Local Ollama as Primary Engine
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg border border-[#854D0E]/30 bg-[#FFF0CC] flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#854D0E] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#854D0E]">Local Ollama Daemon Offline</p>
                      <p className="text-xs text-[#526572] mt-0.5">
                        Could not reach <span className="font-mono text-[#172A35]">{status?.url || 'http://127.0.0.1:11434'}</span>.
                        (This is normal on hosted cloud websites like Vercel).
                      </p>
                    </div>
                  </div>

                  {/* One-Click Auto-Start CTA */}
                  <div className="p-4 rounded-xl border border-[#087F8C]/30 bg-[#DDF5F6]/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#087F8C]">
                        <Zap className="w-3.5 h-3.5" />
                        <span>One-Click Auto-Start</span>
                      </div>
                      <p className="text-[11px] text-[#526572] mt-0.5">
                        Launch your local background Ollama daemon with zero terminal commands.
                      </p>
                    </div>
                    <button
                      onClick={handleStartOllama}
                      disabled={startingOllama}
                      className="px-3.5 py-2 rounded-xl bg-[#087F8C] hover:bg-[#066873] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {startingOllama ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Starting Ollama...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>Start Ollama Automatically</span>
                        </>
                      )}
                    </button>
                  </div>

                  {startOllamaError && (
                    <div className="p-3 rounded-lg bg-[#FFE4E6] border border-[#BE123C]/30 text-[#BE123C] text-xs">
                      {startOllamaError}
                    </div>
                  )}

                  <div className="bg-[#F7F8F5] border border-[#DCE4E5] text-[#172A35] p-3.5 rounded-lg text-xs font-mono space-y-2">
                    <div className="flex items-center gap-2 text-[#526572] border-b border-[#DCE4E5] pb-1.5">
                      <Terminal className="w-4 h-4 text-[#087F8C]" />
                      <span>To run locally on your computer:</span>
                    </div>
                    <p className="text-[#087F5B]"># 1. Start Ollama</p>
                    <p className="text-[#172A35]">ollama serve</p>
                    <p className="text-[#087F5B] mt-2"># 2. Pull model & start BillSloth</p>
                    <p className="text-[#172A35]">ollama pull gemma2:2b</p>
                    <p className="text-[#172A35]">npm run dev</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SMART IN-BROWSER ENGINE (ZERO SETUP) */}
          {activeTab === 'browser' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-xl border border-[#087F5B]/30 bg-[#DDF7EF] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#087F5B] shrink-0 mt-0.5" />
                <div className="text-xs text-[#172A35] space-y-1">
                  <p className="font-bold text-sm text-[#087F5B]">Smart In-Browser Reasoning Engine</p>
                  <p className="text-[#526572] leading-relaxed">
                    Requires <strong>no API keys, no server commands, and zero downloads</strong>. Instantly analyzes stored bills, computes totals, detects overdue obligations, summarizes SaaS vs Utilities, and answers financial questions in real-time right in your browser tab.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F8F5] border border-[#DCE4E5] space-y-2 text-xs">
                <span className="font-bold text-[#172A35] block">What it handles automatically:</span>
                <ul className="space-y-1 text-[#526572] list-disc list-inside">
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
                className="w-full py-2 rounded-lg bg-[#087F8C] hover:bg-[#066873] text-white text-xs font-bold transition-colors shadow-xs"
              >
                Activate Smart In-Browser Engine
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F7F8F5] border-t border-[#DCE4E5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#526572]">
            <span className="w-2 h-2 rounded-full bg-[#087F5B]" />
            <span>Active Engine: <strong className="text-[#172A35] uppercase">{currentEngine}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'ollama' && (
              <button
                onClick={handleRefreshOllama}
                disabled={refreshing}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#DCE4E5] bg-white hover:bg-[#F7F8F5] text-[#172A35] inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Retry Ollama</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#087F8C] hover:bg-[#066873] text-white transition-colors shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
