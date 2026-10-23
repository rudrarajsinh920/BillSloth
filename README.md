# 🦥 BillSloth
> **"Stop chasing bills. Know what needs attention."**  
> *A local-first AI bill and invoice organizer built for Hacktoberfest Week 3, "Slow and Steady."*

BillSloth imports invoices, utility bills, receipts, and payment reminders; extracts financial fields using open-weight models running on local hardware (Ollama); tracks due dates; and prepares reminders for human approval.

---

## 🛡️ Data Safety & Privacy Guarantees

1. **Zero Cloud AI Transmission**: Your financial documents, amounts, vendor names, and statements are **never uploaded to external cloud APIs** (no OpenAI, no Anthropic, no cloud OCR).
2. **Human-in-the-Loop Verification**: All extracted values are flagged as `Unverified` until validated by a human. No automatic email sending or bank payments are ever executed.
3. **Local File Retention**: Original documents (PDF, JPG, PNG) are retained in local disk storage (`./data/uploads/`) and **never automatically deleted**, even when an invoice record is archived.
4. **Factual Extraction**: Local models are instructed not to hallucinate missing amounts, currencies, or due dates. Missing fields are explicitly marked as `<Missing / Needs Review>`.
5. **Full Audit Trail**: Every action (import, local parsing attempt, field verification, status update, reminder approval) is recorded in local SQLite audit logs.

---

## 🎨 Design System

Polished, calm finance productivity application using the Hacktoberfest "Slow and Steady" design specifications:

- **Deep navy**: `#111827` (Text, high-contrast dark accents)
- **Electric blue**: `#2563EB` (Primary buttons, active states, key focal points)
- **Cool background**: `#F3F6FA` (Application backdrop)
- **White cards**: `#FFFFFF` (Restrained elevation surfaces)
- **Slate borders**: `#E2E8F0` (Subtle boundary dividers)
- **Amber warnings**: `#D97706` (Due soon, unverified fields, needs review)
- **Red overdue indicators**: `#DC2626` (Overdue bills, urgent alerts)
- **Green paid indicators**: `#15803D` (Paid invoices, confirmed verifications)
- **Typography**: Inter / Geist font with monospace tabular numerals for amounts and dates.

---

## 🚀 Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend API**: Node.js 24 ESM, Express, Multer
- **Database**: Native Node 24 SQLite (`node:sqlite`) with persistent `./data/billsloth.db`
- **AI Integration**: Modular local Ollama client (`http://127.0.0.1:11434`), supporting vision and text models (`llama3.2-vision`, `mistral`, `llama3`, `phi3`) with offline diagnostics.

---

## 📦 Phase 1 Features

### 1. Dashboard
- **Summary KPI Cards**: Total Outstanding balance, Overdue amount, Due in 7 Days, and Needs Review count.
- **Categorized Sections**:
  - **Overdue Invoices**: Visual red alert with days overdue, amount, vendor, and quick "Mark Paid" / "Prepare Reminder" actions.
  - **Due Soon (Next 7–14 Days)**: Amber badge, countdown, and upcoming cash flow schedule.
  - **Needs Human Review**: Amber callout highlighting unverified or missing extracted fields with a "Review & Verify" CTA.
  - **Settled & Paid**: Archived list of completed payments with payment references and timestamps.

### 2. Document Import Screen
- Drag-and-drop zone supporting **PDF**, **JPG**, and **PNG** (up to 25MB).
- Privacy pledge badge: *"100% Local-First Processing — Documents never leave this device."*
- Immediate local disk indexing to `./data/uploads/`.
- Instant transition to review drawer upon import.

### 3. Invoice Details Review Form
- Vendor / Payee input (with Unverified / Verified badge indicator).
- Invoice / Bill Number input (with Missing / Not Found tag).
- Amount & Currency selector (USD, EUR, GBP, CAD, AUD, JPY, CHF).
- Category selector (Utilities, Software/SaaS, Rent/Lease, Telecom, Insurance, Supplies, Professional Services, Taxes, Other).
- Issue Date and Payment Due Date pickers.
- Workflow status selector (Needs Review, Due Soon, Overdue, Approved, Paid).
- Human verification checkbox (*"Mark as Verified — Approved by Human"*).
- Private notes and payment references (e.g. Card ending in 4108, ACH confirmation).
- Local Ollama AI extraction trigger with connection status.
- Document audit trail showing timeline of changes.

### 4. Document Ledger
- Search bar (by vendor, invoice number, notes).
- Status filter pills: *All Bills*, *Needs Review*, *Due Soon*, *Overdue*, *Paid*.
- Category filter dropdown.
- Sort controls by Due Date, Amount, or Vendor (ASC/DESC).
- Monospace tabular financial figures.
- Row action triggers: Mark Paid, Prepare Reminder, Review Details, Archive Record.

### 5. Reminders & Approvals Hub
- Human-in-the-loop reminder drafts awaiting approval.
- Actions: **Edit**, **Approve**, **Discard**.
- **Export .ICS Calendar File**: Downloads standard RFC 5545 calendar event for any approved reminder.
- Copy text memo to clipboard.
- Prepare custom reminder linked to any bill.

### 6. Weekly Financial Calm Digest
- "Slow and steady" financial calm forecast.
- Summary of cash flow needs for the upcoming week.
- Checklist of overdue invoices and unverified bills.
- Exportable Markdown digest for personal notes, offline journals, or task managers.

### 7. Clear States & Local Model Controls
- Live local AI status pill in navbar (Green = Ollama Connected, Amber = Ollama Offline).
- Ollama Setup modal with CLI commands (`ollama serve`, `ollama pull llama3.2`).
- Illustrative Sample Data toggle (*"Load Sample Data"* / *"Clear Sample Data"*).
- Loading states and error banners.

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development
```bash
npm run dev
```
- **Web UI**: [http://localhost:5173](http://localhost:5173) (Vite frontend proxied to API)
- **Local API**: [http://127.0.0.1:3001](http://127.0.0.1:3001)

### 3. Type Check & Lint
```bash
npm run typecheck
npm run lint
```

### 4. Build for Production
```bash
npm run build
npm run server:start
```

---

## 🦥 Connect Local AI (Optional)
To enable automatic local field extraction with Ollama:
```bash
ollama serve
ollama pull llama3.2
```
*Note: If Ollama is not running, BillSloth will continue running with full manual review capabilities without falsely simulating AI extraction.*
