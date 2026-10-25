import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { db, logAudit, UPLOADS_DIR } from './db.js';
import { checkOllamaStatus, extractWithLocalOllama, askBillSlothAssistant } from './ollama.js';
import { seedSampleData, clearSampleData } from './sampleData.js';
import { answerLedgerQuestion, LedgerBill } from '../src/api/ledgerAssistant.js';
import { format, isPast, isToday, differenceInDays } from 'date-fns';

const router = Router();

// Multer storage setup for local file retention
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG documents are supported.'));
    }
  },
});

export interface DocumentRow {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  file_path: string;
  vendor: string | null;
  invoice_number: string | null;
  amount: number | null;
  currency: string;
  issue_date: string | null;
  due_date: string | null;
  category: string;
  status: string;
  is_verified: number;
  verified_at: string | null;
  is_sample: number;
  raw_text: string | null;
  extraction_metadata: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  computed_status?: string;
}

export interface ReminderRow {
  id: string;
  document_id: string | null;
  title: string;
  reminder_date: string;
  message: string;
  status: string;
  action_type: string;
  approved_at: string | null;
  created_at: string;
  vendor?: string | null;
  amount?: number | null;
  currency?: string;
  due_date?: string | null;
}

// Helper to compute dynamic status based on due_date if not marked as 'paid' or 'needs_review'
function computeStatus(currentStatus: string, dueDateStr: string | null, isVerified: number): string {
  if (currentStatus === 'paid') return 'paid';
  if (isVerified === 0 && currentStatus === 'needs_review') return 'needs_review';
  if (!dueDateStr) return currentStatus || 'needs_review';

  try {
    const dueDate = new Date(dueDateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isPast(dueDate) && !isToday(dueDate)) {
      return 'overdue';
    }
    const daysDiff = differenceInDays(dueDate, today);
    if (daysDiff >= 0 && daysDiff <= 7) {
      return 'due_soon';
    }
    return currentStatus || 'approved';
  } catch {
    return currentStatus;
  }
}

// -------------------------------------------------------------
// AI STATUS ENDPOINT
// -------------------------------------------------------------
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'BillSloth', local: true, timestamp: new Date().toISOString() });
});

router.get('/ai/status', async (_req: Request, res: Response) => {
  const status = await checkOllamaStatus();
  res.json(status);
});

// -------------------------------------------------------------
// DOCUMENTS ENDPOINTS
// -------------------------------------------------------------

