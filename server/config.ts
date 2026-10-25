import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, '../.env');

// Zero-dependency environment variable loader for .env
if (fs.existsSync(rootEnvPath)) {
  try {
    const raw = fs.readFileSync(rootEnvPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key] && val) {
          process.env[key] = val;
        }
      }
    }
  } catch {
    // Continue if reading fails
  }
}

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gemma-4-26b-a4b-it',
  AI_PROVIDER: 'gemma' as const,
  IS_HOSTED_INFERENCE: true,
};
