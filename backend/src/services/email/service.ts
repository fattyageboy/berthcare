/**
 * Email Service
 * Main service for managing email sending and tracking
 */

import { Pool } from 'pg';
import { EmailRepository } from './repository';
import { SESService } from './ses.service';
import { logger } from '../../shared/utils/logger';
import {
  SendEmailRequest,
  VisitReportEmailData,
  PasswordResetEmailData,
  WelcomeEmailData,
  WeeklySummaryEmailData,
} from './types';
import {
  visitReportTemplate,
  passwordResetTemplate,
  welcomeTemplate,
  weeklySummaryTemplate,
} from './templates';

export class EmailService {
  private repository: EmailRepository;
  private sesService: SESService;

  constructor(pool: Pool) {
    this.repository = new EmailRepository(pool);
    this.sesService = new SESService();
  }

  /**
   * Send email
   */
  async sendEmail(
    request: SendEmailRequest
  ): Promise<{ success: boolean; message_id?: string; error?: string }> {
    try {
      // Convert recipients to array
      const recipients = Array.isArray(request.to) ? request.to : [request.to];

      // Check for suppressed emails
      for (const recipient of recipients) {
        const isSuppressed = await this.repository.isEmailSuppressed(recipient.email);
        if (isSuppressed) {
          logger.warn(`Email ${recipient.email} is suppressed, skipping send`);
          return {
            success: false,
            error: `Email ${recipient.email} is suppressed due to bounces or complaints`,
          };
        }
      }

      // Send email via SES
      let result;
      if (request.attachments && request.attachments.length > 0) {
        result = await this.sesService.sendEmailWithAttachments(
          request.to,
          request.subject,
          request.html,
          request.attachments,
          request.text,
          request.cc,
          request.bcc,
          request.replyTo
        );
      } else {
        result = await this.sesService.sendEmail(
          request.to,
          request.subject,
          request.html,
          request.text,
          request.cc,
          request.bcc,
          request.replyTo
        );
      }

      // Log email send attempt
      for (const recipient of recipients) {
        await this.repository.createEmailLog({
          recipient_email: recipient.email,
          recipient_name: recipient.name,
          subject: request.subject,
          type: request.type,
          status: result.success ? 'sent' : 'failed',
          message_id: result.message_id,
          metadata: request.metadata,
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return {
        success: false,
        error: 'Failed to send email',
      };
    }
  }

  /**
   * Send visit report email
   */
  async sendVisitReport(
    recipientEmail: string,
    recipientName: string,
    data: VisitReportEmailData
  ): Promise<void> {
    const template = visitReportTemplate(data);

    await this.sendEmail({
      to: { email: recipientEmail, name: recipientName },
      subject: template.subject,
      html: template.html,
      text: template.text,
      type: 'visit_report',
      metadata: {
        visit_id: data.visit_id,
        client_name: data.client_name,
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(
    recipientEmail: string,
    recipientName: string,
    data: PasswordResetEmailData
  ): Promise<void> {
    const template = passwordResetTemplate(data);

    await this.sendEmail({
      to: { email: recipientEmail, name: recipientName },
      subject: template.subject,
      html: template.html,
      text: template.text,
      type: 'password_reset',
      metadata: {
        user_name: data.user_name,
      },
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcome(
    recipientEmail: string,
    recipientName: string,
    data: WelcomeEmailData
  ): Promise<void> {
    const template = welcomeTemplate(data);

    await this.sendEmail({
      to: { email: recipientEmail, name: recipientName },
      subject: template.subject,
      html: template.html,
      text: template.text,
      type: 'welcome',
      metadata: {
        user_name: data.user_name,
        role: data.role,
      },
    });
  }

  /**
   * Send weekly summary email
   */
  async sendWeeklySummary(
    recipientEmail: string,
    recipientName: string,
    data: WeeklySummaryEmailData
  ): Promise<void> {
    const template = weeklySummaryTemplate(data);

    await this.sendEmail({
      to: { email: recipientEmail, name: recipientName },
      subject: template.subject,
      html: template.html,
      text: template.text,
      type: 'weekly_summary',
      metadata: {
        user_name: data.user_name,
        week_start: data.week_start,
        week_end: data.week_end,
      },
    });
  }

  /**
   * Handle SES bounce notification
   */
  async handleBounce(notification: any): Promise<void> {
    try {
      const { bounce, mail } = notification;

      // Update email log status
      if (mail.messageId) {
        await this.repository.updateEmailStatus(mail.messageId, 'bounced');
      }

      // Record bounce for each recipient
      for (const recipient of bounce.bouncedRecipients) {
        await this.repository.recordBounce(
          recipient.emailAddress,
          bounce.bounceType,
          bounce.bounceSubType,
          recipient.diagnosticCode
        );

        logger.warn(`Email bounced: ${recipient.emailAddress}, Type: ${bounce.bounceType}`);
      }
    } catch (error) {
      logger.error('Failed to handle bounce notification:', error);
    }
  }

  /**
   * Handle SES complaint notification
   */
  async handleComplaint(notification: any): Promise<void> {
    try {
      const { complaint, mail } = notification;

      // Update email log status
      if (mail.messageId) {
        await this.repository.updateEmailStatus(mail.messageId, 'complained');
      }

      // Record complaint for each recipient
      for (const recipient of complaint.complainedRecipients) {
        await this.repository.recordComplaint(recipient.emailAddress);

        logger.warn(`Email complaint received: ${recipient.emailAddress}`);
      }
    } catch (error) {
      logger.error('Failed to handle complaint notification:', error);
    }
  }

  /**
   * Get email logs for a recipient
   */
  async getEmailLogs(email: string, limit: number = 50, offset: number = 0) {
    return this.repository.getEmailLogsByRecipient(email, limit, offset);
  }

  /**
   * Get bounce statistics
   */
  async getBounceStats() {
    return this.repository.getBounceStats();
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStats(startDate?: Date, endDate?: Date) {
    return this.repository.getDeliveryStats(startDate, endDate);
  }

  /**
   * Cleanup old email logs
   */
  async cleanupOldLogs(daysOld: number = 90): Promise<number> {
    return this.repository.deleteOldEmailLogs(daysOld);
  }

  /**
   * Check if email is suppressed
   */
  async isEmailSuppressed(email: string): Promise<boolean> {
    return this.repository.isEmailSuppressed(email);
  }
}
