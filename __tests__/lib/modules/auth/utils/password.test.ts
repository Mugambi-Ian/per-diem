import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  server_hash_password, 
  server_verify_password, 
  validatePasswordStrength 
} from '@/lib/modules/auth/utils/password';

describe('Password Utils', () => {
  describe('server_hash_password', () => {
    it('should hash password with argon2id', async () => {
      const password = 'SecurePass123!';
      const hash = await server_hash_password(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^\$argon2id\$/);
      expect(hash).not.toBe(password);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'SecurePass123!';
      const hash1 = await server_hash_password(password);
      const hash2 = await server_hash_password(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hash = await server_hash_password(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should handle very long password', async () => {
      const password = 'A'.repeat(1000) + '123!';
      const hash = await server_hash_password(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$argon2id\$/);
    });
  });

  describe('server_verify_password', () => {
    it('should verify correct password', async () => {
      const password = 'SecurePass123!';
      const hash = await server_hash_password(password);

      const isValid = await server_verify_password(hash, password);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePass123!';
      const hash = await server_hash_password(password);

      const isValid = await server_verify_password(hash, 'WrongPassword123!');
      expect(isValid).toBe(false);
    });

    it('should reject empty password when hash was for non-empty', async () => {
      const password = 'SecurePass123!';
      const hash = await server_hash_password(password);

      const isValid = await server_verify_password(hash, '');
      expect(isValid).toBe(false);
    });

    it('should handle case sensitivity', async () => {
      const password = 'SecurePass123!';
      const hash = await server_hash_password(password);

      const isValid = await server_verify_password(hash, 'securepass123!');
      expect(isValid).toBe(false);
    });

    it('should handle whitespace differences', async () => {
      const password = 'SecurePass123!';
      const hash = await server_hash_password(password);

      const isValid = await server_verify_password(hash, ' SecurePass123! ');
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const password = 'SecurePass123!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 12 characters', () => {
      const password = 'Short1!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should reject password without uppercase letter', () => {
      const password = 'lowercase123!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const password = 'UPPERCASE123!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const password = 'NoNumbers!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const password = 'NoSpecialChar123';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject password with common patterns', () => {
      const password = 'MyPassword123!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is too common or contains common patterns');
    });

    it('should reject password with multiple issues', () => {
      const password = 'weak';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 12 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should accept password with special characters', () => {
      const password = 'My@Secure#Pass$123';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept password with unicode characters', () => {
      const password = 'MyPässwörd123!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Password Hashing and Verification Integration', () => {
    it('should hash and verify complex password', async () => {
      const password = 'My@Secure#Pass$123!';
      const hash = await server_hash_password(password);

      const isValid = await server_verify_password(hash, password);
      expect(isValid).toBe(true);
    });

    it('should handle password with spaces', async () => {
      const password = 'My Secure Password 123!';
      const hash = await server_hash_password(password);

      const isValid = await server_verify_password(hash, password);
      expect(isValid).toBe(true);
    });

    it('should handle password with emojis', async () => {
      const password = 'MyPassword🚀123!';
      const hash = await server_hash_password(password);

      const isValid = await server_verify_password(hash, password);
      expect(isValid).toBe(true);
    });
  });
});
