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
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.post('/tokens', registerTokenValidators, controller.registerToken);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.delete('/tokens/:id', controller.deactivateToken);

  // Send notifications
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.post('/send', sendNotificationValidators, controller.sendNotification);

  // Get notifications
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get('/', paginationValidators, controller.getNotifications);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.patch('/:id/read', notificationIdValidator, controller.markAsRead);

  // Preferences
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get('/preferences', controller.getPreferences);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.put('/preferences', updatePreferencesValidators, controller.updatePreferences);

  return router;
}
