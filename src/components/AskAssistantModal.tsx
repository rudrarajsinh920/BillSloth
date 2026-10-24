import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, AlertTriangle } from 'lucide-react';
import { askAiAssistant } from '../api/client';

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
  'Summarize my monthly SaaS and software costs',
  'Which bills are still unverified by a human?',
];

export const AskAssistantModal: React.FC<AskAssistantModalProps> = ({
  isOpen,
  onClose,
  ollamaAvailable,
  onOpenOllamaModal,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your local BillSloth assistant powered by Gemma 2 2B. Ask me anything about your recorded bills, due dates, vendors, or cash flow obligations. Everything runs 100% on your device.',
      model: 'gemma2:2b',
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
        model: res.model || 'gemma2:2b',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-border max-w-2xl w-full h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-border flex items-center justify-between bg-slate-light shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-navy-900 text-white">
              <Sparkles className="w-5 h-5 text-amber-warn" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-navy-900 text-base">Ask BillSloth Assistant</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-brand-blue border border-blue-200">
                  Gemma 2 2B
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-paid-light text-green-paid border border-green-paid-border">
                  100% Local
                </span>
              </div>
              <p className="text-xs text-slate-muted mt-0.5">
                Zero-cloud natural language Q&A over your financial ledger
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close assistant dialog"
            className="text-slate-muted hover:text-navy-900 p-1.5 rounded-lg hover:bg-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline notice if Ollama is not running */}
        {!ollamaAvailable && (
          <div className="px-6 py-2.5 bg-amber-warn-light border-b border-amber-warn-border flex items-center justify-between text-xs text-amber-warn shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Ollama is currently offline. Start Ollama locally to enable answers.</span>
            </div>
            <button
              onClick={onOpenOllamaModal}
              className="font-bold underline hover:text-amber-800"
            >
              Setup Instructions
            </button>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-cool-bg/40">
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
                      ? 'bg-brand-blue text-white'
                      : 'bg-navy-900 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-amber-warn" />}
                </div>

                <div className={`max-w-[80%] space-y-1 ${isUser ? 'items-end' : ''}`}>
                  <div
                    className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-brand-blue text-white rounded-tr-none'
                        : 'bg-white border border-slate-border text-navy-900 shadow-sm rounded-tl-none whitespace-pre-wrap'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] text-slate-400 px-1 ${isUser ? 'justify-end' : ''}`}>
                    <span>{m.timestamp}</span>
                    {m.model && <span>• {m.model}</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-navy-900 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-amber-warn" />
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-border text-xs text-slate-500 shadow-sm rounded-tl-none flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                <span>Gemma 2 2B is reviewing your ledger factually on-device...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="px-6 py-2.5 bg-white border-t border-slate-border shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Suggested:
            </span>
            {PRESET_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="px-2.5 py-1 rounded-full border border-slate-border bg-slate-50 hover:bg-slate-100 text-[11px] text-navy-800 transition-colors disabled:opacity-50"
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
          className="p-4 bg-white border-t border-slate-border flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about vendors, due dates, cash flow, or spending..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-border focus:border-brand-blue focus:ring-1 focus:ring-brand-blue focus-visible:outline-none"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            aria-label="Send question"
            className="px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
