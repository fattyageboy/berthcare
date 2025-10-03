/**
 * Auth Service Unit Tests
 * Tests for authentication service (login, refresh, validate)
 */

import bcrypt from 'bcrypt';
import {
  login,
  refreshAccessToken,
  validateAccessToken,
} from '../../../src/services/user/auth.service';
import * as auth0Service from '../../../src/services/user/auth0.service';
import * as deviceService from '../../../src/services/user/device.service';
import * as jwtUtils from '../../../src/shared/utils/jwt.utils';
import { database } from '../../../src/config';
import { User, LoginRequest, RefreshTokenRequest } from '../../../src/shared/types';

// Mock dependencies
jest.mock('../../../src/config');
jest.mock('../../../src/services/user/auth0.service');
jest.mock('../../../src/services/user/device.service');
jest.mock('../../../src/shared/utils/jwt.utils');
jest.mock('bcrypt');

describe('Auth Service', () => {
  let mockClient: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock database client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    (database.getClient as jest.Mock).mockResolvedValue(mockClient);
  });

  describe('login', () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'nurse@example.com',
      phone: null,
      first_name: 'Jane',
      last_name: 'Doe',
      role: 'nurse',
      organization_id: 'org-123',
      status: 'active',
      password_hash: '$2b$10$hashedpassword',
      last_login_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const loginRequest: LoginRequest = {
      email: 'nurse@example.com',
      password: 'password123',
      device_id: 'device-abc-123',
      device_type: 'ios',
    };

    it('should successfully login with valid credentials (local auth)', async () => {
      // Mock Auth0 not configured
      (auth0Service.isAuth0Configured as jest.Mock).mockReturnValue(false);

      // Mock database query for user
      mockClient.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // getUserByEmail
        .mockResolvedValueOnce({ rows: [] }); // updateLastLogin

      // Mock password verification
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Mock token generation
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token-123');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token-123');

      // Mock device token storage
      (deviceService.storeDeviceToken as jest.Mock).mockResolvedValue({});

      const result = await login(loginRequest);

      expect(result).toEqual({
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          first_name: mockUser.first_name,
          last_name: mockUser.last_name,
          role: mockUser.role,
          organization_id: mockUser.organization_id,
        },
        expires_in: 3600,
      });

      // Verify password was checked
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password_hash);

      // Verify tokens were generated
      expect(jwtUtils.generateAccessToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        organizationId: mockUser.organization_id,
        deviceId: loginRequest.device_id,
      });

      // Verify device token was stored
      expect(deviceService.storeDeviceToken).toHaveBeenCalledWith(
        mockUser.id,
        loginRequest.device_id,
        loginRequest.device_type,
        'refresh-token-123'
      );

      // Verify client was released
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should successfully login with Auth0 when configured', async () => {
      // Mock Auth0 configured
      (auth0Service.isAuth0Configured as jest.Mock).mockReturnValue(true);
      (auth0Service.verifyCredentials as jest.Mock).mockResolvedValue({
        auth0UserId: 'auth0|123',
        email: loginRequest.email,
      });

      // Mock database query for user
      mockClient.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // getUserByEmail
        .mockResolvedValueOnce({ rows: [] }); // updateLastLogin

      // Mock token generation
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token-123');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token-123');

      // Mock device token storage
      (deviceService.storeDeviceToken as jest.Mock).mockResolvedValue({});

      const result = await login(loginRequest);

      expect(result.access_token).toBe('access-token-123');
      expect(auth0Service.verifyCredentials).toHaveBeenCalledWith(
        loginRequest.email,
        loginRequest.password
      );

      // bcrypt should not be called when using Auth0
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error when required fields are missing', async () => {
      const invalidRequest = {
        email: 'test@example.com',
        password: '',
        device_id: 'device-123',
        device_type: 'ios' as const,
      };

      await expect(login(invalidRequest)).rejects.toThrow('Missing required fields');
    });

    it('should throw error when user not found', async () => {
      (auth0Service.isAuth0Configured as jest.Mock).mockReturnValue(false);

      // Mock database returning no user
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(login(loginRequest)).rejects.toThrow('Invalid email or password');

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error when password is invalid', async () => {
      (auth0Service.isAuth0Configured as jest.Mock).mockReturnValue(false);

      // Mock database query for user
      mockClient.query.mockResolvedValueOnce({ rows: [mockUser] });

      // Mock password verification failure
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(login(loginRequest)).rejects.toThrow('Invalid email or password');

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error when user has no password hash (Auth0 only)', async () => {
      (auth0Service.isAuth0Configured as jest.Mock).mockReturnValue(false);

      const userWithoutPassword = { ...mockUser, password_hash: null };
      mockClient.query.mockResolvedValueOnce({ rows: [userWithoutPassword] });

      await expect(login(loginRequest)).rejects.toThrow(
        'User account is not configured for local authentication'
      );
    });

    it('should throw error when Auth0 credentials are invalid', async () => {
      (auth0Service.isAuth0Configured as jest.Mock).mockReturnValue(true);
      (auth0Service.verifyCredentials as jest.Mock).mockRejectedValue(
        new Error('Invalid email or password')
      );

      await expect(login(loginRequest)).rejects.toThrow('Invalid email or password');
    });

    it('should throw error when user not found in local database after Auth0 verification', async () => {
      (auth0Service.isAuth0Configured as jest.Mock).mockReturnValue(true);
      (auth0Service.verifyCredentials as jest.Mock).mockResolvedValue({
        auth0UserId: 'auth0|123',
        email: loginRequest.email,
      });

      // Mock database returning no user
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(login(loginRequest)).rejects.toThrow('Authentication failed');
    });
  });

  describe('refreshAccessToken', () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'nurse@example.com',
      phone: null,
      first_name: 'Jane',
      last_name: 'Doe',
      role: 'nurse',
      organization_id: 'org-123',
      status: 'active',
      password_hash: '$2b$10$hashedpassword',
      last_login_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const refreshRequest: RefreshTokenRequest = {
      refresh_token: 'old-refresh-token',
      device_id: 'device-abc-123',
    };

    const mockTokenPayload = {
      userId: 'user-123',
      email: 'nurse@example.com',
      role: 'nurse',
      organizationId: 'org-123',
      deviceId: 'device-abc-123',
      type: 'refresh' as const,
    };

    it('should successfully refresh access token', async () => {
      // Mock token verification
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockTokenPayload);

      // Mock device token verification
      (deviceService.verifyDeviceToken as jest.Mock).mockResolvedValue(true);

      // Mock database query for user
      mockClient.query.mockResolvedValueOnce({ rows: [mockUser] });

      // Mock new token generation
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('new-access-token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('new-refresh-token');

      // Mock device token update
      (deviceService.storeDeviceToken as jest.Mock).mockResolvedValue({});
      (deviceService.updateDeviceTokenUsage as jest.Mock).mockResolvedValue(undefined);

      const result = await refreshAccessToken(refreshRequest);

      expect(result).toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          first_name: mockUser.first_name,
          last_name: mockUser.last_name,
          role: mockUser.role,
          organization_id: mockUser.organization_id,
        },
        expires_in: 3600,
      });

      // Verify token was verified
      expect(jwtUtils.verifyToken).toHaveBeenCalledWith(refreshRequest.refresh_token);

      // Verify device binding was checked
      expect(deviceService.verifyDeviceToken).toHaveBeenCalledWith(
        mockTokenPayload.userId,
        refreshRequest.device_id,
        refreshRequest.refresh_token
      );

      // Verify new tokens were stored
      expect(deviceService.storeDeviceToken).toHaveBeenCalled();
      expect(deviceService.updateDeviceTokenUsage).toHaveBeenCalledWith(
        mockUser.id,
        refreshRequest.device_id
      );
    });

    it('should throw error when required fields are missing', async () => {
      const invalidRequest = {
        refresh_token: '',
        device_id: 'device-123',
      };

      await expect(refreshAccessToken(invalidRequest)).rejects.toThrow('Missing required fields');
    });

    it('should throw error when refresh token is invalid', async () => {
      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(refreshAccessToken(refreshRequest)).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should throw error when token type is not refresh', async () => {
      const accessTokenPayload = { ...mockTokenPayload, type: 'access' as const };
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(accessTokenPayload);

      await expect(refreshAccessToken(refreshRequest)).rejects.toThrow('Invalid token type');
    });

    it('should throw error when device binding is invalid', async () => {
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockTokenPayload);
      (deviceService.verifyDeviceToken as jest.Mock).mockResolvedValue(false);

      await expect(refreshAccessToken(refreshRequest)).rejects.toThrow(
        'Invalid device binding or token'
      );
    });

    it('should throw error when device ID does not match', async () => {
      const mismatchPayload = { ...mockTokenPayload, deviceId: 'different-device' };
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mismatchPayload);
      (deviceService.verifyDeviceToken as jest.Mock).mockResolvedValue(true);

      await expect(refreshAccessToken(refreshRequest)).rejects.toThrow('Device ID mismatch');
    });

    it('should throw error when user not found', async () => {
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockTokenPayload);
      (deviceService.verifyDeviceToken as jest.Mock).mockResolvedValue(true);

      // Mock database returning no user
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(refreshAccessToken(refreshRequest)).rejects.toThrow('User not found');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('validateAccessToken', () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'nurse@example.com',
      phone: null,
      first_name: 'Jane',
      last_name: 'Doe',
      role: 'nurse',
      organization_id: 'org-123',
      status: 'active',
      password_hash: '$2b$10$hashedpassword',
      last_login_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockTokenPayload = {
      userId: 'user-123',
      email: 'nurse@example.com',
      role: 'nurse',
      organizationId: 'org-123',
      deviceId: 'device-abc-123',
      type: 'access' as const,
    };

    it('should return user info for valid access token', async () => {
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockTokenPayload);
      mockClient.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await validateAccessToken('valid-access-token');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        first_name: mockUser.first_name,
        last_name: mockUser.last_name,
        role: mockUser.role,
        organization_id: mockUser.organization_id,
      });

      expect(jwtUtils.verifyToken).toHaveBeenCalledWith('valid-access-token');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return null for invalid token', async () => {
      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await validateAccessToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for refresh token (wrong type)', async () => {
      const refreshTokenPayload = { ...mockTokenPayload, type: 'refresh' as const };
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(refreshTokenPayload);

      const result = await validateAccessToken('refresh-token');

      expect(result).toBeNull();
    });

    it('should return null when user not found', async () => {
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockTokenPayload);
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const result = await validateAccessToken('valid-token');

      expect(result).toBeNull();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
