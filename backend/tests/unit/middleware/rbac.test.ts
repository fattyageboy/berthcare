/**
 * RBAC Middleware Unit Tests
 * Tests for role-based access control middleware
 */

import { Response, NextFunction } from 'express';
import {
  requireRole,
  requirePermission,
  requireAllPermissions,
  requireOwnResource,
  requireSameOrganization,
  requireRoleOrPermission,
  hasPermission,
  getPermissionsForRole,
} from '../../../src/shared/middleware/rbac';
import { AuthenticatedRequest, UserRole, Permission } from '../../../src/shared/types';

describe('RBAC Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock response
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      params: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  describe('requireRole', () => {
    it('should allow access for user with required role', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'nurse@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'nurse',
        organization_id: 'org-123',
      };

      const middleware = requireRole(UserRole.NURSE);

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should allow access for user with one of multiple allowed roles', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'admin@example.com',
        first_name: 'John',
        last_name: 'Admin',
        role: 'admin',
        organization_id: 'org-123',
      };

      const middleware = requireRole(UserRole.ADMIN, UserRole.SUPERVISOR);

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should deny access when user not authenticated', () => {
      mockRequest.user = undefined;

      const middleware = requireRole(UserRole.NURSE);

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for user with wrong role', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'family@example.com',
        first_name: 'Jane',
        last_name: 'Family',
        role: 'family_member',
        organization_id: 'org-123',
      };

      const middleware = requireRole(UserRole.NURSE, UserRole.ADMIN);

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions to access this resource',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('should allow access when user has required permission', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'nurse@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'nurse',
        organization_id: 'org-123',
      };

      const middleware = requirePermission(Permission.READ_OWN_VISITS);

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should allow access when user has one of multiple permissions', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'coordinator@example.com',
        first_name: 'Jane',
        last_name: 'Coordinator',
        role: 'coordinator',
        organization_id: 'org-123',
      };

      const middleware = requirePermission(Permission.READ_ALL_VISITS, Permission.WRITE_ALL_VISITS);

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should deny access when user not authenticated', () => {
      mockRequest.user = undefined;

      const middleware = requirePermission(Permission.READ_OWN_VISITS);

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user lacks required permission', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'family@example.com',
        first_name: 'Jane',
        last_name: 'Family',
        role: 'family_member',
        organization_id: 'org-123',
      };

      const middleware = requirePermission(Permission.WRITE_USERS);

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions to access this resource',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAllPermissions', () => {
    it('should allow access when user has all required permissions', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'admin@example.com',
        first_name: 'John',
        last_name: 'Admin',
        role: 'admin',
        organization_id: 'org-123',
      };

      const middleware = requireAllPermissions(
        Permission.READ_USERS,
        Permission.WRITE_USERS,
        Permission.ADMIN_ACCESS
      );

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should deny access when user has only some permissions', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'coordinator@example.com',
        first_name: 'Jane',
        last_name: 'Coordinator',
        role: 'coordinator',
        organization_id: 'org-123',
      };

      const middleware = requireAllPermissions(
        Permission.READ_USERS,
        Permission.WRITE_USERS,
        Permission.ADMIN_ACCESS // Coordinators don't have this
      );

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions to access this resource',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user not authenticated', () => {
      mockRequest.user = undefined;

      const middleware = requireAllPermissions(Permission.READ_USERS);

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnResource', () => {
    it('should allow access when user accesses own resource', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'nurse@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'nurse',
        organization_id: 'org-123',
      };
      mockRequest.params = {
        userId: 'user-123',
      };

      const middleware = requireOwnResource();

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should allow access with custom param name', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'nurse@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'nurse',
        organization_id: 'org-123',
      };
      mockRequest.params = {
        id: 'user-123',
      };

      const middleware = requireOwnResource('id');

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should deny access when user accesses another user resource', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'nurse@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'nurse',
        organization_id: 'org-123',
      };
      mockRequest.params = {
        userId: 'user-456',
      };

      const middleware = requireOwnResource();

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'You can only access your own resources',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user not authenticated', () => {
      mockRequest.user = undefined;
      mockRequest.params = {
        userId: 'user-123',
      };

      const middleware = requireOwnResource();

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return bad request when param missing', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'nurse@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'nurse',
        organization_id: 'org-123',
      };
      mockRequest.params = {};

      const middleware = requireOwnResource();

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Bad request',
        message: 'Missing userId parameter',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireSameOrganization', () => {
    it('should allow access when resource in same organization', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'nurse@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'nurse',
        organization_id: 'org-123',
      };
      mockRequest.params = {
        organizationId: 'org-123',
      };

      const middleware = requireSameOrganization();

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should allow access with custom param name', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'nurse@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'nurse',
        organization_id: 'org-123',
      };
      mockRequest.params = {
        orgId: 'org-123',
      };

      const middleware = requireSameOrganization('orgId');

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should deny access when resource in different organization', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'nurse@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'nurse',
        organization_id: 'org-123',
      };
      mockRequest.params = {
        organizationId: 'org-456',
      };

      const middleware = requireSameOrganization();

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'You can only access resources within your organization',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user not authenticated', () => {
      mockRequest.user = undefined;
      mockRequest.params = {
        organizationId: 'org-123',
      };

      const middleware = requireSameOrganization();

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return bad request when param missing', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'nurse@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'nurse',
        organization_id: 'org-123',
      };
      mockRequest.params = {};

      const middleware = requireSameOrganization();

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Bad request',
        message: 'Missing organizationId parameter',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRoleOrPermission', () => {
    it('should allow access when user has required role', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'admin@example.com',
        first_name: 'John',
        last_name: 'Admin',
        role: 'admin',
        organization_id: 'org-123',
      };

      const middleware = requireRoleOrPermission([UserRole.ADMIN], [Permission.WRITE_USERS]);

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should allow access when user has required permission but not role', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'coordinator@example.com',
        first_name: 'Jane',
        last_name: 'Coordinator',
        role: 'coordinator',
        organization_id: 'org-123',
      };

      const middleware = requireRoleOrPermission([UserRole.ADMIN], [Permission.WRITE_USERS]);

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should deny access when user has neither role nor permission', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'nurse@example.com',
        first_name: 'Jane',
        last_name: 'Nurse',
        role: 'nurse',
        organization_id: 'org-123',
      };

      const middleware = requireRoleOrPermission([UserRole.ADMIN], [Permission.ADMIN_ACCESS]);

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions to access this resource',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user not authenticated', () => {
      mockRequest.user = undefined;

      const middleware = requireRoleOrPermission([UserRole.ADMIN], [Permission.ADMIN_ACCESS]);

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('hasPermission helper', () => {
    it('should return true when role has permission', () => {
      const result = hasPermission(UserRole.NURSE, Permission.READ_OWN_VISITS);

      expect(result).toBe(true);
    });

    it('should return false when role does not have permission', () => {
      const result = hasPermission(UserRole.NURSE, Permission.ADMIN_ACCESS);

      expect(result).toBe(false);
    });

    it('should return false for invalid role', () => {
      const result = hasPermission('invalid_role' as UserRole, Permission.READ_OWN_VISITS);

      expect(result).toBe(false);
    });
  });

  describe('getPermissionsForRole helper', () => {
    it('should return all permissions for nurse role', () => {
      const permissions = getPermissionsForRole(UserRole.NURSE);

      expect(permissions).toContain(Permission.READ_OWN_VISITS);
      expect(permissions).toContain(Permission.WRITE_OWN_VISITS);
      expect(permissions).toContain(Permission.READ_CARE_PLANS);
      expect(permissions).not.toContain(Permission.ADMIN_ACCESS);
    });

    it('should return all permissions for admin role', () => {
      const permissions = getPermissionsForRole(UserRole.ADMIN);

      expect(permissions).toContain(Permission.ADMIN_ACCESS);
      expect(permissions).toContain(Permission.READ_USERS);
      expect(permissions).toContain(Permission.WRITE_USERS);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid role', () => {
      const permissions = getPermissionsForRole('invalid_role' as UserRole);

      expect(permissions).toEqual([]);
    });

    it('should return minimal permissions for family member', () => {
      const permissions = getPermissionsForRole(UserRole.FAMILY_MEMBER);

      expect(permissions).toContain(Permission.READ_OWN_CLIENTS);
      expect(permissions).toContain(Permission.SEND_MESSAGES);
      expect(permissions).toHaveLength(2);
    });
  });
});
