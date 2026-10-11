/**
 * In-memory telemetry and latency tracker for VORTEXA 3.0.
 * Tracks recent observed latencies, TTFT, and reliability per model and provider.
 */

class TelemetryTracker {
  constructor() {
    this.modelStats = new Map();
  }

  /**
   * Records a successful completion or stream.
   */
  recordSuccess(modelId, latencyMs, ttftMs = null, tokenCount = null) {
    if (!modelId) return;
    const cleanId = String(modelId).toLowerCase();
    const stats = this.getOrCreateStats(cleanId);

    stats.successCount++;
    stats.lastLatencyMs = latencyMs;
    stats.lastTtftMs = ttftMs;
    stats.lastSeen = Date.now();

    // Moving average latency (alpha = 0.3)
    if (stats.avgLatencyMs === null) {
      stats.avgLatencyMs = latencyMs;
    } else {
      stats.avgLatencyMs = Math.round(stats.avgLatencyMs * 0.7 + latencyMs * 0.3);
    }

    // Moving average TTFT
    if (ttftMs !== null) {
      if (stats.avgTtftMs === null) {
        stats.avgTtftMs = ttftMs;
      } else {
        stats.avgTtftMs = Math.round(stats.avgTtftMs * 0.7 + ttftMs * 0.3);
      }
    }

    if (tokenCount) {
      stats.totalTokens += tokenCount;
    }

    // Reset temporary failure streak on success
    stats.consecutiveFailures = 0;
  }

  /**
   * Records an error or rate limit.
   */
  recordFailure(modelId, statusCode, errorMsg = '') {
    if (!modelId) return;
    const cleanId = String(modelId).toLowerCase();
    const stats = this.getOrCreateStats(cleanId);

    stats.failureCount++;
    stats.consecutiveFailures++;
    stats.lastFailureTime = Date.now();
    stats.lastError = errorMsg;

    if (statusCode === 429) {
      stats.rateLimitCount++;
      stats.lastRateLimitTime = Date.now();
    }
  }

  /**
   * Retrieves statistics for a specific model.
   */
  getStats(modelId) {
    if (!modelId) return null;
    return this.modelStats.get(String(modelId).toLowerCase()) || null;
  }

  /**
   * Enriches a model object with dynamic latency and health metrics.
   */
  enrichModel(model) {
    if (!model || !model.id) return model;
    const stats = this.getStats(model.id);
    if (!stats) return model;

    const enriched = { ...model };

    // If we have measured latency, update currentLatencyP95
    if (stats.avgLatencyMs !== null && stats.successCount >= 1) {
      // Use observed latency if higher or reliably measured
      enriched.currentLatencyP95 = stats.avgLatencyMs;
    }

    // If model recently rate limited in the last 60 seconds, mark degraded
    const now = Date.now();
    if (stats.lastRateLimitTime && now - stats.lastRateLimitTime < 60_000) {
      enriched.endpointStatus = 'degraded';
      // Apply latency penalty in routing
      enriched.currentLatencyP95 = Math.max(enriched.currentLatencyP95, 2500);
    } else if (stats.consecutiveFailures >= 3 && now - stats.lastFailureTime < 30_000) {
      enriched.endpointStatus = 'down';
    }

    return enriched;
  }

  getOrCreateStats(cleanId) {
    let stats = this.modelStats.get(cleanId);
    if (!stats) {
      stats = {
        modelId: cleanId,
        successCount: 0,
        failureCount: 0,
        consecutiveFailures: 0,
        rateLimitCount: 0,
        lastLatencyMs: null,
        avgLatencyMs: null,
        lastTtftMs: null,
        avgTtftMs: null,
        totalTokens: 0,
        lastSeen: null,
        lastFailureTime: null,
        lastRateLimitTime: null,
        lastError: null
      };
      this.modelStats.set(cleanId, stats);
    }
    return stats;
  }

  getAllStats() {
    const obj = {};
    for (const [k, v] of this.modelStats.entries()) {
      obj[k] = { ...v };
    }
    return obj;
  }

  getSummaryStats() {
    let totalSuccess = 0;
    let totalFailures = 0;
    let totalTokens = 0;
    let sumLatency = 0;
    let latencyCount = 0;
    let sumTtft = 0;
    let ttftCount = 0;

    for (const stats of this.modelStats.values()) {
      totalSuccess += stats.successCount;
      totalFailures += stats.failureCount;
      totalTokens += stats.totalTokens;
      if (stats.avgLatencyMs !== null) {
        sumLatency += stats.avgLatencyMs;
        latencyCount++;
      }
      if (stats.avgTtftMs !== null) {
        sumTtft += stats.avgTtftMs;
        ttftCount++;
      }
    }

    return {
      totalSuccess,
      totalFailures,
      totalTokens,
      avgLatencyMs: latencyCount > 0 ? Math.round(sumLatency / latencyCount) : null,
      avgTtftMs: ttftCount > 0 ? Math.round(sumTtft / ttftCount) : null
    };
  }
}

export const telemetryTracker = new TelemetryTracker();
