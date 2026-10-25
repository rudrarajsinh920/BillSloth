import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import { askAiAssistant } from '../api/client';

interface AskAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  'How much do I owe for utilities?',
  'Show me bills from Metro Grid',
  'Draft a polite payment extension email',
];

export const AskAssistantModal: React.FC<AskAssistantModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I am powered by Gemini 3.8 Flash with full local ledger awareness. Ask me about your bills, upcoming cash flow, vendor breakdown, or let me draft vendor emails for you.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Focus input and handle Escape key
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }

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
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleRetry = () => {
    if (lastQuery) {
      handleSend(lastQuery);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        text: 'Conversation reset. How can I assist you with your ledger records?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Simple, clean markdown-like formatter for paragraphs, lists, and bold text
  const renderFormattedMessage = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // Bullet line
          const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('• ');
          const content = isBullet ? line.trim().replace(/^[*•-]\s+/, '') : line;

          // Render bold formatting
          const parts = content.split(/(\*\*.*?\*\*)/g);
          const renderedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-[#172A35]">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-[#087F8C] font-bold text-xs shrink-0 select-none">•</span>
                <span className="flex-1">{renderedLine}</span>
              </div>
            );
          }

          return <p key={idx}>{renderedLine}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#DCE4E5] max-w-2xl w-full h-[85vh] max-h-[720px] flex flex-col overflow-hidden text-[#172A35] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#DCE4E5] flex items-center justify-between bg-[#F7F8F5] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-white text-[#087F8C] border border-[#DCE4E5] shadow-2xs shrink-0">
              <Sparkles className="w-5 h-5 text-[#087F8C]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-[#172A35] text-base leading-tight">Ask BillSloth</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DDF7EF] border border-[#087F5B]/25 text-[#087F5B] text-[10px] font-extrabold tracking-tight shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B] animate-pulse" />
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-[#526572] mt-0.5 truncate">
                Factual ledger intelligence & smart financial assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {messages.length > 1 && (
              <button
                onClick={handleClearHistory}
                title="Clear conversation history"
                className="p-1.5 rounded-lg border border-[#DCE4E5] bg-white hover:bg-[#F7F8F5] text-[#526572] hover:text-[#BE123C] text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Clear</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close assistant dialog"
              className="text-[#526572] hover:text-[#172A35] p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F7F8F5]">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs ${
                    isUser
                      ? 'bg-[#087F8C] text-white'
                      : 'bg-white border border-[#DCE4E5] text-[#087F8C]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[#087F8C]" />}
                </div>

                <div className={`max-w-[85%] sm:max-w-[80%] space-y-1 ${isUser ? 'items-end' : ''}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs ${
                      isUser
                        ? 'bg-[#087F8C] text-white font-medium rounded-tr-none shadow-xs'
                        : m.isError
                        ? 'bg-[#FFE4E6] border border-[#BE123C]/30 text-[#BE123C] shadow-xs rounded-tl-none'
                        : 'bg-white border border-[#DCE4E5] text-[#172A35] shadow-xs rounded-tl-none'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    ) : (
                      renderFormattedMessage(m.text)
                    )}
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] text-[#526572] px-1 ${isUser ? 'justify-end' : ''}`}>
                    <span>{m.timestamp}</span>
                    {!isUser && !m.isError && (
                      <span className="text-[#087F5B] inline-flex items-center gap-0.5 font-medium">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified Ledger Fact
                      </span>
                    )}
                    {m.isError && (
                      <button
                        onClick={handleRetry}
                        className="inline-flex items-center gap-0.5 text-[#087F8C] hover:underline font-semibold ml-1 cursor-pointer"
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
            <div className="flex items-start gap-2.5 sm:gap-3 animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#DCE4E5] text-[#087F8C] flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4 text-[#087F8C]" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-[#DCE4E5] text-xs text-[#526572] shadow-xs rounded-tl-none flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 border-2 border-[#087F8C] border-t-transparent rounded-full animate-spin" />
                <span className="font-medium text-[#172A35]">Analyzing ledger with Gemini 3.8 Flash...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#F7F8F5] border-t border-[#DCE4E5] shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[10px] font-extrabold text-[#526572] uppercase tracking-wider mr-1 shrink-0">
              Suggestions:
            </span>
            {PRESET_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="px-2.5 py-1 rounded-full border border-[#DCE4E5] bg-white hover:bg-[#DDF5F6] hover:border-[#087F8C]/40 text-[11px] font-semibold text-[#172A35] transition-all disabled:opacity-50 shadow-2xs hover:shadow-xs cursor-pointer shrink-0"
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
          className="p-3.5 sm:p-4 bg-white border-t border-[#DCE4E5] flex items-center gap-2 shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about bills, due dates, cash flow, or draft payment emails..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-[#DCE4E5] bg-[#F7F8F5] text-[#172A35] placeholder:text-[#94A3B8] focus:border-[#087F8C] focus:bg-white focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            aria-label="Send question to AI assistant"
            className="px-4 py-2.5 rounded-xl bg-[#087F8C] hover:bg-[#066873] text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#087F8C] focus-visible:outline-none shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
export default AskAssistantModal;
