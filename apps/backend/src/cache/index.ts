/**
 * Redis Cache Module
 * Connection management and caching utilities
 * Philosophy: "Simplicity is the ultimate sophistication"
 */

import Redis, { RedisOptions } from 'ioredis';
import { logger } from '../monitoring';

let redis: Redis | null = null;

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  retryStrategy: (times: number) => number | void;
  maxRetriesPerRequest: number;
}

/**
 * Initialize Redis connection
 */
export function initializeCache(config?: Partial<CacheConfig>): Redis {
  if (redis) {
    logger.warn('Redis client already initialized');
    return redis;
  }

  const cacheConfig: RedisOptions = {
    host: config?.host || process.env.REDIS_HOST || 'localhost',
    port: config?.port || parseInt(process.env.REDIS_PORT || '6379'),
    password: config?.password || process.env.REDIS_PASSWORD,
    db: config?.db || parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: config?.keyPrefix || process.env.REDIS_KEY_PREFIX || 'berthcare:',
    maxRetriesPerRequest: config?.maxRetriesPerRequest || 3,
    retryStrategy:
      config?.retryStrategy ||
      ((times: number) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      }),
    lazyConnect: false,
    enableReadyCheck: true,
    enableOfflineQueue: true,
  };

  redis = new Redis(cacheConfig);

  // Handle connection events
  redis.on('connect', () => {
    logger.info('Redis connection established');
  });

  redis.on('ready', () => {
    logger.info('Redis client ready');
  });

  redis.on('error', (err) => {
    logger.error('Redis connection error', err);
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });

  redis.on('reconnecting', () => {
    logger.info('Redis reconnecting');
  });

  logger.info('Redis client initialized', {
    host: cacheConfig.host,
    port: cacheConfig.port,
    db: cacheConfig.db,
    keyPrefix: cacheConfig.keyPrefix,
  });

  return redis;
}

/**
 * Get Redis client instance
 */
export function getClient(): Redis {
  if (!redis) {
    throw new Error('Redis client not initialized. Call initializeCache() first.');
  }
  return redis;
}

/**
 * Set a value in cache with optional TTL
 */
export async function set(
  key: string,
  value: string | number | object,
  ttlSeconds?: number
): Promise<void> {
  const client = getClient();
  const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

  try {
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }

    logger.debug('Cache set', { key, ttl: ttlSeconds });
  } catch (error) {
    logger.error('Cache set failed', error as Error, { key });
    throw error;
  }
}

/**
 * Get a value from cache
 */
export async function get<T = string>(key: string, parseJson = false): Promise<T | null> {
  const client = getClient();

  try {
    const value = await client.get(key);

    if (value === null) {
      logger.debug('Cache miss', { key });
      return null;
    }

    logger.debug('Cache hit', { key });

    if (parseJson) {
      return JSON.parse(value) as T;
    }

    return value as T;
  } catch (error) {
    logger.error('Cache get failed', error as Error, { key });
    throw error;
  }
}

/**
 * Delete a value from cache
 */
export async function del(key: string | string[]): Promise<number> {
  const client = getClient();

  try {
    const count = Array.isArray(key) ? await client.del(...key) : await client.del(key);
    logger.debug('Cache delete', { key, count });
    return count;
  } catch (error) {
    logger.error('Cache delete failed', error as Error, { key });
    throw error;
  }
}

/**
 * Check if a key exists in cache
 */
export async function exists(key: string): Promise<boolean> {
  const client = getClient();

  try {
    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    logger.error('Cache exists check failed', error as Error, { key });
    throw error;
  }
}

/**
 * Set expiration on a key
 */
export async function expire(key: string, ttlSeconds: number): Promise<boolean> {
  const client = getClient();

  try {
    const result = await client.expire(key, ttlSeconds);
    return result === 1;
  } catch (error) {
    logger.error('Cache expire failed', error as Error, { key, ttl: ttlSeconds });
    throw error;
  }
}

/**
 * Get remaining TTL for a key
 */
export async function ttl(key: string): Promise<number> {
  const client = getClient();

  try {
    return await client.ttl(key);
  } catch (error) {
    logger.error('Cache TTL check failed', error as Error, { key });
    throw error;
  }
}

/**
 * Check Redis connection health
 */
export async function checkHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    await getClient().ping();
    const latency = Date.now() - start;

    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    logger.error('Redis health check failed', error as Error);
    return {
      healthy: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Close Redis connection
 */
export async function closeCache(): Promise<void> {
  if (!redis) {
    logger.warn('Redis client not initialized, nothing to close');
    return;
  }

  try {
    await redis.quit();
    redis = null;
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection', error as Error);
    throw error;
  }
}

export default {
  initialize: initializeCache,
  getClient,
  set,
  get,
  del,
  exists,
  expire,
  ttl,
  checkHealth,
  close: closeCache,
};
