/**
 * Input validation for authentication endpoints
 * Uses express-validator for request validation
 */

import { body, ValidationChain } from 'express-validator';

/**
 * Validation rules for login endpoint
 */
export const validateLogin: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),

  body('device_id')
    .trim()
    .notEmpty()
    .withMessage('Device ID is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Device ID must be between 1 and 255 characters'),

  body('device_type')
    .trim()
    .notEmpty()
    .withMessage('Device type is required')
    .isIn(['ios', 'android', 'web'])
    .withMessage('Device type must be one of: ios, android, web'),
];

/**
 * Validation rules for refresh token endpoint
 */
export const validateRefreshToken: ValidationChain[] = [
  body('refresh_token').trim().notEmpty().withMessage('Refresh token is required'),

  body('device_id')
    .trim()
    .notEmpty()
    .withMessage('Device ID is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Device ID must be between 1 and 255 characters'),
];
