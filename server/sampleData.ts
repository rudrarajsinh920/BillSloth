import { db, logAudit } from './db.js';
import { format, addDays, subDays } from 'date-fns';

export function seedSampleData() {
  // Clear any existing sample data first
  clearSampleData(false);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const overdueDate = format(subDays(today, 4), 'yyyy-MM-dd');
  const dueSoonDate = format(addDays(today, 3), 'yyyy-MM-dd');
  const dueNextWeekDate = format(addDays(today, 6), 'yyyy-MM-dd');
  const paidDate = format(subDays(today, 12), 'yyyy-MM-dd');
  const needsReviewDate = format(addDays(today, 5), 'yyyy-MM-dd');

  const sampleBills = [
    {
      id: 'sample_bill_1',
      filename: 'sample_metro_power_oct2026.pdf',
      original_name: 'Metro_Grid_Electric_Statement.pdf',
      mime_type: 'application/pdf',
      file_size: 142800,
      file_path: 'samples/Metro_Grid_Electric_Statement.pdf',
      vendor: 'Metro Grid Power & Light',
      invoice_number: 'MG-77491-OCT',
      amount: 142.50,
      currency: 'USD',
      issue_date: format(subDays(today, 24), 'yyyy-MM-dd'),
      due_date: overdueDate,
      category: 'Utilities',
      status: 'overdue',
      is_verified: 1,
      verified_at: new Date().toISOString(),
      is_sample: 1,
      raw_text: 'METRO GRID POWER & LIGHT\nAccount # 992-1082-11\nInvoice: MG-77491-OCT\nTotal Due: $142.50\nDue Date: ' + overdueDate,
      extraction_metadata: JSON.stringify({
        source: 'sample',
        verified: true,
        unverified_fields: [],
      }),
      payment_reference: 'ACH autopay disabled by customer',
      notes: 'Sample overdue utility statement. Immediate human review recommended.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample_bill_2',
      filename: 'sample_cloudscale_infra.pdf',
      original_name: 'CloudScale_Platform_Invoice_Oct.pdf',
      mime_type: 'application/pdf',
      file_size: 98400,
      file_path: 'samples/CloudScale_Platform_Invoice_Oct.pdf',
      vendor: 'CloudScale Systems',
      invoice_number: 'CS-90214-INV',
      amount: 289.00,
      currency: 'USD',
      issue_date: format(subDays(today, 15), 'yyyy-MM-dd'),
      due_date: dueSoonDate,
      category: 'Software/SaaS',
      status: 'due_soon',
      is_verified: 1,
      verified_at: new Date().toISOString(),
      is_sample: 1,
      raw_text: 'CloudScale Systems Inc.\nMonthly Dedicated VPS & Backup Storage\nAmount: $289.00 USD\nDue Date: ' + dueSoonDate,
      extraction_metadata: JSON.stringify({
        source: 'sample',
        verified: true,
        unverified_fields: [],
      }),
      payment_reference: 'Primary Business Visa ending in 4108',
      notes: 'Monthly infrastructure bill. Due in 3 days.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample_bill_3',
      filename: 'sample_apex_coworking_scan.jpg',
      original_name: 'Apex_Lease_Receipt_Oct.jpg',
      mime_type: 'image/jpeg',
      file_size: 450120,
      file_path: 'samples/Apex_Lease_Receipt_Oct.jpg',
      vendor: 'Apex Coworking & Offices',
      invoice_number: null, // intentionally missing to demonstrate unverified state!
      amount: 850.00,
      currency: 'USD',
      issue_date: format(subDays(today, 10), 'yyyy-MM-dd'),
      due_date: needsReviewDate,
      category: 'Rent/Lease',
      status: 'needs_review',
      is_verified: 0,
      verified_at: null,
      is_sample: 1,
      raw_text: 'APEX DESK & OFFICE LEASE\nMonthly private studio charge\nTotal: $850.00 USD\nPayment required by ' + needsReviewDate,
      extraction_metadata: JSON.stringify({
        source: 'local_ocr_pending',
        unverified_fields: ['vendor', 'amount', 'due_date', 'category'],
        missing_fields: ['invoice_number'],
      }),
      payment_reference: null,
      notes: 'Unverified sample document. Invoice number was not found in receipt text; human verification required.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample_bill_4',
      filename: 'sample_horizon_telecom.png',
      original_name: 'Horizon_Fiber_Bill_Statement.png',
      mime_type: 'image/png',
      file_size: 212400,
      file_path: 'samples/Horizon_Fiber_Bill_Statement.png',
      vendor: 'Horizon Fiber Telecom',
      invoice_number: 'HZ-41829',
      amount: 95.00,
      currency: 'USD',
      issue_date: format(subDays(today, 8), 'yyyy-MM-dd'),
      due_date: dueNextWeekDate,
      category: 'Telecom',
      status: 'needs_review',
      is_verified: 0,
      verified_at: null,
      is_sample: 1,
      raw_text: 'Horizon Fiber Gigabit Commercial\nInvoice #HZ-41829\nBalance: $95.00\nPayment due: ' + dueNextWeekDate,
      extraction_metadata: JSON.stringify({
        source: 'sample_extraction',
        unverified_fields: ['vendor', 'invoice_number', 'amount', 'due_date'],
      }),
      payment_reference: null,
      notes: 'Awaiting human review of line item charges before scheduling approval.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample_bill_5',
      filename: 'sample_datadog_paid.pdf',
      original_name: 'Datadog_Subscription_Receipt.pdf',
      mime_type: 'application/pdf',
      file_size: 84200,
      file_path: 'samples/Datadog_Subscription_Receipt.pdf',
      vendor: 'Datadog Observability',
      invoice_number: 'DD-90123',
      amount: 75.20,
      currency: 'USD',
      issue_date: format(subDays(today, 25), 'yyyy-MM-dd'),
      due_date: paidDate,
      category: 'Software/SaaS',
      status: 'paid',
      is_verified: 1,
      verified_at: format(subDays(today, 10), 'yyyy-MM-dd'),
      is_sample: 1,
      raw_text: 'Datadog Inc.\nInvoice DD-90123\nPaid in full: $75.20\nConfirmation #REC-88410',
      extraction_metadata: JSON.stringify({
        source: 'sample',
        verified: true,
        unverified_fields: [],
      }),
      payment_reference: 'Paid via Card ending in 4108',
      notes: 'Paid and archived for monthly bookkeeping.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const docInsert = db.prepare(`
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

  for (const doc of sampleBills) {
    docInsert.run(
      doc.id, doc.filename, doc.original_name, doc.mime_type, doc.file_size, doc.file_path,
      doc.vendor, doc.invoice_number, doc.amount, doc.currency, doc.issue_date, doc.due_date,
      doc.category, doc.status, doc.is_verified, doc.verified_at, doc.is_sample, doc.raw_text,
      doc.extraction_metadata, doc.payment_reference, doc.notes, doc.created_at, doc.updated_at
    );
  }

  // Sample Reminders prepared for human approval
  const sampleReminders = [
    {
      id: 'rem_sample_1',
      document_id: 'sample_bill_1',
      title: 'Urgent Overdue Notice: Metro Grid Power ($142.50)',
      reminder_date: todayStr,
      message: 'Metro Grid Power & Light bill ($142.50) was due on ' + overdueDate + ' and is 4 days overdue. Approve to copy payment memo and schedule settlement.',
      status: 'pending_approval',
      action_type: 'manual_draft',
      created_at: new Date().toISOString(),
    },
    {
      id: 'rem_sample_2',
      document_id: 'sample_bill_2',
      title: 'Upcoming Due Date: CloudScale Systems ($289.00)',
      reminder_date: format(subDays(new Date(dueSoonDate), 1), 'yyyy-MM-dd'),
      message: 'CloudScale Systems invoice #CS-90214-INV ($289.00) is due in 3 days on ' + dueSoonDate + '. Approve to export to calendar or draft reminder.',
      status: 'pending_approval',
      action_type: 'calendar_ics',
      created_at: new Date().toISOString(),
    },
    {
      id: 'rem_sample_3',
      document_id: 'sample_bill_3',
      title: 'Human Review Needed: Apex Coworking Lease ($850.00)',
      reminder_date: todayStr,
      message: 'Apex Coworking receipt scan was extracted with missing invoice number. Review and verify fields before due date ' + needsReviewDate + '.',
      status: 'pending_approval',
      action_type: 'notification',
      created_at: new Date().toISOString(),
    },
  ];

  const remInsert = db.prepare(`
    INSERT INTO reminders (
      id, document_id, title, reminder_date, message, status, action_type, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const rem of sampleReminders) {
    remInsert.run(
      rem.id, rem.document_id, rem.title, rem.reminder_date, rem.message, rem.status, rem.action_type, rem.created_at
    );
  }

  logAudit('SAMPLE_DATA_LOADED', null, {
    count: sampleBills.length,
    reminders: sampleReminders.length,
    timestamp: new Date().toISOString(),
  });
}

export function clearSampleData(log = true) {
  const remStmt = db.prepare(`
    DELETE FROM reminders WHERE document_id IN (
      SELECT id FROM documents WHERE is_sample = 1
    )
  `);
  remStmt.run();

  const docStmt = db.prepare(`DELETE FROM documents WHERE is_sample = 1`);
  const result = docStmt.run();

  if (log) {
    logAudit('SAMPLE_DATA_CLEARED', null, {
      cleared: true,
      timestamp: new Date().toISOString(),
    });
  }

  return result.changes;
}
