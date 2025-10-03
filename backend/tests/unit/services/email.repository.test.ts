/**
 * Email Repository Unit Tests
 * Tests for email database operations
 */

import { Pool } from 'pg';
import { EmailRepository } from '../../../src/services/email/repository';

// Create mock query function
const mockQuery = jest.fn();

// Mock pg Pool
jest.mock('pg', () => {
  return {
    Pool: jest.fn().mockImplementation(() => ({
      query: mockQuery,
    })),
  };
});

describe('EmailRepository', () => {
  let repository: EmailRepository;
  let mockPool: Pool;

  beforeEach(() => {
    mockPool = new Pool();
    repository = new EmailRepository(mockPool);
    jest.clearAllMocks();
    mockQuery.mockClear();
  });

  describe('createEmailLog', () => {
    it('should create email log entry', async () => {
      const logData = {
        recipient_email: 'user@example.com',
        recipient_name: 'John Doe',
        subject: 'Test Email',
        type: 'visit_report' as const,
        status: 'sent' as const,
        message_id: 'ses-message-123',
        metadata: { visit_id: 'visit-123' },
      };

      const mockResult = {
        rows: [
          {
            id: 'log-uuid',
            ...logData,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await repository.createEmailLog(logData);

      expect(result.id).toBe('log-uuid');
      expect(result.recipient_email).toBe('user@example.com');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO email_logs'),
        expect.arrayContaining(['user@example.com', 'John Doe', 'Test Email'])
      );
    });
  });

  describe('updateEmailStatus', () => {
    it('should update email status to sent', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      await repository.updateEmailStatus('message-123', 'sent');

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('UPDATE email_logs'), [
        'sent',
        null,
        'message-123',
      ]);
    });
  });

  describe('isEmailSuppressed', () => {
    it('should return true if email is suppressed', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ is_suppressed: true }],
      });

      const result = await repository.isEmailSuppressed('bounced@example.com');

      expect(result).toBe(true);
    });

    it('should return false if email not in bounce list', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await repository.isEmailSuppressed('new@example.com');

      expect(result).toBe(false);
    });
  });

  describe('recordBounce', () => {
    it('should record permanent bounce', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      await repository.recordBounce(
        'bounced@example.com',
        'Permanent',
        'General',
        'smtp; 550 5.1.1 user unknown'
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO email_bounces'),
        expect.arrayContaining(['bounced@example.com', 'Permanent', 'General'])
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

      mockQuery.mockResolvedValueOnce({ rows: [mockStats] });

      const result = await repository.getBounceStats();

      expect(result).toEqual(mockStats);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('COUNT(*) FILTER'));
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
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockStats] });

      const result = await repository.getDeliveryStats();

      expect(result.total_sent).toBe(1000);
      expect(result.success_rate).toBe(95);
    });
  });

  describe('getEmailLogsByRecipient', () => {
    it('should return email logs for recipient', async () => {
      const mockLogs = [
        { id: 'log-1', subject: 'Email 1', status: 'sent' },
        { id: 'log-2', subject: 'Email 2', status: 'sent' },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockLogs });

      const result = await repository.getEmailLogsByRecipient('user@example.com', 10, 0);

      expect(result).toEqual(mockLogs);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE recipient_email = $1'),
        ['user@example.com', 10, 0]
      );
    });
  });

  describe('getEmailLogsByType', () => {
    it('should return email logs by type', async () => {
      const mockLogs = [
        { id: 'log-1', type: 'visit_report' },
        { id: 'log-2', type: 'visit_report' },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockLogs });

      const result = await repository.getEmailLogsByType('visit_report', 50, 0);

      expect(result).toEqual(mockLogs);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE type = $1'), [
        'visit_report',
        50,
        0,
      ]);
    });
  });

  describe('recordComplaint', () => {
    it('should record spam complaint', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      await repository.recordComplaint('complaint@example.com');

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO email_bounces'), [
        'complaint@example.com',
      ]);
    });
  });

  describe('deleteOldEmailLogs', () => {
    it('should delete old email logs', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 50 });

      const result = await repository.deleteOldEmailLogs(90);

      expect(result).toBe(50);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INTERVAL '90 days'"));
    });

    it('should use default 90 days if not specified', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 30 });

      const result = await repository.deleteOldEmailLogs();

      expect(result).toBe(30);
    });
  });

  describe('getDeliveryStats with date range', () => {
    it('should filter by date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_sent: 100,
            successful: 95,
            failed: 3,
            bounced: 1,
            complained: 1,
          },
        ],
      });

      await repository.getDeliveryStats(startDate, endDate);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('created_at >='),
        expect.arrayContaining([startDate, endDate])
      );
    });

    it('should handle zero total sent', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_sent: 0,
            successful: 0,
            failed: 0,
            bounced: 0,
            complained: 0,
          },
        ],
      });

      const result = await repository.getDeliveryStats();

      expect(result.success_rate).toBe(0);
    });
  });
});
