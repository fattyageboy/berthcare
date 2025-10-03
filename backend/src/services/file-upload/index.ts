/**
 * File Upload Service
 * Main entry point for file upload functionality
 */

import uploadRoutes from './upload.routes';

export { uploadRoutes };

// Export services for use in other modules
export { photoService } from './photo.service';
export { s3Service } from './s3.service';
export { photoRepository } from './photo.repository';
