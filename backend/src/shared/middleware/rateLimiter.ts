/**
 * Rate Limiting Middleware
 * Protects authentication endpoints from brute force attacks
 */

import rateLimit from 'express-rate-limit';
import { redis } from '../../config';

/**
 * Rate limiter for authentication endpoints
 * 10 requests per minute per IP address
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
    message: 'Rate limit exceeded',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers

  // Use Redis store for distributed rate limiting
  store: {
    // Custom Redis store implementation
    async increment(key: string): Promise<{ totalHits: number; resetTime: Date | undefined }> {
      try {
        const client = redis.getClient();
        if (!client) {
          return { totalHits: 0, resetTime: undefined };
        }
        const currentCount = await client.incr(key);

        // Set expiry on first request
        if (currentCount === 1) {
          await client.expire(key, 60); // 60 seconds
        }

        const ttl = await client.ttl(key);
        const resetTime = ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined;

        return {
          totalHits: currentCount,
          resetTime,
        };
      } catch (error) {
        console.error('Rate limiter error:', error);
        // Fallback to allowing request if Redis fails
        return {
          totalHits: 0,
          resetTime: undefined,
        };
      }
    },

    async decrement(key: string): Promise<void> {
      try {
        const client = redis.getClient();
        if (!client) return;
        await client.decr(key);
      } catch (error) {
        console.error('Rate limiter decrement error:', error);
      }
    },

    async resetKey(key: string): Promise<void> {
      try {
        const client = redis.getClient();
        if (!client) return;
        await client.del(key);
      } catch (error) {
        console.error('Rate limiter reset error:', error);
      }
    },
  },

  // Skip rate limiting in test environment
  skip: (_req) => {
    return process.env.NODE_ENV === 'test';
  },

  // Key generator based on IP address
  keyGenerator: (req) => {
    return `rate_limit:auth:${req.ip}`;
  },
});

/**
 * General API rate limiter
 * 100 requests per minute per IP address
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    message: 'Rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,

  skip: (_req) => {
    return process.env.NODE_ENV === 'test';
  },

  keyGenerator: (req) => {
    return `rate_limit:api:${req.ip}`;
  },
});
