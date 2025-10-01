/**
 * Migration: Create care_plans table
 * Care plans defining goals, interventions, and frequency for client care
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('care_plans', {
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
    version: {
      type: 'integer',
      notNull: true,
      default: 1,
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    goals: {
      type: 'text[]',
    },
    interventions: {
      type: 'jsonb',
      notNull: true,
    },
    frequency: {
      type: 'jsonb',
      notNull: true,
    },
    start_date: {
      type: 'date',
      notNull: true,
    },
    end_date: {
      type: 'date',
    },
    created_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    approved_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    status: {
      type: 'care_plan_status',
      notNull: true,
      default: 'draft',
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
  pgm.createIndex('care_plans', 'client_id', { name: 'idx_care_plans_client' });
  pgm.createIndex('care_plans', 'status', { name: 'idx_care_plans_status' });

  // Create unique index for client_id + version
  pgm.createIndex('care_plans', ['client_id', 'version'], {
    name: 'idx_care_plans_client_version',
    unique: true,
  });

  // Add check constraint for dates
  pgm.sql(`
    ALTER TABLE care_plans ADD CONSTRAINT care_plans_dates_check
    CHECK (end_date IS NULL OR end_date >= start_date)
  `);

  // Add check constraint for version
  pgm.addConstraint('care_plans', 'care_plans_version_check', {
    check: 'version > 0',
  });

  // Add comments for documentation
  pgm.sql(`
    COMMENT ON TABLE care_plans IS 'Care plans defining goals, interventions, and frequency for client care';
    COMMENT ON COLUMN care_plans.version IS 'Version number for care plan revisions';
    COMMENT ON COLUMN care_plans.goals IS 'Array of care goals for the client';
    COMMENT ON COLUMN care_plans.interventions IS 'Detailed interventions as JSON object';
    COMMENT ON COLUMN care_plans.frequency IS 'Visit frequency and schedule as JSON object';
    COMMENT ON COLUMN care_plans.created_by IS 'User who created the care plan';
    COMMENT ON COLUMN care_plans.approved_by IS 'User who approved the care plan';
    COMMENT ON COLUMN care_plans.status IS 'Care plan status: draft, active, completed, or cancelled';
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('care_plans');
};
