/**
 * Unit Tests: S3 Client
 *
 * Tests S3 client functionality with mocked AWS SDK:
 * - Pre-signed URL generation
 * - File upload operations
 * - File download operations
 * - File deletion operations
 * - Error handling
 * - Metadata handling
 */

import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

import {
  deleteObject,
  FILE_CONFIGS,
  generateDownloadUrl,
  generateUploadUrl,
  getObjectMetadata,
  objectExists,
  S3_BUCKETS,
  s3Client,
  verifyS3Connection,
} from '../src/storage/s3-client';

describe('S3 Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should export S3 bucket names', () => {
      expect(S3_BUCKETS).toHaveProperty('PHOTOS');
      expect(S3_BUCKETS).toHaveProperty('DOCUMENTS');
      expect(S3_BUCKETS).toHaveProperty('SIGNATURES');
    });

    it('should export file configurations', () => {
      expect(FILE_CONFIGS.PHOTO).toHaveProperty('maxSize');
      expect(FILE_CONFIGS.PHOTO).toHaveProperty('allowedTypes');
      expect(FILE_CONFIGS.PHOTO).toHaveProperty('bucket');
    });

    it('should have correct file size limits', () => {
      expect(FILE_CONFIGS.PHOTO.maxSize).toBe(10 * 1024 * 1024);
      expect(FILE_CONFIGS.DOCUMENT.maxSize).toBe(20 * 1024 * 1024);
      expect(FILE_CONFIGS.SIGNATURE.maxSize).toBe(1 * 1024 * 1024);
    });
  });

  describe('generateUploadUrl', () => {
    it('should generate pre-signed upload URL', async () => {
      const mockUrl = 'https://s3.amazonaws.com/bucket/key?signature=xyz';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const result = await generateUploadUrl('photos', 'test-key.jpg', {
        contentType: 'image/jpeg',
        expiresIn: 3600,
      });

      expect(result).toBe(mockUrl);
      expect(getSignedUrl).toHaveBeenCalledWith(
        s3Client,
        expect.any(PutObjectCommand),
        expect.objectContaining({ expiresIn: 3600 })
      );
    });

    it('should include metadata in upload URL', async () => {
      const mockUrl = 'https://s3.amazonaws.com/bucket/key?signature=xyz';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      await generateUploadUrl('photos', 'test-key.jpg', {
        metadata: { userId: '123', visitId: '456' },
      });

      expect(getSignedUrl).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (getSignedUrl as jest.Mock).mockRejectedValue(new Error('S3 Error'));

      await expect(
        generateUploadUrl('photos', 'test-key.jpg')
      ).rejects.toThrow('Failed to generate upload URL');
    });
  });

  describe('generateDownloadUrl', () => {
    it('should generate pre-signed download URL', async () => {
      const mockUrl = 'https://s3.amazonaws.com/bucket/key?signature=xyz';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const result = await generateDownloadUrl('photos', 'test-key.jpg', 1800);

      expect(result).toBe(mockUrl);
      expect(getSignedUrl).toHaveBeenCalledWith(
        s3Client,
        expect.any(GetObjectCommand),
        { expiresIn: 1800 }
      );
    });

    it('should use default expiration time', async () => {
      const mockUrl = 'https://s3.amazonaws.com/bucket/key?signature=xyz';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      await generateDownloadUrl('photos', 'test-key.jpg');

      expect(getSignedUrl).toHaveBeenCalledWith(
        s3Client,
        expect.any(GetObjectCommand),
        { expiresIn: 3600 }
      );
    });
  });

  describe('objectExists', () => {
    it('should return true if object exists', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (s3Client.send as jest.Mock) = mockSend;

      const result = await objectExists('photos', 'test-key.jpg');

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
    });

    it('should return false if object does not exist', async () => {
      const mockSend = jest.fn().mockRejectedValue({ name: 'NotFound' });
      (s3Client.send as jest.Mock) = mockSend;

      const result = await objectExists('photos', 'test-key.jpg');

      expect(result).toBe(false);
    });
  });

  describe('deleteObject', () => {
    it('should delete object from S3', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (s3Client.send as jest.Mock) = mockSend;

      await deleteObject('photos', 'test-key.jpg');

      expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });

    it('should handle deletion errors', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('Delete failed'));
      (s3Client.send as jest.Mock) = mockSend;

      await expect(
        deleteObject('photos', 'test-key.jpg')
      ).rejects.toThrow('Failed to delete object');
    });
  });

  describe('getObjectMetadata', () => {
    it('should retrieve object metadata', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        ContentLength: 1024,
        ContentType: 'image/jpeg',
        Metadata: { userId: '123', uploadedBy: 'test-user' },
        LastModified: new Date(),
      });
      (s3Client.send as jest.Mock) = mockSend;

      const result = await getObjectMetadata('photos', 'test-key.jpg');

      expect(result).toHaveProperty('userId', '123');
      expect(result).toHaveProperty('uploadedBy', 'test-user');
      expect(mockSend).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
    });

    it('should handle metadata retrieval errors', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('Not found'));
      (s3Client.send as jest.Mock) = mockSend;

      await expect(
        getObjectMetadata('photos', 'test-key.jpg')
      ).rejects.toThrow();
    });
  });

  describe('verifyS3Connection', () => {
    it('should return true when connection is successful', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (s3Client.send as jest.Mock) = mockSend;

      const result = await verifyS3Connection();

      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('Connection failed'));
      (s3Client.send as jest.Mock) = mockSend;

      const result = await verifyS3Connection();

      expect(result).toBe(false);
    });
  });
});
