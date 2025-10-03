/**
 * Email Routes
 * API routes for email management
 */

import { Router } from 'express';
import { Pool } from 'pg';
import { EmailController } from './controller';
import { EmailService } from './service';
import {
  sendEmailValidators,
  sendVisitReportValidators,
  sendPasswordResetValidators,
  emailLogsValidators,
  bounceNotificationValidator,
} from './validators';

export function createEmailRoutes(pool: Pool): Router {
  const router = Router();
  const emailService = new EmailService(pool);
  const controller = new EmailController(emailService);

  // Send emails
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.post('/send', sendEmailValidators, controller.sendEmail);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.post('/visit-report', sendVisitReportValidators, controller.sendVisitReport);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.post('/password-reset', sendPasswordResetValidators, controller.sendPasswordReset);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.post('/welcome', controller.sendWelcome);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.post('/weekly-summary', controller.sendWeeklySummary);

  // Email logs and statistics
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get('/logs', emailLogsValidators, controller.getEmailLogs);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get('/stats/bounces', controller.getBounceStats);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get('/stats/delivery', controller.getDeliveryStats);

  // Suppression check
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get('/suppressed/:email', controller.checkSuppressed);

  // SES webhook for bounce/complaint handling
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.post('/webhook/ses', bounceNotificationValidator, controller.handleSESWebhook);

  return router;
}
