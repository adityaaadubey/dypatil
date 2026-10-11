import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import bcrypt from 'bcryptjs';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory Relational Store (Activated on Vercel / Serverless where native SQLite binaries cannot run)
class InMemoryDB {
  users: any[] = [];
  user_profiles: any[] = [];
  user_token_wallets: any[] = [];
  user_sessions: any[] = [];
  model_registry: any[] = [];
  token_usage_ledger: any[] = [];
  model_execution_history: any[] = [];
  prompt_cache: any[] = [];
  pricing_packages_orders: any[] = [];

  constructor() {
    this.seedDefaults();
  }

  seedDefaults() {
    // 1. Admin Account
    const adminId = 'usr_admin_genesis';
    const adminHash = bcrypt.hashSync('AdminPassword123!', 10);
    this.users.push({
      id: adminId,
      name: 'VeyraLabs Administrator',
      email: 'admin@veyralabs.ai',
      password_hash: adminHash,
      phone: '+15551234567',
      status: 'active',
      role: 'admin',
      last_login: null,
      last_activity: null,
      created_at: new Date().toISOString()
    });
    this.user_profiles.push({
      user_id: adminId,
      display_name: 'veyralabs-admin',
      bio: 'System platform administrator and core routing controller.',
      phone: '+15551234567',
      preferred_theme: 'dark',
      preferred_language: 'en',
      avatar_url: null,
      updated_at: new Date().toISOString()
    });
    this.user_token_wallets.push({
      user_id: adminId,
      available_trial_credits: 50000,
      used_credits: 0,
      reserved_credits: 0,
      updated_at: new Date().toISOString()
    });

    // 2. Demo User Account
    const userId = 'usr_demo_genesis';
    const userHash = bcrypt.hashSync('UserPassword123!', 10);
    this.users.push({
      id: userId,
      name: 'VeyraLabs Researcher',
      email: 'user@veyralabs.ai',
      password_hash: userHash,
      phone: '+15559876543',
      status: 'active',
      role: 'user',
      last_login: null,
      last_activity: null,
      created_at: new Date().toISOString()
    });
    this.user_profiles.push({
      user_id: userId,
      display_name: 'ai-researcher-01',
      bio: 'Machine learning engineer & inference performance evaluator.',
      phone: '+15559876543',
      preferred_theme: 'dark',
      preferred_language: 'en',
      avatar_url: null,
      updated_at: new Date().toISOString()
    });
    this.user_token_wallets.push({
      user_id: userId,
      available_trial_credits: 10000,
      used_credits: 0,
      reserved_credits: 0,
      updated_at: new Date().toISOString()
    });

    // 3. Seed Models
    this.model_registry.push(
      {
        id: 'gemini-flash-latest',
        display_name: 'Gemini 2.5 Flash Latest',
        provider: 'Google Gemini',
        api_compatibility: 'gemini',
        doc_url: 'https://ai.google.dev/gemini-api/docs/models/gemini',
        context_limit: 1048576,
        modalities: '["text", "vision", "audio"]',
        input_cost_per_million: 0.075,
        output_cost_per_million: 0.30,
        currency: 'USD',
        access_tier: 'free',
        is_executable: 1,
        is_verified: 1,
        capabilities: '["Fast Inference", "Multi-Modal", "Native Tool Calling", "Long Context"]'
      },
      {
        id: 'gemini-flash-lite-latest',
        display_name: 'Gemini 2.5 Flash Lite Latest',
        provider: 'Google Gemini',
        api_compatibility: 'gemini',
        doc_url: 'https://ai.google.dev/gemini-api/docs/models/gemini',
        context_limit: 1048576,
        modalities: '["text", "vision"]',
        input_cost_per_million: 0.0375,
        output_cost_per_million: 0.15,
        currency: 'USD',
        access_tier: 'free',
        is_executable: 1,
        is_verified: 1,
        capabilities: '["Ultra Low Latency", "High Throughput", "Lightweight Reasoning"]'
      },
      {
        id: 'gemini-pro-latest',
        display_name: 'Gemini 2.5 Pro Latest',
        provider: 'Google Gemini',
        api_compatibility: 'gemini',
        doc_url: 'https://ai.google.dev/gemini-api/docs/models/gemini',
        context_limit: 2097152,
        modalities: '["text", "vision", "code"]',
        input_cost_per_million: 1.25,
        output_cost_per_million: 5.00,
        currency: 'USD',
        access_tier: 'paid',
        is_executable: 1,
        is_verified: 1,
        capabilities: '["Deep Reasoning", "Complex Code Synthesis", "2M Context Window"]'
      },
      {
        id: 'openai/gpt-4o',
        display_name: 'GPT-4o (Omni)',
        provider: 'OpenAI',
        api_compatibility: 'openai',
        doc_url: 'https://platform.openai.com/docs/models/gpt-4o',
        context_limit: 128000,
        modalities: '["text", "vision"]',
        input_cost_per_million: 2.50,
        output_cost_per_million: 10.00,
        currency: 'USD',
        access_tier: 'paid',
        is_executable: 0,
        is_verified: 1,
        capabilities: '["Multi-Modal", "Complex Reasoning", "Tool Use", "Structured Outputs"]'
      }
    );
  }

