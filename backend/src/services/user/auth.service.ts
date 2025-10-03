/**
 * Authentication Service
 * Core authentication logic for user login and token management
 */

import bcrypt from 'bcrypt';
import { database } from '../../config';
import {
  User,
  UserInfo,
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
} from '../../shared/types';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../shared/utils';
import { verifyCredentials, isAuth0Configured } from './auth0.service';
import { storeDeviceToken, verifyDeviceToken, updateDeviceTokenUsage } from './device.service';

/**
 * Get user by email
 */
const getUserByEmail = async (email: string): Promise<User | null> => {
  const client = await database.getClient();

  try {
    const result = await client.query('SELECT * FROM users WHERE email = $1 AND status = $2', [
      email,
      'active',
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as User;
  } finally {
    client.release();
  }
};

/**
 * Get user by ID
 */
const getUserById = async (userId: string): Promise<User | null> => {
  const client = await database.getClient();

  try {
    const result = await client.query('SELECT * FROM users WHERE id = $1 AND status = $2', [
      userId,
      'active',
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as User;
  } finally {
    client.release();
  }
};

/**
 * Update user's last login timestamp
 */
const updateLastLogin = async (userId: string): Promise<void> => {
  const client = await database.getClient();

  try {
    await client.query('UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1', [
      userId,
    ]);
  } finally {
    client.release();
  }
};

/**
 * Convert User to UserInfo (exclude sensitive data)
 */
const userToUserInfo = (user: User): UserInfo => {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    organization_id: user.organization_id,
  };
};

/**
 * Authenticate user with email and password
 */
export const login = async (loginRequest: LoginRequest): Promise<AuthResponse> => {
  const { email, password, device_id, device_type } = loginRequest;

  // Validate input
  if (!email || !password || !device_id || !device_type) {
    throw new Error('Missing required fields');
  }

  let user: User | null = null;

  // If Auth0 is configured, verify credentials through Auth0
  if (isAuth0Configured()) {
    try {
      // Verify credentials with Auth0
      await verifyCredentials(email, password);

      // Get user from local database
      user = await getUserByEmail(email);

      if (!user) {
        throw new Error('User not found in local database');
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid email or password')) {
          throw new Error('Invalid email or password');
        }
      }
      throw new Error('Authentication failed');
    }
  } else {
    // Fallback to local authentication (bcrypt)
    user = await getUserByEmail(email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password hash
    if (!user.password_hash) {
      throw new Error('User account is not configured for local authentication');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
  }

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organization_id,
    deviceId: device_id,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store device token for device binding
  await storeDeviceToken(user.id, device_id, device_type, refreshToken);

  // Update last login timestamp
  await updateLastLogin(user.id);

  // Return authentication response
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: userToUserInfo(user),
    expires_in: 3600, // 1 hour in seconds
  };
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (
  refreshRequest: RefreshTokenRequest
): Promise<AuthResponse> => {
  const { refresh_token, device_id } = refreshRequest;

  // Validate input
  if (!refresh_token || !device_id) {
    throw new Error('Missing required fields');
  }

  // Verify and decode refresh token
  let tokenPayload;
  try {
    tokenPayload = verifyToken(refresh_token);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }

  // Verify token type
  if (tokenPayload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  // Verify device binding
  const isDeviceValid = await verifyDeviceToken(tokenPayload.userId, device_id, refresh_token);

  if (!isDeviceValid) {
    throw new Error('Invalid device binding or token');
  }

  // Verify device ID matches
  if (tokenPayload.deviceId !== device_id) {
    throw new Error('Device ID mismatch');
  }

  // Get user from database
  const user = await getUserById(tokenPayload.userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Generate new tokens
  const newTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organization_id,
    deviceId: device_id,
  };

  const newAccessToken = generateAccessToken(newTokenPayload);
  const newRefreshToken = generateRefreshToken(newTokenPayload);

  // Update device token (rotate refresh token)
  await storeDeviceToken(
    user.id,
    device_id,
    tokenPayload.deviceId.split('-')[0] || 'unknown',
    newRefreshToken
  );

  // Update device token usage timestamp
  await updateDeviceTokenUsage(user.id, device_id);

  // Return authentication response
  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
    user: userToUserInfo(user),
    expires_in: 3600, // 1 hour in seconds
  };
};

/**
 * Validate access token
 */
export const validateAccessToken = async (token: string): Promise<UserInfo | null> => {
  try {
    const tokenPayload = verifyToken(token);

    if (tokenPayload.type !== 'access') {
      return null;
    }

    const user = await getUserById(tokenPayload.userId);

    if (!user) {
      return null;
    }

    return userToUserInfo(user);
  } catch {
    return null;
  }
};
