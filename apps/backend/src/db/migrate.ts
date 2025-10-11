#!/usr/bin/env node
/**
 * Database Migration Runner
 *
 * Simple migration tool for running SQL migration files against PostgreSQL.
 * Supports both forward migrations and rollbacks.
 *
 * Usage:
 *   npm run migrate:up              # Run all pending migrations
 *   npm run migrate:up 001          # Run specific migration
 *   npm run migrate:down 001        # Rollback specific migration
 *
 * Philosophy: Keep it simple. SQL files are the source of truth.
 */

/* eslint-disable no-console */

import { readFileSync } from 'fs';
import { join } from 'path';

import { Pool } from 'pg';

// Database connection configuration
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'berthcare_dev',
  user: process.env.POSTGRES_USER || 'berthcare',
  password: process.env.POSTGRES_PASSWORD || 'berthcare_dev_password',
});

// Migration file paths
const MIGRATIONS_DIR = join(__dirname, 'migrations');

/**
 * Execute SQL migration file
 */
async function executeMigration(filename: string): Promise<void> {
  const filePath = join(MIGRATIONS_DIR, filename);
  const sql = readFileSync(filePath, 'utf-8');

  console.log(`\n📄 Executing migration: ${filename}`);
  console.log('─'.repeat(60));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run migration up (apply changes)
 */
async function migrateUp(migrationNumber?: string): Promise<void> {
  console.log('\n🚀 Running migrations...\n');

  if (migrationNumber) {
    // Run specific migration
    const migrationFiles: Record<string, string> = {
      '001': '001_create_users_auth.sql',
      '002': '002_create_clients.sql',
      '003': '003_create_care_plans.sql',
    };
    
    const filename = migrationFiles[migrationNumber];
    if (!filename) {
      throw new Error(`Migration ${migrationNumber} not found`);
    }
    await executeMigration(filename);
  } else {
    // Run all migrations in order
    await executeMigration('001_create_users_auth.sql');
    await executeMigration('002_create_clients.sql');
    await executeMigration('003_create_care_plans.sql');
  }

  console.log('\n✨ All migrations completed successfully!\n');
}

/**
 * Run migration down (rollback changes)
 */
async function migrateDown(migrationNumber: string): Promise<void> {
  console.log('\n⏪ Rolling back migration...\n');

  const rollbackFiles: Record<string, string> = {
    '001': '001_create_users_auth_rollback.sql',
    '002': '002_create_clients_rollback.sql',
    '003': '003_create_care_plans_rollback.sql',
  };
  
  const filename = rollbackFiles[migrationNumber];
  if (!filename) {
    throw new Error(`Rollback for migration ${migrationNumber} not found`);
  }
  await executeMigration(filename);

  console.log('\n✨ Rollback completed successfully!\n');
}

/**
 * Verify database connection
 */
async function verifyConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Database connection successful');
    console.log(`📊 PostgreSQL version: ${result.rows[0].version.split(',')[0]}`);
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2]; // 'up' or 'down'
  const migrationNumber = process.argv[3]; // Optional migration number

  try {
    // Verify database connection first
    await verifyConnection();

    // Execute migration command
    if (command === 'up') {
      await migrateUp(migrationNumber);
    } else if (command === 'down') {
      if (!migrationNumber) {
        console.error('❌ Migration number required for rollback');
        console.log('Usage: npm run migrate:down <migration_number>');
        process.exit(1);
      }
      await migrateDown(migrationNumber);
    } else {
      console.error('❌ Invalid command. Use "up" or "down"');
      console.log('Usage:');
      console.log('  npm run migrate:up              # Run all migrations');
      console.log('  npm run migrate:up 001          # Run specific migration');
      console.log('  npm run migrate:down 001        # Rollback migration');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
