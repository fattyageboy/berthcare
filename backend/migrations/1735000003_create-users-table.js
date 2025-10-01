/**
 * Migration: Create users table
 * User accounts for caregivers, coordinators, supervisors, admins, and family members
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    phone: {
      type: 'varchar(20)',
    },
    first_name: {
      type: 'varchar(100)',
      notNull: true,
    },
    last_name: {
      type: 'varchar(100)',
      notNull: true,
    },
    role: {
      type: 'user_role',
      notNull: true,
    },
    organization_id: {
      type: 'uuid',
      references: 'organizations',
      onDelete: 'SET NULL',
    },
    status: {
      type: 'user_status',
      notNull: true,
      default: 'active',
    },
    last_login_at: {
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

  // Create indexes as specified in architecture
  pgm.createIndex('users', 'organization_id', { name: 'idx_users_organization' });
  pgm.createIndex('users', 'role', { name: 'idx_users_role' });
  pgm.createIndex('users', 'email', { name: 'idx_users_email' });
  pgm.createIndex('users', 'status');

  // Add comments for documentation
  pgm.sql(`
    COMMENT ON TABLE users IS 'User accounts for caregivers, coordinators, supervisors, admins, and family members';
    COMMENT ON COLUMN users.role IS 'User role: nurse, psw, coordinator, supervisor, admin, or family_member';
    COMMENT ON COLUMN users.status IS 'Account status: active, inactive, or suspended';
    COMMENT ON COLUMN users.last_login_at IS 'Timestamp of most recent successful login';
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
