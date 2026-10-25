import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Zap,
  Key,
} from 'lucide-react';
import {
  getActiveAiEngine,
  setActiveAiEngine,
  getGeminiApiKey,
  setGeminiApiKey,
  testGeminiApiKey,
  AiEngineType,
} from '../api/gemini';

export interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status?: unknown;
  onRefresh?: () => Promise<void>;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({
  isOpen,
  onClose,
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

  const handleSelectEngine = (engine: AiEngineType) => {
    setActiveAiEngine(engine);
    setActiveTab(engine);
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
                  Active: {currentEngine === 'gemini' ? 'GEMINI FLASH' : 'IN-BROWSER AI'}
                </span>
              </div>
              <p className="text-xs text-[#526572]">
                Configure cloud Gemini Flash or use instant zero-setup in-browser reasoning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI Settings"
            className="text-[#526572] hover:text-[#172A35] p-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Switcher Tabs */}
        <div className="grid grid-cols-2 bg-[#F7F8F5] border-b border-[#DCE4E5] p-1.5 gap-1 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('gemini')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'gemini'
                ? 'bg-[#087F8C] text-white shadow-xs font-bold'
                : 'text-[#526572] hover:text-[#172A35] hover:bg-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Gemini Flash</span>
            <span className="text-[9px] px-1 py-0.5 rounded bg-white/20 font-mono">Cloud</span>
          </button>

          <button
            onClick={() => setActiveTab('browser')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'browser'
                ? 'bg-[#087F8C] text-white shadow-xs font-bold'
                : 'text-[#526572] hover:text-[#172A35] hover:bg-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>In-Browser AI</span>
            <span className="text-[9px] px-1 py-0.5 rounded bg-white/20 font-mono">Zero-setup</span>
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
                <label className="block text-xs font-bold text-[#172A35] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#087F8C]" />
                    <span>Google Gemini API Key</span>
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#087F8C] hover:underline font-semibold flex items-center gap-1 normal-case text-xs"
                  >
                    <span>Get a free key at Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#DCE4E5] text-xs font-mono bg-[#F7F8F5] focus:bg-white focus:border-[#087F8C] focus:outline-none transition-colors"
                  />
                  <button
                    onClick={handleTestGemini}
                    disabled={testingGemini || !geminiKeyInput.trim()}
                    className="px-3.5 py-2.5 rounded-xl bg-[#087F8C] hover:bg-[#066873] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  >
                    {testingGemini ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Verify & Save</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#526572]">
                  Your API key is stored securely in your browser's localStorage and never transmitted to any 3rd party server.
                </p>
              </div>

              {/* Verification Feedback Banner */}
              {geminiStatus.tested && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                    geminiStatus.success
                      ? 'bg-[#DDF7EF] border-[#087F5B]/30 text-[#087F5B]'
                      : 'bg-[#FFE4E6] border-[#BE123C]/30 text-[#BE123C]'
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
                  <p className="text-[11px] text-[#526572]">Works directly inside the web browser on Vercel with zero background software.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMART IN-BROWSER ENGINE (ZERO SETUP) */}
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
                  <li>Overdue bill alerts and upcoming 7-day deadlines</li>
                  <li>Vendor obligations breakdown (Metro Grid, CloudScale, etc.)</li>
                  <li>Spending by category analysis (Utilities, Software, Rent)</li>
                  <li>Deterministic mathematical accuracy with zero hallucinations</li>
                </ul>
              </div>

              <button
                onClick={() => handleSelectEngine('browser')}
                className="w-full py-2.5 rounded-xl bg-[#087F8C] hover:bg-[#066873] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Use In-Browser AI as Primary Engine
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F7F8F5] border-t border-[#DCE4E5] flex items-center justify-between text-xs text-[#526572] shrink-0">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#087F5B]" />
            <span>BillSloth Financial Intelligence</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#DCE4E5] bg-white text-[#172A35] font-semibold hover:bg-[#F7F8F5] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiSettingsModal;
