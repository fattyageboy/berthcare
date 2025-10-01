/**
 * Device Token Service
 * Handles device binding for secure token management
 */

import { database } from '../../config';
import bcrypt from 'bcrypt';
import { DeviceToken } from '../../shared/types';

/**
 * Store device token in database
 */
export const storeDeviceToken = async (
  userId: string,
  deviceId: string,
  deviceType: string,
  refreshToken: string
): Promise<DeviceToken> => {
  const client = await database.getClient();

  try {
    // Hash the refresh token before storing
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    // Calculate expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Check if device token already exists for this user and device
    const existingToken = await client.query(
      'SELECT id FROM device_tokens WHERE user_id = $1 AND device_id = $2',
      [userId, deviceId]
    );

    let result;

    if (existingToken.rows.length > 0) {
      // Update existing token
      result = await client.query(
        `UPDATE device_tokens
         SET refresh_token_hash = $1,
             expires_at = $2,
             last_used_at = NOW(),
             updated_at = NOW(),
             device_type = $3
         WHERE user_id = $4 AND device_id = $5
         RETURNING *`,
        [refreshTokenHash, expiresAt, deviceType, userId, deviceId]
      );
    } else {
      // Insert new token
      result = await client.query(
        `INSERT INTO device_tokens (user_id, device_id, device_type, refresh_token_hash, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, deviceId, deviceType, refreshTokenHash, expiresAt]
      );
    }

    return result.rows[0] as DeviceToken;
  } finally {
    client.release();
  }
};

/**
 * Verify device token
 */
export const verifyDeviceToken = async (
  userId: string,
  deviceId: string,
  refreshToken: string
): Promise<boolean> => {
  const client = await database.getClient();

  try {
    const result = await client.query(
      `SELECT refresh_token_hash, expires_at
       FROM device_tokens
       WHERE user_id = $1 AND device_id = $2`,
      [userId, deviceId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const deviceToken = result.rows[0] as { refresh_token_hash: string; expires_at: Date };

    // Check if token is expired
    if (new Date(deviceToken.expires_at) < new Date()) {
      return false;
    }

    // Verify refresh token hash
    const isValid = await bcrypt.compare(refreshToken, deviceToken.refresh_token_hash);

    return isValid;
  } finally {
    client.release();
  }
};

/**
 * Update device token last used timestamp
 */
export const updateDeviceTokenUsage = async (userId: string, deviceId: string): Promise<void> => {
  const client = await database.getClient();

  try {
    await client.query(
      `UPDATE device_tokens
       SET last_used_at = NOW(), updated_at = NOW()
       WHERE user_id = $1 AND device_id = $2`,
      [userId, deviceId]
    );
  } finally {
    client.release();
  }
};

/**
 * Delete device token (logout)
 */
export const deleteDeviceToken = async (userId: string, deviceId: string): Promise<void> => {
  const client = await database.getClient();

  try {
    await client.query('DELETE FROM device_tokens WHERE user_id = $1 AND device_id = $2', [
      userId,
      deviceId,
    ]);
  } finally {
    client.release();
  }
};

/**
 * Delete all device tokens for a user (logout from all devices)
 */
export const deleteAllDeviceTokens = async (userId: string): Promise<void> => {
  const client = await database.getClient();

  try {
    await client.query('DELETE FROM device_tokens WHERE user_id = $1', [userId]);
  } finally {
    client.release();
  }
};

/**
 * Clean up expired tokens
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
  const client = await database.getClient();

  try {
    const result = await client.query('DELETE FROM device_tokens WHERE expires_at < NOW()');

    return result.rowCount || 0;
  } finally {
    client.release();
  }
};

/**
 * Get all active devices for a user
 */
export const getUserDevices = async (userId: string): Promise<DeviceToken[]> => {
  const client = await database.getClient();

  try {
    const result = await client.query(
      `SELECT id, user_id, device_id, device_type, expires_at, last_used_at, created_at, updated_at
       FROM device_tokens
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY last_used_at DESC`,
      [userId]
    );

    return result.rows as DeviceToken[];
  } finally {
    client.release();
  }
};
