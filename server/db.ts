import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directories exist
const DATA_DIR = path.resolve(__dirname, '../data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const DB_PATH = path.resolve(DATA_DIR, 'billsloth.db');
export const db = new DatabaseSync(DB_PATH);

// Initialize database schema
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      vendor TEXT,
      invoice_number TEXT,
      amount REAL,
      currency TEXT DEFAULT 'USD',
      issue_date TEXT,
      due_date TEXT,
      category TEXT DEFAULT 'Other',
      status TEXT DEFAULT 'needs_review',
      is_verified INTEGER DEFAULT 0,
      verified_at TEXT,
      is_sample INTEGER DEFAULT 0,
      raw_text TEXT,
      extraction_metadata TEXT,
      payment_reference TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      document_id TEXT,
      title TEXT NOT NULL,
      reminder_date TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending_approval',
      action_type TEXT DEFAULT 'manual_draft',
      approved_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents (id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      document_id TEXT,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);
}

export function logAudit(action: string, documentId: string | null, details: Record<string, unknown>) {
  const id = 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const stmt = db.prepare(`
    INSERT INTO audit_logs (id, document_id, action, details, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, documentId, action, JSON.stringify(details), new Date().toISOString());
}

export { DATA_DIR, UPLOADS_DIR };
