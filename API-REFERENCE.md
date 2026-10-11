# ModelRouter API & Schema Reference

## Internal Data Types & Engine Interfaces

This document describes the core TypeScript interfaces, data models, and routing functions used in the ModelRouter platform.

---

### 1. Model & Registry Interfaces

```typescript
export interface ArenaModel {
  id: string;                         // Unique internal ID, e.g. "arena_claude_opus_5_5"
  modelKey: string;                   // Exact Arena slug
  modelDisplayName: string;           // Exact human-readable name
  provider: string;                   // Laboratory, e.g. "Anthropic"
  modelFamily: string;                // Architecture family, e.g. "Claude"
  variant: string;                    // Suffix/Configuration, e.g. "High Reasoning"
  primaryCategory: string;            // Benchmark category, e.g. "Text / Overall"
  allCategories: string[];            // Discovered category memberships
  rank: number;                       // Leaderboard position
  rating: number;                     // Bradley-Terry Elo score
  uncertainty: number;                // 95% bootstrap CI half-width
  votes: number;                      // Total human battle evaluations
  inputPricePerMillion: number | null;// USD cost per 1M input tokens
  outputPricePerMillion: number | null;// USD cost per 1M output tokens
  contextLength: number | null;       // Maximum context tokens
  license: string;                    // License string
  isOpenWeight: boolean;              // True for open-source weights
  status: 'stable' | 'pre_release' | 'preview' | 'deprecated';
  modelUrl: string;                   // Laboratory docs URL
  arenaUrl: string;                   // Benchmark leaderboard URL
  provenance: ModelProvenance;        // Origin and snapshot metadata
}
```

---

### 2. Recommendation Engine Interface

```typescript
export interface Constraints {
  maxLatency: number;       // Latency ceiling in milliseconds
  maxCost: number;          // Maximum estimated query budget in USD
  minCapability: number;    // Capability floor (1.0 - 10.0 scale)
  requiredContext: number;  // Required token window
}

export type RoutingPreference = 
  | 'lowest_cost' 
  | 'lowest_latency' 
  | 'highest_capability' 
  | 'balanced';

export function routeRequest(
  prompt: string,
  category: TaskCategory,
  constraints: Constraints,
  preference: RoutingPreference,
  models: Model[]
): RecommendationResult;
```

---

### 3. Evaluation & Transparency Object

```typescript
export interface CandidateEvaluation {
  model: Model;
  status: 'selected' | 'eligible' | 'rejected';
  estimatedCost: number;
  effectiveLatencyP95: number;
  passedConstraints: {
    latency: boolean;
    cost: boolean;
    capability: boolean;
    context: boolean;
    availability: boolean;
  };
  rejectionReasons: string[];
  eligibilityExplanation: string;
  selectionScore: number;
}
```
