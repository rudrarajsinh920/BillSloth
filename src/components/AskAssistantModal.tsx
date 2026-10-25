import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, Settings2, Zap } from 'lucide-react';
import { askAiAssistant } from '../api/client';
import { getActiveAiEngine, getGeminiApiKey } from '../api/gemini';

interface AskAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  ollamaAvailable: boolean;
  onOpenOllamaModal: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  model?: string;
  timestamp: string;
}

const PRESET_QUESTIONS = [
  'What is my total outstanding balance?',
  'Which invoices are currently overdue?',
  'What bills are due within the next 7 days?',
  'How does BillSloth work?',
  'Summarize my monthly SaaS and software costs',
  'Draft an email to Metro Grid asking for an extension',
];

export const AskAssistantModal: React.FC<AskAssistantModalProps> = ({
  isOpen,
  onClose,
  ollamaAvailable,
  onOpenOllamaModal,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const engine = getActiveAiEngine();
  const hasGeminiKey = Boolean(getGeminiApiKey());

  const getWelcomeText = () => {
    if (engine === 'gemini' && hasGeminiKey) {
      return 'Hello! I am your BillSloth Assistant powered by Google Gemini 2.5 Flash. Ask me any question about your bills, spending, due dates, or ask me to draft emails to vendors. Real-time conversational AI is active!';
    }
    if (engine === 'ollama' && ollamaAvailable) {
      return 'Hello! I am your local BillSloth assistant powered by on-device Gemma 2 2B. Everything runs 100% on your local hardware with zero cloud transmission.';
    }
    return 'Hello! I am your BillSloth Assistant. Ask me anything about your bills, upcoming deadlines, categories, or how BillSloth works. You can also connect a Gemini API Key in Settings for live cloud generative chat!';
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: getWelcomeText(),
      model: engine === 'gemini' && hasGeminiKey ? 'gemini-2.5-flash' : engine === 'ollama' ? 'gemma2:2b' : 'In-Browser AI',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (userPrompt: string) => {
    const trimmed = userPrompt.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await askAiAssistant(trimmed);
      const assistantMsg: ChatMessage = {
        id: 'res-' + Date.now(),
        role: 'assistant',
        text: res.answer,
        model: res.model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        text: `Sorry, could not complete the query: ${msg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const currentEngine = getActiveAiEngine();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1220]/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-[#162238] rounded-2xl shadow-2xl border border-[#29374D] max-w-2xl w-full h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#29374D] flex items-center justify-between bg-[#111D32] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#162238] text-[#22D3EE] border border-[#29374D]">
              <Sparkles className="w-5 h-5 text-[#FBBF24]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#F8FAFC] text-base">Ask BillSloth Assistant</h3>
                {currentEngine === 'gemini' && hasGeminiKey ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30 inline-flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#22D3EE]" />
                    <span>Gemini 2.5 Flash</span>
                  </span>
                ) : currentEngine === 'ollama' && ollamaAvailable ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30">
                    Gemma 2 2B (Local)
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#818CF8]/15 text-[#818CF8] border border-[#818CF8]/30">
                    In-Browser Engine
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A8B7CC] mt-0.5">
                Financial intelligence & factual analysis over your ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenOllamaModal}
              title="Open AI Engine Settings (Switch between Gemini Flash, Ollama, and In-Browser)"
              className="p-1.5 rounded-lg border border-[#29374D] bg-[#162238] hover:bg-[#1C2B46] text-[#A8B7CC] hover:text-[#22D3EE] text-xs font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">AI Settings</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close assistant dialog"
              className="text-[#A8B7CC] hover:text-[#F8FAFC] p-1.5 rounded-lg hover:bg-[#1C2B46] transition-colors focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status notice banner */}
        {currentEngine === 'gemini' && hasGeminiKey ? (
          <div className="px-6 py-2 bg-[#22D3EE]/10 border-b border-[#29374D] flex items-center justify-between text-xs text-[#22D3EE] shrink-0">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Gemini Flash Active: Full generative answering, budgeting advice, and email drafting enabled.</span>
            </div>
          </div>
        ) : (
          <div className="px-6 py-2 bg-[#111D32] border-b border-[#29374D] flex items-center justify-between text-xs text-[#A8B7CC] shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>In-Browser Engine active. For live cloud generative chat, connect a free Gemini API key in Settings.</span>
            </div>
            <button
              onClick={onOpenOllamaModal}
              className="font-semibold text-[#22D3EE] hover:underline"
            >
              Connect Gemini →
            </button>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0B1220]">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-[#22D3EE] text-[#0B1220]'
                      : 'bg-[#111D32] border border-[#29374D] text-[#22D3EE]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[#FBBF24]" />}
                </div>

                <div className={`max-w-[80%] space-y-1 ${isUser ? 'items-end' : ''}`}>
                  <div
                    className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-[#22D3EE] text-[#0B1220] font-medium rounded-tr-none shadow-md'
                        : 'bg-[#162238] border border-[#29374D] text-[#F8FAFC] shadow-md rounded-tl-none whitespace-pre-wrap'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] text-[#A8B7CC] px-1 ${isUser ? 'justify-end' : ''}`}>
                    <span>{m.timestamp}</span>
                    {m.model && <span>• {m.model}</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#111D32] border border-[#29374D] text-[#22D3EE] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#FBBF24]" />
              </div>
              <div className="p-3.5 rounded-xl bg-[#162238] border border-[#29374D] text-xs text-[#A8B7CC] shadow-md rounded-tl-none flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-[#22D3EE] border-t-transparent rounded-full animate-spin" />
                <span>Reviewing your ledger and generating answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="px-6 py-2.5 bg-[#111D32] border-t border-[#29374D] shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[10px] font-semibold text-[#A8B7CC] uppercase tracking-wider mr-1">
              Suggested:
            </span>
            {PRESET_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="px-2.5 py-1 rounded-full border border-[#29374D] bg-[#162238] hover:bg-[#1C2B46] hover:border-[#22D3EE]/50 text-[11px] text-[#F8FAFC] transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(query);
          }}
          className="p-4 bg-[#111D32] border-t border-[#29374D] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about vendors, due dates, cash flow, or drafting payment emails..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-[#29374D] bg-[#162238] text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#22D3EE] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            aria-label="Send question"
            className="px-4 py-2.5 rounded-xl bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0B1220] text-xs font-bold shadow-md inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:outline-none"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
