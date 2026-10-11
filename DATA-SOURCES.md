# ModelRouter Data Provenance & Ingestion Sources

This document details the data acquisition architecture, official source endpoints, ingestion pipelines, and provenance guarantees powering the ModelRouter AI Intelligence Platform.

---

### 1. Primary Public Benchmark Sources

| Source Entity | Canonical Entrypoint | Extraction Protocol | Scope of Coverage |
|---|---|---|---|
| **LMSYS / Arena.ai** | `https://arena.ai/leaderboard` | Structured Next.js SSR Payload Extraction | Text Overall, Agents, WebDev, Alignment, Multimodal |
| **Arena Text Leaderboard** | `https://arena.ai/leaderboard/chat/text` | Structured Client Payload Chunk 105 | Coding, Math, Hard Prompts, General Text |
| **Arena Agent Directory** | `https://arena.ai/leaderboard/agent` | Structured Client Payload Chunk 97 | Autonomous Agents, Agentic Coding, Safety Pareto |
| **Arena Multimodal** | `https://arena.ai/leaderboard/image/*`, `/video/*` | Structured Leaderboard Metadata | Text-to-Image, Image Edit, Text-to-Video, Video Edit |

---

### 2. Official Cloud Provider Documentation Sources

ModelRouter enriches benchmark records with verified token pricing, context lengths, and API identifiers from official provider sources:

- **OpenAI:** [https://developers.openai.com/api/docs/models/all](https://developers.openai.com/api/docs/models/all)
- **Anthropic Claude:** [https://platform.claude.com/docs/en/about-claude/models](https://platform.claude.com/docs/en/about-claude/models)
- **Google Gemini:** [https://ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models)
- **Meta Llama:** [https://ai.meta.com/llama/](https://ai.meta.com/llama/)
- **DeepSeek:** [https://api-docs.deepseek.com/](https://api-docs.deepseek.com/)
- **xAI Grok:** [https://docs.x.ai/](https://docs.x.ai/)
- **Mistral AI:** [https://docs.mistral.ai/getting-started/models/](https://docs.mistral.ai/getting-started/models/)
- **Alibaba / Qwen:** [https://help.aliyun.com/zh/dashscope/developer-reference/what-is-qwen](https://help.aliyun.com/zh/dashscope/developer-reference/what-is-qwen)

---

### 3. Rate-Limiting & Extraction Ethics Policy

- **No Circumvention of Controls:** ModelRouter respects robots.txt directives, terms of use, and avoids bypassing CAPTCHAs or security layers.
- **Client-Side Caching & Snapshots:** Extracted records are compiled into immutable, timestamped snapshots (`arenaMasterData.json`) to minimize redundant network requests.
- **Graceful Partial Failure:** If network requests fail or rate limits are encountered, the platform retains the latest valid snapshot and clearly displays a "Cached / Degraded" status banner rather than failing or wiping records.
- **Extensible Fallback:** Complete support for offline CSV and JSON imports.
