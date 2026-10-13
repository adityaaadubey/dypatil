import dotenv from 'dotenv';
import { telemetryTracker } from './telemetryTracker.js';

dotenv.config();

let cachedGeminiModels = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache

// Known models requiring agentic harnesses or non-chat modalities
const UNSUPPORTED_GEMINI_PATTERNS = [
  'tts',
  'image',
  'banana',
  'lyria',
  'transcribe',
  'robotics',
  'computer-use',
  'antigravity',
  'deep-research'
];

// Models verified to be deprecated (404 for new keys) or zero-quota on standard tier
const DEPRECATED_GEMINI_MODELS = new Set([
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.5-flash-lite',
  'gemini-pro-latest',
  'gemini-3.1-pro-preview',
  'gemini-3.1-pro-preview-customtools',
  'gemini-omni-flash-preview',
  'gemini-omni-1.1-flash',
  'gemma-4-31b-it'
]);

// Models that require paid billing / quotas (no zero-cost free tier)
const PAID_GEMINI_MODELS = new Set([
  'gemini-3.1-pro-preview',
  'gemini-3.1-pro-preview-customtools',
  'gemini-pro-latest'
]);

const LEGACY_GEMINI_EXECUTION_MAP = {
  'gemini-1.5-flash': 'gemini-3.7-flash',
  'gemini-1.5-pro': 'gemini-3.7-flash',
  'gemini-1.0-pro': 'gemini-3.5-flash',
  'gemini-2.5-flash': 'gemini-3.7-flash',
  'gemini-2.5-pro': 'gemini-3.7-flash',
  'gemini-2.5-flash-lite': 'gemini-3.5-flash-lite',
  'gemma-4-31b-it': 'gemma-4-26b-a4b-it'
};

/**
 * Returns the configured Gemini API key with automatic emergency fallback support.
 */
export function getGeminiApiKey(useFallback = false) {
  if (useFallback && process.env.GEMINI_FALLBACK_API_KEY) {
    const fb = process.env.GEMINI_FALLBACK_API_KEY.trim();
    if (fb && fb !== 'your_gemini_api_key_here' && fb !== 'your_gemini_fallback_key_here') return fb;
  }
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (key && key !== 'your_gemini_api_key_here') return key;
  const fb = (process.env.GEMINI_FALLBACK_API_KEY || '').trim();
  if (fb && fb !== 'your_gemini_api_key_here' && fb !== 'your_gemini_fallback_key_here') return fb;
  return '';
}

/**
 * Returns whether free-only mode is active.
 */
export function isFreeModelsOnly() {
  const val = process.env.FREE_MODELS_ONLY;
  if (val === undefined || val === null || val === '') return false;
  return String(val).toLowerCase() === 'true';
}

/**
 * Checks if a given model ID belongs to direct Google Gemini.
 */
