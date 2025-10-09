/**
 * Authentication Utilities Tests
 * 
 * Test Coverage:
 * 1. Valid password hashing and verification
 * 2. Invalid password handling
 * 3. Timing attack resistance
 * 4. Edge cases and error conditions
 * 
 * Acceptance Criteria (from Task A2):
 * - Tests pass
 * - Hashing takes ~200ms (secure)
 * - Timing attack resistance verified
 */

import { hashPassword, verifyPassword } from '../src/auth-utils';

describe('Authentication Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a valid password successfully', async () => {
      const password = 'SecurePass123!';
      const hash = await hashPassword(password);

      // Bcrypt hashes are always 60 characters
      expect(hash).toHaveLength(60);
      // Bcrypt hashes start with $2b$ (bcrypt identifier)
      expect(hash).toMatch(/^\$2b\$/);
    });

    it('should generate different hashes for the same password (salt)', async () => {
      const password = 'SecurePass123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Different salts should produce different hashes
      expect(hash1).not.toBe(hash2);
    });

    it('should take approximately 200ms to hash (cost factor 12)', async () => {
      const password = 'SecurePass123!';
      const startTime = Date.now();
      
      await hashPassword(password);
      
      const duration = Date.now() - startTime;
      
      // Should take between 100ms and 500ms (allowing for system variance)
      // Target is ~200ms for cost factor 12
      expect(duration).toBeGreaterThanOrEqual(100);
      expect(duration).toBeLessThan(500);
    }, 10000); // Increase timeout for this test

    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password cannot be empty');
    });

    it('should throw error for whitespace-only password', async () => {
      await expect(hashPassword('   ')).rejects.toThrow('Password cannot be empty');
    });

    it('should handle special characters in password', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);

      expect(hash).toHaveLength(60);
      expect(hash).toMatch(/^\$2b\$/);
    });

    it('should handle very long passwords', async () => {
      const password = 'a'.repeat(100);
      const hash = await hashPassword(password);

      expect(hash).toHaveLength(60);
      expect(hash).toMatch(/^\$2b\$/);
    });

    it('should handle unicode characters', async () => {
      const password = 'パスワード123!';
      const hash = await hashPassword(password);

      expect(hash).toHaveLength(60);
      expect(hash).toMatch(/^\$2b\$/);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password successfully', async () => {
      const password = 'SecurePass123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePass123!';
      const wrongPassword = 'WrongPass456!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should reject password with slight variation', async () => {
      const password = 'SecurePass123!';
      const similarPassword = 'SecurePass123'; // Missing !
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(similarPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should reject password with different case', async () => {
      const password = 'SecurePass123!';
      const differentCase = 'securepass123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(differentCase, hash);

      expect(isValid).toBe(false);
    });

    it('should throw error for empty password', async () => {
      const hash = await hashPassword('ValidPass123!');

      await expect(verifyPassword('', hash)).rejects.toThrow('Password cannot be empty');
    });

    it('should throw error for empty hash', async () => {
      await expect(verifyPassword('ValidPass123!', '')).rejects.toThrow('Hash cannot be empty');
    });

    it('should return false for invalid hash format', async () => {
      // bcrypt returns false for invalid hashes instead of throwing
      const isValid = await verifyPassword('ValidPass123!', 'invalid-hash');
      expect(isValid).toBe(false);
    });

    it('should handle special characters in verification', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should handle unicode characters in verification', async () => {
      const password = 'パスワード123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });
  });

  describe('Timing Attack Resistance', () => {
    /**
     * Timing attack resistance test
     * 
     * Bcrypt's compare function uses constant-time comparison to prevent
     * timing attacks where an attacker measures response time to guess passwords.
     * 
     * This test verifies that verification time is consistent regardless of
     * whether the password is correct or incorrect.
     */
    it('should have consistent timing for correct and incorrect passwords', async () => {
      const correctPassword = 'SecurePass123!';
      const incorrectPassword = 'WrongPass456!';
      const hash = await hashPassword(correctPassword);

      // Measure time for correct password
      const correctStart = Date.now();
      await verifyPassword(correctPassword, hash);
      const correctDuration = Date.now() - correctStart;

      // Measure time for incorrect password
      const incorrectStart = Date.now();
      await verifyPassword(incorrectPassword, hash);
      const incorrectDuration = Date.now() - incorrectStart;

      // Time difference should be minimal (within 50ms)
      // Bcrypt's constant-time comparison ensures this
      const timeDifference = Math.abs(correctDuration - incorrectDuration);
      expect(timeDifference).toBeLessThan(50);
    }, 10000);

    it('should have consistent timing for different incorrect passwords', async () => {
      const password = 'SecurePass123!';
      const hash = await hashPassword(password);

      const timings: number[] = [];

      // Test multiple incorrect passwords
      const incorrectPasswords = [
        'Wrong1',
        'Wrong2',
        'Wrong3',
        'Wrong4',
        'Wrong5'
      ];

      for (const incorrectPassword of incorrectPasswords) {
        const start = Date.now();
        await verifyPassword(incorrectPassword, hash);
        const duration = Date.now() - start;
        timings.push(duration);
      }

      // Calculate standard deviation of timings
      const mean = timings.reduce((a, b) => a + b, 0) / timings.length;
      const variance = timings.reduce((sum, timing) => sum + Math.pow(timing - mean, 2), 0) / timings.length;
      const stdDev = Math.sqrt(variance);

      // Standard deviation should be low (consistent timing)
      expect(stdDev).toBeLessThan(20);
    }, 15000);
  });

  describe('Integration Tests', () => {
    it('should handle complete authentication flow', async () => {
      // Simulate user registration
      const userPassword = 'NewUser123!';
      const storedHash = await hashPassword(userPassword);

      // Simulate user login with correct password
      const loginAttempt1 = await verifyPassword('NewUser123!', storedHash);
      expect(loginAttempt1).toBe(true);

      // Simulate user login with incorrect password
      const loginAttempt2 = await verifyPassword('WrongPass!', storedHash);
      expect(loginAttempt2).toBe(false);

      // Simulate user login with correct password again
      const loginAttempt3 = await verifyPassword('NewUser123!', storedHash);
      expect(loginAttempt3).toBe(true);
    });

    it('should handle multiple users with same password', async () => {
      const sharedPassword = 'CommonPass123!';
      
      // Hash password for two different users
      const user1Hash = await hashPassword(sharedPassword);
      const user2Hash = await hashPassword(sharedPassword);

      // Hashes should be different (different salts)
      expect(user1Hash).not.toBe(user2Hash);

      // Both should verify correctly
      expect(await verifyPassword(sharedPassword, user1Hash)).toBe(true);
      expect(await verifyPassword(sharedPassword, user2Hash)).toBe(true);

      // Cross-verification should still work (same password, different salt)
      expect(await verifyPassword(sharedPassword, user1Hash)).toBe(true);
      expect(await verifyPassword(sharedPassword, user2Hash)).toBe(true);
    });
  });
});
