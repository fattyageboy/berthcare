/**
 * Upload Controller
 * Handles HTTP requests for file uploads
 */

import { Request, Response } from 'express';
import { photoService } from './photo.service';
import { logger } from '../../shared/utils';

export class UploadController {
  /**
   * POST /uploads/photos
   * Upload a photo for a visit
   */
  async uploadPhoto(req: Request, res: Response): Promise<void> {
    try {
      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          error: 'No file uploaded',
          message: 'Please provide a file in the request',
        });
        return;
      }

      // Extract request data
      interface UploadBody {
        visit_id?: string;
        caption?: string;
        taken_at?: string;
      }
      const { visit_id, caption, taken_at } = req.body as UploadBody;

      // Validate required fields
      if (!visit_id) {
        res.status(400).json({
          error: 'Missing required field',
          message: 'visit_id is required',
        });
        return;
      }

      // Get user ID from authenticated request
      // TODO: Replace with actual user ID from auth middleware
      interface AuthRequest extends Request {
        user?: { id: string };
      }
      const uploadedBy = (req as AuthRequest).user?.id || 'system';

      // Upload photo
      const result = await photoService.uploadPhoto({
        file: req.file,
        visitId: visit_id,
        caption,
        takenAt: taken_at,
        uploadedBy,
      });

      logger.info(`Photo uploaded successfully for visit ${visit_id}`);

      res.status(201).json(result);
    } catch (error) {
      logger.error('Error in uploadPhoto controller:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('Invalid file type')) {
        res.status(400).json({
          error: 'Invalid file type',
          message: errorMessage,
        });
        return;
      }

      res.status(500).json({
        error: 'Upload failed',
        message: 'An error occurred while uploading the photo',
      });
    }
  }

  /**
   * GET /uploads/photos/:visitId
   * Get all photos for a visit
   */
  async getPhotosByVisit(req: Request, res: Response): Promise<void> {
    try {
      const { visitId } = req.params;

      if (!visitId) {
        res.status(400).json({
          error: 'Missing parameter',
          message: 'visitId is required',
        });
        return;
      }

      const photos = await photoService.getPhotosByVisitId(visitId);

      res.status(200).json({
        visit_id: visitId,
        photos,
        count: photos.length,
      });
    } catch (error) {
      logger.error('Error fetching photos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Failed to fetch photos',
        message: errorMessage,
      });
    }
  }

  /**
   * DELETE /uploads/photos/:photoId
   * Delete a photo
   */
  async deletePhoto(req: Request, res: Response): Promise<void> {
    try {
      const { photoId } = req.params;

      if (!photoId) {
        res.status(400).json({
          error: 'Missing parameter',
          message: 'photoId is required',
        });
        return;
      }

      await photoService.deletePhoto(photoId);

      res.status(200).json({
        message: 'Photo deleted successfully',
        photo_id: photoId,
      });
    } catch (error) {
      logger.error('Error deleting photo:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage === 'Photo not found') {
        res.status(404).json({
          error: 'Photo not found',
          message: 'The requested photo does not exist',
        });
        return;
      }

      res.status(500).json({
        error: 'Failed to delete photo',
        message: 'An error occurred while deleting the photo',
      });
    }
  }

  /**
   * PATCH /uploads/photos/:photoId/caption
   * Update photo caption
   */
  async updateCaption(req: Request, res: Response): Promise<void> {
    try {
      const { photoId } = req.params;
      interface CaptionBody {
        caption?: string;
      }
      const { caption } = req.body as CaptionBody;

      if (!photoId) {
        res.status(400).json({
          error: 'Missing parameter',
          message: 'photoId is required',
        });
        return;
      }

      if (caption === undefined) {
        res.status(400).json({
          error: 'Missing field',
          message: 'caption is required',
        });
        return;
      }

      const result = await photoService.updateCaption(photoId, caption);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error updating caption:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage === 'Photo not found') {
        res.status(404).json({
          error: 'Photo not found',
          message: 'The requested photo does not exist',
        });
        return;
      }

      res.status(500).json({
        error: 'Failed to update caption',
        message: 'An error occurred while updating the caption',
      });
    }
  }
}

export const uploadController = new UploadController();
