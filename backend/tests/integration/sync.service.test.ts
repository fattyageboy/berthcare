/**
 * Sync Service Integration Tests
 * Tests pull/push flows, conflict scenarios, and WebSocket events
 *
 * Architecture Reference: Integration Testing (line 1639-1663, architecture-output.md)
 */

import request from 'supertest';
import { Express } from 'express';
import { Server as HTTPServer } from 'http';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import {
  getTestPool,
  cleanupTestData,
  closeTestPool,
  seedTestOrganization,
  seedTestUser,
  seedTestClient,
  seedTestVisit,
} from '../helpers/db.helper';

describe('Sync Service - Integration Tests', () => {
  let app: Express;
  let httpServer: HTTPServer;
  let organizationId: string;
  let userId: string;
  let userId2: string;
  let clientId: string;
  let visitId: string;
  let clientSocket: ClientSocket;

  beforeAll(async () => {
    // Dynamically import sync service
    const syncServiceModule = await import('../../src/services/sync');
    httpServer = syncServiceModule.default;

    // Get the Express app from the server
    app = (httpServer as any)._events.request;

    // Initialize database connection
    const { database } = await import('../../src/config');
    await database.connect();

    // Seed test data
    organizationId = await seedTestOrganization();
    userId = await seedTestUser(organizationId);
    userId2 = await seedTestUser(organizationId); // Second user for org broadcasts
    clientId = await seedTestClient(organizationId);
  });

  afterAll(async () => {
    // Cleanup
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }

    await cleanupTestData();
    await closeTestPool();

    // Close database connection
    const { database } = await import('../../src/config');
    await database.disconnect();

    // Close HTTP server
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
  });

  beforeEach(async () => {
    // Create a fresh visit for each test
    visitId = await seedTestVisit(clientId, userId, 'scheduled');
  });

  afterEach(() => {
    // Disconnect WebSocket after each test
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('POST /api/sync/pull - Pull Changes', () => {
    it('should pull changes since last sync timestamp', async () => {
      const lastSyncTimestamp = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

      const response = await request(app)
        .post('/api/sync/pull')
        .set('x-user-id', userId)
        .send({
          last_sync_timestamp: lastSyncTimestamp,
          entity_types: ['visits', 'clients'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('changes');
      expect(response.body.data).toHaveProperty('sync_timestamp');
      expect(response.body.data).toHaveProperty('has_more');
      expect(response.body.data.changes).toHaveProperty('visits');
      expect(response.body.data.changes).toHaveProperty('clients');
    });

    it('should return empty changes if no updates since last sync', async () => {
      const lastSyncTimestamp = new Date(Date.now() + 3600000).toISOString(); // 1 hour in future

      const response = await request(app)
        .post('/api/sync/pull')
        .set('x-user-id', userId)
        .send({
          last_sync_timestamp: lastSyncTimestamp,
          entity_types: ['visits'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.changes.visits).toHaveLength(0);
    });

    it('should validate last_sync_timestamp format', async () => {
      const response = await request(app)
        .post('/api/sync/pull')
        .set('x-user-id', userId)
        .send({
          last_sync_timestamp: 'invalid-timestamp',
          entity_types: ['visits'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should validate entity_types array', async () => {
      const response = await request(app)
        .post('/api/sync/pull')
        .set('x-user-id', userId)
        .send({
          last_sync_timestamp: new Date().toISOString(),
          entity_types: ['invalid_type'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/sync/pull')
        .send({
          last_sync_timestamp: new Date().toISOString(),
          entity_types: ['visits'],
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Unauthorized');
    });
  });

  describe('POST /api/sync/push - Push Changes', () => {
    it('should push visit update without conflict', async () => {
      const response = await request(app)
        .post('/api/sync/push')
        .set('x-user-id', userId)
        .send({
          changes: [
            {
              entity_type: 'visits',
              entity_id: visitId,
              operation: 'update',
              data: {
                status: 'in_progress',
                actual_start: new Date().toISOString(),
                notes: 'Visit started',
              },
              local_timestamp: new Date().toISOString(),
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(1);
      expect(response.body.data.results[0].status).toBe('success');
      expect(response.body.data.results[0].entity_id).toBe(visitId);
      expect(response.body.data.results[0].conflicts).toBeNull();
    });

    it('should detect conflict when server version is newer', async () => {
      // First, update the visit on server
      const pool = getTestPool();
      await pool.query('UPDATE visits SET status = $1, updated_at = NOW() WHERE id = $2', [
        'in_progress',
        visitId,
      ]);

      // Wait a moment to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now try to push an older change
      const oldTimestamp = new Date(Date.now() - 5000).toISOString(); // 5 seconds ago

      const response = await request(app)
        .post('/api/sync/push')
        .set('x-user-id', userId)
        .send({
          changes: [
            {
              entity_type: 'visits',
              entity_id: visitId,
              operation: 'update',
              data: {
                status: 'completed',
                actual_end: new Date().toISOString(),
              },
              local_timestamp: oldTimestamp,
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results[0].status).toBe('conflict');
      expect(response.body.data.results[0].conflicts).not.toBeNull();
      expect(response.body.data.results[0].conflicts.detected).toBe(true);
      expect(response.body.data.results[0].conflicts.resolution_strategy).toBe('last_write_wins');
    });

    it('should log sync operation to sync_log table', async () => {
      await request(app)
        .post('/api/sync/push')
        .set('x-user-id', userId)
        .send({
          changes: [
            {
              entity_type: 'visits',
              entity_id: visitId,
              operation: 'update',
              data: {
                notes: 'Test sync log',
              },
              local_timestamp: new Date().toISOString(),
            },
          ],
        });

      // Verify sync_log entry
      const pool = getTestPool();
      const result = await pool.query(
        'SELECT * FROM sync_log WHERE entity_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1',
        [visitId, userId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].entity_type).toBe('visits');
      expect(result.rows[0].operation).toBe('update');
      expect(result.rows[0].user_id).toBe(userId);
    });

    it('should handle multiple changes in single request', async () => {
      const visit2Id = await seedTestVisit(clientId, userId, 'scheduled');

      const response = await request(app)
        .post('/api/sync/push')
        .set('x-user-id', userId)
        .send({
          changes: [
            {
              entity_type: 'visits',
              entity_id: visitId,
              operation: 'update',
              data: { status: 'in_progress' },
              local_timestamp: new Date().toISOString(),
            },
            {
              entity_type: 'visits',
              entity_id: visit2Id,
              operation: 'update',
              data: { status: 'completed' },
              local_timestamp: new Date().toISOString(),
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(2);
      expect(response.body.data.results[0].status).toBe('success');
      expect(response.body.data.results[1].status).toBe('success');
    });

    it('should validate change structure', async () => {
      const response = await request(app)
        .post('/api/sync/push')
        .set('x-user-id', userId)
        .send({
          changes: [
            {
              entity_type: 'visits',
              // Missing entity_id
              operation: 'update',
              data: {},
              local_timestamp: new Date().toISOString(),
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/sync/push')
        .send({
          changes: [
            {
              entity_type: 'visits',
              entity_id: visitId,
              operation: 'update',
              data: {},
              local_timestamp: new Date().toISOString(),
            },
          ],
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Conflict Resolution', () => {
    it('should apply last-write-wins strategy', async () => {
      // Update visit on server
      const pool = getTestPool();
      await pool.query(
        'UPDATE visits SET status = $1, notes = $2, updated_at = NOW() WHERE id = $3',
        ['in_progress', 'Server version', visitId]
      );

      // Push conflicting change
      const response = await request(app)
        .post('/api/sync/push')
        .set('x-user-id', userId)
        .send({
          changes: [
            {
              entity_type: 'visits',
              entity_id: visitId,
              operation: 'update',
              data: {
                status: 'completed',
                notes: 'Client version',
              },
              local_timestamp: new Date(Date.now() - 5000).toISOString(),
            },
          ],
        });

      expect(response.body.data.results[0].status).toBe('conflict');

      // Verify client version was applied (last-write-wins)
      const result = await pool.query('SELECT * FROM visits WHERE id = $1', [visitId]);
      expect(result.rows[0].status).toBe('completed');
      expect(result.rows[0].notes).toBe('Client version');
    });

    it('should log conflict resolution in sync_log', async () => {
      // Update visit on server
      const pool = getTestPool();
      await pool.query('UPDATE visits SET updated_at = NOW() WHERE id = $1', [visitId]);

      // Push conflicting change
      await request(app)
        .post('/api/sync/push')
        .set('x-user-id', userId)
        .send({
          changes: [
            {
              entity_type: 'visits',
              entity_id: visitId,
              operation: 'update',
              data: { notes: 'Conflict test' },
              local_timestamp: new Date(Date.now() - 5000).toISOString(),
            },
          ],
        });

      // Verify sync_log has conflict marked
      const result = await pool.query(
        'SELECT * FROM sync_log WHERE entity_id = $1 AND conflict_resolved = true ORDER BY created_at DESC LIMIT 1',
        [visitId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].conflict_resolved).toBe(true);
      expect(result.rows[0].resolution_strategy).toBe('last_write_wins');
    });
  });

  describe('WebSocket Real-time Sync', () => {
    it('should connect and authenticate via WebSocket', (done) => {
      const serverUrl = 'http://localhost:3003';

      clientSocket = ioClient(serverUrl, {
        transports: ['websocket', 'polling'],
        path: '/socket.io',
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);

        clientSocket.emit('authenticate', {
          user_id: userId,
          organization_id: organizationId,
        });
      });

      clientSocket.on('connection:established', (event) => {
        expect(event.data.user_id).toBe(userId);
        expect(event.data.timestamp).toBeDefined();
        done();
      });

      clientSocket.on('error', (error) => {
        done(error);
      });
    }, 10000);

    it('should receive entity:changed event when push occurs', (done) => {
      const serverUrl = 'http://localhost:3003';

      clientSocket = ioClient(serverUrl, {
        transports: ['websocket', 'polling'],
        path: '/socket.io',
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('authenticate', {
          user_id: userId,
          organization_id: organizationId,
        });
      });

      clientSocket.on('connection:established', async () => {
        // Listen for entity change
        clientSocket.on('entity:changed', (event) => {
          expect(event.data.entity_type).toBe('visits');
          expect(event.data.entity_id).toBe(visitId);
          expect(event.data.operation).toBe('update');
          expect(event.data.data).toBeDefined();
          expect(event.data.user_id).toBe(userId);
          done();
        });

        // Trigger a push that should broadcast
        await request(app)
          .post('/api/sync/push')
          .set('x-user-id', userId)
          .send({
            changes: [
              {
                entity_type: 'visits',
                entity_id: visitId,
                operation: 'update',
                data: {
                  status: 'in_progress',
                  notes: 'WebSocket test',
                },
                local_timestamp: new Date().toISOString(),
              },
            ],
          });
      });
    }, 10000);

    it('should broadcast to organization for shared entities', (done) => {
      const serverUrl = 'http://localhost:3003';

      // Connect second user
      const socket2 = ioClient(serverUrl, {
        transports: ['websocket', 'polling'],
        path: '/socket.io',
      });

      socket2.on('connect', () => {
        socket2.emit('authenticate', {
          user_id: userId2,
          organization_id: organizationId,
        });
      });

      socket2.on('connection:established', async () => {
        // Listen for entity change on second user's socket
        socket2.on('entity:changed', (event) => {
          expect(event.data.entity_type).toBe('clients');
          expect(event.data.entity_id).toBe(clientId);
          expect(event.data.operation).toBe('update');
          socket2.disconnect();
          done();
        });

        // First user updates a client (shared entity)
        await request(app)
          .post('/api/sync/push')
          .set('x-user-id', userId)
          .send({
            changes: [
              {
                entity_type: 'clients',
                entity_id: clientId,
                operation: 'update',
                data: {
                  care_level: 'level_3',
                  organization_id: organizationId,
                },
                local_timestamp: new Date().toISOString(),
              },
            ],
          });
      });
    }, 10000);

    it('should handle disconnection gracefully', (done) => {
      const serverUrl = 'http://localhost:3003';

      clientSocket = ioClient(serverUrl, {
        transports: ['websocket', 'polling'],
        path: '/socket.io',
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('authenticate', {
          user_id: userId,
        });
      });

      clientSocket.on('connection:established', () => {
        clientSocket.disconnect();
      });

      clientSocket.on('disconnect', (reason) => {
        expect(reason).toBeDefined();
        done();
      });
    }, 10000);
  });

  describe('End-to-End Sync Flow', () => {
    it('should complete full sync cycle: pull → push → pull', async () => {
      // 1. Initial pull
      const initialPull = await request(app)
        .post('/api/sync/pull')
        .set('x-user-id', userId)
        .send({
          last_sync_timestamp: new Date(Date.now() - 3600000).toISOString(),
          entity_types: ['visits'],
        });

      expect(initialPull.status).toBe(200);
      const firstSyncTimestamp = initialPull.body.data.sync_timestamp;

      // 2. Push changes
      const push = await request(app)
        .post('/api/sync/push')
        .set('x-user-id', userId)
        .send({
          changes: [
            {
              entity_type: 'visits',
              entity_id: visitId,
              operation: 'update',
              data: {
                status: 'completed',
                actual_end: new Date().toISOString(),
              },
              local_timestamp: new Date().toISOString(),
            },
          ],
        });

      expect(push.status).toBe(200);
      expect(push.body.data.results[0].status).toBe('success');

      // 3. Pull again to get the change
      const secondPull = await request(app)
        .post('/api/sync/pull')
        .set('x-user-id', userId)
        .send({
          last_sync_timestamp: firstSyncTimestamp,
          entity_types: ['visits'],
        });

      expect(secondPull.status).toBe(200);
      expect(secondPull.body.data.changes.visits.length).toBeGreaterThan(0);

      const updatedVisit = secondPull.body.data.changes.visits.find((v: any) => v.id === visitId);
      expect(updatedVisit).toBeDefined();
      expect(updatedVisit.data.status).toBe('completed');
    });
  });

  describe('Health Check', () => {
    it('should return health status with WebSocket metrics', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('sync-service');
      expect(response.body.websocket).toBeDefined();
      expect(response.body.websocket.connected_users).toBeDefined();
    });
  });
});
