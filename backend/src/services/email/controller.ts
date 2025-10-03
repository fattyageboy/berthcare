/**
 * Email Controller
 * HTTP request handlers for email endpoints
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { EmailService } from './service';
import { logger } from '../../shared/utils/logger';
import {
  SendEmailRequest,
  VisitReportEmailData,
  PasswordResetEmailData,
  WelcomeEmailData,
  WeeklySummaryEmailData,
} from './types';

export class EmailController {
  constructor(private emailService: EmailService) {}

  /**
   * POST /api/email/send
   * Send custom email
   */
  sendEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const request = req.body as SendEmailRequest;
      const result = await this.emailService.sendEmail(request);

      if (result.success) {
        res.status(200).json({
          message: 'Email sent successfully',
          message_id: result.message_id,
        });
      } else {
        res.status(400).json({
          message: 'Failed to send email',
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  };

  /**
   * POST /api/email/visit-report
   * Send visit report email
   */
  sendVisitReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { recipient_email, recipient_name, data } = req.body as {
        recipient_email: string;
        recipient_name: string;
        data: VisitReportEmailData;
      };
      await this.emailService.sendVisitReport(recipient_email, recipient_name, data);

      res.status(200).json({
        message: 'Visit report email sent successfully',
      });
    } catch (error) {
      logger.error('Error sending visit report email:', error);
      res.status(500).json({ error: 'Failed to send visit report email' });
    }
  };

  /**
   * POST /api/email/password-reset
   * Send password reset email
   */
  sendPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { recipient_email, recipient_name, data } = req.body as {
        recipient_email: string;
        recipient_name: string;
        data: PasswordResetEmailData;
      };
      await this.emailService.sendPasswordReset(recipient_email, recipient_name, data);

      res.status(200).json({
        message: 'Password reset email sent successfully',
      });
    } catch (error) {
      logger.error('Error sending password reset email:', error);
      res.status(500).json({ error: 'Failed to send password reset email' });
    }
  };

  /**
   * POST /api/email/welcome
   * Send welcome email
   */
  sendWelcome = async (req: Request, res: Response): Promise<void> => {
    try {
      const { recipient_email, recipient_name, data } = req.body as {
        recipient_email: string;
        recipient_name: string;
        data: WelcomeEmailData;
      };
      await this.emailService.sendWelcome(recipient_email, recipient_name, data);

      res.status(200).json({
        message: 'Welcome email sent successfully',
      });
    } catch (error) {
      logger.error('Error sending welcome email:', error);
      res.status(500).json({ error: 'Failed to send welcome email' });
    }
  };

  /**
   * POST /api/email/weekly-summary
   * Send weekly summary email
   */
  sendWeeklySummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { recipient_email, recipient_name, data } = req.body as {
        recipient_email: string;
        recipient_name: string;
        data: WeeklySummaryEmailData;
      };
      await this.emailService.sendWeeklySummary(recipient_email, recipient_name, data);

      res.status(200).json({
        message: 'Weekly summary email sent successfully',
      });
    } catch (error) {
      logger.error('Error sending weekly summary email:', error);
      res.status(500).json({ error: 'Failed to send weekly summary email' });
    }
  };

  /**
   * GET /api/email/logs
   * Get email logs
   */
  getEmailLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const email = req.query.email as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!email) {
        res.status(400).json({ error: 'Email parameter is required' });
        return;
      }

      const logs = await this.emailService.getEmailLogs(email, limit, offset);

      res.status(200).json({
        logs,
        pagination: {
          limit,
          offset,
          total: logs.length,
        },
      });
    } catch (error) {
      logger.error('Error fetching email logs:', error);
      res.status(500).json({ error: 'Failed to fetch email logs' });
    }
  };

  /**
   * GET /api/email/stats/bounces
   * Get bounce statistics
   */
  getBounceStats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.emailService.getBounceStats();

      res.status(200).json({ stats });
    } catch (error) {
      logger.error('Error fetching bounce stats:', error);
      res.status(500).json({ error: 'Failed to fetch bounce stats' });
    }
  };

  /**
   * GET /api/email/stats/delivery
   * Get delivery statistics
   */
  getDeliveryStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const stats = await this.emailService.getDeliveryStats(startDate, endDate);

      res.status(200).json({ stats });
    } catch (error) {
      logger.error('Error fetching delivery stats:', error);
      res.status(500).json({ error: 'Failed to fetch delivery stats' });
    }
  };

  /**
   * POST /api/email/webhook/ses
   * Handle SES bounce/complaint notifications
   */
  handleSESWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const notification = req.body as { notificationType: string };

      if (notification.notificationType === 'Bounce') {
        await this.emailService.handleBounce(notification);
      } else if (notification.notificationType === 'Complaint') {
        await this.emailService.handleComplaint(notification);
      }

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      logger.error('Error processing SES webhook:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  };

  /**
   * GET /api/email/suppressed/:email
   * Check if email is suppressed
   */
  checkSuppressed = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.params;
      const isSuppressed = await this.emailService.isEmailSuppressed(email);

      res.status(200).json({
        email,
        is_suppressed: isSuppressed,
      });
    } catch (error) {
      logger.error('Error checking suppressed email:', error);
      res.status(500).json({ error: 'Failed to check suppressed email' });
    }
  };
}
