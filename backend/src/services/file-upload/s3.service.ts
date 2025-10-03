/**
 * S3 Service
 * Handles file uploads to S3/MinIO, thumbnail generation, and presigned URL creation
 */

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ServerSideEncryption,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { s3Client, buckets, presignedUrlExpiry, encryptionConfig } from '../../config/s3';
import { logger } from '../../shared/utils';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  encryptionKeyId?: string;
  encryptionAlgorithm?: string;
}

export interface ThumbnailResult {
  key: string;
  url: string;
  encryptionKeyId?: string;
  encryptionAlgorithm?: string;
}

export class S3Service {
  /**
   * Upload a file to S3 with server-side encryption
   */
  async uploadFile(
    buffer: Buffer,
    key: string,
    mimeType: string,
    bucket: string = buckets.photos
  ): Promise<UploadResult> {
    try {
      // Build encryption parameters
      interface EncryptionParams {
        ServerSideEncryption?: ServerSideEncryption;
        SSEKMSKeyId?: string;
      }
      const encryptionParams: EncryptionParams = {};

      if (encryptionConfig.enabled) {
        encryptionParams.ServerSideEncryption = encryptionConfig.algorithm as ServerSideEncryption;

        // Add KMS key ID if using aws:kms algorithm
        if (encryptionConfig.algorithm === 'aws:kms' && encryptionConfig.kmsKeyId) {
          encryptionParams.SSEKMSKeyId = encryptionConfig.kmsKeyId;
        }

        logger.info(`Uploading file with SSE: ${encryptionConfig.algorithm}`);
      }

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ...encryptionParams,
      });

      const response = await s3Client.send(command);

      // Generate presigned URL for the uploaded file
      const url = await this.getPresignedUrl(bucket, key);

      logger.info(`File uploaded successfully to S3 with encryption: ${key}`);

      return {
        key,
        url,
        size: buffer.length,
        encryptionKeyId: response.SSEKMSKeyId,
        encryptionAlgorithm: response.ServerSideEncryption,
      };
    } catch (error) {
      logger.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  /**
   * Generate and upload thumbnail for an image with server-side encryption
   */
  async generateThumbnail(
    originalBuffer: Buffer,
    originalKey: string,
    bucket: string = buckets.photos
  ): Promise<ThumbnailResult> {
    try {
      // Generate thumbnail (300x300 max, maintain aspect ratio)
      const thumbnailBuffer = await sharp(originalBuffer)
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Create thumbnail key
      const thumbnailKey = originalKey.replace(/(\.[^.]+)$/, '_thumb$1');

      // Build encryption parameters
      interface EncryptionParams {
        ServerSideEncryption?: ServerSideEncryption;
        SSEKMSKeyId?: string;
      }
      const encryptionParams: EncryptionParams = {};

      if (encryptionConfig.enabled) {
        encryptionParams.ServerSideEncryption = encryptionConfig.algorithm as ServerSideEncryption;

        if (encryptionConfig.algorithm === 'aws:kms' && encryptionConfig.kmsKeyId) {
          encryptionParams.SSEKMSKeyId = encryptionConfig.kmsKeyId;
        }
      }

      // Upload thumbnail with encryption
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
        ...encryptionParams,
      });

      const response = await s3Client.send(command);

      // Generate presigned URL for thumbnail
      const url = await this.getPresignedUrl(bucket, thumbnailKey);

      logger.info(`Thumbnail generated and uploaded with encryption: ${thumbnailKey}`);

      return {
        key: thumbnailKey,
        url,
        encryptionKeyId: response.SSEKMSKeyId,
        encryptionAlgorithm: response.ServerSideEncryption,
      };
    } catch (error) {
      logger.error('Error generating thumbnail:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }

  /**
   * Get presigned URL for a file
   */
  async getPresignedUrl(
    bucket: string,
    key: string,
    expiresIn: number = presignedUrlExpiry
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(bucket: string, key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await s3Client.send(command);
      logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
      logger.error('Error deleting file from S3:', error);
      throw new Error('Failed to delete file from storage');
    }
  }

  /**
   * Check if a file exists in S3
   */
  async fileExists(bucket: string, key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Generate unique S3 key for a file
   */
  generateFileKey(visitId: string, filename: string, prefix: string = 'photos'): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = filename.split('.').pop();
    return `${prefix}/${visitId}/${timestamp}-${randomString}.${extension}`;
  }
}

export const s3Service = new S3Service();
