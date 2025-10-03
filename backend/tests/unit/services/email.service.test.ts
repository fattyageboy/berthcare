/**
 * Email Service Unit Tests
 * Tests for email business logic
 */

import { Pool } from 'pg';
import { EmailService } from '../../../src/services/email/service';
import { EmailRepository } from '../../../src/services/email/repository';
import { SESService } from '../../../src/services/email/ses.service';

// Mock dependencies
jest.mock('../../../src/services/email/repository');
jest.mock('../../../src/services/email/ses.service');
jest.mock('../../../src/shared/utils/logger');

describe('EmailService', () => {
  let service: EmailService;
  let mockRepository: jest.Mocked<EmailRepository>;
  let mockSESService: jest.Mocked<SESService>;
  let mockPool: Pool;

  beforeEach(() => {
    mockPool = {} as Pool;
    service = new EmailService(mockPool);

    // Get mocked instances
    mockRepository = (service as any).repository;
    mockSESService = (service as any).sesService;

    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    const mockRequest = {
      to: { email: 'user@example.com', name: 'John Doe' },
      subject: 'Test Email',
      html: '<p>Test</p>',
      text: 'Test',
      type: 'system_notification' as const,
    };

    it('should send email successfully', async () => {
      mockRepository.isEmailSuppressed.mockResolvedValueOnce(false);
      mockSESService.sendEmail.mockResolvedValueOnce({
        success: true,
        message_id: 'message-123',
      });
      mockRepository.createEmailLog.mockResolvedValueOnce({
        id: 'log-uuid',
        recipient_email: 'user@example.com',
        recipient_name: 'John Doe',
        subject: 'Test Email',
        type: 'system_notification',
        status: 'sent',
        message_id: 'message-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.sendEmail(mockRequest);

      expect(result.success).toBe(true);
      expect(result.message_id).toBe('message-123');
      expect(mockRepository.createEmailLog).toHaveBeenCalled();
    });

    it('should block suppressed email', async () => {
      mockRepository.isEmailSuppressed.mockResolvedValueOnce(true);

      const result = await service.sendEmail(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('suppressed');
      expect(mockSESService.sendEmail).not.toHaveBeenCalled();
    });

    it('should send email with attachments', async () => {
      const requestWithAttachments = {
        ...mockRequest,
        attachments: [
          {
            filename: 'doc.pdf',
            content: Buffer.from('PDF'),
            contentType: 'application/pdf',
          },
        ],
      };

      mockRepository.isEmailSuppressed.mockResolvedValueOnce(false);
      mockSESService.sendEmailWithAttachments.mockResolvedValueOnce({
        success: true,
        message_id: 'message-123',
      });
      mockRepository.createEmailLog.mockResolvedValueOnce({
        id: 'log-uuid',
        recipient_email: 'user@example.com',
        recipient_name: 'John Doe',
        subject: 'Test Email',
        type: 'system_notification',
        status: 'sent',
        message_id: 'message-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.sendEmail(requestWithAttachments);

      expect(result.success).toBe(true);
      expect(mockSESService.sendEmailWithAttachments).toHaveBeenCalled();
    });

    it('should handle multiple recipients', async () => {
      const multiRecipientRequest = {
        ...mockRequest,
        to: [
          { email: 'user1@example.com', name: 'User 1' },
          { email: 'user2@example.com', name: 'User 2' },
        ],
      };

      mockRepository.isEmailSuppressed.mockResolvedValue(false);
      mockSESService.sendEmail.mockResolvedValueOnce({
        success: true,
        message_id: 'message-123',
      });
      mockRepository.createEmailLog.mockResolvedValue({
        id: 'log-uuid',
        recipient_email: 'user1@example.com',
        recipient_name: 'User 1',
        subject: 'Test Email',
        type: 'system_notification',
        status: 'sent',
        message_id: 'message-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.sendEmail(multiRecipientRequest);

      expect(result.success).toBe(true);
      expect(mockRepository.createEmailLog).toHaveBeenCalledTimes(2);
    });

    it('should log failed email', async () => {
      mockRepository.isEmailSuppressed.mockResolvedValueOnce(false);
      mockSESService.sendEmail.mockResolvedValueOnce({
        success: false,
        error: 'SES error',
      });
      mockRepository.createEmailLog.mockResolvedValueOnce({
        id: 'log-uuid',
        recipient_email: 'user@example.com',
        recipient_name: 'John Doe',
        subject: 'Test Email',
        type: 'system_notification',
        status: 'failed',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.sendEmail(mockRequest);

      expect(result.success).toBe(false);
      expect(mockRepository.createEmailLog).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed' })
      );
    });

    it('should handle service error', async () => {
      mockRepository.isEmailSuppressed.mockRejectedValueOnce(new Error('DB error'));

      const result = await service.sendEmail(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send email');
    });
  });

  describe('sendVisitReport', () => {
    it('should send visit report email', async () => {
      const data = {
        visit_id: 'visit-123',
        client_name: 'John Smith',
        nurse_name: 'Mary Johnson',
        visit_date: 'October 3, 2025',
        visit_type: 'Personal Care',
        duration: '2 hours',
        notes: 'Visit completed',
        care_activities: ['Bathing', 'Medication'],
      };

      mockRepository.isEmailSuppressed.mockResolvedValueOnce(false);
      mockSESService.sendEmail.mockResolvedValueOnce({
        success: true,
        message_id: 'message-123',
      });
      mockRepository.createEmailLog.mockResolvedValueOnce({
        id: 'log-uuid',
        recipient_email: 'family@example.com',
        recipient_name: 'Jane Doe',
        subject: expect.stringContaining('Visit Report'),
        type: 'visit_report',
        status: 'sent',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await service.sendVisitReport('family@example.com', 'Jane Doe', data);

      expect(mockSESService.sendEmail).toHaveBeenCalled();
      const callArgs = mockSESService.sendEmail.mock.calls[0];
      expect(callArgs[0]).toEqual(expect.objectContaining({ email: 'family@example.com' }));
      expect(callArgs[1]).toContain('Visit Report');
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email', async () => {
      const data = {
        user_name: 'John Doe',
        reset_link: 'https://app.berthcare.com/reset?token=abc',
        expiry_hours: 24,
      };

      mockRepository.isEmailSuppressed.mockResolvedValueOnce(false);
      mockSESService.sendEmail.mockResolvedValueOnce({
        success: true,
        message_id: 'message-123',
      });
      mockRepository.createEmailLog.mockResolvedValueOnce({
        id: 'log-uuid',
        recipient_email: 'user@example.com',
        recipient_name: 'John Doe',
        subject: 'Reset Your BerthCare Password',
        type: 'password_reset',
        status: 'sent',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await service.sendPasswordReset('user@example.com', 'John Doe', data);

      expect(mockSESService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('sendWelcome', () => {
    it('should send welcome email', async () => {
      const data = {
        user_name: 'New User',
        role: 'Nurse',
        login_link: 'https://app.berthcare.com/login',
        support_email: 'support@berthcare.com',
      };

      mockRepository.isEmailSuppressed.mockResolvedValueOnce(false);
      mockSESService.sendEmail.mockResolvedValueOnce({
        success: true,
        message_id: 'message-123',
      });
      mockRepository.createEmailLog.mockResolvedValueOnce({
        id: 'log-uuid',
        recipient_email: 'newuser@example.com',
        recipient_name: 'New User',
        subject: 'Welcome to BerthCare!',
        type: 'welcome',
        status: 'sent',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await service.sendWelcome('newuser@example.com', 'New User', data);

      expect(mockSESService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('sendWeeklySummary', () => {
    it('should send weekly summary email', async () => {
      const data = {
        user_name: 'Mary Johnson',
        week_start: 'September 27, 2025',
        week_end: 'October 3, 2025',
        total_visits: 25,
        completed_visits: 23,
        missed_visits: 2,
        total_hours: 50,
        highlights: ['Great work!'],
      };

      mockRepository.isEmailSuppressed.mockResolvedValueOnce(false);
      mockSESService.sendEmail.mockResolvedValueOnce({
        success: true,
        message_id: 'message-123',
      });
      mockRepository.createEmailLog.mockResolvedValueOnce({
        id: 'log-uuid',
        recipient_email: 'nurse@example.com',
        recipient_name: 'Mary Johnson',
        subject: expect.stringContaining('Weekly Summary'),
        type: 'weekly_summary',
        status: 'sent',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await service.sendWeeklySummary('nurse@example.com', 'Mary Johnson', data);

      expect(mockSESService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('handleBounce', () => {
    it('should handle bounce notification', async () => {
      const notification = {
        bounce: {
          bounceType: 'Permanent',
          bounceSubType: 'General',
          bouncedRecipients: [
            {
              emailAddress: 'bounced@example.com',
              diagnosticCode: 'smtp; 550 user unknown',
            },
          ],
        },
        mail: {
          messageId: 'message-123',
        },
      };

      mockRepository.updateEmailStatus.mockResolvedValueOnce();
      mockRepository.recordBounce.mockResolvedValueOnce();

      await service.handleBounce(notification);

      expect(mockRepository.updateEmailStatus).toHaveBeenCalledWith('message-123', 'bounced');
      expect(mockRepository.recordBounce).toHaveBeenCalledWith(
        'bounced@example.com',
        'Permanent',
        'General',
        'smtp; 550 user unknown'
      );
    });

    it('should handle bounce error gracefully', async () => {
      const notification = {
        bounce: {
          bounceType: 'Permanent',
          bouncedRecipients: [{ emailAddress: 'bounced@example.com' }],
        },
        mail: { messageId: 'message-123' },
      };

      mockRepository.updateEmailStatus.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.handleBounce(notification)).resolves.not.toThrow();
    });
  });

  describe('handleComplaint', () => {
    it('should handle complaint notification', async () => {
      const notification = {
        complaint: {
          complainedRecipients: [{ emailAddress: 'complaint@example.com' }],
        },
        mail: {
          messageId: 'message-123',
        },
      };

      mockRepository.updateEmailStatus.mockResolvedValueOnce();
      mockRepository.recordComplaint.mockResolvedValueOnce();

      await service.handleComplaint(notification);

      expect(mockRepository.updateEmailStatus).toHaveBeenCalledWith('message-123', 'complained');
      expect(mockRepository.recordComplaint).toHaveBeenCalledWith('complaint@example.com');
    });

    it('should handle complaint error gracefully', async () => {
      const notification = {
        complaint: {
          complainedRecipients: [{ emailAddress: 'complaint@example.com' }],
        },
        mail: { messageId: 'message-123' },
      };

      mockRepository.updateEmailStatus.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.handleComplaint(notification)).resolves.not.toThrow();
    });
  });

  describe('getEmailLogs', () => {
    it('should return email logs', async () => {
      const mockLogs = [
        { id: 'log-1', subject: 'Email 1' },
        { id: 'log-2', subject: 'Email 2' },
      ];

      mockRepository.getEmailLogsByRecipient.mockResolvedValueOnce(mockLogs as any);

      const result = await service.getEmailLogs('user@example.com', 50, 0);

      expect(result).toEqual(mockLogs);
      expect(mockRepository.getEmailLogsByRecipient).toHaveBeenCalledWith(
        'user@example.com',
        50,
        0
      );
    });
  });

  describe('getBounceStats', () => {
    it('should return bounce statistics', async () => {
      const mockStats = {
        total_bounces: 100,
        permanent_bounces: 60,
        transient_bounces: 40,
        suppressed_emails: 60,
      };

      mockRepository.getBounceStats.mockResolvedValueOnce(mockStats);

      const result = await service.getBounceStats();

      expect(result).toEqual(mockStats);
    });
  });

  describe('getDeliveryStats', () => {
    it('should return delivery statistics', async () => {
      const mockStats = {
        total_sent: 1000,
        successful: 950,
        failed: 30,
        bounced: 15,
        complained: 5,
        success_rate: 95,
      };

      mockRepository.getDeliveryStats.mockResolvedValueOnce(mockStats);

      const result = await service.getDeliveryStats();

      expect(result).toEqual(mockStats);
    });

    it('should pass date range to repository', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      mockRepository.getDeliveryStats.mockResolvedValueOnce({
        total_sent: 100,
        successful: 95,
        failed: 3,
        bounced: 1,
        complained: 1,
        success_rate: 95,
      });

      await service.getDeliveryStats(startDate, endDate);

      expect(mockRepository.getDeliveryStats).toHaveBeenCalledWith(startDate, endDate);
    });
  });

  describe('cleanupOldLogs', () => {
    it('should cleanup old logs', async () => {
      mockRepository.deleteOldEmailLogs.mockResolvedValueOnce(50);

      const result = await service.cleanupOldLogs(90);

      expect(result).toBe(50);
      expect(mockRepository.deleteOldEmailLogs).toHaveBeenCalledWith(90);
    });

    it('should use default days if not specified', async () => {
      mockRepository.deleteOldEmailLogs.mockResolvedValueOnce(30);

      const result = await service.cleanupOldLogs();

      expect(result).toBe(30);
      expect(mockRepository.deleteOldEmailLogs).toHaveBeenCalledWith(90);
    });
  });

  describe('isEmailSuppressed', () => {
    it('should check if email is suppressed', async () => {
      mockRepository.isEmailSuppressed.mockResolvedValueOnce(true);

      const result = await service.isEmailSuppressed('bounced@example.com');

      expect(result).toBe(true);
      expect(mockRepository.isEmailSuppressed).toHaveBeenCalledWith('bounced@example.com');
    });
  });
});
