import dotenv from 'dotenv';
import { telemetryTracker } from './telemetryTracker.js';

dotenv.config();

let cachedModels = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache

/**
 * Models that are restricted to agentic harnesses or non-chat modalities
 * and must be excluded from standard chat completions.
 */
export const UNSUPPORTED_CHAT_MODELS = new Set([
  'thinkingmachines/inkling:free',
  'thinkingmachines/inkling-small:free',
  'google/lyria-3-pro-preview',
  'google/lyria-3-clip-preview'
]);

export function isFreeModelsOnly() {
  const envVal = process.env.FREE_MODELS_ONLY;
  if (envVal === undefined || envVal === null) return true;
  return envVal.toLowerCase() !== 'false';
}

export function getOpenRouterApiKey(useFallback = false) {
  if (useFallback && process.env.OPENROUTER_FALLBACK_API_KEY) {
    const fb = process.env.OPENROUTER_FALLBACK_API_KEY.trim();
    if (fb && fb !== 'your_key_here' && fb !== 'your_openrouter_api_key_here') return fb;
  }
  const key = (process.env.OPENROUTER_API_KEY || '').trim();
  if (key && key !== 'your_key_here' && key !== 'your_openrouter_api_key_here') return key;
  const fb = (process.env.OPENROUTER_FALLBACK_API_KEY || '').trim();
  if (fb && fb !== 'your_key_here' && fb !== 'your_openrouter_api_key_here') return fb;
  return '';
}

/**
 * Normalizes OpenRouter raw provider string into canonical display name.
 */
function normalizeProvider(providerSlug, rawName) {
  const slug = (providerSlug || '').toLowerCase();
  const name = (rawName || '').toLowerCase();

  if (slug === 'google' || name.startsWith('google:')) return 'Google';
  if (slug === 'nvidia' || name.startsWith('nvidia:')) return 'NVIDIA';
  if (slug === 'cohere' || name.startsWith('cohere:')) return 'Cohere';
  if (slug === 'poolside' || name.startsWith('poolside:')) return 'Poolside';
  if (slug === 'liquid' || slug.includes('liquidai')) return 'LiquidAI';
  if (slug.includes('thinkingmachines') || slug.includes('thinking-machines')) return 'Thinking Machines';
  if (slug === 'apodex') return 'Apodex';
  if (slug.includes('dots-studio') || slug === 'dots') return 'Dots Studio';
  if (slug === 'inclusionai') return 'inclusionAI';
  if (slug === 'openrouter') return 'OpenRouter';
  if (slug === 'deepseek') return 'DeepSeek';
  if (slug === 'meta') return 'Meta';
  if (slug === 'mistral') return 'Mistral';
  return providerSlug ? providerSlug.charAt(0).toUpperCase() + providerSlug.slice(1) : 'OpenRouter';
}

/**
 * Categorizes model based on its ID, description, and characteristics.
 */
function inferCategory(model) {
  const id = model.id.toLowerCase();
  const name = (model.name || '').toLowerCase();
  const desc = (model.description || '').toLowerCase();
  const text = `${id} ${name} ${desc}`;

  if (text.includes('code') || text.includes('coder') || text.includes('coding')) return 'coding';
  if (text.includes('reason') || text.includes('r1') || text.includes('math') || text.includes('ultra')) return 'reasoning';
  if (text.includes('flash') || text.includes('lightning') || text.includes('fast') || text.includes('xs') || text.includes('mini')) return 'fast';
  if ((model.context_length || 0) >= 500000) return 'long-context';
  return 'general';
}

/**
 * Infers capability rating (1.0 to 10.0 scale).
 */
function inferCapability(model) {
  const id = model.id.toLowerCase();
  if (id.includes('ultra') || id.includes('large') || id.includes('deepseek-r1')) return 9.2;
  if (id.includes('31b') || id.includes('super')) return 8.9;
  if (id.includes('26b') || id.includes('laguna') || id.includes('apodex')) return 8.6;
  if (id.includes('lightning') || id.includes('north-mini') || id.includes('dots')) return 8.4;
  if (id.includes('xs') || id.includes('2.6b')) return 8.2;
  return 8.5;
}

