/**
 * S3/MinIO Configuration
 * Handles AWS S3 and MinIO (S3-compatible) storage configuration
 * Implements server-side encryption with customer-managed keys (KMS)
 */

import { S3Client } from '@aws-sdk/client-s3';

const s3Config = {
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'ca-central-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  tls: process.env.S3_USE_SSL === 'true',
};

// Create S3 client instance
export const s3Client = new S3Client(s3Config);

// Server-Side Encryption (SSE) Configuration
export const encryptionConfig = {
  enabled: process.env.S3_SSE_ENABLED === 'true',
  algorithm:
    process.env.NODE_ENV === 'production'
      ? process.env.S3_SSE_ALGORITHM || 'aws:kms'
      : process.env.S3_SSE_ALGORITHM_DEV || 'AES256',
  kmsKeyId: process.env.S3_KMS_KEY_ID || undefined,
};

// Bucket names
export const buckets = {
  photos: process.env.S3_BUCKET_PHOTOS || 'berthcare-dev-photos',
  documents: process.env.S3_BUCKET_DOCUMENTS || 'berthcare-dev-documents',
  signatures: process.env.S3_BUCKET_SIGNATURES || 'berthcare-dev-signatures',
};

// File size limits (in bytes)
export const fileLimits = {
  maxPhotoSize: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024,
  maxDocumentSize: 50 * 1024 * 1024, // 50MB
};

// Allowed MIME types
export const allowedMimeTypes = {
  photos: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

// Presigned URL expiration (in seconds)
export const presignedUrlExpiry = 3600; // 1 hour

export default {
  s3Client,
  buckets,
  fileLimits,
  allowedMimeTypes,
  presignedUrlExpiry,
  encryptionConfig,
};
