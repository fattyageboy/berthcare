/**
 * JWT Authentication Middleware Tests
 *
 * Tests for JWT authentication middleware functionality:
 * - Token verification
 * - Token expiration handling
 * - Token blacklist (logout)
 * - Role-based authorization
 * - Error handling
 *
 * Reference: Task A7 - JWT authentication middleware
 */

import { Response } from 'express';
import { createClient, RedisClientType } from 'redis';

import { generateAccessToken } from '../../../libs/shared/src';
import {
  authenticateJWT,
  requireRole,
  blacklistToken,
  AuthenticatedRequest,
} from '../src/middleware/auth';

describe('JWT Authentication Middleware', () => {
  let redisClient: RedisClientType;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeAll(async () => {
    // Connect to Redis
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    await redisClient.connect();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await redisClient.quit();
  });

  beforeEach(async () => {
    // Clear Redis test data
    const keys = await redisClient.keys('token:blacklist:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }

    // Reset mocks
    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    nextFunction = jest.fn();
  });

  describe('authenticateJWT', () => {
    it('should reject request without Authorization header', async () => {
      const middleware = authenticateJWT(redisClient);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'MISSING_TOKEN',
            message: 'Authorization header is required',
          }),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid Authorization header format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };

      const middleware = authenticateJWT(redisClient);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_TOKEN_FORMAT',
            message: 'Authorization header must be in format: Bearer <token>',
          }),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid JWT token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.jwt.token',
      };

      const middleware = authenticateJWT(redisClient);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_TOKEN',
            message: 'Invalid access token',
          }),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should accept request with valid JWT token', async () => {
      // Generate valid token
      const token = generateAccessToken({
        userId: 'user_123',
        role: 'caregiver',
        zoneId: 'zone_456',
        email: 'test@example.com',
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const middleware = authenticateJWT(redisClient);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual({
        userId: 'user_123',
        role: 'caregiver',
        zoneId: 'zone_456',
        email: 'test@example.com',
      });
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject blacklisted token', async () => {
      // Generate valid token
      const token = generateAccessToken({
        userId: 'user_123',
        role: 'caregiver',
        zoneId: 'zone_456',
      });

      // Blacklist the token
      await blacklistToken(redisClient, token);

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const middleware = authenticateJWT(redisClient);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'TOKEN_REVOKED',
            message: 'Access token has been revoked',
          }),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should attach user information to request', async () => {
      const token = generateAccessToken({
        userId: 'user_789',
        role: 'coordinator',
        zoneId: 'zone_abc',
        email: 'coordinator@example.com',
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const middleware = authenticateJWT(redisClient);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe('user_789');
      expect(mockRequest.user?.role).toBe('coordinator');
      expect(mockRequest.user?.zoneId).toBe('zone_abc');
      expect(mockRequest.user?.email).toBe('coordinator@example.com');
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      // Set up authenticated user
      mockRequest.user = {
        userId: 'user_123',
        role: 'caregiver',
        zoneId: 'zone_456',
        email: 'test@example.com',
      };
    });

    it('should allow access for authorized role', () => {
      const middleware = requireRole(['caregiver', 'coordinator']);
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', () => {
      const middleware = requireRole(['admin']);
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
            details: {
              requiredRoles: ['admin'],
              userRole: 'caregiver',
            },
          }),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should deny access if user not authenticated', () => {
      mockRequest.user = undefined;

      const middleware = requireRole(['caregiver']);
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          }),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should allow access for multiple authorized roles', () => {
      mockRequest.user = {
        userId: 'user_456',
        role: 'coordinator',
        zoneId: 'zone_789',
      };

      const middleware = requireRole(['coordinator', 'admin']);
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('blacklistToken', () => {
    it('should add token to blacklist', async () => {
      const token = 'test.jwt.token';
      await blacklistToken(redisClient, token, 60);

      const blacklistKey = `token:blacklist:${token}`;
      const exists = await redisClient.exists(blacklistKey);

      expect(exists).toBe(1);
    });

    it('should set expiry on blacklisted token', async () => {
      const token = 'test.jwt.token.expiry';
      await blacklistToken(redisClient, token, 10);

      const blacklistKey = `token:blacklist:${token}`;
      const ttl = await redisClient.ttl(blacklistKey);

      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(10);
    });

    it('should use default expiry if not specified', async () => {
      const token = 'test.jwt.token.default';
      await blacklistToken(redisClient, token);

      const blacklistKey = `token:blacklist:${token}`;
      const ttl = await redisClient.ttl(blacklistKey);

      // Default expiry is 3600 seconds (1 hour)
      expect(ttl).toBeGreaterThan(3500);
      expect(ttl).toBeLessThanOrEqual(3600);
    });
  });

  describe('Integration: Full authentication flow', () => {
    it('should authenticate, authorize, and logout user', async () => {
      // Step 1: Generate token
      const token = generateAccessToken({
        userId: 'user_integration',
        role: 'coordinator',
        zoneId: 'zone_integration',
        email: 'integration@example.com',
      });

      // Step 2: Authenticate with valid token
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const authMiddleware = authenticateJWT(redisClient);
      await authMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user?.userId).toBe('user_integration');

      // Step 3: Check role authorization
      nextFunction.mockClear();
      const roleMiddleware = requireRole(['coordinator', 'admin']);
      roleMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();

      // Step 4: Blacklist token (logout)
      await blacklistToken(redisClient, token);

      // Step 5: Try to use blacklisted token
      nextFunction.mockClear();
      mockResponse.status = jest.fn().mockReturnThis();
      mockResponse.json = jest.fn().mockReturnThis();

      await authMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'TOKEN_REVOKED',
          }),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
