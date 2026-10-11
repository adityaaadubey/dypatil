import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database directory & file path
const dbDir = path.resolve(__dirname, '../../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_FILE || path.join(dbDir, 'veyralabs.db');
export const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

export function initDatabase() {
  const migrationPath = path.resolve(__dirname, '../../../database/migrations/001_initial_schema.sql');
  if (fs.existsSync(migrationPath)) {
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    db.exec(migrationSql);
    console.log('[veyralabs db] Initial schema verified & migration applied.');
  }
}

// Transaction helper
export function runTransaction<T>(fn: () => T): T {
  const execute = db.transaction(fn);
  return execute();
}
