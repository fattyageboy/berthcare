/**
 * Authentication Routes
 *
 * Handles user authentication endpoints:
 * - POST /v1/auth/register - User registration (Task A4)
 * - POST /v1/auth/login - User login (Task A5)
 * - POST /v1/auth/refresh - Token refresh (Task A6)
 * - POST /v1/auth/logout - User logout (Task A9)
 *
 * Task A4: Implement POST /v1/auth/register endpoint
 * Task A5: Implement POST /v1/auth/login endpoint
 * Task A6: Implement POST /v1/auth/refresh endpoint
 * Task A9: Implement POST /v1/auth/logout endpoint
 *
 * Reference: project-documentation/task-plan.md - Phase A – Authentication & Authorization
 * Reference: Architecture Blueprint - Authentication Endpoints
 *
 * Philosophy: "Uncompromising Security"
 * - Input validation on all endpoints
 * - Rate limiting to prevent abuse
 * - Secure password hashing
 * - JWT token generation
 * - Multiple layers of token validation
 */

import * as crypto from 'crypto';

import { Request, Response, Router } from 'express';
import { Pool } from 'pg';

import {
  decodeToken,
  generateAccessToken,
  generateRefreshToken,
  DEFAULT_DEVICE_ID,
  hashPassword,
  verifyPassword,
  verifyToken,
  type JWTPayload,
} from '@berthcare/shared';

import { RedisClient } from '../cache/redis-client';
import { logAuth, logError } from '../config/logger';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { createLoginRateLimiter, createRegistrationRateLimiter } from '../middleware/rate-limiter';
import {
  validateLogin,
  validateRefreshToken,
  validateRegistration,
} from '../middleware/validation';

