/**
 * Validation Utilities
 * 
 * Provides input validation functions for authentication and user data.
 * 
 * Design Philosophy:
 * - Fail fast: Validate early, provide clear error messages
 * - Security first: Strong password requirements, proper email validation
 * - Simple API: Single-purpose functions with clear names
 * 
 * Reference: BerthCare Architecture Blueprint v2.0.0 - Security section
 */

/**
 * Email validation regex
 * Validates standard email format: user@domain.tld
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_NUMBER_REGEX = /[0-9]/;

/**
 * Validate email format
 * 
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 * 
 * @example
 * ```typescript
 * isValidEmail('nurse@example.com'); // true
 * isValidEmail('invalid-email'); // false
 * ```
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate password strength
 * 
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * 
 * @param password - Password to validate
 * @returns Object with validation result and error message if invalid
 * 
 * @example
 * ```typescript
 * validatePasswordStrength('SecurePass123'); // { valid: true }
 * validatePasswordStrength('weak'); // { valid: false, error: 'Password must be at least 8 characters' }
 * ```
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  error?: string;
} {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      error: 'Password is required',
    };
  }
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    };
  }
  
  if (!PASSWORD_UPPERCASE_REGEX.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least 1 uppercase letter',
    };
  }
  
  if (!PASSWORD_NUMBER_REGEX.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least 1 number',
    };
  }
  
  return { valid: true };
}

/**
 * Validate user role
 * 
 * @param role - Role to validate
 * @returns true if valid role, false otherwise
 */
export function isValidRole(role: string): role is 'nurse' | 'coordinator' | 'admin' {
  return ['nurse', 'coordinator', 'admin'].includes(role);
}

/**
 * Sanitize email address
 * Trims whitespace and converts to lowercase
 * 
 * @param email - Email to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
