/**
 * Database Connection Module
 * PostgreSQL connection with connection pooling and read replica support
 * Philosophy: "Simplicity is the ultimate sophistication"
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '../monitoring/logger';

let pool: Pool | null = null;
let readReplicaPool: Pool | null = null;

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  min: number;
  max: number;
  connectionTimeoutMillis: number;
}

interface ReadReplicaConfig {
  enabled: boolean;
  host?: string;
  port?: number;
}

/**
 * Initialize database connection pool
 */
export function initializeDatabase(config?: Partial<DatabaseConfig>): Pool {
  if (pool) {
    logger.warn('Database pool already initialized');
    return pool;
  }

  const dbConfig: DatabaseConfig = {
    host: config?.host || process.env.DATABASE_HOST || 'localhost',
    port: config?.port || parseInt(process.env.DATABASE_PORT || '5432'),
    database: config?.database || process.env.DATABASE_NAME || 'berthcare_dev',
    user: config?.user || process.env.DATABASE_USER || 'berthcare',
    password: config?.password || process.env.DATABASE_PASSWORD || '',
    ssl: config?.ssl ?? process.env.DATABASE_SSL === 'true',
    min: config?.min || parseInt(process.env.DATABASE_POOL_MIN || '2'),
    max: config?.max || parseInt(process.env.DATABASE_POOL_MAX || '20'),
    connectionTimeoutMillis:
      config?.connectionTimeoutMillis ||
      parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000'),
  };

  pool = new Pool(dbConfig);

  // Handle pool errors
  pool.on('error', (err) => {
    logger.error('Unexpected database pool error', err);
  });

  // Handle pool connection
  pool.on('connect', () => {
    logger.debug('New database connection established');
  });

  // Handle pool removal
  pool.on('remove', () => {
    logger.debug('Database connection removed from pool');
  });

  logger.info('Database connection pool initialized', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    poolMin: dbConfig.min,
    poolMax: dbConfig.max,
  });

  // Initialize read replica pool if configured
  const readReplicaConfig: ReadReplicaConfig = {
    enabled: process.env.DATABASE_READ_REPLICA_ENABLED === 'true',
    host: process.env.DATABASE_READ_REPLICA_HOST,
    port: process.env.DATABASE_READ_REPLICA_PORT
      ? parseInt(process.env.DATABASE_READ_REPLICA_PORT)
      : undefined,
  };

  if (readReplicaConfig.enabled && readReplicaConfig.host) {
    const replicaConfig: DatabaseConfig = {
      ...dbConfig,
      host: readReplicaConfig.host,
      port: readReplicaConfig.port || dbConfig.port,
    };

    readReplicaPool = new Pool(replicaConfig);

    readReplicaPool.on('error', (err) => {
      logger.error('Unexpected read replica pool error', err);
    });

    logger.info('Read replica connection pool initialized', {
      host: replicaConfig.host,
      port: replicaConfig.port,
      database: replicaConfig.database,
    });
  } else {
    logger.info('Read replica not configured, using primary for all queries');
  }

  return pool;
}

/**
 * Get database pool instance
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

/**
 * Execute a query (write operation - uses primary)
 */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const client = getPool();

  try {
    const result = await client.query<T>(text, params);
    const duration = Date.now() - start;

    logger.debug('Query executed', {
      query: text,
      duration,
      rows: result.rowCount,
    });

    return result;
  } catch (error) {
    logger.error('Query execution failed', error as Error, {
      query: text,
      params,
    });
    throw error;
  }
}

/**
 * Execute a read-only query (uses read replica if available)
 */
export async function queryRead<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const client = readReplicaPool || getPool();

  try {
    const result = await client.query<T>(text, params);
    const duration = Date.now() - start;

    logger.debug('Read query executed', {
      query: text,
      duration,
      rows: result.rowCount,
      usedReplica: readReplicaPool !== null,
    });

    return result;
  } catch (error) {
    logger.error('Read query execution failed', error as Error, {
      query: text,
      params,
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

/**
 * Check database connection health
 */
export async function checkHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    await query('SELECT 1');
    const latency = Date.now() - start;

    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    logger.error('Database health check failed', error as Error);
    return {
      healthy: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Close database connection pool
 */
export async function closeDatabase(): Promise<void> {
  const promises: Promise<void>[] = [];

  if (pool) {
    promises.push(
      pool.end().then(() => {
        pool = null;
        logger.info('Primary database connection pool closed');
      })
    );
  }

  if (readReplicaPool) {
    promises.push(
      readReplicaPool.end().then(() => {
        readReplicaPool = null;
        logger.info('Read replica connection pool closed');
      })
    );
  }

  if (promises.length === 0) {
    logger.warn('Database pool not initialized, nothing to close');
    return;
  }

  try {
    await Promise.all(promises);
  } catch (error) {
    logger.error('Error closing database pool', error as Error);
    throw error;
  }
}

export default {
  initialize: initializeDatabase,
  getPool,
  query,
  queryRead,
  getClient,
  checkHealth,
  close: closeDatabase,
};
