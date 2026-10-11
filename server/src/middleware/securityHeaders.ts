import type { Request, Response, NextFunction } from 'express';

/**
 * Defensive HTTP Security Headers Middleware
 * Protects against XSS, clickjacking, MIME sniffing, packet sniffing,
 * and unauthorized framing.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking by denying iframe embedding
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Legacy XSS filter activation
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Restrict sensitive browser features / APIs
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Prevent cross-domain flash/PDF execution
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // Strict Content-Security-Policy tailored for VeyraLabs SPA & API
  const isDev = process.env.NODE_ENV !== 'production';
  const cspDirectives = [
    "default-src 'self'",
    isDev 
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" 
      : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' http://localhost:5173 http://127.0.0.1:5173 http://localhost:3001 http://127.0.0.1:3001 https://openrouter.ai https://generativelanguage.googleapis.com ws: wss:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'"
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspDirectives);

  // Enforce HSTS in production or over HTTPS
  if (process.env.NODE_ENV === 'production' || req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Remove Express fingerprinting header
  res.removeHeader('X-Powered-By');

  next();
}
