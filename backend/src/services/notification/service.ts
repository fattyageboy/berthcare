/**
 * Notification Service
 * Main service for managing notifications and push delivery
 */

import { Pool } from 'pg';
import { NotificationRepository } from './repository';
import { FCMService } from './fcm.service';
import { logger } from '../../shared/utils/logger';
import {
  SendNotificationRequest,
  NotificationDeliveryResult,
  RegisterTokenRequest,
  UpdatePreferencesRequest,
  Notification,
  NotificationPreferences,
  NotificationType,
  PushNotificationToken,
} from './types';

export class NotificationService {
  private repository: NotificationRepository;
  private fcmService: FCMService;

  constructor(pool: Pool) {
    this.repository = new NotificationRepository(pool);
    this.fcmService = new FCMService();
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(
    userId: string,
    tokenData: RegisterTokenRequest
  ): Promise<PushNotificationToken> {
    try {
      const token = await this.repository.registerToken(userId, tokenData);
      logger.info(`Device token registered for user ${userId}, device ${tokenData.device_id}`);
      return token;
    } catch (error) {
      logger.error('Failed to register device token:', error);
      throw new Error('Failed to register device token');
    }
  }

  /**
   * Send notification to a user
   */
  async sendNotification(request: SendNotificationRequest): Promise<NotificationDeliveryResult> {
    try {
      // Check user preferences
      const preferences = await this.repository.getPreferences(request.user_id);
      if (!this.shouldSendNotification(request.type, preferences)) {
        logger.info(`Notification blocked by user preferences: ${request.type}`);
        return {
          success: false,
          notification_id: '',
          tokens_sent: 0,
          tokens_failed: 0,
          errors: ['Notification blocked by user preferences'],
        };
      }

      // Create notification record
      const notification = await this.repository.createNotification({
        user_id: request.user_id,
        type: request.type,
        title: request.title,
        body: request.body,
        data: request.data,
        priority: request.priority || 'normal',
        status: 'pending',
      });

      // Get active tokens for user
      const tokens = await this.repository.getActiveTokensByUserId(request.user_id);

      if (tokens.length === 0) {
        await this.repository.updateNotificationStatus(
          notification.id,
          'failed',
          'No active device tokens'
        );
        return {
          success: false,
          notification_id: notification.id,
          tokens_sent: 0,
          tokens_failed: 0,
          errors: ['No active device tokens'],
        };
      }

      // Send push notifications
      const result = await this.fcmService.sendToMultipleTokens(
        tokens,
        request.title,
        request.body,
        request.data,
        request.priority
      );

      // Deactivate invalid tokens
      for (const invalidToken of result.invalidTokens) {
        await this.repository.deactivateTokenByFCM(invalidToken);
      }

      // Update notification status
      if (result.successCount > 0) {
        await this.repository.updateNotificationStatus(notification.id, 'sent');
      } else {
        await this.repository.updateNotificationStatus(
          notification.id,
          'failed',
          'All tokens failed'
        );
      }

      // Update last used timestamp for successful tokens
      for (const token of tokens) {
        if (!result.invalidTokens.includes(token.fcm_token)) {
          await this.repository.updateTokenLastUsed(token.id);
        }
      }

      logger.info(
        `Notification sent: ${result.successCount} succeeded, ${result.failureCount} failed`
      );

      return {
        success: result.successCount > 0,
        notification_id: notification.id,
        tokens_sent: result.successCount,
        tokens_failed: result.failureCount,
      };
    } catch (error) {
      logger.error('Failed to send notification:', error);
      throw new Error('Failed to send notification');
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    return this.repository.getNotificationsByUserId(userId, limit, offset);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.repository.getUnreadCount(userId);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.repository.markAsRead(notificationId);
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    let preferences = await this.repository.getPreferences(userId);

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await this.repository.upsertPreferences(userId, {
        visit_reminders_enabled: true,
        team_alerts_enabled: true,
        sync_updates_enabled: true,
        family_updates_enabled: true,
      });
    }

    return preferences;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: UpdatePreferencesRequest
  ): Promise<NotificationPreferences> {
    return this.repository.upsertPreferences(userId, preferences);
  }

  /**
   * Deactivate device token
   */
  async deactivateToken(tokenId: string): Promise<void> {
    await this.repository.deactivateToken(tokenId);
  }

  /**
   * Check if notification should be sent based on preferences
   */
  private shouldSendNotification(
    type: NotificationType,
    preferences: NotificationPreferences | null
  ): boolean {
    if (!preferences) {
      return true; // Send if no preferences set
    }

    // Check if notification type is enabled
    switch (type) {
      case 'visit_reminder':
        if (!preferences.visit_reminders_enabled) return false;
        break;
      case 'team_alert':
        if (!preferences.team_alerts_enabled) return false;
        break;
      case 'sync_update':
        if (!preferences.sync_updates_enabled) return false;
        break;
      case 'family_update':
        if (!preferences.family_updates_enabled) return false;
        break;
    }

    // Check quiet hours
    if (preferences.quiet_hours_start && preferences.quiet_hours_end) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const isInQuietHours =
        preferences.quiet_hours_start <= preferences.quiet_hours_end
          ? // Normal range (e.g., 22:00 to 23:00)
            currentTime >= preferences.quiet_hours_start &&
            currentTime <= preferences.quiet_hours_end
          : // Spans midnight (e.g., 22:00 to 08:00)
            currentTime >= preferences.quiet_hours_start ||
            currentTime <= preferences.quiet_hours_end;

      if (isInQuietHours) {
        // Don't block high-priority team alerts during quiet hours
        if (type !== 'team_alert') {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Cleanup old notifications
   */
  async cleanupOldNotifications(daysOld: number = 90): Promise<number> {
    return this.repository.deleteOldNotifications(daysOld);
  }
}
