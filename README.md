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

Polished, calm fintech interface combining a **Light-First application experience** with a signature **Cinematic Dark Mascot Intro**:

### Light-First Application Theme
- **Main page background**: `#F7F8F5` (warm, calm off-white)
- **Elevated cards**: `#FFFFFF` with `#DCE4E5` subtle borders
- **Primary typography**: `#172A35` (deep navy headings and key metrics)
- **Secondary typography**: `#526572` (calm readable slate)
- **Primary action teal**: `#087F8C` with `#066873` hover and `#DDF5F6` soft surfaces
- **Status indicators**:
  - **Success / Verified**: `#087F5B` text on `#DDF7EF`
  - **Upcoming Deadlines**: `#854D0E` text on `#FFF0CC`
  - **Critical Overdue**: `#BE123C` text on `#FFE4E6`
  - **Secondary AI accent**: `#6D5CE8`

### Cinematic Dark Intro (The Teddy Sloth Walk)
- **Deep navy backdrop**: `#0B1724`
- **Dark glass panels**: `#142536` with `#35D6C3` teal highlight
- **Warm text**: `#F5F8FA` and `#AABBC9`

---

## 🚀 Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend API**: Node.js 24 ESM, Express, Multer
- **Database**: Native Node 24 SQLite (`node:sqlite`) with persistent `./data/billsloth.db`
- **Local AI & Extraction**:
  - **Inference Runtime**: Local Ollama (`http://127.0.0.1:11434`) running `gemma2:2b` (open-weight Gemma 2 model).
  - **Local PDF Parser**: `pdf-parse` for deterministic embedded text extraction.
  - **Local OCR Engine**: `tesseract.js` for on-device receipt/scanned image OCR.
  - **Hashing**: `node:crypto` SHA-256 content hashing for duplicate protection.

---

## 📦 Phase 2 Completed Features & Verification

Phase 2 implemented full-stack on-device document extraction and structured inference using **Gemma 2 2B**:

### 1. Two-Stage Privacy-First Local Pipeline
1. **Stage 1 (Local Text Extraction)**:
   - **Digital PDFs**: Embedded text extracted directly via `pdf-parse` (95% advisory confidence).
   - **Scanned Receipts & Images (PNG/JPG)**: Extracted on-device via local `tesseract.js` worker (measured engine confidence).
   - **Zero Cloud Leaks**: 100% on-device processing; zero network packets sent to external AI APIs.
2. **Stage 2 (Local LLM Structuring & Grounding)**:
   - Formulates strict JSON extraction requests sent to local Ollama running `gemma2:2b`.
   - Extracts: Vendor, Invoice Number, Amount, Currency, Issue Date, Due Date, Category, Payment Status.
   - Non-hallucinatory: Missing fields return `null` and are flagged for human review.

### 2. Validation & Advisory Confidence
- **Grounding Heuristic**: Verifies extracted values against source text (0.92–0.95 if found verbatim, 0.65–0.70 if inferred, 0.0 if missing).
- **Validation Flags**: Automatically flags `MISSING_DUE_DATE`, `MISSING_AMOUNT`, `MISSING_VENDOR`, `MISSING_INVOICE_NUMBER`, `INCONSISTENT_DATES`, and `UNVERIFIED`.
- **Advisory Status**: Confidence values are documented as advisory cues to guide human attention, not proof of correctness.

### 3. Duplicate Protection & Audit Trail
- **SHA-256 Content Hashing**: Identical file imports return `HTTP 409 Conflict` with the matched document ID and upload timestamp.
- **Controlled Force Re-import**: Bypassed only through explicit `?force=true` query parameter.
- **Granular Human Audit Logging**: Editing fields generates `HUMAN_FIELD_CORRECTION` audit logs recording `{ original, corrected }` value pairs in SQLite.

### 4. Verification Results (QA Matrix)
| Check | Scope | Result |
| :--- | :--- | :---: |
| **Local Environment** | Ollama online at `127.0.0.1:11434`, `gemma2:2b` detected | **PASS** |
| **Test A (Digital PDF)** | Acme Cloud Hosting, TEST-INV-001, $150.00, 2026-11-01, 2026-11-20 | **PASS** |
| **Test B (Scanned Image)** | City Water and Power, SCAN-9021, $88.50, local OCR (94% conf) | **PASS** |
| **Test C (Missing Fields)** | Missing due date & invoice number returned as null with flags | **PASS** |
| **Test D (Duplicate Protection)** | Second upload blocked with HTTP 409; force bypass returns 201 | **PASS** |
| **Test E (Human Review)** | Corrections recorded in audit log; requires human approval | **PASS** |
| **Test F (Persistence)** | Documents, flags, and audit logs persist across server restart | **PASS** |
| **Test G (Ollama Offline)** | Server handles offline Ollama gracefully; no cloud fallback | **PASS** |
| **Type Check (`tsc --noEmit`)** | Full codebase TypeScript typecheck | **PASS (0 errors)** |
| **Lint (`eslint .`)** | Full codebase ESLint inspection | **PASS (0 errors)** |
| **Production Build (`vite build`)** | Production bundle compile & minify | **PASS (0 errors)** |

### ⚠️ Known Limitation: Scanned Multi-Page PDFs
- **Scanned Multi-Page Image PDFs**: Scanned image-only PDFs lacking native embedded text streams currently return empty text because rendering PDF pages to image tensors requires native rasterization libraries (e.g. `poppler` or `pdf2pic`), which were intentionally omitted to maintain a zero-native-dependency Windows environment.
- **Workaround**: Users can upload individual scanned pages as PNG or JPG images, which are immediately processed by local Tesseract OCR and Gemma 2.

---

## 📦 Phase 1 Foundation Features

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
- Ollama Setup modal with CLI commands (`ollama serve`, `ollama pull gemma2:2b`).
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

## 🦥 Connect Local AI (Ollama + Gemma 2)
To enable automatic local field extraction with Ollama and Gemma 2:
```bash
ollama serve
ollama pull gemma2:2b
```
*Note: If Ollama is not running or Gemma is not installed, BillSloth will continue running with full manual review capabilities, clear offline indicators, and graceful degradation without falsely simulating AI extraction.*
