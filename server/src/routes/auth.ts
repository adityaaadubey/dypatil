import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, runTransaction } from '../database/db.ts';
import { authRateLimiter } from '../middleware/rateLimit.ts';
import { authenticateSession, type AuthRequest } from '../middleware/auth.ts';
import { validateSignup, validateLogin } from '../middleware/validate.ts';

const router = express.Router();

const INITIAL_TRIAL_CREDITS = parseInt(process.env.INITIAL_TRIAL_CREDITS || '10000', 10);
const SESSION_EXPIRATION_DAYS = parseInt(process.env.SESSION_EXPIRATION_DAYS || '30', 10);

const getCookieOptions = (expiresAt: Date) => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  expires: expiresAt
});

// Helper to create session token
function createSession(userId: string) {
  const token = 'ses_' + crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
  db.prepare(`
    INSERT INTO user_sessions (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `).run('sid_' + crypto.randomBytes(8).toString('hex'), userId, token, expiresAt.toISOString());
  return { token, expiresAt };
}

// 1. SIGNUP
router.post('/signup', authRateLimiter, validateSignup, (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Please provide a valid full name (minimum 2 characters).' });
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone ? phone.trim() : null;

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const passwordHash = bcrypt.hashSync(password, 10);

    runTransaction(() => {
      // Create User
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, phone, status, role)
        VALUES (?, ?, ?, ?, ?, 'active', 'user')
      `).run(userId, name.trim(), normalizedEmail, passwordHash, normalizedPhone);

      // Create User Profile
      db.prepare(`
        INSERT INTO user_profiles (user_id, display_name, phone, preferred_theme, preferred_language)
        VALUES (?, ?, ?, 'dark', 'en')
      `).run(userId, name.trim(), normalizedPhone);

      // Create Token Wallet with configurable initial grant
      db.prepare(`
        INSERT INTO user_token_wallets (user_id, available_trial_credits, used_credits, reserved_credits)
        VALUES (?, ?, 0, 0)
      `).run(userId, INITIAL_TRIAL_CREDITS);

      // Record immutable ledger entry for initial grant
      const txId = 'tx_' + crypto.randomBytes(8).toString('hex');
      db.prepare(`
        INSERT INTO token_usage_ledger (
          id, user_id, request_id, model_id, provider_route,
          input_token_count, output_token_count, platform_credit_charge,
          tx_type, status, metadata
        ) VALUES (?, ?, ?, 'system', 'welcome_grant', 0, 0, ?, 'INITIAL_GRANT', 'completed', ?)
      `).run(
        txId,
        userId,
        'req_' + crypto.randomBytes(6).toString('hex'),
        INITIAL_TRIAL_CREDITS,
        JSON.stringify({ reason: 'Initial Trial Platform Credits', amount: INITIAL_TRIAL_CREDITS })
      );
    });

    const { token, expiresAt } = createSession(userId);

    res.cookie('veyralabs_session', token, getCookieOptions(expiresAt));

    return res.status(201).json({
      message: 'Account successfully created.',
      sessionToken: token,
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        role: 'user',
        status: 'active'
      },
      wallet: {
        availableTrialCredits: INITIAL_TRIAL_CREDITS,
        usedCredits: 0,
        reservedCredits: 0
      }
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// 2. LOGIN
router.post('/login', authRateLimiter, validateLogin, (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = db.prepare(`
      SELECT u.id, u.name, u.email, u.password_hash, u.role, u.status,
             w.available_trial_credits, w.used_credits, w.reserved_credits
      FROM users u
      LEFT JOIN user_token_wallets w ON u.id = w.user_id
      WHERE u.email = ?
    `).get(normalizedEmail) as any;

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account has been suspended. Please contact administrator.' });
    }

    const matches = bcrypt.compareSync(password, user.password_hash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    const { token, expiresAt } = createSession(user.id);

    res.cookie('veyralabs_session', token, getCookieOptions(expiresAt));

    return res.json({
      message: 'Logged in successfully.',
      sessionToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      wallet: {
        availableTrialCredits: user.available_trial_credits || 0,
        usedCredits: user.used_credits || 0,
        reservedCredits: user.reserved_credits || 0
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to log in. Please try again.' });
  }
});

// 3. LOGOUT
router.post('/logout', (req, res) => {
  let token = req.cookies?.veyralabs_session;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (token) {
    db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
  }

  res.clearCookie('veyralabs_session');
  return res.json({ message: 'Logged out successfully.' });
});

// 4. GET SESSION / CURRENT USER
router.get('/session', authenticateSession, (req: AuthRequest, res) => {
  const user = req.user!;
  const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(user.id) as any;
  const wallet = db.prepare('SELECT * FROM user_token_wallets WHERE user_id = ?').get(user.id) as any;

  return res.json({
    user,
    profile: profile || {},
    wallet: {
      availableTrialCredits: wallet?.available_trial_credits || 0,
      usedCredits: wallet?.used_credits || 0,
      reservedCredits: wallet?.reserved_credits || 0
    }
  });
});

export default router;
