/**
 * Auth Middleware Unit Tests
 * Tests for authentication middleware (authenticate, optionalAuth)
 */

import { Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuth } from '../../../src/shared/middleware/auth';
import * as jwtUtils from '../../../src/shared/utils/jwt.utils';
import * as authService from '../../../src/services/user/auth.service';
import { AuthenticatedRequest, UserInfo, TokenPayload } from '../../../src/shared/types';

// Mock dependencies
jest.mock('../../../src/shared/utils/jwt.utils');
jest.mock('../../../src/services/user/auth.service');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock response
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    const mockUser: UserInfo = {
      id: 'user-123',
      email: 'nurse@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
      role: 'nurse',
      organization_id: 'org-123',
    };

    const mockTokenPayload: TokenPayload = {
      userId: 'user-123',
      email: 'nurse@example.com',
      role: 'nurse',
      organizationId: 'org-123',
      deviceId: 'device-abc-123',
      type: 'access',
    };

    it('should authenticate valid bearer token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token-123',
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockTokenPayload);
      (authService.validateAccessToken as jest.Mock).mockResolvedValue(mockUser);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwtUtils.verifyToken).toHaveBeenCalledWith('valid-token-123');
      expect(authService.validateAccessToken).toHaveBeenCalledWith('valid-token-123');
      expect((mockRequest as AuthenticatedRequest).user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should reject request with no authorization header', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'No authorization token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization header format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid authorization header format. Use: Bearer <token>',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with only Bearer keyword', async () => {
      mockRequest.headers = {
        authorization: 'Bearer',
      };

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid authorization header format. Use: Bearer <token>',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token has expired');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Token has expired',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject refresh token (wrong type)', async () => {
      mockRequest.headers = {
        authorization: 'Bearer refresh-token',
      };

      const refreshTokenPayload = { ...mockTokenPayload, type: 'refresh' as const };
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(refreshTokenPayload);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token type. Access token required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject when user not found', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockTokenPayload);
      (authService.validateAccessToken as jest.Mock).mockResolvedValue(null);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token or user not found',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle internal server error', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Should return 401 for invalid token, not 500
      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });

  describe('optionalAuth', () => {
    const mockUser: UserInfo = {
      id: 'user-123',
      email: 'nurse@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
      role: 'nurse',
      organization_id: 'org-123',
    };

    const mockTokenPayload: TokenPayload = {
      userId: 'user-123',
      email: 'nurse@example.com',
      role: 'nurse',
      organizationId: 'org-123',
      deviceId: 'device-abc-123',
      type: 'access',
    };

    it('should attach user for valid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockTokenPayload);
      (authService.validateAccessToken as jest.Mock).mockResolvedValue(mockUser);

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as AuthenticatedRequest).user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should continue without user when no auth header', async () => {
      mockRequest.headers = {};

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as AuthenticatedRequest).user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should continue without user for invalid header format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as AuthenticatedRequest).user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should continue without user for invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as AuthenticatedRequest).user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should continue without user for expired token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token has expired');
      });

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as AuthenticatedRequest).user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should continue without user for refresh token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer refresh-token',
      };

      const refreshTokenPayload = { ...mockTokenPayload, type: 'refresh' as const };
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(refreshTokenPayload);

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as AuthenticatedRequest).user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when user not found', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockTokenPayload);
      (authService.validateAccessToken as jest.Mock).mockResolvedValue(null);

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as AuthenticatedRequest).user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue even on unexpected error', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as AuthenticatedRequest).user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
