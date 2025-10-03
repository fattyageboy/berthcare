/**
 * Migration: Create push_notification_tokens table
 * Stores FCM device tokens for push notifications to iOS/Android devices
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create push notification tokens table
  pgm.createTable('push_notification_tokens', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    device_id: {
      type: 'varchar(255)',
      notNull: true,
      comment: 'Unique device identifier',
    },
    fcm_token: {
      type: 'text',
      notNull: true,
      comment: 'Firebase Cloud Messaging token',
    },
    platform: {
      type: 'varchar(20)',
      notNull: true,
      comment: 'Platform: ios, android, web',
    },
    app_version: {
      type: 'varchar(50)',
      comment: 'App version for debugging',
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
      comment: 'Whether token is currently active',
    },
    last_used_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
      comment: 'Last time notification was sent to this token',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create indexes for efficient lookups
  pgm.createIndex('push_notification_tokens', 'user_id', {
    name: 'idx_push_tokens_user',
  });
  pgm.createIndex('push_notification_tokens', ['device_id', 'user_id'], {
    name: 'idx_push_tokens_device_user',
    unique: true,
  });
  pgm.createIndex('push_notification_tokens', 'fcm_token', {
    name: 'idx_push_tokens_fcm',
  });
  pgm.createIndex('push_notification_tokens', 'is_active', {
    name: 'idx_push_tokens_active',
  });

  // Create notifications table for tracking sent notifications
  pgm.createTable('notifications', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    type: {
      type: 'varchar(50)',
      notNull: true,
      comment: 'Notification type: visit_reminder, team_alert, sync_update, family_update',
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    body: {
      type: 'text',
      notNull: true,
    },
    data: {
      type: 'jsonb',
      comment: 'Additional data payload',
    },
    priority: {
      type: 'varchar(20)',
      notNull: true,
      default: "'normal'",
      comment: 'Priority: high, normal, low',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: "'pending'",
      comment: 'Status: pending, sent, failed, read',
    },
    sent_at: {
      type: 'timestamp',
      comment: 'When notification was sent',
    },
    read_at: {
      type: 'timestamp',
      comment: 'When notification was read by user',
    },
    error_message: {
      type: 'text',
      comment: 'Error message if delivery failed',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create indexes for notifications
  pgm.createIndex('notifications', 'user_id', {
    name: 'idx_notifications_user',
  });
  pgm.createIndex('notifications', 'type', {
    name: 'idx_notifications_type',
  });
  pgm.createIndex('notifications', 'status', {
    name: 'idx_notifications_status',
  });
  pgm.createIndex('notifications', 'created_at', {
    name: 'idx_notifications_created',
  });

  // Create notification preferences table
  pgm.createTable('notification_preferences', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
      unique: true,
    },
    visit_reminders_enabled: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    team_alerts_enabled: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    sync_updates_enabled: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    family_updates_enabled: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    quiet_hours_start: {
      type: 'time',
      comment: 'Start of quiet hours (no notifications)',
    },
    quiet_hours_end: {
      type: 'time',
      comment: 'End of quiet hours',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('notification_preferences', 'user_id', {
    name: 'idx_notification_prefs_user',
  });

  // Add table comments
  pgm.sql(`
    COMMENT ON TABLE push_notification_tokens IS 'FCM device tokens for push notifications';
    COMMENT ON TABLE notifications IS 'Notification history and delivery tracking';
    COMMENT ON TABLE notification_preferences IS 'User notification preferences and settings';
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('notification_preferences');
  pgm.dropTable('notifications');
  pgm.dropTable('push_notification_tokens');
};
