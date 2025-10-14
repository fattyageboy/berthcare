/**
 * BerthCare Backend Server - Main Entry Point
 *
 * Task B1: Initialize Express.js backend
 * Set up Express.js 4.x with TypeScript; configure middleware (helmet, cors, compression);
 * create health check endpoint GET /health; configure logging (Winston);
 * set up error handling middleware.
 *
 * Task B2: Configure database connection (PostgreSQL with connection pooling)
 * Task B3: Configure Redis connection (with retry logic)
 *
 * Reference: project-documentation/task-plan.md - Phase B – Backend Core Infrastructure
 */

import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Router } from 'express';
import helmet from 'helmet';
import { Pool } from 'pg';
import { createClient } from 'redis';

import { logError, logInfo } from './config/logger';
import { createAuthRoutes } from './routes/auth.routes';
import { createCarePlanRoutes } from './routes/care-plans.routes';
import { createClientRoutes } from './routes/clients.routes';
import { createVisitsRouter } from './routes/visits.routes';

// Load environment variables
dotenv.config({ path: '../../.env' });

export function validateEnvironment() {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  if (!process.env.AWS_REGION) {
    throw new Error(
      'AWS_REGION is required for S3 URL construction. Set AWS_REGION in your environment or .env file.'
    );
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// PostgreSQL connection
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '2000'),
});

// Redis connection
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

// Health check endpoint
app.get('/health', async (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      postgres: 'unknown',
      redis: 'unknown',
    },
  };

  // Check PostgreSQL
  try {
    await pgPool.query('SELECT 1');
    health.services.postgres = 'connected';
  } catch (error) {
    health.services.postgres = 'disconnected';
    health.status = 'degraded';
  }

  // Check Redis
  try {
    await redisClient.ping();
    health.services.redis = 'connected';
  } catch (error) {
    health.services.redis = 'disconnected';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API info endpoint
app.get('/api/v1', (_req, res) => {
  res.json({
    name: 'BerthCare API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      auth: '/api/v1/auth',
      clients: '/api/v1/clients',
      carePlans: '/api/v1/care-plans',
      visits: '/api/v1/visits',
    },
  });
});

// Mount routes (will be initialized after Redis connection)
let authRoutes: Router | null = null;
let clientRoutes: Router | null = null;
let carePlanRoutes: Router | null = null;
let visitsRoutes: Router | null = null;

// Initialize connections and start server
async function startServer() {
  try {
    // Test PostgreSQL connection
    logInfo('Connecting to PostgreSQL...');
    const pgResult = await pgPool.query('SELECT NOW() as time, version() as version');
    logInfo('Connected to PostgreSQL', {
      databaseTime: pgResult.rows[0].time,
      version: pgResult.rows[0].version.split(',')[0],
    });

    // Connect to Redis
    logInfo('Connecting to Redis...');
    await redisClient.connect();
    const redisInfo = await redisClient.info('server');
    const redisVersion = redisInfo.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown';
    logInfo('Connected to Redis', { version: redisVersion });

    // Initialize routes after Redis connection
    authRoutes = createAuthRoutes(pgPool, redisClient);
    app.use('/api/v1/auth', authRoutes);

    clientRoutes = createClientRoutes(pgPool, redisClient);
    app.use('/api/v1/clients', clientRoutes);

    carePlanRoutes = createCarePlanRoutes(pgPool, redisClient);
    app.use('/api/v1/care-plans', carePlanRoutes);

    visitsRoutes = createVisitsRouter(pgPool, redisClient);
    app.use('/api/v1/visits', visitsRoutes);

    // Start Express server
    app.listen(PORT, () => {
      logInfo('BerthCare Backend Server started', {
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        serverUrl: `http://localhost:${PORT}`,
        healthUrl: `http://localhost:${PORT}/health`,
        apiUrl: `http://localhost:${PORT}/api/v1`,
      });
    });
  } catch (error) {
    logError('Failed to start server', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logInfo('SIGTERM received, shutting down gracefully...');
  await pgPool.end();
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logInfo('SIGINT received, shutting down gracefully...');
  await pgPool.end();
  await redisClient.quit();
  process.exit(0);
});

try {
  validateEnvironment();
  startServer();
} catch (error) {
  const envError = error instanceof Error ? error : new Error(String(error));
  logError('Environment validation failed', envError);

  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }

  throw envError;
}

// Export for testing
export { app, pgPool, redisClient };
