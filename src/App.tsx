import { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DocumentsView } from './components/DocumentsView';
import { ImportView } from './components/ImportView';
import { RemindersView } from './components/RemindersView';
import { WeeklyDigestView } from './components/WeeklyDigestView';
import { AuditLogView } from './components/AuditLogView';
import { ReviewModal } from './components/ReviewModal';
import { OllamaModal } from './components/OllamaModal';
import { DocumentItem, ReminderItem, OllamaStatus } from './types';
import {
  fetchDocuments,
  fetchReminders,
  fetchOllamaStatus,
  updateDocument,
  createReminder,
  loadSampleData,
  clearSampleData,
} from './api/client';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [isOllamaModalOpen, setIsOllamaModalOpen] = useState(false);

  // Review Modal State
  const [reviewDocId, setReviewDocId] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Loading & Action State
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refreshAll = useCallback(async () => {
    try {
      const [docs, rems, aiStatus] = await Promise.all([
        fetchDocuments(),
        fetchReminders(),
        fetchOllamaStatus(),
      ]);
      setDocuments(docs);
      setReminders(rems);
      setOllamaStatus(aiStatus);
    } catch (err: unknown) {
      console.error('Failed to load BillSloth data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Open review for a document
  const handleOpenReview = (doc: DocumentItem) => {
    setReviewDocId(doc.id);
    setIsReviewModalOpen(true);
  };

  const handleDocumentUpdated = (updatedDoc: DocumentItem) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
    );
    showToast(`Saved changes for ${updatedDoc.vendor || updatedDoc.original_name}.`);
  };

  const handleDocumentDeleted = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    showToast('Document record removed. Original file safely retained locally.', 'info');
  };

  // Quick action: Mark as Paid
  const handleQuickMarkPaid = async (doc: DocumentItem) => {
    try {
      const updated = await updateDocument(doc.id, {
        status: 'paid',
        is_verified: 1,
      });
      handleDocumentUpdated(updated);
      showToast(`Marked ${doc.vendor || 'invoice'} as paid!`);
    } catch (err: unknown) {
      alert(`Error updating status: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Quick action: Prepare reminder for human approval
  const handlePrepareReminder = async (doc: DocumentItem) => {
    try {
      const reminderDate = doc.due_date || format(addDays(new Date(), 2), 'yyyy-MM-dd');
      await createReminder({
        document_id: doc.id,
        title: `Payment Review: ${doc.vendor || 'Invoice'} ($${(doc.amount || 0).toFixed(2)})`,
        reminder_date: reminderDate,
        message: `Prepared reminder for ${doc.vendor || 'bill'} (${doc.invoice_number || 'no invoice #'}). Amount due: $${(doc.amount || 0).toFixed(2)}. Due date: ${doc.due_date || 'Unspecified'}. Approve to schedule or export to calendar.`,
        action_type: 'calendar_ics',
      });
      await refreshAll();
      showToast(`Reminder prepared for human approval! View in Reminders tab.`);
      setActiveTab('reminders');
    } catch (err: unknown) {
      alert(`Error preparing reminder: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Sample data actions
  const handleLoadSample = async () => {
    setLoadingSample(true);
    try {
      await loadSampleData();
      await refreshAll();
      showToast('Loaded illustrative sample bills and reminders.');
    } catch (err: unknown) {
      alert(`Failed to seed sample data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingSample(false);
    }
  };

  const handleClearSample = async () => {
    setLoadingSample(true);
    try {
      await clearSampleData();
      await refreshAll();
      showToast('Cleared all sample data.');
    } catch (err: unknown) {
      alert(`Failed to clear sample data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingSample(false);
    }
  };

  const hasSampleData = documents.some((d) => d.is_sample === 1);
  const pendingRemindersCount = reminders.filter((r) => r.status === 'pending_approval').length;
  const needsReviewCount = documents.filter(
    (d) => (d.computed_status || d.status) === 'needs_review' || d.is_verified === 0
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-cool-bg text-navy-900 font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ollamaStatus={ollamaStatus}
        onOpenOllamaModal={() => setIsOllamaModalOpen(true)}
        pendingRemindersCount={pendingRemindersCount}
        needsReviewCount={needsReviewCount}
        hasSampleData={hasSampleData}
        onLoadSample={handleLoadSample}
        onClearSample={handleClearSample}
        loadingSample={loadingSample}
      />

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="py-24 text-center text-slate-muted text-xs">
            <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-semibold text-navy-900 text-sm">Opening Local Financial Ledger...</p>
            <p className="mt-1">Connecting to SQLite and verifying local models.</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                documents={documents}
                onOpenReview={handleOpenReview}
                onNavigate={setActiveTab}
                onQuickMarkPaid={handleQuickMarkPaid}
                onPrepareReminder={handlePrepareReminder}
                onOpenOllamaModal={() => setIsOllamaModalOpen(true)}
                ollamaAvailable={!!ollamaStatus?.available}
              />
            )}

            {activeTab === 'documents' && (
              <DocumentsView
                documents={documents}
                onOpenReview={handleOpenReview}
                onQuickMarkPaid={handleQuickMarkPaid}
                onPrepareReminder={handlePrepareReminder}
                onDeleteDocument={handleDocumentDeleted}
                onNavigateToImport={() => setActiveTab('import')}
              />
            )}

            {activeTab === 'import' && (
              <ImportView
                onDocumentImported={(newDoc) => {
                  setDocuments((prev) => [newDoc, ...prev]);
                  showToast(`Imported ${newDoc.original_name} to local vault.`);
                }}
                onOpenReview={handleOpenReview}
                ollamaAvailable={!!ollamaStatus?.available}
                onOpenOllamaModal={() => setIsOllamaModalOpen(true)}
              />
            )}

            {activeTab === 'reminders' && (
              <RemindersView
                reminders={reminders}
                documents={documents}
                onRefresh={refreshAll}
                onOpenReview={handleOpenReview}
              />
            )}

            {activeTab === 'digest' && (
              <WeeklyDigestView
                onOpenReview={handleOpenReview}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'audit' && <AuditLogView />}
          </>
        )}
      </main>

      {/* Footer with Hacktoberfest metadata and Data Safety reminders */}
      <footer className="bg-white border-t border-slate-border py-6 px-4 text-xs text-slate-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy-900">🦥 BillSloth</span>
            <span>• Local-First Financial Productivity</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Hacktoberfest Week 3 "Slow and Steady"</span>
            <span>•</span>
            <span>No Cloud Transmission</span>
            <span>•</span>
            <span>Original Documents Retained Locally</span>
          </div>
        </div>
      </footer>

      {/* Document Review Modal */}
      <ReviewModal
        documentId={reviewDocId}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewDocId(null);
        }}
        onDocumentUpdated={handleDocumentUpdated}
        onDocumentDeleted={handleDocumentDeleted}
        ollamaAvailable={!!ollamaStatus?.available}
        onOpenOllamaModal={() => setIsOllamaModalOpen(true)}
      />

      {/* Ollama Local Engine Modal */}
      <OllamaModal
        isOpen={isOllamaModalOpen}
        onClose={() => setIsOllamaModalOpen(false)}
        status={ollamaStatus}
        onRefresh={async () => {
          const s = await fetchOllamaStatus();
          setOllamaStatus(s);
          if (s.available) {
            showToast('Ollama local model connected!');
          }
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-navy-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs animate-in slide-in-from-bottom-2">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-brand-blue shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
