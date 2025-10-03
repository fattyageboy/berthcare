# Role-Based Access Control (RBAC) Documentation

## Overview

The BerthCare backend implements a comprehensive Role-Based Access Control (RBAC) system to ensure secure and appropriate access to resources based on user roles and permissions.

## User Roles

The system defines six user roles with hierarchical access levels:

### 1. Nurse / PSW (Personal Support Worker)
**Scope**: Field staff providing direct care to clients

**Permissions**:
- `READ_OWN_VISITS` - View visits assigned to them
- `WRITE_OWN_VISITS` - Create and update their own visits
- `READ_CARE_PLANS` - View care plans for assigned clients
- `READ_OWN_CLIENTS` - View information about assigned clients
- `UPLOAD_PHOTOS` - Upload photos during visits
- `SEND_MESSAGES` - Send messages to team members

**Access Restrictions**:
- Cannot view or modify other nurses' visits
- Cannot access admin routes
- Cannot manage users or roles
- Cannot view analytics or audit logs

### 2. Coordinator
**Scope**: Team managers responsible for coordinating care across multiple nurses

**Permissions**:
- `READ_ALL_VISITS` - View all visits in the organization
- `WRITE_ALL_VISITS` - Create and modify any visit
- `READ_CARE_PLANS` - View all care plans
- `WRITE_CARE_PLANS` - Create and modify care plans
- `READ_USERS` - View user information
- `WRITE_USERS` - Create and update user profiles
- `READ_ALL_CLIENTS` - View all client information
- `WRITE_CLIENTS` - Create and modify client records
- `UPLOAD_PHOTOS` - Upload photos
- `SEND_MESSAGES` - Send messages
- `READ_ANALYTICS` - Access analytics and reports

**Access Restrictions**:
- Cannot assign roles
- Cannot access system configuration
- Cannot view audit logs
- No admin-level access

### 3. Supervisor
**Scope**: Senior management with administrative capabilities

**Permissions**:
- All Coordinator permissions, plus:
- `ASSIGN_ROLES` - Assign and modify user roles
- `WRITE_CONFIG` - Modify system configuration
- `READ_AUDIT_LOGS` - View system audit logs
- `ADMIN_ACCESS` - Access administrative features

### 4. Admin
**Scope**: System administrators with full access

**Permissions**:
- All Supervisor permissions
- Full administrative access to all system features

### 5. Family Member
**Scope**: Family members of clients with limited read access

**Permissions**:
- `READ_OWN_CLIENTS` - View information about their family member
- `SEND_MESSAGES` - Contact the care team

**Access Restrictions**:
- Read-only access to specific client information
- No access to visit details, care plans, or other clinical data
- No user management access

## Permission Types

### Visit Permissions
- `READ_OWN_VISITS` - Read visits assigned to the user
- `WRITE_OWN_VISITS` - Create/update own visits
- `READ_ALL_VISITS` - Read all visits in organization
- `WRITE_ALL_VISITS` - Create/update any visit

### Care Plan Permissions
- `READ_CARE_PLANS` - View care plans
- `WRITE_CARE_PLANS` - Create/modify care plans

### User Management Permissions
- `READ_USERS` - View user profiles
- `WRITE_USERS` - Create/update user profiles
- `ASSIGN_ROLES` - Assign/modify user roles

### Client Permissions
- `READ_OWN_CLIENTS` - View assigned clients
- `READ_ALL_CLIENTS` - View all clients
- `WRITE_CLIENTS` - Create/modify client records

### Media Permissions
- `UPLOAD_PHOTOS` - Upload photos during visits

### Communication Permissions
- `SEND_MESSAGES` - Send messages to team members

### Analytics Permissions
- `READ_ANALYTICS` - Access analytics and reports

### System Permissions
- `WRITE_CONFIG` - Modify system configuration
- `READ_AUDIT_LOGS` - View audit logs
- `ADMIN_ACCESS` - Administrative access

## RBAC Middleware Functions

### requireRole(...roles)
Checks if the authenticated user has one of the specified roles.

