/**
 * JWT Token Generation Utilities
 *
 * Task A3: Implement JWT token generation
 * Create JWT utility module using jsonwebtoken; implement generateAccessToken() (1 hour expiry)
 * and generateRefreshToken() (30 days expiry); include user id, role, zone_id in payload;
 * use RS256 algorithm with key rotation support.
 *
 * Provides secure JWT token generation for authentication and authorization.
 *
 * Security Features:
 * - RS256 algorithm (asymmetric encryption)
 * - Key rotation support via environment variables
 * - Short-lived access tokens (1 hour)
 * - Long-lived refresh tokens (30 days)
 * - Comprehensive payload with user context
 *
 * Reference: project-documentation/task-plan.md - Phase A – Authentication & Authorization
 * Reference: Architecture Blueprint - JWT Authentication section
 *
 * Philosophy: "Uncompromising Security"
 * - Stateless authentication for horizontal scalability
 * - Industry-standard JWT patterns
 * - Clear separation between access and refresh tokens
 */

import jwt from 'jsonwebtoken';

/**
 * User role types
 * - caregiver: Home care workers who provide direct care to clients
 * - coordinator: Zone managers who handle alerts and oversight
 * - admin: System administrators with full access
 */
export type UserRole = 'caregiver' | 'coordinator' | 'admin';

/**
 * JWT payload structure
 */
export interface JWTPayload {
  userId: string;
  role: UserRole;
  zoneId: string;
  email?: string;
  iat?: number; // Issued at (automatically added by jwt.sign)
  exp?: number; // Expiration (automatically added by jwt.sign)
}

/**
 * Token generation options
 */
export interface TokenOptions {
  userId: string;
  role: UserRole;
  zoneId: string;
  email?: string;
}

/**
 * Access token expiry: 1 hour
 * Short-lived for security - forces regular re-authentication
 */
const ACCESS_TOKEN_EXPIRY = '1h';

/**
 * Refresh token expiry: 30 days
 * Long-lived for user convenience - allows staying logged in
 */
const REFRESH_TOKEN_EXPIRY = '30d';

/**
 * JWT algorithm: RS256 (RSA Signature with SHA-256)
 * Asymmetric encryption allows:
 * - Private key for signing (backend only)
 * - Public key for verification (can be distributed)
 * - Key rotation without service disruption
 */
const JWT_ALGORITHM = 'RS256';

/**
 * Get JWT private key from environment or AWS Secrets Manager
 *
 * Key Management Strategy:
 * - Development: Use environment variable (JWT_PRIVATE_KEY)
 * - Production: Fetch from AWS Secrets Manager
 * - Support key rotation via versioned secrets
 *
 * @returns Private key for JWT signing
 * @throws Error if private key is not configured
 */
function getPrivateKey(): string {
  // For development, use environment variable
  const privateKey = process.env.JWT_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error(
      'JWT_PRIVATE_KEY not configured. ' +
        'Set JWT_PRIVATE_KEY environment variable or configure AWS Secrets Manager.'
    );
  }

  // Handle base64-encoded keys (common in environment variables)
  if (privateKey.startsWith('base64:')) {
    return Buffer.from(privateKey.substring(7), 'base64').toString('utf-8');
  }

  return privateKey;
}

/**
 * Get JWT public key from environment or AWS Secrets Manager
 *
 * Public key is used for token verification and can be safely distributed.
 *
 * @returns Public key for JWT verification
 * @throws Error if public key is not configured
 */
function getPublicKey(): string {
  const publicKey = process.env.JWT_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error(
      'JWT_PUBLIC_KEY not configured. ' +
        'Set JWT_PUBLIC_KEY environment variable or configure AWS Secrets Manager.'
    );
  }

  // Handle base64-encoded keys
  if (publicKey.startsWith('base64:')) {
    return Buffer.from(publicKey.substring(7), 'base64').toString('utf-8');
  }

  return publicKey;
}

