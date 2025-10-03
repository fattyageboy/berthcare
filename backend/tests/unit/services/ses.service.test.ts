/**
 * SES Service Unit Tests
 * Tests for Amazon SES integration
 */

import { SESService } from '../../../src/services/email/ses.service';
import * as sesConfig from '../../../src/config/ses';
import { logger } from '../../../src/shared/utils/logger';

// Mock dependencies
jest.mock('../../../src/config/ses');
jest.mock('../../../src/shared/utils/logger');

describe('SESService', () => {
  let service: SESService;
  let mockSESClient: any;

  beforeEach(() => {
    service = new SESService();
    mockSESClient = {
      send: jest.fn(),
    };

    (sesConfig.isSESConfigured as jest.Mock).mockReturnValue(true);
    (sesConfig.getSESClient as jest.Mock).mockReturnValue(mockSESClient);
    (sesConfig.getSenderEmail as jest.Mock).mockReturnValue('noreply@berthcare.com');
    (sesConfig.getSenderName as jest.Mock).mockReturnValue('BerthCare');

    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockSESClient.send.mockResolvedValueOnce({ MessageId: 'message-123' });

      const result = await service.sendEmail(
        { email: 'user@example.com', name: 'John Doe' },
        'Test Subject',
        '<h1>Test HTML</h1>',
        'Test Text'
      );

      expect(result.success).toBe(true);
      expect(result.message_id).toBe('message-123');
      expect(mockSESClient.send).toHaveBeenCalled();
    });

    it('should send to multiple recipients', async () => {
      mockSESClient.send.mockResolvedValueOnce({ MessageId: 'message-123' });

      const recipients = [
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'user2@example.com', name: 'User 2' },
      ];

      const result = await service.sendEmail(
        recipients,
        'Test Subject',
        '<h1>Test</h1>'
      );

      expect(result.success).toBe(true);
      expect(mockSESClient.send).toHaveBeenCalled();
    });

    it('should include CC and BCC recipients', async () => {
      mockSESClient.send.mockResolvedValueOnce({ MessageId: 'message-123' });

      await service.sendEmail(
        { email: 'to@example.com' },
        'Subject',
        '<p>Body</p>',
        'Body',
        [{ email: 'cc@example.com' }],
        [{ email: 'bcc@example.com' }]
      );

      expect(mockSESClient.send).toHaveBeenCalled();
    });

    it('should include reply-to address', async () => {
      mockSESClient.send.mockResolvedValueOnce({ MessageId: 'message-123' });

      await service.sendEmail(
        { email: 'to@example.com' },
        'Subject',
        '<p>Body</p>',
        'Body',
        undefined,
        undefined,
        'reply@example.com'
      );

      expect(mockSESClient.send).toHaveBeenCalled();
    });

    it('should handle SES error', async () => {
      mockSESClient.send.mockRejectedValueOnce(new Error('SES error'));

      const result = await service.sendEmail(
        { email: 'user@example.com' },
        'Subject',
        '<p>Body</p>'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('SES error');
    });

    it('should return error if SES not configured', async () => {
      (sesConfig.isSESConfigured as jest.Mock).mockReturnValue(false);

      const result = await service.sendEmail(
        { email: 'user@example.com' },
        'Subject',
        '<p>Body</p>'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('SES not configured');
    });
  });

  describe('sendEmailWithAttachments', () => {
    const mockAttachments = [
      {
        filename: 'document.pdf',
        content: Buffer.from('PDF content'),
        contentType: 'application/pdf',
      },
    ];

    it('should send email with attachments', async () => {
      mockSESClient.send.mockResolvedValueOnce({ MessageId: 'message-123' });

      const result = await service.sendEmailWithAttachments(
        { email: 'user@example.com' },
        'Subject',
        '<p>Body</p>',
        mockAttachments
      );

      expect(result.success).toBe(true);
      expect(result.message_id).toBe('message-123');
      expect(mockSESClient.send).toHaveBeenCalled();
    });

    it('should handle multiple attachments', async () => {
      const attachments = [
        {
          filename: 'doc1.pdf',
          content: Buffer.from('PDF 1'),
          contentType: 'application/pdf',
        },
        {
          filename: 'doc2.pdf',
          content: Buffer.from('PDF 2'),
          contentType: 'application/pdf',
        },
      ];

      mockSESClient.send.mockResolvedValueOnce({ MessageId: 'message-123' });

      const result = await service.sendEmailWithAttachments(
        { email: 'user@example.com' },
        'Subject',
        '<p>Body</p>',
        attachments
      );

      expect(result.success).toBe(true);
    });

    it('should handle string content in attachments', async () => {
      const attachments = [
        {
          filename: 'text.txt',
          content: 'Text content',
          contentType: 'text/plain',
        },
      ];

      mockSESClient.send.mockResolvedValueOnce({ MessageId: 'message-123' });

      const result = await service.sendEmailWithAttachments(
        { email: 'user@example.com' },
        'Subject',
        '<p>Body</p>',
        attachments
      );

      expect(result.success).toBe(true);
    });

    it('should handle error with attachments', async () => {
      mockSESClient.send.mockRejectedValueOnce(new Error('Attachment too large'));

      const result = await service.sendEmailWithAttachments(
        { email: 'user@example.com' },
        'Subject',
        '<p>Body</p>',
        mockAttachments
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Attachment too large');
    });

    it('should return error if SES not configured', async () => {
      (sesConfig.isSESConfigured as jest.Mock).mockReturnValue(false);

      const result = await service.sendEmailWithAttachments(
        { email: 'user@example.com' },
        'Subject',
        '<p>Body</p>',
        mockAttachments
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('SES not configured');
    });
  });

  describe('verifyEmailAddress', () => {
    it('should verify email address', async () => {
      const result = await service.verifyEmailAddress('test@example.com');

      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Email verification requested')
      );
    });
  });
});
