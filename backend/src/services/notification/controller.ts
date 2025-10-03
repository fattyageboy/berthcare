/**
 * Notification Controller
 * HTTP request handlers for notification endpoints
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { NotificationService } from './service';
import { logger } from '../../shared/utils/logger';
import {
  RegisterTokenRequest,
  SendNotificationRequest,
  UpdatePreferencesRequest,
} from './types';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  /**
   * POST /api/notifications/tokens
   * Register device token for push notifications
   */
  registerToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const tokenData: RegisterTokenRequest = req.body;
      const token = await this.notificationService.registerDeviceToken(userId, tokenData);

      res.status(201).json({
        message: 'Device token registered successfully',
        token: {
          id: token.id,
          device_id: token.device_id,
          platform: token.platform,
          is_active: token.is_active,
        },
      });
    } catch (error) {
      logger.error('Error registering device token:', error);
      res.status(500).json({ error: 'Failed to register device token' });
    }
  };

  /**
   * POST /api/notifications/send
   * Send notification to a user
   */
  sendNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const request: SendNotificationRequest = req.body;
      const result = await this.notificationService.sendNotification(request);

      if (result.success) {
        res.status(200).json({
          message: 'Notification sent successfully',
          result,
        });
      } else {
        res.status(400).json({
          message: 'Failed to send notification',
          result,
        });
      }
    } catch (error) {
      logger.error('Error sending notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  };

  /**
   * GET /api/notifications
   * Get notifications for current user
   */
  getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const notifications = await this.notificationService.getUserNotifications(
        userId,
        limit,
        offset
      );

      const unreadCount = await this.notificationService.getUnreadCount(userId);

      res.status(200).json({
        notifications,
        unread_count: unreadCount,
        pagination: {
          limit,
          offset,
          total: notifications.length,
        },
      });
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  };

  /**
   * PATCH /api/notifications/:id/read
   * Mark notification as read
   */
  markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const notificationId = req.params.id;
      await this.notificationService.markAsRead(notificationId);

      res.status(200).json({
        message: 'Notification marked as read',
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  };

  /**
   * GET /api/notifications/preferences
   * Get notification preferences for current user
   */
  getPreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const preferences = await this.notificationService.getPreferences(userId);

      res.status(200).json({ preferences });
    } catch (error) {
      logger.error('Error fetching preferences:', error);
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  };

  /**
   * PUT /api/notifications/preferences
   * Update notification preferences
   */
  updatePreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const preferencesData: UpdatePreferencesRequest = req.body;
      const preferences = await this.notificationService.updatePreferences(
        userId,
        preferencesData
      );

      res.status(200).json({
        message: 'Preferences updated successfully',
        preferences,
      });
    } catch (error) {
      logger.error('Error updating preferences:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  };

  /**
   * DELETE /api/notifications/tokens/:id
   * Deactivate device token
   */
  deactivateToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const tokenId = req.params.id;
      await this.notificationService.deactivateToken(tokenId);

      res.status(200).json({
        message: 'Device token deactivated successfully',
      });
    } catch (error) {
      logger.error('Error deactivating token:', error);
      res.status(500).json({ error: 'Failed to deactivate token' });
    }
  };
}
