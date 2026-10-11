import type { Request, Response, NextFunction } from 'express';
import { db } from '../database/db.ts';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticateSession(req: AuthRequest, res: Response, next: NextFunction) {
  let token = req.cookies?.veyralabs_session;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  try {
    const session = db.prepare(`
      SELECT s.token, s.expires_at, u.id, u.name, u.email, u.role, u.status
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ?
    `).get(token) as any;

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
      return res.status(401).json({ error: 'Session has expired. Please log in again.' });
    }

    if (session.status !== 'active') {
      return res.status(403).json({ error: 'Account is suspended. Please contact support.' });
    }

    // Update last activity
    db.prepare('UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?').run(session.id);

    req.user = {
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
      status: session.status
    };

    next();
  } catch (err: any) {
    console.error('Session authentication error:', err);
    return res.status(500).json({ error: 'Internal authentication error.' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}