export function isGeminiModel(modelId) {
  if (!modelId || typeof modelId !== 'string') return false;
  const clean = modelId.toLowerCase().replace(/^models\//, '').replace(/^google\//, '');
  return clean.startsWith('gemini-') || clean.startsWith('gemma-');
}

/**
 * Cleans model ID for Gemini API path (removes 'models/' or 'google/' prefix).
 */
export function cleanGeminiModelId(modelId) {
  if (!modelId) return '';
  return modelId.replace(/^models\//i, '').replace(/^google\//i, '').trim();
}

/**
 * Resolves a cleaned Gemini model ID to an active executable endpoint on Google's API.
 */
export function resolveExecutableGeminiModelId(modelId) {
  const cleaned = cleanGeminiModelId(modelId);
  return LEGACY_GEMINI_EXECUTION_MAP[cleaned.toLowerCase()] || cleaned;
}

/**
 * Infers category for a Gemini model.
 */
function inferCategory(modelId, displayName) {
  const text = `${modelId} ${displayName || ''}`.toLowerCase();
  if (text.includes('lite') || text.includes('flash-lite')) return 'fast';
  if (text.includes('3.7') || text.includes('3.8') || text.includes('reasoning') || text.includes('pro')) return 'reasoning';
  if (text.includes('flash') || text.includes('speed')) return 'fast';
  if (text.includes('code') || text.includes('coder')) return 'coding';
  return 'general';
}

/**
 * Infers benchmark capability rating (1.0 to 10.0 scale).
 */
function inferCapability(modelId) {
  const clean = cleanGeminiModelId(modelId).toLowerCase();
  if (clean.includes('2.5-pro') || clean.includes('pro-latest') || clean.includes('3.1-pro')) return 9.6;
  if (clean.includes('3.8-flash')) return 9.5;
  if (clean.includes('3.7-flash')) return 9.4;
  if (clean.includes('2.5-flash') && !clean.includes('lite')) return 9.3;
  if (clean.includes('flash-latest')) return 9.3;
  if (clean.includes('3.6-flash')) return 9.1;
  if (clean.includes('3.5-flash') && !clean.includes('lite')) return 9.0;
  if (clean.includes('3.5-flash-lite') || clean.includes('2.5-flash-lite') || clean.includes('flash-lite-latest')) return 8.6;
  if (clean.includes('3.1-flash-lite')) return 8.4;
  if (clean.includes('gemma-4-31b')) return 8.9;
  if (clean.includes('gemma-4-26b')) return 8.5;
  return 8.8;
}

/**
 * Infers expected p95 latency in ms.
 */
function inferLatency(modelId) {
  const clean = cleanGeminiModelId(modelId).toLowerCase();
  if (clean.includes('flash-lite')) return 130;
  if (clean.includes('2.5-flash') || clean.includes('flash-latest')) return 165;
  if (clean.includes('3.8-flash')) return 180;
  if (clean.includes('3.7-flash')) return 200;
  if (clean.includes('3.6-flash') || clean.includes('3.5-flash')) return 190;
  if (clean.includes('pro')) return 340;
  return 200;
}

/**
 * Infers pricing per million tokens for routing evaluation.
 */
function inferGeminiPricing(modelId) {
  const clean = cleanGeminiModelId(modelId).toLowerCase();
  if (clean.includes('pro')) {
    return { input: 1.25, output: 5.00 };
  }
  if (clean.includes('flash-lite') || clean.includes('gemma')) {
    return { input: 0.0375, output: 0.15 };
  }
  return { input: 0.075, output: 0.30 };
}

/**
 * Normalizes a raw Gemini model into the VORTEXA Model schema.
 */
export function normalizeGeminiModel(raw) {
  const cleanId = cleanGeminiModelId(raw.name);
  const displayName = raw.displayName || cleanId;
  const category = inferCategory(cleanId, displayName);
  const baseLat = inferLatency(cleanId);
  const capability = inferCapability(cleanId);
  const pricing = inferGeminiPricing(cleanId);
  const contextWindow = raw.inputTokenLimit || 1048576;

  const specialties = ['Direct Google API', 'Multimodal Input'];
  if (contextWindow >= 1000000) specialties.push('1M Context');
  else specialties.push(`${Math.round(contextWindow / 1000)}K Context`);
  
  if (cleanId.includes('flash')) specialties.push('Ultra-Low Latency');
  if (cleanId.includes('3.7') || cleanId.includes('3.8') || cleanId.includes('pro')) specialties.push('Hybrid Reasoning');
  specialties.push('Free Tier');

  return {
    id: cleanId,
    name: displayName,
    provider: 'Google',
    category,
    description: raw.description || `${displayName} accessed directly through Google's official Gemini API.`,
    contextWindow,
    inputCostPerMillion: pricing.input,
    outputCostPerMillion: pricing.output,
    baseLatencyP95: baseLat,
    currentLatencyP95: baseLat,
    capabilityRating: capability,
    reliabilityScore: 99.98,
    endpointStatus: 'online',
    specialties: specialties.slice(0, 4),
    isVerified: true
  };
}

/**
 * Discovers and retrieves eligible Google Gemini models directly via Google API.
 */
export async function getGeminiCatalogue(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedGeminiModels && now - lastCacheTime < CACHE_TTL_MS) {
    // Enrich with recent dynamic telemetry
    const enriched = cachedGeminiModels.models.map(m => telemetryTracker.enrichModel(m));
    return { ...cachedGeminiModels, models: enriched };
  }

  const apiKey = getGeminiApiKey();
  const freeOnly = isFreeModelsOnly();

  if (!apiKey) {
    return {
      models: [],
      count: 0,
      freeOnly,
      provider: 'Google',
      lastSync: new Date().toISOString(),
      error: 'GEMINI_API_KEY is not configured'
    };
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      signal: AbortSignal.timeout(12000)
    });

    if (!res.ok) {
      throw new Error(`Google Gemini API responded with status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const rawList = Array.isArray(data.models) ? data.models : [];

    const eligible = rawList.filter((m) => {
      // Must support standard text generation
      if (!m.supportedGenerationMethods?.includes('generateContent')) {
        return false;
      }

      const cleanId = cleanGeminiModelId(m.name).toLowerCase();

      // Exclude non-chat and auxiliary modalities
      for (const pattern of UNSUPPORTED_GEMINI_PATTERNS) {
        if (cleanId.includes(pattern)) return false;
      }

      // Exclude known deprecated models
      if (DEPRECATED_GEMINI_MODELS.has(cleanId)) return false;

      // Free-only tier enforcement:
      // Google Gemini API provides free tier RPM/RPD for Flash models (gemini-*-flash*).
      // Pro models require paid billing and are excluded in free-only mode.
      if (freeOnly) {
        if (PAID_GEMINI_MODELS.has(cleanId) || cleanId.includes('-pro')) {
          return false;
        }
        // Must be a verified free model family (Flash or Gemma)
        const isVerifiedFree = cleanId.includes('flash') || cleanId.includes('gemma');
        if (!isVerifiedFree) return false;
      }

      return true;
    });

    const normalized = eligible.map(normalizeGeminiModel);

    // Enrich with dynamic telemetry
    const enriched = normalized.map(m => telemetryTracker.enrichModel(m));

    // Sort by capability descending
    enriched.sort((a, b) => b.capabilityRating - a.capabilityRating);

    cachedGeminiModels = {
      models: enriched,
      count: enriched.length,
      freeOnly,
      provider: 'Google',
      lastSync: new Date().toISOString()
    };
    lastCacheTime = now;

    return cachedGeminiModels;
  } catch (err) {
    console.warn('[Gemini Service] Error discovering Gemini models:', err.message);
    if (cachedGeminiModels) {
      return cachedGeminiModels;
    }
    return {
      models: [],
      count: 0,
      freeOnly,
      provider: 'Google',
      lastSync: new Date().toISOString(),
      error: err.message
    };
  }
}

/**
 * Formats chat messages into Google Gemini contents and optional systemInstruction.
 */
function formatGeminiMessages(messages, prompt) {
  let chatMessages = messages;
  if (!chatMessages || chatMessages.length === 0) {
    if (prompt) {
      chatMessages = [{ role: 'user', content: prompt }];
    } else {
      return null;
    }
  }

  let systemInstruction = null;
  const contents = [];

  for (const msg of chatMessages) {
    if (msg.role === 'system') {
      systemInstruction = { parts: [{ text: msg.content }] };
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
  }

  return { contents, systemInstruction };
}

/**
 * Executes non-streaming chat completion directly against Google's Gemini API.
 */
export async function executeGeminiChatCompletion(params) {
  const { 
    model, 
    messages, 
    prompt, 
    mode = 'auto', 
    temperature = 0.3, 
    maxTokens = 2048,
    signal
  } = params;
  
  const apiKey = getGeminiApiKey();
  const cleanId = resolveExecutableGeminiModelId(model);
  const startTime = Date.now();

  if (!apiKey) {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in the server environment (.env).',
      code: 'MISSING_GEMINI_KEY',
      statusCode: 401,
      requestedModel: model,
      failedModel: model,
      failoverUsed: false,
      mode
    };
  }

  if (isFreeModelsOnly()) {
    if (PAID_GEMINI_MODELS.has(cleanId) || cleanId.includes('-pro')) {
      return {
        success: false,
        error: `Model "${model}" requires paid Google Cloud billing. In free-only mode (FREE_MODELS_ONLY=true), only zero-cost models are permitted.`,
        code: 'PAID_MODEL_BLOCKED',
        statusCode: 403,
        requestedModel: model,
        failedModel: model,
        failoverUsed: false,
        mode
      };
    }
  }

  const formatted = formatGeminiMessages(messages, prompt);
  if (!formatted) {
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

  const requestBody = {
    contents: formatted.contents,
    generationConfig: {
      temperature: typeof temperature === 'number' ? temperature : 0.3,
      maxOutputTokens: typeof maxTokens === 'number' ? maxTokens : 2048
    }
  };

  if (formatted.systemInstruction) {
    requestBody.systemInstruction = formatted.systemInstruction;
  }

  const fallbackCandidates = [
    cleanId,
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3-flash-preview',
    'gemini-flash-lite-latest'
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  const attemptedModels = [];
  let lastErrorMsg = 'Google Gemini API request failed';
  let lastStatusCode = 500;

  for (let i = 0; i < fallbackCandidates.length; i++) {
    const candidateModel = fallbackCandidates[i];
    attemptedModels.push(candidateModel);

    try {
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent?key=${apiKey}`;
      const timeoutSignal = AbortSignal.timeout(45000);
      const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: combinedSignal
      });

      const latencyMs = Date.now() - startTime;
      const resJson = await res.json().catch(() => ({}));

      if (!res.ok) {
        lastErrorMsg = resJson?.error?.message || `Google Gemini API returned status ${res.status}`;
        lastStatusCode = res.status;
        console.warn(`[Gemini Service] Direct API request to "${candidateModel}" failed (${res.status}): ${lastErrorMsg}`);
        telemetryTracker.recordFailure(candidateModel, res.status, lastErrorMsg);
        if (i < fallbackCandidates.length - 1) {
          continue;
        }
        return {
          success: false,
          error: lastErrorMsg,
          code: res.status === 429 ? 'RATE_LIMIT_EXCEEDED' : (resJson?.error?.status || 'GEMINI_PROVIDER_ERROR'),
          statusCode: res.status,
          latencyMs,
          requestedModel: model,
          failedModel: cleanId,
          failoverUsed: false,
          attemptedModels,
          mode
        };
      }

      const candidate = resJson.candidates?.[0];
      const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
      const nonThoughtText = parts.filter(p => !p.thought && p.text).map(p => p.text).join('');
      const replyContent = nonThoughtText || parts.map(p => p.text || '').join('') || '';
      
      const usage = resJson.usageMetadata ? {
        promptTokens: resJson.usageMetadata.promptTokenCount || 0,
        completionTokens: resJson.usageMetadata.candidatesTokenCount || 0,
        totalTokens: resJson.usageMetadata.totalTokenCount || 0
      } : null;

      telemetryTracker.recordSuccess(candidateModel, latencyMs, latencyMs, usage?.totalTokens || 0);

      return {
        success: true,
        content: replyContent,
        model: candidateModel,
        requestedModel: model,
        provider: 'Google',
        latencyMs,
        usage,
        costUsd: 0.00,
        timestamp: new Date().toISOString(),
        failoverUsed: i > 0,
        failedPrimaryModel: i > 0 ? cleanId : undefined,
        attemptedModels,
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
          failedModel: candidateModel,
          mode
        };
      }

      lastErrorMsg = err.name === 'TimeoutError' ? 'Inference request timed out after 45 seconds.' : err.message;
      lastStatusCode = 504;
      telemetryTracker.recordFailure(candidateModel, 504, err.message);
      if (i < fallbackCandidates.length - 1) {
        continue;
      }
      return {
        success: false,
        error: lastErrorMsg,
        code: err.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
        statusCode: 504,
        latencyMs,
        requestedModel: model,
        failedModel: cleanId,
        failoverUsed: false,
        attemptedModels,
        mode
      };
    }
  }

  return {
    success: false,
    error: lastErrorMsg,
    statusCode: lastStatusCode,
    requestedModel: model,
    failedModel: cleanId,
    attemptedModels,
    mode
  };
}

