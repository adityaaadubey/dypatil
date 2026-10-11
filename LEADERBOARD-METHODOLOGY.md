# ModelRouter Leaderboard & Benchmarking Methodology

## Version 2026.4.2-STABLE

This document details the mathematical models, statistical treatment of uncertainty, metric separation rules, and deterministic inference routing algorithms implemented across the ModelRouter AI Intelligence Platform.

---

### 1. Mathematical Formulation of Rating Systems

#### 1.1 Bradley-Terry Pairwise Preference Model (Text Leaderboards)
For a blind human battle between model $A$ and model $B$ with outcomes $Y \in \{A \text{ wins}, B \text{ wins}, \text{tie}\}$, the probability of model $A$ defeating model $B$ is modeled as:

$$P(A \succ B) = \frac{1}{1 + 10^{(R_B - R_A) / 400}}$$

where $R_A$ and $R_B$ denote the respective latent Elo skill ratings.

#### 1.2 Rating Uncertainty & Bootstrap Interval
Due to finite sample sizes, latent skill estimates are subject to statistical variance. The reported uncertainty interval $[R_{\text{lower}}, R_{\text{upper}}]$ represents the 95% bootstrap confidence interval computed over $B = 1,000$ resamples of pairwise battles:

$$\text{Uncertainty} = \frac{R_{\text{upper}} - R_{\text{lower}}}{2}$$

ModelRouter treats these uncertainty spreads as source-defined indicators of consensus stability, rather than universal confidence limits across external tasks.

---

### 2. Metric Separation & Integrity Principles

To prevent deceptive marketing and false comparisons, ModelRouter enforces strict metric partitioning:

1. **Source Arena Elo Rating:** Crowd-preference score reflecting human perception, conversational fluency, and subjective utility.
2. **Deterministic SLA Constraint Checking:** Binary pass/fail validation against explicit hard latency, cost, and capability limits.
3. **Pareto Quality-Cost Efficiency Score:** Normalized composite optimization ranking applied strictly to eligible models:
   $$\text{Score} = w_{\text{cap}} \cdot \bar{Q} + w_{\text{cost}} \cdot (1 - \bar{C}) + w_{\text{lat}} \cdot (1 - \bar{L}) + w_{\text{rel}} \cdot \bar{R}$$
   where $\bar{Q}, \bar{C}, \bar{L}, \bar{R}$ represent min-max normalized capability, cost, p95 latency, and endpoint reliability.

---

### 3. ModelRouter Inference Gateway: Hard-Constraint Rules

When dispatching requests through the ModelRouter Recommendation Gateway:

- **Constraint 1 (Latency SLA):** $\text{EffectiveLatency}_{P95}(M) \le \text{MaxLatency}$
- **Constraint 2 (Cost Budget):** $\text{EstimatedCost}(M) = \frac{\text{Tokens}_{\text{in}} \cdot P_{\text{in}} + \text{Tokens}_{\text{out}} \cdot P_{\text{out}}}{10^6} \le \text{MaxCost}$
- **Constraint 3 (Capability Floor):** $\text{CapabilityRating}(M) \ge \text{MinCapability}$
- **Constraint 4 (Context Window):** $\text{ContextLength}(M) \ge \text{Tokens}_{\text{required}}$
- **Constraint 5 (Endpoint Availability):** $\text{EndpointStatus}(M) \neq \text{'down'}$

#### Zero-SLA Relaxation Failover Guarantee:
If an active model fails or suffers a latency degradation during runtime, the router initiates a cascade down the pre-computed eligible fallback chain. The system will **never** relax a constraint or route to an invalid candidate. If no model meets all constraints, the gateway issues a transparent rejection rather than an unapproved dispatch.
