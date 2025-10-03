/**
 * Migration: Create email_logs table
 * Tracks email delivery status and history for Amazon SES
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('email_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    recipient_email: {
      type: 'varchar(255)',
      notNull: true,
    },
    recipient_name: {
      type: 'varchar(255)',
    },
    subject: {
      type: 'varchar(500)',
      notNull: true,
    },
    type: {
      type: 'varchar(50)',
      notNull: true,
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: "'pending'",
    },
    message_id: {
      type: 'varchar(255)',
    },
    error_message: {
      type: 'text',
    },
    metadata: {
      type: 'jsonb',
    },
    sent_at: {
      type: 'timestamp',
    },
    bounced_at: {
      type: 'timestamp',
    },
    complained_at: {
      type: 'timestamp',
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

  pgm.createIndex('email_logs', 'recipient_email', { name: 'idx_email_logs_recipient' });
  pgm.createIndex('email_logs', 'type', { name: 'idx_email_logs_type' });
  pgm.createIndex('email_logs', 'status', { name: 'idx_email_logs_status' });
  pgm.createIndex('email_logs', 'message_id', { name: 'idx_email_logs_message_id' });
  pgm.createIndex('email_logs', 'created_at', { name: 'idx_email_logs_created' });

  pgm.createTable('email_bounces', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
    },
    bounce_type: {
      type: 'varchar(50)',
      notNull: true,
    },
    bounce_subtype: {
      type: 'varchar(50)',
    },
    diagnostic_code: {
      type: 'text',
    },
    is_suppressed: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    bounce_count: {
      type: 'integer',
      notNull: true,
      default: 1,
    },
    first_bounced_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    last_bounced_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
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

  pgm.createIndex('email_bounces', 'email', { name: 'idx_email_bounces_email', unique: true });
  pgm.createIndex('email_bounces', 'is_suppressed', { name: 'idx_email_bounces_suppressed' });

  pgm.sql(\`
    COMMENT ON TABLE email_logs IS 'Email delivery history and tracking';
    COMMENT ON TABLE email_bounces IS 'Email bounce tracking and suppression list';
  \`);
};

exports.down = (pgm) => {
  pgm.dropTable('email_bounces');
  pgm.dropTable('email_logs');
};
