/**
 * Migration: Create device_tokens table
 * Device binding for security - ties refresh tokens to specific devices
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('device_tokens', {
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
    },
    device_type: {
      type: 'varchar(50)',
      notNull: true,
    },
    refresh_token_hash: {
      type: 'varchar(255)',
      notNull: true,
    },
    expires_at: {
      type: 'timestamp',
      notNull: true,
    },
    last_used_at: {
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

  // Create indexes for efficient lookups
  pgm.createIndex('device_tokens', 'user_id', { name: 'idx_device_tokens_user' });
  pgm.createIndex('device_tokens', ['device_id', 'user_id'], {
    name: 'idx_device_tokens_device_user',
    unique: true
  });
  pgm.createIndex('device_tokens', 'expires_at', { name: 'idx_device_tokens_expiry' });

  // Add comments for documentation
  pgm.sql(`
    COMMENT ON TABLE device_tokens IS 'Device-bound refresh tokens for secure authentication';
    COMMENT ON COLUMN device_tokens.device_id IS 'Unique device identifier from mobile app';
    COMMENT ON COLUMN device_tokens.device_type IS 'Device type: ios, android, web';
    COMMENT ON COLUMN device_tokens.refresh_token_hash IS 'Hashed refresh token for validation';
    COMMENT ON COLUMN device_tokens.expires_at IS 'Token expiration timestamp (30 days from creation)';
    COMMENT ON COLUMN device_tokens.last_used_at IS 'Timestamp of most recent token refresh';
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('device_tokens');
};
