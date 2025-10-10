/**
 * Request Validation Middleware
 *
 * Provides input validation for API requests.
 *
 * Features:
 * - Email format validation
 * - Password strength validation
 * - Clear error messages
 * - Type-safe validation
 *
 * Reference: Architecture Blueprint - Security section
 * Task: A4 - Registration endpoint validation
 *
 * Philosophy: "Fail Fast"
 * - Validate early, fail fast
 * - Clear error messages
 * - Prevent invalid data from reaching business logic
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Email validation regex
 * Validates standard email format: user@domain.tld
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password strength requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_NUMBER_REGEX = /[0-9]/;

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return typeof email === 'string' && EMAIL_REGEX.test(email);
}

/**
 * Validate password strength
 * Returns error message if invalid, null if valid
 */
export function validatePasswordStrength(password: string): string | null {
  if (typeof password !== 'string') {
    return 'Password must be a string';
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }

  if (!PASSWORD_UPPERCASE_REGEX.test(password)) {
    return 'Password must contain at least 1 uppercase letter';
  }

  if (!PASSWORD_NUMBER_REGEX.test(password)) {
    return 'Password must contain at least 1 number';
  }

  return null;
}

/**
 * Middleware to validate login request
 */
export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const { email, password, deviceId } = req.body;

  // Validate required fields
  if (!email) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email is required',
        details: { field: 'email' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (!password) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password is required',
        details: { field: 'password' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (!deviceId) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Device ID is required',
        details: { field: 'deviceId' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate email format
  if (!isValidEmail(email)) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        details: { field: 'email' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  next();
}

/**
 * Middleware to validate refresh token request
 */
export function validateRefreshToken(req: Request, res: Response, next: NextFunction) {
  const { refreshToken } = req.body;

  // Validate required field
  if (!refreshToken) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Refresh token is required',
        details: { field: 'refreshToken' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate token format (basic check - JWT format)
  if (typeof refreshToken !== 'string' || refreshToken.split('.').length !== 3) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid refresh token format',
        details: { field: 'refreshToken' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  next();
}

/**
 * Middleware to validate registration request
 */
export function validateRegistration(req: Request, res: Response, next: NextFunction) {
  const { email, password, firstName, lastName, role, zoneId } = req.body;

  // Validate required fields
  if (!email) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email is required',
        details: { field: 'email' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (!password) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password is required',
        details: { field: 'password' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (!firstName) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'First name is required',
        details: { field: 'firstName' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (!lastName) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Last name is required',
        details: { field: 'lastName' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (!role) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Role is required',
        details: { field: 'role' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate email format
  if (!isValidEmail(email)) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        details: { field: 'email' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate password strength
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: passwordError,
        details: { field: 'password' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate role
  const validRoles = ['caregiver', 'coordinator', 'admin'];
  if (!validRoles.includes(role)) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: `Role must be one of: ${validRoles.join(', ')}`,
        details: { field: 'role', validValues: validRoles },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate zoneId for non-admin roles
  if (role !== 'admin' && !zoneId) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Zone ID is required for caregiver and coordinator roles',
        details: { field: 'zoneId' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  next();
}
