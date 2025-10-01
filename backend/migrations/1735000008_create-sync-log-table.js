/**
 * Migration: Create sync_log table
 * Tracks data synchronization from mobile devices with conflict resolution
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('sync_log', {
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
    entity_type: {
      type: 'varchar(50)',
      notNull: true,
    },
    entity_id: {
      type: 'uuid',
      notNull: true,
    },
    operation: {
      type: 'sync_operation',
      notNull: true,
    },
    local_timestamp: {
      type: 'timestamp',
      notNull: true,
    },
    server_timestamp: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    conflict_resolved: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    resolution_strategy: {
      type: 'varchar(50)',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create indexes as specified in architecture
  pgm.createIndex('sync_log', 'user_id', { name: 'idx_sync_log_user' });
  pgm.createIndex('sync_log', ['entity_type', 'entity_id'], { name: 'idx_sync_log_entity' });
  pgm.createIndex('sync_log', 'server_timestamp', { name: 'idx_sync_log_timestamp' });
  pgm.createIndex('sync_log', 'operation');
  pgm.createIndex('sync_log', 'conflict_resolved');

  // Add comments for documentation
  pgm.sql(`
    COMMENT ON TABLE sync_log IS 'Tracks data synchronization from mobile devices with conflict resolution';
    COMMENT ON COLUMN sync_log.entity_type IS 'Type of entity being synced (e.g., visits, clients, care_plans)';
    COMMENT ON COLUMN sync_log.entity_id IS 'ID of the entity being synced';
    COMMENT ON COLUMN sync_log.operation IS 'Sync operation: create, update, or delete';
    COMMENT ON COLUMN sync_log.local_timestamp IS 'Timestamp from mobile device when change was made';
    COMMENT ON COLUMN sync_log.server_timestamp IS 'Timestamp when sync was received by server';
    COMMENT ON COLUMN sync_log.conflict_resolved IS 'Whether a conflict was detected and resolved';
    COMMENT ON COLUMN sync_log.resolution_strategy IS 'Strategy used to resolve conflict (e.g., last_write_wins, manual_review)';
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('sync_log');
};
