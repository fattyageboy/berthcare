/**
 * Notification Routes
 * API routes for notification management
 */

import { Router } from 'express';
import { Pool } from 'pg';
import { NotificationController } from './controller';
import { NotificationService } from './service';
import {
  registerTokenValidators,
  sendNotificationValidators,
  updatePreferencesValidators,
  notificationIdValidator,
  paginationValidators,
} from './validators';

export function createNotificationRoutes(pool: Pool): Router {
  const router = Router();
  const notificationService = new NotificationService(pool);
  const controller = new NotificationController(notificationService);

  // Device token management
  router.post('/tokens', registerTokenValidators, controller.registerToken);
  router.delete('/tokens/:id', controller.deactivateToken);

  // Send notifications
  router.post('/send', sendNotificationValidators, controller.sendNotification);

  // Get notifications
  router.get('/', paginationValidators, controller.getNotifications);
  router.patch('/:id/read', notificationIdValidator, controller.markAsRead);

  // Preferences
  router.get('/preferences', controller.getPreferences);
  router.put('/preferences', updatePreferencesValidators, controller.updatePreferences);

  return router;
}
