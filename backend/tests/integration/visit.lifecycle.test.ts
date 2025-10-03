/**
 * Visit Service Integration Tests
 * Tests full visit lifecycle: create → check-in → document → complete
 *
 * Architecture Reference: Integration Testing (line 1639-1663, architecture-output.md)
 */

import request from 'supertest';
import express, { Express } from 'express';
import {
  getTestPool,
  cleanupTestData,
  closeTestPool,
  seedTestOrganization,
  seedTestUser,
  seedTestClient,
  seedTestVisit,
  getVisitById,
} from '../helpers/db.helper';

describe('Visit Service - Full Lifecycle Integration Tests', () => {
  let app: Express;
  let organizationId: string;
  let userId: string;
  let clientId: string;
  let visitId: string;

  beforeAll(async () => {
    // Dynamically import routes after environment is set
    const visitRoutesModule = await import('../../src/services/visit/routes');
    const visitRoutes = visitRoutesModule.default;

    // Initialize database connection for visit service
    const { database } = await import('../../src/config');
    await database.connect();

    // Setup Express app with visit routes
    app = express();
    app.use(express.json());
    app.use('/api', visitRoutes);

    // Seed test data
    organizationId = await seedTestOrganization();
    userId = await seedTestUser(organizationId);
    clientId = await seedTestClient(organizationId);
  });

  afterAll(async () => {
    await cleanupTestData();
    await closeTestPool();

    // Close database connection for visit service
    const { database } = await import('../../src/config');
    await database.disconnect();
  });

  beforeEach(async () => {
    // Create a fresh visit for each test
    visitId = await seedTestVisit(clientId, userId, 'scheduled');
  });

  describe('GET /api/visits - Retrieve Visits', () => {
    it('should retrieve visits for authenticated user', async () => {
      const dateFrom = new Date();
      dateFrom.setHours(0, 0, 0, 0);
      const dateTo = new Date();
      dateTo.setDate(dateTo.getDate() + 7);

      const response = await request(app).get('/api/visits').set('x-user-id', userId).query({
        date_from: dateFrom.toISOString(),
        date_to: dateTo.toISOString(),
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.visits).toBeInstanceOf(Array);
      expect(response.body.data.visits.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter visits by status', async () => {
      const dateFrom = new Date();
      dateFrom.setHours(0, 0, 0, 0);
      const dateTo = new Date();
      dateTo.setDate(dateTo.getDate() + 7);

      const response = await request(app).get('/api/visits').set('x-user-id', userId).query({
        date_from: dateFrom.toISOString(),
        date_to: dateTo.toISOString(),
        status: 'scheduled',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.visits).toBeInstanceOf(Array);

      // All returned visits should have 'scheduled' status
      response.body.data.visits.forEach((visit: any) => {
        expect(visit.status).toBe('scheduled');
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      const response = await request(app).get('/api/visits').query({
        date_from: new Date().toISOString(),
        date_to: new Date().toISOString(),
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate required query parameters', async () => {
      const response = await request(app).get('/api/visits').set('x-user-id', userId);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('POST /api/visits/:id/check-in - Check In to Visit', () => {
    it('should successfully check in to a scheduled visit', async () => {
      const checkInData = {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          accuracy: 10,
        },
        timestamp: new Date().toISOString(),
      };

      const response = await request(app)
        .post(`/api/visits/${visitId}/check-in`)
        .set('x-user-id', userId)
        .send(checkInData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.visit_id).toBe(visitId);
      expect(response.body.data.status).toBe('in_progress');
      expect(response.body.data.checked_in_at).toBeDefined();

      // Verify database state
      const visit = await getVisitById(visitId);
      expect(visit.status).toBe('in_progress');
      expect(visit.actual_start).toBeDefined();
      expect(visit.check_in_location).toBeDefined();
    });

    it('should reject check-in with invalid location data', async () => {
      const checkInData = {
        location: {
          latitude: 200, // Invalid latitude
          longitude: -123.1207,
          accuracy: 10,
        },
        timestamp: new Date().toISOString(),
      };

      const response = await request(app)
        .post(`/api/visits/${visitId}/check-in`)
        .set('x-user-id', userId)
        .send(checkInData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject check-in for non-scheduled visit', async () => {
      // Create a visit that's already in progress
      const inProgressVisitId = await seedTestVisit(clientId, userId, 'completed');

      const checkInData = {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          accuracy: 10,
        },
        timestamp: new Date().toISOString(),
      };

      const response = await request(app)
        .post(`/api/visits/${inProgressVisitId}/check-in`)
        .set('x-user-id', userId)
        .send(checkInData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot check in');
    });

    it('should return 404 for non-existent visit', async () => {
      const fakeVisitId = '00000000-0000-0000-0000-000000000000';

      const checkInData = {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          accuracy: 10,
        },
        timestamp: new Date().toISOString(),
      };

      const response = await request(app)
        .post(`/api/visits/${fakeVisitId}/check-in`)
        .set('x-user-id', userId)
        .send(checkInData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/visits/:id/verify-location - Verify Location', () => {
    it('should verify location against client address', async () => {
      const locationData = {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          accuracy: 10,
        },
      };

      const response = await request(app)
        .post(`/api/visits/${visitId}/verify-location`)
        .set('x-user-id', userId)
        .send(locationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.verified).toBeDefined();
      expect(response.body.data.distance).toBeDefined();
      expect(typeof response.body.data.distance).toBe('number');
    });
  });

  describe('PUT /api/visits/:id/documentation - Update Documentation', () => {
    beforeEach(async () => {
      // Check in to the visit first
      const pool = getTestPool();
      await pool.query(
        `UPDATE visits SET status = 'in_progress', actual_start = NOW() WHERE id = $1`,
        [visitId]
      );
    });

    it('should update visit documentation', async () => {
      const documentationData = {
        documentation: {
          vital_signs: {
            blood_pressure: '120/80',
            heart_rate: 72,
            temperature: 36.6,
          },
          activities: ['medication_administration', 'personal_care'],
        },
        notes: 'Patient is doing well today',
      };

      const response = await request(app)
        .put(`/api/visits/${visitId}/documentation`)
        .set('x-user-id', userId)
        .send(documentationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.visit_id).toBe(visitId);
      expect(response.body.data.validation_status).toBe('valid');

      // Verify database state
      const visit = await getVisitById(visitId);
      expect(visit.documentation).toBeDefined();
      expect(visit.documentation!.vital_signs).toBeDefined();
      expect(visit.notes).toBe('Patient is doing well today');
    });

    it('should support partial documentation updates', async () => {
      // First update
      await request(app)
        .put(`/api/visits/${visitId}/documentation`)
        .set('x-user-id', userId)
        .send({
          documentation: {
            vital_signs: { blood_pressure: '120/80' },
          },
        });

      // Second update (should merge with first)
      const response = await request(app)
        .put(`/api/visits/${visitId}/documentation`)
        .set('x-user-id', userId)
        .send({
          documentation: {
            activities: ['medication_administration'],
          },
        });

      expect(response.status).toBe(200);

      // Verify both updates are present
      const visit = await getVisitById(visitId);
      expect(visit.documentation!.vital_signs).toBeDefined();
      expect(visit.documentation!.activities).toBeDefined();
    });

    it('should add photos to visit', async () => {
      const documentationData = {
        photos: ['photo1.jpg', 'photo2.jpg'],
      };

      const response = await request(app)
        .put(`/api/visits/${visitId}/documentation`)
        .set('x-user-id', userId)
        .send(documentationData);

      expect(response.status).toBe(200);

      // Verify database state
      const visit = await getVisitById(visitId);
      expect(visit.photos).toEqual(['photo1.jpg', 'photo2.jpg']);
    });

    it('should reject documentation update for completed visit', async () => {
      // Complete the visit
      const pool = getTestPool();
      await pool.query(`UPDATE visits SET status = 'completed', actual_end = NOW() WHERE id = $1`, [
        visitId,
      ]);

      const documentationData = {
        documentation: {
          vital_signs: { blood_pressure: '120/80' },
        },
      };

      const response = await request(app)
        .put(`/api/visits/${visitId}/documentation`)
        .set('x-user-id', userId)
        .send(documentationData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/visits/:id/complete - Complete Visit', () => {
    beforeEach(async () => {
      // Check in to the visit first
      const pool = getTestPool();
      await pool.query(
        `UPDATE visits SET status = 'in_progress', actual_start = NOW() WHERE id = $1`,
        [visitId]
      );
    });

    it('should successfully complete a visit', async () => {
      const completeData = {
        documentation: {
          summary: 'Visit completed successfully',
          vital_signs: {
            blood_pressure: '120/80',
            heart_rate: 72,
          },
        },
        signature: 'base64-signature-data',
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          accuracy: 10,
        },
      };

      const response = await request(app)
        .post(`/api/visits/${visitId}/complete`)
        .set('x-user-id', userId)
        .send(completeData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.visit_id).toBe(visitId);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.completed_at).toBeDefined();

      // Verify database state
      const visit = await getVisitById(visitId);
      expect(visit.status).toBe('completed');
      expect(visit.actual_end).toBeDefined();
      expect(visit.signature_url).toBe('base64-signature-data');
      expect(visit.check_out_location).toBeDefined();
      expect(visit.documentation).toBeDefined();
    });

    it('should complete visit without optional fields', async () => {
      const completeData = {};

      const response = await request(app)
        .post(`/api/visits/${visitId}/complete`)
        .set('x-user-id', userId)
        .send(completeData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');

      // Verify database state
      const visit = await getVisitById(visitId);
      expect(visit.status).toBe('completed');
      expect(visit.actual_end).toBeDefined();
    });

    it('should reject completion for non-in-progress visit', async () => {
      // Reset visit to scheduled
      const pool = getTestPool();
      await pool.query(
        `UPDATE visits SET status = 'scheduled', actual_start = NULL WHERE id = $1`,
        [visitId]
      );

      const completeData = {
        documentation: { summary: 'Test' },
      };

      const response = await request(app)
        .post(`/api/visits/${visitId}/complete`)
        .set('x-user-id', userId)
        .send(completeData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('must be in progress');
    });
  });

  describe('Full Visit Lifecycle - End-to-End', () => {
    it('should complete full visit workflow: scheduled → check-in → document → complete', async () => {
      // Step 1: Verify initial state (scheduled)
      let visit = await getVisitById(visitId);
      expect(visit.status).toBe('scheduled');
      expect(visit.actual_start).toBeNull();
      expect(visit.actual_end).toBeNull();

      // Step 2: Check in to visit
      const checkInResponse = await request(app)
        .post(`/api/visits/${visitId}/check-in`)
        .set('x-user-id', userId)
        .send({
          location: {
            latitude: 49.2827,
            longitude: -123.1207,
            accuracy: 10,
          },
          timestamp: new Date().toISOString(),
        });

      expect(checkInResponse.status).toBe(200);
      expect(checkInResponse.body.data.status).toBe('in_progress');

      visit = await getVisitById(visitId);
      expect(visit.status).toBe('in_progress');
      expect(visit.actual_start).not.toBeNull();

      // Step 3: Update documentation
      const docResponse = await request(app)
        .put(`/api/visits/${visitId}/documentation`)
        .set('x-user-id', userId)
        .send({
          documentation: {
            vital_signs: {
              blood_pressure: '120/80',
              heart_rate: 72,
              temperature: 36.6,
            },
            activities: ['medication_administration', 'personal_care'],
            observations: 'Patient is alert and responsive',
          },
          notes: 'Routine visit completed without issues',
          photos: ['visit_photo_1.jpg'],
        });

      expect(docResponse.status).toBe(200);

      visit = await getVisitById(visitId);
      expect(visit.documentation).toBeDefined();
      expect(visit.documentation!.vital_signs).toBeDefined();
      expect(visit.notes).toBe('Routine visit completed without issues');
      expect(visit.photos).toEqual(['visit_photo_1.jpg']);

      // Wait a moment to ensure actual_end > actual_start
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Step 4: Complete visit
      const completeResponse = await request(app)
        .post(`/api/visits/${visitId}/complete`)
        .set('x-user-id', userId)
        .send({
          documentation: {
            summary: 'Visit completed successfully. All tasks performed.',
          },
          signature: 'base64-encoded-signature',
          location: {
            latitude: 49.2827,
            longitude: -123.1207,
            accuracy: 8,
          },
        });

      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body.data.status).toBe('completed');

      // Step 5: Verify final state
      visit = await getVisitById(visitId);
      expect(visit.status).toBe('completed');
      expect(visit.actual_start).not.toBeNull();
      expect(visit.actual_end).not.toBeNull();
      expect(visit.check_in_location).not.toBeNull();
      expect(visit.check_out_location).not.toBeNull();
      expect(visit.signature_url).toBe('base64-encoded-signature');
      expect(visit.documentation!.summary).toBe(
        'Visit completed successfully. All tasks performed.'
      );
      expect(visit.documentation!.vital_signs).toBeDefined();

      // Verify actual_end is after actual_start
      const actualStart = new Date(visit.actual_start!);
      const actualEnd = new Date(visit.actual_end!);
      expect(actualEnd.getTime()).toBeGreaterThan(actualStart.getTime());
    });
  });
});
