/**
 * BerthCare Monitoring & Observability
 * Centralized export for all monitoring utilities
 */

export { logger, LogContext, LogLevel } from './logger';
export { metrics } from './metrics';
export { sentry } from './sentry';

// Health check utilities
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: boolean;
    cache: boolean;
    storage: boolean;
  };
  version: string;
}

export function getHealthStatus(): HealthStatus {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: true, // TODO: Implement actual health checks
      cache: true,
      storage: true,
    },
    version: process.env.npm_package_version || '1.0.0',
  };
}
