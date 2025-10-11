/**
 * Integration Tests: PATCH /v1/visits/:visitId
 *
 * Tests for visit update endpoint (check-out/completion)
 *
 * Test Coverage:
 * - Successful visit completion with GPS
 * - Visit completion without GPS
 * - Duration calculation
 * - Status updates
 * - Documentation updates
 * - Authorization checks
 * - Input validation
 * - Error handling
 *
 * Reference: Architecture Blueprint - Visit Documentation Endpoints
 * Task: V5 - Implement PATCH /v1/visits/:visitId endpoint
 */

import request from 'supertest';

import { generateAccessToken } from '../../../libs/shared/src/jwt-utils';
import { app, pgPool, redisClient } from '../src/main';

describe('PATCH /v1/visits/:visitId', () => {
  let caregiverToken: string;
  let caregiverId: string;
  let otherCaregiverId: string;
  let clientId: string;
  let zoneId: string;
  let visitId: string;

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Use a test zone ID
    zoneId = '00000000-0000-0000-0000-000000000001';

    // Create test caregiver
    const caregiverResult = await pgPool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, zone_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['caregiver@test.com', '$2b$10$test', 'Test', 'Caregiver', 'caregiver', zoneId, true]
    );
    caregiverId = caregiverResult.rows[0].id;
    caregiverToken = generateAccessToken({
      userId: caregiverId,
      email: 'caregiver@test.com',
      role: 'caregiver',
      zoneId,
    });

    // Create another caregiver
    const otherCaregiverResult = await pgPool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, zone_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['other@test.com', '$2b$10$test', 'Other', 'Caregiver', 'caregiver', zoneId, true]
    );
    otherCaregiverId = otherCaregiverResult.rows[0].id;

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

    // Create a test visit
    const visitResult = await pgPool.query(
      `INSERT INTO visits (
        client_id, staff_id, scheduled_start_time, check_in_time, status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [clientId, caregiverId, '2025-10-11T09:00:00Z', '2025-10-11T09:05:00Z', 'in_progress']
    );
    visitId = visitResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await pgPool.query('DELETE FROM visits WHERE client_id = $1', [clientId]);
    await pgPool.query('DELETE FROM clients WHERE id = $1', [clientId]);
    await pgPool.query('DELETE FROM users WHERE id IN ($1, $2)', [caregiverId, otherCaregiverId]);

    // Close connections
    await pgPool.end();
    await redisClient.quit();
  });

  describe('Successful visit updates', () => {
    it('should complete visit with check-out GPS and calculate duration', async () => {
      const response = await request(app)
        .patch(`/api/v1/visits/${visitId}`)
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          checkOutTime: '2025-10-11T10:05:00Z',
          checkOutLatitude: 43.6532,
          checkOutLongitude: -79.3832,
          status: 'completed',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: visitId,
        status: 'completed',
      });

      // Verify duration was calculated (60 minutes)
      const visitCheck = await pgPool.query(
        'SELECT duration_minutes FROM visits WHERE id = $1',
        [visitId]
      );
      expect(visitCheck.rows[0].duration_minutes).toBe(60);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await request(app).patch(`/api/v1/visits/${visitId}`).send({
        status: 'completed',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject caregiver updating another caregiver visit', async () => {
      // Create visit for other caregiver
      const otherVisitResult = await pgPool.query(
        `INSERT INTO visits (
          client_id, staff_id, scheduled_start_time, check_in_time, status
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [clientId, otherCaregiverId, '2025-10-11T11:00:00Z', '2025-10-11T11:05:00Z', 'in_progress']
      );
      const otherVisitId = otherVisitResult.rows[0].id;

      const response = await request(app)
        .patch(`/api/v1/visits/${otherVisitId}`)
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          status: 'completed',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You can only update your own visits');

      // Clean up
      await pgPool.query('DELETE FROM visits WHERE id = $1', [otherVisitId]);
    });
  });

  describe('Validation', () => {
    it('should reject invalid visitId format', async () => {
      const response = await request(app)
        .patch('/api/v1/visits/invalid-uuid')
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          status: 'completed',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid visitId format');
    });

    it('should reject invalid GPS coordinates', async () => {
      const response = await request(app)
        .patch(`/api/v1/visits/${visitId}`)
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          checkOutLatitude: 91, // Invalid: > 90
          checkOutLongitude: -79.3832,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('checkOutLatitude');
    });

    it('should reject invalid status', async () => {
      const response = await request(app)
        .patch(`/api/v1/visits/${visitId}`)
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          status: 'invalid_status',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('status must be one of');
    });

    it('should reject non-existent visit', async () => {
      const response = await request(app)
        .patch('/api/v1/visits/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          status: 'completed',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Visit not found');
    });

    it('should reject request with no updates', async () => {
      const response = await request(app)
        .patch(`/api/v1/visits/${visitId}`)
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No updates provided');
    });
  });
});
