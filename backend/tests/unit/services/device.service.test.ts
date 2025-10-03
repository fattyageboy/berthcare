/**
 * Device Service Unit Tests
 * Tests for device token management and binding
 */

import bcrypt from 'bcrypt';
import {
  storeDeviceToken,
  verifyDeviceToken,
  updateDeviceTokenUsage,
  deleteDeviceToken,
  deleteAllDeviceTokens,
  cleanupExpiredTokens,
  getUserDevices,
} from '../../../src/services/user/device.service';
import { database } from '../../../src/config';
import { DeviceToken } from '../../../src/shared/types';

// Mock dependencies
jest.mock('../../../src/config');
jest.mock('bcrypt');

describe('Device Service', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock database client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    (database.getClient as jest.Mock).mockResolvedValue(mockClient);
  });

  describe('storeDeviceToken', () => {
    const userId = 'user-123';
    const deviceId = 'device-abc-123';
    const deviceType = 'ios';
    const refreshToken = 'refresh-token-123';

    const mockDeviceToken: DeviceToken = {
      id: 'token-123',
      user_id: userId,
      device_id: deviceId,
      device_type: deviceType,
      refresh_token_hash: '$2b$10$hashedtoken',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      last_used_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should store new device token', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedtoken');

      // Mock no existing token
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing
        .mockResolvedValueOnce({ rows: [mockDeviceToken] }); // Insert

      const result = await storeDeviceToken(userId, deviceId, deviceType, refreshToken);

      expect(result).toEqual(mockDeviceToken);
      expect(bcrypt.hash).toHaveBeenCalledWith(refreshToken, 10);
      expect(mockClient.query).toHaveBeenCalledTimes(2);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should update existing device token', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedtoken');

      // Mock existing token
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'token-123' }] }) // Check existing
        .mockResolvedValueOnce({ rows: [mockDeviceToken] }); // Update

      const result = await storeDeviceToken(userId, deviceId, deviceType, refreshToken);

      expect(result).toEqual(mockDeviceToken);
      expect(bcrypt.hash).toHaveBeenCalledWith(refreshToken, 10);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should set expiration to 30 days from now', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedtoken');

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockDeviceToken] });

      await storeDeviceToken(userId, deviceId, deviceType, refreshToken);

      // Check that the expiration date was calculated correctly
      const insertCall = mockClient.query.mock.calls[1];
      const expiresAt = insertCall[1][4];
      const expectedExpiry = new Date();
      expectedExpiry.setDate(expectedExpiry.getDate() + 30);

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
    });

    it('should release client even on error', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedtoken');
      mockClient.query.mockRejectedValue(new Error('Database error'));

      await expect(storeDeviceToken(userId, deviceId, deviceType, refreshToken)).rejects.toThrow(
        'Database error'
      );

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('verifyDeviceToken', () => {
    const userId = 'user-123';
    const deviceId = 'device-abc-123';
    const refreshToken = 'refresh-token-123';

    it('should return true for valid device token', async () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            refresh_token_hash: '$2b$10$hashedtoken',
            expires_at: futureDate,
          },
        ],
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await verifyDeviceToken(userId, deviceId, refreshToken);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(refreshToken, '$2b$10$hashedtoken');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return false when device token not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const result = await verifyDeviceToken(userId, deviceId, refreshToken);

      expect(result).toBe(false);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return false when token is expired', async () => {
      const pastDate = new Date(Date.now() - 1000);

      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            refresh_token_hash: '$2b$10$hashedtoken',
            expires_at: pastDate,
          },
        ],
      });

      const result = await verifyDeviceToken(userId, deviceId, refreshToken);

      expect(result).toBe(false);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return false when token hash does not match', async () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            refresh_token_hash: '$2b$10$hashedtoken',
            expires_at: futureDate,
          },
        ],
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await verifyDeviceToken(userId, deviceId, refreshToken);

      expect(result).toBe(false);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release client even on error', async () => {
      mockClient.query.mockRejectedValue(new Error('Database error'));

      await expect(verifyDeviceToken(userId, deviceId, refreshToken)).rejects.toThrow(
        'Database error'
      );

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('updateDeviceTokenUsage', () => {
    it('should update last used timestamp', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await updateDeviceTokenUsage('user-123', 'device-abc-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE device_tokens'),
        ['user-123', 'device-abc-123']
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release client even on error', async () => {
      mockClient.query.mockRejectedValue(new Error('Database error'));

      await expect(updateDeviceTokenUsage('user-123', 'device-abc-123')).rejects.toThrow(
        'Database error'
      );

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('deleteDeviceToken', () => {
    it('should delete device token', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await deleteDeviceToken('user-123', 'device-abc-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM device_tokens WHERE user_id = $1 AND device_id = $2',
        ['user-123', 'device-abc-123']
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release client even on error', async () => {
      mockClient.query.mockRejectedValue(new Error('Database error'));

      await expect(deleteDeviceToken('user-123', 'device-abc-123')).rejects.toThrow(
        'Database error'
      );

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('deleteAllDeviceTokens', () => {
    it('should delete all device tokens for user', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await deleteAllDeviceTokens('user-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM device_tokens WHERE user_id = $1',
        ['user-123']
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release client even on error', async () => {
      mockClient.query.mockRejectedValue(new Error('Database error'));

      await expect(deleteAllDeviceTokens('user-123')).rejects.toThrow('Database error');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens and return count', async () => {
      mockClient.query.mockResolvedValueOnce({ rowCount: 5 });

      const result = await cleanupExpiredTokens();

      expect(result).toBe(5);
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM device_tokens WHERE expires_at < NOW()'
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return 0 when no tokens deleted', async () => {
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 });

      const result = await cleanupExpiredTokens();

      expect(result).toBe(0);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return 0 when rowCount is null', async () => {
      mockClient.query.mockResolvedValueOnce({ rowCount: null });

      const result = await cleanupExpiredTokens();

      expect(result).toBe(0);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release client even on error', async () => {
      mockClient.query.mockRejectedValue(new Error('Database error'));

      await expect(cleanupExpiredTokens()).rejects.toThrow('Database error');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getUserDevices', () => {
    const mockDevices: DeviceToken[] = [
      {
        id: 'token-1',
        user_id: 'user-123',
        device_id: 'device-1',
        device_type: 'ios',
        refresh_token_hash: '$2b$10$hash1',
        expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        last_used_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'token-2',
        user_id: 'user-123',
        device_id: 'device-2',
        device_type: 'android',
        refresh_token_hash: '$2b$10$hash2',
        expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        last_used_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    it('should return all active devices for user', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: mockDevices });

      const result = await getUserDevices('user-123');

      expect(result).toEqual(mockDevices);
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('FROM device_tokens'), [
        'user-123',
      ]);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return empty array when no devices found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const result = await getUserDevices('user-123');

      expect(result).toEqual([]);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should only return non-expired devices', async () => {
      // The query should filter out expired devices using WHERE expires_at > NOW()
      mockClient.query.mockResolvedValueOnce({ rows: [mockDevices[0]] });

      const result = await getUserDevices('user-123');

      expect(result).toHaveLength(1);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release client even on error', async () => {
      mockClient.query.mockRejectedValue(new Error('Database error'));

      await expect(getUserDevices('user-123')).rejects.toThrow('Database error');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
