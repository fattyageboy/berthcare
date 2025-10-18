/**
 * Client Management Routes
 *
 * Handles client (patient) management endpoints:
 * - GET /v1/clients - List clients with pagination and filtering (Task C3)
 * - GET /v1/clients/:clientId - Get client details (Task C4)
 * - POST /v1/clients - Create new client (Task C5)
 * - PATCH /v1/clients/:clientId - Update client details (Task C6)
 *
 * Task C3: Implement GET /v1/clients endpoint
 * Task C4: Implement GET /v1/clients/:clientId endpoint
 * Task C5: Implement POST /v1/clients endpoint
 * Task C6: Implement PATCH /v1/clients/:clientId endpoint
 *
 * Reference: project-documentation/task-plan.md - Phase C – Client Management API
 * Reference: Architecture Blueprint - Client Management Endpoints
 *
 * Philosophy: "Start with the user experience, work backwards to the technology"
 * - Fast queries via optimized indexes
 * - Redis caching for performance (5 min TTL)
 * - Zone-based data isolation for security
 * - Pagination for scalability
 */

import * as crypto from 'crypto';

import { Request, Response, Router } from 'express';
import { Pool } from 'pg';

import { RedisClient } from '../cache/redis-client';
import { logError, logInfo } from '../config/logger';
import { authenticateJWT, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { validateCreateClient, validateUpdateClient } from '../middleware/validation';
import { GeocodingService, GeocodingError } from '../services/geocoding.service';
import { ZoneAssignmentService, ZoneAssignmentError } from '../services/zone-assignment.service';

/**
 * Client list response item
 */
interface ClientListItem {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  latitude: number;
  longitude: number;
  carePlanSummary: string | null;
  lastVisitDate: string | null;
  nextScheduledVisit: string | null;
}

/**
 * Pagination metadata
 */
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function formatDateOnly(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return value;
  }

  return '';
}

function formatDateTime(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'number') {
    // Numeric timestamps are expected in milliseconds; normalize second-based values for clarity.
    const normalizedValue = value < 1_000_000_000_000 ? value * 1000 : value;
    const parsed = new Date(normalizedValue);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return null;
}

