import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, initDatabase, runTransaction } from '../../server/src/database/db.ts';

// Initial models to seed into registry
const SEED_MODELS = [
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
    capabilities: '["Multimodal", "Structured Data", "Broad Knowledge", "Tool Calling"]'
  },
  {
    id: 'anthropic/claude-3-5-sonnet',
    display_name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    api_compatibility: 'anthropic',
    doc_url: 'https://docs.anthropic.com/en/docs/about-claude/models',
    context_limit: 200000,
    modalities: '["text", "vision"]',
    input_cost_per_million: 3.00,
    output_cost_per_million: 15.00,
    currency: 'USD',
    access_tier: 'paid',
    is_executable: 0,
    is_verified: 1,
    capabilities: '["Code Synthesis", "Complex Reasoning", "Artifact Creation", "Vision"]'
  }
];

export async function seedDatabase() {
  initDatabase();

  runTransaction(() => {
    // 1. Seed Models
    const insertModel = db.prepare(`
      INSERT OR REPLACE INTO model_registry (
        id, display_name, provider, api_compatibility, doc_url, context_limit,
        modalities, input_cost_per_million, output_cost_per_million, currency,
        access_tier, is_executable, is_verified, capabilities
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const m of SEED_MODELS) {
      insertModel.run(
        m.id, m.display_name, m.provider, m.api_compatibility, m.doc_url,
        m.context_limit, m.modalities, m.input_cost_per_million, m.output_cost_per_million,
        m.currency, m.access_tier, m.is_executable, m.is_verified, m.capabilities
      );
    }

    // 2. Seed Default Admin User if not existing
    const adminEmail = 'admin@veyralabs.ai';
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail) as { id: string } | undefined;
    
    if (!existingAdmin) {
      const adminId = 'usr_' + crypto.randomBytes(8).toString('hex');
      const passHash = bcrypt.hashSync('AdminPassword123!', 10);

      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, phone, status, role)
        VALUES (?, ?, ?, ?, ?, 'active', 'admin')
      `).run(adminId, 'VeyraLabs Administrator', adminEmail, passHash, '+15551234567');

      db.prepare(`
        INSERT INTO user_profiles (user_id, display_name, bio, preferred_theme, preferred_language)
        VALUES (?, 'veyralabs-admin', 'System platform administrator and core routing controller.', 'dark', 'en')
      `).run(adminId);

      db.prepare(`
        INSERT INTO user_token_wallets (user_id, available_trial_credits, used_credits, reserved_credits)
        VALUES (?, 50000, 0, 0)
      `).run(adminId);

      db.prepare(`
        INSERT INTO token_usage_ledger (
          id, user_id, request_id, model_id, provider_route,
          input_token_count, output_token_count, platform_credit_charge,
          tx_type, status, metadata
        ) VALUES (?, ?, ?, 'system', 'genesis', 0, 0, 50000, 'INITIAL_GRANT', 'completed', ?)
      `).run(
        'tx_' + crypto.randomBytes(8).toString('hex'),
        adminId,
        'req_genesis',
        JSON.stringify({ reason: 'Administrator Genesis Grant', credits: 50000 })
      );

      console.log('[veyralabs seed] Created default admin account: admin@veyralabs.ai / AdminPassword123!');
    }

    // 3. Seed Default Developer User if not existing
    const devEmail = 'user@veyralabs.ai';
    const existingDev = db.prepare('SELECT id FROM users WHERE email = ?').get(devEmail) as { id: string } | undefined;

    if (!existingDev) {
      const devId = 'usr_' + crypto.randomBytes(8).toString('hex');
      const passHash = bcrypt.hashSync('UserPassword123!', 10);

      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, phone, status, role)
        VALUES (?, ?, ?, ?, ?, 'active', 'user')
      `).run(devId, 'Developer User', devEmail, passHash, '+15559876543');

      db.prepare(`
        INSERT INTO user_profiles (user_id, display_name, bio, preferred_theme, preferred_language)
        VALUES (?, 'dev-tester', 'AI researcher exploring routing algorithms and latency trade-offs.', 'dark', 'en')
      `).run(devId);

      db.prepare(`
        INSERT INTO user_token_wallets (user_id, available_trial_credits, used_credits, reserved_credits)
        VALUES (?, 10000, 0, 0)
      `).run(devId);

      db.prepare(`
        INSERT INTO token_usage_ledger (
          id, user_id, request_id, model_id, provider_route,
          input_token_count, output_token_count, platform_credit_charge,
          tx_type, status, metadata
        ) VALUES (?, ?, ?, 'system', 'welcome', 0, 0, 10000, 'INITIAL_GRANT', 'completed', ?)
      `).run(
        'tx_' + crypto.randomBytes(8).toString('hex'),
        devId,
        'req_welcome',
        JSON.stringify({ reason: 'Initial Trial Allowance', credits: 10000 })
      );

      console.log('[veyralabs seed] Created test user: user@veyralabs.ai / UserPassword123!');
    }
  });

  console.log('[veyralabs seed] Seed completed successfully.');
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed_data.ts')) {
  seedDatabase().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