  pragma(_stmt: string) {}
  exec(_sql: string) {}
  transaction<T>(fn: () => T): () => T {
    return fn;
  }

  prepare(sql: string) {
    const cleanSql = sql.replace(/\s+/g, ' ').trim();
    const self = this;

    return {
      run(...args: any[]) {
        const lower = cleanSql.toLowerCase();

        // INSERT INTO user_sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)
        if (lower.startsWith('insert into user_sessions')) {
          const [id, user_id, token, expires_at] = args;
          self.user_sessions.push({ id, user_id, token, expires_at, created_at: new Date().toISOString() });
          return { changes: 1, lastInsertRowid: self.user_sessions.length };
        }

        // INSERT INTO users (id, name, email, password_hash, phone, status, role)
        if (lower.startsWith('insert into users')) {
          const [id, name, email, password_hash, phone, status, role] = args;
          self.users.push({
            id,
            name,
            email,
            password_hash,
            phone: phone || null,
            status: status || 'active',
            role: role || 'user',
            created_at: new Date().toISOString(),
            last_login: null,
            last_activity: null
          });
          return { changes: 1, lastInsertRowid: self.users.length };
        }

        // INSERT INTO user_profiles (user_id, display_name, phone, preferred_theme, preferred_language)
        if (lower.startsWith('insert into user_profiles')) {
          const [user_id, display_name, phone, preferred_theme, preferred_language] = args;
          self.user_profiles.push({
            user_id,
            display_name,
            phone: phone || null,
            preferred_theme: preferred_theme || 'dark',
            preferred_language: preferred_language || 'en',
            updated_at: new Date().toISOString()
          });
          return { changes: 1, lastInsertRowid: self.user_profiles.length };
        }

        // INSERT INTO user_token_wallets
        if (lower.startsWith('insert into user_token_wallets')) {
          const [user_id, available_trial_credits, used_credits, reserved_credits] = args;
          self.user_token_wallets.push({
            user_id,
            available_trial_credits: available_trial_credits || 10000,
            used_credits: used_credits || 0,
            reserved_credits: reserved_credits || 0,
            updated_at: new Date().toISOString()
          });
          return { changes: 1, lastInsertRowid: self.user_token_wallets.length };
        }

        // INSERT INTO token_usage_ledger
        if (lower.startsWith('insert into token_usage_ledger')) {
          self.token_usage_ledger.push({
            id: args[0],
            user_id: args[1],
            request_id: args[2],
            model_id: args[3],
            provider_route: args[4],
            input_token_count: args[5],
            output_token_count: args[6],
            platform_credit_charge: args[7],
            tx_type: args[8],
            status: args[9],
            metadata: args[10],
            created_at: new Date().toISOString()
          });
          return { changes: 1, lastInsertRowid: self.token_usage_ledger.length };
        }

        // INSERT INTO model_execution_history
        if (lower.startsWith('insert into model_execution_history')) {
          self.model_execution_history.push({
            id: args[0],
            user_id: args[1],
            request_id: args[2],
            model_id: args[3],
            provider: args[4],
            prompt: args[5],
            response_text: args[6],
            input_tokens: args[7],
            output_tokens: args[8],
            cost_estimate: args[9],
            latency_ms: args[10],
            status: args[11],
            error_message: args[12],
            cache_hit: args[13],
            created_at: new Date().toISOString()
          });
          return { changes: 1, lastInsertRowid: self.model_execution_history.length };
        }

        // INSERT INTO prompt_cache
        if (lower.startsWith('insert into prompt_cache')) {
          self.prompt_cache.push({
            id: args[0],
            prompt_hash: args[1],
            model_id: args[2],
            response_text: args[3],
            tokens_used: args[4],
            hit_count: 0,
            created_at: new Date().toISOString()
          });
          return { changes: 1 };
        }

        // INSERT OR REPLACE INTO model_registry
        if (lower.startsWith('insert or replace into model_registry') || lower.startsWith('insert into model_registry')) {
          const idx = self.model_registry.findIndex((m) => m.id === args[0]);
          const modelObj = {
            id: args[0],
            display_name: args[1],
            provider: args[2],
            api_compatibility: args[3],
            doc_url: args[4],
            context_limit: args[5],
            modalities: args[6],
            input_cost_per_million: args[7],
            output_cost_per_million: args[8],
            currency: args[9],
            access_tier: args[10],
            is_executable: args[11],
            is_verified: args[12],
            capabilities: args[13]
          };
          if (idx >= 0) self.model_registry[idx] = modelObj;
          else self.model_registry.push(modelObj);
          return { changes: 1 };
        }

        // UPDATE user_token_wallets
        if (lower.startsWith('update user_token_wallets')) {
          const wallet = self.user_token_wallets.find((w) => w.user_id === args[args.length - 1]);
          if (wallet) {
            wallet.available_trial_credits = args[0] !== undefined ? args[0] : wallet.available_trial_credits;
            wallet.used_credits = args[1] !== undefined ? args[1] : wallet.used_credits;
            wallet.reserved_credits = args[2] !== undefined ? args[2] : wallet.reserved_credits;
            wallet.updated_at = new Date().toISOString();
          }
          return { changes: 1 };
        }

        // UPDATE users SET last_login / last_activity
        if (lower.startsWith('update users')) {
          const user = self.users.find((u) => u.id === args[args.length - 1]);
          if (user) {
            user.last_login = new Date().toISOString();
            user.last_activity = new Date().toISOString();
          }
          return { changes: 1 };
        }

        // UPDATE user_profiles
        if (lower.startsWith('update user_profiles')) {
          const profile = self.user_profiles.find((p) => p.user_id === args[args.length - 1]);
          if (profile) {
            if (args[0] !== undefined) profile.display_name = args[0];
            if (args[1] !== undefined) profile.bio = args[1];
            if (args[2] !== undefined) profile.phone = args[2];
            if (args[3] !== undefined) profile.preferred_theme = args[3];
            if (args[4] !== undefined) profile.preferred_language = args[4];
            profile.updated_at = new Date().toISOString();
          }
          return { changes: 1 };
        }

        // DELETE FROM user_sessions WHERE token = ?
        if (lower.startsWith('delete from user_sessions')) {
          const token = args[0];
          self.user_sessions = self.user_sessions.filter((s) => s.token !== token);
          return { changes: 1 };
        }

        return { changes: 1, lastInsertRowid: 1 };
      },

      get(...args: any[]) {
        const lower = cleanSql.toLowerCase();

        // SELECT id FROM users WHERE email = ?
        // SELECT * FROM users WHERE email = ?
        if (lower.includes('from users') && lower.includes('email = ?')) {
          const email = String(args[0]).toLowerCase();
          const user = self.users.find((u) => u.email.toLowerCase() === email);
          return user ? { ...user } : undefined;
        }

        // SELECT * FROM users WHERE id = ?
        if (lower.includes('from users') && lower.includes('id = ?')) {
          const user = self.users.find((u) => u.id === args[0]);
          return user ? { ...user } : undefined;
        }

        // SELECT count(*) as count FROM users
        if (lower.includes('select count(*) as count from users')) {
          return { count: self.users.length };
        }

        // Session validation join:
        // SELECT s.token, s.expires_at, u.id, u.name, u.email, u.role, u.status FROM user_sessions s JOIN users u ... WHERE s.token = ?
        if (lower.includes('from user_sessions') && lower.includes('where s.token = ?')) {
          const session = self.user_sessions.find((s) => s.token === args[0]);
          if (!session) return undefined;
          const user = self.users.find((u) => u.id === session.user_id);
          if (!user) return undefined;
          return {
            token: session.token,
            expires_at: session.expires_at,
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
          };
        }

        // SELECT * FROM user_profiles WHERE user_id = ?
        if (lower.includes('from user_profiles') && lower.includes('user_id = ?')) {
          const profile = self.user_profiles.find((p) => p.user_id === args[0]);
          return profile ? { ...profile } : undefined;
        }

        // SELECT * FROM user_token_wallets WHERE user_id = ?
        if (lower.includes('from user_token_wallets') && lower.includes('user_id = ?')) {
          const wallet = self.user_token_wallets.find((w) => w.user_id === args[0]);
          return wallet ? { ...wallet } : undefined;
        }

        // SELECT * FROM model_registry WHERE id = ?
        if (lower.includes('from model_registry') && lower.includes('id = ?')) {
          const model = self.model_registry.find((m) => m.id === args[0]);
          return model ? { ...model } : undefined;
        }

        // SELECT * FROM prompt_cache WHERE prompt_hash = ?
        if (lower.includes('from prompt_cache') && lower.includes('prompt_hash = ?')) {
          const cache = self.prompt_cache.find((c) => c.prompt_hash === args[0]);
          return cache ? { ...cache } : undefined;
        }

        return undefined;
      },

      all(...args: any[]) {
        const lower = cleanSql.toLowerCase();

        // SELECT * FROM model_registry
        if (lower.includes('from model_registry')) {
          return [...self.model_registry];
        }

        // SELECT * FROM token_usage_ledger WHERE user_id = ?
        if (lower.includes('from token_usage_ledger')) {
          const userId = args[0];
          return self.token_usage_ledger.filter((l) => !userId || l.user_id === userId);
        }

        // SELECT * FROM model_execution_history WHERE user_id = ?
        if (lower.includes('from model_execution_history')) {
          const userId = args[0];
          return self.model_execution_history.filter((h) => !userId || h.user_id === userId);
        }

        // SELECT * FROM users
        if (lower.includes('from users')) {
          return self.users.map((u) => {
            const { password_hash, ...rest } = u;
            return rest;
          });
        }

        return [];
      }
    };
  }
}

