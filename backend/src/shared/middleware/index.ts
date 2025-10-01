/**
 * Shared middleware exports
 */

export { errorHandler, ApiError } from './errorHandler';
export { configureSecurity } from './security';
export { requestLogger } from './logger';
export { authRateLimiter, generalRateLimiter } from './rateLimiter';
export { authenticate, optionalAuth } from './auth';
export {
  requireRole,
  requirePermission,
  requireAllPermissions,
  requireOwnResource,
  requireSameOrganization,
  requireRoleOrPermission,
  hasPermission,
  getPermissionsForRole,
} from './rbac';
