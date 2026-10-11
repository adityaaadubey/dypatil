import type { 
  Model, 
  Constraints, 
  RoutingPreference, 
  TaskCategory, 
  CandidateEvaluation, 
  RecommendationResult 
} from '../types';

export interface ComplexityAnalysis {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  complexityScore: number; // 1 to 10
  suggestedCapabilityFloor: number;
  analysisNotes: string[];
}

/**
 * Analyzes prompt text and task category to conservatively estimate complexity and token counts.
 * Follows the challenge rule: "Treat such estimates as uncertain, and when unsure, choose the safer option."
 */
export function estimateComplexity(prompt: string, category: TaskCategory): ComplexityAnalysis {
  const trimmed = prompt.trim();
  const charLength = trimmed.length;
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  
  // Approximate ~4 characters per token + conservative safety buffer
  const rawInputTokens = Math.max(16, Math.ceil(charLength / 3.8));
  
  let outputMultiplier = 1.5;
  let categoryComplexity = 5.0;
  const analysisNotes: string[] = [];

  switch (category) {
    case 'code_generation':
      outputMultiplier = 2.8;
      categoryComplexity = 7.5;
      analysisNotes.push('Code task: higher output token density & syntax precision requirement');
      break;
    case 'complex_reasoning':
      outputMultiplier = 3.2;
      categoryComplexity = 8.5;
      analysisNotes.push('Reasoning task: multi-step chain-of-thought expansion expected');
      break;
    case 'data_extraction':
      outputMultiplier = 1.2;
      categoryComplexity = 6.0;
      analysisNotes.push('Extraction task: structured schema validation with concise outputs');
      break;
    case 'summarization':
      outputMultiplier = 0.8;
      categoryComplexity = 5.5;
      analysisNotes.push('Summarization task: condensed output synthesis');
      break;
    case 'creative_writing':
      outputMultiplier = 2.5;
      categoryComplexity = 6.5;
      analysisNotes.push('Creative task: open-ended narrative generation');
      break;
    case 'general_chat':
    default:
      outputMultiplier = 1.3;
      categoryComplexity = 4.5;
      analysisNotes.push('General chat: direct conversational response format');
      break;
  }

  // Detect code syntax markers
  const hasCode = /```|function\s*\(|class\s+\w+|import\s+.*from|def\s+\w+|const\s+\w+\s*=|async\s+def/i.test(trimmed);
  if (hasCode) {
    categoryComplexity = Math.max(categoryComplexity, 7.8);
    outputMultiplier = Math.max(outputMultiplier, 2.5);
    analysisNotes.push('Detected embedded code syntax -> increased capability safety floor');
  }

  // Detect high-reasoning prompt signals
  const hasReasoning = /\b(prove|step-by-step|analyze|trade-offs|derivation|formulate|implications|contradiction)\b/i.test(trimmed);
  if (hasReasoning) {
    categoryComplexity = Math.min(10, categoryComplexity + 1.2);
    analysisNotes.push('Detected analytical reasoning keywords -> elevated complexity score');
  }

  // Long prompt length multiplier
  if (wordCount > 150) {
    categoryComplexity = Math.min(10, categoryComplexity + 0.8);
    analysisNotes.push('Extended context prompt -> elevated input token requirements');
  }

  const estimatedInputTokens = Math.max(50, rawInputTokens);
  // Conservative output token sizing: at least 250 tokens
  const estimatedOutputTokens = Math.max(250, Math.round(estimatedInputTokens * outputMultiplier));
  const complexityScore = Number(categoryComplexity.toFixed(1));
  const suggestedCapabilityFloor = Number(Math.max(6.0, complexityScore - 1.0).toFixed(1));

  return {
    estimatedInputTokens,
    estimatedOutputTokens,
    complexityScore,
    suggestedCapabilityFloor,
    analysisNotes
  };
}

/**
 * Calculates estimated request cost in USD.
 */
export function calculateRequestCost(
  model: Model, 
  inputTokens: number, 
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1_000_000) * model.inputCostPerMillion;
  const outputCost = (outputTokens / 1_000_000) * model.outputCostPerMillion;
  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Calculates effective latency considering endpoint status (simulating degradation or load spikes).
 */
export function getEffectiveLatency(model: Model): number {
  if (model.endpointStatus === 'down') {
    return 99999;
  }
  if (model.endpointStatus === 'degraded') {
    return Math.round(model.currentLatencyP95 * 1.6 + 120);
  }
  return model.currentLatencyP95;
}

/**
 * Evaluates all candidates against hard constraints and scores eligible candidates based on preference.
 */
export function evaluateCandidates(
  models: Model[],
  constraints: Constraints,
  preference: RoutingPreference,
  inputTokens: number,
  outputTokens: number
): { candidates: CandidateEvaluation[]; selected: CandidateEvaluation | null; failoverChain: Model[] } {
  const evaluated: CandidateEvaluation[] = models.map((model) => {
    const estimatedCost = calculateRequestCost(model, inputTokens, outputTokens);
    const effectiveLatencyP95 = getEffectiveLatency(model);

    // Hard Constraint checks
    const passedLatency = effectiveLatencyP95 <= constraints.maxLatency;
    const passedCost = estimatedCost <= constraints.maxCost;
    const passedCapability = model.capabilityRating >= constraints.minCapability;
    const passedContext = model.contextWindow >= constraints.requiredContext;
    const passedAvailability = model.endpointStatus !== 'down';

    const passedConstraints = {
      latency: passedLatency,
      cost: passedCost,
      capability: passedCapability,
      context: passedContext,
      availability: passedAvailability
    };

    const rejectionReasons: string[] = [];

    if (!passedAvailability) {
      rejectionReasons.push(`Endpoint unavailable: Endpoint marked ${model.endpointStatus.toUpperCase()}`);
    }
    if (!passedLatency) {
      rejectionReasons.push(`Latency SLA violated: ${effectiveLatencyP95}ms p95 exceeds max constraint of ${constraints.maxLatency}ms`);
    }
    if (!passedCost) {
      rejectionReasons.push(`Cost budget exceeded: $${estimatedCost.toFixed(5)} exceeds max constraint of $${constraints.maxCost.toFixed(5)}`);
    }
    if (!passedCapability) {
      rejectionReasons.push(`Capability rating insufficient: ${model.capabilityRating.toFixed(1)}/10 is below required minimum of ${constraints.minCapability.toFixed(1)}/10`);
    }
    if (!passedContext) {
      rejectionReasons.push(`Context window too small: ${model.contextWindow.toLocaleString()} tokens cannot fit required ${constraints.requiredContext.toLocaleString()} tokens`);
    }

    const isEligible = rejectionReasons.length === 0;

    return {
      model,
      status: isEligible ? 'eligible' : 'rejected',
      estimatedCost,
      effectiveLatencyP95,
      passedConstraints,
      rejectionReasons,
      eligibilityExplanation: '',
      selectionScore: 0
    };
  });

  const eligibleCandidates = evaluated.filter((c) => c.status === 'eligible');

  if (eligibleCandidates.length === 0) {
    return {
      candidates: evaluated,
      selected: null,
      failoverChain: []
    };
  }

  // Normalize metrics across eligible candidates for preference scoring
  const minCost = Math.min(...eligibleCandidates.map((c) => c.estimatedCost));
  const maxCost = Math.max(...eligibleCandidates.map((c) => c.estimatedCost)) || minCost + 0.0001;

  const minLat = Math.min(...eligibleCandidates.map((c) => c.effectiveLatencyP95));
  const maxLat = Math.max(...eligibleCandidates.map((c) => c.effectiveLatencyP95)) || minLat + 1;

  const minCap = Math.min(...eligibleCandidates.map((c) => c.model.capabilityRating));
  const maxCap = Math.max(...eligibleCandidates.map((c) => c.model.capabilityRating)) || minCap + 0.1;

  eligibleCandidates.forEach((cand) => {
    // 0 to 1 scores where 1 is optimal
    const costScore = 1 - (cand.estimatedCost - minCost) / (maxCost - minCost || 1);
    const latScore = 1 - (cand.effectiveLatencyP95 - minLat) / (maxLat - minLat || 1);
    const capScore = (cand.model.capabilityRating - minCap) / (maxCap - minCap || 1);
    const relScore = cand.model.reliabilityScore / 100;

    let score = 0;
    switch (preference) {
      case 'lowest_cost':
        // Heavily weight cost, break ties with latency and capability
        score = costScore * 0.85 + capScore * 0.10 + latScore * 0.05;
        break;
      case 'lowest_latency':
        // Heavily weight latency
        score = latScore * 0.85 + capScore * 0.10 + costScore * 0.05;
        break;
      case 'highest_capability':
        // Heavily weight capability
        score = capScore * 0.85 + costScore * 0.10 + latScore * 0.05;
        break;
      case 'balanced':
      default:
        // Pareto-balanced optimization: 35% capability, 35% cost-efficiency, 20% latency, 10% reliability
        score = capScore * 0.35 + costScore * 0.35 + latScore * 0.20 + relScore * 0.10;
        break;
    }
    cand.selectionScore = Number(score.toFixed(4));
  });

  // Sort eligible candidates descending by score
  eligibleCandidates.sort((a, b) => {
    if (b.selectionScore !== a.selectionScore) {
      return b.selectionScore - a.selectionScore;
    }
    // Deterministic tie-breaker: cost -> latency -> capability
    if (a.estimatedCost !== b.estimatedCost) return a.estimatedCost - b.estimatedCost;
    if (a.effectiveLatencyP95 !== b.effectiveLatencyP95) return a.effectiveLatencyP95 - b.effectiveLatencyP95;
    return b.model.capabilityRating - a.model.capabilityRating;
  });

  // Top candidate becomes 'selected'
  const winner = eligibleCandidates[0];
  winner.status = 'selected';

  // Construct failover chain: ordered list of other eligible candidates that strictly respect every constraint
  const failoverChain = eligibleCandidates.slice(1).map((c) => c.model);

  // Generate detailed, contextual explainability text for every model
  evaluated.forEach((c) => {
    if (c.status === 'selected') {
      const savingsVsMax = ((1 - c.estimatedCost / constraints.maxCost) * 100).toFixed(0);
      c.eligibilityExplanation = `Ranked #1 under ${formatPreference(preference)} policy. Meets all hard constraints (${c.effectiveLatencyP95}ms < ${constraints.maxLatency}ms, capability ${c.model.capabilityRating}/10 >= ${constraints.minCapability}, context ${c.model.contextWindow.toLocaleString()} >= ${constraints.requiredContext.toLocaleString()}). Delivers optimal quality-cost efficiency at $${c.estimatedCost.toFixed(5)} per query (${savingsVsMax}% under cost cap).`;
    } else if (c.status === 'eligible') {
      const costDiff = (c.estimatedCost / (winner.estimatedCost || 0.00001)).toFixed(1);
      const latDiff = c.effectiveLatencyP95 - winner.effectiveLatencyP95;
      c.eligibilityExplanation = `Passed all 5 hard constraints. Valid failover candidate #${eligibleCandidates.indexOf(c)}. Ranked behind ${winner.model.name} because: ${
        preference === 'lowest_cost' 
          ? `Cost is ${costDiff}x higher than primary selection.`
          : preference === 'lowest_latency'
          ? `Latency is ${latDiff > 0 ? `+${latDiff}ms slower` : 'comparable but lower composite score'}.`
          : preference === 'highest_capability'
          ? `Capability (${c.model.capabilityRating}) is lower than top candidate (${winner.model.capabilityRating}).`
          : `Composite score of ${(c.selectionScore * 100).toFixed(0)} is below top candidate score of ${(winner.selectionScore * 100).toFixed(0)}.`
      }`;
    } else {
      c.eligibilityExplanation = `Disqualified due to ${c.rejectionReasons.length} constraint violation(s): ${c.rejectionReasons.join('; ')}.`;
    }
  });

  // Re-sort evaluated array so Selected is at top, followed by other eligible, then rejected
  evaluated.sort((a, b) => {
    if (a.status === 'selected') return -1;
    if (b.status === 'selected') return 1;
    if (a.status === 'eligible' && b.status === 'rejected') return -1;
    if (a.status === 'rejected' && b.status === 'eligible') return 1;
    if (a.status === 'eligible' && b.status === 'eligible') return b.selectionScore - a.selectionScore;
    return b.model.capabilityRating - a.model.capabilityRating;
  });

  return {
    candidates: evaluated,
    selected: winner,
    failoverChain
  };
}