**Usage**:
```typescript
import { authenticate, requireRole } from '../../shared/middleware';
import { UserRole } from '../../shared/types';

router.delete(
  '/users/:userId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPERVISOR),
  async (req, res) => {
    // Only admins and supervisors can access this route
  }
);
```

### requirePermission(...permissions)
Checks if the user has at least one of the specified permissions (OR logic).

**Usage**:
```typescript
import { authenticate, requirePermission } from '../../shared/middleware';
import { Permission } from '../../shared/types';

router.get(
  '/visits',
  authenticate,
  requirePermission(Permission.READ_ALL_VISITS),
  async (req, res) => {
    // User must have READ_ALL_VISITS permission
  }
);
```

### requireAllPermissions(...permissions)
Checks if the user has ALL specified permissions (AND logic).

**Usage**:
```typescript
import { authenticate, requireAllPermissions } from '../../shared/middleware';
import { Permission } from '../../shared/types';

router.post(
  '/care-plans/:id/finalize',
  authenticate,
  requireAllPermissions(
    Permission.READ_CARE_PLANS,
    Permission.WRITE_CARE_PLANS
  ),
  async (req, res) => {
    // User must have both permissions
  }
);
```

### requireOwnResource(paramName?)
Checks if the user is accessing their own resource. Compares user ID from token with resource ID from URL params.

**Usage**:
```typescript
import { authenticate, requireOwnResource } from '../../shared/middleware';

router.put(
  '/users/:userId/profile',
  authenticate,
  requireOwnResource('userId'),
  async (req, res) => {
    // User can only update their own profile
  }
);
```

### requireSameOrganization(paramName?)
Checks if the resource belongs to the user's organization.

**Usage**:
```typescript
import { authenticate, requireSameOrganization } from '../../shared/middleware';

router.get(
  '/organization/:organizationId/users',
  authenticate,
  requireSameOrganization('organizationId'),
  async (req, res) => {
    // User can only access their own organization
  }
);
```

### requireRoleOrPermission(roles, permissions)
Flexible access control - user needs either the role OR the permission.

**Usage**:
```typescript
import { authenticate, requireRoleOrPermission } from '../../shared/middleware';
import { UserRole, Permission } from '../../shared/types';

router.get(
  '/reports',
  authenticate,
  requireRoleOrPermission(
    [UserRole.ADMIN],
    [Permission.READ_ANALYTICS]
  ),
  async (req, res) => {
    // Admins OR users with analytics permission
  }
);
```

## Helper Functions

### hasPermission(role, permission)
Check if a role has a specific permission. Useful for conditional logic in route handlers.

**Usage**:
```typescript
import { hasPermission } from '../../shared/middleware';
import { UserRole, Permission } from '../../shared/types';

if (hasPermission(UserRole.NURSE, Permission.READ_OWN_VISITS)) {
  // Nurse has this permission
}
```

### getPermissionsForRole(role)
Get all permissions for a given role.

**Usage**:
```typescript
import { getPermissionsForRole } from '../../shared/middleware';
import { UserRole } from '../../shared/types';

const nursePermissions = getPermissionsForRole(UserRole.NURSE);
// Returns array of all permissions for nurses
```

## Common Access Patterns

### Pattern 1: Own Resource OR Admin Access
Allow users to access their own resources, or admins to access any resource.

```typescript
router.get('/:userId/visits', authenticate, async (req, res) => {
  if (req.user.id !== req.params.userId) {
    // Check if user has admin permission
    const middleware = requirePermission(Permission.READ_ALL_VISITS);
    // Apply middleware check
  }
  // Proceed with request
});
```

### Pattern 2: Organization-Scoped Access
Ensure users can only access resources within their organization.

```typescript
router.get(
  '/organization/:orgId/clients',
  authenticate,
  requireSameOrganization('orgId'),
  requirePermission(Permission.READ_ALL_CLIENTS),
  async (req, res) => {
    // User is in same org AND has permission
  }
);
```

### Pattern 3: Hierarchical Role Access
Routes that require minimum role level.

```typescript
router.post(
  '/system/config',
  authenticate,
  requireRole(UserRole.SUPERVISOR, UserRole.ADMIN),
  async (req, res) => {
    // Only supervisor and admin can access
  }
);
```

