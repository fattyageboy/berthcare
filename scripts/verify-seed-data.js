#!/usr/bin/env node
/**
 * BerthCare Seed Data Verification Script
 *
 * This script verifies that the seed data was loaded correctly.
 * It checks:
 * - Correct number of records in each table
 * - Password hashes are present
 * - Relationships are intact
 * - Data integrity
 *
 * Usage:
 *   npm run verify:seed
 *   node scripts/verify-seed-data.js
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
});

// Expected counts based on seed data
const EXPECTED_COUNTS = {
  organizations: 2,
  users: 11,
  clients: 5,
  care_plans: 3,
  family_members: 3,
  visits: { min: 8, max: 15 }, // Range because of dynamic date-based visits
};

const EXPECTED_USER_ROLES = {
  admin: 1,
  supervisor: 1,
  coordinator: 1,
  nurse: 2,
  psw: 3,
  family_member: 3,
};

/**
 * Run verification tests
 */
async function verifyData() {
  const client = await pool.connect();
  let allTestsPassed = true;
  const errors = [];

  console.log('\n🔍 BerthCare Seed Data Verification');
  console.log('====================================\n');

  try {
    // Test 1: Check table counts
    console.log('📊 Test 1: Verifying table counts...');
    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM organizations) as organizations,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM clients) as clients,
        (SELECT COUNT(*) FROM care_plans) as care_plans,
        (SELECT COUNT(*) FROM family_members) as family_members,
        (SELECT COUNT(*) FROM visits) as visits
    `);

    const actual = counts.rows[0];

    for (const [table, expected] of Object.entries(EXPECTED_COUNTS)) {
      const actualCount = parseInt(actual[table]);

      if (typeof expected === 'number') {
        if (actualCount === expected) {
          console.log(`   ✅ ${table}: ${actualCount} (expected: ${expected})`);
        } else {
          console.log(`   ❌ ${table}: ${actualCount} (expected: ${expected})`);
          errors.push(`${table} count mismatch: got ${actualCount}, expected ${expected}`);
          allTestsPassed = false;
        }
      } else {
        // Range check
        if (actualCount >= expected.min && actualCount <= expected.max) {
          console.log(`   ✅ ${table}: ${actualCount} (expected: ${expected.min}-${expected.max})`);
        } else {
          console.log(`   ❌ ${table}: ${actualCount} (expected: ${expected.min}-${expected.max})`);
          errors.push(`${table} count out of range: got ${actualCount}, expected ${expected.min}-${expected.max}`);
          allTestsPassed = false;
        }
      }
    }

    // Test 2: Verify user roles
    console.log('\n👥 Test 2: Verifying user roles...');
    const roleResults = await client.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY role
    `);

    for (const row of roleResults.rows) {
      const expected = EXPECTED_USER_ROLES[row.role];
      const actual = parseInt(row.count);

      if (actual === expected) {
        console.log(`   ✅ ${row.role}: ${actual} (expected: ${expected})`);
      } else {
        console.log(`   ❌ ${row.role}: ${actual} (expected: ${expected})`);
        errors.push(`${row.role} count mismatch: got ${actual}, expected ${expected}`);
        allTestsPassed = false;
      }
    }

    // Test 3: Verify password hashes
    console.log('\n🔐 Test 3: Verifying password hashes...');
    const passwordCheck = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(password_hash) as with_hash
      FROM users
    `);

    const { total, with_hash } = passwordCheck.rows[0];

    if (parseInt(total) === parseInt(with_hash)) {
      console.log(`   ✅ All ${total} users have password hashes`);
    } else {
      console.log(`   ❌ Only ${with_hash} out of ${total} users have password hashes`);
      errors.push(`Missing password hashes: ${total - with_hash} users without hashes`);
      allTestsPassed = false;
    }

    // Verify hash format (should start with $2b$ for bcrypt)
    const hashFormatCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE password_hash IS NOT NULL
        AND password_hash LIKE '$2b$%'
    `);

    const validHashes = parseInt(hashFormatCheck.rows[0].count);
    if (validHashes === EXPECTED_COUNTS.users) {
      console.log(`   ✅ All password hashes are in bcrypt format`);
    } else {
      console.log(`   ❌ Invalid hash format for ${EXPECTED_COUNTS.users - validHashes} users`);
      errors.push(`Invalid bcrypt hash format detected`);
      allTestsPassed = false;
    }

    // Test 4: Verify relationships
    console.log('\n🔗 Test 4: Verifying data relationships...');

    // Check users have valid organization references
    const userOrgCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE organization_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM organizations WHERE id = users.organization_id
        )
    `);

    if (parseInt(userOrgCheck.rows[0].count) === 0) {
      console.log(`   ✅ All user organization references are valid`);
    } else {
      console.log(`   ❌ Found ${userOrgCheck.rows[0].count} users with invalid organization references`);
      errors.push(`Invalid organization references in users table`);
      allTestsPassed = false;
    }

    // Check clients have valid organization references
    const clientOrgCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM clients
      WHERE NOT EXISTS (
        SELECT 1 FROM organizations WHERE id = clients.organization_id
      )
    `);

    if (parseInt(clientOrgCheck.rows[0].count) === 0) {
      console.log(`   ✅ All client organization references are valid`);
    } else {
      console.log(`   ❌ Found ${clientOrgCheck.rows[0].count} clients with invalid organization references`);
      errors.push(`Invalid organization references in clients table`);
      allTestsPassed = false;
    }

    // Check visits have valid client and user references
    const visitRefCheck = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM visits WHERE NOT EXISTS (
          SELECT 1 FROM clients WHERE id = visits.client_id
        )) as invalid_clients,
        (SELECT COUNT(*) FROM visits WHERE NOT EXISTS (
          SELECT 1 FROM users WHERE id = visits.user_id
        )) as invalid_users
    `);

    const { invalid_clients, invalid_users } = visitRefCheck.rows[0];

    if (parseInt(invalid_clients) === 0 && parseInt(invalid_users) === 0) {
      console.log(`   ✅ All visit references are valid`);
    } else {
      if (parseInt(invalid_clients) > 0) {
        console.log(`   ❌ Found ${invalid_clients} visits with invalid client references`);
        errors.push(`Invalid client references in visits table`);
        allTestsPassed = false;
      }
      if (parseInt(invalid_users) > 0) {
        console.log(`   ❌ Found ${invalid_users} visits with invalid user references`);
        errors.push(`Invalid user references in visits table`);
        allTestsPassed = false;
      }
    }

    // Test 5: Verify specific test accounts
    console.log('\n🔑 Test 5: Verifying test accounts...');

    const testAccounts = [
      'admin@caringhearts.ca',
      'supervisor@caringhearts.ca',
      'coordinator@caringhearts.ca',
      'nurse1@caringhearts.ca',
      'psw1@caringhearts.ca',
      'john.smith@email.com'
    ];

    for (const email of testAccounts) {
      const accountCheck = await client.query(
        'SELECT email, role, password_hash IS NOT NULL as has_password FROM users WHERE email = $1',
        [email]
      );

      if (accountCheck.rows.length === 1 && accountCheck.rows[0].has_password) {
        console.log(`   ✅ ${email} (${accountCheck.rows[0].role})`);
      } else if (accountCheck.rows.length === 0) {
        console.log(`   ❌ ${email} - Account not found`);
        errors.push(`Test account not found: ${email}`);
        allTestsPassed = false;
      } else {
        console.log(`   ❌ ${email} - Missing password hash`);
        errors.push(`Test account missing password: ${email}`);
        allTestsPassed = false;
      }
    }

    // Test 6: Verify care plans are properly linked
    console.log('\n📋 Test 6: Verifying care plans...');

    const carePlanCheck = await client.query(`
      SELECT
        cp.title,
        c.first_name,
        c.last_name,
        cp.status
      FROM care_plans cp
      JOIN clients c ON cp.client_id = c.id
      WHERE cp.status = 'active'
    `);

    if (carePlanCheck.rows.length >= 3) {
      console.log(`   ✅ Found ${carePlanCheck.rows.length} active care plans`);
      carePlanCheck.rows.forEach(row => {
        console.log(`      - ${row.title} (${row.first_name} ${row.last_name})`);
      });
    } else {
      console.log(`   ❌ Expected at least 3 active care plans, found ${carePlanCheck.rows.length}`);
      errors.push(`Insufficient active care plans`);
      allTestsPassed = false;
    }

    // Summary
    console.log('\n====================================');
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED');
      console.log('\n✨ Seed data verification successful!');
      console.log('\n📝 You can now test authentication with:');
      console.log('   Email:    admin@caringhearts.ca');
      console.log('   Password: BerthCare2024!');
      console.log('\n   See db/seeds/README.md for all test accounts');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('\n🔴 Errors found:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('\n💡 Try re-running: npm run seed:dev');
    }
    console.log('====================================\n');

    process.exit(allTestsPassed ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Verification failed with error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run verification
verifyData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
