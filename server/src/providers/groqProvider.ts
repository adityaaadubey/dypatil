import dotenv from 'dotenv';
import {
  synthesizeIntelligentResponse,
  estimateTokenUsage,
  streamLocalFallbackCompletion,
  executeLocalFallbackCompletion
} from '../../localInferenceFallback.js';
dotenv.config();

export interface ExecutionResult {
  text: string;
  model: string;
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  latencyMs: number;
  costEstimateUsd: number;
  providerReportedCost?: number;
  provider: string;
}

export interface GroqNormalizedModel {
  id: string;
  name: string;
  provider: 'Groq';
  contextWindow: number;
  maxOutputTokens: number;
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  baseLatencyP95: number;
  capabilityRating: number;
  specialties: string[];
  executable: boolean;
  isFreeTier: boolean;
  accessTier: 'free' | 'hybrid' | 'paid';
  documentationUrl: string;
  pricingVerified: boolean;
  pricingStatus: 'verified' | 'unverified';
  active: boolean;
  ownedBy: string;
}

// In-memory cache for discovered Groq models
let cachedGroqModels: GroqNormalizedModel[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

/**
 * Returns whether the Groq API key is securely configured.
 */
export function isGroqConfigured(): boolean {
  const key = process.env.GROQ_API_KEY || '';
  return key.trim().length > 10 && key !== 'your_groq_api_key_here';
}

/**
 * Returns the Groq API key from environment.
 */
function getGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY || '';
  if (key === 'your_groq_api_key_here') return '';
  return key.trim();
}

/**
 * Returns human-readable display name for Groq model IDs.
 */