// List documents with optional filtering and search
router.get('/documents', (req: Request, res: Response) => {
  try {
    const { status, category, search } = req.query;

    let query = 'SELECT * FROM documents WHERE 1=1';
    const params: (string | number)[] = [];

    if (category && typeof category === 'string' && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search && typeof search === 'string') {
      query += ' AND (vendor LIKE ? OR invoice_number LIKE ? OR notes LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY due_date ASC, created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as unknown as DocumentRow[];

    // Compute dynamic status for each document
    const enriched = rows.map((doc: DocumentRow) => {
      const dynamicStatus = computeStatus(doc.status, doc.due_date, doc.is_verified);
      return {
        ...doc,
        computed_status: dynamicStatus,
      };
    });

    // If status filter is passed, filter on the computed status
    const filtered = status && typeof status === 'string' && status !== 'all'
      ? enriched.filter((d: DocumentRow) => d.computed_status === status || d.status === status)
      : enriched;

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// Get single document by ID
router.get('/documents/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM documents WHERE id = ?');
    const doc = stmt.get(id) as unknown as DocumentRow | undefined;

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const computed_status = computeStatus(doc.status, doc.due_date, doc.is_verified);

    // Fetch related reminders
    const remStmt = db.prepare('SELECT * FROM reminders WHERE document_id = ? ORDER BY reminder_date ASC');
    const reminders = remStmt.all(id);

    // Fetch related audit logs
    const auditStmt = db.prepare('SELECT * FROM audit_logs WHERE document_id = ? ORDER BY timestamp DESC LIMIT 20');
    const logs = auditStmt.all(id);

    res.json({
      success: true,
      data: {
        ...doc,
        computed_status,
        reminders,
        audit_logs: logs,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// Upload document (PDF, JPG, PNG)
router.post('/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    const newDoc = {
      id,
      filename: req.file.filename,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      file_path: req.file.path,
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
      raw_text: null,
      extraction_metadata: JSON.stringify({
        uploaded_at: now,
        needs_extraction: true,
        unverified_fields: [],
      }),
      payment_reference: null,
      notes: null,
      created_at: now,
      updated_at: now,
    };

    const insertStmt = db.prepare(`
      INSERT INTO documents (
        id, filename, original_name, mime_type, file_size, file_path,
        vendor, invoice_number, amount, currency, issue_date, due_date,
        category, status, is_verified, verified_at, is_sample, raw_text,
        extraction_metadata, payment_reference, notes, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    insertStmt.run(
      newDoc.id, newDoc.filename, newDoc.original_name, newDoc.mime_type, newDoc.file_size, newDoc.file_path,
      newDoc.vendor, newDoc.invoice_number, newDoc.amount, newDoc.currency, newDoc.issue_date, newDoc.due_date,
      newDoc.category, newDoc.status, newDoc.is_verified, newDoc.verified_at, newDoc.is_sample, newDoc.raw_text,
      newDoc.extraction_metadata, newDoc.payment_reference, newDoc.notes, newDoc.created_at, newDoc.updated_at
    );

    logAudit('DOCUMENT_IMPORTED', id, {
      filename: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    res.status(201).json({
      success: true,
      message: 'Document imported safely into local storage.',
      data: newDoc,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// Trigger local extraction
router.post('/documents/:id/extract', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text_content, model } = req.body;

    const stmt = db.prepare('SELECT * FROM documents WHERE id = ?');
    const doc = stmt.get(id) as unknown as DocumentRow | undefined;

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Check Ollama status
    const ollamaStatus = await checkOllamaStatus();
    if (!ollamaStatus.available) {
      logAudit('EXTRACTION_SKIPPED_OLLAMA_OFFLINE', id, { url: ollamaStatus.url });
      return res.status(503).json({
        success: false,
        reason: 'OLLAMA_OFFLINE',
        message: 'Ollama is not running at ' + ollamaStatus.url + '. Automatic local AI extraction requires a running local model. Please review and input fields manually, or start Ollama.',
      });
    }

    const textToExtract = text_content || doc.raw_text || doc.original_name;
    const result = await extractWithLocalOllama(textToExtract, model);

    if (!result.success || !result.data) {
      return res.status(422).json({
        success: false,
        reason: result.reason,
        message: result.error || 'Failed to extract fields.',
      });
    }

    const d = result.data;
    const now = new Date().toISOString();

    const updateStmt = db.prepare(`
      UPDATE documents SET
        vendor = COALESCE(?, vendor),
        invoice_number = COALESCE(?, invoice_number),
        amount = COALESCE(?, amount),
        currency = COALESCE(?, currency),
        issue_date = COALESCE(?, issue_date),
        due_date = COALESCE(?, due_date),
        category = COALESCE(?, category),
        raw_text = COALESCE(?, raw_text),
        extraction_metadata = ?,
        is_verified = 0,
        status = 'needs_review',
        updated_at = ?
      WHERE id = ?
    `);

    const metadata = JSON.stringify({
      extracted_at: now,
      model_used: result.modelUsed,
      unverified_fields: d.unverified_fields,
      notes: d.raw_notes,
    });

    updateStmt.run(
      d.vendor,
      d.invoice_number,
      d.amount,
      d.currency,
      d.issue_date,
      d.due_date,
      d.category,
      text_content || doc.raw_text,
      metadata,
      now,
      id
    );

    logAudit('FIELDS_EXTRACTED_UNVERIFIED', id, {
      model: result.modelUsed,
      unverified_fields: d.unverified_fields,
      vendor: d.vendor,
      amount: d.amount,
    });

    const updatedDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    res.json({
      success: true,
      message: 'Fields extracted locally. All fields are marked unverified until human review.',
      data: updatedDoc,
      extraction: result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// Update document details / human verification review
router.put('/documents/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      vendor,
      invoice_number,
      amount,
      currency,
      issue_date,
      due_date,
      category,
      status,
      is_verified,
      payment_reference,
      notes,
    } = req.body;

    const existingStmt = db.prepare('SELECT * FROM documents WHERE id = ?');
    const existing = existingStmt.get(id) as unknown as DocumentRow | undefined;

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const now = new Date().toISOString();
    const verifiedVal = is_verified !== undefined ? (is_verified ? 1 : 0) : existing.is_verified;
    const verifiedAt = verifiedVal === 1 && !existing.verified_at ? now : (verifiedVal === 0 ? null : existing.verified_at);

    const updateStmt = db.prepare(`
      UPDATE documents SET
        vendor = ?,
        invoice_number = ?,
        amount = ?,
        currency = ?,
        issue_date = ?,
        due_date = ?,
        category = ?,
        status = ?,
        is_verified = ?,
        verified_at = ?,
        payment_reference = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ?
    `);

    updateStmt.run(
      vendor !== undefined ? vendor : existing.vendor,
      invoice_number !== undefined ? invoice_number : existing.invoice_number,
      amount !== undefined ? (amount === null || amount === '' ? null : Number(amount)) : existing.amount,
      currency || existing.currency || 'USD',
      issue_date !== undefined ? issue_date : existing.issue_date,
      due_date !== undefined ? due_date : existing.due_date,
      category || existing.category || 'Other',
      status || existing.status || 'needs_review',
      verifiedVal,
      verifiedAt,
      payment_reference !== undefined ? payment_reference : existing.payment_reference,
      notes !== undefined ? notes : existing.notes,
      now,
      id
    );

    logAudit('DOCUMENT_UPDATED', id, {
      changes: req.body,
      is_verified: verifiedVal,
      timestamp: now,
    });

    const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as unknown as DocumentRow;
    res.json({
      success: true,
      data: {
        ...updated,
        computed_status: computeStatus(updated.status, updated.due_date, updated.is_verified),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// Delete document record (Data safety rule: Never automatically delete original documents from disk)
router.delete('/documents/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as unknown as DocumentRow | undefined;

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Delete associated reminders
    db.prepare('DELETE FROM reminders WHERE document_id = ?').run(id);

    // Delete document record
    db.prepare('DELETE FROM documents WHERE id = ?').run(id);

    // Note in audit log that physical file remains intact
    logAudit('DOCUMENT_ARCHIVED_RECORD_REMOVED', id, {
      original_name: existing.original_name,
      retained_path: existing.file_path,
      note: 'Per data safety policy, original physical document file is preserved locally.',
    });

    res.json({
      success: true,
      message: 'Document record deleted. Original file safely preserved in local storage.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// -------------------------------------------------------------
// REMINDERS ENDPOINTS (HUMAN-IN-THE-LOOP APPROVAL)
// -------------------------------------------------------------

// List reminders
router.get('/reminders', (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT r.*, d.vendor, d.amount, d.currency, d.due_date, d.status as doc_status, d.is_sample
      FROM reminders r
      LEFT JOIN documents d ON r.document_id = d.id
      WHERE 1=1
    `;
    const params: string[] = [];

    if (status && typeof status === 'string' && status !== 'all') {
      query += ' AND r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.reminder_date ASC, r.created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);

    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// Create reminder
router.post('/reminders', (req: Request, res: Response) => {
  try {
    const { document_id, title, reminder_date, message, action_type } = req.body;

    if (!title || !reminder_date || !message) {
      return res.status(400).json({ success: false, error: 'Title, reminder date, and message are required.' });
    }

    const id = 'rem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO reminders (id, document_id, title, reminder_date, message, status, action_type, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending_approval', ?, ?)
    `);

    insertStmt.run(id, document_id || null, title, reminder_date, message, action_type || 'manual_draft', now);

    logAudit('REMINDER_PREPARED', document_id || null, { reminder_id: id, title, reminder_date });

    const created = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: created });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// Update reminder (Edit, Approve, Discard)
router.put('/reminders/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, reminder_date, message, status, action_type } = req.body;

    const existing = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id) as unknown as ReminderRow | undefined;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Reminder not found' });
    }

    const isNowApproved = status === 'approved';
    const approvedAt = isNowApproved ? new Date().toISOString() : existing.approved_at;

    const updateStmt = db.prepare(`
      UPDATE reminders SET
        title = ?,
        reminder_date = ?,
        message = ?,
        status = ?,
        action_type = ?,
        approved_at = ?
      WHERE id = ?
    `);

    updateStmt.run(
      title !== undefined ? title : existing.title,
      reminder_date !== undefined ? reminder_date : existing.reminder_date,
      message !== undefined ? message : existing.message,
      status || existing.status,
      action_type || existing.action_type,
      approvedAt,
      id
    );

    logAudit(`REMINDER_${status ? status.toUpperCase() : 'UPDATED'}`, existing.document_id, {
      reminder_id: id,
      new_status: status,
    });

    const updated = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// Delete / Discard reminder
router.delete('/reminders/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id) as unknown as ReminderRow | undefined;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Reminder not found' });
    }

    db.prepare('DELETE FROM reminders WHERE id = ?').run(id);

    logAudit('REMINDER_DISCARDED', existing.document_id, { reminder_id: id });

    res.json({ success: true, message: 'Reminder discarded.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// Export calendar .ICS file for approved reminder
router.get('/reminders/:id/ics', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rem = db.prepare(`
      SELECT r.*, d.vendor, d.amount, d.currency, d.due_date
      FROM reminders r
      LEFT JOIN documents d ON r.document_id = d.id
      WHERE r.id = ?
    `).get(id) as unknown as ReminderRow | undefined;

    if (!rem) {
      return res.status(404).json({ success: false, error: 'Reminder not found' });
    }

    const dateCompact = (rem.reminder_date || format(new Date(), 'yyyy-MM-dd')).replace(/-/g, '');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BillSloth//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:billsloth-${rem.id}@local`,
      `DTSTAMP:${dateCompact}T090000Z`,
      `DTSTART;VALUE=DATE:${dateCompact}`,
      `SUMMARY:${rem.title.replace(/[,;]/g, ' ')}`,
      `DESCRIPTION:${rem.message.replace(/\n/g, '\\n')}`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="billsloth-reminder-${rem.id}.ics"`);
    res.send(icsContent);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// -------------------------------------------------------------
// WEEKLY DIGEST ENDPOINT
// -------------------------------------------------------------
router.get('/digest/weekly', (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const docs = db.prepare('SELECT * FROM documents').all() as unknown as DocumentRow[];
    const reminders = db.prepare(`
      SELECT r.*, d.vendor, d.amount, d.currency
      FROM reminders r
      LEFT JOIN documents d ON r.document_id = d.id
      WHERE r.status = 'pending_approval'
    `).all() as unknown as ReminderRow[];

    let totalOutstanding = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let dueSoonCount = 0;
    let dueSoonAmount = 0;
    let needsReviewCount = 0;
    let paidThisMonthAmount = 0;

    const overdueBills: DocumentRow[] = [];
    const dueSoonBills: DocumentRow[] = [];
    const needsReviewBills: DocumentRow[] = [];

    for (const d of docs) {
      const computed = computeStatus(d.status, d.due_date, d.is_verified);
      const amountVal = d.amount || 0;

      if (computed !== 'paid') {
        totalOutstanding += amountVal;
      } else {
        paidThisMonthAmount += amountVal;
      }

      if (computed === 'overdue') {
        overdueCount++;
        overdueAmount += amountVal;
        overdueBills.push(d);
      } else if (computed === 'due_soon') {
        dueSoonCount++;
        dueSoonAmount += amountVal;
        dueSoonBills.push(d);
      } else if (computed === 'needs_review') {
        needsReviewCount++;
        needsReviewBills.push(d);
      }
    }

    const digestText = [
      `# 🦥 BillSloth Weekly Financial Calm Digest`,
      `*Generated on ${format(new Date(), 'EEEE, MMMM d, yyyy')} • 100% Local Intelligence*`,
      ``,
      `### Summary Overview`,
      `- **Total Outstanding Balance**: $${totalOutstanding.toFixed(2)}`,
      `- **Overdue Invoices**: ${overdueCount} ($${overdueAmount.toFixed(2)})`,
      `- **Due Next 7 Days**: ${dueSoonCount} ($${dueSoonAmount.toFixed(2)})`,
      `- **Documents Needing Human Review**: ${needsReviewCount}`,
      `- **Reminders Awaiting Human Approval**: ${reminders.length}`,
      ``,
      `### Action Items For This Week`,
      ...(overdueBills.length > 0
        ? [
            `**CRITICAL OVERDUE:**`,
            ...overdueBills.map(
              (b) => `  - [ ] **${b.vendor || 'Unknown Vendor'}**: $${(b.amount || 0).toFixed(2)} ${b.currency} (Due: ${b.due_date || 'No Date'})`
            ),
          ]
        : [`*No overdue bills. You are in a clear state!*`]),
      ``,
      ...(dueSoonBills.length > 0
        ? [
            `**DUE THIS COMING WEEK:**`,
            ...dueSoonBills.map(
              (b) => `  - [ ] **${b.vendor || 'Unknown Vendor'}**: $${(b.amount || 0).toFixed(2)} ${b.currency} (Due: ${b.due_date})`
            ),
          ]
        : [`*No imminent bills due within the next 7 days.*`]),
      ``,
      ...(needsReviewBills.length > 0
        ? [
            `**DOCUMENTS REQUIRING VERIFICATION:**`,
            ...needsReviewBills.map(
              (b) => `  - [ ] Review extraction for **${b.vendor || b.original_name}** ($${(b.amount || 0).toFixed(2)})`
            ),
          ]
        : []),
    ].join('\n');

    res.json({
      success: true,
      data: {
        generated_at: new Date().toISOString(),
        metrics: {
          totalOutstanding,
          overdueCount,
          overdueAmount,
          dueSoonCount,
          dueSoonAmount,
          needsReviewCount,
          paidThisMonthAmount,
          pendingRemindersCount: reminders.length,
        },
        overdueBills,
        dueSoonBills,
        needsReviewBills,
        pendingReminders: reminders,
        markdown_digest: digestText,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// -------------------------------------------------------------
// AUDIT LOGS ENDPOINT
// -------------------------------------------------------------
router.get('/audit-logs', (_req: Request, res: Response) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50').all();
    res.json({ success: true, data: logs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// -------------------------------------------------------------
// SAMPLE DATA ACTIONS
// -------------------------------------------------------------
router.post('/sample-data/load', (_req: Request, res: Response) => {
  try {
    seedSampleData();
    res.json({ success: true, message: 'Illustrative sample data loaded.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

router.post('/sample-data/clear', (_req: Request, res: Response) => {
  try {
    const count = clearSampleData(true);
    res.json({ success: true, message: `Cleared ${count} sample items.` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// -------------------------------------------------------------
// NATURAL LANGUAGE LOCAL AI ASSISTANT ("Ask BillSloth")
// -------------------------------------------------------------
router.post('/ai/ask', async (req: Request, res: Response) => {
  try {
    const query = req.body.query || req.body.question;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, error: 'Query prompt is required' });
    }

    // Fetch real documents from the SQLite database
    const rows = db.prepare(`
      SELECT id, vendor, invoice_number, amount, currency, issue_date, due_date, status, category, is_verified, payment_reference, notes, original_name
      FROM documents 
      ORDER BY due_date ASC, created_at DESC
    `).all() as unknown as DocumentRow[];

    const enrichedBills: LedgerBill[] = rows.map((doc: DocumentRow) => ({
      id: doc.id,
      vendor: doc.vendor,
      invoice_number: doc.invoice_number,
      amount: doc.amount,
      currency: doc.currency || 'USD',
      issue_date: doc.issue_date,
      due_date: doc.due_date,
      status: doc.status,
      computed_status: computeStatus(doc.status, doc.due_date, doc.is_verified),
      category: doc.category || 'Other',
      is_verified: doc.is_verified,
      payment_reference: doc.payment_reference,
      notes: doc.notes,
      original_name: doc.original_name,
    }));

    // Compute deterministic, intent-aware ledger answer
    const ledgerResult = answerLedgerQuestion(query.trim(), enrichedBills);

    // If query is an open-ended generative request (like drafting an email) and Ollama is online,
    // we can enrich with Ollama generation; otherwise, ledgerResult is 100% accurate and immediate!
    const ollamaStatus = await checkOllamaStatus();
    let finalAnswer = ledgerResult.answer;

    if (ollamaStatus.available && ledgerResult.intent === 'draft_email') {
      const summaryRows = enrichedBills.map((d) =>
        `- Vendor: ${d.vendor || 'Unknown'}, Amount: ${d.amount || 0} ${d.currency}, Due: ${d.due_date || 'No Date'}, Status: ${d.computed_status}, Category: ${d.category}`
      );
      const contextText = summaryRows.join('\n') || 'No bills recorded.';
      const aiResult = await askBillSlothAssistant(query.trim(), contextText);
      if (aiResult.success && aiResult.answer) {
        finalAnswer = aiResult.answer;
      }
    }

    logAudit('AI_ASSISTANT_QUERY', null, { query: query.trim(), intent: ledgerResult.intent });

    res.json({
      success: true,
      answer: finalAnswer,
      intent: ledgerResult.intent,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// -------------------------------------------------------------
// CSV ACCOUNTING EXPORT
// -------------------------------------------------------------
router.get('/documents/export/csv', (_req: Request, res: Response) => {
  try {
    const docs = db.prepare('SELECT * FROM documents ORDER BY due_date ASC').all() as Array<Record<string, unknown>>;

    const headers = [
      'ID',
      'Vendor',
      'InvoiceNumber',
      'Amount',
      'Currency',
      'Category',
      'Status',
      'HumanVerified',
      'IssueDate',
      'DueDate',
      'PaymentReference',
      'Notes',
      'CreatedAt'
    ];

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvLines = [headers.join(',')];
    docs.forEach((doc) => {
      const line = [
        escapeCsv(doc.id),
        escapeCsv(doc.vendor),
        escapeCsv(doc.invoice_number),
        escapeCsv(doc.amount),
        escapeCsv(doc.currency),
        escapeCsv(doc.category),
        escapeCsv(doc.status),
        escapeCsv(doc.is_verified === 1 ? 'YES' : 'NO'),
        escapeCsv(doc.issue_date),
        escapeCsv(doc.due_date),
        escapeCsv(doc.payment_reference),
        escapeCsv(doc.notes),
        escapeCsv(doc.created_at),
      ].join(',');
      csvLines.push(line);
    });

    const csvContent = csvLines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="billsloth-ledger-${format(new Date(), 'yyyy-MM-dd')}.csv"`);
    res.send(csvContent);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// -------------------------------------------------------------
// LOCAL SYSTEM BACKUP
// -------------------------------------------------------------
router.get('/system/backup', (_req: Request, res: Response) => {
  try {
    const documents = db.prepare('SELECT * FROM documents').all();
    const reminders = db.prepare('SELECT * FROM reminders').all();
    const audit_logs = db.prepare('SELECT * FROM audit_logs').all();

    const backupPayload = {
      app: 'BillSloth',
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      counts: {
        documents: documents.length,
        reminders: reminders.length,
        audit_logs: audit_logs.length,
      },
      data: {
        documents,
        reminders,
        audit_logs,
      },
    };

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="billsloth-backup-${format(new Date(), 'yyyy-MM-dd')}.json"`);
    res.json(backupPayload);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
