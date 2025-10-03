/**
 * Notification Service Types
 * Type definitions for push notifications and FCM integration
 */

export type NotificationPlatform = 'ios' | 'android' | 'web';

export type NotificationType = 'visit_reminder' | 'team_alert' | 'sync_update' | 'family_update';

export type NotificationPriority = 'high' | 'normal' | 'low';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read';

export interface PushNotificationToken {
  id: string;
  user_id: string;
  device_id: string;
  fcm_token: string;
  platform: NotificationPlatform;
  app_version?: string;
  is_active: boolean;
  last_used_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority: NotificationPriority;
  status: NotificationStatus;
  sent_at?: Date;
  read_at?: Date;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  visit_reminders_enabled: boolean;
  team_alerts_enabled: boolean;
  sync_updates_enabled: boolean;
  family_updates_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: Date;
  updated_at: Date;
}

export interface RegisterTokenRequest {
  device_id: string;
  fcm_token: string;
  platform: NotificationPlatform;
  app_version?: string;
}

export interface SendNotificationRequest {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: NotificationPriority;
}

export interface UpdatePreferencesRequest {
  visit_reminders_enabled?: boolean;
  team_alerts_enabled?: boolean;
  sync_updates_enabled?: boolean;
  family_updates_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export interface FCMMessage {
  token: string;
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
  android?: {
    priority: 'high' | 'normal';
    notification?: {
      sound?: string;
      channelId?: string;
    };
  };
  apns?: {
    payload: {
      aps: {
        alert?: {
          title: string;
          body: string;
        };
        sound?: string;
        badge?: number;
        'content-available'?: number;
      };
    };
  };
  webpush?: {
    notification?: {
      title: string;
      body: string;
      icon?: string;
    };
  };
}

export interface NotificationDeliveryResult {
  success: boolean;
  notification_id: string;
  tokens_sent: number;
  tokens_failed: number;
  errors?: string[];
}
