/**
 * JWT Utils Unit Tests
 * Tests for JWT token generation, verification, and expiry handling
 */

import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  getTokenExpiration,
  isTokenExpired,
} from '../../../src/shared/utils/jwt.utils';
import { config } from '../../../src/config';
import { TokenPayload } from '../../../src/shared/types';

// Mock config
jest.mock('../../../src/config', () => ({
  config: {
    security: {
      jwtSecret: 'test-secret-key',
    },
  },
}));

describe('JWT Utils', () => {
  const mockPayload = {
    userId: 'user-123',
    email: 'nurse@example.com',
    role: 'nurse',
    organizationId: 'org-123',
    deviceId: 'device-abc-123',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token contains correct payload
      const decoded = jwt.verify(token, config.security.jwtSecret) as TokenPayload;

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.organizationId).toBe(mockPayload.organizationId);
      expect(decoded.deviceId).toBe(mockPayload.deviceId);
      expect(decoded.type).toBe('access');
    });

    it('should set correct issuer and audience', () => {
      const token = generateAccessToken(mockPayload);

      const decoded = jwt.verify(token, config.security.jwtSecret) as jwt.JwtPayload;

      expect(decoded.iss).toBe('berthcare-auth');
      expect(decoded.aud).toBe('berthcare-api');
    });

    it('should set expiration to 1 hour', () => {
      const token = generateAccessToken(mockPayload);

      const decoded = jwt.verify(token, config.security.jwtSecret) as jwt.JwtPayload;

      // Check expiration is approximately 1 hour from now
      const expiresAt = decoded.exp! * 1000;
      const expectedExpiry = Date.now() + 60 * 60 * 1000;

      // Allow 5 second tolerance
      expect(Math.abs(expiresAt - expectedExpiry)).toBeLessThan(5000);
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateAccessToken(mockPayload);
      const token2 = generateAccessToken({ ...mockPayload, userId: 'user-456' });

      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token contains correct payload
      const decoded = jwt.verify(token, config.security.jwtSecret) as TokenPayload;

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.organizationId).toBe(mockPayload.organizationId);
      expect(decoded.deviceId).toBe(mockPayload.deviceId);
      expect(decoded.type).toBe('refresh');
    });

    it('should set correct issuer and audience', () => {
      const token = generateRefreshToken(mockPayload);

      const decoded = jwt.verify(token, config.security.jwtSecret) as jwt.JwtPayload;

      expect(decoded.iss).toBe('berthcare-auth');
      expect(decoded.aud).toBe('berthcare-api');
    });

    it('should set expiration to 30 days', () => {
      const token = generateRefreshToken(mockPayload);

      const decoded = jwt.verify(token, config.security.jwtSecret) as jwt.JwtPayload;

      // Check expiration is approximately 30 days from now
      const expiresAt = decoded.exp! * 1000;
      const expectedExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;

      // Allow 5 second tolerance
      expect(Math.abs(expiresAt - expectedExpiry)).toBeLessThan(5000);
    });

    it('should generate different tokens from access tokens', () => {
      const accessToken = generateAccessToken(mockPayload);
      const refreshToken = generateRefreshToken(mockPayload);

      expect(accessToken).not.toBe(refreshToken);

      const accessDecoded = jwt.verify(accessToken, config.security.jwtSecret) as TokenPayload;
      const refreshDecoded = jwt.verify(refreshToken, config.security.jwtSecret) as TokenPayload;

      expect(accessDecoded.type).toBe('access');
      expect(refreshDecoded.type).toBe('refresh');
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateAccessToken(mockPayload);

      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.organizationId).toBe(mockPayload.organizationId);
      expect(decoded.deviceId).toBe(mockPayload.deviceId);
      expect(decoded.type).toBe('access');
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      // Create expired token
      const expiredToken = jwt.sign({ ...mockPayload, type: 'access' }, config.security.jwtSecret, {
        expiresIn: '-1h', // Already expired
        issuer: 'berthcare-auth',
        audience: 'berthcare-api',
      });

      expect(() => verifyToken(expiredToken)).toThrow('Token has expired');
    });

    it('should throw error for token with wrong secret', () => {
      const token = jwt.sign({ ...mockPayload, type: 'access' }, 'wrong-secret', {
        expiresIn: '1h',
        issuer: 'berthcare-auth',
        audience: 'berthcare-api',
      });

      expect(() => verifyToken(token)).toThrow('Invalid token');
    });

    it('should throw error for token with wrong issuer', () => {
      const token = jwt.sign({ ...mockPayload, type: 'access' }, config.security.jwtSecret, {
        expiresIn: '1h',
        issuer: 'wrong-issuer',
        audience: 'berthcare-api',
      });

      expect(() => verifyToken(token)).toThrow('Invalid token');
    });

    it('should throw error for token with wrong audience', () => {
      const token = jwt.sign({ ...mockPayload, type: 'access' }, config.security.jwtSecret, {
        expiresIn: '1h',
        issuer: 'berthcare-auth',
        audience: 'wrong-audience',
      });

      expect(() => verifyToken(token)).toThrow('Invalid token');
    });

    it('should verify refresh tokens', () => {
      const refreshToken = generateRefreshToken(mockPayload);

      const decoded = verifyToken(refreshToken);

      expect(decoded.type).toBe('refresh');
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration date for valid token', () => {
      const token = generateAccessToken(mockPayload);

      const expiration = getTokenExpiration(token);

      expect(expiration).toBeInstanceOf(Date);
      expect(expiration!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      const expiration = getTokenExpiration(invalidToken);

      expect(expiration).toBeNull();
    });

    it('should return expiration for expired token', () => {
      const expiredToken = jwt.sign({ ...mockPayload, type: 'access' }, config.security.jwtSecret, {
        expiresIn: '-1h',
        issuer: 'berthcare-auth',
        audience: 'berthcare-api',
      });

      const expiration = getTokenExpiration(expiredToken);

      expect(expiration).toBeInstanceOf(Date);
      expect(expiration!.getTime()).toBeLessThan(Date.now());
    });

    it('should return null for token without expiration', () => {
      const tokenWithoutExp = jwt.sign(
        { ...mockPayload, type: 'access' },
        config.security.jwtSecret,
        {
          issuer: 'berthcare-auth',
          audience: 'berthcare-api',
          // No expiresIn
        }
      );

      const expiration = getTokenExpiration(tokenWithoutExp);

      expect(expiration).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid unexpired token', () => {
      const token = generateAccessToken(mockPayload);

      const expired = isTokenExpired(token);

      expect(expired).toBe(false);
    });

    it('should return true for expired token', () => {
      const expiredToken = jwt.sign({ ...mockPayload, type: 'access' }, config.security.jwtSecret, {
        expiresIn: '-1h',
        issuer: 'berthcare-auth',
        audience: 'berthcare-api',
      });

      const expired = isTokenExpired(expiredToken);

      expect(expired).toBe(true);
    });

    it('should return true for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      const expired = isTokenExpired(invalidToken);

      expect(expired).toBe(true);
    });

    it('should return true for token without expiration', () => {
      const tokenWithoutExp = jwt.sign(
        { ...mockPayload, type: 'access' },
        config.security.jwtSecret,
        {
          issuer: 'berthcare-auth',
          audience: 'berthcare-api',
        }
      );

      const expired = isTokenExpired(tokenWithoutExp);

      expect(expired).toBe(true);
    });

    it('should return false for token about to expire', () => {
      const almostExpiredToken = jwt.sign(
        { ...mockPayload, type: 'access' },
        config.security.jwtSecret,
        {
          expiresIn: '1s', // 1 second
          issuer: 'berthcare-auth',
          audience: 'berthcare-api',
        }
      );

      const expired = isTokenExpired(almostExpiredToken);

      expect(expired).toBe(false);
    });
  });
});