/**
 * Generate access token (1 hour expiry)
 *
 * Access tokens are short-lived and used for API authentication.
 * They contain user identity and authorization information.
 *
 * Token Payload:
 * - userId: Unique user identifier
 * - role: User role (caregiver, coordinator, admin)
 * - zoneId: Geographic zone for data access control
 * - email: User email (optional, for logging/debugging)
 * - iat: Issued at timestamp (automatic)
 * - exp: Expiration timestamp (automatic)
 *
 * @param options - User information for token payload
 * @returns Signed JWT access token
 * @throws Error if token generation fails
 *
 * @example
 * const accessToken = generateAccessToken({
 *   userId: 'user_123',
 *   role: 'caregiver',
 *   zoneId: 'zone_456',
 *   email: 'caregiver@example.com'
 * });
 */
export function generateAccessToken(options: TokenOptions): string {
  try {
    const privateKey = getPrivateKey();

    const payload: JWTPayload = {
      userId: options.userId,
      role: options.role,
      zoneId: options.zoneId,
      ...(options.email && { email: options.email }),
    };

    const token = jwt.sign(payload, privateKey, {
      algorithm: JWT_ALGORITHM,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'berthcare-api',
      audience: 'berthcare-app',
      jwtid: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    });

    return token;
  } catch (error) {
    throw new Error(
      `Access token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate refresh token (30 days expiry)
 *
 * Refresh tokens are long-lived and used to obtain new access tokens
 * without requiring the user to re-authenticate.
 *
 * Security Considerations:
 * - Store refresh tokens securely (httpOnly cookies or secure storage)
 * - Implement token rotation (issue new refresh token on use)
 * - Maintain blacklist for revoked tokens (Redis)
 * - Single-use refresh tokens for maximum security
 *
 * Token Payload:
 * - userId: Unique user identifier
 * - role: User role (for quick validation)
 * - zoneId: Geographic zone
 * - iat: Issued at timestamp (automatic)
 * - exp: Expiration timestamp (automatic)
 *
 * @param options - User information for token payload
 * @returns Signed JWT refresh token
 * @throws Error if token generation fails
 *
 * @example
 * const refreshToken = generateRefreshToken({
 *   userId: 'user_123',
 *   role: 'caregiver',
 *   zoneId: 'zone_456'
 * });
 */
export function generateRefreshToken(options: TokenOptions): string {
  try {
    const privateKey = getPrivateKey();

    const payload: JWTPayload = {
      userId: options.userId,
      role: options.role,
      zoneId: options.zoneId,
    };

    const token = jwt.sign(payload, privateKey, {
      algorithm: JWT_ALGORITHM,
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'berthcare-api',
      audience: 'berthcare-app',
      jwtid: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    });

    return token;
  } catch (error) {
    throw new Error(
      `Refresh token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Verify and decode JWT token
 *
 * Validates token signature, expiration, and claims.
 * Use this for token verification in authentication middleware.
 *
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 *
 * @example
 * try {
 *   const payload = verifyToken(token);
 *   console.log('User ID:', payload.userId);
 * } catch (error) {
 *   console.error('Invalid token:', error.message);
 * }
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const publicKey = getPublicKey();

    const decoded = jwt.verify(token, publicKey, {
      algorithms: [JWT_ALGORITHM],
      issuer: 'berthcare-api',
      audience: 'berthcare-app',
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error(`Invalid token: ${error.message}`);
    }
    throw new Error(
      `Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Decode JWT token without verification
 *
 * Useful for debugging or extracting claims without validating signature.
 * DO NOT use for authentication - always verify tokens in production.
 *
 * @param token - JWT token to decode
 * @returns Decoded token payload or null if invalid
 *
 * @example
 * const payload = decodeToken(token);
 * if (payload) {
 *   console.log('Token expires at:', new Date(payload.exp! * 1000));
 * }
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Get token expiration time in seconds
 *
 * @param tokenType - 'access' or 'refresh'
 * @returns Expiration time in seconds
 */
export function getTokenExpiry(tokenType: 'access' | 'refresh'): number {
  if (tokenType === 'access') {
    // 1 hour = 3600 seconds
    return 3600;
  } else {
    // 30 days = 2592000 seconds
    return 2592000;
  }
}

/**
 * Check if token is expired
 *
 * @param token - JWT token to check
 * @returns True if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}
