/**
 * JWT Token Generation and Verification Utilities
 * 
 * Provides secure JWT token generation and verification using RS256 algorithm.
 * Supports access tokens (1 hour expiry) and refresh tokens (30 days expiry).
 * 
 * Design Philosophy:
 * - Uncompromising security: RS256 asymmetric encryption with key rotation support
 * - Stateless authentication: No server-side session storage required
 * - Simple, predictable API: Generate and verify tokens with clear error handling
 * 
 * Reference: BerthCare Architecture Blueprint v2.0.0 - Authentication section
 */

import jwt, { SignOptions } from 'jsonwebtoken';

/**
 * JWT token payload structure
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'nurse' | 'coordinator' | 'admin' | 'family';
  zoneId: string;
}

/**
 * Access token expiry: 1 hour
 * Short-lived for security - if compromised, limited exposure window
 */
const ACCESS_TOKEN_EXPIRY = '1h';

/**
 * Refresh token expiry: 30 days
 * Long-lived for user convenience - stored securely in database
 */
const REFRESH_TOKEN_EXPIRY = '30d';

/**
 * JWT issuer - identifies who issued the token
 */
const JWT_ISSUER = 'berthcare-api';

/**
 * JWT audience - identifies who the token is intended for
 */
const JWT_AUDIENCE = 'berthcare-mobile';

/**
 * Get private key for signing tokens
 * 
 * In production, this should retrieve the key from AWS Secrets Manager.
 * For development, uses environment variable.
 * 
 * @returns Private key for RS256 signing
 * @throws Error if private key is not configured
 */
function getPrivateKey(): string {
  const privateKey = process.env.JWT_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('JWT_PRIVATE_KEY environment variable is not set. Configure in AWS Secrets Manager for production.');
  }
  
  return privateKey;
}

/**
 * Get public key for verifying tokens
 * 
 * In production, this should retrieve the key from AWS Secrets Manager.
 * For development, uses environment variable.
 * 
 * @returns Public key for RS256 verification
 * @throws Error if public key is not configured
 */
function getPublicKey(): string {
  const publicKey = process.env.JWT_PUBLIC_KEY;
  
  if (!publicKey) {
    throw new Error('JWT_PUBLIC_KEY environment variable is not set. Configure in AWS Secrets Manager for production.');
  }
  
  return publicKey;
}

/**
 * Generate an access token (1 hour expiry)
 * 
 * Access tokens are short-lived and used for API authentication.
 * They contain user identity and authorization information.
 * 
 * @param payload - User information to encode in token
 * @returns Signed JWT access token
 * @throws Error if token generation fails
 * 
 * @example
 * ```typescript
 * const token = generateAccessToken({
 *   userId: '123e4567-e89b-12d3-a456-426614174000',
 *   email: 'nurse@example.com',
 *   role: 'nurse',
 *   zoneId: 'zone-123'
 * });
 * // Returns: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
 * ```
 */
export function generateAccessToken(payload: JWTPayload): string {
  try {
    const privateKey = getPrivateKey();
    
    const options: SignOptions = {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: 'RS256',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    };
    
    const token = jwt.sign(payload, privateKey, options);
    return token;
  } catch (error) {
    throw new Error(`Access token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a refresh token (30 days expiry)
 * 
 * Refresh tokens are long-lived and used to obtain new access tokens.
 * They should be stored securely in the database with the device_id.
 * 
 * @param payload - User information to encode in token
 * @returns Signed JWT refresh token
 * @throws Error if token generation fails
 * 
 * @example
 * ```typescript
 * const token = generateRefreshToken({
 *   userId: '123e4567-e89b-12d3-a456-426614174000',
 *   email: 'nurse@example.com',
 *   role: 'nurse',
 *   zoneId: 'zone-123'
 * });
 * // Returns: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
 * ```
 */
export function generateRefreshToken(payload: JWTPayload): string {
  try {
    const privateKey = getPrivateKey();
    
    const options: SignOptions = {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'RS256',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    };
    
    const token = jwt.sign(payload, privateKey, options);
    return token;
  } catch (error) {
    throw new Error(`Refresh token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify and decode a JWT token
 * 
 * Verifies the token signature using the public key and checks expiry.
 * Returns the decoded payload if valid.
 * 
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid, expired, or verification fails
 * 
 * @example
 * ```typescript
 * try {
 *   const payload = verifyToken(token);
 *   console.log('User ID:', payload.userId);
 * } catch (error) {
 *   console.error('Invalid token:', error.message);
 * }
 * ```
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const publicKey = getPublicKey();
    
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error(`Invalid token: ${error.message}`);
    } else {
      throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Decode a JWT token without verification
 * 
 * Useful for inspecting token contents without validating signature.
 * WARNING: Do not use for authentication - always use verifyToken() instead.
 * 
 * @param token - JWT token to decode
 * @returns Decoded token payload or null if invalid format
 * 
 * @example
 * ```typescript
 * const payload = decodeToken(token);
 * if (payload) {
 *   console.log('Token expires at:', payload.exp);
 * }
 * ```
 */
export function decodeToken(token: string): (JWTPayload & { exp?: number; iat?: number }) | null {
  try {
    const decoded = jwt.decode(token) as (JWTPayload & { exp?: number; iat?: number }) | null;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a token is expired without full verification
 * 
 * Useful for quick expiry checks before attempting verification.
 * 
 * @param token - JWT token to check
 * @returns true if token is expired, false otherwise
 * 
 * @example
 * ```typescript
 * if (isTokenExpired(token)) {
 *   // Request new token using refresh token
 * }
 * ```
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
