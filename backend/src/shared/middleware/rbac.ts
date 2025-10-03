/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces role and permission-based access control on routes
 */

import { Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import {
  ApiResponse,
  AuthenticatedRequest,
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
} from '../types';

/**
 * Check if user has required role
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse<unknown>);
        return;
      }

      // Check if user has one of the allowed roles
      const userRole = req.user.role as UserRole;

      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions to access this resource',
        } as ApiResponse<unknown>);
        return;
      }

      // User has required role, continue
      next();
    } catch (error) {
      logger.error('Role check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during role validation',
      } as ApiResponse<unknown>);
    }
  };
};

/**
 * Check if user has required permission
 */
export const requirePermission = (...requiredPermissions: Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse<unknown>);
        return;
      }

      // Get user's role and corresponding permissions
      const userRole = req.user.role as UserRole;
      const userPermissions = ROLE_PERMISSIONS[userRole];

      if (!userPermissions) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Invalid user role',
        } as ApiResponse<unknown>);
        return;
      }

      // Check if user has at least one of the required permissions
      const hasPermission = requiredPermissions.some((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions to access this resource',
        } as ApiResponse<unknown>);
        return;
      }

      // User has required permission, continue
      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during permission validation',
      } as ApiResponse<unknown>);
    }
  };
};

/**
 * Check if user has ALL required permissions (AND logic)
 */
export const requireAllPermissions = (...requiredPermissions: Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse<unknown>);
        return;
      }

      // Get user's role and corresponding permissions
      const userRole = req.user.role as UserRole;
      const userPermissions = ROLE_PERMISSIONS[userRole];

      if (!userPermissions) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Invalid user role',
        } as ApiResponse<unknown>);
        return;
      }

      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions to access this resource',
        } as ApiResponse<unknown>);
        return;
      }

      // User has all required permissions, continue
      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during permission validation',
      } as ApiResponse<unknown>);
    }
  };
};

/**
 * Check if user is accessing their own resource
 * Compares user ID from token with resource user ID from request params
 */
export const requireOwnResource = (paramName: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse<unknown>);
        return;
      }

      // Get resource user ID from params
      const resourceUserId = req.params[paramName];

      if (!resourceUserId) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: `Missing ${paramName} parameter`,
        } as ApiResponse<unknown>);
        return;
      }

      // Check if user is accessing their own resource
      if (req.user.id !== resourceUserId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only access your own resources',
        } as ApiResponse<unknown>);
        return;
      }

      // User is accessing their own resource, continue
      next();
    } catch (error) {
      logger.error('Resource ownership check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during resource ownership validation',
      } as ApiResponse<unknown>);
    }
  };
};

/**
 * Check if user is accessing resource within their organization
 * Compares organization ID from token with resource organization ID from request params
 */
export const requireSameOrganization = (paramName: string = 'organizationId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse<unknown>);
        return;
      }

      // Get resource organization ID from params
      const resourceOrgId = req.params[paramName];

      if (!resourceOrgId) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: `Missing ${paramName} parameter`,
        } as ApiResponse<unknown>);
        return;
      }

      // Check if user belongs to the same organization
      if (req.user.organization_id !== resourceOrgId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only access resources within your organization',
        } as ApiResponse<unknown>);
        return;
      }

      // User is accessing resource in their organization, continue
      next();
    } catch (error) {
      logger.error('Organization check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during organization validation',
      } as ApiResponse<unknown>);
    }
  };
};

/**
 * Combine role check OR permission check (flexible access control)
 * User needs either the role OR the permission to access the resource
 */
export const requireRoleOrPermission = (
  allowedRoles: UserRole[],
  allowedPermissions: Permission[]
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse<unknown>);
        return;
      }

      const userRole = req.user.role as UserRole;
      const userPermissions = ROLE_PERMISSIONS[userRole];

      // Check if user has required role
      if (allowedRoles.includes(userRole)) {
        next();
        return;
      }

      // Check if user has required permission
      if (userPermissions) {
        const hasPermission = allowedPermissions.some((permission) =>
          userPermissions.includes(permission)
        );

        if (hasPermission) {
          next();
          return;
        }
      }

      // User doesn't have required role or permission
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions to access this resource',
      } as ApiResponse<unknown>);
    } catch (error) {
      logger.error('Role or permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during authorization',
      } as ApiResponse<unknown>);
    }
  };
};

/**
 * Helper function to check if user has a specific permission
 * Can be used in route handlers for conditional logic
 */
export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions ? permissions.includes(permission) : false;
};

/**
 * Helper function to get all permissions for a role
 */
export const getPermissionsForRole = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};
