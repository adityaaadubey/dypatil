# VeyraLabs — Public Arena / LMArena Data Sources & Discovery Inventory

This document provides a comprehensive inventory of public benchmarking data sources, observed interfaces, and schemas utilized by **veyralabs** for public AI model intelligence, Elo rankings, win-rate analytics, and category-specific leaderboards.

---

## 1. Discovered Public Interfaces & Leaderboard Sources

### Source 1: LMSYS Chatbot Arena Overall Leaderboard
- **Name:** Arena Chat Overall Public Leaderboard
- **Source URL:** `https://arena.ai/leaderboard/chat/overall` (and `https://chat.lmsys.org/`)
- **Interface Type:** Publicly observed structured JSON endpoint / static dataset export
- **Purpose:** Frontier model Elo ratings, 95% confidence intervals (Bradley-Terry statistical model), win rates, and total human evaluation votes across general conversational queries.
- **Required Credentials:** None (Publicly accessible).
- **Data Fields Exposed:**
  - `model_id` / `model_name`: Standard model identifier
  - `elo_rating`: Bradley-Terry estimated Elo score
  - `ci_95_lower` / `ci_95_upper`: 95% statistical confidence bounds
  - `total_votes`: Cumulative blind pairwise human evaluations
  - `win_rate`: Percentage of pairwise arena matchups won
  - `organization` / `provider`: AI lab or vendor (OpenAI, Anthropic, Google, Meta, Mistral, etc.)
  - `license`: Commercial proprietary vs open-weights (Apache 2.0, MIT, Llama Community)
- **Pagination Behavior:** Single payload with complete ranked catalogue (~100 to 650 models).
- **Freshness / Refresh Interval:** Updated weekly based on accumulated blind user votes.
- **Known Limitations:**
  - Does not provide live inference execution endpoints.
  - Model IDs in Arena may differ slightly from provider API route IDs (e.g. `gpt-4o-2024-05-13` vs `gpt-4o`).
- **Access Restrictions:** Respectful rate-limited retrieval only; no automated scraping or bypassing anti-bot controls.

---

### Source 2: Arena Category-Specific Benchmark Leaderboards
- **Name:** Arena Coding, Reasoning, Hard Prompts & Multi-Turn Categories
- **Source URL:** `https://arena.ai/leaderboard/chat/text`
- **Sub-Categories:**
  - `Coding`: Pairwise coding evaluations (SWE, debugging, algorithmic implementation)
  - `Hard Prompts`: Complex reasoning, multi-step math, and counter-intuitive logic
  - `Long Context`: Queries with prompts exceeding 32,000 to 128,000 tokens
  - `Vision / Multimodal`: Pairwise evaluation on image understanding and visual QA
  - `Multi-Turn`: Conversational coherence across multiple back-and-forth exchanges
- **Interface Type:** Observed public facet filtering and benchmark matrices.
- **Data Fields Exposed:**
  - `category_name`: Task category identifier
  - `category_elo`: Category-specific Elo rating
  - `sample_count`: Total evaluations in specific category
  - `rank`: Relative position within the category
- **Refresh Interval:** Synchronized with weekly Arena updates.

---

### Source 3: HuggingFace Open LLM Leaderboard
- **Name:** Open LLM Leaderboard v2
- **Source URL:** `https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard`
- **Interface Type:** Public CSV / Parquet and dataset API (`datasets/open-llm-leaderboard`)
- **Purpose:** Standardized evaluation of open-weight models across MMLU-Pro, GSM8k, MATH, GPQA, MuSR, and IFEval.
- **Required Credentials:** Optional HuggingFace token for high-rate API queries; public read-only available.
- **Data Fields Exposed:**
  - `Model`: Hugging Face repo ID
  - `Average`: Macro-averaged benchmark score
  - `MMLU-Pro`: Multi-domain reasoning
  - `GSM8K` / `MATH`: Mathematical problem solving
  - `IFEval`: Instruction-following compliance
  - `Architecture`: Parameters, precision, context length

---

### Source 4: Provider Official Model Registries & Pricing API Specs
- **Google Generative AI:** `https://generativelanguage.googleapis.com/v1beta/models`
- **OpenAI Models API:** `https://api.openai.com/v1/models`
- **Anthropic Documentation:** `https://docs.anthropic.com/en/docs/about-claude/models`
- **Purpose:** Verified context window limits, token pricing per million (input / output / cached), and execution API routes.

---

## 2. Model Identity Mapping & Route Normalization

To ensure data integrity, VeyraLabs enforces strict distinction between:
1. **Arena Evaluation Identifier:** `gemini-1.5-flash-latest` (Human voting record).
2. **Provider Route ID:** `google/gemini/v1beta/gemini-flash-latest` (Live API executable).
3. **Model Display Name:** `Gemini 2.5 Flash Latest` (Human-readable UI label).
4. **Execution Capability:** Models without configured API keys or inference routes are strictly labeled as **"Catalogue Entry Only — Non-Executable"**. No artificial outputs are fabricated.

---

## 3. Data Integration & Update Pipeline in VeyraLabs

1. **Relational Ingestion:** Arena records and provider catalogs are mapped into `model_registry` and `arenaMasterData.json`.
2. **Deterministic Routing:** Benchmark Elo ratings feed into the Quality ($Q$) and Reasoning ($R$) dimensions of the VeyraLabs mathematical scoring function:
   $$\text{Score} = 100 \times (w_q \cdot Q + w_f \cdot F + w_c \cdot C + w_l \cdot L + w_r \cdot R)$$
3. **Offline Fallback:** If upstream Arena servers are unreachable, the platform serves verified local snapshots with timestamp provenance, ensuring 100% gateway uptime.
