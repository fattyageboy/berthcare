/**
 * Authentication types and interfaces
 * Used for login, token management, and device binding
 */

import { Request } from 'express';

export interface LoginRequest {
  email: string;
  password: string;
  device_id: string;
  device_type: 'ios' | 'android' | 'web';
}

export interface RefreshTokenRequest {
  refresh_token: string;
  device_id: string;
}

export interface UserInfo {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  organization_id: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserInfo;
  expires_in: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string | null;
  deviceId: string;
  type: 'access' | 'refresh';
}

export interface DeviceToken {
  id: string;
  user_id: string;
  device_id: string;
  device_type: string;
  refresh_token_hash: string;
  expires_at: Date;
  last_used_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  role: string;
  organization_id: string | null;
  status: string;
  password_hash: string;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * User roles enum
 * Matches database user_role ENUM type
 */
export enum UserRole {
  NURSE = 'nurse',
  PSW = 'psw',
  COORDINATOR = 'coordinator',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin',
  FAMILY_MEMBER = 'family_member',
}

/**
 * Permission enum
 * Defines granular permissions for role-based access control
 */
export enum Permission {
  // Visit permissions
  READ_OWN_VISITS = 'read:own_visits',
  WRITE_OWN_VISITS = 'write:own_visits',
  READ_ALL_VISITS = 'read:all_visits',
  WRITE_ALL_VISITS = 'write:all_visits',

  // Care plan permissions
  READ_CARE_PLANS = 'read:care_plans',
  WRITE_CARE_PLANS = 'write:care_plans',

  // User management permissions
  READ_USERS = 'read:users',
  WRITE_USERS = 'write:users',
  ASSIGN_ROLES = 'assign:roles',

  // Client permissions
  READ_OWN_CLIENTS = 'read:own_clients',
  READ_ALL_CLIENTS = 'read:all_clients',
  WRITE_CLIENTS = 'write:clients',

  // Photo permissions
  UPLOAD_PHOTOS = 'upload:photos',

  // Messaging permissions
  SEND_MESSAGES = 'send:messages',

  // Analytics permissions
  READ_ANALYTICS = 'read:analytics',

  // System configuration
  WRITE_CONFIG = 'write:config',

  // Audit permissions
  READ_AUDIT_LOGS = 'read:audit_logs',

  // Admin permissions
  ADMIN_ACCESS = 'admin:access',
}

/**
 * Role-based permission mapping
 * Maps each role to its allowed permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.NURSE]: [
    Permission.READ_OWN_VISITS,
    Permission.WRITE_OWN_VISITS,
    Permission.READ_CARE_PLANS,
    Permission.READ_OWN_CLIENTS,
    Permission.UPLOAD_PHOTOS,
    Permission.SEND_MESSAGES,
  ],
  [UserRole.PSW]: [
    Permission.READ_OWN_VISITS,
    Permission.WRITE_OWN_VISITS,
    Permission.READ_CARE_PLANS,
    Permission.READ_OWN_CLIENTS,
    Permission.UPLOAD_PHOTOS,
    Permission.SEND_MESSAGES,
  ],
  [UserRole.COORDINATOR]: [
    Permission.READ_ALL_VISITS,
    Permission.WRITE_ALL_VISITS,
    Permission.READ_CARE_PLANS,
    Permission.WRITE_CARE_PLANS,
    Permission.READ_USERS,
    Permission.WRITE_USERS,
    Permission.READ_ALL_CLIENTS,
    Permission.WRITE_CLIENTS,
    Permission.UPLOAD_PHOTOS,
    Permission.SEND_MESSAGES,
    Permission.READ_ANALYTICS,
  ],
  [UserRole.SUPERVISOR]: [
    Permission.READ_ALL_VISITS,
    Permission.WRITE_ALL_VISITS,
    Permission.READ_CARE_PLANS,
    Permission.WRITE_CARE_PLANS,
    Permission.READ_USERS,
    Permission.WRITE_USERS,
    Permission.ASSIGN_ROLES,
    Permission.READ_ALL_CLIENTS,
    Permission.WRITE_CLIENTS,
    Permission.UPLOAD_PHOTOS,
    Permission.SEND_MESSAGES,
    Permission.READ_ANALYTICS,
    Permission.WRITE_CONFIG,
    Permission.READ_AUDIT_LOGS,
    Permission.ADMIN_ACCESS,
  ],
  [UserRole.ADMIN]: [
    Permission.READ_ALL_VISITS,
    Permission.WRITE_ALL_VISITS,
    Permission.READ_CARE_PLANS,
    Permission.WRITE_CARE_PLANS,
    Permission.READ_USERS,
    Permission.WRITE_USERS,
    Permission.ASSIGN_ROLES,
    Permission.READ_ALL_CLIENTS,
    Permission.WRITE_CLIENTS,
    Permission.UPLOAD_PHOTOS,
    Permission.SEND_MESSAGES,
    Permission.READ_ANALYTICS,
    Permission.WRITE_CONFIG,
    Permission.READ_AUDIT_LOGS,
    Permission.ADMIN_ACCESS,
  ],
  [UserRole.FAMILY_MEMBER]: [Permission.READ_OWN_CLIENTS, Permission.SEND_MESSAGES],
};

/**
 * Extended Request interface with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: UserInfo;
}
