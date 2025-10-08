/**
 * Storage API Routes
 *
 * Endpoints for generating pre-signed URLs for file uploads
 * Philosophy: Client uploads directly to S3, server orchestrates
 */

import { Router, Request, Response } from 'express';
import {
  generatePhotoUploadUrl,
  generateSignatureUploadUrl,
  generateBatchPhotoUploadUrls,
  generateDownloadUrl,
  fileExists,
  getFileMetadata,
} from '../storage';

const router = Router();

/**
 * POST /v1/storage/photos/upload-url
 *
 * Generate pre-signed URL for photo upload
 */
router.post('/photos/upload-url', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { userId, metadata } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({
        error: {
          code: 'MISSING_USER_ID',
          message: 'userId is required',
        },
      });
    }

    // Generate upload URL
    const result = await generatePhotoUploadUrl(userId, metadata || {});

    return res.json({
      data: {
        uploadUrl: result.url,
        key: result.key,
        expiresIn: result.expiresIn,
      },
    });
  } catch (error) {
    console.error('Photo upload URL generation failed:', error);
    return res.status(500).json({
      error: {
        code: 'UPLOAD_URL_GENERATION_FAILED',
        message: 'Failed to generate upload URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /v1/storage/photos/batch-upload-urls
 *
 * Generate multiple pre-signed URLs for batch photo upload
 */
router.post(
  '/photos/batch-upload-urls',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { userId, count, metadata } = req.body;

      // Validation
      if (!userId) {
        return res.status(400).json({
          error: {
            code: 'MISSING_USER_ID',
            message: 'userId is required',
          },
        });
      }

      if (!count || count < 1 || count > 10) {
        return res.status(400).json({
          error: {
            code: 'INVALID_COUNT',
            message: 'count must be between 1 and 10',
          },
        });
      }

      // Generate batch upload URLs
      const results = await generateBatchPhotoUploadUrls(userId, count, metadata || {});

      return res.json({
        data: {
          uploadUrls: results.map((result) => ({
            uploadUrl: result.url,
            key: result.key,
            expiresIn: result.expiresIn,
          })),
        },
      });
    } catch (error) {
      console.error('Batch upload URL generation failed:', error);
      return res.status(500).json({
        error: {
          code: 'BATCH_UPLOAD_URL_GENERATION_FAILED',
          message: 'Failed to generate batch upload URLs',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
);

/**
 * POST /v1/storage/signatures/upload-url
 *
 * Generate pre-signed URL for signature upload
 */
router.post(
  '/signatures/upload-url',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { userId, visitId } = req.body;

      // Validation
      if (!userId || !visitId) {
        return res.status(400).json({
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'userId and visitId are required',
          },
        });
      }

      // Generate upload URL
      const result = await generateSignatureUploadUrl(userId, visitId);

      return res.json({
        data: {
          uploadUrl: result.url,
          key: result.key,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      console.error('Signature upload URL generation failed:', error);
      return res.status(500).json({
        error: {
          code: 'SIGNATURE_UPLOAD_URL_GENERATION_FAILED',
          message: 'Failed to generate signature upload URL',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
);

/**
 * POST /v1/storage/download-url
 *
 * Generate pre-signed URL for file download
 */
router.post('/download-url', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { key, expiresIn } = req.body;

    // Validation
    if (!key) {
      return res.status(400).json({
        error: {
          code: 'MISSING_KEY',
          message: 'key is required',
        },
      });
    }

    // Check if file exists
    const exists = await fileExists(key);
    if (!exists) {
      return res.status(404).json({
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File does not exist',
        },
      });
    }

    // Generate download URL
    const downloadUrl = await generateDownloadUrl(key, expiresIn || 3600);

    return res.json({
      data: {
        downloadUrl,
        expiresIn: expiresIn || 3600,
      },
    });
  } catch (error) {
    console.error('Download URL generation failed:', error);
    return res.status(500).json({
      error: {
        code: 'DOWNLOAD_URL_GENERATION_FAILED',
        message: 'Failed to generate download URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /v1/storage/metadata/:key
 *
 * Get file metadata
 */
router.get('/metadata/*', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    // Extract key from path (everything after /metadata/)
    const key = req.params[0];

    if (!key) {
      return res.status(400).json({
        error: {
          code: 'MISSING_KEY',
          message: 'key is required',
        },
      });
    }

    // Get metadata
    const metadata = await getFileMetadata(key);

    if (!metadata) {
      return res.status(404).json({
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File does not exist',
        },
      });
    }

    return res.json({
      data: metadata,
    });
  } catch (error) {
    console.error('Metadata retrieval failed:', error);
    return res.status(500).json({
      error: {
        code: 'METADATA_RETRIEVAL_FAILED',
        message: 'Failed to retrieve file metadata',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /v1/storage/exists/:key
 *
 * Check if file exists
 */
router.get('/exists/*', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    // Extract key from path (everything after /exists/)
    const key = req.params[0];

    if (!key) {
      return res.status(400).json({
        error: {
          code: 'MISSING_KEY',
          message: 'key is required',
        },
      });
    }

    // Check existence
    const exists = await fileExists(key);

    return res.json({
      data: {
        exists,
        key,
      },
    });
  } catch (error) {
    console.error('File existence check failed:', error);
    return res.status(500).json({
      error: {
        code: 'FILE_EXISTENCE_CHECK_FAILED',
        message: 'Failed to check file existence',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;
