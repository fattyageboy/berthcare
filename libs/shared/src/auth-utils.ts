/**
 * Authentication Utilities
 * 
 * Provides secure password hashing and verification using bcrypt.
 * 
 * Design Philosophy:
 * - Uncompromising security: bcrypt with cost factor 12 (~200ms hashing time)
 * - Timing attack resistance: bcrypt's compare function has constant-time behavior
 * - Simple, predictable API: hash and verify, nothing more
 * 
 * Reference: BerthCare Architecture Blueprint v2.0.0 - Security section
 */

import bcrypt from 'bcrypt';

/**
 * Cost factor for bcrypt hashing.
 * 
 * Cost factor 12 provides ~200ms hashing time on modern hardware,
 * which is the sweet spot between security and user experience.
 * 
 * Higher values = more secure but slower
 * Lower values = faster but less secure
 * 
 * Reference: OWASP recommends cost factor 10-12 for 2024
 */
const BCRYPT_COST_FACTOR = 12;

/**
 * Hash a plain text password using bcrypt.
 * 
 * @param password - Plain text password to hash
 * @returns Promise resolving to the hashed password
 * @throws Error if password is empty or hashing fails
 * 
 * @example
 * ```typescript
 * const hash = await hashPassword('SecurePass123!');
 * // Returns: $2b$12$... (60 character bcrypt hash)
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }

  try {
    const hash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
    return hash;
  } catch (error) {
    throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify a plain text password against a bcrypt hash.
 * 
 * Uses bcrypt's constant-time comparison to prevent timing attacks.
 * 
 * @param password - Plain text password to verify
 * @param hash - Bcrypt hash to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 * @throws Error if inputs are invalid or verification fails
 * 
 * @example
 * ```typescript
 * const isValid = await verifyPassword('SecurePass123!', storedHash);
 * if (isValid) {
 *   // Password is correct
 * }
 * ```
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || password.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }

  if (!hash || hash.trim().length === 0) {
    throw new Error('Hash cannot be empty');
  }

  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    throw new Error(`Password verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
