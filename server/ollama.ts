export interface OllamaStatus {
  available: boolean;
  url: string;
  models: string[];
  activeModel: string | null;
  hasGemma: boolean;
  recommendedGemmaModel: string;
  error?: string;
}

export interface ExtractedBillData {
  vendor: string | null;
  invoice_number: string | null;
  amount: number | null;
  currency: string;
  issue_date: string | null; // YYYY-MM-DD
  due_date: string | null;   // YYYY-MM-DD
  category: string;
  payment_status: 'needs_review' | 'due_soon' | 'overdue' | 'paid';
  unverified_fields: string[];
  field_confidences: Record<string, number>; // Advisory confidence 0.0 - 1.0
  validation_flags: string[];
  raw_notes?: string;
}

export interface ExtractionResult {
  success: boolean;
  modelUsed?: string;
  isGemmaModel?: boolean;
  data?: ExtractedBillData;
  error?: string;
  reason?: 'OLLAMA_OFFLINE' | 'NO_MODEL' | 'PARSE_FAILED' | 'ERROR';
}

export function getOllamaHost(): string {
  return process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
}
const RECOMMENDED_GEMMA_MODEL = 'gemma2:2b';

export function isGemma(modelName: string): boolean {
  return /gemma/i.test(modelName);
}

/**
 * Checks local Ollama server status and available models.
 * Never calls any external or cloud API.
 */
export async function checkOllamaStatus(): Promise<OllamaStatus> {
  const host = getOllamaHost();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${host}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        available: false,
        url: host,
        models: [],
        activeModel: null,
        hasGemma: false,
        recommendedGemmaModel: RECOMMENDED_GEMMA_MODEL,
        error: `Ollama responded with status ${res.status}`,
      };
    }

    const data = (await res.json()) as { models?: Array<{ name: string }> };
    const modelNames = (data.models || []).map((m) => m.name);

    // Filter for Gemma variants
    const gemmaModels = modelNames.filter((m) => isGemma(m));
    const hasGemma = gemmaModels.length > 0;

    // Prefer Gemma models for Phase 2, then fallback to other fast local models
    const preferredOrder = [
      'gemma2:2b',
      'gemma2:9b',
      'gemma2',
      'gemma:2b',
      'gemma:7b',
      'gemma',
      'llama3.2:3b',
      'llama3.2',
      'mistral',
      'llama3',
      'qwen2.5',
      'phi3',
    ];

    let chosenModel: string | null = null;
    for (const pref of preferredOrder) {
      const match = modelNames.find((m) => m.toLowerCase().includes(pref));
      if (match) {
        chosenModel = match;
        break;
      }
    }
    if (!chosenModel && modelNames.length > 0) {
      chosenModel = modelNames[0];
    }

    return {
      available: true,
      url: host,
      models: modelNames,
      activeModel: chosenModel,
      hasGemma,
      recommendedGemmaModel: RECOMMENDED_GEMMA_MODEL,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      available: false,
      url: host,
      models: [],
      activeModel: null,
      hasGemma: false,
      recommendedGemmaModel: RECOMMENDED_GEMMA_MODEL,
      error: `Could not connect to local Ollama daemon at ${host} (${msg})`,
    };
  }
}

/**
 * Validate and clean date string in YYYY-MM-DD format.
 */
