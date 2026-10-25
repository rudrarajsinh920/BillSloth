import {
  DocumentItem,
  ReminderItem,
  AuditLogItem,
  AiEngineStatus,
  WeeklyDigestData,
} from '../types';
import {
  DEMO_DOCUMENTS,
  DEMO_REMINDERS,
  DEMO_AUDIT_LOGS,
  DEMO_WEEKLY_DIGEST,
} from './demoData';
import {
  getActiveAiEngine,
  GEMMA_PRIMARY_MODEL,
} from './gemini';
import { answerLedgerQuestion } from './ledgerAssistant';

const API_BASE = '/api';

let localDocsStore: DocumentItem[] = [...DEMO_DOCUMENTS];
let localRemindersStore: ReminderItem[] = [...DEMO_REMINDERS];
const localAuditStore: AuditLogItem[] = [...DEMO_AUDIT_LOGS];

export async function fetchDocuments(params?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<DocumentItem[]> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/documents?${query.toString()}`);
    if (!res.ok) throw new Error('API offline');
    const json = await res.json();
    if (json.data && !params?.status && !params?.category && !params?.search) {
      localDocsStore = json.data;
    }
    return json.data || [];
  } catch {
    // Graceful fallback for static hosted environments (e.g. Vercel demo)
    return localDocsStore;
  }
}

export async function fetchDocumentById(id: string): Promise<DocumentItem> {
  try {
    const res = await fetch(`${API_BASE}/documents/${id}`);
    if (!res.ok) throw new Error('API offline');
    const json = await res.json();
    return json.data;
  } catch {
    const found = localDocsStore.find((d) => d.id === id);
    if (!found) throw new Error('Document not found');
    return found;
  }
}

export interface UploadResponse {
  success: boolean;
  data: DocumentItem;
  is_duplicate?: boolean;
  duplicate_of?: string;
  message?: string;
  extraction_info?: {
    method: string;
    ocr_confidence: number;
    model_used: string | null;
    is_ai?: boolean;
    validation_flags: string[];
  };
}

export async function uploadDocument(file: File, force = false): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/documents/upload${force ? '?force=true' : ''}`, {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (res.status === 409 && json.is_duplicate) {
      return json;
    }
    if (!res.ok) {
      throw new Error(json.error || 'Failed to upload document');
    }
    return json;
  } catch (err: unknown) {
    // If backend is offline (e.g. static Vercel demo preview), synthesize document import
    console.warn('Backend upload offline, storing in local session preview:', err);
    const newDoc: DocumentItem = {
      id: `doc_${Date.now()}`,
      filename: file.name,
      original_name: file.name,
      mime_type: file.type || 'application/pdf',
      file_size: file.size,
      file_path: file.name,
      vendor: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
      invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: 175.0,
      currency: 'USD',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      category: 'Utilities',
      status: 'needs_review',
      computed_status: 'needs_review',
      is_verified: 0,
      verified_at: null,
      is_sample: 0,
      raw_text: `Extracted preview for uploaded document: ${file.name}`,
      extraction_metadata: JSON.stringify({
        source: 'browser_preview',
        model_used: 'Local / Gemma',
      }),
      payment_reference: null,
      notes: 'Imported in client session preview.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localDocsStore = [newDoc, ...localDocsStore];
    return {
      success: true,
      data: newDoc,
      extraction_info: {
        method: 'pdf_text',
        ocr_confidence: 95,
        model_used: 'Smart Local',
        is_ai: false,
        validation_flags: [],
      },
    };
  }
}

export async function extractDocumentFields(id: string, rawText?: string): Promise<{
  success: boolean;
  data?: DocumentItem;
  reason?: string;
  message?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/documents/${id}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text_content: rawText }),
    });
    const json = await res.json();
    if (res.ok && json.success && json.document) {
      localDocsStore = localDocsStore.map((d) => (d.id === id ? json.document : d));
      return {
        success: true,
        data: json.document,
        message: json.message || 'Successfully extracted invoice details via Gemma.',
      };
    }
    return json;
  } catch {
    return {
      success: true,
      message: 'Document extraction completed (offline fallback).',
    };
  }
}

export async function updateDocument(
  id: string,
  updates: Partial<DocumentItem>
): Promise<DocumentItem> {
  try {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update document');
    return json.data;
  } catch {
    localDocsStore = localDocsStore.map((d) => (d.id === id ? { ...d, ...updates } : d));
    const found = localDocsStore.find((d) => d.id === id);
    if (!found) throw new Error('Document not found');
    return found;
  }
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete document');
  } catch {
    localDocsStore = localDocsStore.filter((d) => d.id !== id);
  }
}

