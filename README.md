# VeyraLabs AI — Multi-Provider Inference Gateway & Model Intelligence Platform

<p align="center">
  <img src="https://img.shields.io/badge/VeyraLabs-AI_Model_Explorer-653CA1?style=for-the-badge&logo=openai&logoColor=white" alt="VeyraLabs Banner"/>
</p>

<p align="center">
  <a href="https://veyralabs-ai-live.vercel.app"><img src="https://img.shields.io/badge/Live_Deployment-veyralabs--ai--live.vercel.app-00dfa2?style=flat-square&logo=vercel" alt="Vercel Live"/></a>
  <img src="https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?style=flat-square&logo=supabase" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Language-TypeScript_5.8-3178C6?style=flat-square&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Framework-React_19_+_Vite_6-61DAFB?style=flat-square&logo=react" alt="React 19"/>
  <img src="https://img.shields.io/badge/Inference_LPU-Groq_API-F55036?style=flat-square" alt="Groq"/>
  <img src="https://img.shields.io/badge/Provider-Google_Gemini-4285F4?style=flat-square&logo=google" alt="Gemini"/>
  <img src="https://img.shields.io/badge/Provider-OpenRouter-7C3AED?style=flat-square" alt="OpenRouter"/>
</p>

---

## 🌐 Live Production Deployment

