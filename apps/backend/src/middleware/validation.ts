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

/**
 * Middleware to validate create client request
 */
export function validateCreateClient(req: Request, res: Response, next: NextFunction) {
  const {
    firstName,
    lastName,
    dateOfBirth,
    address,
    phone,
    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelationship,
    zoneId,
  } = req.body;

  // Validate required fields
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

  if (!dateOfBirth) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Date of birth is required',
        details: { field: 'dateOfBirth' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (!address) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Address is required',
        details: { field: 'address' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (!emergencyContactName) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Emergency contact name is required',
        details: { field: 'emergencyContactName' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (!emergencyContactPhone) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Emergency contact phone is required',
        details: { field: 'emergencyContactPhone' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (!emergencyContactRelationship) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Emergency contact relationship is required',
        details: { field: 'emergencyContactRelationship' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate string lengths
  if (typeof firstName !== 'string' || firstName.length > 100) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'First name must be 1-100 characters',
        details: { field: 'firstName' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (typeof lastName !== 'string' || lastName.length > 100) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Last name must be 1-100 characters',
        details: { field: 'lastName' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (typeof address !== 'string' || address.trim().length === 0) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Address cannot be empty',
        details: { field: 'address' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (typeof emergencyContactName !== 'string' || emergencyContactName.length > 200) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Emergency contact name must be 1-200 characters',
        details: { field: 'emergencyContactName' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (
    typeof emergencyContactRelationship !== 'string' ||
    emergencyContactRelationship.length > 100
  ) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Emergency contact relationship must be 1-100 characters',
        details: { field: 'emergencyContactRelationship' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate date of birth format (ISO 8601: YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateOfBirth)) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Date of birth must be in format YYYY-MM-DD',
        details: { field: 'dateOfBirth' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate date is valid and reasonable
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid date of birth',
        details: { field: 'dateOfBirth' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate date is not in the future
  if (dob > new Date()) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Date of birth cannot be in the future',
        details: { field: 'dateOfBirth' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate date is reasonable (not more than 120 years ago)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);
  if (dob < minDate) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Date of birth is too far in the past',
        details: { field: 'dateOfBirth' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate phone format if provided (optional field)
  if (phone !== undefined && phone !== null) {
    if (typeof phone !== 'string' || phone.length > 20) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Phone number must be 1-20 characters',
          details: { field: 'phone' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }
  }

  // Validate emergency contact phone format
  if (typeof emergencyContactPhone !== 'string' || emergencyContactPhone.length > 20) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Emergency contact phone must be 1-20 characters',
        details: { field: 'emergencyContactPhone' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate zoneId format if provided (optional, UUID format)
  if (zoneId !== undefined && zoneId !== null) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(zoneId)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid zone ID format',
          details: { field: 'zoneId' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }
  }

  next();
}

/**
 * Middleware to validate update client request
 */
export function validateUpdateClient(req: Request, res: Response, next: NextFunction) {
  const {
    firstName,
    lastName,
    dateOfBirth,
    address,
    phone,
    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelationship,
    zoneId,
  } = req.body;

  // At least one field must be provided
  const hasAtLeastOneField =
    firstName !== undefined ||
    lastName !== undefined ||
    dateOfBirth !== undefined ||
    address !== undefined ||
    phone !== undefined ||
    emergencyContactName !== undefined ||
    emergencyContactPhone !== undefined ||
    emergencyContactRelationship !== undefined ||
    zoneId !== undefined;

  if (!hasAtLeastOneField) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'At least one field must be provided for update',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate firstName if provided
  if (firstName !== undefined) {
    if (typeof firstName !== 'string' || firstName.length === 0 || firstName.length > 100) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'First name must be 1-100 characters',
          details: { field: 'firstName' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }
  }

  // Validate lastName if provided
  if (lastName !== undefined) {
    if (typeof lastName !== 'string' || lastName.length === 0 || lastName.length > 100) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Last name must be 1-100 characters',
          details: { field: 'lastName' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }
  }

  // Validate dateOfBirth if provided
  if (dateOfBirth !== undefined) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Date of birth must be in format YYYY-MM-DD',
          details: { field: 'dateOfBirth' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date of birth',
          details: { field: 'dateOfBirth' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }

    if (dob > new Date()) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Date of birth cannot be in the future',
          details: { field: 'dateOfBirth' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }

    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 120);
    if (dob < minDate) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Date of birth is too far in the past',
          details: { field: 'dateOfBirth' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }
  }

  // Validate address if provided
  if (address !== undefined) {
    if (typeof address !== 'string' || address.trim().length === 0) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Address cannot be empty',
          details: { field: 'address' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }
  }

  // Validate phone if provided (can be null to clear)
  if (phone !== undefined && phone !== null) {
    if (typeof phone !== 'string' || phone.length === 0 || phone.length > 20) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Phone number must be 1-20 characters',
          details: { field: 'phone' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }
  }

  // Validate emergencyContactName if provided
  if (emergencyContactName !== undefined) {
    if (
      typeof emergencyContactName !== 'string' ||
      emergencyContactName.length === 0 ||
      emergencyContactName.length > 200
    ) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Emergency contact name must be 1-200 characters',
          details: { field: 'emergencyContactName' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }
  }

  // Validate emergencyContactPhone if provided
  if (emergencyContactPhone !== undefined) {
    if (
      typeof emergencyContactPhone !== 'string' ||
      emergencyContactPhone.length === 0 ||
      emergencyContactPhone.length > 20
    ) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Emergency contact phone must be 1-20 characters',
          details: { field: 'emergencyContactPhone' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }
  }

  // Validate emergencyContactRelationship if provided
  if (emergencyContactRelationship !== undefined) {
    if (
      typeof emergencyContactRelationship !== 'string' ||
      emergencyContactRelationship.length === 0 ||
      emergencyContactRelationship.length > 100
    ) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Emergency contact relationship must be 1-100 characters',
          details: { field: 'emergencyContactRelationship' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }
  }

  // Validate zoneId if provided
  if (zoneId !== undefined) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(zoneId)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid zone ID format',
          details: { field: 'zoneId' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }
  }

  next();
}

/**
 * Medication structure interface
 */
interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

/**
 * Validate medications array structure
 */
function validateMedications(medications: unknown): medications is Medication[] {
  if (!Array.isArray(medications)) {
    return false;
  }

  return medications.every((med) => {
    return (
      typeof med === 'object' &&
      med !== null &&
      'name' in med &&
      'dosage' in med &&
      'frequency' in med &&
      typeof med.name === 'string' &&
      med.name.trim().length > 0 &&
      typeof med.dosage === 'string' &&
      med.dosage.trim().length > 0 &&
      typeof med.frequency === 'string' &&
      med.frequency.trim().length > 0
    );
  });
}

/**
 * Validate allergies array structure
 */
function validateAllergies(allergies: unknown): allergies is string[] {
  if (!Array.isArray(allergies)) {
    return false;
  }

  return allergies.every((allergy) => {
    return typeof allergy === 'string' && allergy.trim().length > 0;
  });
}

/**
 * Middleware to validate care plan request
 */
export function validateCarePlan(req: Request, res: Response, next: NextFunction) {
  const { clientId, summary, medications, allergies, specialInstructions } = req.body;

  // Validate required fields
  if (!clientId) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Client ID is required',
        details: { field: 'clientId' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (!summary) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Summary is required',
        details: { field: 'summary' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (medications === undefined) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Medications array is required',
        details: { field: 'medications' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  if (allergies === undefined) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Allergies array is required',
        details: { field: 'allergies' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate clientId format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(clientId)) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid client ID format',
        details: { field: 'clientId' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate summary
  if (typeof summary !== 'string' || summary.trim().length === 0) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Summary cannot be empty',
        details: { field: 'summary' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate medications structure
  if (!validateMedications(medications)) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message:
          'Invalid medications format. Must be array of objects with name, dosage, and frequency',
        details: { field: 'medications' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate allergies structure
  if (!validateAllergies(allergies)) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid allergies format. Must be array of non-empty strings',
        details: { field: 'allergies' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Validate specialInstructions if provided
  if (specialInstructions !== undefined && specialInstructions !== null) {
    if (typeof specialInstructions !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Special instructions must be a string',
          details: { field: 'specialInstructions' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }
  }

  next();
}
