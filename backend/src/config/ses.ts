/**
 * Amazon SES Configuration
 * Initializes AWS SES client for email sending
 */

import { SESClient } from '@aws-sdk/client-ses';
import { logger } from '../shared/utils/logger';

let sesClient: SESClient | null = null;

/**
 * Initialize AWS SES Client
 */
export function initializeSES(): SESClient {
  if (sesClient) {
    return sesClient;
  }

  try {
    const region = process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.AWS_SES_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      logger.warn('AWS SES credentials not configured. Email sending will be disabled.');
      throw new Error('SES not configured');
    }

    sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    logger.info(`AWS SES initialized successfully in region: ${region}`);
    return sesClient;
  } catch (error) {
    logger.error('Failed to initialize AWS SES:', error);
    throw error;
  }
}

/**
 * Get SES Client instance
 */
export function getSESClient(): SESClient {
  if (!sesClient) {
    initializeSES();
  }

  if (!sesClient) {
    throw new Error('SES not initialized');
  }

  return sesClient;
}

/**
 * Check if SES is configured and available
 */
export function isSESConfigured(): boolean {
  const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.AWS_SES_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  return !!(accessKeyId && secretAccessKey);
}

/**
 * Get configured sender email address
 */
export function getSenderEmail(): string {
  return process.env.AWS_SES_FROM_EMAIL || 'noreply@berthcare.com';
}

/**
 * Get configured sender name
 */
export function getSenderName(): string {
  return process.env.AWS_SES_FROM_NAME || 'BerthCare';
}
