import express, { Request, Response } from 'express';
import { config, database, redis, DatabaseHealthStatus, RedisHealthStatus } from '../../config';
import {
  configureSecurity,
  errorHandler,
  requestLogger,
  ApiResponse,
  HealthCheckResponse,
  ServiceStatus,
} from '../../shared';
import authRoutes from './auth.routes';

/**
 * User Service
 * Handles user authentication, authorization, and profile management
 */

const app = express();
const PORT = config.services.user;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
configureSecurity(app);

// Initialize database and Redis connections
const initializeConnections = async (): Promise<void> => {
  try {
    await database.connect();
    await redis.connect();
    console.error('All connections initialized successfully');
  } catch (error) {
    console.error('Failed to initialize connections:', error);
    // Don't exit in development, allow service to start
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }
};

// Health check endpoint - overall service health
app.get('/health', (_req: Request, res: Response) => {
  const healthResponse: HealthCheckResponse = {
    status: ServiceStatus.HEALTHY,
    timestamp: new Date().toISOString(),
    service: 'user-service',
    version: '1.0.0',
    uptime: process.uptime(),
  };
  res.json(healthResponse);
});

// Database health check endpoint
app.get('/health/db', (_req: Request, res: Response) => {
  void (async () => {
    try {
      const dbHealth: DatabaseHealthStatus = await database.healthCheck();

      if (dbHealth.connected) {
        res.status(200).json({
          success: true,
          message: dbHealth.message,
          data: {
            connected: dbHealth.connected,
            latencyMs: dbHealth.latencyMs,
            poolStats: dbHealth.poolStats,
            timestamp: dbHealth.timestamp,
          },
        });
      } else {
        res.status(503).json({
          success: false,
          message: dbHealth.message,
          error: 'Database connection failed',
          data: {
            connected: dbHealth.connected,
            latencyMs: dbHealth.latencyMs,
            timestamp: dbHealth.timestamp,
          },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(503).json({
        success: false,
        message: 'Database health check failed',
        error: errorMessage,
        data: {
          connected: false,
          timestamp: new Date().toISOString(),
        },
      });
    }
  })();
});

// Redis health check endpoint
app.get('/health/redis', (_req: Request, res: Response) => {
  void (async () => {
    try {
      const redisHealth: RedisHealthStatus = await redis.healthCheck();

      if (redisHealth.connected) {
        res.status(200).json({
          success: true,
          message: redisHealth.message,
          data: {
            connected: redisHealth.connected,
            latencyMs: redisHealth.latencyMs,
            serverInfo: redisHealth.serverInfo,
            timestamp: redisHealth.timestamp,
          },
        });
      } else {
        res.status(503).json({
          success: false,
          message: redisHealth.message,
          error: 'Redis connection failed',
          data: {
            connected: redisHealth.connected,
            latencyMs: redisHealth.latencyMs,
            timestamp: redisHealth.timestamp,
          },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(503).json({
        success: false,
        message: 'Redis health check failed',
        error: errorMessage,
        data: {
          connected: false,
          timestamp: new Date().toISOString(),
        },
      });
    }
  })();
});

// Authentication routes
app.use('/auth', authRoutes);

// API routes
app.get('/api/users', (_req: Request, res: Response) => {
  const response: ApiResponse<string> = {
    success: true,
    message: 'User service is running',
    data: 'GET /api/users endpoint',
  };
  res.json(response);
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server and initialize connections
const server = app.listen(PORT, () => {
  console.error(`User service listening on port ${PORT}`);
  void initializeConnections();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.error('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    void (async () => {
      await database.disconnect();
      await redis.disconnect();
      console.error('Server closed');
      process.exit(0);
    })();
  });
});

export default server;
