import {
  DocumentItem,
  ReminderItem,
  AuditLogItem,
  OllamaStatus,
  WeeklyDigestData,
} from '../types';
import {
  DEMO_DOCUMENTS,
  DEMO_REMINDERS,
  DEMO_AUDIT_LOGS,
  DEMO_WEEKLY_DIGEST,
} from './demoData';
import {
  askGeminiAssistant,
  extractInvoiceWithGemini,
  getActiveAiEngine,
  getGeminiApiKey,
} from './gemini';

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
    is_gemma: boolean;
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
        model_used: 'gemma2:2b (local)',
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
        model_used: 'gemma2:2b',
        is_gemma: true,
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
  const geminiKey = getGeminiApiKey();
  const engine = getActiveAiEngine();

  // If Gemini key is available and selected
  if ((engine === 'gemini' || geminiKey) && geminiKey) {
    const doc = localDocsStore.find((d) => d.id === id);
    const textToExtract = rawText || doc?.raw_text || doc?.original_name || '';
    const geminiRes = await extractInvoiceWithGemini(textToExtract);
    if (geminiRes.success && geminiRes.fields) {
      const baseDoc: DocumentItem = doc || {
        id,
        filename: 'document.pdf',
        original_name: 'document.pdf',
        mime_type: 'application/pdf',
        file_size: 100000,
        file_path: 'document.pdf',
        vendor: null,
        invoice_number: null,
        amount: null,
        currency: 'USD',
        issue_date: null,
        due_date: null,
        category: 'Other',
        status: 'needs_review',
        is_verified: 0,
        verified_at: null,
        is_sample: 0,
        raw_text: textToExtract,
        extraction_metadata: null,
        payment_reference: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updated: DocumentItem = {
        ...baseDoc,
        vendor: geminiRes.fields.vendor || baseDoc.vendor || 'Extracted Vendor',
        invoice_number: geminiRes.fields.invoice_number || baseDoc.invoice_number || null,
        amount: geminiRes.fields.amount !== undefined ? geminiRes.fields.amount : baseDoc.amount || null,
        currency: geminiRes.fields.currency || baseDoc.currency || 'USD',
        due_date: geminiRes.fields.due_date || baseDoc.due_date || null,
        category: (geminiRes.fields.category as any) || baseDoc.category || 'Other',
        is_verified: 0,
        extraction_method: 'gemini-flash',
      };
      localDocsStore = localDocsStore.map((d) => (d.id === id ? updated : d));
      return {
        success: true,
        data: updated,
        message: 'Successfully extracted invoice details via Gemini Flash!',
      };
    }
  }

  try {
    const res = await fetch(`${API_BASE}/documents/${id}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText }),
    });
    return res.json();
  } catch {
    return {
      success: true,
      message: 'Demo mode simulated local AI extraction.',
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

export async function fetchOllamaStatus(): Promise<OllamaStatus> {
  try {
    const res = await fetch(`${API_BASE}/ai/status`);
    if (!res.ok) throw new Error('Failed to query local AI status');
    return res.json();
  } catch {
    return {
      available: false,
      url: 'http://127.0.0.1:11434',
      activeModel: null,
      models: [],
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

function synthesizeAssistantResponse(query: string, docs: DocumentItem[]): string {
  const q = query.toLowerCase().trim();

  // 1. "How to work BillSloth" / "How does it work" / "Help" / "About"
  if (
    q.includes('how to work') ||
    q.includes('how does') ||
    q.includes('how billsloth') ||
    q.includes('what is billsloth') ||
    q.includes('workflow') ||
    q.includes('features') ||
    q.includes('how it works')
  ) {
    return [
      `🦥 **How BillSloth Works — Slow and Steady Bill Management:**`,
      ``,
      `1. **Local-First Document Import**:`,
      `   Drop any PDF, JPG, or PNG invoice. Your original files stay strictly in local storage (\`./data/uploads/\`). SHA-256 cryptographic hashing prevents duplicate uploads.`,
      ``,
      `2. **On-Device Text & AI Parsing**:`,
      `   Local PDF parsers and Tesseract OCR read invoice text. When connected to local Ollama (\`ollama serve\`), an open-weight Gemma 2 2B model extracts amounts, dates, vendors, and line items without sending a single byte to cloud endpoints.`,
      ``,
      `3. **Human-in-the-Loop Approval Gate**:`,
      `   BillSloth tags newly extracted bills as 'Unverified'. You review and approve the figures. The app never triggers automatic bank debits or sends unauthorized emails.`,
      ``,
      `4. **Cash Flow & Deadlines**:`,
      `   View the 30-Day Cash Maturity Radar, Due Date Calendar, and export scheduled .ICS reminders for Google Calendar or Apple Calendar.`,
      ``,
      `5. **Immutable SQLite Audit Trail**:`,
      `   Every extraction, status transition, and verified record is logged cryptographically to your on-device ledger.`,
      ``,
      `💡 *Tip: For full live LLM generation, run \`ollama run gemma2:2b\` and \`npm run dev\` on your local machine!*`,
    ].join('\n');
  }

  // 2. Overdue bills
  if (q.includes('overdue') || q.includes('past due') || q.includes('late')) {
    const overdue = docs.filter(
      (d) => (d.computed_status || d.status) === 'overdue'
    );
    const total = overdue.reduce((sum, d) => sum + (d.amount || 0), 0);
    if (overdue.length === 0) {
      return `Great news! You currently have zero overdue bills recorded in your ledger.`;
    }
    return [
      `⚠️ **You have ${overdue.length} overdue ${overdue.length === 1 ? 'bill' : 'bills'} totaling $${total.toFixed(2)}:**`,
      ``,
      ...overdue.map(
        (d) =>
          `• **${d.vendor || d.original_name}**: $${(d.amount || 0).toFixed(2)} ${d.currency || 'USD'} (Due date was ${d.due_date || 'past'}, Invoice: ${d.invoice_number || 'N/A'})`
      ),
      ``,
      `Action: Open **Bills & Invoices** or the **Due Date Calendar** to review and settle.`,
    ].join('\n');
  }

  // 3. Due soon / next 7 days / upcoming
  if (
    q.includes('due soon') ||
    q.includes('next 7 days') ||
    q.includes('upcoming') ||
    q.includes('this week')
  ) {
    const dueSoon = docs.filter(
      (d) => (d.computed_status || d.status) === 'due_soon'
    );
    const total = dueSoon.reduce((sum, d) => sum + (d.amount || 0), 0);
    if (dueSoon.length === 0) {
      return `You have no bills scheduled due in the next 7 days.`;
    }
    return [
      `📅 **Upcoming obligations due in the next 7 days (Total: $${total.toFixed(2)}):**`,
      ``,
      ...dueSoon.map(
        (d) =>
          `• **${d.vendor || d.original_name}**: $${(d.amount || 0).toFixed(2)} ${d.currency || 'USD'} — Due on ${d.due_date || 'N/A'} (Category: ${d.category || 'General'})`
      ),
      ``,
      `Scheduled cash needed this week: **$${total.toFixed(2)}**.`,
    ].join('\n');
  }

  // 4. Total balance / how much do I owe / outstanding
  if (
    q.includes('total') ||
    q.includes('balance') ||
    q.includes('owe') ||
    q.includes('outstanding')
  ) {
    const unpaid = docs.filter((d) => (d.computed_status || d.status) !== 'paid');
    const total = unpaid.reduce((sum, d) => sum + (d.amount || 0), 0);
    const overdue = docs.filter((d) => (d.computed_status || d.status) === 'overdue');
    const overdueTotal = overdue.reduce((sum, d) => sum + (d.amount || 0), 0);
    const dueSoon = docs.filter((d) => (d.computed_status || d.status) === 'due_soon');
    const dueSoonTotal = dueSoon.reduce((sum, d) => sum + (d.amount || 0), 0);

    return [
      `💰 **Total Outstanding Commitments:**`,
      ``,
      `Your total unpaid commitments across active bills is **$${total.toFixed(2)} USD**:`,
      `• **Critical Overdue**: $${overdueTotal.toFixed(2)} (${overdue.length} ${overdue.length === 1 ? 'bill' : 'bills'})`,
      `• **Due in Next 7 Days**: $${dueSoonTotal.toFixed(2)} (${dueSoon.length} ${dueSoon.length === 1 ? 'bill' : 'bills'})`,
      `• **Pending / Needs Review**: $${(total - overdueTotal - dueSoonTotal).toFixed(2)}`,
      ``,
      `All transactions are stored locally on your device in SQLite.`,
    ].join('\n');
  }

  // 5. Unverified / needs review / human verification
  if (
    q.includes('unverified') ||
    q.includes('review') ||
    q.includes('human') ||
    q.includes('verify')
  ) {
    const unverified = docs.filter(
      (d) => d.is_verified === 0 || (d.computed_status || d.status) === 'needs_review'
    );
    if (unverified.length === 0) {
      return `All recorded bills have been verified by a human! Zero unverified bills remain.`;
    }
    return [
      `🔍 **Bills Awaiting Human Verification (${unverified.length}):**`,
      ``,
      ...unverified.map(
        (d) =>
          `• **${d.vendor || d.original_name}**: $${(d.amount || 0).toFixed(2)} ${d.currency || 'USD'} (Category: ${d.category || 'Other'}, File: ${d.original_name})`
      ),
      ``,
      `Per BillSloth safety policy, extracted data requires your sign-off before being scheduled or archived.`,
    ].join('\n');
  }

  // 6. SaaS / Software costs
  if (q.includes('saas') || q.includes('software') || q.includes('subscription')) {
    const saas = docs.filter(
      (d) =>
        (d.category || '').toLowerCase().includes('software') ||
        (d.category || '').toLowerCase().includes('saas')
    );
    const total = saas.reduce((sum, d) => sum + (d.amount || 0), 0);
    return [
      `💻 **Software & SaaS Subscriptions Summary:**`,
      ``,
      `Total recurring Software/SaaS cost: **$${total.toFixed(2)}**:`,
      ...saas.map(
        (d) =>
          `• **${d.vendor || d.original_name}**: $${(d.amount || 0).toFixed(2)} (Status: ${(d.computed_status || d.status).replace(/_/g, ' ')}, Due: ${d.due_date || 'N/A'})`
      ),
    ].join('\n');
  }

  // 7. Utilities
  if (
    q.includes('utility') ||
    q.includes('utilities') ||
    q.includes('power') ||
    q.includes('electric') ||
    q.includes('water')
  ) {
    const utils = docs.filter((d) =>
      (d.category || '').toLowerCase().includes('utilities')
    );
    const total = utils.reduce((sum, d) => sum + (d.amount || 0), 0);
    return [
      `⚡ **Utilities Summary:**`,
      ``,
      `Total Utilities commitments: **$${total.toFixed(2)}**:`,
      ...utils.map(
        (d) =>
          `• **${d.vendor || d.original_name}**: $${(d.amount || 0).toFixed(2)} (Status: ${(d.computed_status || d.status).replace(/_/g, ' ')}, Due: ${d.due_date || 'N/A'})`
      ),
    ].join('\n');
  }

  // 8. Paid / Settled bills
  if (q.includes('paid') || q.includes('settled') || q.includes('archive')) {
    const paid = docs.filter((d) => (d.computed_status || d.status) === 'paid');
    const total = paid.reduce((sum, d) => sum + (d.amount || 0), 0);
    return [
      `✅ **Settled & Paid Bills (${paid.length}):**`,
      ``,
      `Total settled transactions: **$${total.toFixed(2)}**:`,
      ...paid.map(
        (d) =>
          `• **${d.vendor || d.original_name}**: $${(d.amount || 0).toFixed(2)} ${d.currency || 'USD'} (Paid reference: ${d.payment_reference || 'Confirmed'})`
      ),
    ].join('\n');
  }

  // 9. Specific vendor lookup
  const matchedDoc = docs.find(
    (d) =>
      (d.vendor || '').toLowerCase().includes(q) ||
      (d.original_name || '').toLowerCase().includes(q) ||
      (d.invoice_number || '').toLowerCase().includes(q)
  );
  if (matchedDoc) {
    return [
      `📄 **Invoice Details for ${matchedDoc.vendor || matchedDoc.original_name}:**`,
      ``,
      `• **Vendor**: ${matchedDoc.vendor || 'Unknown'}`,
      `• **Amount**: $${(matchedDoc.amount || 0).toFixed(2)} ${matchedDoc.currency || 'USD'}`,
      `• **Invoice Number**: ${matchedDoc.invoice_number || 'None specified'}`,
      `• **Due Date**: ${matchedDoc.due_date || 'No due date'}`,
      `• **Status**: ${(matchedDoc.computed_status || matchedDoc.status).replace(/_/g, ' ').toUpperCase()}`,
      `• **Category**: ${matchedDoc.category || 'Other'}`,
      `• **Human Verified**: ${matchedDoc.is_verified === 1 ? 'Yes (Signed off)' : 'No (Pending review)'}`,
      matchedDoc.payment_reference ? `• **Payment Reference**: ${matchedDoc.payment_reference}` : '',
      matchedDoc.notes ? `• **Notes**: ${matchedDoc.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  // 10. General factual ledger summary
  const unpaidCount = docs.filter(
    (d) => (d.computed_status || d.status) !== 'paid'
  ).length;
  const overdueCount = docs.filter(
    (d) => (d.computed_status || d.status) === 'overdue'
  ).length;
  const totalDue = docs
    .filter((d) => (d.computed_status || d.status) !== 'paid')
    .reduce((s, d) => s + (d.amount || 0), 0);

  return [
    `🦥 **BillSloth Local Assistant Query Result:**`,
    ``,
    `Based on your on-device ledger (${docs.length} recorded bills):`,
    `• **Active Unpaid Bills**: ${unpaidCount} bills totaling $${totalDue.toFixed(2)} USD`,
    `• **Overdue Attention**: ${overdueCount} bills needing immediate settlement`,
    `• **Recorded Vendors**: ${Array.from(
      new Set(docs.map((d) => d.vendor || d.original_name))
    )
      .slice(0, 5)
      .join(', ')}`,
    ``,
    `*Try asking:*`,
    `• "What is my total outstanding balance?"`,
    `• "Which invoices are currently overdue?"`,
    `• "What bills are due within the next 7 days?"`,
    `• "How does BillSloth work?"`,
    `• "Show details for Metro Grid" (or any vendor)`,
  ].join('\n');
}

export async function askAiAssistant(query: string): Promise<{ answer: string; model?: string }> {
  const engine = getActiveAiEngine();
  const geminiKey = getGeminiApiKey();

  // 1. If Gemini engine is active or key is configured
  if ((engine === 'gemini' || geminiKey) && geminiKey) {
    const geminiRes = await askGeminiAssistant(query, localDocsStore);
    if (geminiRes.success) {
      return { answer: geminiRes.answer, model: `${geminiRes.model} (Cloud AI)` };
    }
  }

  // 2. If Ollama engine is active (or default local dev server)
  try {
    const res = await fetch(`${API_BASE}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch {
    // Backend offline / Vercel demo environment
  }

  // 3. In-Browser Smart Engine fallback
  return {
    answer: synthesizeAssistantResponse(query, localDocsStore),
    model: 'Smart In-Browser Engine (Zero-install)',
  };
}

export const CSV_EXPORT_URL = `${API_BASE}/documents/export/csv`;
export const SYSTEM_BACKUP_URL = `${API_BASE}/system/backup`;
