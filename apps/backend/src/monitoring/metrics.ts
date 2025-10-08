/**
 * BerthCare CloudWatch Metrics Publisher
 * Philosophy: "Obsess over every detail" - Track everything that matters
 */

import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { logger } from './logger';

interface MetricData {
  name: string;
  value: number;
  unit: 'Count' | 'Milliseconds' | 'Percent' | 'Bytes';
  dimensions?: Record<string, string>;
}

class MetricsPublisher {
  private client: CloudWatchClient | null;
  private namespace: string;
  private environment: string;
  private enabled: boolean;

  constructor() {
    this.namespace = 'BerthCare/API';
    this.environment = process.env.NODE_ENV || 'development';
    this.enabled = process.env.CLOUDWATCH_ENABLED === 'true';
    this.client = null;

    if (this.enabled) {
      this.client = new CloudWatchClient({
        region: process.env.AWS_REGION || 'ca-central-1',
      });
    }
  }

  private async publishMetric(metric: MetricData) {
    if (!this.enabled || !this.client) {
      logger.debug('Metrics disabled, skipping publish', { metric: metric.name });
      return;
    }

    try {
      const dimensions = [
        { Name: 'Environment', Value: this.environment },
        ...Object.entries(metric.dimensions || {}).map(([key, value]) => ({
          Name: key,
          Value: value,
        })),
      ];

      const command = new PutMetricDataCommand({
        Namespace: this.namespace,
        MetricData: [
          {
            MetricName: metric.name,
            Value: metric.value,
            Unit: metric.unit,
            Timestamp: new Date(),
            Dimensions: dimensions,
          },
        ],
      });

      await this.client.send(command);
      logger.debug('Metric published', { metric: metric.name, value: metric.value });
    } catch (error) {
      logger.error('Failed to publish metric', error as Error, { metric: metric.name });
    }
  }

  // API Metrics
  async recordApiLatency(endpoint: string, method: string, latency: number) {
    await this.publishMetric({
      name: 'ApiLatency',
      value: latency,
      unit: 'Milliseconds',
      dimensions: { Endpoint: endpoint, Method: method },
    });
  }

  async recordApiError(endpoint: string, method: string, errorType: string) {
    await this.publishMetric({
      name: 'ApiError',
      value: 1,
      unit: 'Count',
      dimensions: { Endpoint: endpoint, Method: method, ErrorType: errorType },
    });
  }

  async recordApiRequest(endpoint: string, method: string, statusCode: number) {
    await this.publishMetric({
      name: 'ApiRequest',
      value: 1,
      unit: 'Count',
      dimensions: { Endpoint: endpoint, Method: method, StatusCode: statusCode.toString() },
    });
  }

  // Sync Metrics
  async recordSyncBatchSize(batchSize: number) {
    await this.publishMetric({
      name: 'SyncBatchSize',
      value: batchSize,
      unit: 'Count',
    });
  }

  async recordSyncDuration(duration: number) {
    await this.publishMetric({
      name: 'SyncDuration',
      value: duration,
      unit: 'Milliseconds',
    });
  }

  async recordSyncConflict(entityType: string) {
    await this.publishMetric({
      name: 'SyncConflict',
      value: 1,
      unit: 'Count',
      dimensions: { EntityType: entityType },
    });
  }

  // Database Metrics
  async recordDatabaseQueryDuration(queryType: string, duration: number) {
    await this.publishMetric({
      name: 'DatabaseQueryDuration',
      value: duration,
      unit: 'Milliseconds',
      dimensions: { QueryType: queryType },
    });
  }

  async recordDatabaseConnectionPoolSize(size: number) {
    await this.publishMetric({
      name: 'DatabaseConnectionPoolSize',
      value: size,
      unit: 'Count',
    });
  }

  // Cache Metrics
  async recordCacheHit(cacheType: string) {
    await this.publishMetric({
      name: 'CacheHit',
      value: 1,
      unit: 'Count',
      dimensions: { CacheType: cacheType },
    });
  }

  async recordCacheMiss(cacheType: string) {
    await this.publishMetric({
      name: 'CacheMiss',
      value: 1,
      unit: 'Count',
      dimensions: { CacheType: cacheType },
    });
  }

  // Alert Metrics
  async recordAlertSent(alertType: string, success: boolean) {
    await this.publishMetric({
      name: 'AlertSent',
      value: 1,
      unit: 'Count',
      dimensions: { AlertType: alertType, Success: success.toString() },
    });
  }

  async recordAlertLatency(alertType: string, latency: number) {
    await this.publishMetric({
      name: 'AlertLatency',
      value: latency,
      unit: 'Milliseconds',
      dimensions: { AlertType: alertType },
    });
  }

  // Error Rate Calculation (for alarms)
  async recordErrorRate(rate: number) {
    await this.publishMetric({
      name: 'ErrorRate',
      value: rate,
      unit: 'Percent',
    });
  }
}

export const metrics = new MetricsPublisher();