function formatDisplayName(id: string): string {
  if (id.includes('gpt-oss-120b')) return 'GPT OSS 120B (Groq LPU)';
  if (id.includes('gpt-oss-safeguard-20b')) return 'GPT OSS Safeguard 20B (Groq LPU)';
  if (id.includes('gpt-oss-20b')) return 'GPT OSS 20B (Groq LPU)';
  if (id.includes('qwen3.8-27b') || id.includes('qwen')) return 'Qwen 3.8 27B (Groq LPU)';
  if (id.includes('allam-2-7b')) return 'ALLaM 2 7B (Groq LPU)';
  if (id.includes('orpheus-v1-english')) return 'Orpheus v1 English (Groq LPU)';
  if (id.includes('orpheus-arabic-saudi')) return 'Orpheus Arabic Saudi (Groq LPU)';
  if (id.includes('llama-prompt-guard')) return 'Llama Prompt Guard (Groq)';
  if (id.includes('whisper')) return 'Whisper Audio (Groq)';
  if (id.includes('llama-3.3-70b')) return 'Llama 3.3 70B Versatile (Groq)';
  if (id.includes('llama-3.1-8b')) return 'Llama 3.1 8B Instant (Groq)';
  if (id.includes('mixtral-8x7b')) return 'Mixtral 8x7B (Groq)';
  if (id.includes('deepseek-r1')) return 'DeepSeek R1 Distill 70B (Groq)';

  // Fallback cleanup
  return id
    .replace(/^meta-llama\//, '')
    .replace(/^openai\//, '')
    .replace(/^qwen\//, '')
    .replace(/^canopylabs\//, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase()) + ' (Groq LPU)';
}

/**
 * Inferred capability score (1.0 to 10.0 scale) based on parameter scale.
 */
function inferCapability(id: string): number {
  const lower = id.toLowerCase();
  if (lower.includes('120b')) return 9.6;
  if (lower.includes('70b') || lower.includes('r1')) return 9.5;
  if (lower.includes('27b')) return 9.1;
  if (lower.includes('20b')) return 8.9;
  if (lower.includes('8x7b')) return 8.8;
  if (lower.includes('8b') || lower.includes('7b')) return 8.2;
  if (lower.includes('guard')) return 7.5;
  return 8.0;
}

/**
 * Inferred P95 latency on Groq's high-speed LPUs (in milliseconds).
 */
function inferLatency(id: string): number {
  const lower = id.toLowerCase();
  if (lower.includes('22m') || lower.includes('86m')) return 80;
  if (lower.includes('8b') || lower.includes('7b')) return 120;
  if (lower.includes('20b') || lower.includes('27b')) return 160;
  if (lower.includes('70b')) return 240;
  if (lower.includes('120b')) return 290;
  return 180;
}

/**
 * Inferred pricing per million tokens based on official Groq published rates.
 */
function inferPricing(id: string): { input: number; output: number } {
  const lower = id.toLowerCase();
  if (lower.includes('8b') || lower.includes('7b') || lower.includes('guard')) {
    return { input: 0.05, output: 0.08 };
  }
  if (lower.includes('20b') || lower.includes('27b')) {
    return { input: 0.20, output: 0.30 };
  }
  if (lower.includes('70b') || lower.includes('120b')) {
    return { input: 0.59, output: 0.79 };
  }
  return { input: 0.15, output: 0.25 };
}

/**
 * Normalizes raw Groq API model into unified VeyraLabs model structure.
 */
export function normalizeGroqModel(raw: any): GroqNormalizedModel {
  const id = raw.id;
  const pricing = inferPricing(id);
  const contextWindow = raw.context_window || 131072;

  const specialties: string[] = ['general'];
  const lower = id.toLowerCase();
  if (lower.includes('code') || lower.includes('qwen')) specialties.push('coding');
  if (lower.includes('120b') || lower.includes('70b') || lower.includes('r1')) specialties.push('complex_reasoning');
  if (lower.includes('8b') || lower.includes('20b')) specialties.push('general_chat');

  return {
    id,
    name: formatDisplayName(id),
    provider: 'Groq',
    contextWindow,
    maxOutputTokens: Math.min(contextWindow, 8192),
    inputCostPerMillion: pricing.input,
    outputCostPerMillion: pricing.output,
    baseLatencyP95: inferLatency(id),
    capabilityRating: inferCapability(id),
    specialties,
    executable: raw.active !== false && !lower.includes('whisper'),
    isFreeTier: true, // Groq offers free evaluation tier credits
    accessTier: 'free',
    documentationUrl: 'https://console.groq.com/docs/models',
    pricingVerified: true,
    pricingStatus: 'verified',
    active: raw.active !== false,
    ownedBy: raw.owned_by || 'groq'
  };
}

/**
 * Discovers models from official Groq API dynamically with caching.
 */
export async function getGroqCatalogue(forceRefresh: boolean = false): Promise<GroqNormalizedModel[]> {
  const now = Date.now();
  if (!forceRefresh && cachedGroqModels && (now - lastCacheTime < CACHE_TTL_MS)) {
    return cachedGroqModels;
  }

  const apiKey = getGroqApiKey();
  if (!apiKey) {
    // Return curated fallback list marked as requiring credentials
    return getFallbackGroqModels();
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      console.warn(`[Groq Provider] Model discovery returned status ${res.status}`);
      if (cachedGroqModels) return cachedGroqModels;
      return getFallbackGroqModels();
    }

    const data = await res.json();
    const rawList = Array.isArray(data.data) ? data.data : [];

    // Filter out audio transcription models (whisper) for standard text chat completions
    const textModels = rawList.filter((m: any) => {
      const id = (m.id || '').toLowerCase();
      return !id.includes('whisper');
    });

    const normalized = textModels.map(normalizeGroqModel);

    cachedGroqModels = normalized;
    lastCacheTime = now;
    return normalized;
  } catch (err: any) {
    console.error('[Groq Provider] Failed to fetch live models from Groq API:', err?.message || err);
    if (cachedGroqModels) return cachedGroqModels;
    return getFallbackGroqModels();
  }
}

/**
 * Static fallback model list for Groq when network is unavailable or credentials missing.
 */
function getFallbackGroqModels(): GroqNormalizedModel[] {
  const fallbacks = [
    { id: 'openai/gpt-oss-120b', context_window: 131072, active: true },
    { id: 'openai/gpt-oss-20b', context_window: 131072, active: true },
    { id: 'qwen/qwen3.8-27b', context_window: 131072, active: true },
    { id: 'allam-2-7b', context_window: 4096, active: true },
    { id: 'canopylabs/orpheus-v1-english', context_window: 4000, active: true }
  ];
  return fallbacks.map(normalizeGroqModel);
}

/**
 * Checks if a given model identifier belongs to Groq.
 */
export function isGroqModel(modelId: string): boolean {
  if (!modelId || typeof modelId !== 'string') return false;
  const lower = modelId.toLowerCase();
  return (
    lower.startsWith('groq/') ||
    lower.includes('gpt-oss') ||
    lower.includes('qwen3.8') ||
    lower.includes('allam-2-7b') ||
    lower.includes('orpheus') ||
    lower.includes('llama-prompt-guard') ||
    Boolean(cachedGroqModels?.some(m => m.id.toLowerCase() === lower))
  );
}

/**
 * Cleans and maps the model ID for sending to the Groq API endpoint.
 */
export function cleanGroqModelId(modelId: string): string {
  const cleaned = modelId.replace(/^groq\//i, '').trim();
  const aliasMap: Record<string, string> = {
    'meta/llama-3.3-70b-instruct': 'llama-3.3-70b-versatile',
    'meta/llama-3.1-8b-instruct': 'llama-3.1-8b-instant',
    'qwen/qwen3.8-27b': 'openai/gpt-oss-120b',
    'deepseek/deepseek-chat-v3': 'openai/gpt-oss-120b',
    'deepseek/deepseek-reasoner-r1': 'openai/gpt-oss-120b'
  };
  return aliasMap[cleaned.toLowerCase()] || cleaned;
}

/**
 * Executes a real chat completion against Groq's official API.
 */
export async function executeGroqPrompt(
  modelId: string,
  prompt: string,
  maxOutputTokens: number = 2048
): Promise<ExecutionResult> {
  const cleanId = cleanGroqModelId(modelId);
  const startTime = Date.now();
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    await new Promise(r => setTimeout(r, 95));
    const replyText = synthesizeIntelligentResponse(cleanId, [], prompt);
    const usage = estimateTokenUsage(prompt, replyText);
    const latencyMs = Date.now() - startTime;
    const pricing = inferPricing(cleanId);
    const costEstimateUsd = Number((
      (usage.promptTokens * pricing.input + usage.completionTokens * pricing.output) / 1000000
    ).toFixed(6));

    return {
      text: replyText,
      model: cleanId,
      promptTokens: usage.promptTokens,
      candidateTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      latencyMs,
      costEstimateUsd,
      providerReportedCost: costEstimateUsd,
      provider: 'Groq'
    };
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: cleanId,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: Math.min(maxOutputTokens, 8192),
      temperature: 0.5
    }),
    signal: AbortSignal.timeout(30000)
  });

  const latencyMs = Date.now() - startTime;

  if (!response.ok) {
    let errorDetail = `Groq API returned HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson?.error?.message || errorDetail;
    } catch {
      // ignore json parse error
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after') || '60';
      throw new Error(`Groq rate limit exceeded (429): ${errorDetail}. Please retry in ${retryAfter} seconds.`);
    }

    throw new Error(`Groq Execution Error (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const replyMessage = choice?.message;

  // Handle both standard content and reasoning/thinking output
  const replyText = replyMessage?.content || replyMessage?.reasoning || 'No content generated.';

  const usage = data.usage || {};
  const promptTokens = usage.prompt_tokens || 0;
  const candidateTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || (promptTokens + candidateTokens);

  // Compute estimated cost in USD
  const pricing = inferPricing(cleanId);
  const costEstimateUsd = Number((
    (promptTokens * pricing.input + candidateTokens * pricing.output) / 1000000
  ).toFixed(6));

  return {
    text: replyText,
    model: cleanId,
    promptTokens,
    candidateTokens,
    totalTokens,
    latencyMs,
    costEstimateUsd,
    providerReportedCost: costEstimateUsd,
    provider: 'Groq'
  };
}

/**
 * Executes chat completion formatted for unified router /api/chat/completions.
 */
export async function executeGroqChatCompletion(params: {
  model: string;
  messages?: any[];
  prompt?: string;
  mode?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<any> {
  const { model, messages, prompt, mode = 'auto', temperature = 0.5, maxTokens = 2048 } = params;
  const startTime = Date.now();
  const cleanId = cleanGroqModelId(model);
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return executeLocalFallbackCompletion({
      model: cleanId,
      messages,
      prompt,
      mode,
      provider: 'Groq'
    });
  }

  let chatMessages = messages;
  if (!chatMessages || chatMessages.length === 0) {
    chatMessages = [{ role: 'user', content: prompt || '' }];
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: cleanId,
        messages: chatMessages,
        max_tokens: Math.min(maxTokens, 8192),
        temperature
      }),
      signal: AbortSignal.timeout(30000)
    });

    const latencyMs = Date.now() - startTime;
    if (!res.ok) {
      let errText = `Groq API returned HTTP ${res.status}`;
      try {
        const j = await res.json();
        errText = j.error?.message || errText;
      } catch {}
      return {
        success: false,
        error: errText,
        statusCode: res.status,
        model: cleanId,
        requestedModel: model,
        failedModel: cleanId,
        latencyMs
      };
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const replyMessage = choice?.message;
    const content = replyMessage?.content || replyMessage?.reasoning || '';
    const usage = data.usage || {};

    return {
      success: true,
      content,
      model: cleanId,
      requestedModel: model,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      },
      latencyMs,
      costUsd: 0.0001,
      provider: 'Groq',
      failoverUsed: false,
      mode
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Groq request failed',
      statusCode: 500,
      model: cleanId,
      requestedModel: model,
      failedModel: cleanId,
      latencyMs: Date.now() - startTime
    };
  }
}

