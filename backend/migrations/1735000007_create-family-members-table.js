/**
 * Migration: Create family_members table
 * Junction table linking family members (users) to clients with access controls
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('family_members', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    client_id: {
      type: 'uuid',
      notNull: true,
      references: 'clients',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    relationship: {
      type: 'varchar(50)',
      notNull: true,
    },
    access_level: {
      type: 'family_access_level',
      notNull: true,
      default: 'basic',
    },
    notification_preferences: {
      type: 'jsonb',
      notNull: true,
      default: '{}',
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

  // Create indexes as specified in architecture
  pgm.createIndex('family_members', 'client_id', { name: 'idx_family_members_client' });
  pgm.createIndex('family_members', 'user_id', { name: 'idx_family_members_user' });

  // Create unique index for client_id + user_id (prevent duplicate relationships)
  pgm.createIndex('family_members', ['client_id', 'user_id'], {
    name: 'idx_family_members_client_user',
    unique: true,
  });

  // Add comments for documentation
  pgm.sql(`
    COMMENT ON TABLE family_members IS 'Junction table linking family members (users) to clients with access controls';
    COMMENT ON COLUMN family_members.relationship IS 'Relationship to client (e.g., spouse, child, sibling, power of attorney)';
    COMMENT ON COLUMN family_members.access_level IS 'Information access level: basic, detailed, or emergency_only';
    COMMENT ON COLUMN family_members.notification_preferences IS 'Notification settings as JSON object';
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('family_members');
};
