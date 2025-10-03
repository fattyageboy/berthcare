/**
 * Notification Service Unit Tests
 * Tests for notification business logic
 */

import { Pool } from 'pg';
import { NotificationService } from '../../../src/services/notification/service';
import { NotificationRepository } from '../../../src/services/notification/repository';
import { FCMService } from '../../../src/services/notification/fcm.service';

// Mock dependencies
jest.mock('../../../src/services/notification/repository');
jest.mock('../../../src/services/notification/fcm.service');
jest.mock('../../../src/shared/utils/logger');

describe('NotificationService', () => {
  let service: NotificationService;
  let mockRepository: jest.Mocked<NotificationRepository>;
  let mockFCMService: jest.Mocked<FCMService>;
  let mockPool: Pool;

  beforeEach(() => {
    mockPool = {} as Pool;
    service = new NotificationService(mockPool);

    // Get mocked instances
    mockRepository = (service as any).repository;
    mockFCMService = (service as any).fcmService;

    jest.clearAllMocks();
  });

  describe('registerDeviceToken', () => {
    it('should register device token successfully', async () => {
      const tokenData = {
        device_id: 'device-123',
        fcm_token: 'fcm-token-abc',
        platform: 'ios' as const,
        app_version: '1.0.0',
      };

      const mockToken = {
        id: 'token-uuid',
        user_id: 'user-123',
        ...tokenData,
        is_active: true,
        last_used_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.registerToken.mockResolvedValueOnce(mockToken);

      const result = await service.registerDeviceToken('user-123', tokenData);

      expect(result).toEqual(mockToken);
      expect(mockRepository.registerToken).toHaveBeenCalledWith('user-123', tokenData);
    });

    it('should throw error on registration failure', async () => {
      mockRepository.registerToken.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.registerDeviceToken('user-123', {
          device_id: 'device-123',
          fcm_token: 'token',
          platform: 'ios',
        })
      ).rejects.toThrow('Failed to register device token');
    });
  });

  describe('sendNotification', () => {
    const mockRequest = {
      user_id: 'user-123',
      type: 'visit_reminder' as const,
      title: 'Visit Reminder',
      body: 'Your visit starts in 30 minutes',
      data: { visit_id: 'visit-123' },
      priority: 'high' as const,
    };

    const mockTokens = [
      {
        id: 'token-1',
        user_id: 'user-123',
        device_id: 'device-1',
        fcm_token: 'fcm-1',
        platform: 'ios' as const,
        app_version: '1.0.0',
        is_active: true,
        last_used_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const mockNotification = {
      id: 'notif-uuid',
      ...mockRequest,
      status: 'pending' as const,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should send notification successfully', async () => {
      mockRepository.getPreferences.mockResolvedValueOnce({
        id: 'pref-uuid',
        user_id: 'user-123',
        visit_reminders_enabled: true,
        team_alerts_enabled: true,
        sync_updates_enabled: true,
        family_updates_enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      mockRepository.createNotification.mockResolvedValueOnce(mockNotification);
      mockRepository.getActiveTokensByUserId.mockResolvedValueOnce(mockTokens);

      mockFCMService.sendToMultipleTokens.mockResolvedValueOnce({
        successCount: 1,
        failureCount: 0,
        invalidTokens: [],
      });

      const result = await service.sendNotification(mockRequest);

      expect(result.success).toBe(true);
      expect(result.tokens_sent).toBe(1);
      expect(result.tokens_failed).toBe(0);
      expect(mockRepository.updateNotificationStatus).toHaveBeenCalledWith('notif-uuid', 'sent');
    });

    it('should block notification if user preferences disabled', async () => {
      mockRepository.getPreferences.mockResolvedValueOnce({
        id: 'pref-uuid',
        user_id: 'user-123',
        visit_reminders_enabled: false, // Disabled
        team_alerts_enabled: true,
        sync_updates_enabled: true,
        family_updates_enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.sendNotification(mockRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Notification blocked by user preferences');
    });

    it('should handle no active tokens', async () => {
      mockRepository.getPreferences.mockResolvedValueOnce(null);
      mockRepository.createNotification.mockResolvedValueOnce(mockNotification);
      mockRepository.getActiveTokensByUserId.mockResolvedValueOnce([]);

      const result = await service.sendNotification(mockRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('No active device tokens');
      expect(mockRepository.updateNotificationStatus).toHaveBeenCalledWith(
        'notif-uuid',
        'failed',
        'No active device tokens'
      );
    });

    it('should deactivate invalid tokens', async () => {
      mockRepository.getPreferences.mockResolvedValueOnce(null);
      mockRepository.createNotification.mockResolvedValueOnce(mockNotification);
      mockRepository.getActiveTokensByUserId.mockResolvedValueOnce(mockTokens);

      mockFCMService.sendToMultipleTokens.mockResolvedValueOnce({
        successCount: 0,
        failureCount: 1,
        invalidTokens: ['fcm-1'],
      });

      await service.sendNotification(mockRequest);

      expect(mockRepository.deactivateTokenByFCM).toHaveBeenCalledWith('fcm-1');
    });

    it('should update token last used timestamp', async () => {
      mockRepository.getPreferences.mockResolvedValueOnce(null);
      mockRepository.createNotification.mockResolvedValueOnce(mockNotification);
      mockRepository.getActiveTokensByUserId.mockResolvedValueOnce(mockTokens);

      mockFCMService.sendToMultipleTokens.mockResolvedValueOnce({
        successCount: 1,
        failureCount: 0,
        invalidTokens: [],
      });

      await service.sendNotification(mockRequest);

      expect(mockRepository.updateTokenLastUsed).toHaveBeenCalledWith('token-1');
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [
        { id: 'notif-1', title: 'Test 1' },
        { id: 'notif-2', title: 'Test 2' },
      ];

      mockRepository.getNotificationsByUserId.mockResolvedValueOnce(mockNotifications as any);

      const result = await service.getUserNotifications('user-123', 10, 0);

      expect(result).toEqual(mockNotifications);
      expect(mockRepository.getNotificationsByUserId).toHaveBeenCalledWith('user-123', 10, 0);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockRepository.getUnreadCount.mockResolvedValueOnce(5);

      const result = await service.getUnreadCount('user-123');

      expect(result).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockRepository.markAsRead.mockResolvedValueOnce();

      await service.markAsRead('notif-123');

      expect(mockRepository.markAsRead).toHaveBeenCalledWith('notif-123');
    });
  });

  describe('getPreferences', () => {
    it('should return existing preferences', async () => {
      const mockPrefs = {
        id: 'pref-uuid',
        user_id: 'user-123',
        visit_reminders_enabled: true,
        team_alerts_enabled: true,
        sync_updates_enabled: true,
        family_updates_enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.getPreferences.mockResolvedValueOnce(mockPrefs);

      const result = await service.getPreferences('user-123');

      expect(result).toEqual(mockPrefs);
    });

    it('should create default preferences if none exist', async () => {
      mockRepository.getPreferences.mockResolvedValueOnce(null);

      const defaultPrefs = {
        id: 'pref-uuid',
        user_id: 'user-123',
        visit_reminders_enabled: true,
        team_alerts_enabled: true,
        sync_updates_enabled: true,
        family_updates_enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.upsertPreferences.mockResolvedValueOnce(defaultPrefs);

      const result = await service.getPreferences('user-123');

      expect(result).toEqual(defaultPrefs);
      expect(mockRepository.upsertPreferences).toHaveBeenCalledWith('user-123', {
        visit_reminders_enabled: true,
        team_alerts_enabled: true,
        sync_updates_enabled: true,
        family_updates_enabled: true,
      });
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences', async () => {
      const preferences = {
        visit_reminders_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      };

      const mockResult = {
        id: 'pref-uuid',
        user_id: 'user-123',
        ...preferences,
        team_alerts_enabled: true,
        sync_updates_enabled: true,
        family_updates_enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.upsertPreferences.mockResolvedValueOnce(mockResult);

      const result = await service.updatePreferences('user-123', preferences);

      expect(result).toEqual(mockResult);
    });
  });

  describe('quiet hours enforcement', () => {
    it('should block normal priority notifications during quiet hours', async () => {
      const now = new Date();
      now.setHours(23, 30); // 11:30 PM

      jest.spyOn(global, 'Date').mockImplementation(() => now as any);

      const mockPrefs = {
        id: 'pref-uuid',
        user_id: 'user-123',
        visit_reminders_enabled: true,
        team_alerts_enabled: true,
        sync_updates_enabled: true,
        family_updates_enabled: true,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.getPreferences.mockResolvedValueOnce(mockPrefs);

      const result = await service.sendNotification({
        user_id: 'user-123',
        type: 'sync_update',
        title: 'Sync Complete',
        body: 'Data synced',
        priority: 'normal',
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Notification blocked by user preferences');

      jest.restoreAllMocks();
    });

    it('should allow team alerts during quiet hours', async () => {
      const now = new Date();
      now.setHours(23, 30);

      jest.spyOn(global, 'Date').mockImplementation(() => now as any);

      const mockPrefs = {
        id: 'pref-uuid',
        user_id: 'user-123',
        visit_reminders_enabled: true,
        team_alerts_enabled: true,
        sync_updates_enabled: true,
        family_updates_enabled: true,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.getPreferences.mockResolvedValueOnce(mockPrefs);
      mockRepository.createNotification.mockResolvedValueOnce({
        id: 'notif-uuid',
        user_id: 'user-123',
        type: 'team_alert',
        title: 'Urgent Alert',
        body: 'Emergency',
        priority: 'high',
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      });
      mockRepository.getActiveTokensByUserId.mockResolvedValueOnce([]);

      await service.sendNotification({
        user_id: 'user-123',
        type: 'team_alert',
        title: 'Urgent Alert',
        body: 'Emergency',
        priority: 'high',
      });

      // Should not be blocked by quiet hours
      expect(mockRepository.createNotification).toHaveBeenCalled();

      jest.restoreAllMocks();
    });
  });

  describe('deactivateToken', () => {
    it('should deactivate a token', async () => {
      mockRepository.deactivateToken.mockResolvedValueOnce();

      await service.deactivateToken('token-123');

      expect(mockRepository.deactivateToken).toHaveBeenCalledWith('token-123');
    });
  });

  describe('cleanupOldNotifications', () => {
    it('should cleanup old notifications', async () => {
      mockRepository.deleteOldNotifications.mockResolvedValueOnce(25);

      const result = await service.cleanupOldNotifications(90);

      expect(result).toBe(25);
      expect(mockRepository.deleteOldNotifications).toHaveBeenCalledWith(90);
    });

    it('should use default days if not specified', async () => {
      mockRepository.deleteOldNotifications.mockResolvedValueOnce(10);

      const result = await service.cleanupOldNotifications();

      expect(result).toBe(10);
      expect(mockRepository.deleteOldNotifications).toHaveBeenCalledWith(90);
    });
  });

  describe('sendNotification error handling', () => {
    it('should handle repository error', async () => {
      mockRepository.getPreferences.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.sendNotification({
          user_id: 'user-123',
          type: 'visit_reminder',
          title: 'Test',
          body: 'Test',
        })
      ).rejects.toThrow('Failed to send notification');
    });

    it('should mark notification as failed when all tokens fail', async () => {
      const mockNotification = {
        id: 'notif-uuid',
        user_id: 'user-123',
        type: 'visit_reminder' as const,
        title: 'Test',
        body: 'Test',
        priority: 'normal' as const,
        status: 'pending' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.getPreferences.mockResolvedValueOnce(null);
      mockRepository.createNotification.mockResolvedValueOnce(mockNotification);
      mockRepository.getActiveTokensByUserId.mockResolvedValueOnce([
        {
          id: 'token-1',
          user_id: 'user-123',
          device_id: 'device-1',
          fcm_token: 'fcm-1',
          platform: 'ios' as const,
          app_version: '1.0.0',
          is_active: true,
          last_used_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      mockFCMService.sendToMultipleTokens.mockResolvedValueOnce({
        successCount: 0,
        failureCount: 1,
        invalidTokens: [],
      });

      const result = await service.sendNotification({
        user_id: 'user-123',
        type: 'visit_reminder',
        title: 'Test',
        body: 'Test',
      });

      expect(result.success).toBe(false);
      expect(mockRepository.updateNotificationStatus).toHaveBeenCalledWith(
        'notif-uuid',
        'failed',
        'All tokens failed'
      );
    });
  });

  describe('shouldSendNotification - quiet hours edge cases', () => {
    it('should send if no quiet hours configured', async () => {
      const mockPrefs = {
        id: 'pref-uuid',
        user_id: 'user-123',
        visit_reminders_enabled: true,
        team_alerts_enabled: true,
        sync_updates_enabled: true,
        family_updates_enabled: true,
        quiet_hours_start: undefined,
        quiet_hours_end: undefined,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.getPreferences.mockResolvedValueOnce(mockPrefs as any);
      mockRepository.createNotification.mockResolvedValueOnce({
        id: 'notif-uuid',
        user_id: 'user-123',
        type: 'sync_update',
        title: 'Test',
        body: 'Test',
        priority: 'normal',
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      });
      mockRepository.getActiveTokensByUserId.mockResolvedValueOnce([]);

      await service.sendNotification({
        user_id: 'user-123',
        type: 'sync_update',
        title: 'Test',
        body: 'Test',
      });

      expect(mockRepository.createNotification).toHaveBeenCalled();
    });
  });
});
