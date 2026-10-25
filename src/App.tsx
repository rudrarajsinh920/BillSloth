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
import { AskAssistantModal } from './components/AskAssistantModal';
import { CalmSlothIntro } from './components/CalmSlothIntro';
import { DocumentItem, ReminderItem } from './types';
import {
  fetchDocuments,
  fetchReminders,
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
      const [docs, rems] = await Promise.all([
        fetchDocuments(),
        fetchReminders(),
      ]);
      setDocuments(docs);
      setReminders(rems);
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

  const navigateToTab = (tab: NavTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex bg-[#F7F8F5] text-[#172A35] font-sans antialiased selection:bg-[#DDF5F6] selection:text-[#087F8C]">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={navigateToTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
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
          onNavigateToImport={() => navigateToTab('import')}
          onNavigateToReminders={() => navigateToTab('reminders')}
          pendingRemindersCount={pendingRemindersCount}
        />

        {/* Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {loading ? (
            <div className="py-24 text-center text-[#526572] text-xs">
              <div className="w-8 h-8 border-2 border-[#087F8C] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="font-semibold text-[#172A35] text-sm">Opening Local Financial Ledger...</p>
              <p className="mt-1">Connecting to SQLite local database.</p>
            </div>
          ) : (
            <div key={activeTab} className="animate-view-fade">
              {activeTab === 'dashboard' && (
                <DashboardView
                  documents={documents}
                  onOpenReview={handleOpenReview}
                  onNavigate={navigateToTab}
                  onQuickMarkPaid={handleQuickMarkPaid}
                  onPrepareReminder={handlePrepareReminder}
                />
              )}

              {activeTab === 'documents' && (
                <DocumentsView
                  documents={documents}
                  onOpenReview={handleOpenReview}
                  onQuickMarkPaid={handleQuickMarkPaid}
                  onPrepareReminder={handlePrepareReminder}
                  onDeleteDocument={handleDocumentDeleted}
                  onNavigateToImport={() => navigateToTab('import')}
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
                  onNavigate={navigateToTab}
                />
              )}

              {activeTab === 'audit' && <AuditLogView />}
            </div>
          )}
        </main>

        {/* Minimalist Professional Footer */}
        <footer className="bg-[#FFFFFF] border-t border-[#DCE4E5] py-4 px-6 text-xs text-[#526572] mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#172A35]">🦥 BillSloth</span>
              <span className="text-[#DCE4E5]">•</span>
              <span className="text-[#526572]">Local-First Financial Intelligence</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#526572]">
              <span>Local SQLite Ledger</span>
              <span className="text-[#DCE4E5]">•</span>
              <span>Google Gemma 4</span>
              <span className="text-[#DCE4E5]">•</span>
              <span>Privacy-Grounded Financial Intelligence</span>
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
      />

      {/* Ask BillSloth AI Assistant Modal */}
      <AskAssistantModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#FFFFFF] text-[#172A35] border border-[#DCE4E5] px-4 py-2.5 rounded-xl shadow-xl text-xs animate-in slide-in-from-bottom-2">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#087F5B] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#087F8C] shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
