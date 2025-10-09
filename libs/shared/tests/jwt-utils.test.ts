/**
 * JWT Utilities Test Suite
 * 
 * Tests JWT token generation, verification, and key rotation support.
 */

import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  JWTPayload,
} from '../src/jwt-utils';
import { generateKeyPairSync } from 'crypto';

// Generate test RSA key pair for testing
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

// Set test keys in environment
process.env.JWT_PRIVATE_KEY = privateKey;
process.env.JWT_PUBLIC_KEY = publicKey;

const mockPayload: JWTPayload = {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  email: 'nurse@example.com',
  role: 'nurse',
  zoneId: 'zone-123',
};

describe('JWT Utilities', () => {
  describe('generateAccessToken()', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include all payload fields in token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(decoded?.role).toBe(mockPayload.role);
      expect(decoded?.zoneId).toBe(mockPayload.zoneId);
    });

    it('should generate different tokens for same payload', (done) => {
      const token1 = generateAccessToken(mockPayload);

      // Wait 1 second to ensure different iat timestamp
      setTimeout(() => {
        const token2 = generateAccessToken(mockPayload);

        // Tokens should be different due to different iat (issued at) timestamps
        expect(token1).not.toBe(token2);
        done();
      }, 1000);
    });

    it('should throw error if private key is not set', () => {
      const originalKey = process.env.JWT_PRIVATE_KEY;
      delete process.env.JWT_PRIVATE_KEY;

      expect(() => generateAccessToken(mockPayload)).toThrow('JWT_PRIVATE_KEY');

      process.env.JWT_PRIVATE_KEY = originalKey;
    });

    it('should support all user roles', () => {
      const roles: Array<'nurse' | 'coordinator' | 'admin' | 'family'> = [
        'nurse',
        'coordinator',
        'admin',
        'family',
      ];

      roles.forEach((role) => {
        const payload = { ...mockPayload, role };
        const token = generateAccessToken(payload);
        const decoded = decodeToken(token);

        expect(decoded?.role).toBe(role);
      });
    });
  });

  describe('generateRefreshToken()', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include all payload fields in refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(decoded?.role).toBe(mockPayload.role);
      expect(decoded?.zoneId).toBe(mockPayload.zoneId);
    });

    it('should have longer expiry than access token', () => {
      const accessToken = generateAccessToken(mockPayload);
      const refreshToken = generateRefreshToken(mockPayload);

      const accessDecoded = decodeToken(accessToken);
      const refreshDecoded = decodeToken(refreshToken);

      expect(refreshDecoded?.exp).toBeGreaterThan(accessDecoded?.exp || 0);
    });
  });

  describe('verifyToken()', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.zoneId).toBe(mockPayload.zoneId);
    });

    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockPayload.userId);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow('Invalid token');
    });

    it('should throw error for token with wrong signature', () => {
      // Generate token with different key
      const { privateKey: wrongKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      const originalKey = process.env.JWT_PRIVATE_KEY;
      process.env.JWT_PRIVATE_KEY = wrongKey;

      const token = generateAccessToken(mockPayload);

      process.env.JWT_PRIVATE_KEY = originalKey;

      expect(() => verifyToken(token)).toThrow();
    });

    it('should throw error if public key is not set', () => {
      const token = generateAccessToken(mockPayload);
      const originalKey = process.env.JWT_PUBLIC_KEY;
      delete process.env.JWT_PUBLIC_KEY;

      expect(() => verifyToken(token)).toThrow('JWT_PUBLIC_KEY');

      process.env.JWT_PUBLIC_KEY = originalKey;
    });

    it('should throw specific error for expired token', (done) => {
      // Create a token that expires immediately
      const originalKey = process.env.JWT_PRIVATE_KEY;
      process.env.JWT_PRIVATE_KEY = privateKey;

      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(mockPayload, privateKey, {
        expiresIn: '1ms',
        algorithm: 'RS256',
        issuer: 'berthcare-api',
        audience: 'berthcare-mobile',
      });

      // Wait for token to expire
      setTimeout(() => {
        expect(() => verifyToken(expiredToken)).toThrow('expired');
        process.env.JWT_PRIVATE_KEY = originalKey;
        done();
      }, 10);
    });
  });

  describe('decodeToken()', () => {
    it('should decode token without verification', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
    });

    it('should include exp and iat fields', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded?.exp).toBeDefined();
      expect(decoded?.iat).toBeDefined();
      expect(typeof decoded?.exp).toBe('number');
      expect(typeof decoded?.iat).toBe('number');
    });

    it('should return null for invalid token format', () => {
      const decoded = decodeToken('not.a.valid.token.format');
      expect(decoded).toBeNull();
    });

    it('should decode token even with wrong signature', () => {
      const token = generateAccessToken(mockPayload);
      // Tamper with signature
      const parts = token.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.invalidsignature`;

      const decoded = decodeToken(tamperedToken);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
    });
  });

  describe('isTokenExpired()', () => {
    it('should return false for valid token', () => {
      const token = generateAccessToken(mockPayload);
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const jwt = require('jsonwebtoken');
      // Create a token that expired 1 hour ago
      const expiredToken = jwt.sign(
        { ...mockPayload, exp: Math.floor(Date.now() / 1000) - 3600 },
        privateKey,
        {
          algorithm: 'RS256',
          issuer: 'berthcare-api',
          audience: 'berthcare-mobile',
        }
      );

      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid.token')).toBe(true);
    });

    it('should return true for token without exp field', () => {
      const jwt = require('jsonwebtoken');
      const noExpToken = jwt.sign(mockPayload, privateKey, {
        algorithm: 'RS256',
        issuer: 'berthcare-api',
        audience: 'berthcare-mobile',
        noTimestamp: true,
      });

      expect(isTokenExpired(noExpToken)).toBe(true);
    });
  });

  describe('Token expiry times', () => {
    it('access token should expire in approximately 1 hour', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);

      const now = Math.floor(Date.now() / 1000);
      const expiryTime = decoded?.exp || 0;
      const timeUntilExpiry = expiryTime - now;

      // Should be approximately 1 hour (3600 seconds), allow 10 second variance
      expect(timeUntilExpiry).toBeGreaterThan(3590);
      expect(timeUntilExpiry).toBeLessThan(3610);
    });

    it('refresh token should expire in approximately 30 days', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = decodeToken(token);

      const now = Math.floor(Date.now() / 1000);
      const expiryTime = decoded?.exp || 0;
      const timeUntilExpiry = expiryTime - now;

      // Should be approximately 30 days (2592000 seconds), allow 60 second variance
      expect(timeUntilExpiry).toBeGreaterThan(2591940);
      expect(timeUntilExpiry).toBeLessThan(2592060);
    });
  });

  describe('Integration tests', () => {
    it('should complete full authentication flow', () => {
      // 1. Generate tokens
      const accessToken = generateAccessToken(mockPayload);
      const refreshToken = generateRefreshToken(mockPayload);

      // 2. Verify access token
      const accessDecoded = verifyToken(accessToken);
      expect(accessDecoded.userId).toBe(mockPayload.userId);

      // 3. Verify refresh token
      const refreshDecoded = verifyToken(refreshToken);
      expect(refreshDecoded.userId).toBe(mockPayload.userId);

      // 4. Check expiry
      expect(isTokenExpired(accessToken)).toBe(false);
      expect(isTokenExpired(refreshToken)).toBe(false);
    });

    it('should handle multiple users with different roles', () => {
      const users = [
        { ...mockPayload, userId: 'user-1', role: 'nurse' as const },
        { ...mockPayload, userId: 'user-2', role: 'coordinator' as const },
        { ...mockPayload, userId: 'user-3', role: 'admin' as const },
      ];

      users.forEach((user) => {
        const token = generateAccessToken(user);
        const decoded = verifyToken(token);

        expect(decoded.userId).toBe(user.userId);
        expect(decoded.role).toBe(user.role);
      });
    });
  });
});
