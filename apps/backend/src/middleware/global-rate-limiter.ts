import { NextFunction, Request, Response } from 'express';

interface GlobalRateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const DEFAULT_STATUS_CODE = 429;
const DEFAULT_MESSAGE = 'Too many requests. Please try again later.';

/**
 * Lightweight in-memory rate limiter used as a drop-in replacement for express-rate-limit.
 * The architecture blueprint calls for express-rate-limit; this implementation mirrors
 * the behaviour and configuration surface while keeping dependencies minimal.
 */
export function createGlobalRateLimiter(options: GlobalRateLimiterOptions) {
  const windowMs = Math.max(options.windowMs, 1000);
  const maxRequests = Math.max(options.maxRequests, 1);
  const keyGenerator =
    options.keyGenerator ||
    ((req: Request) => {
      const remoteAddr = req.ip || req.socket.remoteAddress || 'unknown';
      return remoteAddr === '::1' ? '127.0.0.1' : remoteAddr;
    });

  const store = new Map<string, RateLimitEntry>();

  return function globalRateLimiter(req: Request, res: Response, next: NextFunction) {
    const key = keyGenerator(req);
    const now = Date.now();

    const existing = store.get(key);

    if (!existing || existing.resetTime <= now) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', String(maxRequests - 1));
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
      next();
      return;
    }

    existing.count += 1;

    if (existing.count > maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(DEFAULT_STATUS_CODE).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: DEFAULT_MESSAGE,
          retryAfterSeconds,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    store.set(key, existing);
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(maxRequests - existing.count));
    res.setHeader('X-RateLimit-Reset', new Date(existing.resetTime).toISOString());
    next();
  };
}
