/**
 * Notification Validators
 * Request validation for notification endpoints
 */

import { body, param, query } from 'express-validator';

export const registerTokenValidators = [
  body('device_id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Device ID is required')
    .isLength({ max: 255 })
    .withMessage('Device ID must be less than 255 characters'),
  body('fcm_token')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('FCM token is required'),
  body('platform')
    .isIn(['ios', 'android', 'web'])
    .withMessage('Platform must be ios, android, or web'),
  body('app_version')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('App version must be less than 50 characters'),
];

export const sendNotificationValidators = [
  body('user_id')
    .isUUID()
    .withMessage('Valid user ID is required'),
  body('type')
    .isIn(['visit_reminder', 'team_alert', 'sync_update', 'family_update'])
    .withMessage('Invalid notification type'),
  body('title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('body')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Body is required'),
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be an object'),
  body('priority')
    .optional()
    .isIn(['high', 'normal', 'low'])
    .withMessage('Priority must be high, normal, or low'),
];

export const updatePreferencesValidators = [
  body('visit_reminders_enabled')
    .optional()
    .isBoolean()
    .withMessage('visit_reminders_enabled must be a boolean'),
  body('team_alerts_enabled')
    .optional()
    .isBoolean()
    .withMessage('team_alerts_enabled must be a boolean'),
  body('sync_updates_enabled')
    .optional()
    .isBoolean()
    .withMessage('sync_updates_enabled must be a boolean'),
  body('family_updates_enabled')
    .optional()
    .isBoolean()
    .withMessage('family_updates_enabled must be a boolean'),
  body('quiet_hours_start')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('quiet_hours_start must be in HH:MM format'),
  body('quiet_hours_end')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('quiet_hours_end must be in HH:MM format'),
];

export const notificationIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid notification ID is required'),
];

export const paginationValidators = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
];
