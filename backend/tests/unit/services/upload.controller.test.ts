/**
 * Upload Controller Unit Tests
 * Tests for file upload HTTP request handling
 */

/* eslint-disable @typescript-eslint/unbound-method */

import { Request, Response } from 'express';
import { UploadController } from '../../../src/services/file-upload/upload.controller';
import { photoService } from '../../../src/services/file-upload/photo.service';

// Mock dependencies
jest.mock('../../../src/services/file-upload/photo.service');
jest.mock('../../../src/shared/utils/logger');

describe('UploadController', () => {
  let controller: UploadController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    controller = new UploadController();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    mockRequest = {
      body: {},
      params: {},
      file: undefined,
    } as any;

    (mockRequest as any).user = { id: 'test-user-123' };

    jest.clearAllMocks();
  });

  describe('uploadPhoto', () => {
    it('should upload photo successfully', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockRequest.body = {
        visit_id: 'visit-123',
        caption: 'Test photo',
        taken_at: '2024-01-01T00:00:00Z',
      };

      const mockResult = {
        photo_id: 'photo-123',
        url: 'https://s3.example.com/photo.jpg',
        thumbnail_url: 'https://s3.example.com/photo_thumb.jpg',
        file_size: 1024,
        upload_completed_at: '2024-01-01T00:00:00Z',
      };

      (photoService.uploadPhoto as jest.Mock).mockResolvedValue(mockResult);

      await controller.uploadPhoto(mockRequest as Request, mockResponse as Response);

      expect(photoService.uploadPhoto).toHaveBeenCalledWith({
        file: mockFile,
        visitId: 'visit-123',
        caption: 'Test photo',
        takenAt: '2024-01-01T00:00:00Z',
        uploadedBy: 'test-user-123',
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 when no file is uploaded', async () => {
      mockRequest.file = undefined;
      mockRequest.body = { visit_id: 'visit-123' };

      await controller.uploadPhoto(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'No file uploaded',
        message: 'Please provide a file in the request',
      });
      expect(photoService.uploadPhoto).not.toHaveBeenCalled();
    });

    it('should return 400 when visit_id is missing', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockRequest.body = {};

      await controller.uploadPhoto(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing required field',
        message: 'visit_id is required',
      });
      expect(photoService.uploadPhoto).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid file type error', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.txt',
        mimetype: 'text/plain',
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockRequest.body = { visit_id: 'visit-123' };

      (photoService.uploadPhoto as jest.Mock).mockRejectedValue(
        new Error('Invalid file type. Allowed types: image/jpeg, image/png')
      );

      await controller.uploadPhoto(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid file type',
        message: 'Invalid file type. Allowed types: image/jpeg, image/png',
      });
    });

    it('should return 500 for general upload errors', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockRequest.body = { visit_id: 'visit-123' };

      (photoService.uploadPhoto as jest.Mock).mockRejectedValue(new Error('S3 connection failed'));

      await controller.uploadPhoto(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Upload failed',
        message: 'An error occurred while uploading the photo',
      });
    });

    it('should use system as default user when user is not authenticated', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockRequest.body = { visit_id: 'visit-123' };
      (mockRequest as any).user = undefined;

      (photoService.uploadPhoto as jest.Mock).mockResolvedValue({
        photo_id: 'photo-123',
        url: 'https://s3.example.com/photo.jpg',
        thumbnail_url: null,
        file_size: 1024,
        upload_completed_at: '2024-01-01T00:00:00Z',
      });

      await controller.uploadPhoto(mockRequest as Request, mockResponse as Response);

      expect(photoService.uploadPhoto).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedBy: 'system',
        })
      );
    });
  });

  describe('getPhotosByVisit', () => {
    it('should get photos for a visit successfully', async () => {
      mockRequest.params = { visitId: 'visit-123' };

      const mockPhotos = [
        {
          photo_id: 'photo-1',
          url: 'https://s3.example.com/photo1.jpg',
          thumbnail_url: 'https://s3.example.com/photo1_thumb.jpg',
          file_size: 1024,
          caption: 'Photo 1',
          taken_at: '2024-01-01T00:00:00Z',
          uploaded_at: '2024-01-01T00:00:00Z',
        },
      ];

      (photoService.getPhotosByVisitId as jest.Mock).mockResolvedValue(mockPhotos);

      await controller.getPhotosByVisit(mockRequest as Request, mockResponse as Response);

      expect(photoService.getPhotosByVisitId).toHaveBeenCalledWith('visit-123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        visit_id: 'visit-123',
        photos: mockPhotos,
        count: 1,
      });
    });

    it('should return 400 when visitId is missing', async () => {
      mockRequest.params = {};

      await controller.getPhotosByVisit(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing parameter',
        message: 'visitId is required',
      });
      expect(photoService.getPhotosByVisitId).not.toHaveBeenCalled();
    });

    it('should return 500 on service error', async () => {
      mockRequest.params = { visitId: 'visit-123' };

      (photoService.getPhotosByVisitId as jest.Mock).mockRejectedValue(new Error('Database error'));

      await controller.getPhotosByVisit(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to fetch photos',
        message: 'Database error',
      });
    });
  });

  describe('deletePhoto', () => {
    it('should delete photo successfully', async () => {
      mockRequest.params = { photoId: 'photo-123' };

      (photoService.deletePhoto as jest.Mock).mockResolvedValue(undefined);

      await controller.deletePhoto(mockRequest as Request, mockResponse as Response);

      expect(photoService.deletePhoto).toHaveBeenCalledWith('photo-123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Photo deleted successfully',
        photo_id: 'photo-123',
      });
    });

    it('should return 400 when photoId is missing', async () => {
      mockRequest.params = {};

      await controller.deletePhoto(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing parameter',
        message: 'photoId is required',
      });
      expect(photoService.deletePhoto).not.toHaveBeenCalled();
    });

    it('should return 404 when photo not found', async () => {
      mockRequest.params = { photoId: 'photo-123' };

      (photoService.deletePhoto as jest.Mock).mockRejectedValue(new Error('Photo not found'));

      await controller.deletePhoto(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Photo not found',
        message: 'The requested photo does not exist',
      });
    });

    it('should return 500 on service error', async () => {
      mockRequest.params = { photoId: 'photo-123' };

      (photoService.deletePhoto as jest.Mock).mockRejectedValue(new Error('S3 deletion failed'));

      await controller.deletePhoto(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to delete photo',
        message: 'An error occurred while deleting the photo',
      });
    });
  });

  describe('updateCaption', () => {
    it('should update caption successfully', async () => {
      mockRequest.params = { photoId: 'photo-123' };
      mockRequest.body = { caption: 'Updated caption' };

      const mockResult = {
        photo_id: 'photo-123',
        caption: 'Updated caption',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (photoService.updateCaption as jest.Mock).mockResolvedValue(mockResult);

      await controller.updateCaption(mockRequest as Request, mockResponse as Response);

      expect(photoService.updateCaption).toHaveBeenCalledWith('photo-123', 'Updated caption');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 when photoId is missing', async () => {
      mockRequest.params = {};
      mockRequest.body = { caption: 'Updated caption' };

      await controller.updateCaption(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing parameter',
        message: 'photoId is required',
      });
      expect(photoService.updateCaption).not.toHaveBeenCalled();
    });

    it('should return 400 when caption is missing', async () => {
      mockRequest.params = { photoId: 'photo-123' };
      mockRequest.body = {};

      await controller.updateCaption(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing field',
        message: 'caption is required',
      });
      expect(photoService.updateCaption).not.toHaveBeenCalled();
    });

    it('should allow empty string as caption', async () => {
      mockRequest.params = { photoId: 'photo-123' };
      mockRequest.body = { caption: '' };

      const mockResult = {
        photo_id: 'photo-123',
        caption: '',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (photoService.updateCaption as jest.Mock).mockResolvedValue(mockResult);

      await controller.updateCaption(mockRequest as Request, mockResponse as Response);

      expect(photoService.updateCaption).toHaveBeenCalledWith('photo-123', '');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when photo not found', async () => {
      mockRequest.params = { photoId: 'photo-123' };
      mockRequest.body = { caption: 'Updated caption' };

      (photoService.updateCaption as jest.Mock).mockRejectedValue(new Error('Photo not found'));

      await controller.updateCaption(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Photo not found',
        message: 'The requested photo does not exist',
      });
    });

    it('should return 500 on service error', async () => {
      mockRequest.params = { photoId: 'photo-123' };
      mockRequest.body = { caption: 'Updated caption' };

      (photoService.updateCaption as jest.Mock).mockRejectedValue(new Error('Database error'));

      await controller.updateCaption(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to update caption',
        message: 'An error occurred while updating the caption',
      });
    });
  });
});