- **Production URL:** [https://veyralabs-ai-live.vercel.app](https://veyralabs-ai-live.vercel.app)
- **Supabase Cloud Project:** `swqtnppqvaefarnhllsb` (Region: `ap-south-1` Asia/Mumbai)
- **Local Dev Server:** `http://localhost:5173` (Vite) / `http://localhost:3001` (Express API)

---

## 🚀 Overview

**VeyraLabs** is a state-of-the-art enterprise AI Model Intelligence Platform, Mathematical Routing Engine, and Real-Time Multi-Provider Inference Gateway. It combines:

1. **Multi-Provider Real Execution Engine:**
   - **Groq LPU:** Ultra-low latency chat completions (`qwen/qwen3.8-27b`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `allam-2-7b`, `canopylabs/orpheus-v1-english`).
   - **Google Gemini Direct:** High-throughput multimodal streaming via Google Generative Language API (`gemini-3.5-flash-lite`, `gemini-flash-latest`, `gemini-2.5-flash`).
   - **OpenRouter Free Tier:** Community models and open weights (`liquid/lfm-2.5-2.6b:free`, `nvidia/nemotron-3.5-lightning:free`, `cohere/north-mini-code:free`).
2. **Dual-Tier Relational Database System:**
   - **Supabase Cloud PostgreSQL:** Cloud persistence with Row Level Security (RLS) for multi-tenant deployment.
   - **Local SQLite Engine:** Zero-latency embedded WAL relational database with transactional integrity and foreign-key constraints.
3. **Deterministic Mathematical Routing Engine:**
   - Multi-objective ranking function balancing quality (Elo/MMLU), latency (p95), cost per million tokens, and context window requirements with zero SLA relaxation.
4. **Interactive 656-Model Arena Explorer:**
   - Live Arena benchmark leaderboard, 4-model side-by-side comparison studio, flip cards with deep specs, and interactive Recharts visualizations.
5. **Token Economy & Ledger Accounting:**
   - Two-phase credit reservation and atomic ledger settlement.
   - Cryptographic prompt cache (SHA-256) preventing double-billing on identical queries.
   - Trial allowance management with instant 10,000 credit grant on signup.
6. **Enterprise Security & Compliance:**
   - Content Security Policy (CSP), defensive HTTP headers (`DENY`, `nosniff`), sanitized input middleware, SameSite session cookies, and rate limiting.

---

## 🔐 Pre-Seeded Test Credentials

VeyraLabs comes pre-configured with two ready-to-test accounts (featuring 1-click login buttons in the Sign In modal):

| Role | Email | Password | Initial Balance |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `admin@veyralabs.ai` | `AdminPassword123!` | **50,000 Credits** |
| **Developer / Researcher** | `user@veyralabs.ai` | `UserPassword123!` | **10,000 Credits** |

---

## 📁 Repository & Folder Structure

```
dypatil/
├── api/                           # Vercel Serverless Function entrypoint
│   └── index.ts                   # Serverless Express proxy handler
├── database/                      # Relational database schemas & seeds
│   ├── migrations/
│   │   └── 001_initial_schema.sql # Relational DDL (SQLite & Postgres compatible)
│   └── seeds/
│       └── seed_data.ts           # Genesis seed for accounts, wallets & models
├── docs/                          # Comprehensive architectural documentation
│   ├── legal/                     # Legal center (DPDP Act 2023, Terms, Privacy)
│   ├── ARCHITECTURE.md            # System design and data flow diagrams
│   └── METHODOLOGY.md             # Mathematical router formulations
├── server/                        # Express API Backend & Provider Adapters
│   ├── src/
│   │   ├── database/
│   │   │   ├── db.ts              # SQLite transactional wrapper
│   │   │   └── supabase.ts        # Supabase cloud client & health check
│   │   ├── middleware/
│   │   │   ├── auth.ts            # Session token verification & RBAC
│   │   │   ├── rateLimit.ts       # Sliding-window memory rate limiter
│   │   │   ├── securityHeaders.ts # CSP, X-Frame-Options, HSTS headers
│   │   │   └── validate.ts        # Input validation & sanitization
│   │   ├── providers/
│   │   │   ├── geminiProvider.ts  # Google Generative AI adapter
│   │   │   └── groqProvider.ts    # Groq OpenAI-compatible LPU adapter
│   │   ├── routes/
│   │   │   ├── admin.ts           # Admin analytics & user management
│   │   │   ├── auth.ts            # Signup, login, session & logout
│   │   │   ├── chat.ts            # Unified streaming SSE inference (/api/chat/completions)
│   │   │   ├── execute.ts         # Platform trial execution (/api/execute)
│   │   │   ├── models.ts          # Unified catalog & provider health status
│   │   │   ├── profile.ts         # User settings, wallets, and usage
│   │   │   └── usage.ts           # Ledger analytics & token transaction history
│   │   └── server.ts              # Express server setup and routing
│   ├── geminiService.js           # Gemini direct streaming adapter
│   ├── openRouterService.js       # OpenRouter gateway adapter
│   └── telemetryTracker.js        # TTFT, latency & token usage tracker
├── src/                           # React 19 Frontend Application
│   ├── components/                # UI Components (Theme Palette: #020731, #653CA1, #AC91F1, #10B981)
│   │   ├── AdminDashboard.tsx     # Admin KPI metrics & user ledger
│   │   ├── AnalyticsCharts.tsx    # 12 interactive Recharts visualizations
│   │   ├── AuthModal.tsx          # Sign In / Sign Up modal with 1-click demo logins
│   │   ├── FlippableModelCard.tsx # 3D perspective flippable model specification cards
│   │   ├── Header.tsx             # Brand header with wallet balance, SLA status & navigation
│   │   ├── LeaderboardExplorer.tsx# Category leaderboard with 1-click model details & CSV export
│   │   ├── LiveExecutionModal.tsx # Live prompt execution modal
│   │   ├── LiveInferenceChat.tsx  # Top-3 ranked model inference chat (Gold/Silver/Bronze) with live tokens
│   │   ├── MathExplainerModal.tsx # Mathematical proof & cost arithmetic modal
│   │   ├── ModelDetailModal.tsx   # Universal Portaled Model Profile modal with Token Cost Calculator
│   │   ├── ModelExplorer.tsx      # Multi-tier filterable 656-model catalog
│   │   ├── ModelRulebook.tsx      # Official AI Model Rulebook with governance policies
│   │   ├── RecommendationCard.tsx # Ranked recommendation card with failover simulator & Live Chat
│   │   ├── RecommendationInfoModal.tsx # 4-Stage Architecture & Math Explainer ⓘ modal with FAQs
│   │   ├── RecommendationStudio.tsx # Dynamic constraint SLA gateway with Info ⓘ button in top right
│   │   └── UserProfileModal.tsx   # User profile, wallet top-ups & token ledgers
│   ├── config/                    # Pricing tiers & package definitions
│   ├── data/                      # 656-model Arena dataset & snapshots
│   ├── services/                  # Frontend services
│   │   ├── authService.ts         # Safe API client for authentication & execution
│   │   ├── billingService.ts      # Cart, packages, order & trial allowance service
│   │   ├── inferenceService.ts    # Streaming SSE & prompt execution service
│   │   ├── modelCatalogService.ts # 656-model catalog enrichment & normalization
│   │   ├── routerEngine.ts        # Deterministic constraint solving & Pareto optimization
│   │   └── supabaseClient.ts      # Frontend Supabase cloud client
│   ├── types/                     # TypeScript domain models & interfaces
│   ├── App.tsx                    # Main root component & global modal state management
│   ├── main.tsx                   # React DOM entry point
│   └── index.css                  # Global design system & theme variables
├── .env.example                   # Environment configuration template
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
├── vercel.json                    # Vercel deployment configuration (alias: veyralabs-ai-live.vercel.app)
└── vite.config.ts                 # Vite bundler & API reverse-proxy configuration
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Server & Client Ports
PORT=5173
SERVER_PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173

# Relational Database
DATABASE_FILE=database/veyralabs.db

# Supabase Cloud Database Configuration
SUPABASE_URL=https://swqtnppqvaefarnhllsb.supabase.co
SUPABASE_ANON_KEY=sb_publishable_w4n2NRCEGxuHShijc2k10Q_3HwOu1Qx
VITE_SUPABASE_URL=https://swqtnppqvaefarnhllsb.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_w4n2NRCEGxuHShijc2k10Q_3HwOu1Qx

# Security & Session Authentication
SESSION_SECRET=veyralabs_cryptographic_session_secret_key_minimum_32_characters
SESSION_EXPIRATION_DAYS=30

# Platform Token Economics
INITIAL_TRIAL_CREDITS=10000
MAX_OUTPUT_TOKENS=2048

# AI Inference Providers (Server-Side Secrets)
GROQ_API_KEY=gsk_your_groq_api_key
GEMINI_API_KEY=AQ.your_gemini_api_key
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key
FREE_MODELS_ONLY=true
```

---

## 🛠️ Local Development & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Both Services Locally

**Terminal 1 — Express Backend API (Port 3001):**
```bash
npm run server
```

**Terminal 2 — Vite Frontend (Port 5173):**
```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Verify System Health
```bash
# Verify API health
curl http://localhost:3001/api/health

# Verify provider status
curl http://localhost:3001/api/models/providers
```

### 4. Run Automated Test Suites
```bash
# Full regression & provider failover tests
node test_regression.js

# Build production bundle & TypeScript typecheck
npm run build
```

---

## 🚢 Deploying to Vercel

The project includes an optimized `vercel.json` and `api/index.ts` serverless wrapper:

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Deploy directly:
   ```bash
   vercel --prod
   ```
3. Set Environment Variables in your Vercel Project Dashboard:
   - `GROQ_API_KEY`
   - `GEMINI_API_KEY`
   - `OPENROUTER_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SESSION_SECRET`
   - `FREE_MODELS_ONLY=true`

The app will immediately be live on **`https://veyralabs-ai-live.vercel.app`**.

---

## 🛡️ License & Attributions

- **Architecture:** Proprietary VeyraLabs AI Inference Router.
- **Benchmarks & Data:** Open LLM Leaderboard, LMSYS Chatbot Arena, and provider specifications.
- **MIT Open Source License** for open-source client libraries and adapters.
