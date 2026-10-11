import type { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, RateLimitRecord>();

// Periodic memory cleanup for expired rate limit records (runs every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts.entries()) {
    if (now > record.resetAt) {
      attempts.delete(key);
    }
  }
}, 300000).unref();

export function createRateLimiter(maxAttempts: number = 10, windowMs: number = 60000, keyPrefix: string = 'api') {
  return (req: Request, res: Response, next: NextFunction) => {
    // Resolve client IP (support proxy headers safely)
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : (req.ip || req.socket.remoteAddress || '127.0.0.1');

    const key = `${keyPrefix}_${req.baseUrl || ''}${req.path}_${clientIp}`;
    const now = Date.now();

    let record = attempts.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      attempts.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxAttempts - record.count);
    const resetSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

    res.setHeader('RateLimit-Limit', maxAttempts.toString());
    res.setHeader('RateLimit-Remaining', remaining.toString());
    res.setHeader('RateLimit-Reset', resetSec.toString());

    if (record.count > maxAttempts) {
      res.setHeader('Retry-After', resetSec.toString());
      return res.status(429).json({
        error: `Too many requests. Please wait ${resetSec} seconds before retrying.`
      });
    }

    next();
  };
}

// Pre-configured rate limiters
export const authRateLimiter = createRateLimiter(15, 60000, 'auth');
export const inferenceRateLimiter = createRateLimiter(30, 60000, 'inference');
export const generalApiLimiter = createRateLimiter(120, 60000, 'general');

