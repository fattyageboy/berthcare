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
import { createClient } from 'redis';

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
 * Invalidate all cached visit list queries
 *
 * Deletes all Redis keys matching the visits:list:* pattern to ensure
 * subsequent list requests fetch fresh data from the database after
 * visits are created or updated.
 *
 * @param redisClient - Redis client instance
 */
async function invalidateVisitListCache(
  redisClient: ReturnType<typeof createClient>
): Promise<void> {
  try {
    // Find all keys matching the visits list cache pattern
    const keys = await redisClient.keys('visits:list:*');

    if (keys.length > 0) {
      // Delete all matching keys
      await redisClient.del(keys);
      logInfo('Visit list cache invalidated', { keysDeleted: keys.length });
    }
  } catch (error) {
    // Log error but don't fail the request - cache invalidation is not critical
    logError('Failed to invalidate visit list cache', error as Error);
  }
}

/**
 * Create visits router
 */
export function createVisitsRouter(
  pool: Pool,
  redisClient: ReturnType<typeof createClient>
): Router {
  const router = Router();

  /**
   * GET /v1/visits
   * List visits with filtering and pagination
   *
   * Returns a paginated list of visits with optional filtering by staff, client,
   * date range, and status. Supports Redis caching for performance.
   *
   * Authentication: Required
   * Authorization: Caregivers see only their visits, coordinators/admins see all in zone
   *
   * Security: Cache keys are scoped per user/zone to prevent cross-user data leakage.
   * User validation occurs BEFORE cache lookup to ensure proper authorization.
   *
   * Query Parameters:
   * - staffId: UUID (optional) - Filter by staff member
   * - clientId: UUID (optional) - Filter by client
   * - startDate: ISO 8601 (optional) - Filter visits from this date
   * - endDate: ISO 8601 (optional) - Filter visits until this date
   * - status: string (optional) - Filter by status (scheduled, in_progress, completed, cancelled)
   * - page: number (optional, default: 1) - Page number
   * - limit: number (optional, default: 50, max: 100) - Results per page
   *
   * Response: 200 OK
   * - Array of visit summaries with client names
   * - Pagination metadata
   *
   * Errors:
   * - 400: Invalid query parameters
   * - 401: Unauthorized
   * - 403: Forbidden (access denied)
   */
  router.get('/', authenticateJWT, async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Parse query parameters
    const { staffId, clientId, startDate, endDate, status, page = '1', limit = '50' } = req.query;

    // Validate and parse pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    // Validate UUID formats if provided
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (staffId && !uuidRegex.test(staffId as string)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid staffId format',
      });
    }

    if (clientId && !uuidRegex.test(clientId as string)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid clientId format',
      });
    }

    // Validate status if provided
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status as string)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid status. Must be one of: scheduled, in_progress, completed, cancelled',
      });
    }

    // Validate dates if provided
    if (startDate && isNaN(Date.parse(startDate as string))) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid startDate format. Must be ISO 8601',
      });
    }

    if (endDate && isNaN(Date.parse(endDate as string))) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid endDate format. Must be ISO 8601',
      });
    }

    try {
      // Get user's zone and role for authorization BEFORE checking cache
      const userResult = await pool.query('SELECT zone_id, role FROM users WHERE id = $1', [
        userId,
      ]);

      if (userResult.rows.length === 0) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'User not found',
        });
      }

      const userZoneId = userResult.rows[0].zone_id;
      const userRoleFromDb = userResult.rows[0].role;

      // Build cache key with user-specific scope to prevent cross-user data leakage
      // For caregivers: include userId (they only see their own visits)
      // For coordinators/admins: include zoneId (they see all visits in their zone)
      const principalScope =
        userRoleFromDb === 'caregiver' ? `user:${userId}` : `zone:${userZoneId}`;
      const cacheKey = `visits:list:${principalScope}:staff=${staffId || 'all'}:client=${clientId || 'all'}:start=${startDate || 'all'}:end=${endDate || 'all'}:status=${status || 'all'}:page=${pageNum}:limit=${limitNum}`;

      // Try to get from cache AFTER building user-scoped cache key
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logInfo('Visits list cache hit', { cacheKey, userId, principalScope });
        return res.status(200).json({
          ...JSON.parse(cached),
          meta: { cached: true },
        });
      }

      // Build WHERE clause based on filters and authorization
      const conditions: string[] = [];
      const values: (string | number)[] = [];
      let paramCount = 1;

      // Authorization: caregivers can only see their own visits
      if (userRoleFromDb === 'caregiver') {
        conditions.push(`v.staff_id = $${paramCount}`);
        values.push(userId);
        paramCount++;
      } else {
        // Coordinators and admins see visits in their zone
        conditions.push(`c.zone_id = $${paramCount}`);
        values.push(userZoneId);
        paramCount++;
      }

      // Apply filters
      if (staffId) {
        conditions.push(`v.staff_id = $${paramCount}`);
        values.push(staffId as string);
        paramCount++;
      }

      if (clientId) {
        conditions.push(`v.client_id = $${paramCount}`);
        values.push(clientId as string);
        paramCount++;
      }

      if (startDate) {
        conditions.push(`v.scheduled_start_time >= $${paramCount}`);
        values.push(startDate as string);
        paramCount++;
      }

      if (endDate) {
        conditions.push(`v.scheduled_start_time <= $${paramCount}`);
        values.push(endDate as string);
        paramCount++;
      }

      if (status) {
        conditions.push(`v.status = $${paramCount}`);
        values.push(status as string);
        paramCount++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM visits v
        INNER JOIN clients c ON v.client_id = c.id
        ${whereClause}
      `;

      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total, 10);
      const totalPages = Math.ceil(total / limitNum);

      // Get paginated visits
      const visitsQuery = `
        SELECT 
          v.id,
          v.client_id,
          c.first_name || ' ' || c.last_name as client_name,
          v.staff_id,
          u.first_name || ' ' || u.last_name as staff_name,
          v.scheduled_start_time,
          v.check_in_time,
          v.check_out_time,
          v.duration_minutes,
          v.status,
          v.created_at
        FROM visits v
        INNER JOIN clients c ON v.client_id = c.id
        INNER JOIN users u ON v.staff_id = u.id
        ${whereClause}
        ORDER BY v.scheduled_start_time DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      const visitsResult = await pool.query(visitsQuery, [...values, limitNum, offset]);

      const response = {
        data: {
          visits: visitsResult.rows.map((row) => ({
            id: row.id,
            clientId: row.client_id,
            clientName: row.client_name,
            staffId: row.staff_id,
            staffName: row.staff_name,
            scheduledStartTime: row.scheduled_start_time,
            checkInTime: row.check_in_time,
            checkOutTime: row.check_out_time,
            duration: row.duration_minutes,
            status: row.status,
            createdAt: row.created_at,
          })),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
          },
        },
      };

      // Cache the response for 5 minutes
      await redisClient.setEx(cacheKey, 300, JSON.stringify(response));

      logInfo('Visits list fetched successfully', {
        userId,
        userRole: userRoleFromDb,
        principalScope,
        total,
        page: pageNum,
        filters: { staffId, clientId, startDate, endDate, status },
      });

      return res.status(200).json(response);
    } catch (error) {
      logError('Error fetching visits list', error as Error, {
        userId,
        filters: { staffId, clientId, startDate, endDate, status },
      });

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch visits',
      });
    }
  });

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

      // Invalidate cached visit lists after successful creation
      await invalidateVisitListCache(redisClient);

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

  /**
   * PATCH /v1/visits/:visitId
   * Update a visit (including check-out/completion)
   *
   * Updates visit details, records check-out time and GPS, calculates duration,
   * and changes status to 'completed'. Supports partial updates to documentation.
   *
   * Authentication: Required (caregiver role)
   * Authorization: Caregiver must own the visit (or be coordinator/admin)
   *
   * Request Body:
   * - checkOutTime: ISO 8601 timestamp (optional)
   * - checkOutLatitude: GPS latitude (optional)
   * - checkOutLongitude: GPS longitude (optional)
   * - status: 'completed' | 'cancelled' (optional)
   * - documentation: Partial documentation updates (optional)
   *
   * Response: 200 OK
   * - Updated visit object with calculated duration
   *
   * Errors:
   * - 400: Invalid request data
   * - 404: Visit not found
   * - 403: Not authorized to update this visit
   */
  router.patch('/:visitId', authenticateJWT, async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;
    const userRole = authReq.user?.role;
    const { visitId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(visitId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid visitId format',
      });
    }

    const { checkOutTime, checkOutLatitude, checkOutLongitude, status, documentation } = req.body;

    // Validate GPS coordinates if provided
    if (checkOutLatitude !== undefined && (checkOutLatitude < -90 || checkOutLatitude > 90)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'checkOutLatitude must be between -90 and 90',
      });
    }

    if (checkOutLongitude !== undefined && (checkOutLongitude < -180 || checkOutLongitude > 180)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'checkOutLongitude must be between -180 and 180',
      });
    }

    // Validate status if provided
    if (status && !['completed', 'cancelled', 'in_progress'].includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'status must be one of: completed, cancelled, in_progress',
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get visit and verify ownership
      const visitResult = await client.query(
        `SELECT id, staff_id, client_id, check_in_time, check_out_time, status
         FROM visits 
         WHERE id = $1`,
        [visitId]
      );

      if (visitResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Not Found',
          message: 'Visit not found',
        });
      }

      const visit = visitResult.rows[0];

      // Authorization check: caregiver must own the visit, or be coordinator/admin
      if (userRole === 'caregiver' && visit.staff_id !== userId) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update your own visits',
        });
      }

      // Build update query dynamically based on provided fields
      const updates: string[] = [];
      const values: (string | number | null)[] = [];
      let paramCount = 1;

      if (checkOutTime !== undefined) {
        updates.push(`check_out_time = $${paramCount}`);
        values.push(checkOutTime);
        paramCount++;
      }

      if (checkOutLatitude !== undefined) {
        updates.push(`check_out_latitude = $${paramCount}`);
        values.push(checkOutLatitude ?? null);
        paramCount++;
      }

      if (checkOutLongitude !== undefined) {
        updates.push(`check_out_longitude = $${paramCount}`);
        values.push(checkOutLongitude ?? null);
        paramCount++;
      }

      if (status !== undefined) {
        updates.push(`status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }

      // Calculate duration if check-out time is provided
      if (checkOutTime && visit.check_in_time) {
        const checkInTime = new Date(visit.check_in_time);
        const checkOutTimeDate = new Date(checkOutTime);
        const durationMinutes = Math.round(
          (checkOutTimeDate.getTime() - checkInTime.getTime()) / (1000 * 60)
        );

        updates.push(`duration_minutes = $${paramCount}`);
        values.push(durationMinutes);
        paramCount++;
      }

      // Update visit if there are changes
      if (updates.length > 0) {
        values.push(visitId);
        const updateQuery = `
          UPDATE visits 
          SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramCount}
          RETURNING *
        `;

        const updatedVisitResult = await client.query(updateQuery, values);
        const updatedVisit = updatedVisitResult.rows[0];

        await client.query('COMMIT');

        // Invalidate cached visit lists after successful update
        await invalidateVisitListCache(redisClient);

        logInfo('Visit updated successfully', {
          visitId,
          userId,
          status: updatedVisit.status,
          duration: updatedVisit.duration_minutes,
          hasCheckOut: !!checkOutTime,
          hasDocumentation: !!documentation,
        });

        // Return updated visit data
        const response: VisitResponse = {
          id: updatedVisit.id,
          clientId: updatedVisit.client_id,
          staffId: updatedVisit.staff_id,
          scheduledStartTime: updatedVisit.scheduled_start_time,
          checkInTime: updatedVisit.check_in_time,
          checkInLatitude: updatedVisit.check_in_latitude,
          checkInLongitude: updatedVisit.check_in_longitude,
          status: updatedVisit.status,
          createdAt: updatedVisit.created_at,
        };

        return res.status(200).json(response);
      } else {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No updates provided',
        });
      }

      // Update documentation if provided
      if (documentation) {
        // Check if documentation exists
        const docResult = await client.query(
          'SELECT id FROM visit_documentation WHERE visit_id = $1',
          [visitId]
        );

        if (docResult.rows.length > 0) {
          // Update existing documentation
          const docUpdates: string[] = [];
          const docValues: (string | null)[] = [];
          let docParamCount = 1;

          if (documentation.vitalSigns !== undefined) {
            docUpdates.push(`vital_signs = $${docParamCount}`);
            docValues.push(JSON.stringify(documentation.vitalSigns));
            docParamCount++;
          }

          if (documentation.activities !== undefined) {
            docUpdates.push(`activities = $${docParamCount}`);
            docValues.push(JSON.stringify(documentation.activities));
            docParamCount++;
          }

          if (documentation.observations !== undefined) {
            docUpdates.push(`observations = $${docParamCount}`);
            docValues.push(documentation.observations);
            docParamCount++;
          }

          if (documentation.concerns !== undefined) {
            docUpdates.push(`concerns = $${docParamCount}`);
            docValues.push(documentation.concerns);
            docParamCount++;
          }

          if (docUpdates.length > 0) {
            docValues.push(visitId);
            await client.query(
              `UPDATE visit_documentation 
               SET ${docUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP
               WHERE visit_id = $${docParamCount}`,
              docValues as (string | null)[]
            );
          }
        } else {
          // Create new documentation
          await client.query(
            `INSERT INTO visit_documentation (
              visit_id, vital_signs, activities, observations, concerns
            ) VALUES ($1, $2, $3, $4, $5)`,
            [
              visitId,
              documentation.vitalSigns ? JSON.stringify(documentation.vitalSigns) : null,
              documentation.activities ? JSON.stringify(documentation.activities) : null,
              documentation.observations || null,
              documentation.concerns || null,
            ]
          );
        }
      }
    } catch (error) {
      await client.query('ROLLBACK');
      logError('Error updating visit', error as Error, {
        visitId,
        userId,
      });

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update visit',
      });
    } finally {
      client.release();
    }
  });

  return router;
}
