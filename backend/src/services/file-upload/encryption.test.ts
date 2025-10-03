/**
 * Encryption Service Tests
 * Verifies encryption and decryption functionality
 */

import { EncryptionService } from '../../shared/utils/encryption';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    // Set up encryption for tests
    process.env.DB_ENCRYPTION_ENABLED = 'true';
    process.env.DB_ENCRYPTION_KEY =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    encryptionService = new EncryptionService();
  });

  afterEach(() => {
    delete process.env.DB_ENCRYPTION_ENABLED;
    delete process.env.DB_ENCRYPTION_KEY;
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const plaintext = 'This is a sensitive photo caption';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(encrypted).not.toBe(plaintext);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext', () => {
      const plaintext = 'Same text';
      const encrypted1 = encryptionService.encrypt(plaintext);
      const encrypted2 = encryptionService.encrypt(plaintext);

      // Different IVs should produce different ciphertext
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same plaintext
      expect(encryptionService.decrypt(encrypted1)).toBe(plaintext);
      expect(encryptionService.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      const plaintext = '';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = 'Unicode: 你好世界 🌍 émojis 🎉';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'A'.repeat(10000);
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('isEnabled', () => {
    it('should return true when encryption is enabled', () => {
      expect(encryptionService.isEnabled()).toBe(true);
    });

    it('should return false when encryption is disabled', () => {
      process.env.DB_ENCRYPTION_ENABLED = 'false';
      const service = new EncryptionService();
      expect(service.isEnabled()).toBe(false);
    });

    it('should return plaintext when encryption is disabled', () => {
      process.env.DB_ENCRYPTION_ENABLED = 'false';
      const service = new EncryptionService();
      const plaintext = 'Not encrypted';

      expect(service.encrypt(plaintext)).toBe(plaintext);
      expect(service.decrypt(plaintext)).toBe(plaintext);
    });
  });

  describe('generateKey', () => {
    it('should generate a valid 256-bit key', () => {
      const key = EncryptionService.generateKey();

      // Should be 64 hex characters (32 bytes = 256 bits)
      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique keys', () => {
      const key1 = EncryptionService.generateKey();
      const key2 = EncryptionService.generateKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('error handling', () => {
    it('should throw error when decrypting invalid data', () => {
      expect(() => {
        encryptionService.decrypt('invalid-encrypted-data');
      }).toThrow('Failed to decrypt data');
    });

    it('should throw error when decrypting with wrong key', () => {
      const plaintext = 'Secret message';
      const encrypted = encryptionService.encrypt(plaintext);

      // Create new service with different key
      process.env.DB_ENCRYPTION_KEY =
        'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
      const wrongKeyService = new EncryptionService();

      expect(() => {
        wrongKeyService.decrypt(encrypted);
      }).toThrow('Failed to decrypt data');
    });
  });
});
