# ModelRouter AI Model Rulebook

## Version 2026.4.2-STABLE | Last Verified: October 11, 2026

The **ModelRouter AI Model Rulebook** governs the canonical identity, capability classifications, empirical ranking evidence, pricing verification, and architectural boundaries for all models tracked within the ModelRouter Intelligence Gateway.

---

### 1. Canonical Model Identity & Variant Preservation

In contrast to aggregators that flatten configurations into generic model names, ModelRouter preserves distinct evaluated Arena entries where configurations differ in reasoning effort, sampling tier, or execution environment:

1. **Reasoning-Effort Variants:** Configurations with suffixes such as `(High)`, `(Max)`, `(Thinking)`, or `(XHigh)` are preserved as independent entries. Extended chain-of-thought verification alters cost, latency, and benchmark performance.
2. **Platform & Runtime Variants:** Cloud-hosted or fine-tuned variants (e.g., `-vertex`, `-bedrock`) are catalogued with exact slugs.
3. **API Slug Integrity:** An Arena contender's identity is never silently substituted with an executable API model ID unless independently verified against official provider documentation. Unreleased or competition-only checkpoints are designated as `pre_release` or `preview`.

---

### 2. Normalized Model Schema Definition

Each model in the registry complies with the following specification:

| Field | Type | Description |
|---|---|---|
| `id` | String | Internal unique database key (`arena_<slug>`) |
| `modelKey` | String | Exact Arena benchmark identifier |
| `modelDisplayName` | String | Exact Arena human-readable display name |
| `provider` | String | Primary developing organization (e.g., Anthropic, OpenAI, Google, Meta, DeepSeek) |
| `modelFamily` | String | Lineage family (Claude, GPT, Gemini, Llama, DeepSeek, Qwen, Mistral, FLUX, etc.) |
| `variant` | String | Configuration class (High Reasoning, Max Effort, Extended Thinking, Compact, Frontier) |
| `primaryCategory` | String | Primary benchmark category (Text / Overall, Agent, WebDev, Image, Video) |
| `allCategories` | Array | Discovered category memberships |
| `rank` | Integer | Source-reported leaderboard placement |
| `rating` | Float | Bradley-Terry Elo score or Net Improvement rating |
| `uncertainty` | Float | Bootstrap standard error / Confidence interval half-width (± CI) |
| `votes` | Integer | Valid pairwise human battle comparisons |
| `inputPricePerMillion` | Float / null | Verified USD cost per 1,000,000 input tokens |
| `outputPricePerMillion` | Float / null | Verified USD cost per 1,000,000 output tokens |
| `contextLength` | Integer / null | Maximum verified token attention span |
| `license` | String | Open-Weights vs Proprietary framework (Apache-2.0, MIT, Llama, Commercial) |
| `isOpenWeight` | Boolean | True if model weights are publicly weights-accessible |
| `status` | String | Lifecycle state: `stable`, `pre_release`, `preview`, `deprecated` |
| `modelUrl` | String | Official laboratory system card or API documentation |
| `arenaUrl` | String | Source benchmark leaderboard URL |
| `lastVerified` | ISO8601 | Verification audit timestamp |
| `provenance` | Object | Full audit trail of source snapshot and evaluation methodology |

---

### 3. Provider Coverage & Laboratory Registry

ModelRouter tracks **42 global AI organizations**:
- **Frontier Commercial Laboratories:** OpenAI, Anthropic, Google, Meta, xAI, Microsoft, Cohere, Mistral.
- **Open-Weights & High-Efficiency Pioneers:** DeepSeek, Alibaba / Qwen, 01.AI, MiniMax, Moonshot (Kimi), StepFun, Z.ai (GLM), Baidu, Tencent, Bytedance.
- **Multimodal & Generative Specialists:** Black Forest Labs (FLUX), Recraft, Ideogram, Kling AI, Runway, Luma AI, Pika, Genmo AI.
- **Enterprise & Hardware Accelerators:** NVIDIA, IBM, Amazon, Upstage.

---

### 4. Data Limitations & Known Boundaries

1. **Crowd-Preference Bias:** Bradley-Terry Elo ratings reflect user preferences on subjective prompt distributions submitted to blind battles. They do not constitute formal mathematical correctness proofs.
2. **Missing Metadata Semantics:** Models with unlisted API pricing or unknown context windows remain explicitly `null` ("Unknown"). They are never coerced to zero.
3. **No Cross-Category Conflation:** Text Elo ratings (scale ~1000–1600) cannot be arithmetically compared with Net Task Improvement scores (scale 0.0–1.0) on Agent benchmarks.
