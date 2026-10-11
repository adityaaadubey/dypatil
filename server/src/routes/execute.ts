import express from 'express';
import crypto from 'crypto';
import { db, runTransaction } from '../database/db.ts';
import { authenticateSession, type AuthRequest } from '../middleware/auth.ts';
import { executeGeminiPrompt } from '../providers/geminiProvider.ts';

const router = express.Router();

// Helper to compute deterministic SHA-256 cache key
function computeCacheKey(userId: string, modelId: string, prompt: string): string {
  return crypto.createHash('sha256').update(`${userId}:${modelId}:${prompt.trim()}`).digest('hex');
}

// Platform credit charge conversion: 1 credit per 100 tokens, min 5 credits
function calculateCreditCharge(totalTokens: number): number {
  return Math.max(5, Math.ceil(totalTokens / 100));
}

// POST /api/execute - Run live model prompt
router.post('/', authenticateSession, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { modelId, prompt, maxOutputTokens } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  const targetModel = modelId || 'gemini-flash-latest';
  const trimmedPrompt = prompt.trim();
  const requestId = 'req_' + crypto.randomBytes(8).toString('hex');
  const cacheKey = computeCacheKey(userId, targetModel, trimmedPrompt);

  try {
    // 1. Check Cryptographic Prompt Cache (User isolated)
    const cached = db.prepare(`
      SELECT id, response_text, token_count, hit_count
      FROM prompt_cache
      WHERE cache_key = ?
    `).get(cacheKey) as any;

    if (cached) {
      // Update cache hit count
      db.prepare('UPDATE prompt_cache SET hit_count = hit_count + 1 WHERE id = ?').run(cached.id);

      // Record zero-token execution history for cache hit
      const execId = 'exec_' + crypto.randomBytes(8).toString('hex');
      db.prepare(`
        INSERT INTO model_execution_history (
          id, user_id, request_id, model_id, provider, prompt, response_text,
          input_tokens, output_tokens, cost_estimate, latency_ms, status, cache_hit
        ) VALUES (?, ?, ?, ?, 'Google Gemini (Cached)', ?, ?, 0, 0, 0.0, 5, 'success', 1)
      `).run(execId, userId, requestId, targetModel, trimmedPrompt, cached.response_text);

      const wallet = db.prepare('SELECT available_trial_credits FROM user_token_wallets WHERE user_id = ?').get(userId) as any;

      return res.json({
        requestId,
        model: targetModel,
        provider: 'Google Gemini (Cryptographic Cache Hit)',
        text: cached.response_text,
        tokens: {
          promptTokens: 0,
          candidateTokens: 0,
          totalTokens: cached.token_count || 0
        },
        latencyMs: 5,
        costEstimateUsd: 0.0,
        creditsDeducted: 0,
        remainingCredits: wallet?.available_trial_credits || 0,
        cacheHit: true
      });
    }

    // 2. Validate User Wallet Credits
    const wallet = db.prepare(`
      SELECT available_trial_credits, used_credits FROM user_token_wallets WHERE user_id = ?
    `).get(userId) as any;

    const availableCredits = wallet?.available_trial_credits || 0;
    const minRequiredCredits = 5;

    if (availableCredits < minRequiredCredits) {
      return res.status(402).json({
        error: `Insufficient platform trial credits. You have ${availableCredits} credits remaining. Minimum required: ${minRequiredCredits}.`
      });
    }

    // 3. Execute Real Provider Inference via Google Gemini API
    const result = await executeGeminiPrompt(targetModel, trimmedPrompt, maxOutputTokens);

    // 4. Calculate Credit Charge & Update Wallet + Ledger Atomically
    const creditCharge = calculateCreditCharge(result.totalTokens);
    const execId = 'exec_' + crypto.randomBytes(8).toString('hex');
    const ledgerTxId = 'tx_' + crypto.randomBytes(8).toString('hex');

    runTransaction(() => {
      // Deduct from wallet
      db.prepare(`
        UPDATE user_token_wallets
        SET available_trial_credits = max(0, available_trial_credits - ?),
            used_credits = used_credits + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(creditCharge, creditCharge, userId);

      // Record immutable ledger transaction
      db.prepare(`
        INSERT INTO token_usage_ledger (
          id, user_id, request_id, model_id, provider_route,
          input_token_count, output_token_count, platform_credit_charge,
          provider_cost_estimate, provider_reported_cost, tx_type, status, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EXECUTION', 'completed', ?)
      `).run(
        ledgerTxId,
        userId,
        requestId,
        result.model,
        'google/gemini/v1beta',
        result.promptTokens,
        result.candidateTokens,
        creditCharge,
        result.costEstimateUsd,
        result.providerReportedCost || result.costEstimateUsd,
        JSON.stringify({
          latencyMs: result.latencyMs,
          totalTokens: result.totalTokens,
          model: result.model
        })
      );

      // Record Execution History
      db.prepare(`
        INSERT INTO model_execution_history (
          id, user_id, request_id, model_id, provider, prompt, response_text,
          input_tokens, output_tokens, cost_estimate, latency_ms, status, cache_hit
        ) VALUES (?, ?, ?, ?, 'Google Gemini', ?, ?, ?, ?, ?, ?, 'success', 0)
      `).run(
        execId,
        userId,
        requestId,
        result.model,
        trimmedPrompt,
        result.text,
        result.promptTokens,
        result.candidateTokens,
        result.costEstimateUsd,
        result.latencyMs
      );

      // Save into cryptographic cache
      db.prepare(`
        INSERT OR REPLACE INTO prompt_cache (
          id, cache_key, user_id, model_id, provider, request_fingerprint,
          response_text, token_count, expires_at, hit_count
        ) VALUES (?, ?, ?, ?, 'Google Gemini', ?, ?, ?, datetime('now', '+7 days'), 0)
      `).run(
        'cch_' + crypto.randomBytes(8).toString('hex'),
        cacheKey,
        userId,
        result.model,
        targetModel,
        result.text,
        result.totalTokens
      );
    });

    const updatedWallet = db.prepare('SELECT available_trial_credits FROM user_token_wallets WHERE user_id = ?').get(userId) as any;

    return res.json({
      requestId,
      model: result.model,
      provider: 'Google Gemini (Live API)',
      text: result.text,
      tokens: {
        promptTokens: result.promptTokens,
        candidateTokens: result.candidateTokens,
        totalTokens: result.totalTokens
      },
      latencyMs: result.latencyMs,
      costEstimateUsd: result.costEstimateUsd,
      creditsDeducted: creditCharge,
      remainingCredits: updatedWallet?.available_trial_credits || 0,
      cacheHit: false
    });
  } catch (err: any) {
    console.error('Execution failure:', err);

    // Record failed execution record
    const execId = 'exec_' + crypto.randomBytes(8).toString('hex');
    db.prepare(`
      INSERT INTO model_execution_history (
        id, user_id, request_id, model_id, provider, prompt, response_text,
        input_tokens, output_tokens, cost_estimate, latency_ms, status, error_message, cache_hit
      ) VALUES (?, ?, ?, ?, 'Google Gemini', ?, '', 0, 0, 0.0, ?, 'failed', ?, 0)
    `).run(
      execId,
      userId,
      requestId,
      targetModel,
      trimmedPrompt,
      err.latencyMs || 0,
      err.message || 'Execution error'
    );

    return res.status(500).json({
      error: err.message || 'Model execution failed. Please try again.',
      model: targetModel,
      latencyMs: err.latencyMs || 0
    });
  }
});

export default router;
