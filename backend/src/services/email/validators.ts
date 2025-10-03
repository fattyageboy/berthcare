/**
 * Email Validators
 * Request validation for email endpoints
 */

import { body, query } from 'express-validator';

export const sendEmailValidators = [
  body('to')
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(r => r.email && typeof r.email === 'string');
      }
      return value.email && typeof value.email === 'string';
    })
    .withMessage('Valid recipient email(s) required'),
  body('subject')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 500 })
    .withMessage('Subject must be less than 500 characters'),
  body('html')
    .isString()
    .notEmpty()
    .withMessage('HTML content is required'),
  body('text')
    .optional()
    .isString(),
  body('type')
    .isIn(['visit_report', 'password_reset', 'welcome', 'visit_reminder', 'weekly_summary', 'policy_update', 'system_notification'])
    .withMessage('Invalid email type'),
  body('cc')
    .optional()
    .isArray(),
  body('bcc')
    .optional()
    .isArray(),
  body('replyTo')
    .optional()
    .isEmail()
    .withMessage('Invalid reply-to email'),
];

export const sendVisitReportValidators = [
  body('recipient_email')
    .isEmail()
    .withMessage('Valid recipient email is required'),
  body('recipient_name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Recipient name is required'),
  body('data.visit_id')
    .isUUID()
    .withMessage('Valid visit ID is required'),
  body('data.client_name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Client name is required'),
  body('data.nurse_name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Nurse name is required'),
  body('data.visit_date')
    .isString()
    .notEmpty()
    .withMessage('Visit date is required'),
  body('data.visit_type')
    .isString()
    .notEmpty()
    .withMessage('Visit type is required'),
  body('data.duration')
    .isString()
    .notEmpty()
    .withMessage('Duration is required'),
  body('data.notes')
    .isString()
    .notEmpty()
    .withMessage('Notes are required'),
  body('data.care_activities')
    .isArray()
    .withMessage('Care activities must be an array'),
];

export const sendPasswordResetValidators = [
  body('recipient_email')
    .isEmail()
    .withMessage('Valid recipient email is required'),
  body('recipient_name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Recipient name is required'),
  body('data.user_name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('User name is required'),
  body('data.reset_link')
    .isURL()
    .withMessage('Valid reset link is required'),
  body('data.expiry_hours')
    .isInt({ min: 1, max: 72 })
    .withMessage('Expiry hours must be between 1 and 72'),
];

export const emailLogsValidators = [
  query('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
];

export const bounceNotificationValidator = [
  body('notificationType')
    .isIn(['Bounce', 'Complaint'])
    .withMessage('Invalid notification type'),
];
