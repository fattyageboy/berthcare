#!/usr/bin/env node
/**
 * BerthCare Development Database Seeding Script
 *
 * This script populates the database with test data for local development.
 * It executes SQL seed files in order to create:
 * - Organizations
 * - Users (with various roles)
 * - Clients
 * - Care plans
 * - Visits
 * - Family member relationships
 *
 * Usage:
 *   npm run seed:dev
 *
 * Prerequisites:
 *   - Database must be created and migrations must be run
 *   - Environment variables must be configured (.env file)
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
});

// Seed files to execute in order
const SEED_FILES = [
  '01_schema.sql',
  '02_seed_data.sql',
  '03_seed_users_with_auth.sql'
];

const SEEDS_DIR = path.join(__dirname, '../db/seeds');

/**
 * Execute a SQL file
 */
async function executeSqlFile(client, filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Executing: ${fileName}`);

  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await client.query(sql);
    console.log(`✅ Successfully executed: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error executing ${fileName}:`, error.message);
    throw error;
  }
}

/**
 * Check if database is empty or needs seeding
 */
async function checkDatabaseState(client) {
  try {
    const result = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const tableCount = parseInt(result.rows[0].count);

    if (tableCount === 0) {
      console.log('\n⚠️  Database is empty. Running full schema and seed...');
      return 'empty';
    }

    // Check if we have any users
    const userResult = await client.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userResult.rows[0].count);

    if (userCount > 0) {
      console.log(`\n⚠️  Database already has ${userCount} users.`);
      console.log('This will clear existing data and reseed the database.');
      return 'existing';
    }

    return 'schema_only';
  } catch (error) {
    // If query fails, database might not have the tables yet
    return 'empty';
  }
}

/**
 * Clear existing data (for re-seeding)
 */
async function clearData(client) {
  console.log('\n🗑️  Clearing existing data...');

  const tables = [
    'audit_log',
    'sync_log',
    'family_members',
    'visits',
    'care_plans',
    'clients',
    'users',
    'organizations'
  ];

  for (const table of tables) {
    try {
      await client.query(`TRUNCATE TABLE ${table} CASCADE`);
      console.log(`   Cleared: ${table}`);
    } catch (error) {
      console.warn(`   Warning: Could not clear ${table}: ${error.message}`);
    }
  }

  console.log('✅ Data cleared successfully');
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('🌱 BerthCare Database Seeding');
    console.log('================================');
    console.log(`Database: ${process.env.DB_NAME || 'from DATABASE_URL'}`);
    console.log(`Host: ${process.env.DB_HOST || 'from DATABASE_URL'}`);

    // Check database state
    const dbState = await checkDatabaseState(client);

    // Start transaction
    await client.query('BEGIN');

    if (dbState === 'empty') {
      // Fresh database - run all seed files
      console.log('\n📦 Running full database setup...');
      for (const seedFile of SEED_FILES) {
        const filePath = path.join(SEEDS_DIR, seedFile);
        if (fs.existsSync(filePath)) {
          await executeSqlFile(client, filePath);
        } else {
          console.warn(`⚠️  Seed file not found: ${seedFile}`);
        }
      }
    } else if (dbState === 'existing') {
      // Clear and reseed
      await clearData(client);

      console.log('\n📦 Re-seeding database...');
      // Skip schema file, just run data seeds
      for (const seedFile of SEED_FILES.slice(1)) {
        const filePath = path.join(SEEDS_DIR, seedFile);
        if (fs.existsSync(filePath)) {
          await executeSqlFile(client, filePath);
        }
      }
    } else {
      // Schema exists but no data
      console.log('\n📦 Seeding data into existing schema...');
      for (const seedFile of SEED_FILES.slice(1)) {
        const filePath = path.join(SEEDS_DIR, seedFile);
        if (fs.existsSync(filePath)) {
          await executeSqlFile(client, filePath);
        }
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    // Display summary
    console.log('\n================================');
    console.log('📊 Database Summary');
    console.log('================================');

    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM organizations) as organizations,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM clients) as clients,
        (SELECT COUNT(*) FROM care_plans) as care_plans,
        (SELECT COUNT(*) FROM visits) as visits,
        (SELECT COUNT(*) FROM family_members) as family_members
    `);

    const summary = stats.rows[0];
    console.log(`Organizations:   ${summary.organizations}`);
    console.log(`Users:           ${summary.users}`);
    console.log(`Clients:         ${summary.clients}`);
    console.log(`Care Plans:      ${summary.care_plans}`);
    console.log(`Visits:          ${summary.visits}`);
    console.log(`Family Members:  ${summary.family_members}`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📝 Test Login Credentials:');
    console.log('================================');
    console.log('Email:    admin@caringhearts.ca');
    console.log('Password: BerthCare2024!');
    console.log('Role:     admin');
    console.log('');
    console.log('Email:    nurse1@caringhearts.ca');
    console.log('Password: BerthCare2024!');
    console.log('Role:     nurse');
    console.log('');
    console.log('Email:    psw1@caringhearts.ca');
    console.log('Password: BerthCare2024!');
    console.log('Role:     psw');
    console.log('');
    console.log('See db/seeds/03_seed_users_with_auth.sql for all test accounts');
    console.log('================================\n');

  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('\n❌ Seeding failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding
seedDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
