/**
 * S3 Storage Module
 *
 * Philosophy: "The best interface is no interface" - Make file storage invisible
 *
 * Features:
 * - Pre-signed URL generation for secure uploads
 * - Photo storage with compression metadata
 * - Lifecycle policies (archive after 7 years)
 * - Canadian data residency (ca-central-1)
 *
 * Design: Simple, reliable, production-ready
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Configuration from environment
const config = {
  region: process.env.AWS_REGION || 'ca-central-1',
  bucket: process.env.AWS_S3_BUCKET || 'berthcare-dev',
  endpoint: process.env.AWS_S3_ENDPOINT,
  forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

// Initialize S3 client
const s3Client = new S3Client({
  region: config.region,
  endpoint: config.endpoint,
  forcePathStyle: config.forcePathStyle,
  credentials: config.credentials,
});

/**
 * Photo metadata structure
 */
export interface PhotoMetadata {
  originalName?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  compressed?: boolean;
  compressionQuality?: number;
  uploadedBy: string;
  uploadedAt: string;
  visitId?: string;
  clientId?: string;
}

/**
 * Pre-signed URL options
 */
export interface PreSignedUrlOptions {
  expiresIn?: number; // Seconds, default 900 (15 minutes)
  contentType?: string;
  metadata?: Record<string, string>;
}

/**
 * Storage paths for different file types
 */
export const StoragePaths = {
  PHOTOS: 'photos',
  SIGNATURES: 'signatures',
  DOCUMENTS: 'documents',
  TEMP: 'temp',
} as const;

/**
 * Generate a unique S3 key for a file
 */
export function generateS3Key(path: string, userId: string, extension: string = 'jpg'): string {
  const timestamp = Date.now();
  const uuid = uuidv4();
  return `${path}/${userId}/${timestamp}-${uuid}.${extension}`;
}

/**
 * Generate pre-signed URL for uploading a file
 *
 * Philosophy: Client uploads directly to S3, server never handles file data
 * This reduces server load and improves upload speed
 */
export async function generateUploadUrl(
  key: string,
  options: PreSignedUrlOptions = {}
): Promise<{ url: string; key: string; expiresIn: number }> {
  const expiresIn = options.expiresIn || 900; // 15 minutes default

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: options.contentType || 'image/jpeg',
    Metadata: options.metadata,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });

  return {
    url,
    key,
    expiresIn,
  };
}

/**
 * Generate pre-signed URL for downloading a file
 */
export async function generateDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate pre-signed URL for photo upload with metadata
 *
 * This is the primary method for visit photo uploads
 */
export async function generatePhotoUploadUrl(
  userId: string,
  metadata: Partial<PhotoMetadata>
): Promise<{ url: string; key: string; expiresIn: number }> {
  // Generate unique key
  const extension = metadata.mimeType?.split('/')[1] || 'jpg';
  const key = generateS3Key(StoragePaths.PHOTOS, userId, extension);

  // Prepare metadata for S3
  const s3Metadata: Record<string, string> = {
    uploadedBy: userId,
    uploadedAt: new Date().toISOString(),
    mimeType: metadata.mimeType || 'image/jpeg',
  };

  if (metadata.visitId) s3Metadata.visitId = metadata.visitId;
  if (metadata.clientId) s3Metadata.clientId = metadata.clientId;
  if (metadata.size) s3Metadata.size = metadata.size.toString();
  if (metadata.compressed !== undefined) {
    s3Metadata.compressed = metadata.compressed.toString();
  }
  if (metadata.compressionQuality) {
    s3Metadata.compressionQuality = metadata.compressionQuality.toString();
  }

  return generateUploadUrl(key, {
    contentType: metadata.mimeType || 'image/jpeg',
    metadata: s3Metadata,
  });
}

/**
 * Generate pre-signed URL for signature upload
 */
export async function generateSignatureUploadUrl(
  userId: string,
  visitId: string
): Promise<{ url: string; key: string; expiresIn: number }> {
  const key = generateS3Key(StoragePaths.SIGNATURES, userId, 'png');

  return generateUploadUrl(key, {
    contentType: 'image/png',
    metadata: {
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      visitId,
      type: 'signature',
    },
  });
}

/**
 * Check if a file exists in S3
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucket,
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
 * Get file metadata from S3
 */
export async function getFileMetadata(key: string): Promise<PhotoMetadata | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });
    const response = await s3Client.send(command);

    return {
      mimeType: response.ContentType || 'application/octet-stream',
      size: response.ContentLength || 0,
      uploadedBy: response.Metadata?.uploadedby || 'unknown',
      uploadedAt: response.Metadata?.uploadedat || new Date().toISOString(),
      visitId: response.Metadata?.visitid,
      clientId: response.Metadata?.clientid,
      compressed: response.Metadata?.compressed === 'true',
      compressionQuality: response.Metadata?.compressionquality
        ? parseInt(response.Metadata.compressionquality, 10)
        : undefined,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFound') {
      return null;
    }
    throw error;
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });
  await s3Client.send(command);
}

/**
 * List files in a path
 */
export async function listFiles(prefix: string, maxKeys: number = 1000): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: config.bucket,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const response = await s3Client.send(command);
  return response.Contents?.map((item) => item.Key || '') || [];
}

/**
 * Batch generate upload URLs for multiple photos
 *
 * Philosophy: Reduce round trips, improve performance
 */
export async function generateBatchPhotoUploadUrls(
  userId: string,
  count: number,
  metadata: Partial<PhotoMetadata> = {}
): Promise<Array<{ url: string; key: string; expiresIn: number }>> {
  const promises = Array.from({ length: count }, () => generatePhotoUploadUrl(userId, metadata));
  return Promise.all(promises);
}

/**
 * Health check for S3 connectivity
 */
export async function healthCheck(): Promise<{
  healthy: boolean;
  message: string;
  latency?: number;
}> {
  const startTime = Date.now();
  try {
    // Try to list objects (lightweight operation)
    const command = new ListObjectsV2Command({
      Bucket: config.bucket,
      MaxKeys: 1,
    });
    await s3Client.send(command);

    const latency = Date.now() - startTime;
    return {
      healthy: true,
      message: 'S3 connection successful',
      latency,
    };
  } catch (error) {
    return {
      healthy: false,
      message: `S3 connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Export S3 client for advanced use cases
export { s3Client };
