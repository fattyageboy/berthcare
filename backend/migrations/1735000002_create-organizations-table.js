/**
 * Migration: Create organizations table
 * Organizations table referenced by users and clients tables
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('organizations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    code: {
      type: 'varchar(50)',
      notNull: true,
      unique: true,
    },
    address: {
      type: 'jsonb',
    },
    contact_email: {
      type: 'varchar(255)',
    },
    contact_phone: {
      type: 'varchar(20)',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'active',
    },
    settings: {
      type: 'jsonb',
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

  // Create indexes
  pgm.createIndex('organizations', 'code');
  pgm.createIndex('organizations', 'status');

  // Add comments
  pgm.sql(`
    COMMENT ON TABLE organizations IS 'Healthcare organizations using the BerthCare system';
    COMMENT ON COLUMN organizations.code IS 'Unique identifier code for the organization';
    COMMENT ON COLUMN organizations.settings IS 'Organization-specific configuration settings';
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('organizations');
};
