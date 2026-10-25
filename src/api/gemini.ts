import { DocumentItem } from '../types';

const STORAGE_KEY_GEMINI = 'billsloth_gemini_api_key';
const STORAGE_KEY_ENGINE = 'billsloth_ai_engine';

export type AiEngineType = 'gemini' | 'browser';

export function getGeminiApiKey(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(STORAGE_KEY_GEMINI);
  if (stored && stored.trim()) return stored.trim();
  const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY;
  return envKey ? envKey.trim() : '';
}

export function setGeminiApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (key.trim()) {
    localStorage.setItem(STORAGE_KEY_GEMINI, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_GEMINI);
  }
}

export function getActiveAiEngine(): AiEngineType {
  if (typeof window === 'undefined') return 'browser';
  const stored = localStorage.getItem(STORAGE_KEY_ENGINE) as AiEngineType | null;
  if (stored && ['gemini', 'browser'].includes(stored)) {
    return stored;
  }
  // Auto-default to Gemini if API key is provided, otherwise browser engine
  return getGeminiApiKey() ? 'gemini' : 'browser';
}

export function setActiveAiEngine(engine: AiEngineType): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_ENGINE, engine);
}

export async function testGeminiApiKey(apiKey: string): Promise<{ success: boolean; model?: string; error?: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { success: false, error: 'API key cannot be empty.' };
  }

  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: 'Respond with the single word: "READY"' }],
              },
            ],
          }),
        }
      );

      if (res.ok) {
        return { success: true, model };
      }
      const errJson = await res.json().catch(() => ({}));
      if (res.status === 400 || res.status === 403) {
        return { success: false, error: errJson.error?.message || `Invalid API key (HTTP ${res.status}).` };
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: `Connection failed: ${msg}` };
    }
  }

  return { success: false, error: 'Could not connect to Gemini models.' };
}

export async function askGeminiAssistant(
  query: string,
  docs: DocumentItem[],
  customKey?: string
): Promise<{ success: boolean; answer: string; model: string; error?: string }> {
  const apiKey = (customKey || getGeminiApiKey()).trim();
  if (!apiKey) {
    return {
      success: false,
      answer: '',
      model: 'gemini-2.5-flash',
      error: 'Gemini API key is missing. Please enter your key in AI Settings.',
    };
  }

  // Format compact ledger summary
  const summaryRows = docs.map(
    (d) =>
      `- Vendor: ${d.vendor || 'Unknown'}, Amount: $${(d.amount || 0).toFixed(2)} ${d.currency || 'USD'}, Due: ${
        d.due_date || 'None'
      }, Status: ${d.computed_status || d.status}, Category: ${d.category || 'Other'}, Verified: ${
        d.is_verified === 1 ? 'Yes' : 'No'
      }, Invoice: ${d.invoice_number || 'N/A'}${d.notes ? `, Notes: ${d.notes}` : ''}`
  );

  const contextText = summaryRows.join('\n') || 'No bills recorded yet.';

  const systemPrompt = `You are BillSloth Assistant, an intelligent, helpful financial organizer.
Answer the user's question about their bills, upcoming deadlines, cash commitments, categories, or actions based on their on-device ledger.
Rules:
1. Ground every financial fact and date in the provided bill context below.
2. If the user asks for actions (e.g. drafting an email to request a payment extension, budgeting advice, category comparison), provide a thoughtful, polished response.
3. Keep amounts formatted with currency ($), dates clear, and use concise markdown bullet points or paragraphs.`;

  const prompt = `CURRENT BILLS LEDGER CONTEXT:
"""
${contextText}
"""

USER QUESTION:
"${query}"

Helpful, factual answer:`;

  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 800,
            },
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const candidate = json.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        if (text) {
          return { success: true, answer: text.trim(), model };
        }
      }
    } catch {
      // try fallback model
    }
  }

  return {
    success: false,
    answer: '',
    model: 'gemini-2.5-flash',
    error: 'Failed to generate response from Gemini API. Check your API key or network connection.',
  };
}

export async function extractInvoiceWithGemini(
  text: string,
  customKey?: string
): Promise<{
  success: boolean;
  fields?: {
    vendor?: string;
    invoice_number?: string;
    amount?: number;
    currency?: string;
    due_date?: string;
    category?: string;
  };
  model?: string;
  error?: string;
}> {
  const apiKey = (customKey || getGeminiApiKey()).trim();
  if (!apiKey) {
    return { success: false, error: 'Gemini API key is missing.' };
  }

  const prompt = `Extract structured invoice fields from this document text.
Return ONLY valid JSON matching this schema:
{
  "vendor": "string or null",
  "invoice_number": "string or null",
  "amount": number or null,
  "currency": "USD" or "EUR" or "GBP",
  "due_date": "YYYY-MM-DD or null",
  "category": "Utilities" | "Software/SaaS" | "Rent/Lease" | "Telecom" | "Insurance" | "Supplies" | "Professional Services" | "Taxes" | "Other"
}

DOCUMENT TEXT:
"""
${text}
"""`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      }
    );

    if (res.ok) {
      const json = await res.json();
      const rawJson = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        return { success: true, fields: parsed, model: 'gemini-2.5-flash' };
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }

  return { success: false, error: 'Extraction failed via Gemini.' };
}
