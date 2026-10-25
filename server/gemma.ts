import { CONFIG } from './config.js';

export interface GemmaResponse {
  success: boolean;
  answer?: string;
  fields?: {
    vendor: string | null;
    invoice_number: string | null;
    amount: number | null;
    currency: string;
    issue_date: string | null;
    due_date: string | null;
    category: string;
    notes?: string;
  };
  modelUsed: string;
  error?: string;
}

/**
 * Direct call to Google's hosted Gemma model via the Generative Language API.
 * Adheres strictly to the requirement: NEVER silently fallback to Gemini if Gemma fails.
 */
export async function callGemmaGenerate(
  prompt: string,
  timeoutMs: number = 35000
): Promise<{ success: boolean; text?: string; modelUsed: string; error?: string }> {
  const model = CONFIG.AI_MODEL || 'gemma-4-26b-a4b-it';
  const apiKey = CONFIG.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    return {
      success: false,
      modelUsed: model,
      error: 'Google API key is not configured on the backend server. Please set GEMINI_API_KEY in your .env file.',
    };
  }

  // Attempt up to 2 times to handle transient upstream 500s on the hosted Gemma endpoint
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2500,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        let errMsg = `HTTP ${res.status} ${res.statusText}`;
        try {
          const errJson = await res.json();
          if (errJson.error?.message) {
            errMsg = errJson.error.message;
          }
        } catch {
          // Status text
        }

        // Retry once on transient upstream 500/503
        if (attempt === 1 && (res.status === 500 || res.status === 503)) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        return {
          success: false,
          modelUsed: model,
          error: `Gemma model request failed (${model}): ${errMsg}. (Strict policy: Not falling back to Gemini).`,
        };
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      const parts = (candidate?.content?.parts || []) as Array<{ text?: string; thought?: boolean }>;

      // Gemma 4 uses native chain-of-thought: part 0 has thought: true, subsequent part has the final user response
      const answerPart = parts.find((p) => !p.thought && p.text) || parts[parts.length - 1];
      const text = answerPart?.text;

      if (!text) {
        return {
          success: false,
          modelUsed: model,
          error: `Gemma model (${model}) returned an empty response.`,
        };
      }

      return {
        success: true,
        text: text.trim(),
        modelUsed: model,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort = (err as { name?: string }).name === 'AbortError';
      const msg = isAbort
        ? `Request to Gemma (${model}) timed out after ${timeoutMs / 1000}s`
        : err instanceof Error
        ? err.message
        : String(err);

      if (attempt === 1 && !isAbort) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }

      return {
        success: false,
        modelUsed: model,
        error: `Gemma inference error: ${msg}. (Strict policy: Not falling back to Gemini).`,
      };
    }
  }

  return {
    success: false,
    modelUsed: model,
    error: `Gemma request failed after retry. (Strict policy: Not falling back to Gemini).`,
  };
}

/**
 * Natural language assistant powered by Gemma, strictly grounded in SQLite ledger facts.
 */
export async function askGemmaAssistant(
  query: string,
  billsSummary: string,
  metrics: {
    totalUnpaid: number;
    overdueCount: number;
    dueSoonCount: number;
    totalBills: number;
  }
): Promise<{ success: boolean; answer: string; modelUsed: string; error?: string }> {
  const model = CONFIG.AI_MODEL || 'gemma-4-26b-a4b-it';

  const prompt = `You are BillSloth Assistant, powered by Google's open-weight Gemma model (${model}) running via hosted inference.

CRITICAL INSTRUCTIONS:
1. Privacy Disclosure: Ground your answers strictly in the verified local ledger facts provided below.
2. Financial Precision: BillSloth's local SQLite engine has calculated the exact metrics below. DO NOT alter or fabricate these numbers:
   - Total Unpaid Obligations: $${metrics.totalUnpaid.toFixed(2)} USD
   - Overdue Bills: ${metrics.overdueCount}
   - Bills Due in Next 7 Days: ${metrics.dueSoonCount}
   - Total Recorded Documents: ${metrics.totalBills}
3. Answer Depth: Provide a comprehensive, detailed, and well-structured answer with executive summaries, itemized details, and actionable recommendations.
4. Format: Use clean GitHub Markdown with clear headers, bold keys, bullet points, and monetary values clearly formatted ($0.00).
5. If drafting correspondence (e.g. extension requests), write a complete, professional, ready-to-use email.

LOCAL ON-DEVICE BILL LEDGER RECORDS:
"""
${billsSummary || 'No bills currently recorded in SQLite database.'}
"""

USER QUESTION:
"${query}"

Provide a detailed, helpful, and factual response:`;

  const result = await callGemmaGenerate(prompt, 35000);

  if (!result.success || !result.text) {
    return {
      success: false,
      answer: `⚠️ **Gemma Model Error**: ${result.error || 'Failed to generate response.'}`,
      modelUsed: result.modelUsed,
      error: result.error,
    };
  }

  return {
    success: true,
    answer: result.text,
    modelUsed: result.modelUsed,
  };
}

/**
 * Extract structured invoice fields using Gemma
 */
export async function extractInvoiceWithGemma(
  rawText: string
): Promise<GemmaResponse> {
  const model = CONFIG.AI_MODEL || 'gemma-4-26b-a4b-it';

  const prompt = `You are a financial document parser for BillSloth using Gemma (${model}).
Extract the key invoice fields from the following OCR / document text into a clean JSON object.

REQUIRED JSON FORMAT:
{
  "vendor": "Vendor Name or null",
  "invoice_number": "Invoice reference number or null",
  "amount": 123.45,
  "currency": "USD",
  "issue_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "category": "Utilities | Software/SaaS | Rent/Lease | Telecom | Insurance | Supplies | Taxes | Professional Services | Other",
  "notes": "Short summary or notes"
}

RULES:
- Return ONLY the JSON object, wrapped in a \`\`\`json markdown block.
- If amount is not found, set to null.
- Dates must be YYYY-MM-DD.

DOCUMENT TEXT:
"""
${rawText.slice(0, 4000)}
"""`;

  const result = await callGemmaGenerate(prompt, 35000);

  if (!result.success || !result.text) {
    return {
      success: false,
      modelUsed: result.modelUsed,
      error: result.error,
    };
  }

  try {
    const jsonMatch = result.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, result.text];
    const parsed = JSON.parse(jsonMatch[1] || result.text);
    return {
      success: true,
      fields: {
        vendor: parsed.vendor || null,
        invoice_number: parsed.invoice_number || null,
        amount: typeof parsed.amount === 'number' ? parsed.amount : (parsed.amount ? parseFloat(parsed.amount) : null),
        currency: parsed.currency || 'USD',
        issue_date: parsed.issue_date || null,
        due_date: parsed.due_date || null,
        category: parsed.category || 'Other',
        notes: parsed.notes || 'Extracted via Gemma hosted model',
      },
      modelUsed: result.modelUsed,
    };
  } catch (parseErr: unknown) {
    return {
      success: false,
      modelUsed: result.modelUsed,
      error: `Failed to parse Gemma extraction JSON: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
    };
  }
}
