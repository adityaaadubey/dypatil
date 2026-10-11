import express from 'express';
import { db } from '../database/db.ts';
import { authenticateSession, requireAdmin, type AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// GET /api/admin/analytics - Platform wide aggregate metrics backed by SQL
router.get('/analytics', authenticateSession, requireAdmin, (_req: AuthRequest, res) => {
  try {
    const totalUsers = db.prepare('SELECT count(*) as count FROM users').get() as any;
    const activeUsers = db.prepare("SELECT count(*) as count FROM users WHERE status = 'active'").get() as any;
    const recentSignups = db.prepare("SELECT count(*) as count FROM users WHERE created_at >= datetime('now', '-7 days')").get() as any;

    const execStats = db.prepare(`
      SELECT 
        count(*) as total,
        coalesce(sum(case when status = 'success' then 1 else 0 end), 0) as success,
        coalesce(sum(case when status = 'failed' then 1 else 0 end), 0) as failed,
        coalesce(sum(case when cache_hit = 1 then 1 else 0 end), 0) as cacheHits,
        coalesce(sum(input_tokens), 0) as totalInputTokens,
        coalesce(sum(output_tokens), 0) as totalOutputTokens,
        coalesce(sum(cost_estimate), 0.0) as totalCostUsd
      FROM model_execution_history
    `).get() as any;

    const creditStats = db.prepare(`
      SELECT 
        coalesce(sum(available_trial_credits), 0) as totalAvailable,
        coalesce(sum(used_credits), 0) as totalConsumed
      FROM user_token_wallets
    `).get() as any;

    const pendingOrders = db.prepare("SELECT count(*) as count FROM pricing_packages_orders WHERE status = 'pending'").get() as any;
    const cacheCount = db.prepare('SELECT count(*) as count FROM prompt_cache').get() as any;

    return res.json({
      users: {
        total: totalUsers.count,
        active: activeUsers.count,
        newThisWeek: recentSignups.count
      },
      executions: {
        total: execStats.total,
        success: execStats.success,
        failed: execStats.failed,
        cacheHits: execStats.cacheHits,
        totalInputTokens: execStats.totalInputTokens,
        totalOutputTokens: execStats.totalOutputTokens,
        totalCostUsd: Number(execStats.totalCostUsd.toFixed(4))
      },
      credits: {
        totalAvailable: creditStats.totalAvailable,
        totalConsumed: creditStats.totalConsumed
      },
      pendingOrders: pendingOrders.count,
      cacheEntries: cacheCount.count
    });
  } catch (err: any) {
    console.error('Admin analytics error:', err);
    return res.status(500).json({ error: 'Failed to query analytics.' });
  }
});

// GET /api/admin/users - User directory
router.get('/users', authenticateSession, requireAdmin, (_req: AuthRequest, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.created_at, u.last_login,
             w.available_trial_credits, w.used_credits
      FROM users u
      LEFT JOIN user_token_wallets w ON u.id = w.user_id
      ORDER BY u.created_at DESC
      LIMIT 100
    `).all();

    return res.json({ users });
  } catch (_err: any) {
    return res.status(500).json({ error: 'Failed to list users.' });
  }
});

// PATCH /api/admin/users/:id/status - Suspend or activate user
router.patch('/users/:id/status', authenticateSession, requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'active' && status !== 'suspended') {
    return res.status(400).json({ error: 'Status must be active or suspended.' });
  }

  // Prevent admin self-suspension lockout
  if (req.user!.id === id && status === 'suspended') {
    return res.status(400).json({ error: 'Security constraint: Cannot suspend your own administrative account.' });
  }

  const targetUser = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id) as any;
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

  return res.json({ 
    message: `User status updated to ${status}.`,
    user: { id, status }
  });
});

export default router;