export function formatPreference(p: RoutingPreference): string {
  switch (p) {
    case 'lowest_cost': return 'Lowest Cost';
    case 'lowest_latency': return 'Lowest Latency';
    case 'highest_capability': return 'Highest Capability';
    case 'balanced': return 'Balanced';
  }
}

/**
 * Main routing evaluation execution.
 */
export function routeRequest(
  prompt: string,
  category: TaskCategory,
  constraints: Constraints,
  preference: RoutingPreference,
  models: Model[]
): RecommendationResult {
  const complexity = estimateComplexity(prompt, category);
  const evaluation = evaluateCandidates(
    models,
    constraints,
    preference,
    complexity.estimatedInputTokens,
    complexity.estimatedOutputTokens
  );

  const decisionId = 'dec_' + Math.random().toString(36).substring(2, 10);
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return {
    decisionId,
    timestamp,
    prompt,
    estimatedInputTokens: complexity.estimatedInputTokens,
    estimatedOutputTokens: complexity.estimatedOutputTokens,
    complexityScore: complexity.complexityScore,
    taskCategory: category,
    constraints,
    preference,
    selectedModel: evaluation.selected ? evaluation.selected.model : null,
    selectedEvaluation: evaluation.selected,
    candidates: evaluation.candidates,
    failoverChain: evaluation.failoverChain,
    hasValidMatch: evaluation.selected !== null,
    statusMessage: evaluation.selected 
      ? 'All hard constraints passed' 
      : 'No model satisfies all hard constraints'
  };
}