/**
 * Streams chat completion directly from Google's Gemini API via Server-Sent Events (SSE).
 */
export async function streamGeminiChatCompletion(params) {
  const {
    model,
    messages,
    prompt,
    mode = 'auto',
    temperature = 0.3,
    maxTokens = 2048,
    onChunk,
    signal
  } = params;

  const apiKey = getGeminiApiKey();
  const cleanId = resolveExecutableGeminiModelId(model);
  const startTime = Date.now();
  let firstTokenTime = null;

  if (!apiKey) {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in the server environment (.env).',
      code: 'MISSING_GEMINI_KEY',
      statusCode: 401,
      requestedModel: model,
      failedModel: model,
      failoverUsed: false,
      mode
    };
  }

  if (isFreeModelsOnly()) {
    if (PAID_GEMINI_MODELS.has(cleanId) || cleanId.includes('-pro')) {
      return {
        success: false,
        error: `Model "${model}" requires paid Google Cloud billing. In free-only mode (FREE_MODELS_ONLY=true), only zero-cost models are permitted.`,
        code: 'PAID_MODEL_BLOCKED',
        statusCode: 403,
        requestedModel: model,
        failedModel: model,
        failoverUsed: false,
        mode
      };
    }
  }

  const formatted = formatGeminiMessages(messages, prompt);
  if (!formatted) {
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

  const requestBody = {
    contents: formatted.contents,
    generationConfig: {
      temperature: typeof temperature === 'number' ? temperature : 0.3,
      maxOutputTokens: typeof maxTokens === 'number' ? maxTokens : 2048
    }
  };

  if (formatted.systemInstruction) {
    requestBody.systemInstruction = formatted.systemInstruction;
  }

  const fallbackCandidates = [
    cleanId,
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3-flash-preview',
    'gemini-flash-lite-latest'
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  const attemptedModels = [];
  let lastErrorMsg = 'Google Gemini stream request failed';
  let lastStatusCode = 500;

  for (let i = 0; i < fallbackCandidates.length; i++) {
    const candidateModel = fallbackCandidates[i];
    attemptedModels.push(candidateModel);

    try {
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:streamGenerateContent?key=${apiKey}&alt=sse`;
      const timeoutSignal = AbortSignal.timeout(45000);
      const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: combinedSignal
      });

      if (!res.ok) {
        const latencyMs = Date.now() - startTime;
        const resJson = await res.json().catch(() => ({}));
        lastErrorMsg = resJson?.error?.message || `Google Gemini API returned status ${res.status}`;
        lastStatusCode = res.status;
        console.warn(`[Gemini Stream] Request to "${candidateModel}" failed (${res.status}): ${lastErrorMsg}`);
        telemetryTracker.recordFailure(candidateModel, res.status, lastErrorMsg);
        if (i < fallbackCandidates.length - 1) {
          continue;
        }
        return {
          success: false,
          error: lastErrorMsg,
          code: res.status === 429 ? 'RATE_LIMIT_EXCEEDED' : (resJson?.error?.status || 'GEMINI_PROVIDER_ERROR'),
          statusCode: res.status,
          latencyMs,
          requestedModel: model,
          failedModel: cleanId,
          failoverUsed: false,
          attemptedModels,
          mode
        };
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      let finalUsage = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const parts = Array.isArray(parsed.candidates?.[0]?.content?.parts)
                ? parsed.candidates[0].content.parts
                : [];
              for (const part of parts) {
                if (part?.text && !part?.thought) {
                  if (firstTokenTime === null) {
                    firstTokenTime = Date.now() - startTime;
                  }
                  accumulatedContent += part.text;
                  if (typeof onChunk === 'function') {
                    onChunk(part.text);
                  }
                }
              }

              if (parsed.usageMetadata) {
                finalUsage = {
                  promptTokens: parsed.usageMetadata.promptTokenCount || 0,
                  completionTokens: parsed.usageMetadata.candidatesTokenCount || 0,
                  totalTokens: parsed.usageMetadata.totalTokenCount || 0
                };
              }
            } catch {
              // Partial chunk parse error ignored
            }
          }
        }
      }

      const latencyMs = Date.now() - startTime;
      const ttftMs = firstTokenTime !== null ? firstTokenTime : latencyMs;

      telemetryTracker.recordSuccess(candidateModel, latencyMs, ttftMs, finalUsage?.totalTokens || 0);

      return {
        success: true,
        content: accumulatedContent,
        model: candidateModel,
        requestedModel: model,
        provider: 'Google',
        ttftMs,
        latencyMs,
        usage: finalUsage,
        costUsd: 0.00,
        timestamp: new Date().toISOString(),
        failoverUsed: i > 0,
        failedPrimaryModel: i > 0 ? cleanId : undefined,
        attemptedModels,
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
          failedModel: candidateModel,
          mode
        };
      }

      lastErrorMsg = err.name === 'TimeoutError' ? 'Inference request timed out after 45 seconds.' : err.message;
      lastStatusCode = 504;
      telemetryTracker.recordFailure(candidateModel, 504, err.message);
      if (i < fallbackCandidates.length - 1) {
        continue;
      }
      return {
        success: false,
        error: lastErrorMsg,
        code: err.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
        statusCode: 504,
        latencyMs,
        requestedModel: model,
        failedModel: cleanId,
        failoverUsed: false,
        attemptedModels,
        mode
      };
    }
  }

  return {
    success: false,
    error: lastErrorMsg,
    statusCode: lastStatusCode,
    requestedModel: model,
    failedModel: cleanId,
    attemptedModels,
    mode
  };
}
