/**
 * Sentry Configuration for Error Tracking and Performance Monitoring
 * 
 * Features:
 * - Automatic error capture with stack traces
 * - Performance monitoring (10% sample rate)
 * - Request/response tracking
 * - User context attachment
 * - Release tracking
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Express } from 'express';

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
}

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry(config: SentryConfig): void {
  if (!config.dsn) {
    console.warn('⚠️  Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    
    // Performance Monitoring
    tracesSampleRate: config.tracesSampleRate || 0.1, // 10% of transactions
    profilesSampleRate: config.profilesSampleRate || 0.1, // 10% of transactions
    
    // Integrations
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new ProfilingIntegration(),
    ],
    
    // Filter sensitive data
    beforeSend(event: Sentry.Event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      
      // Remove sensitive query parameters
      if (event.request?.query_string && typeof event.request.query_string === 'string') {
        event.request.query_string = event.request.query_string
          .replace(/password=[^&]*/gi, 'password=[REDACTED]')
          .replace(/token=[^&]*/gi, 'token=[REDACTED]');
      }
      
      return event;
    },
  });

  console.warn('✅ Sentry initialized');
  console.warn(`   Environment: ${config.environment}`);
  console.warn(`   Release: ${config.release || 'not set'}`);
  console.warn(`   Traces Sample Rate: ${(config.tracesSampleRate || 0.1) * 100}%`);
}

/**
 * Configure Sentry middleware for Express
 */
export function configureSentryMiddleware(app: Express): void {
  // Request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler());
  
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());
}

/**
 * Configure Sentry error handler for Express
 * Must be added after all routes but before other error handlers
 */
export function configureSentryErrorHandler(app: Express): void {
  app.use(Sentry.Handlers.errorHandler({
    shouldHandleError(_error: Error) {
      // Capture all errors
      return true;
    },
  }));
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(userId: string, email?: string, role?: string): void {
  Sentry.setUser({
    id: userId,
    email,
    role,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message manually
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
): void {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string): Sentry.Transaction {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Flush Sentry events (useful for graceful shutdown)
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  return Sentry.close(timeout);
}
