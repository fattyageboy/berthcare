/**
 * FCM Service Unit Tests
 * Tests for Firebase Cloud Messaging integration
 */

import { FCMService } from '../../../src/services/notification/fcm.service';
import * as fcmConfig from '../../../src/config/fcm';

// Mock dependencies
jest.mock('../../../src/config/fcm');
jest.mock('../../../src/shared/utils/logger');

describe('FCMService', () => {
  let service: FCMService;
  let mockMessaging: any;

  beforeEach(() => {
    service = new FCMService();
    mockMessaging = {
      send: jest.fn(),
      sendEach: jest.fn(),
    };

    (fcmConfig.isFCMConfigured as jest.Mock).mockReturnValue(true);
    (fcmConfig.getMessaging as jest.Mock).mockReturnValue(mockMessaging);

    jest.clearAllMocks();
  });

  describe('sendToToken', () => {
    const mockToken = {
      id: 'token-123',
      user_id: 'user-123',
      device_id: 'device-123',
      fcm_token: 'fcm-token-abc',
      platform: 'ios' as const,
      app_version: '1.0.0',
      is_active: true,
      last_used_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should send notification successfully', async () => {
      mockMessaging.send.mockResolvedValueOnce('message-id-123');

      const result = await service.sendToToken(
        mockToken,
        'Test Title',
        'Test Body',
        { key: 'value' },
        'high'
      );

      expect(result.success).toBe(true);
      expect(mockMessaging.send).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'fcm-token-abc',
          notification: {
            title: 'Test Title',
            body: 'Test Body',
          },
        })
      );
    });

    it('should handle invalid token error', async () => {
      const error = new Error('Invalid token');
      (error as any).code = 'messaging/invalid-registration-token';
      mockMessaging.send.mockRejectedValueOnce(error);

      const result = await service.sendToToken(mockToken, 'Title', 'Body');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or unregistered token');
    });

    it('should handle unregistered token error', async () => {
      const error = new Error('Token not registered');
      (error as any).code = 'messaging/registration-token-not-registered';
      mockMessaging.send.mockRejectedValueOnce(error);

      const result = await service.sendToToken(mockToken, 'Title', 'Body');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or unregistered token');
    });

    it('should handle generic error', async () => {
      mockMessaging.send.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.sendToToken(mockToken, 'Title', 'Body');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should return error if FCM not configured', async () => {
      (fcmConfig.isFCMConfigured as jest.Mock).mockReturnValue(false);

      const result = await service.sendToToken(mockToken, 'Title', 'Body');

      expect(result.success).toBe(false);
      expect(result.error).toBe('FCM not configured');
    });

    it('should include data payload in message', async () => {
      mockMessaging.send.mockResolvedValueOnce('message-id');

      await service.sendToToken(
        mockToken,
        'Title',
        'Body',
        { visit_id: 'visit-123', client_name: 'John Doe' }
      );

      expect(mockMessaging.send).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            visit_id: 'visit-123',
            client_name: 'John Doe',
          },
        })
      );
    });

    it('should configure iOS-specific settings', async () => {
      const iosToken = { ...mockToken, platform: 'ios' as const };
      mockMessaging.send.mockResolvedValueOnce('message-id');

      await service.sendToToken(iosToken, 'Title', 'Body', {}, 'high');

      expect(mockMessaging.send).toHaveBeenCalledWith(
        expect.objectContaining({
          apns: expect.objectContaining({
            payload: expect.objectContaining({
              aps: expect.objectContaining({
                sound: 'default',
                badge: 1,
              }),
            }),
          }),
        })
      );
    });

    it('should configure Android-specific settings', async () => {
      const androidToken = { ...mockToken, platform: 'android' as const };
      mockMessaging.send.mockResolvedValueOnce('message-id');

      await service.sendToToken(androidToken, 'Title', 'Body', {}, 'high');

      expect(mockMessaging.send).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            priority: 'high',
            notification: expect.objectContaining({
              sound: 'default',
              channelId: 'berthcare_notifications',
            }),
          }),
        })
      );
    });
  });

  describe('sendToMultipleTokens', () => {
    const mockTokens = [
      {
        id: 'token-1',
        user_id: 'user-123',
        device_id: 'device-1',
        fcm_token: 'fcm-token-1',
        platform: 'ios' as const,
        app_version: '1.0.0',
        is_active: true,
        last_used_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'token-2',
        user_id: 'user-123',
        device_id: 'device-2',
        fcm_token: 'fcm-token-2',
        platform: 'android' as const,
        app_version: '1.0.0',
        is_active: true,
        last_used_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    it('should send to multiple tokens successfully', async () => {
      mockMessaging.sendEach.mockResolvedValueOnce({
        successCount: 2,
        failureCount: 0,
        responses: [
          { success: true },
          { success: true },
        ],
      });

      const result = await service.sendToMultipleTokens(
        mockTokens,
        'Title',
        'Body'
      );

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.invalidTokens).toEqual([]);
    });

    it('should identify invalid tokens', async () => {
      const error1 = new Error('Invalid token');
      (error1 as any).code = 'messaging/invalid-registration-token';

      mockMessaging.sendEach.mockResolvedValueOnce({
        successCount: 1,
        failureCount: 1,
        responses: [
          { success: true },
          { success: false, error: error1 },
        ],
      });

      const result = await service.sendToMultipleTokens(
        mockTokens,
        'Title',
        'Body'
      );

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.invalidTokens).toContain('fcm-token-2');
    });

    it('should return zeros if FCM not configured', async () => {
      (fcmConfig.isFCMConfigured as jest.Mock).mockReturnValue(false);

      const result = await service.sendToMultipleTokens(mockTokens, 'Title', 'Body');

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(2);
      expect(result.invalidTokens).toEqual([]);
    });

    it('should handle empty token array', async () => {
      const result = await service.sendToMultipleTokens([], 'Title', 'Body');

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
      expect(result.invalidTokens).toEqual([]);
    });

    it('should handle sendEach error', async () => {
      mockMessaging.sendEach.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.sendToMultipleTokens(mockTokens, 'Title', 'Body');

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(2);
    });
  });

  describe('sendToTopic', () => {
    it('should send topic notification successfully', async () => {
      mockMessaging.send.mockResolvedValueOnce('message-id');

      const result = await service.sendToTopic('team-alerts', 'Title', 'Body');

      expect(result.success).toBe(true);
      expect(mockMessaging.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'team-alerts',
          notification: {
            title: 'Title',
            body: 'Body',
          },
        })
      );
    });

    it('should handle topic send error', async () => {
      mockMessaging.send.mockRejectedValueOnce(new Error('Topic error'));

      const result = await service.sendToTopic('team-alerts', 'Title', 'Body');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Topic error');
    });
  });
});
