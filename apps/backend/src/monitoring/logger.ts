/**
 * BerthCare Structured Logger
 * Philosophy: "Obsess over every detail" - Comprehensive logging for debugging and monitoring
 */

export interface LogContext {
  requestId?: string;
  userId?: string;
  clientId?: string;
  visitId?: string;
  duration?: number;
  [key: string]: unknown;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private serviceName: string;
  private environment: string;

  constructor() {
    this.serviceName = 'berthcare-api';
    this.environment = process.env.NODE_ENV || 'development';
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: this.serviceName,
      environment: this.environment,
      message,
      ...context,
    };

    return JSON.stringify(logEntry);
  }

  debug(message: string, context?: LogContext) {
    if (this.environment === 'development') {
      console.log(this.formatLog('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatLog('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog('warn', message, context));
  }

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error?.message,
      stack: error?.stack,
      errorName: error?.name,
    };
    console.error(this.formatLog('error', message, errorContext));
  }

  // Specialized logging methods for common operations
  apiRequest(method: string, path: string, context: LogContext) {
    this.info(`API Request: ${method} ${path}`, {
      ...context,
      type: 'api_request',
      method,
      path,
    });
  }

  apiResponse(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context: LogContext
  ) {
    this.info(`API Response: ${method} ${path} - ${statusCode}`, {
      ...context,
      type: 'api_response',
      method,
      path,
      statusCode,
      duration,
    });
  }

  syncOperation(operation: string, batchSize: number, duration: number, context: LogContext) {
    this.info(`Sync Operation: ${operation}`, {
      ...context,
      type: 'sync_operation',
      operation,
      batchSize,
      duration,
    });
  }

  databaseQuery(query: string, duration: number, context?: LogContext) {
    this.debug(`Database Query`, {
      ...context,
      type: 'database_query',
      query: query.substring(0, 100), // Truncate long queries
      duration,
    });
  }

  cacheOperation(operation: 'hit' | 'miss' | 'set', key: string, context?: LogContext) {
    this.debug(`Cache ${operation}: ${key}`, {
      ...context,
      type: 'cache_operation',
      operation,
      key,
    });
  }

  alertSent(alertType: string, recipientId: string, success: boolean, context?: LogContext) {
    this.info(`Alert Sent: ${alertType}`, {
      ...context,
      type: 'alert',
      alertType,
      recipientId,
      success,
    });
  }
}

export const logger = new Logger();