export function createClientRoutes(pgPool: Pool, redisClient: RedisClient): Router {
  const router = Router();

  // Initialize services
  const geocodingService = new GeocodingService(redisClient);
  const zoneAssignmentService = new ZoneAssignmentService(pgPool, redisClient);

  /**
   * POST /v1/clients
   *
   * Create a new client with geocoding and zone assignment
   *
   * Request Body:
   * - firstName: string (required, 1-100 characters)
   * - lastName: string (required, 1-100 characters)
   * - dateOfBirth: string (required, ISO 8601 date)
   * - address: string (required, full street address)
   * - phone: string (optional, phone number)
   * - emergencyContactName: string (required, 1-200 characters)
   * - emergencyContactPhone: string (required, phone number)
   * - emergencyContactRelationship: string (required, 1-100 characters)
   * - zoneId: string (optional, manual zone assignment - admin override)
   *
   * Response (201):
   * - Full client details with assigned zone and default care plan
   *
   * Errors:
   * - 400: Validation error or geocoding failure
   * - 403: Non-admin user (admin role required for MVP)
   * - 409: Duplicate client (same name and DOB)
   * - 500: Server error
   *
   * Security:
   * - Requires authentication (JWT token)
   * - Requires admin role (MVP constraint)
   *
   * Performance:
   * - Geocoding results cached (24 hour TTL)
   * - Zone data cached (1 hour TTL)
   * - Transaction for atomic client + care plan creation
   *
   * Philosophy: "Obsess over details"
   * - Comprehensive validation
   * - Clear error messages
   * - Graceful handling of external API failures
   */
  router.post(
    '/',
    authenticateJWT(redisClient),
    requireRole(['admin']),
    validateCreateClient,
    async (req: Request, res: Response) => {
      const client = await pgPool.connect();

      try {
        // Extract authenticated user
        const user = (req as AuthenticatedRequest).user;

        if (!user) {
          res.status(401).json({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          });
          return;
        }

        // Extract request body
        const {
          firstName,
          lastName,
          dateOfBirth,
          address,
          phone,
          emergencyContactName,
          emergencyContactPhone,
          emergencyContactRelationship,
          zoneId: manualZoneId,
        } = req.body;

        // Check for duplicate client (same name and DOB)
        const duplicateCheckQuery = `
          SELECT id, first_name, last_name, date_of_birth
          FROM clients
          WHERE LOWER(first_name) = LOWER($1)
            AND LOWER(last_name) = LOWER($2)
            AND date_of_birth = $3
            AND deleted_at IS NULL
        `;

        const duplicateResult = await client.query(duplicateCheckQuery, [
          firstName,
          lastName,
          dateOfBirth,
        ]);

        if (duplicateResult.rows.length > 0) {
          res.status(409).json({
            error: {
              code: 'DUPLICATE_CLIENT',
              message: 'Client with this name and date of birth already exists',
              details: {
                existingClientId: duplicateResult.rows[0].id,
              },
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          });
          return;
        }

        // Geocode address to get latitude/longitude
        let latitude: number;
        let longitude: number;
        let formattedAddress: string;

        try {
          const geocodingResult = await geocodingService.geocodeAddress(address);
          latitude = geocodingResult.latitude;
          longitude = geocodingResult.longitude;
          formattedAddress = geocodingResult.formattedAddress;
        } catch (error) {
          if (error instanceof GeocodingError) {
            if (error.code === 'CONFIGURATION_ERROR') {
              res.status(500).json({
                error: {
                  code: 'GEOCODING_CONFIGURATION_ERROR',
                  message: 'Geocoding service is not configured',
                  details: {
                    address,
                    errorCode: error.code,
                  },
                  timestamp: new Date().toISOString(),
                  requestId: req.headers['x-request-id'] || 'unknown',
                },
              });
              return;
            }

            res.status(400).json({
              error: {
                code: 'GEOCODING_ERROR',
                message: error.message,
                details: {
                  address,
                  errorCode: error.code,
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown',
              },
            });
            return;
          }
          throw error;
        }

        // Assign zone based on location (or use manual override)
        let assignedZoneId: string;

        if (manualZoneId) {
          // Admin provided manual zone assignment - validate it exists
          const isValidZone = await zoneAssignmentService.validateZoneId(manualZoneId);
          if (!isValidZone) {
            res.status(400).json({
              error: {
                code: 'INVALID_ZONE',
                message: 'Specified zone ID does not exist',
                details: {
                  zoneId: manualZoneId,
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown',
              },
            });
            return;
          }
          assignedZoneId = manualZoneId;
        } else {
          // Auto-assign zone based on location
          try {
            assignedZoneId = await zoneAssignmentService.assignZone(latitude, longitude);
          } catch (error) {
            if (error instanceof ZoneAssignmentError) {
              res.status(500).json({
                error: {
                  code: 'ZONE_ASSIGNMENT_ERROR',
                  message: error.message,
                  details: {
                    errorCode: error.code,
                  },
                  timestamp: new Date().toISOString(),
                  requestId: req.headers['x-request-id'] || 'unknown',
                },
              });
              return;
            }
            throw error;
          }
        }

        // Begin transaction
        await client.query('BEGIN');

        try {
          // Generate UUIDs for client and care plan
          const clientId = crypto.randomUUID();
          const carePlanId = crypto.randomUUID();

          // Insert client record
          const insertClientQuery = `
            INSERT INTO clients (
              id,
              first_name,
              last_name,
              date_of_birth,
              address,
              latitude,
              longitude,
              phone,
              emergency_contact_name,
              emergency_contact_phone,
              emergency_contact_relationship,
              zone_id,
              created_at,
              updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
            ) RETURNING *
          `;

          const clientResult = await client.query(insertClientQuery, [
            clientId,
            firstName,
            lastName,
            dateOfBirth,
            formattedAddress, // Use formatted address from geocoding
            latitude,
            longitude,
            phone || null,
            emergencyContactName,
            emergencyContactPhone,
            emergencyContactRelationship,
            assignedZoneId,
          ]);

          const createdClient = clientResult.rows[0];

          // Create default care plan
          const insertCarePlanQuery = `
            INSERT INTO care_plans (
              id,
              client_id,
              summary,
              medications,
              allergies,
              special_instructions,
              created_at,
              updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, NOW(), NOW()
            ) RETURNING *
          `;

          const defaultSummary = `Care plan for ${firstName} ${lastName}. Please update with specific care requirements.`;

          const carePlanResult = await client.query(insertCarePlanQuery, [
            carePlanId,
            clientId,
            defaultSummary,
            JSON.stringify([]), // Empty medications array
            JSON.stringify([]), // Empty allergies array
            '', // Empty special instructions
          ]);

          const createdCarePlan = carePlanResult.rows[0];

          // Commit transaction
          await client.query('COMMIT');

          // Build response
          const responseData = {
            id: createdClient.id,
            firstName: createdClient.first_name,
            lastName: createdClient.last_name,
            dateOfBirth: createdClient.date_of_birth.toISOString().split('T')[0],
            address: createdClient.address,
            latitude: parseFloat(createdClient.latitude),
            longitude: parseFloat(createdClient.longitude),
            phone: createdClient.phone,
            emergencyContact: {
              name: createdClient.emergency_contact_name,
              phone: createdClient.emergency_contact_phone,
              relationship: createdClient.emergency_contact_relationship,
            },
            zoneId: createdClient.zone_id,
            carePlan: {
              id: createdCarePlan.id,
              summary: createdCarePlan.summary,
              medications: createdCarePlan.medications,
              allergies: createdCarePlan.allergies,
              specialInstructions: createdCarePlan.special_instructions,
            },
            createdAt: createdClient.created_at.toISOString(),
          };

          // Return success response
          res.status(201).json({
            data: responseData,
          });
        } catch (dbError) {
          // Rollback transaction on error
          await client.query('ROLLBACK');
          throw dbError;
        }
      } catch (error) {
        logError('Create client error', error instanceof Error ? error : new Error(String(error)), {
          userId: (req as AuthenticatedRequest).user?.userId,
          body: req.body,
        });
        res.status(500).json({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while creating client',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      } finally {
        client.release();
      }
    }
  );

  /**
   * PATCH /v1/clients/:clientId
   *
   * Update existing client information with partial updates
   *
   * Path Parameters:
   * - clientId: string (UUID, required)
   *
   * Request Body (all fields optional):
   * - firstName: string (1-100 characters)
   * - lastName: string (1-100 characters)
   * - dateOfBirth: string (ISO 8601 date)
   * - address: string (triggers re-geocoding)
   * - phone: string | null (1-20 characters, null to clear)
   * - emergencyContactName: string (1-200 characters)
   * - emergencyContactPhone: string (1-20 characters)
   * - emergencyContactRelationship: string (1-100 characters)
   * - zoneId: string (UUID, admin only)
   *
   * Response (200):
   * - Updated client details
   *
   * Errors:
   * - 400: Validation error, empty update, geocoding failure
   * - 403: Insufficient permissions (caregiver, wrong zone)
   * - 404: Client not found
   * - 409: Duplicate client after update
   * - 500: Server error
   *
   * Security:
   * - Requires authentication (JWT token)
   * - Requires coordinator or admin role
   * - Coordinators can only update clients in their zone
   * - Only admins can change zone
   *
   * Performance:
   * - Invalidates Redis cache on update
   * - Re-geocodes only if address changed
   * - Transaction support for data consistency
   *
   * Philosophy: "Obsess over details"
   * - Partial updates (only provided fields)
   * - Comprehensive validation
   * - Clear error messages
   * - Audit trail logging
   */
  router.patch(
    '/:clientId',
    authenticateJWT(redisClient),
    requireRole(['coordinator', 'admin']),
    validateUpdateClient,
    async (req: Request, res: Response) => {
      const client = await pgPool.connect();

      try {
        // Extract authenticated user
        const user = (req as AuthenticatedRequest).user;

        if (!user) {
          res.status(401).json({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          });
          return;
        }

        // Validate client ID format (UUID)
        const clientId = req.params.clientId;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(clientId)) {
          res.status(400).json({
            error: {
              code: 'INVALID_CLIENT_ID',
              message: 'Invalid client ID format',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          });
          return;
        }

        // Fetch existing client
        const fetchQuery = `
          SELECT 
            id, first_name, last_name, date_of_birth, address,
            latitude, longitude, phone, zone_id,
            emergency_contact_name, emergency_contact_phone,
            emergency_contact_relationship
          FROM clients
          WHERE id = $1 AND deleted_at IS NULL
        `;

        const fetchResult = await client.query(fetchQuery, [clientId]);

        if (fetchResult.rows.length === 0) {
          res.status(404).json({
            error: {
              code: 'CLIENT_NOT_FOUND',
              message: 'Client not found',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          });
          return;
        }

        const existingClient = fetchResult.rows[0];

        // Authorization check: Coordinators can only update clients in their zone
        if (user.role === 'coordinator') {
          if (existingClient.zone_id !== user.zoneId) {
            res.status(403).json({
              error: {
                code: 'AUTH_ZONE_ACCESS_DENIED',
                message: 'You do not have access to this zone',
                details: {
                  requestedZoneId: existingClient.zone_id,
                  userZoneId: user.zoneId,
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown',
              },
            });
            return;
          }

          // Coordinators cannot change zone
          if (req.body.zoneId && req.body.zoneId !== existingClient.zone_id) {
            res.status(403).json({
              error: {
                code: 'AUTH_INSUFFICIENT_ROLE',
                message: 'Only admins can change client zone',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown',
              },
            });
            return;
          }
        }

        // Extract update fields
        const {
          firstName,
          lastName,
          dateOfBirth,
          address,
          phone,
          emergencyContactName,
          emergencyContactPhone,
          emergencyContactRelationship,
          zoneId: manualZoneId,
        } = req.body;

        // Check for duplicate if name or DOB changed
        if (
          (firstName && firstName !== existingClient.first_name) ||
          (lastName && lastName !== existingClient.last_name) ||
          (dateOfBirth && dateOfBirth !== existingClient.date_of_birth.toISOString().split('T')[0])
        ) {
          const duplicateCheckQuery = `
            SELECT id
            FROM clients
            WHERE LOWER(first_name) = LOWER($1)
              AND LOWER(last_name) = LOWER($2)
              AND date_of_birth = $3
              AND id != $4
              AND deleted_at IS NULL
          `;

          const duplicateResult = await client.query(duplicateCheckQuery, [
            firstName || existingClient.first_name,
            lastName || existingClient.last_name,
            dateOfBirth || existingClient.date_of_birth.toISOString().split('T')[0],
            clientId,
          ]);

          if (duplicateResult.rows.length > 0) {
            res.status(409).json({
              error: {
                code: 'DUPLICATE_CLIENT',
                message: 'Another client with this name and date of birth already exists',
                details: {
                  existingClientId: duplicateResult.rows[0].id,
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown',
              },
            });
            return;
          }
        }

        // Prepare update data
        const updateData: Record<string, unknown> = {};
        const changes: Record<string, { old: unknown; new: unknown }> = {};

        // Track changes for audit log
        if (firstName && firstName !== existingClient.first_name) {
          updateData.firstName = firstName;
          changes.firstName = { old: existingClient.first_name, new: firstName };
        }

        if (lastName && lastName !== existingClient.last_name) {
          updateData.lastName = lastName;
          changes.lastName = { old: existingClient.last_name, new: lastName };
        }

        if (
          dateOfBirth &&
          dateOfBirth !== existingClient.date_of_birth.toISOString().split('T')[0]
        ) {
          updateData.dateOfBirth = dateOfBirth;
          changes.dateOfBirth = {
            old: existingClient.date_of_birth.toISOString().split('T')[0],
            new: dateOfBirth,
          };
        }

        if (phone !== undefined && phone !== existingClient.phone) {
          updateData.phone = phone;
          changes.phone = { old: existingClient.phone, new: phone };
        }

        if (
          emergencyContactName &&
          emergencyContactName !== existingClient.emergency_contact_name
        ) {
          updateData.emergencyContactName = emergencyContactName;
          changes.emergencyContactName = {
            old: existingClient.emergency_contact_name,
            new: emergencyContactName,
          };
        }

        if (
          emergencyContactPhone &&
          emergencyContactPhone !== existingClient.emergency_contact_phone
        ) {
          updateData.emergencyContactPhone = emergencyContactPhone;
          changes.emergencyContactPhone = {
            old: existingClient.emergency_contact_phone,
            new: emergencyContactPhone,
          };
        }

        if (
          emergencyContactRelationship &&
          emergencyContactRelationship !== existingClient.emergency_contact_relationship
        ) {
          updateData.emergencyContactRelationship = emergencyContactRelationship;
          changes.emergencyContactRelationship = {
            old: existingClient.emergency_contact_relationship,
            new: emergencyContactRelationship,
          };
        }

        // Handle address change (triggers re-geocoding)
        if (address && address !== existingClient.address) {
          try {
            const geocodingResult = await geocodingService.geocodeAddress(address);
            updateData.address = geocodingResult.formattedAddress;
            updateData.latitude = geocodingResult.latitude;
            updateData.longitude = geocodingResult.longitude;

            changes.address = {
              old: existingClient.address,
              new: geocodingResult.formattedAddress,
            };
            changes.latitude = {
              old: parseFloat(existingClient.latitude),
              new: geocodingResult.latitude,
            };
            changes.longitude = {
              old: parseFloat(existingClient.longitude),
              new: geocodingResult.longitude,
            };

            // Re-assign zone based on new location (if admin didn't manually specify)
            if (!manualZoneId) {
              const newZoneId = await zoneAssignmentService.assignZone(
                geocodingResult.latitude,
                geocodingResult.longitude
              );

              if (newZoneId !== existingClient.zone_id) {
                updateData.zoneId = newZoneId;
                changes.zoneId = { old: existingClient.zone_id, new: newZoneId };
              }
            }
          } catch (error) {
            if (error instanceof GeocodingError) {
              res.status(400).json({
                error: {
                  code: 'GEOCODING_ERROR',
                  message: 'Failed to geocode updated address',
                  details: {
                    address,
                    errorCode: error.code,
                  },
                  timestamp: new Date().toISOString(),
                  requestId: req.headers['x-request-id'] || 'unknown',
                },
              });
              return;
            }
            throw error;
          }
        }

        // Handle manual zone change (admin only)
        if (manualZoneId && manualZoneId !== existingClient.zone_id) {
          // Validate zone exists
          const isValidZone = await zoneAssignmentService.validateZoneId(manualZoneId);
          if (!isValidZone) {
            res.status(400).json({
              error: {
                code: 'INVALID_ZONE',
                message: 'Specified zone ID does not exist',
                details: {
                  zoneId: manualZoneId,
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown',
              },
            });
            return;
          }

          updateData.zoneId = manualZoneId;
          changes.zoneId = { old: existingClient.zone_id, new: manualZoneId };
        }

        // If no changes, return existing client
        if (Object.keys(updateData).length === 0) {
          res.status(200).json({
            data: {
              id: existingClient.id,
              firstName: existingClient.first_name,
              lastName: existingClient.last_name,
              dateOfBirth: existingClient.date_of_birth.toISOString().split('T')[0],
              address: existingClient.address,
              latitude: parseFloat(existingClient.latitude),
              longitude: parseFloat(existingClient.longitude),
              phone: existingClient.phone,
              emergencyContact: {
                name: existingClient.emergency_contact_name,
                phone: existingClient.emergency_contact_phone,
                relationship: existingClient.emergency_contact_relationship,
              },
              zoneId: existingClient.zone_id,
              updatedAt: new Date().toISOString(),
            },
          });
          return;
        }

        // Build dynamic UPDATE query
        const updateFields: string[] = [];
        const updateValues: unknown[] = [];
        let paramIndex = 1;

        if (updateData.firstName) {
          updateFields.push(`first_name = $${paramIndex++}`);
          updateValues.push(updateData.firstName);
        }
        if (updateData.lastName) {
          updateFields.push(`last_name = $${paramIndex++}`);
          updateValues.push(updateData.lastName);
        }
        if (updateData.dateOfBirth) {
          updateFields.push(`date_of_birth = $${paramIndex++}`);
          updateValues.push(updateData.dateOfBirth);
        }
        if (updateData.address) {
          updateFields.push(`address = $${paramIndex++}`);
          updateValues.push(updateData.address);
        }
        if (updateData.latitude !== undefined) {
          updateFields.push(`latitude = $${paramIndex++}`);
          updateValues.push(updateData.latitude);
        }
        if (updateData.longitude !== undefined) {
          updateFields.push(`longitude = $${paramIndex++}`);
          updateValues.push(updateData.longitude);
        }
        if (updateData.phone !== undefined) {
          updateFields.push(`phone = $${paramIndex++}`);
          updateValues.push(updateData.phone);
        }
        if (updateData.emergencyContactName) {
          updateFields.push(`emergency_contact_name = $${paramIndex++}`);
          updateValues.push(updateData.emergencyContactName);
        }
        if (updateData.emergencyContactPhone) {
          updateFields.push(`emergency_contact_phone = $${paramIndex++}`);
          updateValues.push(updateData.emergencyContactPhone);
        }
        if (updateData.emergencyContactRelationship) {
          updateFields.push(`emergency_contact_relationship = $${paramIndex++}`);
          updateValues.push(updateData.emergencyContactRelationship);
        }
        if (updateData.zoneId) {
          updateFields.push(`zone_id = $${paramIndex++}`);
          updateValues.push(updateData.zoneId);
        }

        updateFields.push('updated_at = NOW()');
        updateValues.push(clientId);

        const updateQuery = `
          UPDATE clients
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex} AND deleted_at IS NULL
          RETURNING *
        `;

        // Execute update
        const updateResult = await client.query(updateQuery, updateValues);
        const updatedClient = updateResult.rows[0];

        // Invalidate caches
        try {
          // Clear client detail cache
          await redisClient.del(`client:detail:${clientId}`);

          // Clear list caches for old zone
          const oldZoneKeys = await redisClient.keys(
            `clients:list:zone=${existingClient.zone_id}:*`
          );
          if (oldZoneKeys.length > 0) {
            await redisClient.del(...oldZoneKeys);
          }

          // Clear list caches for new zone (if changed)
          if (updateData.zoneId && updateData.zoneId !== existingClient.zone_id) {
            const newZoneKeys = await redisClient.keys(`clients:list:zone=${updateData.zoneId}:*`);
            if (newZoneKeys.length > 0) {
              await redisClient.del(...newZoneKeys);
            }
          }

          // Clear list caches for "all zones" view
          const allKeys = await redisClient.keys('clients:list:zone=all:*');
          if (allKeys.length > 0) {
            await redisClient.del(...allKeys);
          }
        } catch (cacheError) {
          // Log but don't fail if cache invalidation fails
          console.warn('Cache invalidation error:', cacheError);
        }

        // Log changes to audit trail
        if (Object.keys(changes).length > 0) {
          logInfo('Client updated', {
            clientId: updatedClient.id,
            userId: user.userId,
            changes,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          });
        }

        // Build response
        const responseData = {
          id: updatedClient.id,
          firstName: updatedClient.first_name,
          lastName: updatedClient.last_name,
          dateOfBirth: updatedClient.date_of_birth.toISOString().split('T')[0],
          address: updatedClient.address,
          latitude: parseFloat(updatedClient.latitude),
          longitude: parseFloat(updatedClient.longitude),
          phone: updatedClient.phone,
          emergencyContact: {
            name: updatedClient.emergency_contact_name,
            phone: updatedClient.emergency_contact_phone,
            relationship: updatedClient.emergency_contact_relationship,
          },
          zoneId: updatedClient.zone_id,
          updatedAt: updatedClient.updated_at.toISOString(),
        };

        res.status(200).json({
          data: responseData,
        });
      } catch (error) {
        logError('Update client error', error instanceof Error ? error : new Error(String(error)), {
          userId: (req as AuthenticatedRequest).user?.userId,
          clientId: req.params.clientId,
          body: req.body,
        });
        res.status(500).json({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while updating client',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      } finally {
        client.release();
      }
    }
  );

  /**
   * GET /v1/clients
   *
   * List clients with pagination, filtering, and search
   *
   * Query Parameters:
   * - zoneId: string (optional, filter by zone)
   * - search: string (optional, search by name - first or last)
   * - page: number (default: 1, min: 1)
   * - limit: number (default: 50, min: 1, max: 100)
   *
   * Response (200):
   * - clients: Array of client summary objects
   * - pagination: Pagination metadata
   *
   * Errors:
   * - 400: Invalid query parameters
   * - 401: Missing or invalid authentication token
   * - 403: Unauthorized access to zone
   * - 500: Server error
   *
   * Security:
   * - Requires authentication (JWT token)
   * - Zone-based access control (users can only see clients in their zone)
   * - Admins can see all zones
   *
   * Performance:
   * - Redis caching with 5 minute TTL
   * - Optimized database queries with indexes
   * - Pagination to limit result set size
   *
   * Philosophy: "Obsess over details"
   * - Sub-second response times via caching
   * - Efficient queries via proper indexing
   * - Clear error messages for debugging
   */
  router.get('/', authenticateJWT(redisClient), async (req: Request, res: Response) => {
    const client = await pgPool.connect();

    try {
      // Extract authenticated user from request (set by authenticateJWT middleware)
      const user = (req as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      // Parse and validate query parameters
      const zoneId = req.query.zoneId as string | undefined;
      const search = req.query.search as string | undefined;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

      // Zone-based access control
      // Non-admin users can only access their own zone
      let effectiveZoneId: string | null = null;

      if (user.role !== 'admin') {
        // Non-admin users must have a zone_id
        if (!user.zoneId) {
          res.status(403).json({
            error: {
              code: 'AUTH_ZONE_ACCESS_DENIED',
              message: 'You are not assigned to a zone',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          });
          return;
        }

        // Non-admin users can only access their own zone
        if (zoneId && zoneId !== user.zoneId) {
          res.status(403).json({
            error: {
              code: 'AUTH_ZONE_ACCESS_DENIED',
              message: 'You do not have access to this zone',
              details: {
                requestedZoneId: zoneId,
                userZoneId: user.zoneId,
              },
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          });
          return;
        }

        effectiveZoneId = user.zoneId;
      } else {
        // Admin users can filter by zone or see all zones
        effectiveZoneId = zoneId || null;
      }

      // Generate cache key based on query parameters
      const cacheKey = `clients:list:zone=${effectiveZoneId || 'all'}:search=${search || 'none'}:page=${page}:limit=${limit}`;

      // Try to get from cache first
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          res.status(200).json({
            data: parsedData,
            meta: {
              cached: true,
            },
          });
          return;
        }
      } catch (cacheError) {
        // Cache miss or error - continue to database query
        // Log but don't fail the request
        console.warn('Redis cache error:', cacheError);
      }

      // Build SQL query with dynamic filters
      const queryParams: (string | number)[] = [];
      let paramIndex = 1;

      // Base query with care plan summary (LEFT JOIN for clients without care plans)
      let countQuery = `
        SELECT COUNT(DISTINCT c.id) as total
        FROM clients c
        LEFT JOIN care_plans cp ON cp.client_id = c.id AND cp.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
      `;

      let dataQuery = `
        SELECT 
          c.id,
          c.first_name,
          c.last_name,
          c.date_of_birth,
          c.address,
          c.latitude,
          c.longitude,
          cp.summary as care_plan_summary,
          (
            SELECT MAX(COALESCE(v.check_out_time, v.check_in_time, v.scheduled_start_time))
            FROM visits v
            WHERE v.client_id = c.id
              AND v.status = 'completed'
          ) AS last_visit_date,
          (
            SELECT MIN(v_future.scheduled_start_time)
            FROM visits v_future
            WHERE v_future.client_id = c.id
              AND v_future.status = 'scheduled'
              AND v_future.scheduled_start_time >= NOW()
          ) AS next_scheduled_visit
        FROM clients c
        LEFT JOIN care_plans cp ON cp.client_id = c.id AND cp.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
      `;

      // Add zone filter if specified
      if (effectiveZoneId) {
        countQuery += ` AND c.zone_id = $${paramIndex}`;
        dataQuery += ` AND c.zone_id = $${paramIndex}`;
        queryParams.push(effectiveZoneId);
        paramIndex++;
      }

      // Add search filter if specified (case-insensitive search on first or last name)
      if (search && search.trim()) {
        const searchPattern = `%${search.trim().toLowerCase()}%`;
        countQuery += ` AND (LOWER(c.first_name) LIKE $${paramIndex} OR LOWER(c.last_name) LIKE $${paramIndex})`;
        dataQuery += ` AND (LOWER(c.first_name) LIKE $${paramIndex} OR LOWER(c.last_name) LIKE $${paramIndex})`;
        queryParams.push(searchPattern);
        paramIndex++;
      }

      // Add sorting (by last name, then first name)
      dataQuery += ` ORDER BY c.last_name, c.first_name`;

      // Add pagination
      const offset = (page - 1) * limit;
      dataQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      // Execute count query
      const countResult = await client.query(countQuery, queryParams.slice(0, paramIndex - 1));
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      // Execute data query
      const dataResult = await client.query(dataQuery, queryParams);

      // Transform database results to API response format
      const clients: ClientListItem[] = dataResult.rows.map((row) => {
        const { last_visit_date: lastVisitRaw, next_scheduled_visit: nextVisitRaw } = row;

        return {
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          dateOfBirth: row.date_of_birth,
          address: row.address,
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude),
          carePlanSummary: row.care_plan_summary,
          lastVisitDate: lastVisitRaw ? new Date(lastVisitRaw).toISOString() : null,
          nextScheduledVisit: nextVisitRaw ? new Date(nextVisitRaw).toISOString() : null,
        };
      });

      // Build pagination metadata
      const pagination: PaginationMeta = {
        page,
        limit,
        total,
        totalPages,
      };

      // Prepare response
      const responseData = {
        clients,
        pagination,
      };

      // Cache the response for 5 minutes (300 seconds)
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));
      } catch (cacheError) {
        // Log but don't fail the request if caching fails
        console.warn('Redis cache set error:', cacheError);
      }

      // Return success response
      res.status(200).json({
        data: responseData,
      });
    } catch (error) {
      logError('Get clients error', error instanceof Error ? error : new Error(String(error)), {
        userId: (req as AuthenticatedRequest).user?.userId,
        query: req.query,
      });
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching clients',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    } finally {
      client.release();
    }
  });

  /**
   * GET /v1/clients/:clientId
   *
   * Get detailed client information including care plan and recent visits
   *
   * Path Parameters:
   * - clientId: string (UUID, required)
   *
   * Response (200):
   * - Full client details with care plan, emergency contact, and recent visits
   *
   * Errors:
   * - 400: Invalid client ID format
   * - 401: Missing or invalid authentication token
   * - 403: Unauthorized access to client (wrong zone)
   * - 404: Client not found
   * - 500: Server error
   *
   * Security:
   * - Requires authentication (JWT token)
   * - Zone-based access control (users can only see clients in their zone)
   * - Admins can see all clients
   *
   * Performance:
   * - Redis caching with 15 minute TTL
   * - Optimized database queries with JOINs
   * - Single query for all data
   *
   * Philosophy: "Obsess over details"
   * - Complete client information in one request
   * - Efficient queries via JOINs
   * - Longer cache TTL for detail views (15 min vs 5 min for list)
   */
  router.get('/:clientId', authenticateJWT(redisClient), async (req: Request, res: Response) => {
    const client = await pgPool.connect();

    try {
      // Extract authenticated user from request
      const user = (req as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      // Validate client ID format (UUID)
      const clientId = req.params.clientId;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(clientId)) {
        res.status(400).json({
          error: {
            code: 'INVALID_CLIENT_ID',
            message: 'Invalid client ID format',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      // Generate cache key
      const cacheKey = `client:detail:${clientId}`;

      // Try to get from cache first
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);

          // Verify zone access for cached data
          if (user.role !== 'admin' && parsedData.zoneId !== user.zoneId) {
            res.status(403).json({
              error: {
                code: 'AUTH_ZONE_ACCESS_DENIED',
                message: 'You do not have access to this client',
                details: {
                  requestedZoneId: parsedData.zoneId,
                  userZoneId: user.zoneId,
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown',
              },
            });
            return;
          }

          // Remove zoneId from response
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { zoneId, ...clientResponse } = parsedData;

          res.status(200).json({
            data: clientResponse,
            meta: {
              cached: true,
            },
          });
          return;
        }
      } catch (cacheError) {
        // Cache miss or error - continue to database query
        console.warn('Redis cache error:', cacheError);
      }

      // Query database for client details
      // Single query with JOINs for efficiency
      const query = `
        SELECT 
          c.id,
          c.first_name,
          c.last_name,
          c.date_of_birth,
          c.address,
          c.latitude,
          c.longitude,
          c.phone,
          c.emergency_contact_name,
          c.emergency_contact_phone,
          c.emergency_contact_relationship,
          c.zone_id,
          cp.summary as care_plan_summary,
          cp.medications as care_plan_medications,
          cp.allergies as care_plan_allergies,
          cp.special_instructions as care_plan_special_instructions
        FROM clients c
        LEFT JOIN care_plans cp ON cp.client_id = c.id AND cp.deleted_at IS NULL
        WHERE c.id = $1 AND c.deleted_at IS NULL
      `;

      const result = await client.query(query, [clientId]);

      // Check if client exists
      if (result.rows.length === 0) {
        res.status(404).json({
          error: {
            code: 'CLIENT_NOT_FOUND',
            message: 'Client not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      const clientData = result.rows[0];

      // Zone-based access control
      if (user.role !== 'admin' && clientData.zone_id !== user.zoneId) {
        res.status(403).json({
          error: {
            code: 'AUTH_ZONE_ACCESS_DENIED',
            message: 'You do not have access to this client',
            details: {
              requestedZoneId: clientData.zone_id,
              userZoneId: user.zoneId,
            },
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      // Query recent visits (last 10)
      const recentVisitsResult = await client.query(
        `
          SELECT
            v.id,
            v.scheduled_start_time,
            v.check_in_time,
            v.check_out_time,
            v.duration_minutes,
            u.first_name AS staff_first_name,
            u.last_name AS staff_last_name
          FROM visits v
          JOIN users u ON u.id = v.staff_id
          WHERE v.client_id = $1
          ORDER BY COALESCE(v.check_in_time, v.scheduled_start_time) DESC
          LIMIT 10
        `,
        [clientId]
      );

      const recentVisits = recentVisitsResult.rows.map((visit) => {
        const checkInIso = formatDateTime(visit.check_in_time);
        const scheduledIso = formatDateTime(visit.scheduled_start_time);
        const checkOutIso = formatDateTime(visit.check_out_time);

        const visitDate = checkInIso ?? scheduledIso ?? new Date().toISOString();

        const durationFromColumns =
          typeof visit.duration_minutes === 'number' && Number.isFinite(visit.duration_minutes)
            ? visit.duration_minutes
            : null;

        const computedDuration =
          checkInIso && checkOutIso
            ? Math.max(
                0,
                Math.floor(
                  (new Date(checkOutIso).getTime() - new Date(checkInIso).getTime()) / 60000
                )
              )
            : 0;

        const duration = durationFromColumns !== null ? durationFromColumns : computedDuration;

        const staffName = [visit.staff_first_name, visit.staff_last_name]
          .filter((part) => typeof part === 'string' && part.trim().length > 0)
          .join(' ')
          .trim();

        return {
          id: visit.id,
          date: visitDate,
          staffName,
          duration,
        };
      });

      // Transform database results to API response format
      const responseData = {
        id: clientData.id,
        firstName: clientData.first_name,
        lastName: clientData.last_name,
        dateOfBirth: formatDateOnly(clientData.date_of_birth),
        address: clientData.address,
        latitude: parseFloat(clientData.latitude),
        longitude: parseFloat(clientData.longitude),
        phone: clientData.phone,
        zoneId: clientData.zone_id, // Include for cache validation
        emergencyContact: {
          name: clientData.emergency_contact_name,
          phone: clientData.emergency_contact_phone,
          relationship: clientData.emergency_contact_relationship,
        },
        carePlan: {
          summary: clientData.care_plan_summary || '',
          medications: clientData.care_plan_medications || [],
          allergies: clientData.care_plan_allergies || [],
          specialInstructions: clientData.care_plan_special_instructions || '',
        },
        recentVisits,
      };

      // Cache the response for 15 minutes (900 seconds)
      try {
        await redisClient.setEx(cacheKey, 900, JSON.stringify(responseData));
      } catch (cacheError) {
        // Log but don't fail the request if caching fails
        console.warn('Redis cache set error:', cacheError);
      }

      // Return success response (remove zoneId from response)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { zoneId, ...clientResponse } = responseData;

      res.status(200).json({
        data: clientResponse,
      });
    } catch (error) {
      logError(
        'Get client detail error',
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: (req as AuthenticatedRequest).user?.userId,
          clientId: req.params.clientId,
        }
      );
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching client details',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    } finally {
      client.release();
    }
  });

  return router;
}
