/**
 * Photo Repository
 * Handles database operations for photos
 */

import { database } from '../../config/database';
import { logger, encryptionService } from '../../shared/utils';

export interface Photo {
  id: string;
  visit_id: string;
  s3_key: string;
  s3_thumbnail_key: string | null;
  url: string;
  thumbnail_url: string | null;
  file_size: number;
  mime_type: string;
  caption: string | null;
  taken_at: Date | null;
  uploaded_by: string;
  encryption_key_id: string | null;
  encryption_algorithm: string | null;
  metadata_encrypted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePhotoData {
  visit_id: string;
  s3_key: string;
  s3_thumbnail_key?: string;
  url: string;
  thumbnail_url?: string;
  file_size: number;
  mime_type: string;
  caption?: string;
  taken_at?: Date;
  uploaded_by: string;
  encryption_key_id?: string;
  encryption_algorithm?: string;
  metadata_encrypted?: boolean;
}

export class PhotoRepository {
  /**
   * Create a new photo record with encrypted metadata
   */
  async create(data: CreatePhotoData): Promise<Photo> {
    const query = `
      INSERT INTO photos (
        visit_id, s3_key, s3_thumbnail_key, url, thumbnail_url,
        file_size, mime_type, caption, taken_at, uploaded_by,
        encryption_key_id, encryption_algorithm, metadata_encrypted
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    // Encrypt sensitive metadata if encryption is enabled
    const encryptedCaption =
      data.caption && encryptionService.isEnabled()
        ? encryptionService.encrypt(data.caption)
        : data.caption || null;

    const values = [
      data.visit_id,
      data.s3_key,
      data.s3_thumbnail_key || null,
      data.url,
      data.thumbnail_url || null,
      data.file_size,
      data.mime_type,
      encryptedCaption,
      data.taken_at || null,
      data.uploaded_by,
      data.encryption_key_id || null,
      data.encryption_algorithm || 'AES256',
      encryptionService.isEnabled(),
    ];

    try {
      const result = await database.query(query, values);
      const photo = result.rows[0] as Photo;

      // Decrypt caption for response if it was encrypted
      if (photo.metadata_encrypted && photo.caption) {
        photo.caption = encryptionService.decrypt(photo.caption);
      }

      logger.info(`Photo record created with encryption: ${photo.id}`);
      return photo;
    } catch (error) {
      logger.error('Error creating photo record:', error);
      throw new Error('Failed to create photo record');
    }
  }

  /**
   * Get photo by ID with decrypted metadata
   */
  async findById(id: string): Promise<Photo | null> {
    const query = 'SELECT * FROM photos WHERE id = $1';

    try {
      const result = await database.query(query, [id]);
      const photo = (result.rows[0] as Photo | undefined) || null;

      if (photo && photo.metadata_encrypted && photo.caption) {
        photo.caption = encryptionService.decrypt(photo.caption);
      }

      return photo;
    } catch (error) {
      logger.error('Error fetching photo by ID:', error);
      throw new Error('Failed to fetch photo');
    }
  }

  /**
   * Get all photos for a visit with decrypted metadata
   */
  async findByVisitId(visitId: string): Promise<Photo[]> {
    const query = `
      SELECT * FROM photos
      WHERE visit_id = $1
      ORDER BY created_at DESC
    `;

    try {
      const result = await database.query(query, [visitId]);
      const photos = result.rows as Photo[];

      // Decrypt captions for all photos
      photos.forEach((photo) => {
        if (photo.metadata_encrypted && photo.caption) {
          photo.caption = encryptionService.decrypt(photo.caption);
        }
      });

      return photos;
    } catch (error) {
      logger.error('Error fetching photos by visit ID:', error);
      throw new Error('Failed to fetch photos');
    }
  }

  /**
   * Update photo caption with encryption
   */
  async updateCaption(id: string, caption: string): Promise<Photo | null> {
    // Encrypt caption if encryption is enabled
    const encryptedCaption = encryptionService.isEnabled()
      ? encryptionService.encrypt(caption)
      : caption;

    const query = `
      UPDATE photos
      SET caption = $1, 
          metadata_encrypted = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    try {
      const result = await database.query(query, [
        encryptedCaption,
        encryptionService.isEnabled(),
        id,
      ]);
      const photo = (result.rows[0] as Photo | undefined) || null;

      // Decrypt caption for response
      if (photo && photo.metadata_encrypted && photo.caption) {
        photo.caption = encryptionService.decrypt(photo.caption);
      }

      return photo;
    } catch (error) {
      logger.error('Error updating photo caption:', error);
      throw new Error('Failed to update photo caption');
    }
  }

  /**
   * Delete photo record
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM photos WHERE id = $1 RETURNING id';

    try {
      const result = await database.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting photo record:', error);
      throw new Error('Failed to delete photo record');
    }
  }

  /**
   * Get photo count for a visit
   */
  async countByVisitId(visitId: string): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM photos WHERE visit_id = $1';

    try {
      const result = await database.query(query, [visitId]);
      const row = result.rows[0] as { count: string };
      return parseInt(row.count, 10);
    } catch (error) {
      logger.error('Error counting photos:', error);
      throw new Error('Failed to count photos');
    }
  }
}

export const photoRepository = new PhotoRepository();
