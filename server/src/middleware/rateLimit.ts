import type { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, RateLimitRecord>();

export function createRateLimiter(maxAttempts: number = 10, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}_${ip}`;
    const now = Date.now();

    const record = attempts.get(key);

    if (!record || now > record.resetAt) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxAttempts) {
      const waitSec = Math.ceil((record.resetAt - now) / 1000);
      return res.status(429).json({
        error: `Too many requests. Please wait ${waitSec} seconds before trying again.`
      });
    }

    record.count += 1;
    next();
  };
}
