/**
 * Migration: Create visits table
 * Documentation of home care visits with location verification and offline sync support
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('visits', {
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
      onDelete: 'SET NULL',
    },
    scheduled_start: {
      type: 'timestamp',
      notNull: true,
    },
    scheduled_end: {
      type: 'timestamp',
      notNull: true,
    },
    actual_start: {
      type: 'timestamp',
    },
    actual_end: {
      type: 'timestamp',
    },
    check_in_location: {
      type: 'point',
    },
    check_out_location: {
      type: 'point',
    },
    visit_type: {
      type: 'visit_type_enum',
      notNull: true,
    },
    status: {
      type: 'visit_status',
      notNull: true,
      default: 'scheduled',
    },
    documentation: {
      type: 'jsonb',
    },
    photos: {
      type: 'text[]',
    },
    signature_url: {
      type: 'text',
    },
    notes: {
      type: 'text',
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
    synced_at: {
      type: 'timestamp',
    },
  });

  // Create indexes as specified in architecture
  pgm.createIndex('visits', 'client_id', { name: 'idx_visits_client' });
  pgm.createIndex('visits', 'user_id', { name: 'idx_visits_user' });
  pgm.createIndex('visits', 'scheduled_start', { name: 'idx_visits_scheduled_start' });
  pgm.createIndex('visits', 'status', { name: 'idx_visits_status' });
  pgm.createIndex('visits', 'created_at', { name: 'idx_visits_created_at' });

  // Add check constraint for scheduled times
  pgm.addConstraint('visits', 'visits_scheduled_times_check', {
    check: 'scheduled_end > scheduled_start',
  });

  // Add check constraint for actual times if both are set
  pgm.sql(`
    ALTER TABLE visits ADD CONSTRAINT visits_actual_times_check
    CHECK (actual_end IS NULL OR actual_start IS NULL OR actual_end > actual_start)
  `);

  // Add comments for documentation
  pgm.sql(`
    COMMENT ON TABLE visits IS 'Documentation of home care visits with location verification and offline sync support';
    COMMENT ON COLUMN visits.check_in_location IS 'GPS coordinates at visit check-in (PostGIS POINT)';
    COMMENT ON COLUMN visits.check_out_location IS 'GPS coordinates at visit check-out (PostGIS POINT)';
    COMMENT ON COLUMN visits.visit_type IS 'Type of visit: personal_care, medication, assessment, companionship, respite, or palliative';
    COMMENT ON COLUMN visits.status IS 'Visit status: scheduled, in_progress, completed, missed, or cancelled';
    COMMENT ON COLUMN visits.documentation IS 'Visit documentation including vital signs, activities, observations (JSON)';
    COMMENT ON COLUMN visits.photos IS 'Array of photo URLs or file references';
    COMMENT ON COLUMN visits.synced_at IS 'Timestamp when visit was last synced from mobile device';
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('visits');
};
