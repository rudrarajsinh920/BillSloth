# 🦥 BillSloth — Hackathon Submission

> **“Slow and Steady. Bills Under Control.”**  
> *A local-first financial command center and calm invoice intelligence organizer powered by Google Gemma 4 open-weight models and SQLite ledger grounding. Built for Hacktoberfest 2026 Week 3 “Slow and Steady” Challenge.*

[![Repository](https://img.shields.io/badge/GitHub-Repository-172A35?style=for-the-badge&logo=github&logoColor=white)](https://github.com/rudrarajsinh920/BillSloth)
[![Open-Weight AI](https://img.shields.io/badge/Open--Weight%20AI-Google%20Gemma%204-42E8C4?style=for-the-badge&logo=google&logoColor=white)](https://github.com/rudrarajsinh920/BillSloth)
[![Model](https://img.shields.io/badge/Model-gemma--4--26b--a4b--it-087F8C?style=for-the-badge)](https://github.com/rudrarajsinh920/BillSloth)
[![Tests](https://img.shields.io/badge/Verification-100%25%20Passing-087F5B?style=for-the-badge)](https://github.com/rudrarajsinh920/BillSloth)
[![Database](https://img.shields.io/badge/Ledger-Local%20SQLite%20WAL-36D399?style=for-the-badge&logo=sqlite&logoColor=white)](https://github.com/rudrarajsinh920/BillSloth)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

🔗 **Project Repository:** [https://github.com/rudrarajsinh920/BillSloth](https://github.com/rudrarajsinh920/BillSloth)

---

## 💡 Project Overview & Philosophy

### Problem Statement
Managing invoices and recurring bills is chaotic and stressful. Users are inundated with email attachments, paper utility stubs, and vague due dates. Most modern solutions demand that users upload sensitive personal financial documents (tax receipts, bank statements, salary slips) to closed proprietary cloud AI APIs, sacrificing complete privacy just to extract a due date.

### The BillSloth Philosophy: “Slow and Steady”
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

### 3. Google Gemma Open-Weight AI Architecture (Without Ollama)
- **Open-Weight Models**: Powered by **Google Gemma 4** (`gemma-4-26b-a4b-it` default, configurable to `gemma-4-31b-it`).
- **Zero-Friction Backend Proxy**: All AI inference executes via Google's hosted Gemma API through a secure Express backend proxy (`server/gemma.ts`), removing heavy local GPU/Ollama requirements.
- **Backend-Only Secrets**: API keys are isolated on the Express server; zero secrets exist in React.
- **Native Chain-of-Thought Filtering**: Isolates internal reasoning (`"thought": true`) to present clean executive reports.
- **Strict No-Silent-Fallback**: Never masks errors with proprietary Gemini models; reports exact Gemma status.

### 4. Deterministic SQLite Ledger Grounding
- Overcomes LLM math hallucination by calculating exact balances, overdue counts, and maturity deadlines directly in SQLite (`better-sqlite3`).
- Gemma interprets, contextualizes, and drafts actions based on pre-verified mathematical facts.

### 5. Human-in-the-Loop Verification Gate
- Every extracted field (Vendor, Invoice #, Amount, Due Date, Category) is marked **`Unverified`** by default.
- Side-by-side verification drawer enables one-click approval, field correction, and private audit trails.
- No automated bank payments or emails are triggered without explicit human sign-off.

### 6. Reminders & Calendar Sync (.ICS)
- Drafts human-friendly payment reminders for every bill.
- **RFC 5545 Export**: One-click download of `.ics` calendar events compatible with Apple Calendar, Google Calendar, Outlook, and Thunderbird.

---

## 🏗️ System Architecture

BillSloth is architected as an ultra-fast, local-first web application:

```
┌────────────────────────────────────────────────────────┐
│                   BILLSLOTH CLIENT                     │
│    React 18 • TypeScript • Tailwind CSS • Vite         │
│  - Light-First Fintech Canvas (#F7F8F5)                │
│  - Cinematic Mascot Intro (Midnight Teal & Emerald)    │
│  - Zero API Keys in Client Bundle                      │
└───────────────────────────┬────────────────────────────┘
                            │ POST /api/ai/ask
                            ▼
┌────────────────────────────────────────────────────────┐
│                 NODE.JS EXPRESS SERVER                 │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │   SQLite Database    │    │   server/gemma.ts    │  │
│  │ (Exact Math Totals)  │───▶│  (Gemma 4 Proxy Hub) │  │
│  └──────────────────────┘    └──────────┬───────────┘  │
│  - Local pdf-parse                      │              │
│  - On-Device Tesseract.js OCR           │              │
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

## 🧪 Live Verification QA Matrix

| Test Case | Scope & Description | Model / Engine | Result |
| :--- | :--- | :--- | :--- |
| **Gemma 4 Live Inference** | Live financial Q&A grounded with SQLite metrics | `gemma-4-26b-a4b-it` | **PASS (HTTP 200)** |
| **Correspondence Drafting** | Formal payment extension request with invoice refs | `gemma-4-26b-a4b-it` | **PASS (HTTP 200)** |
| **Digital PDF Parsing** | Acme Cloud Hosting, TEST-INV-001, $150.00, 2026-11-20 | Local pdf-parse | **PASS** |
| **Scanned Receipt OCR** | City Water and Power, SCAN-9021, $88.50, local OCR | Local Tesseract OCR | **PASS (94% conf)** |
| **Missing Fields Gate** | Missing due date & invoice number returned as null | Validation Flags | **PASS** |
| **Duplicate Protection** | Second upload blocked with HTTP 409 Conflict | SHA-256 Checksum | **PASS** |
| **Human Review Gate** | Corrections recorded in audit log; requires sign-off | SQLite Audit Trail | **PASS** |
| **Type Check (`tsc --noEmit`)** | Full codebase TypeScript typecheck | TypeScript 5.7 | **PASS (0 errors)** |
| **Lint (`eslint .`)** | Full codebase ESLint inspection | ESLint 9 | **PASS (0 errors)** |
| **Production Build (`vite build`)** | Full production bundle compile & minify | Vite 6 | **PASS (0 errors)** |

---

## 🛠️ Quickstart Guide

```bash
# 1. Clone repository
git clone https://github.com/rudrarajsinh920/BillSloth.git
cd BillSloth

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key

# 4. Start local development
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **API Server**: [http://127.0.0.1:3001](http://127.0.0.1:3001)

---

*Built with care for Hacktoberfest 2026. Slow and steady, bills under control! 🦥*
