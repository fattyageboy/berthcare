import { body, param, query, ValidationChain } from 'express-validator';

/**
 * Validation schemas for visit management endpoints
 */

export const getVisitsValidation: ValidationChain[] = [
  query('date_from')
    .notEmpty()
    .withMessage('date_from is required')
    .isISO8601()
    .withMessage('date_from must be a valid ISO 8601 date'),
  query('date_to')
    .notEmpty()
    .withMessage('date_to is required')
    .isISO8601()
    .withMessage('date_to must be a valid ISO 8601 date')
    .custom((value: string, { req }) => {
      const dateFromStr = req.query?.date_from as string | undefined;
      if (typeof dateFromStr === 'string') {
        const dateFrom = new Date(dateFromStr);
        const dateTo = new Date(value);
        if (dateTo < dateFrom) {
          throw new Error('date_to must be after date_from');
        }
      }
      return true;
    }),
  query('status')
    .optional()
    .isString()
    .withMessage('status must be a string')
    .custom((value: string) => {
      const validStatuses = ['scheduled', 'in_progress', 'completed', 'missed', 'cancelled'];
      const statuses = value.split(',').map((s) => s.trim());
      const invalidStatuses = statuses.filter((s) => !validStatuses.includes(s));
      if (invalidStatuses.length > 0) {
        throw new Error(`Invalid status values: ${invalidStatuses.join(', ')}`);
      }
      return true;
    }),
  query('client_id').optional().isUUID().withMessage('client_id must be a valid UUID'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('per_page')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('per_page must be between 1 and 100'),
];

export const checkInValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Visit ID must be a valid UUID'),
  body('location').notEmpty().withMessage('location is required').isObject(),
  body('location.latitude')
    .notEmpty()
    .withMessage('latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('latitude must be between -90 and 90'),
  body('location.longitude')
    .notEmpty()
    .withMessage('longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('longitude must be between -180 and 180'),
  body('location.accuracy')
    .notEmpty()
    .withMessage('accuracy is required')
    .isFloat({ min: 0 })
    .withMessage('accuracy must be a positive number'),
  body('timestamp')
    .notEmpty()
    .withMessage('timestamp is required')
    .isISO8601()
    .withMessage('timestamp must be a valid ISO 8601 date'),
];

export const updateDocumentationValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Visit ID must be a valid UUID'),
  body('documentation').optional().isObject().withMessage('documentation must be an object'),
  body('documentation.vital_signs')
    .optional()
    .isObject()
    .withMessage('vital_signs must be an object'),
  body('documentation.vital_signs.blood_pressure')
    .optional()
    .isString()
    .withMessage('blood_pressure must be a string'),
  body('documentation.vital_signs.heart_rate')
    .optional()
    .isInt({ min: 0, max: 300 })
    .withMessage('heart_rate must be between 0 and 300'),
  body('documentation.vital_signs.temperature')
    .optional()
    .isFloat({ min: 30, max: 45 })
    .withMessage('temperature must be between 30 and 45'),
  body('documentation.vital_signs.recorded_at')
    .optional()
    .isISO8601()
    .withMessage('recorded_at must be a valid ISO 8601 date'),
  body('documentation.activities_completed')
    .optional()
    .isArray()
    .withMessage('activities_completed must be an array'),
  body('documentation.observations')
    .optional()
    .isString()
    .withMessage('observations must be a string'),
  body('documentation.care_plan_adherence')
    .optional()
    .isIn(['full_compliance', 'partial_compliance', 'non_compliance'])
    .withMessage(
      'care_plan_adherence must be one of: full_compliance, partial_compliance, non_compliance'
    ),
  body('notes').optional().isString().withMessage('notes must be a string'),
  body('photos').optional().isArray().withMessage('photos must be an array'),
  body('photos.*').optional().isString().withMessage('photo IDs must be strings'),
];

export const verifyLocationValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Visit ID must be a valid UUID'),
  body('location').notEmpty().withMessage('location is required').isObject(),
  body('location.latitude')
    .notEmpty()
    .withMessage('latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('latitude must be between -90 and 90'),
  body('location.longitude')
    .notEmpty()
    .withMessage('longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('longitude must be between -180 and 180'),
  body('location.accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('accuracy must be a positive number'),
];

export const completeVisitValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Visit ID must be a valid UUID'),
  body('documentation').optional().isObject().withMessage('documentation must be an object'),
  body('signature').optional().isString().withMessage('signature must be a string'),
  body('location').optional().isObject().withMessage('location must be an object'),
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('latitude must be between -90 and 90'),
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('longitude must be between -180 and 180'),
  body('location.accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('accuracy must be a positive number'),
];
