*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady](https://dev.to/challenges/hacktoberfest-week3-2026-10-19)*

## What I Built

**BillSloth** is a calm, privacy-first financial command center and document organizer designed around the philosophy of *"Slow and Steady. Bills Under Control."* 

Instead of panicking over scattered email attachments, crumpled utility bills, and missed payment deadlines, BillSloth lets you be productively lazy:
1. **Drag and Drop Any Document**: Drop in PDFs, scanned JPG receipts, or phone photos.
2. **On-Device Text & OCR Parsing**: Extracts amounts, due dates, vendors, and invoice numbers locally without uploading private tax or banking documents to third-party file-sharing clouds.
3. **Mascot-Led Calm Command Center**: Features a lovable sloth that visually enters the scene, takes your bill, and organizes it into a clear 30-day maturity radar with color-coded urgency (Due Soon, Overdue, Needs Review).
4. **Human-in-the-Loop Verification**: Flags missing fields as `<Needs Review>` and holds every document behind a quick human verification gate—no accidental bank payments or rogue auto-emails.
5. **One-Click Calendar Sync (.ICS)**: Generates standard RFC 5545 calendar alerts for Apple Calendar, Google Calendar, and Outlook with one click.
6. **Ask BillSloth Open-Weight AI**: A dedicated assistant powered by **Google Gemma 4** (`gemma-4-26b-a4b-it`) with deterministic SQLite ledger grounding that answers questions like *"What is my total outstanding balance?"*, *"Show me bills from Metro Grid"*, or *"Draft a polite payment extension email"*.

**Who gets to be lazy?**
Freelancers, small business owners, roommates, and busy individuals who dread administrative "bill sorting days". You drop the bills into BillSloth, let the sloth organize them, review them in seconds, export your calendar schedule, and get back to your life.

---

## Demo

- 🔗 **GitHub Repository**: [https://github.com/rudrarajsinh920/BillSloth](https://github.com/rudrarajsinh920/BillSloth)
- 🦥 **Built-in Sample Data**: Includes an instant *"Load Illustrative Sample Data"* toggle in the navigation sidebar so judges can test full dashboard workflows, calendar schedules, and AI assistant queries with zero configuration.

---

## Code

{% github rudrarajsinh920/BillSloth %}

- **Frontend**: React 18, TypeScript 5.8, Tailwind CSS, Vite, Lucide Icons, Date-fns
- **Backend API**: Node.js 24 ESM, Express, Multer
- **Database**: Native Node 24 SQLite (`better-sqlite3`) with persistent Write-Ahead Logging (WAL)
- **Local Parsing**: `pdf-parse` for digital invoice text + `tesseract.js` for on-device receipt OCR
- **Open-Weight AI**: Google Gemma 4 (`gemma-4-26b-a4b-it`) + Deterministic SQLite Ledger Intelligence

---

## How I Built It

BillSloth was built from the ground up for the **Week 3 "Slow and Steady"** hackathon sprint:

1. **Light-First Fintech Canvas with Cinematic Mascot Intro**:
   - Designed a high-contrast financial palette: warm off-white canvas (`#F7F8F5`), raised white cards (`#FFFFFF`), deep navy typography (`#172A35`), calm primary teal (`#087F8C`), emerald verification (`#087F5B`), upcoming deadline amber (`#854D0E`), and overdue rose (`#BE123C`).
   - Built a 3.6-second cinematic welcome animation using CSS keyframe physics and transform matrixes. The sloth mascot walks across the screen, pauses at center stage, and transforms the bill into an organized financial card before dissolving smoothly into the dashboard.

2. **Google Gemma Open-Weight AI Integration (Without Ollama)**:
   - Built around Google's open-weight model family: **`gemma-4-26b-a4b-it`** (and configurable to `gemma-4-31b-it`).
   - Rather than forcing users to run heavy multi-gigabyte Ollama daemons that drain laptop batteries and hog VRAM, BillSloth communicates with Google's hosted Gemma API via a secure, zero-secret Express backend proxy (`server/gemma.ts`).
   - Handled Gemma 4's native chain-of-thought (`"thought": true`) by parsing and delivering pure, executive-level financial reports to the user.
   - Enforced a strict **no-silent-fallback** rule: if Gemma is unavailable, it reports the exact model status instead of secretly substituting closed proprietary models.

3. **Deterministic SQLite Ledger Grounding for Zero Hallucinations**:
   - Large language models are notoriously prone to arithmetic errors. In BillSloth, financial figures (total balance, cash flow commitments, overdue sums, category subtotals) are calculated deterministically by native SQLite queries and TypeScript math helpers, then injected into the Gemma 4 context window.

4. **Dual-Stage Parsing Pipeline**:
   - **Stage 1 (Local Ingestion & OCR)**: Digital PDFs are extracted via `pdf-parse` in milliseconds. Scanned paper receipts and mobile photos are processed entirely in the browser thread via a local `tesseract.js` worker.
   - **Stage 2 (Open-Weight Structuring)**: Structured fields (Vendor, Amount, Currency, Due Date, Category) are interpreted via Gemma 4 with fallback to deterministic pattern matching.

5. **SHA-256 Deduplication & Immutable Audit Log**:
   - Re-uploading an identical PDF triggers an instant `HTTP 409 Conflict` duplicate block.
   - Every human modification, review approval, or reminder creation writes an immutable event into the SQLite audit ledger with ISO timestamps.

---

## Why Does Open Innovation Matter?

Open innovation is critical for personal finance software. 

Financial documents contain your home address, utility meter numbers, employer names, and bank account identifiers. Forcing users into closed proprietary black-box ecosystems creates massive privacy liabilities and platform lock-in.

By building on **Google Gemma (open-weight model)** and open-source tooling (`node:sqlite`, `tesseract.js`, `pdf-parse`, Vite, React, Tailwind):
- **Auditable AI & Weights**: Developers can inspect, tune, and verify Gemma's open weights and behavior.
- **Data Sovereignty**: Financial records reside in a local SQLite vault on your machine and are never used to train public models.
- **Zero Lock-In**: You can export your entire ledger to standard CSV or download universal RFC 5545 `.ics` calendar events at any time.

---

## The Lazy Payoff

Managing household and small business bills usually takes **30 to 45 minutes every weekend**: digging through downloaded PDFs, manually checking bank accounts, typing due dates into Google Calendar, and calculating cash flow.

With BillSloth:
- **Import to Organized in 3 Seconds**: Drag in 5 receipts and bills. BillSloth immediately indexes them, parses amounts, and assigns due dates.
- **One-Click Calendar Sync**: Instead of typing dates, times, and amounts manually, clicking **Export .ICS** imports payment reminders directly into Apple Calendar or Google Calendar.
- **Instant Slack / Email Drafts**: If you need more time to pay, asking *"Draft an extension request for Metro Grid"* in Ask BillSloth generates a polite, vendor-ready message citing your exact invoice number and outstanding balance.

It turns a stressful Sunday chore into a relaxed 30-second ritual.

---

## Prize Categories

- **Primary Challenge**: Hacktoberfest 2026 Week 3: Slow and Steady

---

*Built with care for Hacktoberfest 2026. Slow and steady, bills under control! 🦥*
