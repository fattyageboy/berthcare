/**
 * User Routes
 * Protected routes for user management with RBAC
 */

import { Router, Response } from 'express';
import {
  authenticate,
  requireRole,
  requirePermission,
  requireSameOrganization,
} from '../../shared/middleware';
import { ApiResponse, AuthenticatedRequest, UserRole, Permission } from '../../shared/types';
import { logger } from '../../shared/utils/logger';

const router = Router();

/**
 * GET /users/me
 * Get current user profile (requires authentication only)
 */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  try {
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: req.user,
    } as ApiResponse<typeof req.user>);
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve user profile',
    } as ApiResponse<unknown>);
  }
});

/**
 * GET /users/:userId
 * Get user by ID (user can access their own profile or coordinators can access team members)
 */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get(
  '/:userId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      // Allow users to access their own profile or require permission to view other users
      if (req.user?.id !== userId) {
        // Check if user has permission to read other users
        const hasPermission = requirePermission(Permission.READ_USERS);
        await new Promise<void>((resolve, reject) => {
          hasPermission(req, res, (error?: unknown) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
        // Permission granted - would fetch user from database here
        res.status(200).json({
          success: true,
          message: 'User retrieved successfully',
          data: {
            id: userId,
            message: 'User data would be fetched from database',
          },
        } as ApiResponse<{ id: string; message: string }>);
        return;
      }

      // User is accessing their own profile
      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: req.user,
      } as ApiResponse<typeof req.user>);
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve user',
      } as ApiResponse<unknown>);
    }
  }
);

/**
 * GET /users
 * List all users (requires coordinator or higher role)
 */
router.get(
  '/',
  authenticate,
  requirePermission(Permission.READ_USERS),
  (_req: AuthenticatedRequest, res: Response): void => {
    try {
      // In a real implementation, would fetch users from database
      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: [],
          message: 'Would fetch users from database filtered by organization',
        },
      } as ApiResponse<{ users: unknown[]; message: string }>);
    } catch (error) {
      logger.error('List users error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve users',
      } as ApiResponse<unknown>);
    }
  }
);

/**
 * PUT /users/:userId
 * Update user (user can update their own profile or admin can update any user)
 */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.put(
  '/:userId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      // Allow users to update their own profile or require permission
      if (req.user?.id !== userId) {
        const hasPermission = requirePermission(Permission.WRITE_USERS);
        await new Promise<void>((resolve, reject) => {
          hasPermission(req, res, (error?: unknown) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
        res.status(200).json({
          success: true,
          message: 'User updated successfully',
          data: {
            id: userId,
            message: 'User would be updated in database',
          },
        } as ApiResponse<{ id: string; message: string }>);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: userId,
          message: 'User profile would be updated in database',
        },
      } as ApiResponse<{ id: string; message: string }>);
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update user',
      } as ApiResponse<unknown>);
    }
  }
);

/**
 * DELETE /users/:userId
 * Delete user (requires admin role)
 */
router.delete(
  '/:userId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPERVISOR),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const { userId } = req.params;

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: {
          id: userId,
          message: 'User would be deleted from database',
        },
      } as ApiResponse<{ id: string; message: string }>);
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete user',
      } as ApiResponse<unknown>);
    }
  }
);

/**
 * POST /users/:userId/assign-role
 * Assign role to user (requires supervisor or admin role)
 */
router.post(
  '/:userId/assign-role',
  authenticate,
  requirePermission(Permission.ASSIGN_ROLES),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const { userId } = req.params;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const { role } = req.body;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (!role || !Object.values(UserRole).includes(role)) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Invalid role specified',
        } as ApiResponse<unknown>);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Role assigned successfully',
        data: {
          userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          newRole: role,
          message: 'Role would be updated in database',
        },
      } as ApiResponse<{ userId: string; newRole: string; message: string }>);
    } catch (error) {
      logger.error('Assign role error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to assign role',
      } as ApiResponse<unknown>);
    }
  }
);

/**
 * GET /users/organization/:organizationId
 * Get users in organization (requires same organization membership)
 */
router.get(
  '/organization/:organizationId',
  authenticate,
  requireSameOrganization('organizationId'),
  requirePermission(Permission.READ_USERS),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const { organizationId } = req.params;

      res.status(200).json({
        success: true,
        message: 'Organization users retrieved successfully',
        data: {
          organizationId,
          users: [],
          message: 'Would fetch users from database for this organization',
        },
      } as ApiResponse<{ organizationId: string; users: unknown[]; message: string }>);
    } catch (error) {
      logger.error('Get organization users error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve organization users',
      } as ApiResponse<unknown>);
    }
  }
);

export default router;
