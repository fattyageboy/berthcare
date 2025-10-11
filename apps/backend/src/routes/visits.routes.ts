/**
 * Visit Documentation Routes
 *
 * Handles visit documentation endpoints:
 * - POST /v1/visits - Start a visit (check-in)
 * - PATCH /v1/visits/:visitId - Update/complete visit
 * - GET /v1/visits - List visits with filtering
 * - GET /v1/visits/:visitId - Get visit details
 *
 * Reference: Architecture Blueprint - Visit Documentation Endpoints
 * Task: V4 - Implement POST /v1/visits endpoint
 *
 * Philosophy: "Offline-first everything"
 * - Instant local operations
 * - GPS auto-check-in
 * - Smart data reuse from previous visits
 * - Auto-save documentation
 */

import { Request, Response, Router } from 'express';
import { Pool } from 'pg';

import { logError, logInfo } from '../config/logger';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

/**
 * Create visit request body
 */
interface CreateVisitRequest {
  clientId: string;
  scheduledStartTime: string;
  checkInTime?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  copiedFromVisitId?: string;
}

/**
 * Visit response
 */
interface VisitResponse {
  id: string;
  clientId: string;
  staffId: string;
  scheduledStartTime: string;
  checkInTime: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  status: string;
  createdAt: string;
}

/**
 * Create visits router
 */