function cleanDate(dateStr: unknown): string | null {
  if (typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return trimmed;
}

/**
 * Extract financial fields using a local open-weight model (Gemma / Ollama).
 * Adheres strictly to the privacy and safety rules:
 * - 100% local-first, zero cloud API transmission.
 * - Never invent missing amounts, currencies, dates, or vendors.
 * - Treat extracted fields as unverified until validated by human.
 * - Treat model confidence as advisory rather than proof of correctness.
 */
export async function extractWithLocalOllama(
  textOrOcr: string,
  modelOverride?: string
): Promise<ExtractionResult> {
  const status = await checkOllamaStatus();
  if (!status.available) {
    return {
      success: false,
      reason: 'OLLAMA_OFFLINE',
      error: 'Local Ollama instance is not running. Please start Ollama locally (`ollama serve`) to enable AI field extraction.',
    };
  }

  const model = modelOverride || status.activeModel;
  if (!model) {
    return {
      success: false,
      reason: 'NO_MODEL',
      error: `No local model found. Recommend pulling a lightweight Gemma model: \`ollama pull ${RECOMMENDED_GEMMA_MODEL}\`.`,
    };
  }

  const systemPrompt = `You are a strict, privacy-first local financial document parser for BillSloth.
Your task is to extract factual invoice/bill fields from the extracted text.

STRICT EXTRACTION RULES:
1. ONLY return a single valid JSON object matching the schema below. No other text or markdown formatting outside the JSON.
2. DO NOT invent, guess, or extrapolate values. If any field is not explicitly mentioned or is ambiguous, output null.
3. currency: 3-letter ISO code (e.g. USD, EUR, GBP, CAD, AUD) or "USD" if '$' is used.
4. issue_date and due_date: MUST be formatted as "YYYY-MM-DD" or null. Do NOT output invalid dates.
5. amount: Numeric float or null (e.g. 142.50). Do not include currency symbols in amount.
6. category: Exactly one of: ["Utilities", "Software/SaaS", "Rent/Lease", "Telecom", "Insurance", "Supplies", "Professional Services", "Taxes", "Other"].
7. payment_status: One of: ["needs_review", "due_soon", "overdue", "paid"]. Default to "needs_review".
8. notes: Brief factual memo (e.g. account # or payment terms), or null.

JSON Schema:
{
  "vendor": string | null,
  "invoice_number": string | null,
  "amount": number | null,
  "currency": string,
  "issue_date": string | null,
  "due_date": string | null,
  "category": string,
  "payment_status": string,
  "notes": string | null
}`;

  try {
    const host = getOllamaHost();
    const response = await fetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `Extracted Document Text to Analyze:\n"""\n${textOrOcr}\n"""\n\nReturn JSON:`,
        system: systemPrompt,
        format: 'json',
        stream: false,
        options: {
          temperature: 0.1, // low temperature for deterministic, factual parsing
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        reason: 'ERROR',
        error: `Ollama local inference failed with HTTP ${response.status}`,
      };
    }

    const result = (await response.json()) as { response?: string };
    const rawOutput = result.response?.trim();

    if (!rawOutput) {
      return {
        success: false,
        reason: 'PARSE_FAILED',
        error: 'Ollama returned an empty response.',
      };
    }

    interface RawModelOutput {
      vendor?: string | null;
      invoice_number?: string | null;
      amount?: number | string | null;
      currency?: string | null;
      issue_date?: string | null;
      due_date?: string | null;
      category?: string | null;
      payment_status?: string | null;
      notes?: string | null;
    }

    let parsed: RawModelOutput;
    try {
      parsed = JSON.parse(rawOutput) as RawModelOutput;
    } catch {
      // Try extracting json substring if wrapped in markdown code fence
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]) as RawModelOutput;
      } else {
        throw new Error('Model output could not be parsed as valid JSON');
      }
    }

    // -------------------------------------------------------------
    // BACKEND VALIDATION & ADVISORY CONFIDENCE ESTIMATION
    // -------------------------------------------------------------
    const validationFlags: string[] = [];
    const unverifiedFields: string[] = [];
    const fieldConfidences: Record<string, number> = {};

    // 1. Amount validation
    let validAmount: number | null = null;
    if (parsed.amount !== null && parsed.amount !== undefined) {
      const parsedNum = typeof parsed.amount === 'number' ? parsed.amount : parseFloat(String(parsed.amount).replace(/[^0-9.-]/g, ''));
      if (!isNaN(parsedNum) && parsedNum >= 0) {
        validAmount = Math.round(parsedNum * 100) / 100;
        unverifiedFields.push('amount');
        // Advisory confidence: check if number appears in source text
        const amountStr = validAmount.toFixed(2);
        const intStr = String(Math.floor(validAmount));
        const foundInText = textOrOcr.includes(amountStr) || textOrOcr.includes(intStr);
        fieldConfidences.amount = foundInText ? 0.95 : 0.65;
      } else {
        validationFlags.push('INVALID_AMOUNT_FORMAT');
        fieldConfidences.amount = 0.2;
      }
    } else {
      validationFlags.push('MISSING_AMOUNT');
      fieldConfidences.amount = 0.0;
    }

    // 2. Dates validation
    const validIssueDate = cleanDate(parsed.issue_date);
    const validDueDate = cleanDate(parsed.due_date);

    if (validIssueDate) {
      unverifiedFields.push('issue_date');
      fieldConfidences.issue_date = 0.9;
    }
    if (validDueDate) {
      unverifiedFields.push('due_date');
      fieldConfidences.due_date = 0.9;
    } else {
      validationFlags.push('MISSING_DUE_DATE');
      fieldConfidences.due_date = 0.0;
    }

    // Date consistency check
    if (validIssueDate && validDueDate && validDueDate < validIssueDate) {
      validationFlags.push('INCONSISTENT_DATES');
    }

    // 3. Vendor validation
    const vendorStr = parsed.vendor && typeof parsed.vendor === 'string' ? parsed.vendor.trim() : null;
    if (vendorStr) {
      unverifiedFields.push('vendor');
      fieldConfidences.vendor = textOrOcr.toLowerCase().includes(vendorStr.toLowerCase()) ? 0.92 : 0.7;
    } else {
      validationFlags.push('MISSING_VENDOR');
      fieldConfidences.vendor = 0.0;
    }

    // 4. Invoice Number validation
    const invoiceNumStr = parsed.invoice_number && typeof parsed.invoice_number === 'string' ? parsed.invoice_number.trim() : null;
    if (invoiceNumStr) {
      unverifiedFields.push('invoice_number');
      fieldConfidences.invoice_number = 0.88;
    } else {
      validationFlags.push('MISSING_INVOICE_NUMBER');
      fieldConfidences.invoice_number = 0.0;
    }

    // 5. Category validation
    const validCategories = [
      'Utilities',
      'Software/SaaS',
      'Rent/Lease',
      'Telecom',
      'Insurance',
      'Supplies',
      'Professional Services',
      'Taxes',
      'Other',
    ];
    let categoryStr = parsed.category || 'Other';
    if (!validCategories.includes(categoryStr)) {
      categoryStr = 'Other';
    }
    fieldConfidences.category = 0.85;

    // 6. Payment Status validation
    const validStatuses = ['needs_review', 'due_soon', 'overdue', 'paid'];
    let paymentStatus = parsed.payment_status || 'needs_review';
    if (!validStatuses.includes(paymentStatus)) {
      paymentStatus = 'needs_review';
    }

    return {
      success: true,
      modelUsed: model,
      isGemmaModel: isGemma(model),
      data: {
        vendor: vendorStr,
        invoice_number: invoiceNumStr,
        amount: validAmount,
        currency: (parsed.currency || 'USD').toUpperCase().slice(0, 3),
        issue_date: validIssueDate,
        due_date: validDueDate,
        category: categoryStr,
        payment_status: paymentStatus as 'needs_review' | 'due_soon' | 'overdue' | 'paid',
        unverified_fields: unverifiedFields,
        field_confidences: fieldConfidences,
        validation_flags: validationFlags,
        raw_notes: parsed.notes || undefined,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      reason: 'ERROR',
      error: `Local AI analysis failed: ${msg}`,
    };
  }
}

