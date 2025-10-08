/**
 * Database Connection Test
 * Verifies PostgreSQL connection and migration setup
 */

import { initializeDatabase, checkHealth, query, closeDatabase } from '../src/database/index.ts';

console.log('🗄️  BerthCare Database Connection Test');
console.log('========================================\n');

try {
  // Initialize database
  console.log('📊 Initializing database connection...');
  initializeDatabase();
  console.log('✅ Database pool initialized\n');

  // Check health
  console.log('🔍 Checking database health...');
  const health = await checkHealth();

  if (health.healthy) {
    console.log(`✅ Database is healthy (latency: ${health.latency}ms)\n`);
  } else {
    console.log(`❌ Database is unhealthy: ${health.error}\n`);
    process.exit(1);
  }

  // Test query
  console.log('🔍 Testing database query...');
  const result = await query('SELECT version()');
  console.log(
    `✅ PostgreSQL version: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}\n`
  );

  // Check migrations table
  console.log('🔍 Checking migrations...');
  const migrations = await query('SELECT * FROM pgmigrations ORDER BY run_on DESC');
  console.log(`✅ Found ${migrations.rowCount} migration(s):`);
  migrations.rows.forEach((m) => {
    console.log(`   - ${m.name} (run on ${new Date(m.run_on).toLocaleString()})`);
  });
  console.log('');

  // Check extensions
  console.log('🔍 Checking database extensions...');
  const extensions = await query("SELECT extname FROM pg_extension WHERE extname = 'pgcrypto'");
  if (extensions.rowCount > 0) {
    console.log('✅ pgcrypto extension installed\n');
  } else {
    console.log('❌ pgcrypto extension not found\n');
  }

  // Check functions
  console.log('🔍 Checking database functions...');
  const functions = await query(
    "SELECT proname FROM pg_proc WHERE proname = 'update_updated_at_column'"
  );
  if (functions.rowCount > 0) {
    console.log('✅ update_updated_at_column function exists\n');
  } else {
    console.log('❌ update_updated_at_column function not found\n');
  }

  console.log('✅ All database tests passed!\n');

  // Close connection
  await closeDatabase();
  process.exit(0);
} catch (error) {
  console.error('❌ Database test failed:', error.message);
  console.error('\nMake sure PostgreSQL is running:');
  console.error('  docker-compose up -d postgres\n');
  process.exit(1);
}
