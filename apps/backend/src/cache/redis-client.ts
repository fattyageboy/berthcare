import RedisStore from 'connect-redis';
import Redis, { RedisOptions } from 'ioredis';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

const baseOptions: RedisOptions = {
  lazyConnect: true,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(Math.pow(2, times) * 50, 5000);
    return delay;
  },
};

export type RedisClient = Redis & {
  setEx: (key: string, seconds: number, value: string) => Promise<'OK' | null>;
  flushDb: () => Promise<'OK'>;
};

export function createRedisClient(options: Partial<RedisOptions> = {}): RedisClient {
  const redis = new Redis(redisUrl, { ...baseOptions, ...options }) as RedisClient;
  redis.setEx = (key: string, seconds: number, value: string) => redis.setex(key, seconds, value);
  redis.flushDb = () => redis.flushdb();

  return redis;
}

export const redisClient = createRedisClient();

export function createSessionStore() {
  return new RedisStore({
    client: redisClient,
    prefix: 'berthcare:sess:',
    disableTouch: true,
  });
}