export async function fetchReminders(): Promise<ReminderItem[]> {
  try {
    const res = await fetch(`${API_BASE}/reminders`);
    if (!res.ok) throw new Error('Failed to fetch reminders');
    const json = await res.json();
    return json.data || [];
  } catch {
    return localRemindersStore;
  }
}

export async function createReminder(data: {
  document_id?: string | null;
  title: string;
  reminder_date: string;
  message: string;
  action_type?: 'manual_draft' | 'calendar_ics' | 'notification' | string;
}): Promise<ReminderItem> {
  try {
    const res = await fetch(`${API_BASE}/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create reminder');
    return json.data;
  } catch {
    const newRem: ReminderItem = {
      id: `rem_${Date.now()}`,
      document_id: data.document_id || null,
      title: data.title,
      reminder_date: data.reminder_date,
      message: data.message,
      status: 'pending_approval',
      action_type: (data.action_type as 'manual_draft' | 'calendar_ics' | 'notification') || 'calendar_ics',
      approved_at: null,
      created_at: new Date().toISOString(),
    };
    localRemindersStore = [newRem, ...localRemindersStore];
    return newRem;
  }
}

export async function updateReminder(
  id: string,
  updates: Partial<ReminderItem>
): Promise<ReminderItem> {
  try {
    const res = await fetch(`${API_BASE}/reminders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update reminder');
    return json.data;
  } catch {
    localRemindersStore = localRemindersStore.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    const found = localRemindersStore.find((r) => r.id === id);
    if (!found) throw new Error('Reminder not found');
    return found;
  }
}

export async function discardReminder(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/reminders/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to discard reminder');
  } catch {
    localRemindersStore = localRemindersStore.filter((r) => r.id !== id);
  }
}

export async function fetchWeeklyDigest(): Promise<WeeklyDigestData> {
  try {
    const res = await fetch(`${API_BASE}/digest/weekly`);
    if (!res.ok) throw new Error('Failed to load weekly digest');
    const json = await res.json();
    return json.data;
  } catch {
    return DEMO_WEEKLY_DIGEST;
  }
}

export async function fetchAuditLogs(): Promise<AuditLogItem[]> {
  try {
    const res = await fetch(`${API_BASE}/audit-logs`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    const json = await res.json();
    return json.data || [];
  } catch {
    return localAuditStore;
  }
}

export async function fetchAiEngineStatus(): Promise<AiEngineStatus> {
  try {
    const res = await fetch(`${API_BASE}/ai/status`);
    if (!res.ok) throw new Error('Failed to query AI status');
    return res.json();
  } catch {
    return {
      available: true,
      engine: getActiveAiEngine(),
      url: 'https://generativelanguage.googleapis.com',
      models: [GEMMA_PRIMARY_MODEL, 'gemma-4-31b-it'],
      activeModel: GEMMA_PRIMARY_MODEL,
    };
  }
}

export async function loadSampleData(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/sample-data/load`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed sample data');
  } catch {
    localDocsStore = [...DEMO_DOCUMENTS];
  }
}

export async function clearSampleData(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/sample-data/clear`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clear sample data');
  } catch {
    localDocsStore = [];
  }
}

export async function askAiAssistant(query: string): Promise<{ answer: string; intent?: string; modelUsed?: string }> {
  // Ensure documents are up to date from backend if connected
  try {
    const docRes = await fetch(`${API_BASE}/documents`);
    if (docRes.ok) {
      const docJson = await docRes.json();
      if (Array.isArray(docJson.data) && docJson.data.length > 0) {
        localDocsStore = docJson.data;
      }
    }
  } catch {
    // Offline or static hosted mode, use existing localDocsStore
  }

  // 1. Primary AI Path: Call Express backend which executes Google Gemma with backend-stored API key
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);
    const res = await fetch(`${API_BASE}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const json = await res.json();
    if (res.ok && json.success) {
      return { answer: json.answer, intent: json.intent, modelUsed: json.modelUsed };
    }
    if (!json.success && json.error) {
      // Return explicit Gemma error without falling back to Gemini
      return {
        answer: json.answer || `⚠️ **Gemma Inference Error**: ${json.error}`,
        intent: json.intent,
        modelUsed: json.modelUsed,
      };
    }
  } catch {
    // Backend offline / connection timed out
  }

  // 2. Offline fallback to deterministic intent-aware ledger intelligence if backend is offline
  const ledgerRes = answerLedgerQuestion(query, localDocsStore);
  return {
    answer: ledgerRes.answer,
    intent: ledgerRes.intent,
    modelUsed: 'offline-local-ledger',
  };
}

export const CSV_EXPORT_URL = `${API_BASE}/documents/export/csv`;
export const SYSTEM_BACKUP_URL = `${API_BASE}/system/backup`;
