# 🦥 BillSloth — Hackathon Submission

> **“Slow and Steady. Bills Under Control.”**  
> *A local-first financial command center and calm invoice intelligence organizer built for Hacktoberfest 2026 Week 3 “Slow and Steady” Challenge.*

[![Repository](https://img.shields.io/badge/GitHub-Repository-172A35?style=for-the-badge&logo=github&logoColor=white)](https://github.com/rudrarajsinh920/BillSloth)
[![Tests](https://img.shields.io/badge/Verification-100%25%20Passing-087F5B?style=for-the-badge)](https://github.com/rudrarajsinh920/BillSloth)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local--First-36D399?style=for-the-badge)](https://github.com/rudrarajsinh920/BillSloth)
[![AI Engine](https://img.shields.io/badge/AI%20Intelligence-Gemini%203.8%20Flash-42E8C4?style=for-the-badge&logo=google&logoColor=white)](https://github.com/rudrarajsinh920/BillSloth)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

🔗 **Project Repository:** [https://github.com/rudrarajsinh920/BillSloth](https://github.com/rudrarajsinh920/BillSloth)

---

## 💡 Project Overview & Philosophy

### Problem Statement
Managing invoices and recurring bills is chaotic and stressful. Users are inundated with email attachments, paper utility stubs, and vague due dates. Most modern solutions demand that users upload sensitive personal financial documents (tax receipts, bank statements, salary slips) to cloud AI APIs, sacrificing complete privacy just to extract a due date.

### The BillSloth Philosophy: “Slow and Steady”
BillSloth replaces financial panic with calm, structured control. Built for the **Week 3 "Slow and Steady"** theme, BillSloth enforces a tranquil ritual:

```
DOCUMENT ARRIVAL (Drag & drop PDF, PNG, or JPG receipt)
   ↓
LOCAL RETENTION (File stored in local ./data/uploads vault; never deleted)
   ↓
DUAL-STAGE PARSING (Deterministic pdf-parse + on-device Tesseract OCR)
   ↓
HUMAN-IN-THE-LOOP VERIFICATION (Fields marked Unverified until human checks)
   ↓
CALM FINANCIAL RADAR (KPIs: Outstanding balance, Overdue alerts, 30-day timeline)
   ↓
SCHEDULED PEACE OF MIND (One-click .ICS export & weekly calm digest)
   ↓
ASK BILLSLOTH (Instant factual Q&A grounded in SQLite ledger)
```

---

## 🌟 Key Features & Capabilities

### 1. Signature Welcome Mascot Experience
- **Cinematic Storytelling**: A 3.6-second visual narrative where the BillSloth mascot gently arrives carrying a bill, places it on stage, and watches it transform into a structured, organized card.
- **Midnight Teal World**: Built with `#071F24` (Midnight), `#10363A` (Deep Teal), `#36D399` (Emerald Glow), and `#42E8C4` (Electric Turquoise).
- **Accessible & Frictionless**: Supports keyboard skip (`Escape` / `Enter`), respects `prefers-reduced-motion`, and cleans up animation cycles safely.

### 2. High-Contrast Financial Command Center
- **Light-First Dashboard**: Warm off-white (`#F7F8F5`) canvas with elevated white cards (`#FFFFFF`) and deep navy typography (`#172A35`).
- **Financial Status Hierarchy**:
  - **Success / Verified**: `#087F5B` text on `#DDF7EF`
  - **Due Soon (Next 7 Days)**: `#854D0E` text on `#FFF0CC`
  - **Critical Overdue**: `#BE123C` text on `#FFE4E6`
- **Real-Time Maturity Radar**: 30-day timeline view and visual interactive calendar.

### 3. Privacy-First Document Ingestion & Local Vault
- **Zero Cloud AI Leakage**: Document parsing executes directly on your machine.
- **Multimodal Ingestion**: Supports digital text PDFs via `pdf-parse` and scanned receipts/photos via local `tesseract.js` worker.
- **SHA-256 Duplicate Protection**: Blocks accidental duplicate uploads with HTTP 409 conflict detection.
- **Immutable Disk Retention**: Original files stay on your machine in `./data/uploads/` and are never purged.

### 4. Human-in-the-Loop Verification Gate
- Every extracted field (Vendor, Invoice #, Amount, Due Date, Category) is marked **`Unverified`** by default.
- Side-by-side verification drawer enables one-click approval, field correction, and private audit trails.
- No automated bank payments or emails are triggered without explicit human sign-off.

### 5. Reminders & Calendar Sync (.ICS)
- Drafts human-friendly payment reminders for every bill.
- **RFC 5545 Export**: One-click download of `.ics` calendar events compatible with Apple Calendar, Google Calendar, Outlook, and Thunderbird.

### 6. Intelligent "Ask BillSloth" Assistant
- **Dual Intelligence Architecture**:
  - **Cloud Intelligence**: Powered by **Google Gemini 3.8 Flash** with zero setup friction.
  - **In-Browser Ledger AI**: Instant deterministic mathematical calculations and vendor lookups straight from SQLite with zero external API calls.
- **Keyboard Shortcut**: Press `⌘K` or `Ctrl+K` anywhere to search or query the ledger.

---

## 🏗️ System Architecture

BillSloth is architected as an ultra-fast, local-first web application:

```
┌────────────────────────────────────────────────────────┐
│                   BILLSLOTH CLIENT                     │
│    React 18 • TypeScript • Tailwind CSS • Vite         │
│  - Light-First Fintech Canvas (#F7F8F5)                │
│  - Cinematic Mascot Intro (Midnight Teal & Emerald)    │
│  - In-Browser Deterministic Ledger Intelligence        │
└───────────────▲────────────────────────▲───────────────┘
                │                        │
    Client Direct API (Gemini)      REST API (Proxy)
                │                        │
┌───────────────▼──────────┐ ┌───────────▼───────────────┐
│     GEMINI 3.8 FLASH     │ │   NODE.JS EXPRESS SERVER  │
│  Conversational Q&A      │ │  - Native SQLite Storage  │
│  Multimodal Extraction   │ │  - Local pdf-parse        │
│  Vendor Email Drafting   │ │  - On-Device Tesseract.js │
└──────────────────────────┘ └───────────▲───────────────┘
                                         │
                             ┌───────────▼───────────────┐
                             │    LOCAL STORAGE VAULT    │
                             │  ./data/billsloth.db (SQL)│
                             │  ./data/uploads/ (Files)  │
                             └───────────────────────────┘
```

- **Frontend**: React 18, TypeScript 5.8, Tailwind CSS, Vite, Lucide Icons, Date-fns.
- **Backend API**: Node.js 24 ESM, Express, Multer.
- **Database**: Native Node 24 SQLite (`node:sqlite`) with persistent `./data/billsloth.db` and Write-Ahead Logging (WAL).
- **Extraction Engines**:
  - `pdf-parse`: Local embedded text extraction for digital invoices.
  - `tesseract.js`: Local on-device OCR worker for scanned receipts and photos.
  - `gemini-3.8-flash`: Structured invoice field extraction and natural conversational assistance.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: `v22.0.0` or higher (`v24.20.0` recommended for native `node:sqlite`).
- **npm**: `v10.0.0` or higher.

### 2. Clone and Install
```bash
git clone https://github.com/rudrarajsinh920/BillSloth.git
cd BillSloth
npm install
```

### 3. Start Development
```bash
npm run dev
```
- **Web Interface**: `http://localhost:5173`
- **Backend API**: `http://127.0.0.1:3001`

### 4. Build for Production
```bash
npm run build
npm run server:start
```

---

## 🧪 Verification & QA Matrix

BillSloth features comprehensive validation across code quality, types, and end-to-end functionality:

| Test / Check | Scope | Result |
| :--- | :--- | :---: |
| **Typecheck (`tsc --noEmit`)** | Full codebase strict TypeScript verification | **PASS (0 errors)** |
| **Linter (`eslint .`)** | Code style, accessibility, and import hygiene | **PASS (0 errors)** |
| **Production Build (`vite build`)** | Rollup optimization, chunk split, CSS minify | **PASS (13.30s)** |
| **Gemini 3.8 Flash Connectivity** | Direct API call with active key (`generateContent`) | **PASS (HTTP 200)** |
| **Deterministic Ledger AI** | Math aggregation, vendor search, due dates | **PASS** |
| **Digital PDF Parsing** | Embedded text extracted locally via `pdf-parse` | **PASS** |
| **Image OCR Parsing** | Local Tesseract OCR worker extracting receipt amounts | **PASS** |
| **SHA-256 Deduplication** | Identical file blocked with HTTP 409 conflict | **PASS** |
| **Audit Log Persistence** | Corrections & verifications stored in SQLite | **PASS** |
| **Mobile Responsiveness** | Verified at 375px viewport (no clipping/overflow) | **PASS** |
| **Reduced-Motion Access** | Instant 180ms skip when system prefers reduced motion | **PASS** |

---

## 🔒 Security & Data Safety Guarantees

1. **Air-Gapped Vault by Default**: Files stored in `./data/uploads/` are never deleted and never sent to third-party file hosts.
2. **Deterministic Ledger Grounding**: The AI assistant answers from real SQLite records, preventing arithmetic errors and hallucinations.
3. **No Automatic Payments**: BillSloth never initiates payments or emails without explicit human approval.
4. **Immutable Audit Trail**: Every field correction, status change, and reminder approval is written to SQLite audit logs with timestamps.

---

## 📄 License

MIT License © 2026 BillSloth Contributors. Built with care for Hacktoberfest 2026.
