import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createWorker } from 'tesseract.js';

export interface LocalExtractionResult {
  text: string;
  method: 'pdf_text' | 'local_ocr' | 'fallback_none';
  confidence: number; // 0 to 100 advisory score
  pageCount?: number;
  fileHash: string;
}

/**
 * Computes a SHA-256 hash of a file for duplicate detection.
 */
export function computeFileHash(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Extracts embedded text from a PDF file using local pdf-parse library.
 */
async function extractTextFromPdf(filePath: string): Promise<{ text: string; pageCount: number } | null> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfModule = await import('pdf-parse');
    const mod = pdfModule as unknown as Record<string, unknown>;
    const PDFParse = (mod.PDFParse || (mod.default as Record<string, unknown>)?.PDFParse || mod.default) as
      | ((buf: Buffer) => Promise<{ text?: string; numpages?: number }>)
      | (new (opts: { data: Buffer }) => {
          load: () => Promise<void>;
          getText: () => Promise<{ text?: string; total?: number } | string>;
          getInfo: () => Promise<{ numPages?: number }>;
        });

    if (typeof PDFParse === 'function' && 'prototype' in PDFParse && (PDFParse.prototype as { getText?: unknown })?.getText) {
      const ConstructableParser = PDFParse as new (opts: { data: Buffer }) => {
        load: () => Promise<void>;
        getText: () => Promise<{ text?: string; total?: number } | string>;
        getInfo: () => Promise<{ numPages?: number }>;
      };
      const parser = new ConstructableParser({ data: dataBuffer });
      await parser.load();
      const textRes = await parser.getText();
      const rawText = typeof textRes === 'string' ? textRes : (textRes?.text || '');
      const totalPages = typeof textRes === 'object' && textRes && 'total' in textRes && typeof textRes.total === 'number'
        ? textRes.total
        : 1;
      return {
        text: rawText.trim(),
        pageCount: totalPages,
      };
    } else if (typeof PDFParse === 'function') {
      const CallableParser = PDFParse as (buf: Buffer) => Promise<{ text?: string; numpages?: number }>;
      const data = await CallableParser(dataBuffer);
      return {
        text: (data.text || '').trim(),
        pageCount: data.numpages || 1,
      };
    }

    // Direct fallback if PDF stream text is accessible
    const rawContent = dataBuffer.toString('latin1');
    const textMatches: string[] = [];
    const textBlockRegex = /BT[\s\S]*?ET/g;
    let match;
    while ((match = textBlockRegex.exec(rawContent)) !== null) {
      const tjMatches = match[0].match(/\((.*?)\)\s*Tj/g);
      if (tjMatches) {
        textMatches.push(
          tjMatches.map((m) => m.replace(/^\(/, '').replace(/\)\s*Tj$/, '')).join(' ')
        );
      }
    }
    const extracted = textMatches.join('\n').trim();
    if (extracted.length > 20) {
      return { text: extracted, pageCount: 1 };
    }

    return null;
  } catch (err) {
    console.warn(`[LocalExtractor] PDF parsing failed for ${path.basename(filePath)}:`, err);
    return null;
  }
}

/**
 * Extracts text from an image or scanned document using local Tesseract.js OCR.
 * Never calls any external cloud API.
 */
async function extractTextWithLocalOcr(filePath: string): Promise<{ text: string; confidence: number }> {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    worker = await createWorker('eng');
    const ret = await worker.recognize(filePath);
    const text = (ret.data?.text || '').trim();
    const confidence = Math.round(ret.data?.confidence || 0);
    return { text, confidence };
  } catch (err) {
    console.warn(`[LocalExtractor] Local OCR failed for ${path.basename(filePath)}:`, err);
    return { text: '', confidence: 0 };
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
  }
}

/**
 * Main entry point for local document extraction.
 * Supports PDF, JPG, JPEG, and PNG.
 * 100% local processing.
 */
export async function extractDocumentTextLocally(
  filePath: string,
  mimeType: string
): Promise<LocalExtractionResult> {
  const fileHash = computeFileHash(filePath);

  // 1. PDF Documents
  if (mimeType === 'application/pdf') {
    const pdfResult = await extractTextFromPdf(filePath);
    if (pdfResult && pdfResult.text.length > 0) {
      // Embedded text found in PDF
      return {
        text: pdfResult.text,
        method: 'pdf_text',
        confidence: 95,
        pageCount: pdfResult.pageCount,
        fileHash,
      };
    }

    // Scanned or image-only PDF without embedded text stream
    return {
      text: '',
      method: 'pdf_text',
      confidence: 0,
      pageCount: pdfResult?.pageCount || 1,
      fileHash,
    };
  }

  // 2. Images (JPG, JPEG, PNG)
  if (mimeType.startsWith('image/')) {
    const ocrResult = await extractTextWithLocalOcr(filePath);
    return {
      text: ocrResult.text,
      method: 'local_ocr',
      confidence: ocrResult.confidence,
      pageCount: 1,
      fileHash,
    };
  }

  // Fallback
  return {
    text: '',
    method: 'fallback_none',
    confidence: 0,
    fileHash,
  };
}
