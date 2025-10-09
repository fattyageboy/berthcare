/**
 * Validation Utilities Tests
 * 
 * Tests for email and password validation functions
 */

import {
  isValidEmail,
  validatePasswordStrength,
  isValidRole,
  sanitizeEmail,
} from '../src/validation';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('nurse@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.com')).toBe(true);
      expect(isValidEmail('user123@test-domain.com')).toBe(true);
    });
    
    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('noatsign.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('   ')).toBe(false);
    });
    
    it('should handle null and undefined', () => {
      expect(isValidEmail(null as any)).toBe(false);
      expect(isValidEmail(undefined as any)).toBe(false);
    });
  });
  
  describe('validatePasswordStrength', () => {
    it('should accept strong passwords', () => {
      const result1 = validatePasswordStrength('SecurePass123');
      expect(result1.valid).toBe(true);
      expect(result1.error).toBeUndefined();
      
      const result2 = validatePasswordStrength('MyP@ssw0rd');
      expect(result2.valid).toBe(true);
      
      const result3 = validatePasswordStrength('Test1234');
      expect(result3.valid).toBe(true);
    });
    
    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePasswordStrength('Short1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 8 characters');
    });
    
    it('should reject passwords without uppercase letters', () => {
      const result = validatePasswordStrength('lowercase123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('uppercase letter');
    });
    
    it('should reject passwords without numbers', () => {
      const result = validatePasswordStrength('NoNumbers');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('number');
    });
    
    it('should handle empty and null passwords', () => {
      const result1 = validatePasswordStrength('');
      expect(result1.valid).toBe(false);
      expect(result1.error).toContain('required');
      
      const result2 = validatePasswordStrength(null as any);
      expect(result2.valid).toBe(false);
      expect(result2.error).toContain('required');
    });
  });
  
  describe('isValidRole', () => {
    it('should accept valid roles', () => {
      expect(isValidRole('nurse')).toBe(true);
      expect(isValidRole('coordinator')).toBe(true);
      expect(isValidRole('admin')).toBe(true);
    });
    
    it('should reject invalid roles', () => {
      expect(isValidRole('invalid')).toBe(false);
      expect(isValidRole('user')).toBe(false);
      expect(isValidRole('')).toBe(false);
      expect(isValidRole('NURSE')).toBe(false); // Case sensitive
    });
  });
  
  describe('sanitizeEmail', () => {
    it('should trim whitespace and convert to lowercase', () => {
      expect(sanitizeEmail('  Test@Example.COM  ')).toBe('test@example.com');
      expect(sanitizeEmail('USER@DOMAIN.COM')).toBe('user@domain.com');
      expect(sanitizeEmail('nurse@example.com')).toBe('nurse@example.com');
    });
  });
});
