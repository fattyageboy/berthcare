import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';

/**
 * PostgreSQL Database Configuration and Connection Management
 * Implements connection pooling with health checks for ACID-compliant healthcare data
 */

export interface DatabaseConfig {
  url?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  poolMin?: number;
  poolMax?: number;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  statementTimeout?: number;
}

export interface DatabaseHealthStatus {
  connected: boolean;
  message: string;
  latencyMs?: number;
  timestamp: string;
  poolStats?: {
    total: number;
    idle: number;
    waiting: number;
  };
}

class DatabaseConnection {
  private pool: Pool | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Initialize database connection pool
   * Supports both connection string and individual parameters
   */
  public async connect(): Promise<void> {
    try {
      const poolConfig: PoolConfig = this.buildPoolConfig();

      this.pool = new Pool(poolConfig);

      // Handle pool errors
      this.pool.on('error', (err) => {
        console.error('Unexpected database pool error:', err);
      });

      // Test connection
      const client = await this.pool.connect();
      console.error('PostgreSQL connection pool established successfully');
      client.release();
    } catch (error) {
      console.error('Failed to establish database connection:', error);
      throw error;
    }
  }

  /**
   * Build pool configuration from environment variables
   */
  private buildPoolConfig(): PoolConfig {
    // Support both DATABASE_URL and individual parameters
    if (this.config.url) {
      return {
        connectionString: this.config.url,
        min: this.config.poolMin || 2,
        max: this.config.poolMax || 10,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis || 5000,
        idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
        statement_timeout: this.config.statementTimeout || 30000,
        // SSL configuration for production
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      };
    }

    return {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      min: this.config.poolMin || 2,
      max: this.config.poolMax || 10,
      connectionTimeoutMillis: this.config.connectionTimeoutMillis || 5000,
      idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
      statement_timeout: this.config.statementTimeout || 30000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
  }

  /**
   * Execute a query against the database
   */
  public async query(text: string, params?: unknown[]): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call connect() first.');
    }

    return this.pool.query(text, params);
  }

  /**
   * Get a client from the pool for transaction support
   */
  public async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call connect() first.');
    }

    return this.pool.connect();
  }

  /**
   * Health check for database connectivity
   * Tests connection with a simple query and measures latency
   */
  public async healthCheck(): Promise<DatabaseHealthStatus> {
    const startTime = Date.now();

    try {
      if (!this.pool) {
        return {
          connected: false,
          message: 'Database pool not initialized',
          timestamp: new Date().toISOString(),
        };
      }

      // Execute simple query to test connection
      await this.pool.query('SELECT 1 AS health_check');

      const latencyMs = Date.now() - startTime;

      return {
        connected: true,
        message: 'Database connection healthy',
        latencyMs,
        timestamp: new Date().toISOString(),
        poolStats: {
          total: this.pool.totalCount,
          idle: this.pool.idleCount,
          waiting: this.pool.waitingCount,
        },
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        connected: false,
        message: `Database connection failed: ${errorMessage}`,
        latencyMs,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Gracefully close database connection pool
   */
  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.error('Database connection pool closed');
      this.pool = null;
    }
  }

  /**
   * Get current pool instance (for advanced usage)
   */
  public getPool(): Pool | null {
    return this.pool;
  }
}

// Create and export singleton database instance
const databaseConfig: DatabaseConfig = {
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  poolMin: process.env.DATABASE_POOL_MIN ? parseInt(process.env.DATABASE_POOL_MIN, 10) : 2,
  poolMax: process.env.DATABASE_POOL_MAX ? parseInt(process.env.DATABASE_POOL_MAX, 10) : 10,
  connectionTimeoutMillis: process.env.DATABASE_CONNECTION_TIMEOUT
    ? parseInt(process.env.DATABASE_CONNECTION_TIMEOUT, 10)
    : 5000,
  idleTimeoutMillis: process.env.DATABASE_IDLE_TIMEOUT
    ? parseInt(process.env.DATABASE_IDLE_TIMEOUT, 10)
    : 30000,
  statementTimeout: process.env.DATABASE_STATEMENT_TIMEOUT
    ? parseInt(process.env.DATABASE_STATEMENT_TIMEOUT, 10)
    : 30000,
};

export const database = new DatabaseConnection(databaseConfig);

// Export for testing and custom configurations
export { DatabaseConnection };