/**
 * Natural language assistant running on local Gemma 2 2B.
 * Queries stored bill data factually without cloud API calls.
 */
export async function askBillSlothAssistant(
  question: string,
  contextData: string
): Promise<{ success: boolean; answer: string; model?: string; error?: string }> {
  const status = await checkOllamaStatus();
  if (!status.available) {
    return {
      success: false,
      answer: '',
      error: 'Local Ollama instance is offline. Please start Ollama (`ollama serve`) to enable AI assistance.',
    };
  }

  const model = status.activeModel || RECOMMENDED_GEMMA_MODEL;
  const host = getOllamaHost();

  const systemPrompt = `You are BillSloth Assistant, a factual on-device finance organizer.
Answer the user's questions about their bills, spending, due dates, and obligations based strictly on the provided ledger context.
Rules:
1. Ground every statement in the provided data.
2. Never invent or hallucinate financial numbers or dates.
3. If the answer is not in the ledger, say: "That information is not recorded in your bills."
4. Be concise, polite, and format amounts and dates clearly.`;

  try {
    const response = await fetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `Current Stored Bills Context:\n"""\n${contextData}\n"""\n\nUser Question: ${question}\n\nFactual Answer:`,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      return { success: false, answer: '', error: `Ollama error HTTP ${response.status}` };
    }

    const data = (await response.json()) as { response?: string };
    return {
      success: true,
      answer: data.response?.trim() || 'No response generated.',
      model,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, answer: '', error: msg };
  }
}
