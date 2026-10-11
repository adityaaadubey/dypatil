export type Provider = 
  | 'Groq'
  | 'Anthropic'
  | 'OpenAI'
  | 'Google'
  | 'Meta'
  | 'Mistral'
  | 'DeepSeek'
  | 'Cohere'
  | 'NVIDIA'
  | 'Poolside'
  | 'LiquidAI'
  | 'Thinking Machines'
  | 'OpenRouter'
  | (string & {});

export type EndpointStatus = 'online' | 'degraded' | 'down';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface InferenceUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface InferenceResult {
  content: string;
  model: string;
  requestedModel?: string;
  failedModel?: string;
  failedPrimaryModel?: string;
  usage?: InferenceUsage;
  latencyMs: number;
  ttftMs?: number;
  costUsd: number;
  timestamp: string;
  failoverUsed?: boolean;
  attemptedModels?: string[];
  error?: string;
  mode?: 'auto' | 'manual';
}

export type ModelCategory = 
  | 'general'
  | 'coding'
  | 'reasoning'
  | 'fast'
  | 'long-context';

export interface Model {
  id: string; // Exact API model ID (e.g. anthropic/claude-3-5-sonnet-20241022)
  name: string; // Human readable display name
  provider: Provider;
  category: ModelCategory;
  description: string;
  contextWindow: number; // Tokens, e.g. 200000
  inputCostPerMillion: number; // USD per 1M tokens
  outputCostPerMillion: number; // USD per 1M tokens
  baseLatencyP95: number; // ms
  currentLatencyP95: number; // ms (can be adjusted by judge/simulator)
  capabilityRating: number; // 1.0 to 10.0 scale
  reliabilityScore: number; // e.g. 99.98%
  endpointStatus: EndpointStatus; // online, degraded, down
  specialties: string[];
  isVerified: boolean;
}

export type RoutingPreference = 
  | 'lowest_cost'
  | 'lowest_latency'
  | 'highest_capability'
  | 'balanced';

export type TaskCategory = 
  | 'code_generation'
  | 'complex_reasoning'
  | 'general_chat'
  | 'data_extraction'
  | 'summarization'
  | 'creative_writing';

export interface Constraints {
  maxLatency: number; // ms
  maxCost: number; // USD estimated query cost
  minCapability: number; // 1.0 to 10.0
  requiredContext: number; // tokens
}

export interface CandidateEvaluation {
  model: Model;
  status: 'selected' | 'eligible' | 'rejected';
  estimatedCost: number; // USD for the given query
  effectiveLatencyP95: number; // ms considering health
  passedConstraints: {
    latency: boolean;
    cost: boolean;
    capability: boolean;
    context: boolean;
    availability: boolean;
  };
  rejectionReasons: string[];
  eligibilityExplanation: string;
  selectionScore: number; // Normalized preference score
}

export interface RecommendationResult {
  decisionId: string;
  timestamp: string;
  prompt: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  complexityScore: number;
  taskCategory: TaskCategory;
  constraints: Constraints;
  preference: RoutingPreference;
  selectedModel: Model | null;
  selectedEvaluation: CandidateEvaluation | null;
  candidates: CandidateEvaluation[];
  failoverChain: Model[];
  hasValidMatch: boolean;
  statusMessage: string;
  isSimulatedFailoverActive?: boolean;
  failedPrimaryModelName?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  decisionId: string;
  promptSnippet: string;
  preference: RoutingPreference;
  selectedModelId: string | null;
  selectedModelName: string | null;
  estimatedCost: number;
  latencyP95: number;
  failoverOccurred: boolean;
  status: 'SUCCESS' | 'NO_MATCH' | 'FAILED_OVER';
}
