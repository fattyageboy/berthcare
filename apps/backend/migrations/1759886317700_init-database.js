/**
 * Initial Database Setup
 *
 * Creates the foundational database structure for BerthCare:
 * - UUID extension for primary keys
 * - Timestamp functions for audit trails
 * - Basic indexes for performance
 *
 * Philosophy: "Simplicity is the ultimate sophistication"
 * Reference: BerthCare Architecture Blueprint - Data Layer
 */

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Enable UUID extension for primary keys
  pgm.createExtension('pgcrypto', {
    ifNotExists: true,
  });

  // Create function to automatically update updated_at timestamp
  pgm.createFunction(
    'update_updated_at_column',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
      NEW.updated_at = current_timestamp;
      RETURN NEW;
    END;
    `
  );

  pgm.sql(
    "COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at column on row modification'"
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop the update function
  pgm.dropFunction('update_updated_at_column', [], {
    ifExists: true,
    cascade: true,
  });

  // Drop UUID extension (only if no other objects depend on it)
  pgm.dropExtension('pgcrypto', {
    ifExists: true,
    cascade: false,
  });
};
