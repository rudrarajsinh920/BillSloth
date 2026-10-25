export type DocumentStatus = 'needs_review' | 'due_soon' | 'overdue' | 'paid' | 'approved';

export type BillCategory =
  | 'Utilities'
  | 'Software/SaaS'
  | 'Rent/Lease'
  | 'Telecom'
  | 'Insurance'
  | 'Supplies'
  | 'Professional Services'
  | 'Taxes'
  | 'Other';

export interface DocumentItem {
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
  category: BillCategory;
  status: DocumentStatus;
  computed_status?: DocumentStatus;
  is_verified: number; // 0 = unverified, 1 = human verified
  verified_at: string | null;
  is_sample: number;
  raw_text: string | null;
  extraction_metadata: string | null;
  payment_reference: string | null;
  notes: string | null;
  file_hash?: string | null;
  extraction_method?: 'pdf_text' | 'local_ocr' | 'manual' | 'sample' | string | null;
  ocr_confidence?: number | null;
  model_confidence?: string | null;
  validation_flags?: string | null;
  created_at: string;
  updated_at: string;
  reminders?: ReminderItem[];
  audit_logs?: AuditLogItem[];
}

export interface ReminderItem {
  id: string;
  document_id: string | null;
  title: string;
  reminder_date: string;
  message: string;
  status: 'pending_approval' | 'approved' | 'discarded';
  action_type: 'manual_draft' | 'calendar_ics' | 'notification';
  approved_at: string | null;
  created_at: string;
  vendor?: string | null;
  amount?: number | null;
  currency?: string;
  due_date?: string | null;
  doc_status?: DocumentStatus;
  is_sample?: number;
}

export interface AuditLogItem {
  id: string;
  document_id: string | null;
  action: string;
  details: string;
  timestamp: string;
}

export interface AiEngineStatus {
  available: boolean;
  engine: string;
  url?: string;
  models?: string[];
  activeModel?: string | null;
  error?: string;
}

export interface WeeklyDigestData {
  generated_at: string;
  metrics: {
    totalOutstanding: number;
    overdueCount: number;
    overdueAmount: number;
    dueSoonCount: number;
    dueSoonAmount: number;
    needsReviewCount: number;
    paidThisMonthAmount: number;
    pendingRemindersCount: number;
  };
  overdueBills: DocumentItem[];
  dueSoonBills: DocumentItem[];
  needsReviewBills: DocumentItem[];
  pendingReminders: ReminderItem[];
  markdown_digest: string;
}