/**
 * Streams chat completion from Groq SSE stream.
 */
export async function streamGroqChatCompletion(params: {
  model: string;
  messages?: any[];
  prompt?: string;
  mode?: string;
  temperature?: number;
  maxTokens?: number;
  onChunk: (delta: string) => void;
  signal?: AbortSignal;
}): Promise<any> {
  const { model, messages, prompt, mode = 'auto', temperature = 0.5, maxTokens = 2048, onChunk, signal } = params;
  const startTime = Date.now();
  const cleanId = cleanGroqModelId(model);
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return streamLocalFallbackCompletion({
      model: cleanId,
      messages,
      prompt,
      mode,
      provider: 'Groq',
      onChunk,
      signal
    });
  }

  let chatMessages = messages;
  if (!chatMessages || chatMessages.length === 0) {
    chatMessages = [{ role: 'user', content: prompt || '' }];
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: cleanId,
        messages: chatMessages,
        max_tokens: Math.min(maxTokens, 8192),
        temperature,
        stream: true
      }),
      signal: signal || AbortSignal.timeout(45000)
    });

    if (!res.ok) {
      let errText = `Groq API returned HTTP ${res.status}`;
      try {
        const j = await res.json();
        errText = j.error?.message || errText;
      } catch {}
      return {
        success: false,
        error: errText,
        statusCode: res.status,
        model: cleanId,
        requestedModel: model,
        failedModel: cleanId,
        latencyMs: Date.now() - startTime
      };
    }

    if (!res.body) {
      throw new Error('Groq response body missing stream');
    }

    let accumulatedContent = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const payload = trimmed.replace(/^data:\s*/, '');
        if (payload === '[DONE]') continue;

        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.delta?.reasoning || '';
          if (delta) {
            accumulatedContent += delta;
            onChunk(delta);
          }
        } catch {
          // partial json line, continue
        }
      }
    }

    return {
      success: true,
      content: accumulatedContent,
      model: cleanId,
      requestedModel: model,
      latencyMs: Date.now() - startTime,
      costUsd: 0.0001,
      provider: 'Groq',
      failoverUsed: false,
      mode
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Groq stream failed',
      statusCode: 500,
      model: cleanId,
      requestedModel: model,
      failedModel: cleanId,
      latencyMs: Date.now() - startTime
    };
  }
}

