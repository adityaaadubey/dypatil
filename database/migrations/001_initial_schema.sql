-- VeyraLabs AI Intelligence Platform Initial Relational SQL Schema
-- Supports SQLite and PostgreSQL syntax conventions

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    last_activity DATETIME
);

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    preferred_theme TEXT DEFAULT 'dark',
    preferred_language TEXT DEFAULT 'en',
    privacy_preferences TEXT DEFAULT '{}',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_token_wallets (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    available_trial_credits INTEGER NOT NULL DEFAULT 10000,
    used_credits INTEGER NOT NULL DEFAULT 0,
    reserved_credits INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS token_usage_ledger (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id TEXT,
    model_id TEXT,
    provider_route TEXT,
    input_token_count INTEGER DEFAULT 0,
    output_token_count INTEGER DEFAULT 0,
    platform_credit_charge INTEGER NOT NULL,
    provider_cost_estimate REAL DEFAULT 0.0,
    provider_reported_cost REAL,
    tx_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
);

CREATE TABLE IF NOT EXISTS model_registry (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    api_compatibility TEXT DEFAULT 'openai',
    doc_url TEXT,
    context_limit INTEGER NOT NULL,
    modalities TEXT DEFAULT 'text',
    input_cost_per_million REAL NOT NULL,
    output_cost_per_million REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    access_tier TEXT DEFAULT 'paid',
    is_executable INTEGER DEFAULT 0,
    is_verified INTEGER DEFAULT 1,
    capabilities TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendation_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    category TEXT,
    request_constraints TEXT,
    estimated_input_tokens INTEGER,
    estimated_output_tokens INTEGER,
    eligible_models TEXT,
    rejected_models TEXT,
    ranking_scores TEXT,
    recommended_model_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS model_execution_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response_text TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost_estimate REAL DEFAULT 0.0,
    latency_ms INTEGER DEFAULT 0,
    status TEXT NOT NULL,
    error_message TEXT,
    cache_hit INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prompt_cache (
    id TEXT PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    user_id TEXT,
    model_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    request_fingerprint TEXT NOT NULL,
    response_text TEXT NOT NULL,
    token_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    hit_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pricing_packages_orders (
    id TEXT PRIMARY KEY,
    order_ref TEXT UNIQUE NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    package_id TEXT NOT NULL,
    model_allocations TEXT NOT NULL,
    amount_inr REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Optimized Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON user_token_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON token_usage_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON token_usage_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_rec_history_user ON recommendation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_exec_history_user ON model_execution_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_cache_key ON prompt_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_orders_ref ON pricing_packages_orders(order_ref);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
