/**
 * FCM Service
 * Firebase Cloud Messaging integration for push notifications
 */

import { getMessaging, isFCMConfigured } from '../../config/fcm';
import { logger } from '../../shared/utils/logger';
import { NotificationPriority, PushNotificationToken } from './types';

export class FCMService {
  /**
   * Send push notification to a single device
   */
  async sendToToken(
    token: PushNotificationToken,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    priority: NotificationPriority = 'normal'
  ): Promise<{ success: boolean; error?: string }> {
    if (!isFCMConfigured()) {
      logger.warn('FCM not configured, skipping notification');
      return { success: false, error: 'FCM not configured' };
    }

    try {
      const messaging = getMessaging();
      const message = this.buildMessage(token, title, body, data, priority);

      await messaging.send(message);

      logger.info(`Push notification sent successfully to device ${token.device_id}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to send push notification to device ${token.device_id}:`, error);

      // Handle specific FCM errors
      const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : null;
      if (
        errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/registration-token-not-registered'
      ) {
        return {
          success: false,
          error: 'Invalid or unregistered token',
        };
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToMultipleTokens(
    tokens: PushNotificationToken[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
    priority: NotificationPriority = 'normal'
  ): Promise<{
    successCount: number;
    failureCount: number;
    invalidTokens: string[];
  }> {
    if (!isFCMConfigured()) {
      logger.warn('FCM not configured, skipping notifications');
      return {
        successCount: 0,
        failureCount: tokens.length,
        invalidTokens: [],
      };
    }

    if (tokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
      };
    }

    try {
      const messaging = getMessaging();
      const messages = tokens.map((token) => this.buildMessage(token, title, body, data, priority));

      // Send all messages in batch
      const response = await messaging.sendEach(messages);

      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const errorCode = resp.error.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(tokens[idx].fcm_token);
          }
        }
      });

      logger.info(
        `Batch notification sent: ${response.successCount} succeeded, ${response.failureCount} failed`
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      };
    } catch (error) {
      logger.error('Failed to send batch notifications:', error);
      return {
        successCount: 0,
        failureCount: tokens.length,
        invalidTokens: [],
      };
    }
  }

  /**
   * Build FCM message based on platform
   */
  private buildMessage(
    token: PushNotificationToken,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    priority: NotificationPriority = 'normal'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message: any = {
      token: token.fcm_token,
      notification: {
        title,
        body,
      },
    };

    // Convert data to string values (FCM requirement)
    if (data) {
      message.data = Object.entries(data).reduce(
        (acc, [key, value]) => {
          acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
          return acc;
        },
        {} as Record<string, string>
      );
    }

    // Platform-specific configuration
    switch (token.platform) {
      case 'android':
        message.android = {
          priority: priority === 'high' ? ('high' as const) : ('normal' as const),
          notification: {
            sound: 'default',
            channelId: 'berthcare_notifications',
          },
        };
        break;

      case 'ios':
        message.apns = {
          payload: {
            aps: {
              alert: {
                title,
                body,
              },
              sound: 'default',
              badge: 1,
              'content-available': priority === 'high' ? 1 : 0,
            },
          },
        };
        break;

      case 'web':
        message.webpush = {
          notification: {
            title,
            body,
            icon: '/icon-192x192.png',
          },
        };
        break;
    }

    return message;
  }

  /**
   * Send topic-based notification (for broadcast messages)
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    if (!isFCMConfigured()) {
      logger.warn('FCM not configured, skipping topic notification');
      return { success: false, error: 'FCM not configured' };
    }

    try {
      const messaging = getMessaging();

      const message: {
        topic: string;
        notification: { title: string; body: string };
        data?: Record<string, string>;
      } = {
        topic,
        notification: {
          title,
          body,
        },
      };

      if (data) {
        message.data = Object.entries(data).reduce(
          (acc, [key, value]) => {
            acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
            return acc;
          },
          {} as Record<string, string>
        );
      }

      await messaging.send(message);

      logger.info(`Topic notification sent successfully to topic: ${topic}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to send topic notification to ${topic}:`, error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