/**
 * Infers expected p95 latency in ms.
 */
function inferLatency(model) {
  const id = model.id.toLowerCase();
  if (id.includes('lightning') || id.includes('safety') || id.includes('lfm')) return 120;
  if (id.includes('nano') || id.includes('xs') || id.includes('flash') || id.includes('26b')) return 190;
  if (id.includes('north-mini') || id.includes('dots') || id.includes('super')) return 260;
  if (id.includes('31b') || id.includes('laguna-s') || id.includes('apodex')) return 310;
  if (id.includes('ultra') || id.includes('inkling')) return 420;
  return 240;
}

/**
 * Generates descriptive tags & specialties.
 */
function extractSpecialties(model) {
  const specs = [];
  const ctx = model.context_length || 0;
  if (ctx >= 1000000) specs.push('1M Context');
  else if (ctx >= 500000) specs.push('512K Context');
  else if (ctx >= 250000) specs.push('256K Context');

  const text = `${model.id} ${model.name || ''} ${model.description || ''}`.toLowerCase();
  if (text.includes('code') || text.includes('coding')) specs.push('Code Synthesis');
  if (text.includes('reasoning')) specs.push('Multi-step Reasoning');
  if (text.includes('multimodal') || (model.architecture?.input_modalities && model.architecture.input_modalities.length > 1)) specs.push('Multimodal Input');
  if (text.includes('moe') || text.includes('mixture-of-experts')) specs.push('MoE Architecture');
  if (text.includes('safety') || text.includes('guardrail')) specs.push('Safety Guardrails');
  if (text.includes('agent')) specs.push('Agentic Workflows');
  specs.push('Free Tier');

  return specs.slice(0, 4);
}

/**
 * Normalizes OpenRouter raw model object into ModelRouter Model interface.
 */
export function normalizeOpenRouterModel(raw) {
  const parts = raw.id.split('/');
  const providerSlug = parts[0] || 'openrouter';
  const provider = normalizeProvider(providerSlug, raw.name);
  const category = inferCategory(raw);

  const promptCost = raw.pricing?.prompt !== undefined ? parseFloat(raw.pricing.prompt) : null;
  const completionCost = raw.pricing?.completion !== undefined ? parseFloat(raw.pricing.completion) : null;

  const inputCostPerMillion = promptCost !== null ? Number((promptCost * 1_000_000).toFixed(4)) : 0;
  const outputCostPerMillion = completionCost !== null ? Number((completionCost * 1_000_000).toFixed(4)) : 0;
  const baseLat = inferLatency(raw);

  return {
    id: raw.id,
    name: raw.name || raw.id,
    provider,
    category,
    description: raw.description || `${raw.name || raw.id} model via OpenRouter`,
    contextWindow: raw.context_length || 128000,
    inputCostPerMillion,
    outputCostPerMillion,
    baseLatencyP95: baseLat,
    currentLatencyP95: baseLat,
    capabilityRating: inferCapability(raw),
    reliabilityScore: 99.95,
    endpointStatus: 'online',
    specialties: extractSpecialties(raw),
    isVerified: true
  };
}

/**
 * Fetches the live OpenRouter catalogue with caching and filtering.
 */