export function createVisitsRouter(pool: Pool): Router {
  const router = Router();

  /**
   * POST /v1/visits
   * Start a visit (check-in)
   *
   * Creates a new visit record with check-in time and GPS coordinates.
   * Supports smart data reuse by copying documentation from a previous visit.
   *
   * Authentication: Required (caregiver role)
   * Authorization: Caregiver can only create visits for clients in their zone
   *
   * Request Body:
   * - clientId: UUID of the client being visited
   * - scheduledStartTime: ISO 8601 timestamp
   * - checkInTime: ISO 8601 timestamp (optional, defaults to now)
   * - checkInLatitude: GPS latitude (optional)
   * - checkInLongitude: GPS longitude (optional)
   * - copiedFromVisitId: UUID of previous visit to copy documentation from (optional)
   *
   * Response: 201 Created
   * - Visit object with id, status 'in_progress'
   *
   * Errors:
   * - 400: Invalid request data
   * - 404: Client not found
   * - 403: Caregiver not authorized for this client's zone
   * - 409: Visit already exists for this time slot
   */
  router.post('/', authenticateJWT, async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;
    const userRole = authReq.user?.role;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Only caregivers can create visits
    if (userRole !== 'caregiver') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only caregivers can create visits',
      });
    }

    const {
      clientId,
      scheduledStartTime,
      checkInTime,
      checkInLatitude,
      checkInLongitude,
      copiedFromVisitId,
    } = req.body as CreateVisitRequest;

    // Validate required fields
    if (!clientId || !scheduledStartTime) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'clientId and scheduledStartTime are required',
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid clientId format',
      });
    }

    if (copiedFromVisitId && !uuidRegex.test(copiedFromVisitId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid copiedFromVisitId format',
      });
    }

    // Validate GPS coordinates if provided
    if (checkInLatitude !== undefined && (checkInLatitude < -90 || checkInLatitude > 90)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'checkInLatitude must be between -90 and 90',
      });
    }

    if (checkInLongitude !== undefined && (checkInLongitude < -180 || checkInLongitude > 180)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'checkInLongitude must be between -180 and 180',
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if client exists and get their zone
      const clientResult = await client.query(
        `SELECT id, zone_id, first_name, last_name 
         FROM clients 
         WHERE id = $1 AND deleted_at IS NULL`,
        [clientId]
      );

      if (clientResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Not Found',
          message: 'Client not found',
        });
      }

      const clientData = clientResult.rows[0];
      const clientZoneId = clientData.zone_id;

      // Check if caregiver is in the same zone as the client
      const caregiverResult = await client.query(`SELECT zone_id FROM users WHERE id = $1`, [
        userId,
      ]);

      if (caregiverResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Caregiver not found',
        });
      }

      const caregiverZoneId = caregiverResult.rows[0].zone_id;

      if (caregiverZoneId !== clientZoneId) {
        await client.query('ROLLBACK');
        logInfo('Visit creation denied: zone mismatch', {
          userId,
          clientId,
          caregiverZone: caregiverZoneId,
          clientZone: clientZoneId,
        });
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Cannot create visit for client in different zone',
        });
      }

      // Check for overlapping visits (same client, overlapping time)
      const overlapCheck = await client.query(
        `SELECT id FROM visits 
         WHERE client_id = $1 
         AND status IN ('scheduled', 'in_progress')
         AND scheduled_start_time = $2`,
        [clientId, scheduledStartTime]
      );

      if (overlapCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'Conflict',
          message: 'Visit already exists for this time slot',
        });
      }

      // Use provided check-in time or current time
      const actualCheckInTime = checkInTime || new Date().toISOString();

      // Create the visit
      const visitResult = await client.query(
        `INSERT INTO visits (
          client_id,
          staff_id,
          scheduled_start_time,
          check_in_time,
          check_in_latitude,
          check_in_longitude,
          status,
          copied_from_visit_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING 
          id,
          client_id,
          staff_id,
          scheduled_start_time,
          check_in_time,
          check_in_latitude,
          check_in_longitude,
          status,
          created_at`,
        [
          clientId,
          userId,
          scheduledStartTime,
          actualCheckInTime,
          checkInLatitude ?? null,
          checkInLongitude ?? null,
          'in_progress',
          copiedFromVisitId ?? null,
        ]
      );

      const visit = visitResult.rows[0];

      // If copiedFromVisitId is provided, copy documentation
      if (copiedFromVisitId) {
        // Verify the source visit exists and belongs to the same client
        const sourceVisitResult = await client.query(
          `SELECT id, client_id FROM visits WHERE id = $1`,
          [copiedFromVisitId]
        );

        if (sourceVisitResult.rows.length > 0) {
          const sourceVisit = sourceVisitResult.rows[0];

          // Only copy if it's for the same client
          if (sourceVisit.client_id === clientId) {
            // Copy documentation from previous visit
            const sourceDocResult = await client.query(
              `SELECT vital_signs, activities, observations 
               FROM visit_documentation 
               WHERE visit_id = $1`,
              [copiedFromVisitId]
            );

            if (sourceDocResult.rows.length > 0) {
              const sourceDoc = sourceDocResult.rows[0];

              // Create documentation for new visit with copied data
              await client.query(
                `INSERT INTO visit_documentation (
                  visit_id,
                  vital_signs,
                  activities,
                  observations
                ) VALUES ($1, $2, $3, $4)`,
                [visit.id, sourceDoc.vital_signs, sourceDoc.activities, sourceDoc.observations]
              );

              logInfo('Documentation copied from previous visit', {
                newVisitId: visit.id,
                sourceVisitId: copiedFromVisitId,
                clientId,
              });
            }
          } else {
            logInfo('Documentation copy skipped: different client', {
              newVisitId: visit.id,
              sourceVisitId: copiedFromVisitId,
              sourceClientId: sourceVisit.client_id,
              targetClientId: clientId,
            });
          }
        }
      }

      await client.query('COMMIT');

      logInfo('Visit created successfully', {
        visitId: visit.id,
        clientId,
        staffId: userId,
        checkInTime: actualCheckInTime,
        hasGPS: checkInLatitude !== undefined && checkInLongitude !== undefined,
        copiedFromVisit: !!copiedFromVisitId,
      });

      // Return visit data
      const response: VisitResponse = {
        id: visit.id,
        clientId: visit.client_id,
        staffId: visit.staff_id,
        scheduledStartTime: visit.scheduled_start_time,
        checkInTime: visit.check_in_time,
        checkInLatitude: visit.check_in_latitude,
        checkInLongitude: visit.check_in_longitude,
        status: visit.status,
        createdAt: visit.created_at,
      };

      return res.status(201).json(response);
    } catch (error) {
      await client.query('ROLLBACK');
      logError('Error creating visit', error as Error, {
        clientId,
        userId,
      });

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create visit',
      });
    } finally {
      client.release();
    }
  });

  return router;
}
