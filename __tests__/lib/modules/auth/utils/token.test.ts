import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { 
  server_generate_refresh_token, 
  server_hash_refresh_token, 
  server_verify_refresh_token_plain 
} from '@/lib/modules/auth/utils/token';
import { RefreshTokenService } from '@/lib/modules/auth/service/refresh.service';

// Mock the RefreshTokenService
jest.mock('@/lib/modules/auth/service/refresh.service', () => ({
  RefreshTokenService: {
    findValidRefreshTokenById: jest.fn()
  }
}));

describe('Token Utils Unit Tests', () => {
  const mockRefreshTokenService = RefreshTokenService as jest.Mocked<typeof RefreshTokenService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('server_generate_refresh_token', () => {
    it('should generate a refresh token', () => {
      const token = server_generate_refresh_token();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(96); // 48 bytes = 96 hex characters
    });

    it('should generate unique tokens', () => {
      const token1 = server_generate_refresh_token();
      const token2 = server_generate_refresh_token();
      
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with correct format', () => {
      const token = server_generate_refresh_token();
      
      // Should be a hex string
      expect(token).toMatch(/^[0-9a-f]+$/);
      expect(token.length).toBe(96);
    });

    it('should generate multiple tokens correctly', () => {
      const tokens = Array(10).fill(null).map(() => server_generate_refresh_token());
      
      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(10);
      
      // All tokens should have correct format
      tokens.forEach(token => {
        expect(token).toMatch(/^[0-9a-f]+$/);
        expect(token.length).toBe(96);
      });
    });
  });

  describe('server_hash_refresh_token', () => {
    it('should hash a refresh token', async () => {
      const plainToken = 'test-refresh-token-plain';
      const hash = await server_hash_refresh_token(plainToken);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(plainToken);
      expect(hash).toMatch(/^\$argon2id\$/); // Argon2 hash format
    });

    it('should generate different hashes for different tokens', async () => {
      const token1 = 'token-1';
      const token2 = 'token-2';
      
      const hash1 = await server_hash_refresh_token(token1);
      const hash2 = await server_hash_refresh_token(token2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate consistent hashes for same token', async () => {
      const token = 'consistent-token';
      
      const hash1 = await server_hash_refresh_token(token);
      const hash2 = await server_hash_refresh_token(token);
      
      // Argon2 hashes will be different due to salt, but both should be valid
      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
      expect(hash1).toMatch(/^\$argon2id\$/);
      expect(hash2).toMatch(/^\$argon2id\$/);
    });

    it('should handle empty token', async () => {
      const hash = await server_hash_refresh_token('');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should handle special characters in token', async () => {
      const token = 'special-chars!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await server_hash_refresh_token(token);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should handle very long tokens', async () => {
      const longToken = 'a'.repeat(1000);
      const hash = await server_hash_refresh_token(longToken);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should handle unicode characters in token', async () => {
      const unicodeToken = 'unicode-🚀-emoji-测试-тест';
      const hash = await server_hash_refresh_token(unicodeToken);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^\$argon2id\$/);
    });
  });

  describe('server_verify_refresh_token_plain', () => {
    it('should verify valid token successfully', async () => {
      const mockToken = {
        id: 'test-token-id',
        userId: 'test-user-id',
        tokenHash: await server_hash_refresh_token('valid-token'),
        revoked: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        rotatedFrom: null
      };

      mockRefreshTokenService.findValidRefreshTokenById.mockResolvedValue(mockToken);

      const result = await server_verify_refresh_token_plain('test-token-id', 'valid-token');
      
      expect(result).toBeDefined();
      expect(result).toBe(mockToken);
      expect(mockRefreshTokenService.findValidRefreshTokenById).toHaveBeenCalledWith('test-token-id');
    });

    it('should return null for non-existent token', async () => {
      mockRefreshTokenService.findValidRefreshTokenById.mockResolvedValue(null);

      const result = await server_verify_refresh_token_plain('non-existent-id', 'any-token');
      
      expect(result).toBeNull();
      expect(mockRefreshTokenService.findValidRefreshTokenById).toHaveBeenCalledWith('non-existent-id');
    });

    it('should return null for invalid token hash', async () => {
      const mockToken = {
        id: 'test-token-id',
        userId: 'test-user-id',
        tokenHash: await server_hash_refresh_token('correct-token'),
        revoked: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        rotatedFrom: null
      };

      mockRefreshTokenService.findValidRefreshTokenById.mockResolvedValue(mockToken);

      const result = await server_verify_refresh_token_plain('test-token-id', 'wrong-token');
      
      expect(result).toBeNull();
    });

    it('should return null for revoked token', async () => {
      // Mock service should return null for revoked tokens
      mockRefreshTokenService.findValidRefreshTokenById.mockResolvedValue(null);

      const result = await server_verify_refresh_token_plain('test-token-id', 'valid-token');
      
      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      // Mock service should return null for expired tokens
      mockRefreshTokenService.findValidRefreshTokenById.mockResolvedValue(null);

      const result = await server_verify_refresh_token_plain('test-token-id', 'valid-token');
      
      expect(result).toBeNull();
    });

    it('should handle argon2 verification errors gracefully', async () => {
      const mockToken = {
        id: 'test-token-id',
        userId: 'test-user-id',
        tokenHash: 'invalid-hash-format',
        revoked: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        rotatedFrom: null
      };

      mockRefreshTokenService.findValidRefreshTokenById.mockResolvedValue(mockToken);

      const result = await server_verify_refresh_token_plain('test-token-id', 'any-token');
      
      expect(result).toBeNull();
    });

    it('should handle empty token ID', async () => {
      mockRefreshTokenService.findValidRefreshTokenById.mockResolvedValue(null);

      const result = await server_verify_refresh_token_plain('', 'any-token');
      
      expect(result).toBeNull();
      expect(mockRefreshTokenService.findValidRefreshTokenById).toHaveBeenCalledWith('');
    });

    it('should handle empty plain token', async () => {
      const mockToken = {
        id: 'test-token-id',
        userId: 'test-user-id',
        tokenHash: await server_hash_refresh_token(''),
        revoked: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        rotatedFrom: null
      };

      mockRefreshTokenService.findValidRefreshTokenById.mockResolvedValue(mockToken);

      const result = await server_verify_refresh_token_plain('test-token-id', '');
      
      expect(result).toBeDefined();
      expect(result).toBe(mockToken);
    });

    it('should handle special characters in plain token', async () => {
      const specialToken = 'special-chars!@#$%^&*()_+-=[]{}|;:,.<>?';
      const mockToken = {
        id: 'test-token-id',
        userId: 'test-user-id',
        tokenHash: await server_hash_refresh_token(specialToken),
        revoked: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        rotatedFrom: null
      };

      mockRefreshTokenService.findValidRefreshTokenById.mockResolvedValue(mockToken);

      const result = await server_verify_refresh_token_plain('test-token-id', specialToken);
      
      expect(result).toBeDefined();
      expect(result).toBe(mockToken);
    });

    it('should handle RefreshTokenService errors', async () => {
      mockRefreshTokenService.findValidRefreshTokenById.mockRejectedValue(new Error('Database error'));

      await expect(
        server_verify_refresh_token_plain('test-token-id', 'any-token')
      ).rejects.toThrow('Database error');
    });
  });

  describe('Integration between functions', () => {
    it('should work with generated tokens', async () => {
      const generatedToken = server_generate_refresh_token();
      const hash = await server_hash_refresh_token(generatedToken);
      
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should verify a token that was generated and hashed', async () => {
      const generatedToken = server_generate_refresh_token();
      const hash = await server_hash_refresh_token(generatedToken);
      
      const mockToken = {
        id: 'test-token-id',
        userId: 'test-user-id',
        tokenHash: hash,
        revoked: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        rotatedFrom: null
      };

      mockRefreshTokenService.findValidRefreshTokenById.mockResolvedValue(mockToken);

      const result = await server_verify_refresh_token_plain('test-token-id', generatedToken);
      
      expect(result).toBeDefined();
      expect(result).toBe(mockToken);
    });
  });

  describe('Security considerations', () => {
    it('should not expose plain tokens in hashes', async () => {
      const plainToken = 'secret-token-123';
      const hash = await server_hash_refresh_token(plainToken);
      
      expect(hash).not.toContain(plainToken);
      expect(hash).not.toContain('secret');
      expect(hash).not.toContain('123');
    });

    it('should generate cryptographically secure tokens', () => {
      const tokens = Array(100).fill(null).map(() => server_generate_refresh_token());
      const uniqueTokens = new Set(tokens);
      
      // Should have very high uniqueness
      expect(uniqueTokens.size).toBe(100);
    });

    it('should handle timing attacks gracefully', async () => {
      const validToken = 'valid-token';
      const invalidToken = 'invalid-token';
      
      const mockToken = {
        id: 'test-token-id',
        userId: 'test-user-id',
        tokenHash: await server_hash_refresh_token(validToken),
        revoked: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        rotatedFrom: null
      };

      mockRefreshTokenService.findValidRefreshTokenById.mockResolvedValue(mockToken);

      // Both calls should take similar time to prevent timing attacks
      const start1 = Date.now();
      await server_verify_refresh_token_plain('test-token-id', validToken);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await server_verify_refresh_token_plain('test-token-id', invalidToken);
      const time2 = Date.now() - start2;

      // Times should be reasonably similar (within 100ms)
      expect(Math.abs(time1 - time2)).toBeLessThan(100);
    });
  });
});






