import React, { useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  XCircle,
  Edit3,
  CalendarPlus,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import { ReminderItem, DocumentItem } from '../types';
import { SampleDataBadge } from './StatusBadge';
import { updateReminder, discardReminder, createReminder } from '../api/client';
import { format, parseISO } from 'date-fns';

interface RemindersViewProps {
  reminders: ReminderItem[];
  documents: DocumentItem[];
  onRefresh: () => Promise<void>;
  onOpenReview: (doc: DocumentItem) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  documents,
  onRefresh,
  onOpenReview,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('pending_approval');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editDate, setEditDate] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Reminder modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocId, setNewDocId] = useState<string>('');
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const filtered = reminders.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const handleStartEdit = (rem: ReminderItem) => {
    setEditingId(rem.id);
    setEditTitle(rem.title);
    setEditMessage(rem.message);
    setEditDate(rem.reminder_date);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await updateReminder(id, {
        title: editTitle,
        message: editMessage,
        reminder_date: editDate,
      });
      setEditingId(null);
      await onRefresh();
    } catch (err: unknown) {
      alert(`Error updating reminder: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateReminder(id, { status: 'approved' });
      await onRefresh();
    } catch (err: unknown) {
      alert(`Error approving reminder: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDiscard = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to discard this reminder?');
    if (!confirm) return;
    try {
      await discardReminder(id);
      await onRefresh();
    } catch (err: unknown) {
      alert(`Error discarding reminder: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCopy = (rem: ReminderItem) => {
    const text = `Bill Reminder: ${rem.title}\nDate: ${rem.reminder_date}\n\n${rem.message}`;
    navigator.clipboard.writeText(text);
    setCopiedId(rem.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim() || !newDate) return;

    try {
      await createReminder({
        document_id: newDocId || null,
        title: newTitle.trim(),
        reminder_date: newDate,
        message: newMessage.trim(),
        action_type: 'calendar_ics',
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewMessage('');
      setNewDocId('');
      await onRefresh();
    } catch (err: unknown) {
      alert(`Error creating reminder: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const pendingCount = reminders.filter((r) => r.status === 'pending_approval').length;
  const approvedCount = reminders.filter((r) => r.status === 'approved').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight">Reminders & Approvals</h1>
          <p className="text-xs text-[#A8B7CC] mt-1">
            Human-in-the-loop reminder drafts. Never automatically emailed or debited.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0B1220] text-xs font-bold shadow-md inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Prepare New Reminder</span>
        </button>
      </div>

      {/* Safety Banner */}
      <div className="bg-[#162238] border border-[#29374D] rounded-xl p-4 flex items-start gap-3 shadow-lg">
        <ShieldCheck className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
        <div className="text-xs text-[#A8B7CC] space-y-1">
          <p className="font-semibold text-[#F8FAFC]">Safety & Human Agency Guarantee</p>
          <p className="text-[#A8B7CC]">
            BillSloth will <strong className="text-[#F8FAFC]">never</strong> dispatch unsolicited emails, notify external parties, or trigger automatic bank withdrawals.
            Every reminder is prepared for you to inspect, adjust, and approve. Once approved, you can export a calendar file (.ICS) or copy the memo.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#29374D] pb-1">
        <button
          onClick={() => setFilterStatus('pending_approval')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            filterStatus === 'pending_approval'
              ? 'bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/40 shadow-sm'
              : 'text-[#A8B7CC] hover:text-[#F8FAFC] hover:bg-[#111D32]'
          }`}
        >
          <span>Pending Human Approval</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filterStatus === 'pending_approval' ? 'bg-[#FBBF24] text-[#0B1220]' : 'bg-[#111D32] text-[#A8B7CC] border border-[#29374D]'
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('approved')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            filterStatus === 'approved'
              ? 'bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40 shadow-sm'
              : 'text-[#A8B7CC] hover:text-[#F8FAFC] hover:bg-[#111D32]'
          }`}
        >
          <span>Approved Reminders</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filterStatus === 'approved' ? 'bg-[#34D399] text-[#0B1220]' : 'bg-[#111D32] text-[#A8B7CC] border border-[#29374D]'
            }`}
          >
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
            filterStatus === 'all'
              ? 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/40 font-bold'
              : 'text-[#A8B7CC] hover:text-[#F8FAFC] hover:bg-[#111D32]'
          }`}
        >
          <span>All ({reminders.length})</span>
        </button>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-[#162238] border border-[#29374D] rounded-xl p-12 text-center text-[#A8B7CC] text-xs shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-[#34D399] mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-[#F8FAFC] text-sm">No Reminders in This Queue</p>
            <p className="mt-1">
              {filterStatus === 'pending_approval'
                ? 'All pending reminders have been reviewed and approved.'
                : 'No reminders found for this filter.'}
            </p>
          </div>
        ) : (
          filtered.map((rem) => {
            const isEditing = editingId === rem.id;
            const isApproved = rem.status === 'approved';

            return (
              <div
                key={rem.id}
                className={`bg-[#162238] border rounded-xl overflow-hidden shadow-lg transition-colors ${
                  isApproved ? 'border-[#34D399]/40' : 'border-[#29374D]'
                }`}
              >
                <div className="p-5 space-y-3">
                  {/* Top line with date & status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#29374D] pb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 border ${
                          isApproved
                            ? 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30'
                            : 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30'
                        }`}
                      >
                        <BellRing className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#F8FAFC] tabular-nums">
                          Scheduled: {format(parseISO(rem.reminder_date), 'EEEE, MMMM d, yyyy')}
                        </span>
                        {rem.is_sample === 1 && <SampleDataBadge />}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#34D399] px-2.5 py-0.5 rounded-full bg-[#34D399]/15 border border-[#34D399]/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approved by Human</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FBBF24] px-2.5 py-0.5 rounded-full bg-[#FBBF24]/15 border border-[#FBBF24]/40">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Needs Human Approval</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body / Edit Mode */}
                  {isEditing ? (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#29374D] bg-[#111D32] text-[#F8FAFC] font-medium focus:border-[#22D3EE] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Reminder Date</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full sm:w-48 px-3 py-1.5 text-xs rounded-lg border border-[#29374D] bg-[#111D32] text-[#F8FAFC] font-mono focus:border-[#22D3EE] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Message Memo</label>
                        <textarea
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#29374D] bg-[#111D32] text-[#F8FAFC] focus:border-[#22D3EE] focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 justify-end pt-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-lg border border-[#29374D] text-xs text-[#A8B7CC] hover:bg-[#111D32] hover:text-[#F8FAFC] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(rem.id)}
                          className="px-4 py-1.5 rounded-lg bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0B1220] text-xs font-bold transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-bold text-sm text-[#F8FAFC]">{rem.title}</h3>
                      <p className="text-xs text-[#A8B7CC] mt-1.5 leading-relaxed bg-[#111D32] p-3 rounded-lg border border-[#29374D] whitespace-pre-wrap font-sans">
                        {rem.message}
                      </p>

                      {/* Associated bill info */}
                      {rem.vendor && (
                        <div className="mt-2 text-xs text-[#A8B7CC] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-[#22D3EE]" />
                            <span>
                              Linked Bill: <strong className="text-[#F8FAFC]">{rem.vendor}</strong> (<span className="font-mono tabular-nums text-[#22D3EE]">${(rem.amount || 0).toFixed(2)}</span> {rem.currency})
                            </span>
                          </div>
                          {rem.document_id && (
                            <button
                              onClick={() => {
                                const found = documents.find((d) => d.id === rem.document_id);
                                if (found) onOpenReview(found);
                              }}
                              className="text-[#22D3EE] hover:underline font-semibold text-[11px]"
                            >
                              Review Bill Details →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Bar */}
                  {!isEditing && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#29374D]">
                      <div className="flex items-center gap-2">
                        {/* Download .ICS calendar event */}
                        <a
                          href={`/api/reminders/${rem.id}/ics`}
                          download
                          className="px-3 py-1.5 rounded-lg border border-[#29374D] bg-[#111D32] hover:bg-[#1C2B46] text-[#F8FAFC] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span>Export .ICS Calendar</span>
                        </a>

                        {/* Copy memo */}
                        <button
                          onClick={() => handleCopy(rem)}
                          className="px-3 py-1.5 rounded-lg border border-[#29374D] bg-[#111D32] hover:bg-[#1C2B46] text-[#F8FAFC] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          {copiedId === rem.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#34D399]" />
                              <span className="text-[#34D399] font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#A8B7CC]" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(rem)}
                          className="px-3 py-1.5 rounded-lg border border-[#29374D] text-[#A8B7CC] hover:text-[#F8FAFC] hover:bg-[#111D32] text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#A8B7CC]" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDiscard(rem.id)}
                          className="px-3 py-1.5 rounded-lg border border-[#FB7185]/40 text-[#FB7185] hover:bg-[#FB7185]/15 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Discard</span>
                        </button>

                        {!isApproved && (
                          <button
                            onClick={() => handleApprove(rem.id)}
                            className="px-4 py-1.5 rounded-lg bg-[#34D399] hover:bg-[#059669] text-[#0B1220] text-xs font-bold inline-flex items-center gap-1.5 shadow-md transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve Reminder</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create New Reminder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1220]/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-[#162238] rounded-2xl shadow-2xl border border-[#29374D] max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-[#F8FAFC]">Prepare New Reminder</h3>
            <p className="text-xs text-[#A8B7CC]">
              Creates a reminder card for human approval. Won't send emails automatically.
            </p>

            <form onSubmit={handleCreateNew} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                  Link to Existing Bill (Optional)
                </label>
                <select
                  value={newDocId}
                  onChange={(e) => {
                    setNewDocId(e.target.value);
                    const selected = documents.find((d) => d.id === e.target.value);
                    if (selected) {
                      setNewTitle(`Payment Due: ${selected.vendor || 'Bill'} ($${(selected.amount || 0).toFixed(2)})`);
                      setNewMessage(
                        `Reminder to review and settle invoice for ${selected.vendor || 'vendor'} ($${(selected.amount || 0).toFixed(2)}). Due date: ${selected.due_date || 'None'}.`
                      );
                      if (selected.due_date) {
                        setNewDate(selected.due_date);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#29374D] bg-[#111D32] text-[#F8FAFC] focus:border-[#22D3EE] focus:outline-none"
                >
                  <option value="">No linked bill (Generic reminder)</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.vendor || d.original_name} — ${(d.amount || 0).toFixed(2)} (Due: {d.due_date || 'No Date'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Schedule payment for Metro Grid"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#29374D] bg-[#111D32] text-[#F8FAFC] focus:border-[#22D3EE] focus:outline-none placeholder:text-[#64748B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Reminder Date</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#29374D] bg-[#111D32] text-[#F8FAFC] font-mono focus:border-[#22D3EE] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Message Memo</label>
                <textarea
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                  placeholder="Memo details, payment link or account notes..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#29374D] bg-[#111D32] text-[#F8FAFC] focus:border-[#22D3EE] focus:outline-none placeholder:text-[#64748B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#29374D]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#29374D] text-xs text-[#A8B7CC] hover:bg-[#111D32] hover:text-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0B1220] text-xs font-bold shadow-md transition-colors"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
