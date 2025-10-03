import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../../shared/utils/logger';
import { visitRepository } from './repository';
import { ApiResponse } from '../../shared';

/**
 * Visit Controller
 * Business logic for visit management endpoints
 */

export class VisitController {
  /**
   * GET /visits
   * Retrieve visits for authenticated user
   */
  async getVisits(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      // Extract user ID from authenticated request (placeholder - will be set by auth middleware)
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - user ID not found',
        });
        return;
      }

      const { date_from, date_to, status, client_id, page = '1', per_page = '20' } = req.query;

      const statusArray = status ? (status as string).split(',').map((s) => s.trim()) : undefined;

      const result = await visitRepository.getVisits({
        userId,
        dateFrom: date_from as string,
        dateTo: date_to as string,
        status: statusArray,
        clientId: client_id as string,
        page: parseInt(page as string, 10),
        perPage: parseInt(per_page as string, 10),
      });

      const response: ApiResponse<unknown> = {
        success: true,
        message: 'Visits retrieved successfully',
        data: {
          visits: result.visits,
          total_count: result.totalCount,
          pagination: {
            page: result.page,
            per_page: result.perPage,
            has_next: result.hasNext,
          },
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Error retrieving visits:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve visits',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /visits/:id/check-in
   * Check in to a visit with location verification
   */
  async checkIn(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - user ID not found',
        });
        return;
      }

      const { id: visitId } = req.params;
      const { location, timestamp } = req.body as {
        location: { latitude: number; longitude: number; accuracy: number };
        timestamp: string;
      };

      // Verify visit exists and belongs to user
      const visit = await visitRepository.getVisitById(visitId, userId);
      if (!visit) {
        res.status(404).json({
          success: false,
          message: 'Visit not found',
        });
        return;
      }

      // Verify visit status
      if (visit.status !== 'scheduled') {
        res.status(400).json({
          success: false,
          message: `Cannot check in to visit with status: ${visit.status}`,
        });
        return;
      }

      // Verify location using Google Maps Geocoding API
      let locationVerified = true;
      let verificationDistance = 0;
      try {
        const verification = await visitRepository.verifyLocationWithGeocoding(
          visitId,
          Number(location.latitude),
          Number(location.longitude)
        );
        locationVerified = verification.verified;
        verificationDistance = verification.distance;

        // Log verification result for debugging
        logger.warn(
          `Location verification: ${locationVerified ? 'PASSED' : 'FAILED'} - Distance: ${verificationDistance}m`
        );
      } catch (error) {
        logger.error('Location verification failed:', error);
        // Continue with check-in even if verification fails (graceful degradation)
        locationVerified = false;
      }

      // Perform check-in
      const updatedVisit = await visitRepository.checkIn({
        visitId,
        userId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp,
        verifyLocation: false, // Already verified above
      });

      const response: ApiResponse<unknown> = {
        success: true,
        message: 'Check-in successful',
        data: {
          visit_id: updatedVisit.id,
          checked_in_at: updatedVisit.actual_start,
          location_verified: locationVerified,
          verification_distance: verificationDistance,
          status: updatedVisit.status,
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Error checking in to visit:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check in to visit',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PUT /visits/:id/documentation
   * Update visit documentation (supports partial updates)
   */
  async updateDocumentation(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - user ID not found',
        });
        return;
      }

      const { id: visitId } = req.params;
      const { documentation, notes, photos } = req.body as {
        documentation?: Record<string, unknown>;
        notes?: string;
        photos?: string[];
      };

      // Verify visit exists and belongs to user
      const visit = await visitRepository.getVisitById(visitId, userId);
      if (!visit) {
        res.status(404).json({
          success: false,
          message: 'Visit not found',
        });
        return;
      }

      // Verify visit status allows documentation updates
      if (!['scheduled', 'in_progress'].includes(visit.status)) {
        res.status(400).json({
          success: false,
          message: `Cannot update documentation for visit with status: ${visit.status}`,
        });
        return;
      }

      // Update documentation
      const updatedVisit = await visitRepository.updateDocumentation({
        visitId,
        userId,
        documentation,
        notes,
        photos,
      });

      const response: ApiResponse<unknown> = {
        success: true,
        message: 'Documentation updated successfully',
        data: {
          visit_id: updatedVisit.id,
          documentation_updated_at: updatedVisit.updated_at,
          validation_status: 'valid',
          sync_status: 'synced',
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Error updating visit documentation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update visit documentation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /visits/:id/verify-location
   * Verify location against client address using Google Maps Geocoding API
   */
  async verifyLocation(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - user ID not found',
        });
        return;
      }

      const { id: visitId } = req.params;
      const { location } = req.body as {
        location: { latitude: number; longitude: number; accuracy?: number };
      };

      // Verify visit exists and belongs to user
      const visit = await visitRepository.getVisitById(visitId, userId);
      if (!visit) {
        res.status(404).json({
          success: false,
          message: 'Visit not found',
        });
        return;
      }

      // Perform location verification
      const verification = await visitRepository.verifyLocationWithGeocoding(
        visitId,
        location.latitude,
        location.longitude
      );

      const response: ApiResponse<unknown> = {
        success: true,
        message: verification.verified
          ? 'Location verified successfully'
          : 'Location verification failed',
        data: {
          verified: verification.verified,
          distance: verification.distance,
          client_coordinates: verification.clientCoordinates,
          user_location: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          },
          allowed_radius: verification.distance <= 100 ? 100 : 500, // Indicates urban vs rural
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Error verifying location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify location',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /visits/:id/complete
   * Complete a visit
   */
  async completeVisit(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - user ID not found',
        });
        return;
      }

      const { id: visitId } = req.params;
      const { documentation, signature, location } = req.body as {
        documentation?: Record<string, unknown>;
        signature?: string;
        location?: { latitude: number; longitude: number; accuracy: number };
      };

      // Verify visit exists and belongs to user
      const visit = await visitRepository.getVisitById(visitId, userId);
      if (!visit) {
        res.status(404).json({
          success: false,
          message: 'Visit not found',
        });
        return;
      }

      // Verify visit status
      if (visit.status !== 'in_progress') {
        res.status(400).json({
          success: false,
          message: `Cannot complete visit with status: ${visit.status}. Visit must be in progress.`,
        });
        return;
      }

      // Complete visit
      const updatedVisit = await visitRepository.completeVisit({
        visitId,
        userId,
        documentation,
        signature,
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracy: location?.accuracy,
      });

      const response: ApiResponse<unknown> = {
        success: true,
        message: 'Visit completed successfully',
        data: {
          visit_id: updatedVisit.id,
          status: updatedVisit.status,
          completed_at: updatedVisit.actual_end,
          documentation: updatedVisit.documentation,
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Error completing visit:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete visit',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const visitController = new VisitController();
