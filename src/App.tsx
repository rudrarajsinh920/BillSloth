import { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { DocumentsView } from './components/DocumentsView';
import { CalendarView } from './components/CalendarView';
import { ImportView } from './components/ImportView';
import { RemindersView } from './components/RemindersView';
import { WeeklyDigestView } from './components/WeeklyDigestView';
import { AuditLogView } from './components/AuditLogView';
import { ReviewModal } from './components/ReviewModal';
import { OllamaModal } from './components/OllamaModal';
import { AskAssistantModal } from './components/AskAssistantModal';
import { CalmSlothIntro } from './components/CalmSlothIntro';
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
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Review Modal State
  const [reviewDocId, setReviewDocId] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Loading & Action State
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Calm Sloth Intro State (replays on every page load and refresh)
  const [showIntro, setShowIntro] = useState<boolean>(true);

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

  // Global keyboard shortcut: Cmd+K or Ctrl+K to open AI Assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsAskModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      showToast(`Reminder prepared for human approval! View in Reminders.`);
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
    <div className="min-h-screen flex bg-[#0B1220] text-[#F8FAFC] font-sans antialiased selection:bg-[#22D3EE]/30 selection:text-[#22D3EE]">
      {/* Left Navigation Sidebar (FinCore & MySign style) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        ollamaStatus={ollamaStatus}
        onOpenOllamaModal={() => setIsOllamaModalOpen(true)}
        onOpenAskModal={() => setIsAskModalOpen(true)}
        pendingRemindersCount={pendingRemindersCount}
        needsReviewCount={needsReviewCount}
        hasSampleData={hasSampleData}
        onLoadSample={handleLoadSample}
        onClearSample={handleClearSample}
        loadingSample={loadingSample}
        onReplayIntro={() => setShowIntro(true)}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <TopHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenAskModal={() => setIsAskModalOpen(true)}
          onNavigateToImport={() => setActiveTab('import')}
          onNavigateToReminders={() => setActiveTab('reminders')}
          pendingRemindersCount={pendingRemindersCount}
        />

        {/* Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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

              {activeTab === 'calendar' && (
                <CalendarView
                  documents={documents}
                  onOpenReview={handleOpenReview}
                  onQuickMarkPaid={handleQuickMarkPaid}
                  onPrepareReminder={handlePrepareReminder}
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

        {/* Minimalist Professional Footer */}
        <footer className="bg-white border-t border-slate-border py-4 px-6 text-xs text-slate-muted mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-navy-900">🦥 BillSloth</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">Local-First Financial Intelligence</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>100% Air-Gapped Privacy</span>
              <span className="text-slate-300">•</span>
              <span>Zero Cloud AI</span>
              <span className="text-slate-300">•</span>
              <span>On-Device Gemma 2B</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Document Review Modal (Side-by-Side split view) */}
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

      {/* Ask BillSloth On-Device AI Assistant Modal */}
      <AskAssistantModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
        ollamaAvailable={!!ollamaStatus?.available}
        onOpenOllamaModal={() => {
          setIsAskModalOpen(false);
          setIsOllamaModalOpen(true);
        }}
      />

      {/* The Calm Sloth Premium Welcome Intro (replays on every page load/refresh) */}
      {showIntro && (
        <CalmSlothIntro
          onComplete={() => setShowIntro(false)}
          onSkip={() => setShowIntro(false)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#162238] text-[#F8FAFC] border border-[#29374D] px-4 py-2.5 rounded-xl shadow-2xl text-xs animate-in slide-in-from-bottom-2">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#22D3EE] shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
