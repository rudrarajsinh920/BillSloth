import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, Settings2, RotateCcw } from 'lucide-react';
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
  timestamp: string;
  isError?: boolean;
}

const PRESET_QUESTIONS = [
  'What is my total outstanding balance?',
  'Which bills are overdue?',
  'What is due in the next seven days?',
  'How does BillSloth work?',
  'How much do I owe for utilities?',
  'Show me bills from Metro Grid',
];

export const AskAssistantModal: React.FC<AskAssistantModalProps> = ({
  isOpen,
  onClose,
  onOpenOllamaModal,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I can help you understand your bills, upcoming deadlines, spending categories, and how BillSloth works. What would you like to know?',
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
    setLastQuery(trimmed);
    setLoading(true);

    try {
      const res = await askAiAssistant(trimmed);
      const assistantMsg: ChatMessage = {
        id: 'res-' + Date.now(),
        role: 'assistant',
        text: res.answer,
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
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastQuery) {
      handleSend(lastQuery);
    }
  };

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
              <h3 className="font-bold text-[#F8FAFC] text-base leading-tight">Ask BillSloth</h3>
              <p className="text-xs text-[#A8B7CC] mt-0.5">
                Financial intelligence & factual analysis over your ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenOllamaModal}
              title="Assistant Settings & AI Configuration"
              className="p-1.5 rounded-lg border border-[#29374D] bg-[#162238] hover:bg-[#1C2B46] text-[#A8B7CC] hover:text-[#22D3EE] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:outline-none"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
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
                        : m.isError
                        ? 'bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#FB7185] shadow-md rounded-tl-none whitespace-pre-wrap'
                        : 'bg-[#162238] border border-[#29374D] text-[#F8FAFC] shadow-md rounded-tl-none whitespace-pre-wrap'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] text-[#A8B7CC] px-1 ${isUser ? 'justify-end' : ''}`}>
                    <span>{m.timestamp}</span>
                    {m.isError && (
                      <button
                        onClick={handleRetry}
                        className="inline-flex items-center gap-0.5 text-[#22D3EE] hover:underline font-semibold ml-1"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Retry
                      </button>
                    )}
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
                <span>Checking your ledger records...</span>
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
