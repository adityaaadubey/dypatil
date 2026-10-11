
export type AccessTierClassification = 'free' | 'paid' | 'hybrid' | 'unknown';

export interface EnrichedModelCatalogItem {
  id: string; // unique ID
  modelKey: string;
  name: string;
  provider: string;
  modelFamily: string;
  variant: string;
  description: string;
  officialDescription: string;
  accessTier: AccessTierClassification;
  freeTierDetails?: {
    accessMethod: 'free_api' | 'hosted_playground' | 'open_weights_local' | 'community_endpoint';
    freeTierLimitations: string;
    rateLimits: string; // e.g. "15 RPM, 1M TPM"
    dailyQuotas: string;
    isConditional: boolean;
  };
  pricing: {
    inputPricePerMillionUSD: number | null;
    outputPricePerMillionUSD: number | null;
    cacheReadPricePerMillionUSD: number | null;
    cacheWritePricePerMillionUSD: number | null;
    currency: string;
    isPriceVerified: boolean;
  };
  contextWindow: number | null;
  maxOutputTokens: number | null;
  supportedInputModalities: string[]; // ['text', 'vision', 'audio', 'document']
  supportedOutputModalities: string[]; // ['text', 'image', 'audio']
  hasToolUse: boolean;
  hasStructuredOutput: boolean;
  isOpenWeight: boolean;
  license: string;
  status: 'stable' | 'preview' | 'pre_release' | 'deprecated';
  documentationUrl: string;
  bestUseCases: string[];
  capabilities: {
    codingRating: number | null; // 1 to 10
    reasoningRating: number | null;
    mathRating: number | null;
    writingRating: number | null;
    multilingualSupport: string[];
  };
  benchmarks: {
    arenaElo: number | null;
    codingScore: number | null; // e.g. HumanEval or Arena Code
    hardPromptElo: number | null;
  };
  knownLimitations: string[];
  reliabilityScore: number | null; // percentage
  baseLatencyP95: number | null; // ms
  lastVerified: string;
  dataProvenance: string;
}

export type PromptCategory = 
  | 'coding' 
  | 'reasoning' 
  | 'mathematics' 
  | 'writing' 
  | 'factual_qa' 
  | 'long_context' 
  | 'creative' 
  | 'multilingual' 
  | 'instruction_following' 
  | 'vision';

export interface SamplePromptItem {
  id: string;
  title: string;
  category: PromptCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'frontier';
  prompt: string;
  systemInstruction?: string;
  evaluationCriteria: string;
  expectedOutputFormat: string;
  suggestedMaxTokens: number;
  goodAnswerDescription: string;
  requiresDocumentOrImage?: boolean;
  isCustom?: boolean;
  isFavorite?: boolean;
}

export interface CacheEntry {
  cacheKey: string;
  timestamp: string;
  expiresAt: string;
  request: {
    modelId: string;
    provider: string;
    promptText: string;
    systemInstruction?: string;
    temperature: number;
    maxOutputTokens: number;
  };
  response: {
    text: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    latencyMs: number;
    estimatedCostUSD: number;
    finishReason: string;
    modelReturnedId: string;
  };
  hitCount: number;
}

export interface CacheAnalyticsStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRatePercentage: number;
  estimatedCallsAvoided: number;
  estimatedTokensAvoided: number;
  estimatedCostAvoidedUSD: number;
  lastInvalidationTimestamp: string | null;
}

export interface ModelComparisonResult {
  id: string;
  timestamp: string;
  prompt: string;
  systemInstruction?: string;
  modelA: {
    modelId: string;
    modelName: string;
    provider: string;
    response: string;
    latencyMs: number;
    tokensUsed: number;
    costUSD: number;
    isCacheHit: boolean;
    cachedAt?: string;
    status: 'success' | 'error';
    errorMessage?: string;
  };
  modelB: {
    modelId: string;
    modelName: string;
    provider: string;
    response: string;
    latencyMs: number;
    tokensUsed: number;
    costUSD: number;
    isCacheHit: boolean;
    cachedAt?: string;
    status: 'success' | 'error';
    errorMessage?: string;
  };
  userEvaluation?: {
    winner: 'modelA' | 'modelB' | 'tie' | 'both_bad';
    ratings: {
      correctnessA: number;
      correctnessB: number;
      clarityA: number;
      clarityB: number;
      instructionFollowingA: number;
      instructionFollowingB: number;
    };
    feedbackNotes?: string;
  };
}

export type HistoryItemType = 'recommendation' | 'comparison' | 'execution';

export interface HistoryItem {
  id: string;
  type: HistoryItemType;
  timestamp: string;
  title: string;
  summary: string;
  details: any;
  isFavorite?: boolean;
}
