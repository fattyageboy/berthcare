/**
 * node-pg-migrate configuration
 * Configures database migrations for BerthCare schema
 */
module.exports = {
  // Migration directory
  dir: 'migrations',

  // Ignore non-migration files
  ignorePattern: '.*\\.md$',

  // Database connection (from environment)
  databaseUrl: process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'berthcare_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'dev_password_change_in_production',
  },

  // Migration table name
  migrationsTable: 'pgmigrations',

  // Schema for migrations table
  schema: 'public',

  // Create schema if it doesn't exist
  createSchema: true,

  // Migration file extension
  migrationFileLanguage: 'js',

  // Don't use transactions (we'll manage them explicitly for complex migrations)
  singleTransaction: false,

  // Decamelize column names (PostgreSQL convention)
  decamelize: true,

  // Direction of migration (default: up)
  direction: 'up',

  // Count of migrations to run
  count: Infinity,

  // Check order of migrations
  checkOrder: true,

  // Verbose logging
  verbose: true,

  // Reject on rollback error
  rejectOnNotFound: true,
};
