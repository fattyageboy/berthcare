import Redis, { RedisOptions } from 'ioredis';

/**
 * Redis Configuration and Connection Management
 * Implements caching layer with health checks for performance optimization
 */

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  maxRetriesPerRequest?: number;
  retryStrategy?: (times: number) => number | void;
  reconnectOnError?: (err: Error) => boolean | 1 | 2;
}

export interface RedisHealthStatus {
  connected: boolean;
  message: string;
  latencyMs?: number;
  timestamp: string;
  serverInfo?: {
    version?: string;
    uptime?: number;
    connectedClients?: number;
    usedMemory?: string;
  };
}

class RedisConnection {
  private client: Redis | null = null;
  private config: RedisConfig;

  constructor(config: RedisConfig) {
    this.config = config;
  }

  /**
   * Initialize Redis connection
   * Supports both connection string and individual parameters
   */
  public async connect(): Promise<void> {
    try {
      const redisOptions = this.buildRedisOptions();

      // Create Redis client with configuration
      if (this.config.url) {
        this.client = new Redis(this.config.url, redisOptions);
      } else {
        this.client = new Redis(redisOptions);
      }

      // Event handlers
      this.client.on('connect', () => {
        console.error('Redis connection established');
      });

      this.client.on('ready', () => {
        console.error('Redis client ready');
      });

      this.client.on('error', (err) => {
        console.error('Redis client error:', err);
      });

      this.client.on('close', () => {
        console.error('Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        console.error('Redis client reconnecting...');
      });

      // Wait for connection to be ready
      await this.waitForReady();
      console.error('Redis connection pool established successfully');
    } catch (error) {
      console.error('Failed to establish Redis connection:', error);
      throw error;
    }
  }

  /**
   * Build Redis options from configuration
   */
  private buildRedisOptions(): RedisOptions {
    const options: RedisOptions = {
      host: this.config.host || 'localhost',
      port: this.config.port || 6379,
      password: this.config.password,
      db: this.config.db || 0,
      keyPrefix: this.config.keyPrefix || 'berthcare:',
      maxRetriesPerRequest: this.config.maxRetriesPerRequest || 3,
      retryStrategy:
        this.config.retryStrategy || ((times: number) => this.defaultRetryStrategy(times)),
      reconnectOnError:
        this.config.reconnectOnError || ((err: Error) => this.defaultReconnectOnError(err)),
      lazyConnect: true, // Don't connect immediately, wait for explicit connect()
      enableReadyCheck: true,
      showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
    };

    // Add TLS for production if needed
    if (process.env.NODE_ENV === 'production' && process.env.REDIS_TLS === 'true') {
      options.tls = {};
    }

    return options;
  }

  /**
   * Default retry strategy for failed connections
   */
  private defaultRetryStrategy(times: number): number | void {
    const delay = Math.min(times * 50, 2000);
    if (times > 10) {
      console.error('Redis connection retry limit exceeded');
      return undefined; // Stop retrying
    }
    return delay;
  }

  /**
   * Default reconnect on error strategy
   */
  private defaultReconnectOnError(err: Error): boolean | 1 | 2 {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Reconnect on READONLY error
      return 2; // Reconnect and retry command
    }
    return false;
  }

  /**
   * Wait for Redis client to be ready
   */
  private async waitForReady(timeoutMs: number = 5000): Promise<void> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, timeoutMs);

      if (this.client!.status === 'ready') {
        clearTimeout(timeout);
        resolve();
      } else {
        this.client!.connect()
          .then(() => {
            clearTimeout(timeout);
            resolve();
          })
          .catch((err) => {
            clearTimeout(timeout);
            reject(err);
          });
      }
    });
  }

  /**
   * Health check for Redis connectivity
   * Tests connection with PING command and retrieves server info
   */
  public async healthCheck(): Promise<RedisHealthStatus> {
    const startTime = Date.now();

    try {
      if (!this.client) {
        return {
          connected: false,
          message: 'Redis client not initialized',
          timestamp: new Date().toISOString(),
        };
      }

      if (this.client.status !== 'ready') {
        return {
          connected: false,
          message: `Redis client not ready (status: ${this.client.status})`,
          timestamp: new Date().toISOString(),
        };
      }

      // Execute PING command to test connection
      const pingResult = await this.client.ping();

      if (pingResult !== 'PONG') {
        throw new Error(`Unexpected PING response: ${String(pingResult)}`);
      }

      const latencyMs = Date.now() - startTime;

      // Get server info (optional, for additional diagnostics)
      let serverInfo: RedisHealthStatus['serverInfo'];
      try {
        const info = await this.client.info('server');
        const stats = await this.client.info('stats');
        const memory = await this.client.info('memory');

        serverInfo = {
          version: this.parseInfoField(info, 'redis_version'),
          uptime: parseInt(this.parseInfoField(stats, 'uptime_in_seconds') || '0', 10),
          connectedClients: parseInt(this.parseInfoField(stats, 'connected_clients') || '0', 10),
          usedMemory: this.parseInfoField(memory, 'used_memory_human'),
        };
      } catch (infoError) {
        // Server info is optional, continue without it
        console.warn('Failed to retrieve Redis server info:', infoError);
      }

      return {
        connected: true,
        message: 'Redis connection healthy',
        latencyMs,
        timestamp: new Date().toISOString(),
        serverInfo,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        connected: false,
        message: `Redis connection failed: ${errorMessage}`,
        latencyMs,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Parse field from Redis INFO command output
   */
  private parseInfoField(info: string, field: string): string | undefined {
    const regex = new RegExp(`${field}:(.+)`);
    const match = info.match(regex);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Get Redis client instance
   */
  public getClient(): Redis | null {
    return this.client;
  }

  /**
   * Gracefully close Redis connection
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      console.error('Redis connection closed');
      this.client = null;
    }
  }

  /**
   * Helper: Set a key with optional expiration
   */
  public async set(key: string, value: string, expirationSeconds?: number): Promise<'OK' | null> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    if (expirationSeconds) {
      return this.client.set(key, value, 'EX', expirationSeconds);
    }

    return this.client.set(key, value);
  }

  /**
   * Helper: Get a key value
   */
  public async get(key: string): Promise<string | null> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    return this.client.get(key);
  }

  /**
   * Helper: Delete one or more keys
   */
  public async del(...keys: string[]): Promise<number> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    return this.client.del(...keys);
  }

  /**
   * Helper: Check if key exists
   */
  public async exists(...keys: string[]): Promise<number> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    return this.client.exists(...keys);
  }

  /**
   * Helper: Set expiration on a key
   */
  public async expire(key: string, seconds: number): Promise<number> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    return this.client.expire(key, seconds);
  }
}

// Create and export singleton Redis instance
const redisConfig: RedisConfig = {
  url: process.env.REDIS_URL,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'berthcare:',
};

export const redis = new RedisConnection(redisConfig);

// Export for testing and custom configurations
export { RedisConnection };