export async function getOpenRouterCatalogue(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedModels && now - lastCacheTime < CACHE_TTL_MS) {
    const enriched = cachedModels.models.map(m => telemetryTracker.enrichModel(m));
    return { ...cachedModels, models: enriched };
  }

  const freeOnly = isFreeModelsOnly();
  const apiKey = getOpenRouterApiKey();

  const headers = {};
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers,
      signal: AbortSignal.timeout(12000)
    });

    if (!res.ok) {
      throw new Error(`OpenRouter models API returned status ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    const rawList = Array.isArray(json.data) ? json.data : [];

    let filtered = rawList.filter((m) => {
      // Exclude models that require agentic harnesses or non-chat modalities
      if (UNSUPPORTED_CHAT_MODELS.has(m.id)) return false;
      const desc = (m.description || '').toLowerCase();
      if (desc.includes('agentic harness') || desc.includes('per song') || desc.includes('duration clips')) {
        return false;
      }

      if (freeOnly) {
        if (!m.pricing) return false;
        const promptPrice = parseFloat(m.pricing.prompt);
        const compPrice = parseFloat(m.pricing.completion);
        return !isNaN(promptPrice) && !isNaN(compPrice) && promptPrice === 0 && compPrice === 0;
      }
      return true;
    });

    const normalized = filtered.map(normalizeOpenRouterModel);
    const enriched = normalized.map(m => telemetryTracker.enrichModel(m));

    cachedModels = {
      models: enriched,
      count: enriched.length,
      freeOnly,
      lastSync: new Date().toISOString()
    };
    lastCacheTime = now;

    return cachedModels;
  } catch (err) {
    console.error('[OpenRouter Service] Failed to fetch live models:', err.message);
    if (cachedModels) {
      return cachedModels;
    }
    throw err;
  }
}

/**
 * Executes a non-streaming chat completion request to OpenRouter.
 */
export async function executeChatCompletion(params) {
  const { 
    model, 
    messages, 
    prompt, 
    failoverModels = [], 
    mode = 'auto', 
    temperature, 
    maxTokens,
    signal 
  } = params;

  const apiKey = getOpenRouterApiKey();
  const freeOnly = isFreeModelsOnly();

  if (!model) {
    return {
      success: false,
      error: 'Missing required parameter: "model" must be specified.',
      code: 'MISSING_MODEL_ID',
      statusCode: 400
    };
  }

  // Reject unsupported models
  if (UNSUPPORTED_CHAT_MODELS.has(model)) {
    return {
      success: false,
      error: `Model "${model}" requires an agentic harness and cannot be used for standard chat completions.`,
      code: 'UNSUPPORTED_CHAT_MODEL',
      statusCode: 400,
      requestedModel: model,
      failedModel: model,
      attemptedModels: [model],
      failoverUsed: false,
      mode
    };
  }

  const isKnownFree = (m) => m && (m.endsWith(':free') || m === 'openrouter/free' || m === 'inclusionai/ling-3.1-flash');

  if (freeOnly && !isKnownFree(model)) {
    return {
      success: false,
      error: `Model "${model}" is a paid model. In free-only mode (FREE_MODELS_ONLY=true), only zero-cost models are permitted.`,
      code: 'PAID_MODEL_BLOCKED',
      statusCode: 403,
      requestedModel: model,
      failedModel: model,
      attemptedModels: [model],
      failoverUsed: false,
      mode
    };
  }

  if (!apiKey) {
    return {
      success: false,
      error: 'OPENROUTER_API_KEY is not configured on the server. Please set your OPENROUTER_API_KEY in the server environment (.env) to execute live model requests.',
      code: 'MISSING_API_KEY',
      statusCode: 401,
      requestedModel: model,
      failedModel: model,
      failoverUsed: false,
      mode
    };
  }

  let chatMessages = messages;
  if (!chatMessages || chatMessages.length === 0) {
    if (prompt) {
      chatMessages = [{ role: 'user', content: prompt }];
    } else {
      return {
        success: false,
        error: 'No prompt or messages provided for inference request.',
        code: 'INVALID_REQUEST',
        statusCode: 400,
        requestedModel: model,
        failedModel: model,
        failoverUsed: false,
        mode
      };
    }
  }

  const eligibleFailovers = mode === 'manual'
    ? []
    : failoverModels
        .filter((m) => m && m !== model && !UNSUPPORTED_CHAT_MODELS.has(m))
        .filter((m) => !freeOnly || isKnownFree(m));

  const candidateModels = [model, ...eligibleFailovers];
  const attemptedModels = [];

  for (let i = 0; i < candidateModels.length; i++) {
    const currentModel = candidateModels[i];
    attemptedModels.push(currentModel);

    if (freeOnly && !isKnownFree(currentModel)) continue;
    if (UNSUPPORTED_CHAT_MODELS.has(currentModel)) continue;

    const startTime = Date.now();
    try {
      const timeoutSignal = AbortSignal.timeout(45000);
      const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

      const bodyPayload = {
        model: currentModel,
        messages: chatMessages
      };
      if (typeof temperature === 'number') bodyPayload.temperature = temperature;
      if (typeof maxTokens === 'number') bodyPayload.max_tokens = maxTokens;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'VORTEXA 3.0 ModelRouter',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload),
        signal: combinedSignal
      });

      const latencyMs = Date.now() - startTime;
      const resJson = await response.json();

      if (!response.ok) {
        const errorMsg = resJson?.error?.metadata?.raw || resJson?.error?.message || `Provider responded with status ${response.status}`;
        console.warn(`[OpenRouter Service] Request to "${currentModel}" failed (${response.status}): ${errorMsg}`);
        telemetryTracker.recordFailure(currentModel, response.status, errorMsg);

        if (i < candidateModels.length - 1) {
          console.info(`[OpenRouter Service] Triggering failover from "${currentModel}" to "${candidateModels[i + 1]}"...`);
          continue;
        }

        return {
          success: false,
          error: errorMsg,
          code: response.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'PROVIDER_ERROR',
          statusCode: response.status,
          latencyMs,
          requestedModel: model,
          failedModel: currentModel,
          attemptedModels,
          failoverUsed: false,
          mode
        };
      }

      const choice = resJson.choices?.[0];
      const replyContent = choice?.message?.content || '';
      const usage = resJson.usage ? {
        promptTokens: resJson.usage.prompt_tokens || 0,
        completionTokens: resJson.usage.completion_tokens || 0,
        totalTokens: resJson.usage.total_tokens || 0
      } : undefined;

      const actualModel = resJson.model || currentModel;
      telemetryTracker.recordSuccess(actualModel, latencyMs, latencyMs, usage?.totalTokens || 0);

      return {
        success: true,
        content: replyContent,
        model: actualModel,
        requestedModel: model,
        usage,
        latencyMs,
        costUsd: 0.00,
        timestamp: new Date().toISOString(),
        failoverUsed: i > 0,
        failedPrimaryModel: i > 0 ? model : undefined,
        attemptedModels,
        mode
      };
    } catch (reqErr) {
      const latencyMs = Date.now() - startTime;
      if (signal?.aborted) {
        return {
          success: false,
          error: 'Generation cancelled by user.',
          code: 'USER_CANCELLED',
          statusCode: 499,
          latencyMs,
          requestedModel: model,
          failedModel: currentModel,
          mode
        };
      }

      console.warn(`[OpenRouter Service] Network error with "${currentModel}":`, reqErr.message);
      telemetryTracker.recordFailure(currentModel, 504, reqErr.message);

      if (i < candidateModels.length - 1) {
        console.info(`[OpenRouter Service] Triggering network failover from "${currentModel}" to "${candidateModels[i + 1]}"...`);
        continue;
      }

      return {
        success: false,
        error: reqErr.name === 'TimeoutError' ? 'Inference request timed out after 45 seconds.' : reqErr.message,
        code: reqErr.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
        statusCode: 504,
        latencyMs,
        requestedModel: model,
        failedModel: currentModel,
        attemptedModels,
        failoverUsed: false,
        mode
      };
    }
  }

  return {
    success: false,
    error: `All candidate models in the failover chain failed. Primary requested model was "${model}".`,
    code: 'FAILOVER_EXHAUSTED',
    statusCode: 503,
    requestedModel: model,
    failedModel: candidateModels[candidateModels.length - 1],
    attemptedModels,
    failoverUsed: false,
    mode
  };
}

/**
 * Streams chat completion directly from OpenRouter via Server-Sent Events (SSE).
 */
export async function streamOpenRouterChatCompletion(params) {
  const {
    model,
    messages,
    prompt,
    mode = 'auto',
    temperature,
    maxTokens,
    onChunk,
    signal
  } = params;

  const apiKey = getOpenRouterApiKey();
  const startTime = Date.now();
  let firstTokenTime = null;

  if (!model) {
    return {
      success: false,
      error: 'Missing required parameter: "model".',
      code: 'MISSING_MODEL_ID',
      statusCode: 400
    };
  }

  if (UNSUPPORTED_CHAT_MODELS.has(model)) {
    return {
      success: false,
      error: `Model "${model}" requires an agentic harness and cannot be used for standard chat completions.`,
      code: 'UNSUPPORTED_CHAT_MODEL',
      statusCode: 400,
      requestedModel: model,
      failedModel: model,
      failoverUsed: false,
      mode
    };
  }

  const isKnownFree = (m) => m && (m.endsWith(':free') || m === 'openrouter/free' || m === 'inclusionai/ling-3.1-flash');
  if (isFreeModelsOnly() && !isKnownFree(model)) {
    return {
      success: false,
      error: `Model "${model}" is a paid model. In free-only mode, only zero-cost models are permitted.`,
      code: 'PAID_MODEL_BLOCKED',
      statusCode: 403,
      requestedModel: model,
      failedModel: model,
      failoverUsed: false,
      mode
    };
  }

  if (!apiKey) {
    return {
      success: false,
      error: 'OPENROUTER_API_KEY is not configured on the server.',
      code: 'MISSING_API_KEY',
      statusCode: 401,
      requestedModel: model,
      failedModel: model,
      failoverUsed: false,
      mode
    };
  }

  let chatMessages = messages;
  if (!chatMessages || chatMessages.length === 0) {
    if (prompt) chatMessages = [{ role: 'user', content: prompt }];
    else return { success: false, error: 'No prompt or messages provided.', code: 'INVALID_REQUEST', statusCode: 400 };
  }

  const timeoutSignal = AbortSignal.timeout(45000);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  const requestBody = {
    model,
    messages: chatMessages,
    stream: true
  };
  if (typeof temperature === 'number') requestBody.temperature = temperature;
  if (typeof maxTokens === 'number') requestBody.max_tokens = maxTokens;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'VORTEXA 3.0 ModelRouter',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: combinedSignal
    });

    if (!response.ok) {
      const latencyMs = Date.now() - startTime;
      const resJson = await response.json().catch(() => ({}));
      const errorMsg = resJson?.error?.metadata?.raw || resJson?.error?.message || `Provider responded with status ${response.status}`;
      telemetryTracker.recordFailure(model, response.status, errorMsg);

      return {
        success: false,
        error: errorMsg,
        code: response.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'PROVIDER_ERROR',
        statusCode: response.status,
        latencyMs,
        requestedModel: model,
        failedModel: model,
        failoverUsed: false,
        attemptedModels: [model],
        mode
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedContent = '';
    let finalUsage = null;
    let actualModel = model;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const str = line.slice(6).trim();
          if (str === '[DONE]') continue;
          if (!str) continue;

          try {
            const parsed = JSON.parse(str);
            if (parsed.model) actualModel = parsed.model;
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              if (firstTokenTime === null) {
                firstTokenTime = Date.now() - startTime;
              }
              accumulatedContent += delta;
              if (typeof onChunk === 'function') {
                onChunk(delta);
              }
            }
            if (parsed.usage) {
              finalUsage = {
                promptTokens: parsed.usage.prompt_tokens || 0,
                completionTokens: parsed.usage.completion_tokens || 0,
                totalTokens: parsed.usage.total_tokens || 0
              };
            }
          } catch {}
        }
      }
    }

    const latencyMs = Date.now() - startTime;
    const ttftMs = firstTokenTime !== null ? firstTokenTime : latencyMs;
    telemetryTracker.recordSuccess(actualModel, latencyMs, ttftMs, finalUsage?.totalTokens || 0);

    return {
      success: true,
      content: accumulatedContent,
      model: actualModel,
      requestedModel: model,
      ttftMs,
      latencyMs,
      usage: finalUsage,
      costUsd: 0.00,
      timestamp: new Date().toISOString(),
      failoverUsed: false,
      attemptedModels: [model],
      mode
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    if (signal?.aborted) {
      return {
        success: false,
        error: 'Generation cancelled by user.',
        code: 'USER_CANCELLED',
        statusCode: 499,
        latencyMs,
        requestedModel: model,
        failedModel: model,
        mode
      };
    }

    telemetryTracker.recordFailure(model, 504, err.message);
    return {
      success: false,
      error: err.name === 'TimeoutError' ? 'Inference request timed out after 45 seconds.' : err.message,
      code: err.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
      statusCode: 504,
      latencyMs,
      requestedModel: model,
      failedModel: model,
      failoverUsed: false,
      attemptedModels: [model],
      mode
    };
  }
}
