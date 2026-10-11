export const METHODOLOGY_DOCUMENT = {
  title: 'ModelRouter AI Intelligence Platform: Benchmarking & Methodology Rulebook',
  version: '2026.4.2-STABLE',
  lastUpdated: 'October 11, 2026',
  sections: [
    {
      id: 'separation-of-rating-systems',
      title: '1. Strict Separation of Rating Systems & Metrics',
      content: `ModelRouter strictly refuses to combine diverse metrics into a single arbitrary "magic AI score". Each evaluated dimension represents a distinct empirical measurement:
- **Crowd-Sourced Arena Elo Rating:** Bradley-Terry pairwise preference score derived from blind human battle comparisons. Reflects human taste, helpfulness, and instruction following in open-ended contexts.
- **Rating Uncertainty (Confidence Interval):** The statistical bootstrap standard error of the Elo estimate. Wide spreads indicate insufficient comparison counts or high variance across voter preferences.
- **Provider-Verified Pricing:** Exact token billing rates per 1,000,000 input/output tokens verified against official cloud documentation. Unknown prices are marked explicitly as unknown, never assumed to be zero.
- **Context Window Capacity:** The hard attention span in tokens before degradation or rejection.
- **ModelRouter Recommendation Score:** A transparent, user-parameterized Pareto efficiency score computed exclusively after verifying 100% compliance with hard latency, cost, and capability constraints.`
    },
    {
      id: 'canonical-model-identity',
      title: '2. Canonical Model Identity & Variant Integrity',
      content: `Arena evaluates distinct model configurations that may not map 1:1 to standard cloud provider API slugs. ModelRouter maintains a strict identity policy:
- **No Silent Variant Merging:** Models with variant suffixes (e.g. "-high", "-thinking", "-max", "-vertex") are preserved as unique evaluation entities because reasoning budgets and host runtimes significantly impact output quality.
- **No Phantom API Mapping:** If an evaluated Arena model is not available through a public developer API, its API identifier is designated as "Unpublished / Arena Contender" rather than substituting an unverified model.
- **Provider Attribution:** Every entry explicitly records its primary developing organization, license framework (Proprietary vs Open-Weights), and official documentation link.`
    },
    {
      id: 'recommendation-governance',
      title: '3. ModelRouter Inference Gateway Routing Rules',
      content: `The ModelRouter gateway operates under a strict Zero-SLA Relaxation governance framework:
1. **Hard Availability Constraint:** Endpoints in a 'Down' or unresponsive state are immediately excluded.
2. **Hard Latency Constraint:** Models whose p95 latency exceeds the user's stated latency budget are marked Rejected.
3. **Hard Cost Constraint:** Models whose estimated per-request token expenditure exceeds the stated cost budget are marked Rejected.
4. **Hard Capability Constraint:** Models scoring below the minimum task capability floor are marked Rejected.
5. **Hard Context Constraint:** Models whose context window is insufficient to fit the prompt and required task tokens are marked Rejected.
6. **Zero-Compromise Failover:** If an active endpoint experiences an outage or latency spike, the router fails over down the pre-calculated eligible sequence. It will *never* relax a user constraint during failover.`
    },
    {
      id: 'data-provenance-and-limitations',
      title: '4. Data Provenance, Limitations & Refresh Policy',
      content: `Data on this platform is captured directly from public Arena Next.js SSR snapshots, enriched with verified provider specifications:
- **Scope of Coverage:** Text, Agent, WebDev, Alignment, Image Generation, and Video Generation leaderboards.
- **Limitations:** Crowd-preference Elo ratings reflect subjective human judgments and prompt distributions submitted by users. High Elo does not guarantee factual accuracy or domain-specific mathematical correctness.
- **Historical Comparison Validity:** Historical rank comparisons are only conducted between strictly identical category snapshots. Cross-category or cross-modality rank changes are never manufactured.`
    }
  ]
};
