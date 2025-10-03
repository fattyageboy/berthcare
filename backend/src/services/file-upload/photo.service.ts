/**
 * Photo Service
 * Business logic for photo uploads and management
 */

import { s3Service } from './s3.service';
import { photoRepository, CreatePhotoData } from './photo.repository';
import { buckets, allowedMimeTypes } from '../../config/s3';
import { logger } from '../../shared/utils';

export interface UploadPhotoRequest {
  file: Express.Multer.File;
  visitId: string;
  caption?: string;
  takenAt?: string;
  uploadedBy: string;
}

export interface PhotoResponse {
  photo_id: string;
  url: string;
  thumbnail_url: string | null;
  file_size: number;
  upload_completed_at: string;
}

export class PhotoService {
  /**
   * Upload a photo with thumbnail generation
   */
  async uploadPhoto(request: UploadPhotoRequest): Promise<PhotoResponse> {
    const { file, visitId, caption, takenAt, uploadedBy } = request;

    try {
      // Validate MIME type
      if (!allowedMimeTypes.photos.includes(file.mimetype)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.photos.join(', ')}`);
      }

      // Generate unique S3 key
      const s3Key = s3Service.generateFileKey(visitId, file.originalname, 'photos');

      // Upload original photo
      const uploadResult = await s3Service.uploadFile(
        file.buffer,
        s3Key,
        file.mimetype,
        buckets.photos
      );

      // Generate and upload thumbnail
      let thumbnailResult;
      try {
        thumbnailResult = await s3Service.generateThumbnail(file.buffer, s3Key, buckets.photos);
      } catch (error) {
        logger.warn('Failed to generate thumbnail, continuing without it:', error);
        thumbnailResult = null;
      }

      // Create database record with encryption metadata
      const photoData: CreatePhotoData = {
        visit_id: visitId,
        s3_key: uploadResult.key,
        s3_thumbnail_key: thumbnailResult?.key,
        url: uploadResult.url,
        thumbnail_url: thumbnailResult?.url,
        file_size: uploadResult.size,
        mime_type: file.mimetype,
        caption,
        taken_at: takenAt ? new Date(takenAt) : undefined,
        uploaded_by: uploadedBy,
        encryption_key_id: uploadResult.encryptionKeyId,
        encryption_algorithm: uploadResult.encryptionAlgorithm,
      };

      const photo = await photoRepository.create(photoData);

      logger.info(`Photo uploaded successfully: ${photo.id}`);

      return {
        photo_id: photo.id,
        url: photo.url,
        thumbnail_url: photo.thumbnail_url,
        file_size: photo.file_size,
        upload_completed_at: photo.created_at.toISOString(),
      };
    } catch (error) {
      logger.error('Error in uploadPhoto:', error);
      throw error;
    }
  }

  /**
   * Get photos for a visit
   */
  async getPhotosByVisitId(visitId: string): Promise<
    Array<{
      photo_id: string;
      url: string;
      thumbnail_url: string | null;
      file_size: number;
      caption: string | null;
      taken_at: string | undefined;
      uploaded_at: string;
    }>
  > {
    try {
      const photos = await photoRepository.findByVisitId(visitId);
      return photos.map((photo) => ({
        photo_id: photo.id,
        url: photo.url,
        thumbnail_url: photo.thumbnail_url,
        file_size: photo.file_size,
        caption: photo.caption,
        taken_at: photo.taken_at?.toISOString(),
        uploaded_at: photo.created_at.toISOString(),
      }));
    } catch (error) {
      logger.error('Error fetching photos:', error);
      throw error;
    }
  }

  /**
   * Delete a photo
   */
  async deletePhoto(photoId: string): Promise<void> {
    try {
      const photo = await photoRepository.findById(photoId);
      if (!photo) {
        throw new Error('Photo not found');
      }

      // Delete from S3
      await s3Service.deleteFile(buckets.photos, photo.s3_key);

      // Delete thumbnail if exists
      if (photo.s3_thumbnail_key) {
        await s3Service.deleteFile(buckets.photos, photo.s3_thumbnail_key);
      }

      // Delete from database
      await photoRepository.delete(photoId);

      logger.info(`Photo deleted successfully: ${photoId}`);
    } catch (error) {
      logger.error('Error deleting photo:', error);
      throw error;
    }
  }

  /**
   * Update photo caption
   */
  async updateCaption(
    photoId: string,
    caption: string
  ): Promise<{
    photo_id: string;
    caption: string | null;
    updated_at: string;
  }> {
    try {
      const photo = await photoRepository.updateCaption(photoId, caption);
      if (!photo) {
        throw new Error('Photo not found');
      }
      return {
        photo_id: photo.id,
        caption: photo.caption,
        updated_at: photo.updated_at.toISOString(),
      };
    } catch (error) {
      logger.error('Error updating caption:', error);
      throw error;
    }
  }
}

export const photoService = new PhotoService();
