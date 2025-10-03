import { body, ValidationChain } from 'express-validator';

/**
 * Sync Validators
 * Request validation rules for sync endpoints
 */

export const pullValidators: ValidationChain[] = [
  body('last_sync_timestamp')
    .isISO8601()
    .withMessage('last_sync_timestamp must be a valid ISO 8601 timestamp'),
  body('entity_types').isArray({ min: 1 }).withMessage('entity_types must be a non-empty array'),
  body('entity_types.*')
    .isIn(['visits', 'clients', 'care_plans', 'family_members'])
    .withMessage('Invalid entity type'),
];

export const pushValidators: ValidationChain[] = [
  body('changes').isArray({ min: 1 }).withMessage('changes must be a non-empty array'),
  body('changes.*.entity_type')
    .isIn(['visits', 'clients', 'care_plans', 'family_members'])
    .withMessage('Invalid entity type'),
  body('changes.*.entity_id').isUUID().withMessage('entity_id must be a valid UUID'),
  body('changes.*.operation')
    .isIn(['create', 'update', 'delete'])
    .withMessage('operation must be create, update, or delete'),
  body('changes.*.data').isObject().withMessage('data must be an object'),
  body('changes.*.local_timestamp')
    .isISO8601()
    .withMessage('local_timestamp must be a valid ISO 8601 timestamp'),
];
