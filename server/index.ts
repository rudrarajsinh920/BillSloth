import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDb, UPLOADS_DIR, db } from './db.js';
import { seedSampleData } from './sampleData.js';
import { startOllamaDaemon, checkOllamaStatus } from './ollama.js';
import routes from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve uploaded files securely from local directory
app.use('/uploads', express.static(UPLOADS_DIR));

// Initialize Database
initDb();

// Seed initial sample data if DB is empty to demonstrate all states immediately
const countStmt = db.prepare('SELECT COUNT(*) as count FROM documents');
const countRes = countStmt.get() as { count: number };
if (countRes.count === 0) {
  console.log('🦥 Seeding illustrative sample data for Hacktoberfest evaluation...');
  seedSampleData();
}

// Register API Routes
app.use('/api', routes);

// Serve production frontend assets if built
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.resolve(DIST_DIR, 'index.html'));
  });
}


app.listen(PORT, '127.0.0.1', async () => {
  console.log(`\n🦥 ===============================================`);
  console.log(`   BillSloth Local Backend is running!`);
  console.log(`   URL: http://127.0.0.1:${PORT}`);
  console.log(`   Local Data Storage: ./data/billsloth.db`);
  console.log(`   Local Uploads: ./data/uploads`);
  console.log(`   Privacy: 100% Local • Zero Cloud Transmission`);
  console.log(`===============================================\n`);

  // Automatically start local Ollama daemon if installed
  try {
    const ollamaResult = await startOllamaDaemon();
    if (ollamaResult.started) {
      const status = await checkOllamaStatus();
      console.log(`🦥 Ollama Status: ONLINE (Active Model: ${status.activeModel || 'None detected'})`);
    } else {
      console.log(`🦥 Ollama Status: STANDBY (${ollamaResult.error || 'Daemon offline'})`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`🦥 Ollama Status: STANDBY (${msg})`);
  }
});
