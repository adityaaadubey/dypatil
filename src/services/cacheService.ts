import type { CacheEntry, CacheAnalyticsStats } from '../types/modelExplorer';

const CACHE_STORAGE_KEY = 'modelrouter_response_cache_v2';
const ANALYTICS_STORAGE_KEY = 'modelrouter_cache_analytics_v2';

// Default TTL: 24 hours in milliseconds
export const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Deterministic fast string hash fallback and SHA-256 generator.
 */
export async function generateDeterministicCacheKey(payload: {
  modelId: string;
  provider: string;
  promptText: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<string> {
  // Normalize canonical representation
  const canonicalObj = {
    m: payload.modelId.trim().toLowerCase(),
    p: payload.provider.trim().toLowerCase(),
    pr: payload.promptText.trim(),
    s: (payload.systemInstruction || '').trim(),
    t: Number((payload.temperature ?? 0.7).toFixed(2)),
    tok: payload.maxOutputTokens ?? 1024
  };

  const canonicalString = JSON.stringify(canonicalObj);

  // Web Crypto SHA-256
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(canonicalString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return `cache_${payload.modelId.replace(/[^a-zA-Z0-9]/g, '_')}_${hashHex.slice(0, 32)}`;
    } catch {
      // Fallback
    }
  }

  // FNV-1a / Murmur-style fast deterministic string hash fallback
  let hash = 2166136261;
  for (let i = 0; i < canonicalString.length; i++) {
    hash ^= canonicalString.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `cache_${payload.modelId.replace(/[^a-zA-Z0-9]/g, '_')}_${(hash >>> 0).toString(16)}`;
}

/**
 * Load cache entries from storage.
 */
export function getStoredCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Save cache entries to storage.
 */
function saveCache(entries: Record<string, CacheEntry>): void {
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to save response cache:', err);
  }
}

/**
 * Load or initialize cache analytics.
 */
export function getCacheAnalytics(): CacheAnalyticsStats {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Fallthrough
  }

  const cache = getStoredCache();
  return {
    totalEntries: Object.keys(cache).length,
    totalHits: 0,
    totalMisses: 0,
    hitRatePercentage: 0,
    estimatedCallsAvoided: 0,
    estimatedTokensAvoided: 0,
    estimatedCostAvoidedUSD: 0,
    lastInvalidationTimestamp: null
  };
}

function saveCacheAnalytics(stats: CacheAnalyticsStats): void {
  try {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save cache analytics:', err);
  }
}

/**
 * Lookup cached response by payload.
 */
export async function lookupCache(
  payload: {
    modelId: string;
    provider: string;
    promptText: string;
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
  },
  bypassCache: boolean = false
): Promise<{ isHit: boolean; entry?: CacheEntry }> {
  const analytics = getCacheAnalytics();

  if (bypassCache) {
    analytics.totalMisses += 1;
    analytics.hitRatePercentage = Number(
      ((analytics.totalHits / (analytics.totalHits + analytics.totalMisses)) * 100).toFixed(1)
    );
    saveCacheAnalytics(analytics);
    return { isHit: false };
  }

  const cacheKey = await generateDeterministicCacheKey(payload);
  const cache = getStoredCache();
  const entry = cache[cacheKey];

  if (!entry) {
    analytics.totalMisses += 1;
    analytics.hitRatePercentage = Number(
      ((analytics.totalHits / (analytics.totalHits + analytics.totalMisses)) * 100).toFixed(1)
    );
    saveCacheAnalytics(analytics);
    return { isHit: false };
  }

  // Check TTL expiration
  const now = new Date().getTime();
  const expiry = new Date(entry.expiresAt).getTime();
  if (now > expiry) {
    // Evict expired entry
    delete cache[cacheKey];
    saveCache(cache);
    analytics.totalMisses += 1;
    saveCacheAnalytics(analytics);
    return { isHit: false };
  }

  // Cache hit! Update hit counts and metrics
  entry.hitCount += 1;
  cache[cacheKey] = entry;
  saveCache(cache);

  analytics.totalHits += 1;
  analytics.estimatedCallsAvoided += 1;
  analytics.estimatedTokensAvoided += entry.response.totalTokens;
  analytics.estimatedCostAvoidedUSD = Number(
    (analytics.estimatedCostAvoidedUSD + entry.response.estimatedCostUSD).toFixed(5)
  );
  analytics.hitRatePercentage = Number(
    ((analytics.totalHits / (analytics.totalHits + analytics.totalMisses)) * 100).toFixed(1)
  );
  analytics.totalEntries = Object.keys(cache).length;
  saveCacheAnalytics(analytics);

  return { isHit: true, entry };
}

/**
 * Store a new generated response in cache.
 */
export async function storeInCache(
  payload: {
    modelId: string;
    provider: string;
    promptText: string;
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
  },
  response: {
    text: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    estimatedCostUSD: number;
    finishReason: string;
    modelReturnedId: string;
  },
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): Promise<CacheEntry> {
  const cacheKey = await generateDeterministicCacheKey(payload);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs).toISOString();

  const entry: CacheEntry = {
    cacheKey,
    timestamp: now.toISOString(),
    expiresAt,
    request: {
      modelId: payload.modelId,
      provider: payload.provider,
      promptText: payload.promptText,
      systemInstruction: payload.systemInstruction,
      temperature: payload.temperature ?? 0.7,
      maxOutputTokens: payload.maxOutputTokens ?? 1024
    },
    response: {
      ...response,
      totalTokens: response.inputTokens + response.outputTokens
    },
    hitCount: 0
  };

  const cache = getStoredCache();
  cache[cacheKey] = entry;
  saveCache(cache);

  const analytics = getCacheAnalytics();
  analytics.totalEntries = Object.keys(cache).length;
  saveCacheAnalytics(analytics);

  return entry;
}

/**
 * Manually clear the entire cache or invalidate expired entries.
 */
export function clearResponseCache(): void {
  localStorage.removeItem(CACHE_STORAGE_KEY);
  const analytics = getCacheAnalytics();
  analytics.totalEntries = 0;
  analytics.lastInvalidationTimestamp = new Date().toISOString();
  saveCacheAnalytics(analytics);
}