export function createAuthRoutes(pgPool: Pool, redisClient: RedisClient): Router {
  const router = Router();

  /**
   * POST /v1/auth/register
   *
   * Register a new user account
   *
   * Request Body:
   * - email: string (required, valid email format)
   * - password: string (required, min 8 chars, 1 uppercase, 1 number)
   * - firstName: string (required)
   * - lastName: string (required)
   * - role: 'caregiver' | 'coordinator' | 'admin' (required)
   * - zoneId: string (required for non-admin roles)
   * - deviceId: string (required for token generation)
   *
   * Response (201):
   * - accessToken: JWT access token (1 hour expiry)
   * - refreshToken: JWT refresh token (30 days expiry)
   * - user: User profile information
   *
   * Errors:
   * - 400: Validation error
   * - 409: Email already exists
   * - 429: Rate limit exceeded (5 attempts per hour per IP)
   * - 500: Server error
   *
   * Security:
   * - Rate limiting: 5 attempts per hour per IP
   * - Password hashing: bcrypt with cost factor 12
   * - Input validation: email format, password strength
   * - Admin-only registration for MVP (enforced by business logic)
   */
  router.post(
    '/register',
    createRegistrationRateLimiter(redisClient),
    authenticateJWT(redisClient),
    requireRole(['admin']),
    validateRegistration,
    async (req: Request, res: Response) => {
      const client = await pgPool.connect();

      try {
        const { email, password, firstName, lastName, role, zoneId, deviceId } = req.body;
        const normalizedDeviceId = (deviceId ?? '').trim() || DEFAULT_DEVICE_ID;

        // Check if email already exists
        const existingUser = await client.query(
          'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
          [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
          res.status(409).json({
            error: {
              code: 'EMAIL_EXISTS',
              message: 'An account with this email already exists',
              details: { field: 'email' },
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          });
          return;
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Insert user into database
        const insertResult = await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, zone_id, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true)
           RETURNING id, email, first_name, last_name, role, zone_id, created_at`,
          [email.toLowerCase(), passwordHash, firstName, lastName, role, zoneId || null]
        );

        const user = insertResult.rows[0];

        // Generate JWT tokens
        const accessToken = generateAccessToken({
          userId: user.id,
          role: user.role,
          zoneId: user.zone_id,
          deviceId: normalizedDeviceId,
          email: user.email,
        });

        const refreshToken = generateRefreshToken({
          userId: user.id,
          role: user.role,
          zoneId: user.zone_id,
          deviceId: normalizedDeviceId,
        });

        // Store refresh token in database
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await client.query(
          `INSERT INTO refresh_tokens (user_id, token_hash, device_id, expires_at)
           VALUES ($1, $2, $3, $4)`,
          [user.id, tokenHash, normalizedDeviceId, expiresAt]
        );

        // Log successful registration
        logAuth('register', user.id, {
          email: user.email,
          role: user.role,
          deviceId: normalizedDeviceId,
        });

        // Return success response
        res.status(201).json({
          data: {
            accessToken,
            refreshToken,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              role: user.role,
              zoneId: user.zone_id,
            },
          },
        });
      } catch (error) {
        logError('Registration error', error instanceof Error ? error : new Error(String(error)), {
          email: req.body.email,
          role: req.body.role,
        });
        res.status(500).json({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred during registration',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      } finally {
        client.release();
      }
    }
  );

  /**
   * POST /v1/auth/refresh
   *
   * Refresh access token using valid refresh token
   *
   * Request Body:
   * - refreshToken: string (required, valid JWT refresh token)
   *
   * Response (200):
   * - accessToken: New JWT access token (1 hour expiry)
   *
   * Errors:
   * - 400: Validation error (missing or invalid token format)
   * - 401: Invalid or expired refresh token
   * - 401: Token not found in database
   * - 401: Token has been revoked
   * - 500: Server error
   *
   * Security:
   * - Token verification: JWT signature validation
   * - Database validation: Token hash must exist and not be revoked
   * - Expiry check: Token must not be expired
   * - User validation: User must exist and be active
   *
   * Philosophy: "Uncompromising Security"
   * - Multiple layers of validation
   * - Clear error messages without leaking security details
   * - Audit trail for token refresh attempts
   */
  router.post('/refresh', validateRefreshToken, async (req: Request, res: Response) => {
    const client = await pgPool.connect();

    try {
      const { refreshToken } = req.body;

      // Verify JWT signature and decode payload
      let refreshPayload: JWTPayload;
      try {
        refreshPayload = verifyToken(refreshToken);
      } catch (error) {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired refresh token',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      // Hash the refresh token to compare with database
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Check if token exists in database and is not revoked
      const tokenResult = await client.query(
        `SELECT id, user_id, device_id, expires_at, revoked_at 
         FROM refresh_tokens 
         WHERE token_hash = $1`,
        [tokenHash]
      );

      if (tokenResult.rows.length === 0) {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired refresh token',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      const tokenRecord = tokenResult.rows[0];

      // Check if token has been revoked
      if (tokenRecord.revoked_at) {
        res.status(401).json({
          error: {
            code: 'TOKEN_REVOKED',
            message: 'Refresh token has been revoked',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      // Check if token has expired
      const now = new Date();
      const expiresAt = new Date(tokenRecord.expires_at);
      if (now > expiresAt) {
        res.status(401).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Refresh token has expired',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      const tokenDeviceId = (tokenRecord.device_id as string | null) ?? DEFAULT_DEVICE_ID;
      const payloadDeviceId = (refreshPayload.deviceId ?? DEFAULT_DEVICE_ID).trim();

      if (payloadDeviceId !== tokenDeviceId) {
        res.status(401).json({
          error: {
            code: 'DEVICE_MISMATCH',
            message: 'Refresh token device does not match active session',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      // Fetch user information
      const userResult = await client.query(
        'SELECT id, email, role, zone_id, is_active FROM users WHERE id = $1 AND deleted_at IS NULL',
        [tokenRecord.user_id]
      );

      if (userResult.rows.length === 0) {
        res.status(401).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User account not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      const user = userResult.rows[0];

      // Check if user account is active
      if (!user.is_active) {
        res.status(401).json({
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'User account has been disabled',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: user.id,
        role: user.role,
        zoneId: user.zone_id,
        deviceId: tokenDeviceId,
        email: user.email,
      });

      // Rotate refresh token to prevent reuse of compromised tokens
      let newRefreshToken: string | null = null;
      try {
        await client.query('BEGIN');

        newRefreshToken = generateRefreshToken({
          userId: user.id,
          role: user.role,
          zoneId: user.zone_id,
          deviceId: tokenDeviceId,
        });

        const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
        const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await client.query(
          `INSERT INTO refresh_tokens (user_id, token_hash, device_id, expires_at)
           VALUES ($1, $2, $3, $4)`,
          [user.id, newTokenHash, tokenDeviceId, newExpiresAt]
        );

        await client.query(
          `UPDATE refresh_tokens
           SET revoked_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND revoked_at IS NULL`,
          [tokenRecord.id]
        );

        await client.query('COMMIT');
      } catch (transactionError) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          logError(
            'Token refresh rollback error',
            rollbackError instanceof Error ? rollbackError : new Error(String(rollbackError))
          );
        }
        throw transactionError;
      }

      // Log successful token refresh
      logAuth('refresh', user.id, { deviceId: tokenDeviceId });

      // Return new tokens
      if (!newRefreshToken) {
        throw new Error('Refresh token rotation failed: token was not generated');
      }
      res.status(200).json({
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      logError('Token refresh error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during token refresh',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    } finally {
      client.release();
    }
  });

  /**
   * POST /v1/auth/login
   *
   * Authenticate user and issue JWT tokens
   *
   * Request Body:
   * - email: string (required, valid email format)
   * - password: string (required)
   * - deviceId: string (required for token generation)
   *
   * Response (200):
   * - accessToken: JWT access token (1 hour expiry)
   * - refreshToken: JWT refresh token (30 days expiry)
   * - user: User profile information
   *
   * Errors:
   * - 400: Validation error
   * - 401: Invalid credentials
   * - 429: Rate limit exceeded (10 attempts per 15 minutes per IP)
   * - 500: Server error
   *
   * Security:
   * - Rate limiting: 10 attempts per 15 minutes per IP
   * - Password verification: bcrypt constant-time comparison
   * - Input validation: email format
   * - Refresh token hashing: SHA-256 before storage
   */
  router.post(
    '/login',
    createLoginRateLimiter(redisClient),
    validateLogin,
    async (req: Request, res: Response) => {
      const client = await pgPool.connect();

      try {
        const { email, password, deviceId } = req.body;
        const normalizedDeviceId = (deviceId ?? '').trim() || DEFAULT_DEVICE_ID;

        // Find user by email
        const userResult = await client.query(
          'SELECT id, email, password_hash, first_name, last_name, role, zone_id, is_active FROM users WHERE email = $1 AND deleted_at IS NULL',
          [email.toLowerCase()]
        );

        // Check if user exists
        if (userResult.rows.length === 0) {
          res.status(401).json({
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          });
          return;
        }

        const user = userResult.rows[0];

        // Check if account is active
        if (!user.is_active) {
          res.status(401).json({
            error: {
              code: 'ACCOUNT_DISABLED',
              message: 'This account has been disabled',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          });
          return;
        }

        // Verify password
        const isPasswordValid = await verifyPassword(password, user.password_hash);

        if (!isPasswordValid) {
          res.status(401).json({
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          });
          return;
        }

        // Generate JWT tokens
        const accessToken = generateAccessToken({
          userId: user.id,
          role: user.role,
          zoneId: user.zone_id,
          deviceId: normalizedDeviceId,
          email: user.email,
        });

        const refreshToken = generateRefreshToken({
          userId: user.id,
          role: user.role,
          zoneId: user.zone_id,
          deviceId: normalizedDeviceId,
        });

        // Store refresh token in database
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await client.query(
          `INSERT INTO refresh_tokens (user_id, token_hash, device_id, expires_at)
           VALUES ($1, $2, $3, $4)`,
          [user.id, tokenHash, normalizedDeviceId, expiresAt]
        );

        // Log successful login
        logAuth('login', user.id, {
          email: user.email,
          deviceId: normalizedDeviceId,
        });

        // Return success response
        res.status(200).json({
          data: {
            accessToken,
            refreshToken,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              role: user.role,
              zoneId: user.zone_id,
            },
          },
        });
      } catch (error) {
        logError('Login error', error instanceof Error ? error : new Error(String(error)), {
          email: req.body.email,
        });
        res.status(500).json({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred during login',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      } finally {
        client.release();
      }
    }
  );

  /**
   * POST /v1/auth/logout
   *
   * Logout user by invalidating both access and refresh tokens
   *
   * Request Headers:
   * - Authorization: Bearer <access_token>
   *
   * Response (200):
   * - message: Success message
   *
   * Errors:
   * - 401: Missing or invalid token
   * - 500: Server error
   *
   * Security:
   * - Blacklists access token in Redis (prevents reuse)
   * - Revokes refresh tokens in database (prevents token refresh)
   * - Token expiry matches original token expiry (1 hour)
   *
   * Philosophy: "Uncompromising Security"
   * - Immediate token revocation (both access and refresh)
   * - No grace period for logged out tokens
   * - Clear audit trail via revoked_at timestamp
   *
   * Reference: Task A9 - Implement POST /v1/auth/logout endpoint
   */
  router.post('/logout', async (req: Request, res: Response) => {
    const client = await pgPool.connect();

    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({
          error: {
            code: 'MISSING_TOKEN',
            message: 'Authorization header is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/);
      if (!bearerMatch) {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN_FORMAT',
            message: 'Authorization header must be in format: Bearer <token>',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      const token = bearerMatch[1].trim();
      if (!token) {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN_FORMAT',
            message: 'Authorization header must be in format: Bearer <token>',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      const decodedToken = decodeToken(token);

      // Attempt to verify token to obtain user context (required to revoke refresh tokens)
      let userId: string | null = null;
      try {
        const decoded = verifyToken(token);
        userId = decoded.userId ?? null;
      } catch (error) {
        if (
          decodedToken?.userId &&
          error instanceof Error &&
          error.message === 'Token has expired'
        ) {
          userId = decodedToken.userId ?? null;
        }
      }

      // Determine TTL based on token expiry (default to 1 hour)
      let blacklistTtlSeconds = 3600;
      if (decodedToken?.exp) {
        const nowSeconds = Math.floor(Date.now() / 1000);
        const secondsUntilExpiry = decodedToken.exp - nowSeconds;
        if (Number.isFinite(secondsUntilExpiry) && secondsUntilExpiry > 0) {
          blacklistTtlSeconds = Math.ceil(secondsUntilExpiry);
        } else {
          blacklistTtlSeconds = 1;
        }
      }

      // Blacklist the access token in Redis (TTL matches remaining lifetime)
      const blacklistKey = `token:blacklist:${token}`;
      await redisClient.setEx(blacklistKey, blacklistTtlSeconds, '1');

      // Revoke all active refresh tokens for this user in database
      if (userId) {
        await client.query(
          `UPDATE refresh_tokens
           SET revoked_at = CURRENT_TIMESTAMP
           WHERE user_id = $1
             AND revoked_at IS NULL
             AND expires_at > CURRENT_TIMESTAMP`,
          [userId]
        );
      }

      // Log successful logout
      if (userId) {
        logAuth('logout', userId);
      }

      // Return success response
      res.status(200).json({
        data: {
          message: 'Logged out successfully',
        },
      });
    } catch (error) {
      logError('Logout error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during logout',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    } finally {
      client.release();
    }
  });

  return router;
}
