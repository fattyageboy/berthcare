/**
 * Integration Tests: POST /v1/visits
 *
 * Tests for visit creation endpoint (check-in)
 *
 * Test Coverage:
 * - Successful visit creation with GPS
 * - Visit creation without GPS
 * - Smart data reuse (copy from previous visit)
 * - Zone-based authorization
 * - Input validation
 * - Error handling
 *
 * Reference: Architecture Blueprint - Visit Documentation Endpoints
 * Task: V4 - Implement POST /v1/visits endpoint
 */

import request from 'supertest';

import { app, pgPool, redisClient } from '../src/main';

import { generateAccessToken } from './test-helpers';

describe('POST /v1/visits', () => {
  let caregiverToken: string;
  let caregiverId: string;
  let clientId: string;
  let zoneId: string;
  let previousVisitId: string;

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Use a test zone ID (zones table doesn't exist yet)
    zoneId = '00000000-0000-0000-0000-000000000001';

    // Create test caregiver
    const caregiverResult = await pgPool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, zone_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['caregiver@test.com', '$2b$10$test', 'Test', 'Caregiver', 'caregiver', zoneId, true]
    );
    caregiverId = caregiverResult.rows[0].id;

    // Generate token
    caregiverToken = generateAccessToken(caregiverId, 'caregiver@test.com', 'caregiver');

    // Create test client
    const clientResult = await pgPool.query(
      `INSERT INTO clients (
        first_name, last_name, date_of_birth, address,
        latitude, longitude, phone,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        zone_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        'John',
        'Doe',
        '1950-01-01',
        '123 Test St',
        43.6532,
        -79.3832,
        '+14165551234',
        'Jane Doe',
        '+14165555678',
        'Daughter',
        zoneId,
      ]
    );
    clientId = clientResult.rows[0].id;

    // Create a previous visit for smart data reuse testing
    const previousVisitResult = await pgPool.query(
      `INSERT INTO visits (
        client_id, staff_id, scheduled_start_time, check_in_time, status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [clientId, caregiverId, '2025-10-10T09:00:00Z', '2025-10-10T09:05:00Z', 'completed']
    );
    previousVisitId = previousVisitResult.rows[0].id;

    // Add documentation to previous visit
    await pgPool.query(
      `INSERT INTO visit_documentation (
        visit_id, vital_signs, activities, observations
      ) VALUES ($1, $2, $3, $4)`,
      [
        previousVisitId,
        JSON.stringify({ blood_pressure: '120/80', heart_rate: 72 }),
        JSON.stringify([{ activity: 'Medication', completed: true }]),
        'Client doing well',
      ]
    );
  });

  afterAll(async () => {
    // Clean up test data
    await pgPool.query('DELETE FROM visit_documentation WHERE visit_id = $1', [previousVisitId]);
    await pgPool.query('DELETE FROM visits WHERE client_id = $1', [clientId]);
    await pgPool.query('DELETE FROM clients WHERE id = $1', [clientId]);
    await pgPool.query('DELETE FROM users WHERE id = $1', [caregiverId]);

    // Close connections
    await pgPool.end();
    await redisClient.quit();
  });

  describe('Successful visit creation', () => {
    it('should create visit with GPS coordinates', async () => {
      const response = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          clientId,
          scheduledStartTime: '2025-10-11T10:00:00Z',
          checkInTime: '2025-10-11T10:05:00Z',
          checkInLatitude: 43.6532,
          checkInLongitude: -79.3832,
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        clientId,
        staffId: caregiverId,
        scheduledStartTime: '2025-10-11T10:00:00.000Z',
        checkInTime: '2025-10-11T10:05:00.000Z',
        checkInLatitude: 43.6532,
        checkInLongitude: -79.3832,
        status: 'in_progress',
      });

      // Clean up
      await pgPool.query('DELETE FROM visits WHERE id = $1', [response.body.id]);
    });

    it('should create visit without GPS coordinates', async () => {
      const response = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          clientId,
          scheduledStartTime: '2025-10-11T11:00:00Z',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        clientId,
        staffId: caregiverId,
        status: 'in_progress',
        checkInLatitude: null,
        checkInLongitude: null,
      });

      // Clean up
      await pgPool.query('DELETE FROM visits WHERE id = $1', [response.body.id]);
    });

    it('should use current time if checkInTime not provided', async () => {
      const beforeRequest = new Date();

      const response = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          clientId,
          scheduledStartTime: '2025-10-11T12:00:00Z',
        });

      const afterRequest = new Date();

      expect(response.status).toBe(201);
      const checkInTime = new Date(response.body.checkInTime);
      expect(checkInTime.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime());
      expect(checkInTime.getTime()).toBeLessThanOrEqual(afterRequest.getTime());

      // Clean up
      await pgPool.query('DELETE FROM visits WHERE id = $1', [response.body.id]);
    });

    it('should preserve 0 as valid GPS coordinates (equator/prime meridian)', async () => {
      const response = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          clientId,
          scheduledStartTime: '2025-10-11T12:30:00Z',
          checkInLatitude: 0, // Equator
          checkInLongitude: 0, // Prime meridian
        });

      expect(response.status).toBe(201);
      expect(response.body.checkInLatitude).toBe(0);
      expect(response.body.checkInLongitude).toBe(0);

      // Clean up
      await pgPool.query('DELETE FROM visits WHERE id = $1', [response.body.id]);
    });
  });

  describe('Smart data reuse', () => {
    it('should copy documentation from previous visit', async () => {
      const response = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          clientId,
          scheduledStartTime: '2025-10-11T13:00:00Z',
          copiedFromVisitId: previousVisitId,
        });

      expect(response.status).toBe(201);

      // Verify documentation was copied
      const docResult = await pgPool.query(
        'SELECT vital_signs, activities, observations FROM visit_documentation WHERE visit_id = $1',
        [response.body.id]
      );

      expect(docResult.rows.length).toBe(1);
      expect(docResult.rows[0].vital_signs).toEqual({ blood_pressure: '120/80', heart_rate: 72 });
      expect(docResult.rows[0].activities).toEqual([{ activity: 'Medication', completed: true }]);
      expect(docResult.rows[0].observations).toBe('Client doing well');

      // Clean up
      await pgPool.query('DELETE FROM visit_documentation WHERE visit_id = $1', [response.body.id]);
      await pgPool.query('DELETE FROM visits WHERE id = $1', [response.body.id]);
    });

    it('should not copy documentation if source visit does not exist', async () => {
      const response = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          clientId,
          scheduledStartTime: '2025-10-11T14:00:00Z',
          copiedFromVisitId: '00000000-0000-0000-0000-000000000000',
        });

      expect(response.status).toBe(201);

      // Verify no documentation was created
      const docResult = await pgPool.query(
        'SELECT * FROM visit_documentation WHERE visit_id = $1',
        [response.body.id]
      );

      expect(docResult.rows.length).toBe(0);

      // Clean up
      await pgPool.query('DELETE FROM visits WHERE id = $1', [response.body.id]);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await request(app).post('/api/v1/visits').send({
        clientId,
        scheduledStartTime: '2025-10-11T15:00:00Z',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject non-caregiver users', async () => {
      // Create admin user
      const adminResult = await pgPool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, zone_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        ['admin@test.com', '$2b$10$test', 'Test', 'Admin', 'admin', zoneId, true]
      );
      const adminId = adminResult.rows[0].id;
      const adminToken = generateAccessToken(adminId, 'admin@test.com', 'admin');

      const response = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          scheduledStartTime: '2025-10-11T16:00:00Z',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Only caregivers can create visits');

      // Clean up
      await pgPool.query('DELETE FROM users WHERE id = $1', [adminId]);
    });

    it('should reject caregiver from different zone', async () => {
      // Use a different zone ID
      const otherZoneId = '00000000-0000-0000-0000-000000000002';

      const otherCaregiverResult = await pgPool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, zone_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        ['other@test.com', '$2b$10$test', 'Other', 'Caregiver', 'caregiver', otherZoneId, true]
      );
      const otherCaregiverId = otherCaregiverResult.rows[0].id;
      const otherToken = generateAccessToken(otherCaregiverId, 'other@test.com', 'caregiver');

      const response = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          clientId,
          scheduledStartTime: '2025-10-11T17:00:00Z',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Cannot create visit for client in different zone');

      // Clean up
      await pgPool.query('DELETE FROM users WHERE id = $1', [otherCaregiverId]);
    });
  });

  describe('Validation', () => {
    it('should reject missing clientId', async () => {
      const response = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          scheduledStartTime: '2025-10-11T18:00:00Z',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('clientId');
    });

    it('should reject missing scheduledStartTime', async () => {
      const response = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          clientId,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('scheduledStartTime');
    });

    it('should reject invalid clientId format', async () => {
      const response = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          clientId: 'invalid-uuid',
          scheduledStartTime: '2025-10-11T19:00:00Z',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid clientId format');
    });

    it('should reject invalid GPS coordinates', async () => {
      const response = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          clientId,
          scheduledStartTime: '2025-10-11T20:00:00Z',
          checkInLatitude: 91, // Invalid: > 90
          checkInLongitude: -79.3832,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('checkInLatitude');
    });

    it('should reject non-existent client', async () => {
      const response = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          clientId: '00000000-0000-0000-0000-000000000000',
          scheduledStartTime: '2025-10-11T21:00:00Z',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Client not found');
    });

    it('should reject duplicate visit for same time slot', async () => {
      // Create first visit
      const firstResponse = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          clientId,
          scheduledStartTime: '2025-10-11T22:00:00Z',
        });

      expect(firstResponse.status).toBe(201);

      // Try to create duplicate
      const duplicateResponse = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          clientId,
          scheduledStartTime: '2025-10-11T22:00:00Z',
        });

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.body.message).toBe('Visit already exists for this time slot');

      // Clean up
      await pgPool.query('DELETE FROM visits WHERE id = $1', [firstResponse.body.id]);
    });
  });
});
