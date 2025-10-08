/**
 * BerthCare Backend API
 * Philosophy: "Simplicity is the ultimate sophistication"
 */

// Load environment variables first
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../../.env') });

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { sentry, logger } from './monitoring';
import {
  requestIdMiddleware,
  requestTimingMiddleware,
  requestLoggingMiddleware,
  responseLoggingMiddleware,
  errorHandlingMiddleware,
  healthCheckHandler,
  metricsHandler,
} from './middleware/monitoring';

// Initialize Sentry
sentry.initialize({
  dsn: process.env.SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  release: process.env.RELEASE_VERSION,
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
});

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Compression middleware - Reduce response size
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balance between speed and compression ratio
  })
);

// Rate limiting - Prevent abuse
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      requestId: req.requestId,
    });
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later',
        requestId: req.requestId,
      },
    });
  },
});

// Apply rate limiting to all routes
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sentry request handler (must be first)
app.use(sentry.getRequestHandler());

// Monitoring middleware
app.use(requestIdMiddleware);
app.use(requestTimingMiddleware);
app.use(requestLoggingMiddleware);
app.use(responseLoggingMiddleware);

// Health check endpoints
app.get('/health', healthCheckHandler);
app.get('/metrics', metricsHandler);

// API routes
app.get('/api/v1/status', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'BerthCare API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API routes
// TODO: Add actual API routes here
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/clients', clientRoutes);
// app.use('/api/v1/visits', visitRoutes);
// app.use('/api/v1/sync', syncRoutes);

// Storage routes
import storageRoutes from './routes/storage';
app.use('/api/v1/storage', storageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      path: req.path,
      requestId: req.requestId,
    },
  });
});

// Sentry error handler (must be before other error handlers)
app.use(sentry.getErrorHandler());

// Error handling middleware (must be last)
app.use(errorHandlingMiddleware);

// Initialize database and cache connections
async function initializeConnections() {
  try {
    // Initialize database
    const database = await import('./database');
    database.initializeDatabase();
    logger.info('Database connection initialized');

    // Initialize cache
    const cache = await import('./cache');
    cache.initializeCache();
    logger.info('Cache connection initialized');
  } catch (error) {
    logger.error('Failed to initialize connections', error as Error);
    throw error;
  }
}

// Start server
async function startServer() {
  try {
    await initializeConnections();

    const server = app.listen(PORT, () => {
      logger.info(`BerthCare API started`, {
        port: PORT,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
      });
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
}

const serverPromise = startServer();

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);

  const server = await serverPromise;
  server.close(async () => {
    logger.info('HTTP server closed');

    // Close Sentry
    await sentry.close();

    // Close database connections
    try {
      const database = await import('./database');
      await database.closeDatabase();
    } catch (error) {
      logger.error('Error closing database', error as Error);
    }

    // Close Redis connections
    try {
      const cache = await import('./cache');
      await cache.closeCache();
    } catch (error) {
      logger.error('Error closing cache', error as Error);
    }

    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  sentry.captureException(error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason as Error);
  sentry.captureException(reason as Error);
});

export default app;
