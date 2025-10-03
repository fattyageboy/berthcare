/**
 * Upload Routes
 * Defines API endpoints for file uploads
 */

import { Router, Request, Response, NextFunction } from 'express';
import { uploadController } from './upload.controller';
import { photoUpload } from './multer.config';

const router = Router();

// Async handler wrapper to catch promise rejections
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};

/**
 * POST /uploads/photos
 * Upload a photo for a visit
 * Content-Type: multipart/form-data
 * Body: file, visit_id, caption (optional), taken_at (optional)
 */
router.post(
  '/photos',
  photoUpload.single('file'),
  asyncHandler(uploadController.uploadPhoto.bind(uploadController))
);

/**
 * GET /uploads/photos/:visitId
 * Get all photos for a visit
 */
router.get(
  '/photos/:visitId',
  asyncHandler(uploadController.getPhotosByVisit.bind(uploadController))
);

/**
 * DELETE /uploads/photos/:photoId
 * Delete a photo
 */
router.delete(
  '/photos/:photoId',
  asyncHandler(uploadController.deletePhoto.bind(uploadController))
);

/**
 * PATCH /uploads/photos/:photoId/caption
 * Update photo caption
 */
router.patch(
  '/photos/:photoId/caption',
  asyncHandler(uploadController.updateCaption.bind(uploadController))
);

export default router;
