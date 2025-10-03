/**
 * Photo Service Unit Tests
 * Tests for photo upload business logic
 */

/* eslint-disable @typescript-eslint/unbound-method */

import { PhotoService } from '../../../src/services/file-upload/photo.service';
import { s3Service } from '../../../src/services/file-upload/s3.service';
import { photoRepository } from '../../../src/services/file-upload/photo.repository';
import { allowedMimeTypes } from '../../../src/config/s3';
import { logger } from '../../../src/shared/utils';

// Mock dependencies
jest.mock('../../../src/services/file-upload/s3.service');
jest.mock('../../../src/services/file-upload/photo.repository');
jest.mock('../../../src/shared/utils/logger');

describe('PhotoService', () => {
  let service: PhotoService;

  beforeEach(() => {
    service = new PhotoService();
    jest.clearAllMocks();
  });

  describe('uploadPhoto', () => {
    const mockFile = {
      buffer: Buffer.from('test-image-data'),
      originalname: 'test-photo.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
    } as Express.Multer.File;

    const mockRequest = {
      file: mockFile,
      visitId: 'visit-123',
      caption: 'Test caption',
      takenAt: '2024-01-01T00:00:00Z',
      uploadedBy: 'user-123',
    };

    it('should upload photo successfully with thumbnail', async () => {
      const mockS3Key = 'photos/visit-123/1234567890-abc123.jpg';
      const mockUploadResult = {
        key: mockS3Key,
        url: 'https://s3.example.com/photo.jpg',
        size: 1024,
        encryptionKeyId: 'key-123',
        encryptionAlgorithm: 'aws:kms',
      };
      const mockThumbnailResult = {
        key: 'photos/visit-123/1234567890-abc123_thumb.jpg',
        url: 'https://s3.example.com/photo_thumb.jpg',
        encryptionKeyId: 'key-123',
        encryptionAlgorithm: 'aws:kms',
      };
      const mockPhoto = {
        id: 'photo-123',
        visit_id: 'visit-123',
        s3_key: mockS3Key,
        s3_thumbnail_key: mockThumbnailResult.key,
        url: mockUploadResult.url,
        thumbnail_url: mockThumbnailResult.url,
        file_size: 1024,
        mime_type: 'image/jpeg',
        caption: 'Test caption',
        taken_at: new Date('2024-01-01T00:00:00Z'),
        uploaded_by: 'user-123',
        encryption_key_id: 'key-123',
        encryption_algorithm: 'aws:kms',
        metadata_encrypted: true,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      };

      (s3Service.generateFileKey as jest.Mock).mockReturnValue(mockS3Key);
      (s3Service.uploadFile as jest.Mock).mockResolvedValue(mockUploadResult);
      (s3Service.generateThumbnail as jest.Mock).mockResolvedValue(mockThumbnailResult);
      (photoRepository.create as jest.Mock).mockResolvedValue(mockPhoto);

      const result = await service.uploadPhoto(mockRequest);

      expect(s3Service.generateFileKey).toHaveBeenCalledWith(
        'visit-123',
        'test-photo.jpg',
        'photos'
      );
      expect(s3Service.uploadFile).toHaveBeenCalledWith(
        mockFile.buffer,
        mockS3Key,
        'image/jpeg',
        expect.any(String)
      );
      expect(s3Service.generateThumbnail).toHaveBeenCalledWith(
        mockFile.buffer,
        mockS3Key,
        expect.any(String)
      );
      expect(photoRepository.create).toHaveBeenCalledWith({
        visit_id: 'visit-123',
        s3_key: mockS3Key,
        s3_thumbnail_key: mockThumbnailResult.key,
        url: mockUploadResult.url,
        thumbnail_url: mockThumbnailResult.url,
        file_size: 1024,
        mime_type: 'image/jpeg',
        caption: 'Test caption',
        taken_at: new Date('2024-01-01T00:00:00Z'),
        uploaded_by: 'user-123',
        encryption_key_id: 'key-123',
        encryption_algorithm: 'aws:kms',
      });
      expect(result).toEqual({
        photo_id: 'photo-123',
        url: mockUploadResult.url,
        thumbnail_url: mockThumbnailResult.url,
        file_size: 1024,
        upload_completed_at: mockPhoto.created_at.toISOString(),
      });
    });

    it('should upload photo without thumbnail if generation fails', async () => {
      const mockS3Key = 'photos/visit-123/1234567890-abc123.jpg';
      const mockUploadResult = {
        key: mockS3Key,
        url: 'https://s3.example.com/photo.jpg',
        size: 1024,
        encryptionKeyId: 'key-123',
        encryptionAlgorithm: 'AES256',
      };
      const mockPhoto = {
        id: 'photo-123',
        visit_id: 'visit-123',
        s3_key: mockS3Key,
        s3_thumbnail_key: null,
        url: mockUploadResult.url,
        thumbnail_url: null,
        file_size: 1024,
        mime_type: 'image/jpeg',
        caption: null,
        taken_at: null,
        uploaded_by: 'user-123',
        encryption_key_id: 'key-123',
        encryption_algorithm: 'AES256',
        metadata_encrypted: false,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      };

      (s3Service.generateFileKey as jest.Mock).mockReturnValue(mockS3Key);
      (s3Service.uploadFile as jest.Mock).mockResolvedValue(mockUploadResult);
      (s3Service.generateThumbnail as jest.Mock).mockRejectedValue(
        new Error('Thumbnail generation failed')
      );
      (photoRepository.create as jest.Mock).mockResolvedValue(mockPhoto);

      const result = await service.uploadPhoto({
        ...mockRequest,
        caption: undefined,
        takenAt: undefined,
      });

      expect(s3Service.generateThumbnail).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to generate thumbnail, continuing without it:',
        expect.any(Error)
      );
      expect(photoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          s3_thumbnail_key: undefined,
          thumbnail_url: undefined,
        })
      );
      expect(result.thumbnail_url).toBeNull();
    });

    it('should reject invalid MIME type', async () => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'text/plain',
      } as Express.Multer.File;

      await expect(
        service.uploadPhoto({
          ...mockRequest,
          file: invalidFile,
        })
      ).rejects.toThrow('Invalid file type');

      expect(s3Service.uploadFile).not.toHaveBeenCalled();
      expect(photoRepository.create).not.toHaveBeenCalled();
    });

    it('should handle S3 upload failure', async () => {
      (s3Service.generateFileKey as jest.Mock).mockReturnValue('test-key');
      (s3Service.uploadFile as jest.Mock).mockRejectedValue(new Error('S3 connection failed'));

      await expect(service.uploadPhoto(mockRequest)).rejects.toThrow('S3 connection failed');

      expect(photoRepository.create).not.toHaveBeenCalled();
    });

    it('should handle database creation failure', async () => {
      const mockS3Key = 'photos/visit-123/1234567890-abc123.jpg';
      const mockUploadResult = {
        key: mockS3Key,
        url: 'https://s3.example.com/photo.jpg',
        size: 1024,
      };

      (s3Service.generateFileKey as jest.Mock).mockReturnValue(mockS3Key);
      (s3Service.uploadFile as jest.Mock).mockResolvedValue(mockUploadResult);
      (s3Service.generateThumbnail as jest.Mock).mockResolvedValue(null);
      (photoRepository.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.uploadPhoto(mockRequest)).rejects.toThrow('Database error');
    });

    it('should validate all allowed MIME types', async () => {
      const mockS3Key = 'photos/visit-123/test.jpg';
      const mockUploadResult = {
        key: mockS3Key,
        url: 'https://s3.example.com/photo.jpg',
        size: 1024,
      };
      const mockPhoto = {
        id: 'photo-123',
        visit_id: 'visit-123',
        s3_key: mockS3Key,
        s3_thumbnail_key: null,
        url: mockUploadResult.url,
        thumbnail_url: null,
        file_size: 1024,
        mime_type: 'image/png',
        caption: null,
        taken_at: null,
        uploaded_by: 'user-123',
        encryption_key_id: null,
        encryption_algorithm: null,
        metadata_encrypted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (s3Service.generateFileKey as jest.Mock).mockReturnValue(mockS3Key);
      (s3Service.uploadFile as jest.Mock).mockResolvedValue(mockUploadResult);
      (s3Service.generateThumbnail as jest.Mock).mockResolvedValue(null);
      (photoRepository.create as jest.Mock).mockResolvedValue(mockPhoto);

      for (const mimeType of allowedMimeTypes.photos) {
        const file = { ...mockFile, mimetype: mimeType } as Express.Multer.File;
        await service.uploadPhoto({ ...mockRequest, file });
      }

      expect(s3Service.uploadFile).toHaveBeenCalledTimes(allowedMimeTypes.photos.length);
    });
  });

  describe('getPhotosByVisitId', () => {
    it('should get photos for a visit', async () => {
      const mockPhotos = [
        {
          id: 'photo-1',
          visit_id: 'visit-123',
          s3_key: 'key1',
          s3_thumbnail_key: 'key1_thumb',
          url: 'https://s3.example.com/photo1.jpg',
          thumbnail_url: 'https://s3.example.com/photo1_thumb.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg',
          caption: 'Photo 1',
          taken_at: new Date('2024-01-01T00:00:00Z'),
          uploaded_by: 'user-123',
          encryption_key_id: null,
          encryption_algorithm: null,
          metadata_encrypted: false,
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
        },
        {
          id: 'photo-2',
          visit_id: 'visit-123',
          s3_key: 'key2',
          s3_thumbnail_key: null,
          url: 'https://s3.example.com/photo2.jpg',
          thumbnail_url: null,
          file_size: 2048,
          mime_type: 'image/png',
          caption: null,
          taken_at: null,
          uploaded_by: 'user-123',
          encryption_key_id: null,
          encryption_algorithm: null,
          metadata_encrypted: false,
          created_at: new Date('2024-01-02T00:00:00Z'),
          updated_at: new Date('2024-01-02T00:00:00Z'),
        },
      ];

      (photoRepository.findByVisitId as jest.Mock).mockResolvedValue(mockPhotos);

      const result = await service.getPhotosByVisitId('visit-123');

      expect(photoRepository.findByVisitId).toHaveBeenCalledWith('visit-123');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        photo_id: 'photo-1',
        url: 'https://s3.example.com/photo1.jpg',
        thumbnail_url: 'https://s3.example.com/photo1_thumb.jpg',
        file_size: 1024,
        caption: 'Photo 1',
        taken_at: '2024-01-01T00:00:00.000Z',
        uploaded_at: '2024-01-01T00:00:00.000Z',
      });
      expect(result[1].caption).toBeNull();
      expect(result[1].taken_at).toBeUndefined();
    });

    it('should return empty array when no photos found', async () => {
      (photoRepository.findByVisitId as jest.Mock).mockResolvedValue([]);

      const result = await service.getPhotosByVisitId('visit-123');

      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      (photoRepository.findByVisitId as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.getPhotosByVisitId('visit-123')).rejects.toThrow('Database error');
    });
  });

  describe('deletePhoto', () => {
    it('should delete photo and thumbnail successfully', async () => {
      const mockPhoto = {
        id: 'photo-123',
        visit_id: 'visit-123',
        s3_key: 'photos/visit-123/photo.jpg',
        s3_thumbnail_key: 'photos/visit-123/photo_thumb.jpg',
        url: 'https://s3.example.com/photo.jpg',
        thumbnail_url: 'https://s3.example.com/photo_thumb.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        caption: null,
        taken_at: null,
        uploaded_by: 'user-123',
        encryption_key_id: null,
        encryption_algorithm: null,
        metadata_encrypted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (photoRepository.findById as jest.Mock).mockResolvedValue(mockPhoto);
      (s3Service.deleteFile as jest.Mock).mockResolvedValue(undefined);
      (photoRepository.delete as jest.Mock).mockResolvedValue(true);

      await service.deletePhoto('photo-123');

      expect(photoRepository.findById).toHaveBeenCalledWith('photo-123');
      expect(s3Service.deleteFile).toHaveBeenCalledTimes(2);
      expect(s3Service.deleteFile).toHaveBeenCalledWith(
        expect.any(String),
        'photos/visit-123/photo.jpg'
      );
      expect(s3Service.deleteFile).toHaveBeenCalledWith(
        expect.any(String),
        'photos/visit-123/photo_thumb.jpg'
      );
      expect(photoRepository.delete).toHaveBeenCalledWith('photo-123');
    });

    it('should delete photo without thumbnail', async () => {
      const mockPhoto = {
        id: 'photo-123',
        visit_id: 'visit-123',
        s3_key: 'photos/visit-123/photo.jpg',
        s3_thumbnail_key: null,
        url: 'https://s3.example.com/photo.jpg',
        thumbnail_url: null,
        file_size: 1024,
        mime_type: 'image/jpeg',
        caption: null,
        taken_at: null,
        uploaded_by: 'user-123',
        encryption_key_id: null,
        encryption_algorithm: null,
        metadata_encrypted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (photoRepository.findById as jest.Mock).mockResolvedValue(mockPhoto);
      (s3Service.deleteFile as jest.Mock).mockResolvedValue(undefined);
      (photoRepository.delete as jest.Mock).mockResolvedValue(true);

      await service.deletePhoto('photo-123');

      expect(s3Service.deleteFile).toHaveBeenCalledTimes(1);
      expect(photoRepository.delete).toHaveBeenCalledWith('photo-123');
    });

    it('should throw error when photo not found', async () => {
      (photoRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.deletePhoto('photo-123')).rejects.toThrow('Photo not found');

      expect(s3Service.deleteFile).not.toHaveBeenCalled();
      expect(photoRepository.delete).not.toHaveBeenCalled();
    });

    it('should handle S3 deletion errors', async () => {
      const mockPhoto = {
        id: 'photo-123',
        s3_key: 'photos/visit-123/photo.jpg',
        s3_thumbnail_key: null,
      };

      (photoRepository.findById as jest.Mock).mockResolvedValue(mockPhoto);
      (s3Service.deleteFile as jest.Mock).mockRejectedValue(new Error('S3 deletion failed'));

      await expect(service.deletePhoto('photo-123')).rejects.toThrow('S3 deletion failed');

      expect(photoRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateCaption', () => {
    it('should update caption successfully', async () => {
      const mockPhoto = {
        id: 'photo-123',
        caption: 'Updated caption',
        updated_at: new Date('2024-01-01T00:00:00Z'),
      };

      (photoRepository.updateCaption as jest.Mock).mockResolvedValue(mockPhoto);

      const result = await service.updateCaption('photo-123', 'Updated caption');

      expect(photoRepository.updateCaption).toHaveBeenCalledWith('photo-123', 'Updated caption');
      expect(result).toEqual({
        photo_id: 'photo-123',
        caption: 'Updated caption',
        updated_at: mockPhoto.updated_at.toISOString(),
      });
    });

    it('should throw error when photo not found', async () => {
      (photoRepository.updateCaption as jest.Mock).mockResolvedValue(null);

      await expect(service.updateCaption('photo-123', 'New caption')).rejects.toThrow(
        'Photo not found'
      );
    });

    it('should handle empty caption', async () => {
      const mockPhoto = {
        id: 'photo-123',
        caption: '',
        updated_at: new Date('2024-01-01T00:00:00Z'),
      };

      (photoRepository.updateCaption as jest.Mock).mockResolvedValue(mockPhoto);

      const result = await service.updateCaption('photo-123', '');

      expect(result.caption).toBe('');
    });

    it('should handle repository errors', async () => {
      (photoRepository.updateCaption as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.updateCaption('photo-123', 'New caption')).rejects.toThrow(
        'Database error'
      );
    });
  });
});
