import express from 'express';
import { db } from '../database/db.ts';
import { authenticateSession, type AuthRequest } from '../middleware/auth.ts';
import { validateProfileUpdate } from '../middleware/validate.ts';

const router = express.Router();

// GET /api/profile - Fetch full user profile, wallet, and execution metrics
router.get('/', authenticateSession, (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const user = db.prepare(`
    SELECT id, name, email, phone, role, status, created_at, last_login, last_activity
    FROM users WHERE id = ?
  `).get(userId) as any;

  const profile = db.prepare(`
    SELECT display_name, avatar_url, bio, phone, preferred_theme, preferred_language, updated_at
    FROM user_profiles WHERE user_id = ?
  `).get(userId) as any;

  const wallet = db.prepare(`
    SELECT available_trial_credits, used_credits, reserved_credits, updated_at
    FROM user_token_wallets WHERE user_id = ?
  `).get(userId) as any;

  // Aggregate metrics
  const stats = db.prepare(`
    SELECT 
      count(*) as totalExecutions,
      coalesce(sum(case when status = 'success' then 1 else 0 end), 0) as successfulExecutions,
      coalesce(sum(case when cache_hit = 1 then 1 else 0 end), 0) as cacheHits,
      coalesce(sum(cost_estimate), 0.0) as totalCostEstimate,
      coalesce(sum(input_tokens), 0) as totalInputTokens,
      coalesce(sum(output_tokens), 0) as totalOutputTokens
    FROM model_execution_history
    WHERE user_id = ?
  `).get(userId) as any;

  return res.json({
    user,
    profile: profile || {},
    wallet: wallet || { available_trial_credits: 0, used_credits: 0, reserved_credits: 0 },
    stats
  });
});

// PATCH /api/profile - Update personal profile preferences
router.patch('/', authenticateSession, validateProfileUpdate, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { displayName, bio, phone, preferredTheme, preferredLanguage } = req.body;

  const currentProfile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId) as any;

  const newDisplayName = displayName !== undefined ? displayName.trim() : (currentProfile?.display_name || req.user!.name);
  const newBio = bio !== undefined ? bio.trim() : currentProfile?.bio;
  const newPhone = phone !== undefined ? phone.trim() : currentProfile?.phone;
  const newTheme = preferredTheme !== undefined ? preferredTheme : (currentProfile?.preferred_theme || 'dark');
  const newLang = preferredLanguage !== undefined ? preferredLanguage : (currentProfile?.preferred_language || 'en');

  db.prepare(`
    UPDATE user_profiles
    SET display_name = ?, bio = ?, phone = ?, preferred_theme = ?, preferred_language = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(newDisplayName, newBio, newPhone, newTheme, newLang, userId);

  if (newPhone !== undefined) {
    db.prepare('UPDATE users SET phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newPhone, userId);
  }

  const updated = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);

  return res.json({
    message: 'Profile updated successfully.',
    profile: updated
  });
});

export default router;
