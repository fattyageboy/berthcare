import express from 'express';
import { Pool } from 'pg';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Load environment variables
dotenv.config({ path: '../../.env' });

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
    },
  });
});

// Initialize connections and start server
async function startServer() {
  try {
    // Test PostgreSQL connection
    console.warn('🔌 Connecting to PostgreSQL...');
    const pgResult = await pgPool.query('SELECT NOW() as time, version() as version');
    console.warn('✅ Connected to PostgreSQL');
    console.warn(`   Database time: ${pgResult.rows[0].time}`);
    console.warn(`   PostgreSQL version: ${pgResult.rows[0].version.split(',')[0]}`);

    // Connect to Redis
    console.warn('🔌 Connecting to Redis...');
    await redisClient.connect();
    const redisInfo = await redisClient.info('server');
    const redisVersion = redisInfo.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown';
    console.warn('✅ Connected to Redis');
    console.warn(`   Redis version: ${redisVersion}`);

    // Start Express server
    app.listen(PORT, () => {
      console.warn('');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('🚀 BerthCare Backend Server');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.warn(`   Server: http://localhost:${PORT}`);
      console.warn(`   Health: http://localhost:${PORT}/health`);
      console.warn(`   API: http://localhost:${PORT}/api/v1`);
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.warn('SIGTERM received, shutting down gracefully...');
  await pgPool.end();
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.warn('\nSIGINT received, shutting down gracefully...');
  await pgPool.end();
  await redisClient.quit();
  process.exit(0);
});

// Start the server
startServer();
