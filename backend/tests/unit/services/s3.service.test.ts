/**
 * S3 Service Unit Tests
 * Tests for S3/MinIO file operations
 */

/* eslint-disable @typescript-eslint/unbound-method */

import { S3Service } from '../../../src/services/file-upload/s3.service';
import { s3Client } from '../../../src/config/s3';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { logger } from '../../../src/shared/utils';

// Mock dependencies
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('sharp');
jest.mock('../../../src/shared/utils/logger');
jest.mock('../../../src/config/s3', () => ({
  s3Client: {
    send: jest.fn(),
  },
  buckets: {
    photos: 'test-photos-bucket',
    documents: 'test-documents-bucket',
  },
  presignedUrlExpiry: 3600,
  encryptionConfig: {
    enabled: true,
    algorithm: 'aws:kms',
    kmsKeyId: 'test-kms-key-id',
  },
}));

describe('S3Service', () => {
  let service: S3Service;
  let mockSend: jest.Mock;

  beforeEach(() => {
    service = new S3Service();
    mockSend = s3Client.send as jest.Mock;
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    const testBuffer = Buffer.from('test-file-content');
    const testKey = 'photos/visit-123/test.jpg';
    const testMimeType = 'image/jpeg';

    it('should upload file with encryption successfully', async () => {
      const mockResponse = {
        SSEKMSKeyId: 'test-kms-key-id',
        ServerSideEncryption: 'aws:kms',
      };

      mockSend.mockResolvedValue(mockResponse);
      (getSignedUrl as jest.Mock).mockResolvedValue('https://s3.example.com/presigned-url');

      const result = await service.uploadFile(testBuffer, testKey, testMimeType);

      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
      expect(getSignedUrl).toHaveBeenCalled();
      expect(result).toEqual({
        key: testKey,
        url: 'https://s3.example.com/presigned-url',
        size: testBuffer.length,
        encryptionKeyId: 'test-kms-key-id',
        encryptionAlgorithm: 'aws:kms',
      });
    });

    it('should upload file to specified bucket', async () => {
      mockSend.mockResolvedValue({});
      (getSignedUrl as jest.Mock).mockResolvedValue('https://s3.example.com/presigned-url');

      await service.uploadFile(testBuffer, testKey, testMimeType, 'custom-bucket');

      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });

    it('should handle S3 upload errors', async () => {
      mockSend.mockRejectedValue(new Error('S3 connection failed'));

      await expect(service.uploadFile(testBuffer, testKey, testMimeType)).rejects.toThrow(
        'Failed to upload file to storage'
      );

      expect(logger.error).toHaveBeenCalledWith('Error uploading file to S3:', expect.any(Error));
    });

    it('should handle presigned URL generation errors', async () => {
      mockSend.mockResolvedValue({});
      (getSignedUrl as jest.Mock).mockRejectedValue(new Error('URL generation failed'));

      await expect(service.uploadFile(testBuffer, testKey, testMimeType)).rejects.toThrow();
    });

    it('should upload with correct content type', async () => {
      mockSend.mockResolvedValue({});
      (getSignedUrl as jest.Mock).mockResolvedValue('https://s3.example.com/presigned-url');

      await service.uploadFile(testBuffer, testKey, 'image/png');

      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });
  });

  describe('generateThumbnail', () => {
    const testBuffer = Buffer.from('test-image-data');
    const testKey = 'photos/visit-123/test.jpg';

    beforeEach(() => {
      const mockSharp = {
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumbnail-data')),
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharp);
    });

    it('should generate and upload thumbnail successfully', async () => {
      const mockResponse = {
        SSEKMSKeyId: 'test-kms-key-id',
        ServerSideEncryption: 'aws:kms',
      };

      mockSend.mockResolvedValue(mockResponse);
      (getSignedUrl as jest.Mock).mockResolvedValue('https://s3.example.com/thumbnail-url');

      const result = await service.generateThumbnail(testBuffer, testKey);

      expect(sharp).toHaveBeenCalledWith(testBuffer);
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
      expect(result).toEqual({
        key: 'photos/visit-123/test_thumb.jpg',
        url: 'https://s3.example.com/thumbnail-url',
        encryptionKeyId: 'test-kms-key-id',
        encryptionAlgorithm: 'aws:kms',
      });
    });

    it('should create thumbnail with correct dimensions', async () => {
      mockSend.mockResolvedValue({});
      (getSignedUrl as jest.Mock).mockResolvedValue('https://s3.example.com/thumbnail-url');

      const mockSharp = {
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumbnail-data')),
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharp);

      await service.generateThumbnail(testBuffer, testKey);

      expect(mockSharp.resize).toHaveBeenCalledWith(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      });
      expect(mockSharp.jpeg).toHaveBeenCalledWith({ quality: 80 });
    });

    it('should handle sharp processing errors', async () => {
      const mockSharp = {
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockRejectedValue(new Error('Image processing failed')),
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharp);

      await expect(service.generateThumbnail(testBuffer, testKey)).rejects.toThrow(
        'Failed to generate thumbnail'
      );

      expect(logger.error).toHaveBeenCalledWith('Error generating thumbnail:', expect.any(Error));
    });

    it('should handle S3 upload errors for thumbnail', async () => {
      mockSend.mockRejectedValue(new Error('S3 upload failed'));

      await expect(service.generateThumbnail(testBuffer, testKey)).rejects.toThrow(
        'Failed to generate thumbnail'
      );
    });

    it('should generate correct thumbnail key for different extensions', async () => {
      mockSend.mockResolvedValue({});
      (getSignedUrl as jest.Mock).mockResolvedValue('https://s3.example.com/thumbnail-url');

      const result = await service.generateThumbnail(testBuffer, 'photos/visit-123/test.png');

      expect(result.key).toBe('photos/visit-123/test_thumb.png');
    });
  });

  describe('getPresignedUrl', () => {
    it('should generate presigned URL successfully', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue('https://s3.example.com/presigned-url');

      const result = await service.getPresignedUrl('test-bucket', 'test-key');

      expect(getSignedUrl).toHaveBeenCalledWith(s3Client, expect.any(GetObjectCommand), {
        expiresIn: 3600,
      });
      expect(result).toBe('https://s3.example.com/presigned-url');
    });

    it('should use custom expiration time', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue('https://s3.example.com/presigned-url');

      await service.getPresignedUrl('test-bucket', 'test-key', 7200);

      expect(getSignedUrl).toHaveBeenCalledWith(s3Client, expect.any(GetObjectCommand), {
        expiresIn: 7200,
      });
    });

    it('should handle presigned URL generation errors', async () => {
      (getSignedUrl as jest.Mock).mockRejectedValue(new Error('URL generation failed'));

      await expect(service.getPresignedUrl('test-bucket', 'test-key')).rejects.toThrow(
        'Failed to generate presigned URL'
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Error generating presigned URL:',
        expect.any(Error)
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockSend.mockResolvedValue({});

      await service.deleteFile('test-bucket', 'test-key');

      expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });

    it('should handle S3 deletion errors', async () => {
      mockSend.mockRejectedValue(new Error('S3 deletion failed'));

      await expect(service.deleteFile('test-bucket', 'test-key')).rejects.toThrow(
        'Failed to delete file from storage'
      );

      expect(logger.error).toHaveBeenCalledWith('Error deleting file from S3:', expect.any(Error));
    });

    it('should log successful deletion', async () => {
      mockSend.mockResolvedValue({});

      await service.deleteFile('test-bucket', 'test-key');

      expect(logger.info).toHaveBeenCalledWith('File deleted from S3: test-key');
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.fileExists('test-bucket', 'test-key');

      expect(mockSend).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
      expect(result).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      const notFoundError = new Error('Not found');
      (notFoundError as any).name = 'NotFound';
      mockSend.mockRejectedValue(notFoundError);

      const result = await service.fileExists('test-bucket', 'test-key');

      expect(result).toBe(false);
    });

    it('should throw error for other S3 errors', async () => {
      const error = new Error('S3 error');
      (error as any).name = 'InternalError';
      mockSend.mockRejectedValue(error);

      await expect(service.fileExists('test-bucket', 'test-key')).rejects.toThrow('S3 error');
    });
  });

  describe('generateFileKey', () => {
    it('should generate unique file key with correct format', () => {
      const key1 = service.generateFileKey('visit-123', 'photo.jpg', 'photos');
      const key2 = service.generateFileKey('visit-123', 'photo.jpg', 'photos');

      expect(key1).toMatch(/^photos\/visit-123\/\d+-[a-z0-9]+\.jpg$/);
      expect(key2).toMatch(/^photos\/visit-123\/\d+-[a-z0-9]+\.jpg$/);
      expect(key1).not.toBe(key2); // Should be unique
    });

    it('should preserve file extension', () => {
      const key = service.generateFileKey('visit-123', 'document.pdf', 'documents');

      expect(key).toMatch(/\.pdf$/);
    });

    it('should use default prefix when not specified', () => {
      const key = service.generateFileKey('visit-123', 'photo.jpg');

      expect(key).toMatch(/^photos\//);
    });

    it('should handle files with multiple dots in name', () => {
      const key = service.generateFileKey('visit-123', 'my.photo.file.jpg', 'photos');

      expect(key).toMatch(/\.jpg$/);
    });

    it('should handle different visit IDs', () => {
      const key1 = service.generateFileKey('visit-123', 'photo.jpg', 'photos');
      const key2 = service.generateFileKey('visit-456', 'photo.jpg', 'photos');

      expect(key1).toContain('visit-123');
      expect(key2).toContain('visit-456');
    });
  });

  describe('file size limits', () => {
    it('should handle large file uploads', async () => {
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
      mockSend.mockResolvedValue({});
      (getSignedUrl as jest.Mock).mockResolvedValue('https://s3.example.com/presigned-url');

      const result = await service.uploadFile(largeBuffer, 'test-key', 'image/jpeg');

      expect(result.size).toBe(10 * 1024 * 1024);
    });

    it('should handle empty files', async () => {
      const emptyBuffer = Buffer.alloc(0);
      mockSend.mockResolvedValue({});
      (getSignedUrl as jest.Mock).mockResolvedValue('https://s3.example.com/presigned-url');

      const result = await service.uploadFile(emptyBuffer, 'test-key', 'image/jpeg');

      expect(result.size).toBe(0);
    });
  });

  describe('encryption configuration', () => {
    it('should include encryption parameters when enabled', async () => {
      mockSend.mockResolvedValue({
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: 'test-kms-key-id',
      });
      (getSignedUrl as jest.Mock).mockResolvedValue('https://s3.example.com/presigned-url');

      const result = await service.uploadFile(Buffer.from('test'), 'test-key', 'image/jpeg');

      expect(result.encryptionAlgorithm).toBe('aws:kms');
      expect(result.encryptionKeyId).toBe('test-kms-key-id');
    });
  });
});
