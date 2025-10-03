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
  router.post('/send', sendEmailValidators, controller.sendEmail);
  router.post('/visit-report', sendVisitReportValidators, controller.sendVisitReport);
  router.post('/password-reset', sendPasswordResetValidators, controller.sendPasswordReset);
  router.post('/welcome', controller.sendWelcome);
  router.post('/weekly-summary', controller.sendWeeklySummary);

  // Email logs and statistics
  router.get('/logs', emailLogsValidators, controller.getEmailLogs);
  router.get('/stats/bounces', controller.getBounceStats);
  router.get('/stats/delivery', controller.getDeliveryStats);

  // Suppression check
  router.get('/suppressed/:email', controller.checkSuppressed);

  // SES webhook for bounce/complaint handling
  router.post('/webhook/ses', bounceNotificationValidator, controller.handleSESWebhook);

  return router;
}
