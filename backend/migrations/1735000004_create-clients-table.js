/**
 * Migration: Create clients table
 * Clients (patients) receiving home care services
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('clients', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    client_number: {
      type: 'varchar(50)',
      notNull: true,
      unique: true,
    },
    first_name: {
      type: 'varchar(100)',
      notNull: true,
    },
    last_name: {
      type: 'varchar(100)',
      notNull: true,
    },
    date_of_birth: {
      type: 'date',
      notNull: true,
    },
    gender: {
      type: 'varchar(20)',
    },
    address: {
      type: 'jsonb',
      notNull: true,
    },
    emergency_contact: {
      type: 'jsonb',
    },
    primary_diagnosis: {
      type: 'text',
    },
    allergies: {
      type: 'text[]',
    },
    medications: {
      type: 'jsonb',
    },
    care_level: {
      type: 'care_level_enum',
      notNull: true,
    },
    organization_id: {
      type: 'uuid',
      references: 'organizations',
      onDelete: 'SET NULL',
    },
    status: {
      type: 'client_status',
      notNull: true,
      default: 'active',
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
  pgm.createIndex('clients', 'organization_id', { name: 'idx_clients_organization' });
  pgm.createIndex('clients', 'status', { name: 'idx_clients_status' });
  pgm.createIndex('clients', 'care_level', { name: 'idx_clients_care_level' });
  pgm.createIndex('clients', 'client_number');

  // Add comments for documentation
  pgm.sql(`
    COMMENT ON TABLE clients IS 'Clients (patients) receiving home care services';
    COMMENT ON COLUMN clients.client_number IS 'Unique identifier for the client';
    COMMENT ON COLUMN clients.address IS 'Client home address as JSON object';
    COMMENT ON COLUMN clients.emergency_contact IS 'Emergency contact information as JSON object';
    COMMENT ON COLUMN clients.allergies IS 'Array of known allergies';
    COMMENT ON COLUMN clients.medications IS 'Current medications as JSON object';
    COMMENT ON COLUMN clients.care_level IS 'Level of care required: level_1 through level_4, or palliative';
    COMMENT ON COLUMN clients.status IS 'Client status: active, discharged, or deceased';
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('clients');
};
