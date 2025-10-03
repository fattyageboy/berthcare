/**
 * Multer Configuration
 * Handles multipart/form-data file uploads
 */

import multer from 'multer';
import { fileLimits, allowedMimeTypes } from '../../config/s3';

// Use memory storage to keep files in buffer for processing
const storage = multer.memoryStorage();

// File filter for photos
const photoFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (allowedMimeTypes.photos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.photos.join(', ')}`));
  }
};

// Multer configuration for photo uploads
export const photoUpload = multer({
  storage,
  limits: {
    fileSize: fileLimits.maxPhotoSize,
    files: 1,
  },
  fileFilter: photoFileFilter,
});

// Multer configuration for document uploads
export const documentUpload = multer({
  storage,
  limits: {
    fileSize: fileLimits.maxDocumentSize,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.documents.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.documents.join(', ')}`));
    }
  },
});
