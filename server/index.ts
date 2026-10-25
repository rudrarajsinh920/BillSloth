import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDb, UPLOADS_DIR, db } from './db.js';
import { seedSampleData } from './sampleData.js';
import routes from './routes.js';
import { CONFIG } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

const app = express();
const PORT = CONFIG.PORT;

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
  console.log('🦥 Seeding illustrative sample data for evaluation...');
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

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🦥 ===============================================`);
  console.log(`   BillSloth Local Backend is running!`);
  console.log(`   URL: http://127.0.0.1:${PORT}`);
  console.log(`   Local Data Storage: ./data/billsloth.db`);
  console.log(`   Local Uploads: ./data/uploads`);
  console.log(`   AI Engine: Google Gemma (${CONFIG.AI_MODEL}) [Hosted Inference via Backend]`);
  console.log(`   Privacy: Local SQLite Ledger • Hosted AI via Secure Express Proxy`);
  console.log(`===============================================\n`);
});
