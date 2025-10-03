import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { syncService } from './service';
import { ApiResponse } from '../../shared';
import { PullRequest, PushRequest } from './types';

/**
 * Sync Controller
 * Business logic for sync endpoints
 */

export class SyncController {
  /**
   * POST /sync/pull
   * Pull server changes since last sync
   */
  async pull(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      // Extract user ID from authenticated request
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - user ID not found',
        });
        return;
      }

      const pullRequest = req.body as PullRequest;

      const result = await syncService.pullChanges(userId, pullRequest);

      const response: ApiResponse<typeof result> = {
        success: true,
        message: 'Changes retrieved successfully',
        data: result,
      };

      res.json(response);
    } catch (error) {
      console.error('Error pulling changes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to pull changes',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /sync/push
   * Push local changes to server
   */
  async push(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      // Extract user ID from authenticated request
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - user ID not found',
        });
        return;
      }

      const pushRequest = req.body as PushRequest;

      const result = await syncService.pushChanges(userId, pushRequest);

      const response: ApiResponse<typeof result> = {
        success: true,
        message: 'Changes pushed successfully',
        data: result,
      };

      res.json(response);
    } catch (error) {
      console.error('Error pushing changes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to push changes',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const syncController = new SyncController();
