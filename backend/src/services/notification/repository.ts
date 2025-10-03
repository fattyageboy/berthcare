/**
 * Notification Repository
 * Database operations for notifications, tokens, and preferences
 */

import { Pool } from 'pg';
import {
  PushNotificationToken,
  Notification,
  NotificationPreferences,
  RegisterTokenRequest,
  UpdatePreferencesRequest,
  NotificationStatus,
} from './types';

export class NotificationRepository {
  constructor(private pool: Pool) {}

  /**
   * Register or update FCM token for a device
   */
  async registerToken(
    userId: string,
    tokenData: RegisterTokenRequest
  ): Promise<PushNotificationToken> {
    const query = `
      INSERT INTO push_notification_tokens (
        user_id, device_id, fcm_token, platform, app_version, is_active
      )
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT (device_id, user_id)
      DO UPDATE SET
        fcm_token = EXCLUDED.fcm_token,
        platform = EXCLUDED.platform,
        app_version = EXCLUDED.app_version,
        is_active = true,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      userId,
      tokenData.device_id,
      tokenData.fcm_token,
      tokenData.platform,
      tokenData.app_version || null,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get all active tokens for a user
   */
  async getActiveTokensByUserId(userId: string): Promise<PushNotificationToken[]> {
    const query = `
      SELECT * FROM push_notification_tokens
      WHERE user_id = $1 AND is_active = true
      ORDER BY last_used_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Deactivate a token (when device unregisters or token is invalid)
   */
  async deactivateToken(tokenId: string): Promise<void> {
    const query = `
      UPDATE push_notification_tokens
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
    `;

    await this.pool.query(query, [tokenId]);
  }

  /**
   * Deactivate token by FCM token string
   */
  async deactivateTokenByFCM(fcmToken: string): Promise<void> {
    const query = `
      UPDATE push_notification_tokens
      SET is_active = false, updated_at = NOW()
      WHERE fcm_token = $1
    `;

    await this.pool.query(query, [fcmToken]);
  }

  /**
   * Update last used timestamp for a token
   */
  async updateTokenLastUsed(tokenId: string): Promise<void> {
    const query = `
      UPDATE push_notification_tokens
      SET last_used_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `;

    await this.pool.query(query, [tokenId]);
  }

  /**
   * Create a notification record
   */
  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<Notification> {
    const query = `
      INSERT INTO notifications (
        user_id, type, title, body, data, priority, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      notification.user_id,
      notification.type,
      notification.title,
      notification.body,
      notification.data ? JSON.stringify(notification.data) : null,
      notification.priority,
      notification.status,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update notification status
   */
  async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    errorMessage?: string
  ): Promise<void> {
    const query = `
      UPDATE notifications
      SET status = $1,
          sent_at = CASE WHEN $1 = 'sent' THEN NOW() ELSE sent_at END,
          error_message = $2,
          updated_at = NOW()
      WHERE id = $3
    `;

    await this.pool.query(query, [status, errorMessage || null, notificationId]);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const query = `
      UPDATE notifications
      SET status = 'read', read_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND status != 'read'
    `;

    await this.pool.query(query, [notificationId]);
  }

  /**
   * Get notifications for a user
   */
  async getNotificationsByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = $1 AND status != 'read'
    `;

    const result = await this.pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    const query = `
      SELECT * FROM notification_preferences
      WHERE user_id = $1
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Create or update notification preferences
   */
  async upsertPreferences(
    userId: string,
    preferences: UpdatePreferencesRequest
  ): Promise<NotificationPreferences> {
    const query = `
      INSERT INTO notification_preferences (
        user_id,
        visit_reminders_enabled,
        team_alerts_enabled,
        sync_updates_enabled,
        family_updates_enabled,
        quiet_hours_start,
        quiet_hours_end
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id)
      DO UPDATE SET
        visit_reminders_enabled = COALESCE(EXCLUDED.visit_reminders_enabled, notification_preferences.visit_reminders_enabled),
        team_alerts_enabled = COALESCE(EXCLUDED.team_alerts_enabled, notification_preferences.team_alerts_enabled),
        sync_updates_enabled = COALESCE(EXCLUDED.sync_updates_enabled, notification_preferences.sync_updates_enabled),
        family_updates_enabled = COALESCE(EXCLUDED.family_updates_enabled, notification_preferences.family_updates_enabled),
        quiet_hours_start = COALESCE(EXCLUDED.quiet_hours_start, notification_preferences.quiet_hours_start),
        quiet_hours_end = COALESCE(EXCLUDED.quiet_hours_end, notification_preferences.quiet_hours_end),
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      userId,
      preferences.visit_reminders_enabled ?? true,
      preferences.team_alerts_enabled ?? true,
      preferences.sync_updates_enabled ?? true,
      preferences.family_updates_enabled ?? true,
      preferences.quiet_hours_start || null,
      preferences.quiet_hours_end || null,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete old notifications (cleanup)
   */
  async deleteOldNotifications(daysOld: number = 90): Promise<number> {
    const query = `
      DELETE FROM notifications
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
      AND status = 'read'
    `;

    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }
}
