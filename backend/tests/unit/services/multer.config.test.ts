/**
 * Multer Configuration Unit Tests
 * Tests for file upload middleware configuration
 */

import { fileLimits, allowedMimeTypes } from '../../../src/config/s3';

describe('Multer Configuration', () => {
  describe('file size limits', () => {
    it('should have different limits for photos and documents', () => {
      expect(fileLimits.maxPhotoSize).toBeLessThan(fileLimits.maxDocumentSize);
    });

    it('should enforce photo size limit from environment', () => {
      // Photo size limit should be configurable via MAX_FILE_SIZE_MB env var
      expect(fileLimits.maxPhotoSize).toBeGreaterThan(0);
      expect(fileLimits.maxPhotoSize).toBeLessThanOrEqual(50 * 1024 * 1024);
    });

    it('should have reasonable document size limit', () => {
      expect(fileLimits.maxDocumentSize).toBe(50 * 1024 * 1024); // 50MB
    });

    it('should have photo size limit as 10MB by default', () => {
      // Default from MAX_FILE_SIZE_MB=10
      expect(fileLimits.maxPhotoSize).toBe(10 * 1024 * 1024);
    });
  });

  describe('allowed MIME types', () => {
    it('should allow common photo formats', () => {
      expect(allowedMimeTypes.photos).toContain('image/jpeg');
      expect(allowedMimeTypes.photos).toContain('image/jpg');
      expect(allowedMimeTypes.photos).toContain('image/png');
      expect(allowedMimeTypes.photos).toContain('image/webp');
    });

    it('should allow common document formats', () => {
      expect(allowedMimeTypes.documents).toContain('application/pdf');
      expect(allowedMimeTypes.documents).toContain('application/msword');
      expect(allowedMimeTypes.documents).toContain(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });

    it('should not allow video files for photos', () => {
      expect(allowedMimeTypes.photos).not.toContain('video/mp4');
      expect(allowedMimeTypes.photos).not.toContain('video/avi');
    });

    it('should not allow executable files', () => {
      expect(allowedMimeTypes.photos).not.toContain('application/x-executable');
      expect(allowedMimeTypes.documents).not.toContain('application/x-executable');
    });

    it('should have at least 4 photo MIME types', () => {
      expect(allowedMimeTypes.photos.length).toBeGreaterThanOrEqual(4);
    });

    it('should have at least 3 document MIME types', () => {
      expect(allowedMimeTypes.documents.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('MIME type validation', () => {
    it('should validate JPEG variations', () => {
      expect(allowedMimeTypes.photos).toContain('image/jpeg');
      expect(allowedMimeTypes.photos).toContain('image/jpg');
    });

    it('should support modern image formats', () => {
      expect(allowedMimeTypes.photos).toContain('image/webp');
    });

    it('should support legacy document formats', () => {
      expect(allowedMimeTypes.documents).toContain('application/msword');
    });

    it('should support modern document formats', () => {
      expect(allowedMimeTypes.documents).toContain(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });
  });

  describe('security considerations', () => {
    it('should not allow script files in photos', () => {
      const dangerousTypes = ['text/javascript', 'application/javascript', 'text/html'];
      dangerousTypes.forEach((type) => {
        expect(allowedMimeTypes.photos).not.toContain(type);
      });
    });

    it('should not allow script files in documents', () => {
      const dangerousTypes = ['text/javascript', 'application/javascript', 'text/html'];
      dangerousTypes.forEach((type) => {
        expect(allowedMimeTypes.documents).not.toContain(type);
      });
    });

    it('should have reasonable file size limits to prevent DoS', () => {
      expect(fileLimits.maxPhotoSize).toBeLessThanOrEqual(100 * 1024 * 1024); // Max 100MB
      expect(fileLimits.maxDocumentSize).toBeLessThanOrEqual(100 * 1024 * 1024); // Max 100MB
    });
  });
});
