*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady](https://dev.to/challenges/hacktoberfest-week3-2026-10-19)*

## What I Built

**BillSloth** is a calm, privacy-first financial command center and document organizer designed around the philosophy of *"Slow and Steady. Bills Under Control."* 

Instead of panicking over scattered email attachments, crumpled utility bills, and missed payment deadlines, BillSloth lets you be productively lazy:
1. **Drag and Drop Any Document**: Drop in PDFs, scanned JPG receipts, or phone photos.
2. **On-Device Text & OCR Parsing**: Extracts amounts, due dates, vendors, and invoice numbers locally without uploading private tax or banking documents to third-party file-sharing clouds.
3. **Mascot-Led Calm Command Center**: Features a lovable 3D knitted sloth that visually walks into the scene, takes your bill, and organizes it into a clear 30-day maturity radar with color-coded urgency (Due Soon, Overdue, Needs Review).
4. **Human-in-the-Loop Verification**: Flags missing fields as `<Needs Review>` and holds every document behind a quick human verification gate—no accidental bank payments or rogue auto-emails.
5. **One-Click Calendar Sync (.ICS)**: Generates standard RFC 5545 calendar alerts for Apple Calendar, Google Calendar, and Outlook with one click.
6. **Ask BillSloth AI**: A dedicated assistant powered by **Gemini 3.8 Flash** with deterministic ledger grounding that answers questions like *"What is my total outstanding balance?"*, *"Show me bills from Metro Grid"*, or *"Draft a polite payment extension email"*.

**Who gets to be lazy?**
Freelancers, small business owners, roommates, and busy individuals who dread administrative "bill sorting days". You drop the bills into BillSloth, let the sloth organize them, review them in seconds, export your calendar schedule, and get back to your life.

---

## Demo

- 🔗 **GitHub Repository**: [https://github.com/rudrarajsinh920/BillSloth](https://github.com/rudrarajsinh920/BillSloth)
- 🦥 **Built-in Sample Data**: Includes an instant *"Load Illustrative Sample Data"* toggle in the navigation sidebar so judges can test full dashboard workflows, calendar schedules, and AI assistant queries with zero configuration.

*(Add your deployed Vercel/Render URL or demo video here if available)*

---

## Code

{% github rudrarajsinh920/BillSloth %}

- **Frontend**: React 18, TypeScript 5.8, Tailwind CSS, Vite, Lucide Icons, Date-fns
- **Backend API**: Node.js 24 ESM, Express, Multer
- **Database**: Native Node 24 SQLite (`node:sqlite`) with persistent Write-Ahead Logging (WAL)
- **Local Parsing**: `pdf-parse` for digital invoice text + `tesseract.js` for on-device receipt OCR
- **AI Intelligence**: Google Gemini 3.8 Flash (`gemini-3.8-flash`) + In-Browser Deterministic Ledger Intelligence

---

## How I Built It

BillSloth was built from the ground up for the **Week 3 "Slow and Steady"** hackathon sprint:

1. **Light-First Fintech Canvas with Cinematic Mascot Intro**:
   - Designed a high-contrast financial palette: warm off-white canvas (`#F7F8F5`), raised white cards (`#FFFFFF`), deep navy typography (`#172A35`), calm primary teal (`#087F8C`), emerald verification (`#087F5B`), upcoming deadline amber (`#854D0E`), and overdue rose (`#BE123C`).
   - Built a 3.6-second cinematic welcome animation using CSS keyframe physics and transform matrixes. The sloth mascot walks across the screen, pauses at center stage, and transforms the bill into an organized financial card before dissolving smoothly into the dashboard.

2. **Dual-Stage Parsing Pipeline**:
   - **Stage 1 (Local Ingestion & OCR)**: Digital PDFs are extracted via `pdf-parse` in milliseconds. Scanned paper receipts and mobile photos are processed entirely in the browser thread via a local `tesseract.js` worker.
   - **Stage 2 (Structured AI Structuring)**: Structured fields (Vendor, Amount, Currency, Due Date, Category) are extracted via `gemini-3.8-flash` with fallback to deterministic regex/heuristic pattern matching.

3. **Deterministic Ledger Grounding for Zero Hallucinations**:
   - Large language models are notoriously prone to arithmetic errors. In BillSloth, financial figures (total balance, cash flow commitments, overdue sums, category subtotals) are calculated deterministically by native SQLite queries and TypeScript math helpers, then injected into the Gemini 3.8 context window.

4. **SHA-256 Deduplication & Immutable Audit Log**:
   - Re-uploading an identical PDF triggers an instant `HTTP 409 Conflict` duplicate block.
   - Every human modification, review approval, or reminder creation writes an immutable event into the SQLite audit ledger with ISO timestamps.

---

## Why Does Open Innovation Matter?

Open innovation is critical for personal finance software. 

Financial documents contain your home address, utility meter numbers, employer names, and bank account identifiers. Forcing users to pipe raw invoice PDFs through closed, opaque cloud services creates massive privacy liabilities.

By leveraging **open-source tooling** (`node:sqlite`, `tesseract.js`, `pdf-parse`, Vite, React, Tailwind) and open developer models:
- **Your Data Remains Yours**: Documents reside in local storage (`./data/uploads/`) and are never sold or used for public training.
- **Auditability**: Anyone can inspect the exact prompt templates, deterministic math formulas, and SQLite schemas in the GitHub repo.
- **Zero Lock-In**: You can export your entire ledger to standard CSV or download universal RFC 5545 `.ics` calendar events at any time.

---

## The Lazy Payoff

Managing household and small business bills usually takes **30 to 45 minutes every weekend**: digging through downloaded PDFs, manually checking bank accounts, typing due dates into Google Calendar, and calculating cash flow.

With BillSloth:
- **Import to Organized in 3 Seconds**: Drag in 5 receipts and bills. BillSloth immediately indexes them, parses amounts, and assigns due dates.
- **One-Click Calendar Sync**: Instead of typing dates, times, and amounts manually, clicking **Export .ICS** imports the payment reminders directly into Apple Calendar or Google Calendar.
- **Instant Slack / Email Drafts**: If you need more time to pay, clicking *"Draft Extension Email"* in Ask BillSloth generates a polite, vendor-ready message citing your exact invoice number and outstanding balance.

It turns a stressful Sunday chore into a relaxed 30-second ritual.

---

## Prize Categories

- **Primary Challenge**: Hacktoberfest 2026 Week 3: Slow and Steady

---

*Built with care for Hacktoberfest 2026. Slow and steady, bills under control! 🦥*
