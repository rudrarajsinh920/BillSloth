import {
  DocumentItem,
  ReminderItem,
  AuditLogItem,
  OllamaStatus,
  WeeklyDigestData,
} from '../types';

const API_BASE = '/api';

export async function fetchDocuments(params?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<DocumentItem[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE}/documents?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  const json = await res.json();
  return json.data || [];
}

export async function fetchDocumentById(id: string): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/documents/${id}`);
  if (!res.ok) throw new Error('Failed to fetch document');
  const json = await res.json();
  return json.data;
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Upload failed');
  return json.data;
}

export async function extractDocumentFields(
  id: string,
  textContent?: string,
  model?: string
): Promise<{ success: boolean; data?: DocumentItem; reason?: string; message?: string }> {
  const res = await fetch(`${API_BASE}/documents/${id}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text_content: textContent, model }),
  });
  const json = await res.json();
  return json;
}

export async function updateDocument(
  id: string,
  updates: Partial<DocumentItem>
): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update document');
  return json.data;
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || 'Failed to delete document');
  }
}

export async function fetchReminders(status?: string): Promise<ReminderItem[]> {
  const query = status ? `?status=${status}` : '';
  const res = await fetch(`${API_BASE}/reminders${query}`);
  if (!res.ok) throw new Error('Failed to fetch reminders');
  const json = await res.json();
  return json.data || [];
}

export async function createReminder(
  reminder: Omit<ReminderItem, 'id' | 'created_at' | 'status' | 'approved_at'>
): Promise<ReminderItem> {
  const res = await fetch(`${API_BASE}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reminder),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create reminder');
  return json.data;
}

export async function updateReminder(
  id: string,
  updates: Partial<ReminderItem>
): Promise<ReminderItem> {
  const res = await fetch(`${API_BASE}/reminders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update reminder');
  return json.data;
}

export async function discardReminder(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/reminders/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to discard reminder');
}

export async function fetchWeeklyDigest(): Promise<WeeklyDigestData> {
  const res = await fetch(`${API_BASE}/digest/weekly`);
  if (!res.ok) throw new Error('Failed to load weekly digest');
  const json = await res.json();
  return json.data;
}

export async function fetchAuditLogs(): Promise<AuditLogItem[]> {
  const res = await fetch(`${API_BASE}/audit-logs`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  const json = await res.json();
  return json.data || [];
}

export async function fetchOllamaStatus(): Promise<OllamaStatus> {
  const res = await fetch(`${API_BASE}/ai/status`);
  if (!res.ok) throw new Error('Failed to query local AI status');
  return res.json();
}

export async function loadSampleData(): Promise<void> {
  const res = await fetch(`${API_BASE}/sample-data/load`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed sample data');
}

export async function clearSampleData(): Promise<void> {
  const res = await fetch(`${API_BASE}/sample-data/clear`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to clear sample data');
}
