/**
 * Integration Tests: POST /v1/auth/register
 *
 * Tests the user registration endpoint according to specifications:
 * - Register user successfully
 * - Duplicate email returns 409
 * - Rate limit works (5 attempts per hour per IP)
 * - Email format validation
 * - Password strength validation
 * - Required field validation
 *
 * Reference: Task A4 - Registration endpoint integration tests
 * Architecture: project-documentation/architecture-output.md
 *
 * Test Strategy:
 * - Use real PostgreSQL and Redis connections
 * - Clean database state before each test
 * - Test happy path and error scenarios
 * - Verify rate limiting behavior
 * - Validate JWT token generation
 */

import express from 'express';
import { Pool } from 'pg';
import { createClient, RedisClientType } from 'redis';
import request from 'supertest';

import { verifyToken } from '../../../libs/shared/src/jwt-utils';
import { createAuthRoutes } from '../src/routes/auth.routes';

// Test configuration
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://berthcare:berthcare_dev_password@localhost:5432/berthcare_test';
const TEST_REDIS_URL =
  process.env.TEST_REDIS_URL || 'redis://:berthcare_redis_password@localhost:6379/1';

describe('POST /v1/auth/register', () => {
  let app: express.Application;
  let pgPool: Pool;
  let redisClient: RedisClientType;

  // Setup: Create app and database connections
  beforeAll(async () => {
    // Create PostgreSQL connection
    pgPool = new Pool({
      connectionString: TEST_DATABASE_URL,
      max: 5,
    });

    // Create Redis connection
    redisClient = createClient({
      url: TEST_REDIS_URL,
    });
    await redisClient.connect();

    // Create Express app with auth routes
    app = express();
    app.use(express.json());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use('/v1/auth', createAuthRoutes(pgPool, redisClient as any));

    // Ensure test database has required tables
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('caregiver', 'coordinator', 'admin')),
        zone_id UUID,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        device_id VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        revoked_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  });

  // Cleanup: Close connections
  afterAll(async () => {
    await pgPool.end();
    await redisClient.quit();
  });

  // Clean database and Redis before each test
  beforeEach(async () => {
    await pgPool.query('DELETE FROM refresh_tokens');
    await pgPool.query('DELETE FROM users');
    await redisClient.flushDb();
  });

  describe('Successful Registration', () => {
    it('should register a new caregiver successfully', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'caregiver@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-001',
      });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toMatchObject({
        email: 'caregiver@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(response.body.data.user).toHaveProperty('id');

      // Verify tokens are valid JWTs
      const accessTokenPayload = verifyToken(response.body.data.accessToken);
      expect(accessTokenPayload.userId).toBe(response.body.data.user.id);
      expect(accessTokenPayload.role).toBe('caregiver');
      expect(accessTokenPayload.email).toBe('caregiver@example.com');

      // Verify user was created in database
      const userResult = await pgPool.query('SELECT * FROM users WHERE email = $1', [
        'caregiver@example.com',
      ]);
      expect(userResult.rows).toHaveLength(1);
      expect(userResult.rows[0].first_name).toBe('John');
      expect(userResult.rows[0].last_name).toBe('Doe');

      // Verify refresh token was stored
      const tokenResult = await pgPool.query('SELECT * FROM refresh_tokens WHERE user_id = $1', [
        response.body.data.user.id,
      ]);
      expect(tokenResult.rows).toHaveLength(1);
      expect(tokenResult.rows[0].device_id).toBe('test-device-001');
    });

    it('should register a coordinator successfully', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'coordinator@example.com',
        password: 'SecurePass456',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'coordinator',
        zoneId: '123e4567-e89b-12d3-a456-426614174001',
        deviceId: 'test-device-002',
      });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('coordinator');
    });

    it('should register an admin successfully (no zoneId required)', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'admin@example.com',
        password: 'AdminPass789',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        deviceId: 'test-device-003',
      });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('admin');
      expect(response.body.data.user.zoneId).toBeNull();
    });

    it('should normalize email to lowercase', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'CamelCase@Example.COM',
        password: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-004',
      });

      expect(response.status).toBe(201);
      expect(response.body.data.user.email).toBe('camelcase@example.com');
    });
  });

  describe('Duplicate Email Validation', () => {
    it('should return 409 when email already exists', async () => {
      // First registration
      await request(app).post('/v1/auth/register').send({
        email: 'duplicate@example.com',
        password: 'SecurePass123',
        firstName: 'First',
        lastName: 'User',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-005',
      });

      // Second registration with same email
      const response = await request(app).post('/v1/auth/register').send({
        email: 'duplicate@example.com',
        password: 'DifferentPass456',
        firstName: 'Second',
        lastName: 'User',
        role: 'coordinator',
        zoneId: '123e4567-e89b-12d3-a456-426614174001',
        deviceId: 'test-device-006',
      });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
      expect(response.body.error.message).toContain('already exists');
    });

    it('should return 409 for case-insensitive duplicate emails', async () => {
      // First registration
      await request(app).post('/v1/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'First',
        lastName: 'User',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-007',
      });

      // Second registration with different case
      const response = await request(app).post('/v1/auth/register').send({
        email: 'TEST@EXAMPLE.COM',
        password: 'SecurePass456',
        firstName: 'Second',
        lastName: 'User',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-008',
      });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('Email Format Validation', () => {
    it('should reject invalid email format', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'invalid-email',
        password: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-009',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Invalid email format');
    });

    it('should reject email without domain', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'test@',
        password: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-010',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject email without @', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'testexample.com',
        password: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-011',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Password Strength Validation', () => {
    it('should reject password shorter than 8 characters', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'test@example.com',
        password: 'Short1',
        firstName: 'Test',
        lastName: 'User',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-012',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('at least 8 characters');
    });

    it('should reject password without uppercase letter', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'test@example.com',
        password: 'lowercase123',
        firstName: 'Test',
        lastName: 'User',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-013',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('uppercase letter');
    });

    it('should reject password without number', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'test@example.com',
        password: 'NoNumbersHere',
        firstName: 'Test',
        lastName: 'User',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-014',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('number');
    });
  });

  describe('Required Field Validation', () => {
    it('should reject missing email', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        password: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-015',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Email is required');
    });

    it('should reject missing password', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-016',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Password is required');
    });

    it('should reject missing firstName', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePass123',
        lastName: 'User',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-017',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('First name is required');
    });

    it('should reject missing lastName', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'Test',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-018',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Last name is required');
    });

    it('should reject missing role', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-019',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Role is required');
    });

    it('should reject invalid role', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User',
        role: 'invalid_role',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-020',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Role must be one of');
    });

    it('should reject missing zoneId for caregiver', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User',
        role: 'caregiver',
        deviceId: 'test-device-021',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Zone ID is required');
    });

    it('should reject missing zoneId for coordinator', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User',
        role: 'coordinator',
        deviceId: 'test-device-022',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Zone ID is required');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow 5 registration attempts per hour', async () => {
      const attempts: number[] = [];

      // Make 5 attempts (should all succeed or fail for other reasons, not rate limit)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/v1/auth/register')
          .send({
            email: `test${i}@example.com`,
            password: 'SecurePass123',
            firstName: 'Test',
            lastName: 'User',
            role: 'caregiver',
            zoneId: '123e4567-e89b-12d3-a456-426614174000',
            deviceId: `test-device-${i}`,
          });

        attempts.push(response.status);
      }

      // All 5 attempts should succeed (201)
      expect(attempts.every((status) => status === 201)).toBe(true);
    });

    it('should block 6th registration attempt with 429', async () => {
      // Make 5 successful attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/v1/auth/register')
          .send({
            email: `test${i}@example.com`,
            password: 'SecurePass123',
            firstName: 'Test',
            lastName: 'User',
            role: 'caregiver',
            zoneId: '123e4567-e89b-12d3-a456-426614174000',
            deviceId: `test-device-${i}`,
          });
      }

      // 6th attempt should be rate limited
      const response = await request(app).post('/v1/auth/register').send({
        email: 'test6@example.com',
        password: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-6',
      });

      expect(response.status).toBe(429);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.body.error.message).toContain('Too many attempts');
      expect(response.body.error.details.maxAttempts).toBe(5);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-001',
      });

      expect(response.headers['x-ratelimit-limit']).toBe('5');
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('Security', () => {
    it('should hash password before storing', async () => {
      const plainPassword = 'SecurePass123';

      await request(app).post('/v1/auth/register').send({
        email: 'security@example.com',
        password: plainPassword,
        firstName: 'Security',
        lastName: 'Test',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-security',
      });

      // Get stored password hash from database
      const userResult = await pgPool.query('SELECT password_hash FROM users WHERE email = $1', [
        'security@example.com',
      ]);

      const storedHash = userResult.rows[0].password_hash;

      // Hash should not equal plain password
      expect(storedHash).not.toBe(plainPassword);

      // Hash should start with bcrypt identifier
      expect(storedHash).toMatch(/^\$2[aby]\$/);
    });

    it('should hash refresh token before storing', async () => {
      const response = await request(app).post('/v1/auth/register').send({
        email: 'token@example.com',
        password: 'SecurePass123',
        firstName: 'Token',
        lastName: 'Test',
        role: 'caregiver',
        zoneId: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'test-device-token',
      });

      const refreshToken = response.body.data.refreshToken;

      // Get stored token hash from database
      const tokenResult = await pgPool.query(
        'SELECT token_hash FROM refresh_tokens WHERE user_id = $1',
        [response.body.data.user.id]
      );

      const storedHash = tokenResult.rows[0].token_hash;

      // Hash should not equal plain token
      expect(storedHash).not.toBe(refreshToken);

      // Hash should be 64 characters (SHA-256 hex)
      expect(storedHash).toHaveLength(64);
    });
  });
});
