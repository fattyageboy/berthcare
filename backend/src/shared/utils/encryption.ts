/**
 * Encryption Utility
 * Provides field-level encryption for sensitive database metadata
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from 'crypto';
import { logger } from './logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

export class EncryptionService {
  private encryptionKey: Buffer | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.DB_ENCRYPTION_ENABLED === 'true';

    if (this.enabled) {
      const keyHex = process.env.DB_ENCRYPTION_KEY;
      if (!keyHex || keyHex.length !== 64) {
        logger.warn('DB_ENCRYPTION_KEY not properly configured. Encryption disabled.');
        this.enabled = false;
      } else {
        this.encryptionKey = Buffer.from(keyHex, 'hex');
      }
    }
  }

  /**
   * Encrypt a string value
   * Returns base64-encoded encrypted data with IV and auth tag
   */
  encrypt(plaintext: string): string {
    if (!this.enabled || !this.encryptionKey) {
      return plaintext;
    }

    try {
      // Generate random IV
      const iv = crypto.randomBytes(IV_LENGTH);

      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine IV + encrypted data + auth tag
      const combined = Buffer.concat([iv, Buffer.from(encrypted, 'base64'), authTag]);

      return combined.toString('base64');
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt an encrypted string value
   * Expects base64-encoded data with IV and auth tag
   */
  decrypt(encryptedData: string): string {
    if (!this.enabled || !this.encryptionKey) {
      return encryptedData;
    }

    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract IV, encrypted data, and auth tag
      const iv = combined.subarray(0, IV_LENGTH);
      const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
      const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt data
      let decrypted = decipher.update(encrypted.toString('base64'), 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Check if encryption is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Generate a new encryption key (for setup/rotation)
   * Returns a 32-byte (256-bit) key as hex string
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
