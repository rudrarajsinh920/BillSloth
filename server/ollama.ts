export interface OllamaStatus {
  available: boolean;
  url: string;
  models: string[];
  activeModel: string | null;
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
  unverified_fields: string[];
  raw_notes?: string;
}

export interface ExtractionResult {
  success: boolean;
  modelUsed?: string;
  data?: ExtractedBillData;
  error?: string;
  reason?: 'OLLAMA_OFFLINE' | 'NO_MODEL' | 'PARSE_FAILED' | 'ERROR';
}

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

/**
 * Checks local Ollama server status.
 * Never calls any external or cloud API.
 */
export async function checkOllamaStatus(): Promise<OllamaStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${OLLAMA_HOST}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        available: false,
        url: OLLAMA_HOST,
        models: [],
        activeModel: null,
        error: `Ollama responded with status ${res.status}`,
      };
    }

    const data = (await res.json()) as { models?: Array<{ name: string }> };
    const modelNames = (data.models || []).map((m) => m.name);

    // Pick preferred vision/text model if present
    const preferredOrder = ['llama3.2-vision', 'llama3.2', 'mistral', 'llama3', 'qwen2.5', 'phi3'];
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
      url: OLLAMA_HOST,
      models: modelNames,
      activeModel: chosenModel,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      available: false,
      url: OLLAMA_HOST,
      models: [],
      activeModel: null,
      error: `Could not connect to local Ollama daemon at ${OLLAMA_HOST} (${msg})`,
    };
  }
}

/**
 * Extract financial fields using a local Ollama model.
 * Adheres strictly to the privacy and safety rules:
 * - Never uploads financial documents to cloud AI.
 * - Do not invent missing amounts, currencies, dates, or vendors.
 * - Treat extracted fields as unverified until validated or reviewed.
 * - Never simulate successful AI extraction when no model is connected.
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
      error: 'Ollama is running, but no models were found. Please pull a model (e.g. `ollama pull llama3.2`) to enable extraction.',
    };
  }

  const systemPrompt = `You are a strict financial document parser. Extract key fields from the invoice or receipt text.
Rules:
1. ONLY return a single valid JSON object matching this schema.
2. DO NOT invent or assume values. If a field is not present or ambiguous, set it to null.
3. Currency must be ISO code (USD, EUR, GBP, CAD, AUD) or "USD" if standard dollar sign.
4. Dates must be formatted as YYYY-MM-DD or null.
5. Categories must be one of: "Utilities", "Software/SaaS", "Rent/Lease", "Telecom", "Insurance", "Supplies", "Professional Services", "Taxes", "Other".
6. JSON schema:
{
  "vendor": string | null,
  "invoice_number": string | null,
  "amount": number | null,
  "currency": string,
  "issue_date": string | null,
  "due_date": string | null,
  "category": string,
  "notes": string | null
}`;

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `Document text to extract:\n"""\n${textOrOcr}\n"""\n\nReturn JSON:`,
        system: systemPrompt,
        format: 'json',
        stream: false,
        options: {
          temperature: 0.1, // low temperature for deterministic factual extraction
        },
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        reason: 'ERROR',
        error: `Ollama generation failed with HTTP ${response.status}`,
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

    const parsed = JSON.parse(rawOutput);

    // Track which fields were found vs missing
    const unverifiedFields: string[] = [];
    if (parsed.vendor) unverifiedFields.push('vendor');
    if (parsed.invoice_number) unverifiedFields.push('invoice_number');
    if (parsed.amount !== null && parsed.amount !== undefined) unverifiedFields.push('amount');
    if (parsed.due_date) unverifiedFields.push('due_date');
    if (parsed.issue_date) unverifiedFields.push('issue_date');
    if (parsed.category) unverifiedFields.push('category');

    return {
      success: true,
      modelUsed: model,
      data: {
        vendor: parsed.vendor || null,
        invoice_number: parsed.invoice_number || null,
        amount: typeof parsed.amount === 'number' ? parsed.amount : (parsed.amount ? parseFloat(parsed.amount) : null),
        currency: parsed.currency || 'USD',
        issue_date: parsed.issue_date || null,
        due_date: parsed.due_date || null,
        category: parsed.category || 'Other',
        unverified_fields: unverifiedFields,
        raw_notes: parsed.notes || undefined,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      reason: 'ERROR',
      error: `Local Ollama extraction failed: ${msg}`,
    };
  }
}
