# 🦥 BillSloth

> **“Slow and Steady. Bills Under Control.”**  
> *A local-first financial command center and calm invoice intelligence organizer powered by Google Gemma 4 open-weight models and SQLite ledger grounding. Built for Hacktoberfest 2026 Week 3 “Slow and Steady” Challenge.*

[![Repository](https://img.shields.io/badge/GitHub-Repository-172A35?style=for-the-badge&logo=github&logoColor=white)](https://github.com/rudrarajsinh920/BillSloth)
[![Open-Weight AI](https://img.shields.io/badge/Open--Weight%20AI-Google%20Gemma%204-42E8C4?style=for-the-badge&logo=google&logoColor=white)](https://github.com/rudrarajsinh920/BillSloth)
[![Model](https://img.shields.io/badge/Model-gemma--4--26b--a4b--it-087F8C?style=for-the-badge)](https://github.com/rudrarajsinh920/BillSloth)
[![Tests](https://img.shields.io/badge/Verification-100%25%20Passing-087F5B?style=for-the-badge)](https://github.com/rudrarajsinh920/BillSloth)
[![Database](https://img.shields.io/badge/Ledger-Local%20SQLite%20WAL-36D399?style=for-the-badge&logo=sqlite&logoColor=white)](https://github.com/rudrarajsinh920/BillSloth)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

🔗 **GitHub Repository:** [https://github.com/rudrarajsinh920/BillSloth](https://github.com/rudrarajsinh920/BillSloth)

---

## 💡 Product Philosophy: “Slow and Steady”

**“Stop chasing bills. Know what needs attention.”**

BillSloth replaces financial panic with calm, structured control. Built for the **Week 3 "Slow and Steady"** theme, BillSloth enforces a tranquil ritual:

```
DOCUMENT ARRIVAL (Drag & drop PDF, PNG, or JPG receipt)
   ↓
LOCAL RETENTION (File stored in local ./data/uploads vault; never deleted)
   ↓
DUAL-STAGE PARSING (Deterministic pdf-parse + on-device Tesseract OCR)
   ↓
OPEN-WEIGHT AI EXTRACTION (Google Gemma 4 structures vendor, amount, due date)
   ↓
HUMAN-IN-THE-LOOP VERIFICATION (Fields marked Unverified until human checks)
   ↓
CALM FINANCIAL RADAR (KPIs: Outstanding balance, Overdue alerts, 30-day timeline)
   ↓
SCHEDULED PEACE OF MIND (One-click .ICS export & weekly calm digest)
   ↓
ASK BILLSLOTH (Factual Q&A grounded in SQLite ledger via Google Gemma 4)
```

---

## 🤖 Google Gemma Open-Weight AI Architecture

BillSloth integrates **Google Gemma 4** (`gemma-4-26b-a4b-it` and `gemma-4-31b-it`) as its core intelligence engine. Gemma is Google's state-of-the-art family of lightweight, open-weight models built from the same research and technology used for Gemini.

### Why Gemma Without Ollama?
Running local 26B/31B LLM weights on everyday laptops via Ollama requires 16GB–32GB of VRAM, massive multi-gigabyte downloads, and continuous background daemon management. 

BillSloth solves this with an elegant, zero-friction architecture:
1. **Hosted Open-Weight Inference via Secure Express Proxy**:
   - The Express backend (`server/gemma.ts`) communicates directly with Google's hosted Gemma API endpoints using standard REST `generateContent`.
   - **Zero GPU requirements**, zero gigabyte downloads, and zero local daemon crashes.
2. **Backend-Only Secrets (Zero Secrets in React)**:
   - All API keys (`GEMINI_API_KEY`) and model configurations (`AI_MODEL`) are kept strictly on the backend inside `.env`.
   - The Vite/React client **never** receives API keys, eliminating risk of token leaks.
3. **Deterministic SQLite Grounding (Zero Arithmetic Hallucinations)**:
   - LLMs struggle with multi-invoice mathematical aggregation. BillSloth precomputes exact sums, overdue counts, and 7-day deadlines directly in SQLite and injects them as verified facts into Gemma's context window.
   - Gemma synthesizes, categorizes, and explains the financial posture without ever guessing numbers.
4. **Native Chain-of-Thought Filtering**:
   - Gemma 4 employs internal chain-of-thought reasoning (`"thought": true`). BillSloth's backend isolates internal thoughts from user-facing responses, providing clean, executive-level financial reports.
5. **Strict No-Silent-Fallback Guarantee**:
   - If Gemma encounters an error or reaches a quota, BillSloth **never** silently swaps to closed models. It explicitly reports the Gemma status and falls back to deterministic local ledger rules if offline.

```
┌────────────────────────────────────────────────────────┐
│                   React + Vite Client                  │
│       (Zero API Keys • Clean UI • Telemetry Badges)    │
└───────────────────────────┬────────────────────────────┘
                            │ POST /api/ai/ask
                            ▼
┌────────────────────────────────────────────────────────┐
│                  Express Node.js API                   │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │   SQLite Database    │    │   server/gemma.ts    │  │
│  │  (Exact Math Totals) │───▶│ (Gemma 4 Proxy Hub)  │  │
│  └──────────────────────┘    └──────────┬───────────┘  │
└─────────────────────────────────────────┼──────────────┘
                                          │ REST HTTPS
                                          ▼
                      ┌──────────────────────────────────────┐
                      │    Google AI Studio / Gemma API      │
                      │  • gemma-4-26b-a4b-it (Default)      │
                      │  • gemma-4-31b-it (Configurable)     │
                      └──────────────────────────────────────┘
```

---

## 🛡️ Data Safety & Privacy Disclosures

1. **Local File Vault**: Original documents (PDF, JPG, PNG) are retained in local disk storage (`./data/uploads/`) and **never automatically deleted**, even when an invoice record is archived.
2. **Hosted Inference Transparency**: When AI features are invoked, relevant prompt metadata and OCR text are sent securely to Google's hosted Gemma API endpoint. BillSloth does not claim to be air-gapped when cloud AI is active.
3. **Local SQLite Ledger**: All financial balances, audit history, vendor lists, and payment records remain stored exclusively in your local `./data/billsloth.db` database.
4. **Human-in-the-Loop Verification**: All extracted values are flagged as `Unverified` until validated by a human. No automatic email sending or bank payments are ever executed without explicit approval.
5. **Full Audit Trail**: Every action (import, local parsing attempt, field verification, status update, reminder approval) is recorded in local SQLite audit logs.

---

## 🎨 Design System

Polished, calm fintech interface combining a **Light-First application experience** with a signature **Cinematic Mascot Intro**:

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
  - **Gemma Open-Weight AI Accent**: `#087F8C`

### Cinematic Dark Mascot Intro (The Calm Sloth)
- **Midnight backdrop**: `#071F24`
- **Deep teal surface**: `#10363A`
- **Emerald lighting**: `#36D399`
- **Electric turquoise**: `#42E8C4`
- **Warm ivory text**: `#FFF2D8`

---

## 🚀 Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend API**: Node.js 24 ESM, Express, Multer
- **Database**: Native Node 24 SQLite (`better-sqlite3`) with persistent `./data/billsloth.db`
- **AI Intelligence**:
  - **Google Gemma 4 (`gemma-4-26b-a4b-it`)**: Google's open-weight instruction-tuned model for deep document reasoning and conversational financial assistance.
  - **Local Deterministic Ledger Assistant**: Instant offline mathematical fact retrieval, vendor search, and cash flow analysis.
- **Document Processing**:
  - **Local PDF Parser**: `pdf-parse` for deterministic embedded text extraction.
  - **Local OCR Engine**: `tesseract.js` for on-device receipt/scanned image OCR.
  - **Hashing**: `node:crypto` SHA-256 content hashing for duplicate protection.

---

## 📦 Privacy-First Financial Pipeline

1. **Local Text Extraction**:
   - **Digital PDFs**: Embedded text extracted directly via `pdf-parse`.
   - **Scanned Receipts & Images (PNG/JPG)**: Extracted on-device via local `tesseract.js` worker.
   - **100% Privacy by Default**: Local file vault retaining original documents safely on your machine.
2. **Gemma-Powered Structuring & Grounding**:
   - Extracts: Vendor, Invoice Number, Amount, Currency, Issue Date, Due Date, Category, Payment Status.
   - Non-hallucinatory: Missing fields return `null` and are flagged for human review.

### Validation & Advisory Confidence
- **Grounding Heuristic**: Verifies extracted values against source text.
- **Validation Flags**: Automatically flags `MISSING_DUE_DATE`, `MISSING_AMOUNT`, `MISSING_VENDOR`, `MISSING_INVOICE_NUMBER`, `INCONSISTENT_DATES`, and `UNVERIFIED`.
- **Duplicate Protection**: Identical file imports return `HTTP 409 Conflict`.
- **Granular Human Audit Logging**: Editing fields generates `HUMAN_FIELD_CORRECTION` audit logs recording `{ original, corrected }` value pairs in SQLite.

---

## 🧪 Verification Results (Live QA Matrix)

| Test Case | Scope & Description | Model / Engine | Result |
| :--- | :--- | :--- | :--- |
| **Gemma 4 Live Inference** | Live financial Q&A grounded with SQLite metrics | `gemma-4-26b-a4b-it` | **PASS (HTTP 200)** |
| **Correspondence Drafting** | Formal payment extension request with invoice refs | `gemma-4-26b-a4b-it` | **PASS (HTTP 200)** |
| **Local Environment** | SQLite database online, zero secrets in React client | Express + Node 24 | **PASS** |
| **Test A (Digital PDF)** | Acme Cloud Hosting, TEST-INV-001, $150.00, 2026-11-20 | Local pdf-parse | **PASS** |
| **Test B (Scanned Image)** | City Water and Power, SCAN-9021, $88.50, local OCR | Local Tesseract OCR | **PASS (94% conf)** |
| **Test C (Missing Fields)** | Missing due date & invoice number returned as null | Validation Flags | **PASS** |
| **Test D (Duplicate Protection)**| Second upload blocked with HTTP 409 Conflict | SHA-256 Checksum | **PASS** |
| **Test E (Human Review)** | Corrections recorded in audit log; requires sign-off | SQLite Audit Trail | **PASS** |
| **Test F (Persistence)** | Documents and audit logs persist across restart | SQLite DB | **PASS** |
| **Type Check (`tsc --noEmit`)** | Full codebase TypeScript typecheck | TypeScript 5.7 | **PASS (0 errors)** |
| **Lint (`eslint .`)** | Full codebase ESLint inspection | ESLint 9 | **PASS (0 errors)** |
| **Production Build (`vite build`)**| Full production bundle compile & minify | Vite 6 | **PASS (0 errors)** |

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (.env)
Copy the example configuration file:
```bash
cp .env.example .env
```
Open `.env` and add your Google AI Studio API key:
```env
PORT=3001
GEMINI_API_KEY=your_google_api_key_here
AI_MODEL=gemma-4-26b-a4b-it
```
*(Get a free key at [https://aistudio.google.com/](https://aistudio.google.com/). Compatible with `gemma-4-26b-a4b-it` and `gemma-4-31b-it`).*

### 3. Start Local Development
```bash
npm run dev
```
- **Web UI**: [http://localhost:5173](http://localhost:5173) (Vite frontend)
- **Backend API**: [http://127.0.0.1:3001](http://127.0.0.1:3001) (Express server)

### 4. Run Verification Suite
```bash
# Verify TypeScript types
npm run typecheck

# Verify Code Quality
npm run lint

# Compile Production Build
npm run build
```

---

## 🦥 Features Overview

* **Command Center Dashboard**: Live KPIs (Total Outstanding, Overdue sum, Due Soon radar, Needs Review counter), 30-day cash radar, maturity heatmap, and overdue urgency banners.
* **Document Ingestion Portal**: Drag-and-drop PDF and image statement intake with automated SHA-256 deduplication and Tesseract OCR.
* **Side-by-Side Review Drawer**: Split-screen document inspection comparing original uploads against AI-extracted fields before approving to the books.
* **Invoices & Bills Ledger**: Multi-column sorting, vendor search, category filters, and CSV accounting export.
* **Action Reminders**: Calendar integration with standard RFC 5545 `.ICS` file export.
* **Weekly Financial Calm Digest**: Executive cash flow checklist and exportable Markdown report.
* **Ask BillSloth Assistant**: Natural language Q&A and email correspondence powered by Google Gemma 4.
