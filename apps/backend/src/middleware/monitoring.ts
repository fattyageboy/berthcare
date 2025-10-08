/**
 * BerthCare Monitoring Middleware
 * Express middleware for request tracking, metrics, and error handling
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger, metrics, sentry } from '../monitoring';

// Extend Express Request type to include monitoring context
declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
    startTime: number;
  }
}

/**
 * Request ID middleware - Adds unique ID to each request
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

/**
 * Request timing middleware - Tracks request duration
 */
export function requestTimingMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.startTime = Date.now();
  next();
}

/**
 * Request logging middleware - Logs all API requests
 */
export function requestLoggingMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const user = (req as Request & { user?: { id: string } }).user;
  logger.apiRequest(req.method, req.path, {
    requestId: req.requestId,
    userId: user?.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Add breadcrumb for Sentry
  sentry.addBreadcrumb(`${req.method} ${req.path}`, 'http', {
    method: req.method,
    url: req.path,
    requestId: req.requestId,
  });

  next();
}

/**
 * Response logging middleware - Logs API responses with metrics
 */
export function responseLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;

  res.send = function (data: unknown) {
    const duration = Date.now() - req.startTime;
    const statusCode = res.statusCode;

    const user = (req as Request & { user?: { id: string } }).user;
    // Log response
    logger.apiResponse(req.method, req.path, statusCode, duration, {
      requestId: req.requestId,
      userId: user?.id,
    });

    // Publish metrics to CloudWatch
    metrics.recordApiLatency(req.path, req.method, duration);
    metrics.recordApiRequest(req.path, req.method, statusCode);

    // Calculate and record error rate
    if (statusCode >= 500) {
      metrics.recordApiError(req.path, req.method, 'server_error');
    } else if (statusCode >= 400) {
      metrics.recordApiError(req.path, req.method, 'client_error');
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Error handling middleware - Catches and logs all errors
 */
export function errorHandlingMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const duration = Date.now() - req.startTime;
  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;

  const user = (req as Request & { user?: { id: string } }).user;
  // Log error
  logger.error('API Error', err, {
    requestId: req.requestId,
    userId: user?.id,
    method: req.method,
    path: req.path,
    duration,
    statusCode,
  });

  // Capture in Sentry
  sentry.captureException(err, {
    request: {
      method: req.method,
      path: req.path,
      requestId: req.requestId,
      userId: user?.id,
    },
  });

  // Publish error metrics
  metrics.recordApiError(req.path, req.method, err.name);

  // Send error response
  res.status(statusCode).json({
    error: {
      code: err.name || 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An error occurred processing your request'
          : err.message,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Health check endpoint handler
 */
export async function healthCheckHandler(_req: Request, res: Response): Promise<void> {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  // Check database and cache health (lazy import to avoid circular dependencies)
  let dbHealth: { healthy: boolean; latency?: number; error?: string } = { healthy: false };
  let cacheHealth: { healthy: boolean; latency?: number; error?: string } = { healthy: false };

  try {
    const database = await import('../database');
    dbHealth = await database.checkHealth();
  } catch (error) {
    logger.warn('Database health check skipped - not initialized');
  }

  try {
    const cache = await import('../cache');
    cacheHealth = await cache.checkHealth();
  } catch (error) {
    logger.warn('Cache health check skipped - not initialized');
  }

  // Check S3 storage health
  let storageHealth: { healthy: boolean; latency?: number; message?: string } = { healthy: false };
  try {
    const storage = await import('../storage');
    storageHealth = await storage.healthCheck();
  } catch (error) {
    logger.warn('Storage health check skipped - not initialized');
  }

  const allHealthy = dbHealth.healthy && cacheHealth.healthy && storageHealth.healthy;
  const status = allHealthy ? 'healthy' : 'degraded';

  res.status(allHealthy ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    memory: {
      heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024),
      rss: Math.floor(memoryUsage.rss / 1024 / 1024),
    },
    checks: {
      database: {
        healthy: dbHealth.healthy,
        latency: dbHealth.latency || 0,
        error: dbHealth.error,
      },
      cache: {
        healthy: cacheHealth.healthy,
        latency: cacheHealth.latency || 0,
        error: cacheHealth.error,
      },
      storage: {
        healthy: storageHealth.healthy,
        latency: storageHealth.latency || 0,
        message: storageHealth.message,
      },
    },
    version: process.env.npm_package_version || '1.0.0',
  });
}

/**
 * Metrics endpoint handler (for Prometheus scraping if needed)
 */
export function metricsHandler(_req: Request, res: Response): void {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  // Simple text format for now
  const metricsText = `
# HELP berthcare_uptime_seconds Application uptime in seconds
# TYPE berthcare_uptime_seconds gauge
berthcare_uptime_seconds ${uptime}

# HELP berthcare_memory_heap_used_bytes Heap memory used in bytes
# TYPE berthcare_memory_heap_used_bytes gauge
berthcare_memory_heap_used_bytes ${memoryUsage.heapUsed}

# HELP berthcare_memory_heap_total_bytes Total heap memory in bytes
# TYPE berthcare_memory_heap_total_bytes gauge
berthcare_memory_heap_total_bytes ${memoryUsage.heapTotal}

# HELP berthcare_memory_rss_bytes Resident set size in bytes
# TYPE berthcare_memory_rss_bytes gauge
berthcare_memory_rss_bytes ${memoryUsage.rss}
  `.trim();

  res.set('Content-Type', 'text/plain');
  res.send(metricsText);
}
