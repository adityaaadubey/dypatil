import type { Model, ChatMessage, InferenceResult } from '../types';
import { INITIAL_MODELS } from '../data/models';

export interface CatalogueResponse {
  models: Model[];
  count: number;
  freeOnly: boolean;
  lastSync: string;
}

export interface HealthResponse {
  status: string;
  freeModelsOnly: boolean;
  hasApiKey: boolean;
  timestamp: string;
}

/**
 * Checks server health and configuration status.
 */
export async function checkServerHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetches dynamic models from the server-side catalogue.
 * Falls back to INITIAL_MODELS if server is unreachable or errors.
 */
export async function fetchLiveCatalogue(refresh = false): Promise<Model[]> {
  try {
    const url = refresh ? '/api/models?refresh=true' : '/api/models';
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[InferenceService] Catalogue API responded with status ${res.status}, using static fallback`);
      return INITIAL_MODELS;
    }
    const data: CatalogueResponse = await res.json();
    if (Array.isArray(data.models) && data.models.length > 0) {
      return data.models;
    }
    return INITIAL_MODELS;
  } catch (err) {
    console.warn('[InferenceService] Could not reach server catalogue:', err);
    return INITIAL_MODELS;
  }
}

/**
 * Sends a real inference request through the secure server-side OpenRouter endpoint.
 */
export async function executeInference(params: {
  model: string;
  messages: ChatMessage[];
  prompt?: string;
  failoverModels?: string[];
  mode?: 'auto' | 'manual';
}): Promise<InferenceResult> {
  const startTime = Date.now();

  try {
    const res = await fetch('/api/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    let data: any = {};
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (!res.ok || !data.success) {
      const errorMsg = data.error || (res.status ? `HTTP ${res.status} inference error` : 'Inference request failed');
      return {
        content: '',
        model: params.model,
        requestedModel: data.requestedModel || params.model,
        failedModel: data.failedModel || params.model,
        latencyMs: data.latencyMs || (Date.now() - startTime),
        costUsd: 0,
        timestamp: new Date().toISOString(),
        error: errorMsg,
        failoverUsed: Boolean(data.failoverUsed),
        attemptedModels: data.attemptedModels || [params.model],
        mode: params.mode
      };
    }

    return {
      content: data.content,
      model: data.model || params.model,
      requestedModel: data.requestedModel || params.model,
      failedPrimaryModel: data.failedPrimaryModel,
      usage: data.usage,
      latencyMs: data.latencyMs || (Date.now() - startTime),
      ttftMs: data.ttftMs,
      costUsd: data.costUsd || 0,
      timestamp: data.timestamp || new Date().toISOString(),
      failoverUsed: Boolean(data.failoverUsed),
      attemptedModels: data.attemptedModels || [params.model],
      mode: data.mode || params.mode
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: '',
      model: params.model,
      latencyMs: Date.now() - startTime,
      costUsd: 0,
      timestamp: new Date().toISOString(),
      error: `Connection error: ${message}. Make sure the backend server is running.`,
      attemptedModels: [params.model]
    };
  }
}

/**
 * Executes a streaming inference request via Server-Sent Events (SSE).
 * Calls onChunk(chunk) as tokens arrive and returns the final InferenceResult.
 */
export async function executeStreamingInference(params: {
  model: string;
  messages: ChatMessage[];
  prompt?: string;
  failoverModels?: string[];
  mode?: 'auto' | 'manual';
  temperature?: number;
  maxTokens?: number;
  onChunk: (delta: string) => void;
  signal?: AbortSignal;
}): Promise<InferenceResult> {
  const startTime = Date.now();
  let firstTokenTime: number | null = null;
  let accumulatedContent = '';

  try {
    const res = await fetch('/api/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({ ...params, stream: true }),
      signal: params.signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      let errorMsg = `HTTP ${res.status} streaming error`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error) errorMsg = errJson.error;
      } catch {}

      return {
        content: '',
        model: params.model,
        requestedModel: params.model,
        failedModel: params.model,
        latencyMs: Date.now() - startTime,
        costUsd: 0,
        timestamp: new Date().toISOString(),
        error: errorMsg,
        mode: params.mode
      };
    }

    if (!res.body) {
      throw new Error('ReadableStream not supported on response body');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalResult: InferenceResult | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') continue;

        try {
          const event = JSON.parse(payload);
          if (event.type === 'chunk' && event.delta) {
            if (firstTokenTime === null) {
              firstTokenTime = Date.now() - startTime;
            }
            accumulatedContent += event.delta;
            params.onChunk(event.delta);
          } else if (event.type === 'done' && event.result) {
            finalResult = {
              content: event.result.content || accumulatedContent,
              model: event.result.model || params.model,
              requestedModel: event.result.requestedModel || params.model,
              failedPrimaryModel: event.result.failedPrimaryModel,
              usage: event.result.usage,
              latencyMs: event.result.latencyMs || (Date.now() - startTime),
              ttftMs: event.result.ttftMs || (firstTokenTime !== null ? firstTokenTime : undefined),
              costUsd: event.result.costUsd || 0,
              timestamp: event.result.timestamp || new Date().toISOString(),
              failoverUsed: Boolean(event.result.failoverUsed),
              attemptedModels: event.result.attemptedModels || [params.model],
              mode: event.result.mode || params.mode
            };
          } else if (event.type === 'error') {
            return {
              content: accumulatedContent,
              model: event.result?.model || params.model,
              requestedModel: event.result?.requestedModel || params.model,
              failedModel: event.result?.failedModel || params.model,
              latencyMs: Date.now() - startTime,
              ttftMs: firstTokenTime !== null ? firstTokenTime : undefined,
              costUsd: 0,
              timestamp: new Date().toISOString(),
              error: event.error || event.result?.error || 'Streaming error occurred',
              mode: params.mode
            };
          }
        } catch {
          // Ignore json parse error for malformed SSE frames
        }
      }
    }

    if (finalResult) {
      return finalResult;
    }

    return {
      content: accumulatedContent,
      model: params.model,
      requestedModel: params.model,
      latencyMs: Date.now() - startTime,
      ttftMs: firstTokenTime !== null ? firstTokenTime : undefined,
      costUsd: 0,
      timestamp: new Date().toISOString(),
      mode: params.mode
    };
  } catch (err: unknown) {
    if (params.signal?.aborted) {
      return {
        content: accumulatedContent,
        model: params.model,
        requestedModel: params.model,
        latencyMs: Date.now() - startTime,
        ttftMs: firstTokenTime !== null ? firstTokenTime : undefined,
        costUsd: 0,
        timestamp: new Date().toISOString(),
        error: 'Generation cancelled by user.',
        mode: params.mode
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: accumulatedContent,
      model: params.model,
      requestedModel: params.model,
      latencyMs: Date.now() - startTime,
      ttftMs: firstTokenTime !== null ? firstTokenTime : undefined,
      costUsd: 0,
      timestamp: new Date().toISOString(),
      error: `Connection error: ${message}`,
      mode: params.mode
    };
  }
}
