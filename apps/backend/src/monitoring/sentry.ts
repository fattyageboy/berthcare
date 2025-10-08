/**
 * BerthCare Sentry Error Tracking Integration
 * Philosophy: "Obsess over every detail" - Catch and track every error
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { logger } from './logger';

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
}

class SentryMonitoring {
  private initialized: boolean = false;

  initialize(config: SentryConfig) {
    if (this.initialized) {
      logger.warn('Sentry already initialized');
      return;
    }

    if (!config.dsn) {
      logger.warn('Sentry DSN not provided, error tracking disabled');
      return;
    }

    try {
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        release: config.release || `berthcare-api@${process.env.npm_package_version || '1.0.0'}`,

        // Performance Monitoring
        tracesSampleRate: config.tracesSampleRate,
        profilesSampleRate: config.profilesSampleRate,

        integrations: [
          new ProfilingIntegration(),
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app: undefined }),
        ],

        // Filter out sensitive data
        beforeSend(event) {
          // Remove sensitive headers
          if (event.request?.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }

          // Remove sensitive query parameters
          if (event.request?.query_string) {
            const queryString = event.request.query_string;
            const sensitiveParams = ['password', 'token', 'secret'];
            const hasSensitiveParam = sensitiveParams.some(
              (param) => typeof queryString === 'string' && queryString.includes(param)
            );
            if (hasSensitiveParam) {
              event.request.query_string = '[FILTERED]';
            }
          }

          return event;
        },
      });

      this.initialized = true;
      logger.info('Sentry initialized successfully', {
        environment: config.environment,
        release: config.release,
      });
    } catch (error) {
      logger.error('Failed to initialize Sentry', error as Error);
    }
  }

  // Capture exceptions with context
  captureException(error: Error, context?: Record<string, unknown>) {
    if (!this.initialized) {
      logger.error('Sentry not initialized, logging error locally', error);
      return;
    }

    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value as Record<string, unknown>);
        });
      }
      Sentry.captureException(error);
    });
  }

  // Capture messages (non-error events)
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: Record<string, unknown>
  ) {
    if (!this.initialized) {
      logger.info(message, context);
      return;
    }

    Sentry.withScope((scope) => {
      scope.setLevel(level);
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value as Record<string, unknown>);
        });
      }
      Sentry.captureMessage(message);
    });
  }

  // Set user context for error tracking
  setUser(userId: string, email?: string, role?: string) {
    if (!this.initialized) return;

    Sentry.setUser({
      id: userId,
      email,
      role,
    });
  }

  // Clear user context (on logout)
  clearUser() {
    if (!this.initialized) return;
    Sentry.setUser(null);
  }

  // Add breadcrumb for debugging
  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
    if (!this.initialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  }

  // Start a transaction for performance monitoring
  startTransaction(name: string, op: string) {
    if (!this.initialized) return null;

    return Sentry.startTransaction({
      name,
      op,
    });
  }

  // Express middleware for request tracking
  getRequestHandler() {
    if (!this.initialized) {
      return (_req: unknown, _res: unknown, next: () => void) => next();
    }
    return Sentry.Handlers.requestHandler();
  }

  // Express middleware for error tracking
  getErrorHandler() {
    if (!this.initialized) {
      return (err: unknown, _req: unknown, _res: unknown, next: (err: unknown) => void) =>
        next(err);
    }
    return Sentry.Handlers.errorHandler();
  }

  // Graceful shutdown
  async close(timeout: number = 2000) {
    if (!this.initialized) return;

    try {
      await Sentry.close(timeout);
      logger.info('Sentry closed successfully');
    } catch (error) {
      logger.error('Error closing Sentry', error as Error);
    }
  }
}

export const sentry = new SentryMonitoring();
