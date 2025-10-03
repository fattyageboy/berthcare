/**
 * Notification Repository Unit Tests
 * Tests for notification database operations
 */

import { Pool } from 'pg';
import { NotificationRepository } from '../../../src/services/notification/repository';

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

describe('NotificationRepository', () => {
  let repository: NotificationRepository;
  let mockPool: Pool;

  beforeEach(() => {
    mockPool = new Pool();
    repository = new NotificationRepository(mockPool);
    jest.clearAllMocks();
    mockQuery.mockClear();
  });

  describe('registerToken', () => {
    it('should register a new device token', async () => {
      const tokenData = {
        device_id: 'device-123',
        fcm_token: 'fcm-token-abc',
        platform: 'ios' as const,
        app_version: '1.0.0',
      };

      const mockResult = {
        rows: [
          {
            id: 'token-uuid',
            user_id: 'user-123',
            ...tokenData,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await repository.registerToken('user-123', tokenData);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO push_notification_tokens'),
        expect.arrayContaining(['user-123', 'device-123', 'fcm-token-abc', 'ios', '1.0.0'])
      );
    });
  });

  describe('getActiveTokensByUserId', () => {
    it('should return active tokens for user', async () => {
      const mockTokens = [
        { id: 'token-1', fcm_token: 'fcm-1', platform: 'ios', is_active: true },
        { id: 'token-2', fcm_token: 'fcm-2', platform: 'android', is_active: true },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockTokens });

      const result = await repository.getActiveTokensByUserId('user-123');

      expect(result).toEqual(mockTokens);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND is_active = true'),
        ['user-123']
      );
    });
  });

  describe('createNotification', () => {
    it('should create a notification record', async () => {
      const notification = {
        user_id: 'user-123',
        type: 'visit_reminder' as const,
        title: 'Visit Reminder',
        body: 'Your visit starts in 30 minutes',
        data: { visit_id: 'visit-123' },
        priority: 'high' as const,
        status: 'pending' as const,
      };

      const mockResult = {
        rows: [
          {
            id: 'notif-uuid',
            ...notification,
            created_at: new Date(),
          },
        ],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await repository.createNotification(notification);

      expect(result.id).toBe('notif-uuid');
      expect(result.type).toBe('visit_reminder');
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('updateNotificationStatus', () => {
    it('should update notification status to sent', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      await repository.updateNotificationStatus('notif-123', 'sent');

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('UPDATE notifications'), [
        'sent',
        null,
        'notif-123',
      ]);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '5' }] });

      const result = await repository.getUnreadCount('user-123');

      expect(result).toBe(5);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("status != 'read'"), [
        'user-123',
      ]);
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const mockPrefs = {
        id: 'pref-uuid',
        user_id: 'user-123',
        visit_reminders_enabled: true,
        team_alerts_enabled: true,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockPrefs] });

      const result = await repository.getPreferences('user-123');

      expect(result).toEqual(mockPrefs);
    });

    it('should return null if no preferences exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await repository.getPreferences('user-123');

      expect(result).toBeNull();
    });
  });

  describe('deactivateTokenByFCM', () => {
    it('should deactivate token by FCM token string', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      await repository.deactivateTokenByFCM('fcm-token-abc');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE push_notification_tokens'),
        ['fcm-token-abc']
      );
    });
  });

  describe('updateTokenLastUsed', () => {
    it('should update last used timestamp', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      await repository.updateTokenLastUsed('token-123');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE push_notification_tokens'),
        ['token-123']
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      await repository.markAsRead('notif-123');

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('UPDATE notifications'), [
        'notif-123',
      ]);
    });
  });

  describe('getNotificationsByUserId', () => {
    it('should return paginated notifications', async () => {
      const mockNotifications = [
        { id: 'notif-1', title: 'Test 1' },
        { id: 'notif-2', title: 'Test 2' },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockNotifications });

      const result = await repository.getNotificationsByUserId('user-123', 20, 10);

      expect(result).toEqual(mockNotifications);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('LIMIT $2 OFFSET $3'), [
        'user-123',
        20,
        10,
      ]);
    });
  });

  describe('upsertPreferences', () => {
    it('should create new preferences', async () => {
      const preferences = {
        visit_reminders_enabled: false,
        team_alerts_enabled: true,
        sync_updates_enabled: false,
        family_updates_enabled: true,
        quiet_hours_start: '23:00',
        quiet_hours_end: '07:00',
      };

      const mockResult = {
        rows: [
          {
            id: 'pref-uuid',
            user_id: 'user-123',
            ...preferences,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await repository.upsertPreferences('user-123', preferences);

      expect(result.quiet_hours_start).toBe('23:00');
      expect(result.visit_reminders_enabled).toBe(false);
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('deleteOldNotifications', () => {
    it('should delete old read notifications', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 25 });

      const result = await repository.deleteOldNotifications(90);

      expect(result).toBe(25);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INTERVAL '90 days'"));
    });

    it('should use default 90 days if not specified', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 10 });

      const result = await repository.deleteOldNotifications();

      expect(result).toBe(10);
    });
  });
});