## Access Control Matrix

| Resource | Nurse | Coordinator | Supervisor | Admin |
|----------|-------|-------------|------------|-------|
| Own Visits (Read) | ✓ | ✓ | ✓ | ✓ |
| Own Visits (Write) | ✓ | ✓ | ✓ | ✓ |
| All Visits (Read) | ✗ | ✓ | ✓ | ✓ |
| All Visits (Write) | ✗ | ✓ | ✓ | ✓ |
| Care Plans (Read) | ✓ | ✓ | ✓ | ✓ |
| Care Plans (Write) | ✗ | ✓ | ✓ | ✓ |
| Own Clients (Read) | ✓ | ✓ | ✓ | ✓ |
| All Clients (Read) | ✗ | ✓ | ✓ | ✓ |
| Client Records (Write) | ✗ | ✓ | ✓ | ✓ |
| Users (Read) | ✗ | ✓ | ✓ | ✓ |
| Users (Write) | ✗ | ✓ | ✓ | ✓ |
| Roles (Assign) | ✗ | ✗ | ✓ | ✓ |
| Analytics (Read) | ✗ | ✓ | ✓ | ✓ |
| Audit Logs (Read) | ✗ | ✗ | ✓ | ✓ |
| System Config (Write) | ✗ | ✗ | ✓ | ✓ |
| Admin Routes | ✗ | ✗ | ✓ | ✓ |

## Security Best Practices

1. **Always authenticate first**: Use `authenticate` middleware before any RBAC check
2. **Principle of least privilege**: Grant only necessary permissions
3. **Organization isolation**: Use `requireSameOrganization` for multi-tenant resources
4. **Combine checks**: Stack multiple middleware for layered security
5. **Fail securely**: Middleware denies access by default (403 or 401)

## Example Route Implementations

### Nurse Access Pattern
```typescript
// Nurses can only view their own visits
router.get(
  '/visits/my-visits',
  authenticate,
  requirePermission(Permission.READ_OWN_VISITS),
  async (req, res) => {
    // Fetch visits for req.user.id
  }
);
```

### Coordinator Access Pattern
```typescript
// Coordinators can view all team visits
router.get(
  '/visits',
  authenticate,
  requirePermission(Permission.READ_ALL_VISITS),
  async (req, res) => {
    // Fetch all visits in organization
  }
);
```

### Admin Access Pattern
```typescript
// Only admins can delete users
router.delete(
  '/users/:userId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPERVISOR),
  async (req, res) => {
    // Delete user
  }
);
```

## Testing

Comprehensive unit tests are available in `/tests/unit/middleware/rbac.test.ts` with >89% coverage.

Run tests:
```bash
npm test -- tests/unit/middleware/rbac.test.ts
```

Run with coverage:
```bash
npm test -- tests/unit/middleware/rbac.test.ts --coverage
```

## Error Responses

### 401 Unauthorized
User is not authenticated (missing or invalid token).

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
User is authenticated but lacks required role/permission.

```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions to access this resource"
}
```

### 400 Bad Request
Missing required parameters for resource ownership checks.

```json
{
  "success": false,
  "error": "Bad request",
  "message": "Missing userId parameter"
}
```

## Migration from Basic Auth

If migrating from basic authentication:

1. Import RBAC middleware: `import { requireRole, requirePermission } from '../../shared/middleware'`
2. Replace route guards with appropriate RBAC checks
3. Update tests to include role/permission scenarios
4. Verify all routes have appropriate access controls

## Future Enhancements

Potential future improvements:

- Dynamic permission assignment (permissions not tied to roles)
- Resource-level permissions (e.g., per-client access control)
- Time-based access restrictions
- IP-based access controls
- Multi-factor authentication for sensitive operations

## Support

For issues or questions about RBAC implementation, consult:
- Architecture documentation: `/project-documentation/architecture-output.md` (lines 721-746)
- Authentication documentation: `/backend/docs/AUTHENTICATION.md`
- Source code: `/backend/src/shared/middleware/rbac.ts`
- Type definitions: `/backend/src/shared/types/auth.types.ts`
