/**
 * Migration: Add password_hash field to users table
 * Required for authentication functionality
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Add password_hash column to users table
  pgm.addColumn('users', {
    password_hash: {
      type: 'varchar(255)',
      notNull: false, // Allow null for initial migration, can be set to required later
    },
  });

  // Add comment for documentation
  pgm.sql(`
    COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password for authentication';
  `);
};

exports.down = (pgm) => {
  // Remove password_hash column
  pgm.dropColumn('users', 'password_hash');
};
