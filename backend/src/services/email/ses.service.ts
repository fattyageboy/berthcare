/**
 * SES Service
 * Amazon SES integration for email sending
 */

import { SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { getSESClient, isSESConfigured, getSenderEmail, getSenderName } from '../../config/ses';
import { logger } from '../../shared/utils/logger';
import { EmailRecipient, EmailAttachment, EmailSendResult } from './types';

export class SESService {
  /**
   * Send email via Amazon SES
   */
  async sendEmail(
    to: EmailRecipient | EmailRecipient[],
    subject: string,
    html: string,
    text?: string,
    cc?: EmailRecipient[],
    bcc?: EmailRecipient[],
    replyTo?: string
  ): Promise<EmailSendResult> {
    if (!isSESConfigured()) {
      logger.warn('SES not configured, skipping email send');
      return { success: false, error: 'SES not configured' };
    }

    try {
      const sesClient = getSESClient();
      const senderEmail = getSenderEmail();
      const senderName = getSenderName();
      const fromAddress = `${senderName} <${senderEmail}>`;

      // Convert recipients to array
      const recipients = Array.isArray(to) ? to : [to];
      const toAddresses = recipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email);

      const command = new SendEmailCommand({
        Source: fromAddress,
        Destination: {
          ToAddresses: toAddresses,
          CcAddresses: cc?.map(r => r.name ? `${r.name} <${r.email}>` : r.email),
          BccAddresses: bcc?.map(r => r.name ? `${r.name} <${r.email}>` : r.email),
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: html,
              Charset: 'UTF-8',
            },
            Text: text ? {
              Data: text,
              Charset: 'UTF-8',
            } : undefined,
          },
        },
        ReplyToAddresses: replyTo ? [replyTo] : undefined,
      });

      const response = await sesClient.send(command);

      logger.info(`Email sent successfully to ${toAddresses.join(', ')}, MessageId: ${response.MessageId}`);

      return {
        success: true,
        message_id: response.MessageId,
      };
    } catch (error: any) {
      logger.error('Failed to send email via SES:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Send email with attachments via Amazon SES
   */
  async sendEmailWithAttachments(
    to: EmailRecipient | EmailRecipient[],
    subject: string,
    html: string,
    attachments: EmailAttachment[],
    text?: string,
    cc?: EmailRecipient[],
    bcc?: EmailRecipient[],
    replyTo?: string
  ): Promise<EmailSendResult> {
    if (!isSESConfigured()) {
      logger.warn('SES not configured, skipping email send');
      return { success: false, error: 'SES not configured' };
    }

    try {
      const sesClient = getSESClient();
      const senderEmail = getSenderEmail();
      const senderName = getSenderName();
      const fromAddress = `${senderName} <${senderEmail}>`;

      // Convert recipients to array
      const recipients = Array.isArray(to) ? to : [to];
      const toAddresses = recipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email);

      // Build MIME message with attachments
      const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const rawMessage = this.buildMIMEMessage(
        fromAddress,
        toAddresses,
        subject,
        html,
        text,
        attachments,
        boundary,
        cc,
        bcc,
        replyTo
      );

      const command = new SendRawEmailCommand({
        RawMessage: {
          Data: Buffer.from(rawMessage),
        },
      });

      const response = await sesClient.send(command);

      logger.info(`Email with attachments sent successfully to ${toAddresses.join(', ')}, MessageId: ${response.MessageId}`);

      return {
        success: true,
        message_id: response.MessageId,
      };
    } catch (error: any) {
      logger.error('Failed to send email with attachments via SES:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Build MIME message for raw email with attachments
   */
  private buildMIMEMessage(
    from: string,
    to: string[],
    subject: string,
    html: string,
    text: string | undefined,
    attachments: EmailAttachment[],
    boundary: string,
    cc?: EmailRecipient[],
    bcc?: EmailRecipient[],
    replyTo?: string
  ): string {
    let message = `From: ${from}\r\n`;
    message += `To: ${to.join(', ')}\r\n`;
    
    if (cc && cc.length > 0) {
      const ccAddresses = cc.map(r => r.name ? `${r.name} <${r.email}>` : r.email);
      message += `Cc: ${ccAddresses.join(', ')}\r\n`;
    }
    
    if (bcc && bcc.length > 0) {
      const bccAddresses = bcc.map(r => r.name ? `${r.name} <${r.email}>` : r.email);
      message += `Bcc: ${bccAddresses.join(', ')}\r\n`;
    }
    
    if (replyTo) {
      message += `Reply-To: ${replyTo}\r\n`;
    }
    
    message += `Subject: ${subject}\r\n`;
    message += `MIME-Version: 1.0\r\n`;
    message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

    // Add text/html parts
    message += `--${boundary}\r\n`;
    message += `Content-Type: multipart/alternative; boundary="${boundary}_alt"\r\n\r\n`;

    if (text) {
      message += `--${boundary}_alt\r\n`;
      message += `Content-Type: text/plain; charset=UTF-8\r\n`;
      message += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
      message += `${text}\r\n\r\n`;
    }

    message += `--${boundary}_alt\r\n`;
    message += `Content-Type: text/html; charset=UTF-8\r\n`;
    message += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    message += `${html}\r\n\r\n`;
    message += `--${boundary}_alt--\r\n`;

    // Add attachments
    for (const attachment of attachments) {
      message += `--${boundary}\r\n`;
      message += `Content-Type: ${attachment.contentType}; name="${attachment.filename}"\r\n`;
      message += `Content-Transfer-Encoding: base64\r\n`;
      message += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n\r\n`;
      
      const content = Buffer.isBuffer(attachment.content)
        ? attachment.content.toString('base64')
        : Buffer.from(attachment.content).toString('base64');
      
      message += `${content}\r\n\r\n`;
    }

    message += `--${boundary}--`;

    return message;
  }

  /**
   * Verify email address with SES
   */
  async verifyEmailAddress(email: string): Promise<boolean> {
    // This would typically call SES VerifyEmailIdentity
    // For now, we'll just log it
    logger.info(`Email verification requested for: ${email}`);
    return true;
  }
}