// Dual Database Export
let activeDb: any;
let isNativeSqlite = false;

try {
  // If better-sqlite3 is installed and callable
  const Database = require('better-sqlite3');
  const isVercel = Boolean(process.env.VERCEL);
  const dbDir = isVercel ? '/tmp' : path.resolve(process.cwd(), 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = process.env.DATABASE_FILE || path.join(dbDir, 'veyralabs.db');
  activeDb = new Database(dbPath);
  activeDb.pragma('foreign_keys = ON');
  activeDb.pragma('journal_mode = WAL');
  isNativeSqlite = true;
  console.log(`[veyralabs db] Connected to SQLite database at ${dbPath}`);
} catch (err) {
  console.log('[veyralabs db] Native SQLite not available. Using In-Memory Relational Engine with pre-seeded accounts.');
  activeDb = new InMemoryDB();
}

export const db = activeDb;

export function initDatabase() {
  if (isNativeSqlite) {
    try {
      const migrationPath = path.resolve(process.cwd(), 'database/migrations/001_initial_schema.sql');
      if (fs.existsSync(migrationPath)) {
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        db.exec(migrationSql);
        console.log('[veyralabs db] Initial schema verified & migration applied.');
      }
    } catch (e: any) {
      console.warn('[veyralabs db] Migration warning:', e.message);
    }
  }
}

// Transaction helper
export function runTransaction<T>(fn: () => T): T {
  if (db && typeof db.transaction === 'function') {
    const execute = db.transaction(fn);
    return execute();
  }
  return fn();
}
