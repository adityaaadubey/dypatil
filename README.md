# ModelRouter AI Model Intelligence Platform

> **Comprehensive AI Model Intelligence Platform & Zero-SLA Relaxation Inference Gateway**
> 
> Inspired by the public information architecture and model benchmarking of Arena/LMArena, combining an authoritative 656-model normalized registry, 12 interactive analytics graphs, category leaderboard explorers, a full model rulebook, and a deterministic hard-constraint recommendation gateway.

---

## Key Modules & Capabilities

1. **Overview Dashboard:** High-level ecosystem health, KPI cards (656 models, 42 providers, 8 categories, 493 pricing records), category leaders, Pareto price-performance picks, and provider representation.
2. **Leaderboard Explorer:** Full Arena directory across Text, Agent, WebDev, Alignment, Image, and Video domains with multi-filters, sorting, pagination, and **4-Model Side-by-Side Comparison Mode**.
3. **Interactive Analytics Studio:** 12 Recharts deep-dive visualizations including Elo bar charts, Price vs Score scatter plots, Pareto frontiers, context capacity, ranking time-series, rank movements, and data quality audits.
4. **Official Model Rulebook:** Searchable encyclopedia of all tracked models with variant preservation, uncertainty spreads, verified token economics, and downloadable documentation (Markdown, CSV, JSON).
5. **Preserved Recommendation Gateway:** Real-time prompt complexity analyzer, hard constraint verification (Latency, Cost, Capability, Context, Availability), deterministic failovers, and transparent decision rationales.
6. **Judge Chaos & SLA Testbench:** Live simulator enabling judges to adjust model latencies, trigger endpoint outages, and verify that the router redirects traffic without relaxing any user constraints.
7. **Telemetry & Audit Ledger:** Historical record of all gateway decisions with JSON export.

---

## Quick Start

```powershell
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build production bundle and verify types
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Documentation Links

- [MODEL-RULEBOOK.md](./MODEL-RULEBOOK.md) — Comprehensive model specifications & registry rules.
- [LEADERBOARD-METHODOLOGY.md](./LEADERBOARD-METHODOLOGY.md) — Statistical formulations, Elo modeling, and metric separation.
- [DATA-SOURCES.md](./DATA-SOURCES.md) — Ingestion architecture, source endpoints, and provenance guarantees.
- [API-REFERENCE.md](./API-REFERENCE.md) — TypeScript interfaces and routing schemas.
