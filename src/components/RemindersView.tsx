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
          <h1 className="text-xl font-bold text-navy-900 tracking-tight">Reminders & Approvals</h1>
          <p className="text-xs text-slate-muted mt-1">
            Human-in-the-loop reminder drafts. Never automatically emailed or debited.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Prepare New Reminder</span>
        </button>
      </div>

      {/* Safety Banner */}
      <div className="p-4 rounded-xl border border-slate-border bg-white shadow-card flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
        <div className="text-xs text-navy-800 space-y-1">
          <p className="font-semibold text-navy-900">Safety & Human Agency Guarantee</p>
          <p className="text-slate-muted">
            BillSloth will <strong>never</strong> dispatch unsolicited emails, notify external parties, or trigger automatic bank withdrawals.
            Every reminder is prepared for you to inspect, adjust, and approve. Once approved, you can export a calendar file (.ICS) or copy the memo.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-border pb-1">
        <button
          onClick={() => setFilterStatus('pending_approval')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            filterStatus === 'pending_approval'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-slate-muted hover:text-navy-900 hover:bg-slate-100'
          }`}
        >
          <span>Pending Human Approval</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filterStatus === 'pending_approval' ? 'bg-white text-brand-blue' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('approved')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            filterStatus === 'approved'
              ? 'bg-green-paid text-white shadow-sm'
              : 'text-slate-muted hover:text-navy-900 hover:bg-slate-100'
          }`}
        >
          <span>Approved Reminders</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filterStatus === 'approved' ? 'bg-white text-green-paid' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
            filterStatus === 'all'
              ? 'bg-navy-900 text-white'
              : 'text-slate-muted hover:text-navy-900 hover:bg-slate-100'
          }`}
        >
          <span>All ({reminders.length})</span>
        </button>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-border p-12 text-center text-slate-muted text-xs shadow-card">
            <CheckCircle2 className="w-8 h-8 text-green-paid mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-navy-900 text-sm">No Reminders in This Queue</p>
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
                className={`bg-white rounded-xl border transition-shadow shadow-card overflow-hidden ${
                  isApproved ? 'border-green-paid-border' : 'border-slate-border hover:shadow-card-hover'
                }`}
              >
                <div className="p-5 space-y-3">
                  {/* Top line with date & status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-border pb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isApproved ? 'bg-green-paid-light text-green-paid' : 'bg-brand-blue-light text-brand-blue'
                        }`}
                      >
                        <BellRing className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-navy-900">
                          Scheduled: {format(parseISO(rem.reminder_date), 'EEEE, MMMM d, yyyy')}
                        </span>
                        {rem.is_sample === 1 && <SampleDataBadge />}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-paid px-2.5 py-0.5 rounded-full bg-green-paid-light border border-green-paid-border">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approved by Human</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-warn px-2.5 py-0.5 rounded-full bg-amber-warn-light border border-amber-warn-border">
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
                        <label className="block text-xs font-semibold text-navy-900 mb-1">Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-border font-medium focus:border-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy-900 mb-1">Reminder Date</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full sm:w-48 px-3 py-1.5 text-xs rounded-lg border border-slate-border font-mono focus:border-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy-900 mb-1">Message Memo</label>
                        <textarea
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-border focus:border-brand-blue"
                        />
                      </div>
                      <div className="flex items-center gap-2 justify-end pt-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-lg border border-slate-border text-xs text-navy-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(rem.id)}
                          className="px-4 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-semibold"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-bold text-sm text-navy-900">{rem.title}</h3>
                      <p className="text-xs text-slate-700 mt-1.5 leading-relaxed bg-slate-light p-3 rounded-lg border border-slate-border whitespace-pre-wrap font-sans">
                        {rem.message}
                      </p>

                      {/* Associated bill info */}
                      {rem.vendor && (
                        <div className="mt-2 text-xs text-slate-muted flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" />
                            <span>
                              Linked Bill: <strong className="text-navy-900">{rem.vendor}</strong> ($
                              {(rem.amount || 0).toFixed(2)} {rem.currency})
                            </span>
                          </div>
                          {rem.document_id && (
                            <button
                              onClick={() => {
                                const found = documents.find((d) => d.id === rem.document_id);
                                if (found) onOpenReview(found);
                              }}
                              className="text-brand-blue hover:underline font-medium text-[11px]"
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
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-border">
                      <div className="flex items-center gap-2">
                        {/* Download .ICS calendar event */}
                        <a
                          href={`/api/reminders/${rem.id}/ics`}
                          download
                          className="px-3 py-1.5 rounded-lg border border-slate-border bg-white hover:bg-slate-50 text-navy-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-brand-blue" />
                          <span>Export .ICS Calendar</span>
                        </a>

                        {/* Copy memo */}
                        <button
                          onClick={() => handleCopy(rem)}
                          className="px-3 py-1.5 rounded-lg border border-slate-border bg-white hover:bg-slate-50 text-navy-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          {copiedId === rem.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-paid" />
                              <span className="text-green-paid">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-muted" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(rem)}
                          className="px-3 py-1.5 rounded-lg border border-slate-border text-navy-800 hover:bg-slate-50 text-xs font-medium inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-muted" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDiscard(rem.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-overdue-border text-red-overdue hover:bg-red-50 text-xs font-medium inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Discard</span>
                        </button>

                        {!isApproved && (
                          <button
                            onClick={() => handleApprove(rem.id)}
                            className="px-4 py-1.5 rounded-lg bg-green-paid hover:bg-green-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-border max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-navy-900">Prepare New Reminder</h3>
            <p className="text-xs text-slate-muted">
              Creates a reminder card for human approval. Won't send emails automatically.
            </p>

            <form onSubmit={handleCreateNew} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">
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
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-border bg-white focus:border-brand-blue"
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
                <label className="block text-xs font-semibold text-navy-900 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Schedule payment for Metro Grid"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-border focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Reminder Date</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-border font-mono focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Message Memo</label>
                <textarea
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                  placeholder="Memo details, payment link or account notes..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-border focus:border-brand-blue"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-border text-xs text-navy-800 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-semibold shadow-sm"
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
