import express from 'express';
import { db } from '../database/db.ts';
import { authenticateSession, type AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// GET /api/profile/wallet - Token wallet balances
router.get('/wallet', authenticateSession, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const wallet = db.prepare('SELECT * FROM user_token_wallets WHERE user_id = ?').get(userId) as any;

  return res.json({
    availableTrialCredits: wallet?.available_trial_credits || 0,
    usedCredits: wallet?.used_credits || 0,
    reservedCredits: wallet?.reserved_credits || 0,
    updatedAt: wallet?.updated_at
  });
});

// GET /api/profile/usage - Usage charts data (usage over time, per-model consumption, input vs output)
router.get('/usage', authenticateSession, (req: AuthRequest, res) => {
  const userId = req.user!.id;

  // 1. Consumption per model
  const modelBreakdown = db.prepare(`
    SELECT model_id as model,
           count(*) as requests,
           sum(input_tokens) as inputTokens,
           sum(output_tokens) as outputTokens,
           sum(cost_estimate) as costEstimate
    FROM model_execution_history
    WHERE user_id = ?
    GROUP BY model_id
    ORDER BY requests DESC
  `).all(userId);

  // 2. Daily usage over time
  const dailyHistory = db.prepare(`
    SELECT date(created_at) as date,
           count(*) as count,
           sum(input_tokens) as inputTokens,
           sum(output_tokens) as outputTokens,
           sum(cost_estimate) as costEstimate
    FROM model_execution_history
    WHERE user_id = ?
    GROUP BY date(created_at)
    ORDER BY date ASC
    LIMIT 30
  `).all(userId);

  // 3. Platform credit ledger events
  const recentLedger = db.prepare(`
    SELECT id, request_id, model_id, tx_type, platform_credit_charge, status, created_at
    FROM token_usage_ledger
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(userId);

  return res.json({
    modelBreakdown,
    dailyHistory,
    recentLedger
  });
});

// GET /api/profile/history - Searchable paginated execution history
router.get('/history', authenticateSession, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const search = req.query.search ? String(req.query.search) : '';
  const limit = Math.min(parseInt(String(req.query.limit || 50), 10), 100);

  let query = 'SELECT * FROM model_execution_history WHERE user_id = ?';
  const params: any[] = [userId];

  if (search) {
    query += ' AND (prompt LIKE ? OR model_id LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const history = db.prepare(query).all(...params);
  return res.json({ history });
});

// DELETE /api/profile/history/:id - User can delete personal history records
router.delete('/history/:id', authenticateSession, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const historyId = req.params.id;

  const result = db.prepare(`
    DELETE FROM model_execution_history
    WHERE id = ? AND user_id = ?
  `).run(historyId, userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'History record not found or unauthorized.' });
  }

  return res.json({ message: 'History record deleted successfully.' });
});

// GET /api/usage/summary - High-level summary
router.get('/summary', authenticateSession, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const wallet = db.prepare('SELECT * FROM user_token_wallets WHERE user_id = ?').get(userId) as any;
  const execs = db.prepare(`
    SELECT count(*) as total,
           coalesce(sum(case when status = 'success' then 1 else 0 end), 0) as success,
           coalesce(sum(case when cache_hit = 1 then 1 else 0 end), 0) as cacheHits,
           coalesce(sum(cost_estimate), 0.0) as costUsd
    FROM model_execution_history
    WHERE user_id = ?
  `).get(userId) as any;

  return res.json({
    availableCredits: wallet?.available_trial_credits || 0,
    usedCredits: wallet?.used_credits || 0,
    totalExecutions: execs?.total || 0,
    successfulExecutions: execs?.success || 0,
    cacheHits: execs?.cacheHits || 0,
    totalCostUsd: Number((execs?.costUsd || 0).toFixed(6))
  });
});

export default router;
