/**
 * Database Test Helpers
 * Utilities for setting up and tearing down test database
 */

import { Pool } from 'pg';

let testPool: Pool | null = null;

/**
 * Get or create test database connection pool
 */
export function getTestPool(): Pool {
  if (!testPool) {
    testPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'berthcare_test',
      user: process.env.DB_USER || 'opus',
      password: process.env.DB_PASSWORD || '',
    });
  }
  return testPool;
}

/**
 * Clean up all test data from database
 */
export async function cleanupTestData(): Promise<void> {
  const pool = getTestPool();

  // Delete in reverse order of dependencies
  await pool.query(
    'DELETE FROM visits WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)',
    ['test-%']
  );
  await pool.query('DELETE FROM clients WHERE client_number LIKE $1', ['TEST-%']);
  await pool.query('DELETE FROM users WHERE email LIKE $1', ['test-%']);
  await pool.query('DELETE FROM organizations WHERE name LIKE $1', ['Test Org%']);
}

/**
 * Close test database connection
 */
export async function closeTestPool(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

/**
 * Seed test organization
 */
export async function seedTestOrganization(): Promise<string> {
  const pool = getTestPool();

  const timestamp = Date.now();
  const result = await pool.query(
    `INSERT INTO organizations (name, code, status)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [`Test Organization ${timestamp}`, `TEST-ORG-${timestamp}`, 'active']
  );

  return result.rows[0].id;
}

/**
 * Seed test user
 */
export async function seedTestUser(organizationId: string): Promise<string> {
  const pool = getTestPool();

  const timestamp = Date.now();
  const result = await pool.query(
    `INSERT INTO users (email, first_name, last_name, role, organization_id, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [`test-nurse-${timestamp}@example.com`, 'Test', 'Nurse', 'nurse', organizationId, 'active']
  );

  return result.rows[0].id;
}

/**
 * Seed test client
 */
export async function seedTestClient(organizationId: string): Promise<string> {
  const pool = getTestPool();

  const timestamp = Date.now();
  const result = await pool.query(
    `INSERT INTO clients (
      client_number, first_name, last_name, date_of_birth, 
      address, care_level, organization_id, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`,
    [
      `TEST-${timestamp}`,
      'John',
      'Doe',
      '1950-01-01',
      JSON.stringify({
        street: '123 Test Street',
        city: 'Vancouver',
        province: 'BC',
        postal_code: 'V6B 1A1',
        country: 'Canada',
      }),
      'level_2',
      organizationId,
      'active',
    ]
  );

  return result.rows[0].id;
}

/**
 * Seed test visit
 */
export async function seedTestVisit(
  clientId: string,
  userId: string,
  status: string = 'scheduled'
): Promise<string> {
  const pool = getTestPool();

  const scheduledStart = new Date();
  scheduledStart.setHours(scheduledStart.getHours() + 1);

  const scheduledEnd = new Date(scheduledStart);
  scheduledEnd.setHours(scheduledEnd.getHours() + 1);

  const result = await pool.query(
    `INSERT INTO visits (
      client_id, user_id, scheduled_start, scheduled_end,
      visit_type, status
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id`,
    [clientId, userId, scheduledStart, scheduledEnd, 'personal_care', status]
  );

  return result.rows[0].id;
}

/**
 * Get visit by ID
 */
export async function getVisitById(visitId: string): Promise<any> {
  const pool = getTestPool();
  const result = await pool.query('SELECT * FROM visits WHERE id = $1', [visitId]);
  return result.rows[0];
}
