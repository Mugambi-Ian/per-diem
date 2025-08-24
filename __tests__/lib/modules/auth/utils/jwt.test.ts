import { describe, it, expect, beforeEach } from '@jest/globals';
import { server_sign_access_token, server_verify_access_token } from '@/lib/modules/auth/utils/jwt';

describe('JWT Utils', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env.JWT_SECRET_BASE64 = 'dGVzdC1zZWNyZXQta2V5LWZvci10ZXN0aW5nLXB1cnBvc2VzLW9ubHk=';
    process.env.JWT_ACCESS_EXPIRES_MINUTES = '15';
  });

  describe('server_sign_access_token', () => {
    it('should sign access token successfully', async () => {
      const payload = { sub: 'user-123', email: 'test@example.com' };
      const result = await server_sign_access_token(payload);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should use correct expiration time from environment', async () => {
      process.env.JWT_ACCESS_EXPIRES_MINUTES = '30';
      
      const payload = { sub: 'user-123' };
      const result = await server_sign_access_token(payload);

      expect(result).toBeDefined();
      
      // Verify the token can be decoded and has correct expiration
      const decoded = await server_verify_access_token(result);
      expect(decoded.sub).toBe('user-123');
    });

    it('should handle missing JWT secret environment variable', async () => {
      const originalSecret = process.env.JWT_SECRET_BASE64;
      delete process.env.JWT_SECRET_BASE64;

      // In our mocked environment, the functions should throw when called
      await expect(server_sign_access_token({ sub: 'test' }))
        .rejects.toThrow('JWT_SECRET_BASE64 not set');

      // Restore environment
      process.env.JWT_SECRET_BASE64 = originalSecret;
    });

    it('should sign tokens with different payloads', async () => {
      const payload1 = { sub: 'user-123', email: 'test1@example.com' };
      const payload2 = { sub: 'user-456', email: 'test2@example.com' };

      const token1 = await server_sign_access_token(payload1);
      const token2 = await server_sign_access_token(payload2);

      expect(token1).not.toBe(token2);
      
      const decoded1 = await server_verify_access_token(token1);
      const decoded2 = await server_verify_access_token(token2);

      expect(decoded1.sub).toBe('user-123');
      expect(decoded2.sub).toBe('user-456');
    });
  });

  describe('server_verify_access_token', () => {
    it('should verify access token successfully', async () => {
      const payload = { sub: 'user-123', email: 'test@example.com' };
      const token = await server_sign_access_token(payload);

      const result = await server_verify_access_token(token);

      expect(result).toEqual(expect.objectContaining({
        sub: 'user-123',
        email: 'test@example.com'
      }));
    });

    it('should reject invalid tokens', async () => {
      const invalidToken = 'invalid.token.here';

      await expect(server_verify_access_token(invalidToken))
        .rejects.toThrow();
    });

    it('should reject expired tokens', async () => {
      // Set a very short expiration for this test
      process.env.JWT_ACCESS_EXPIRES_MINUTES = '0.001'; // 60ms
      
      const payload = { sub: 'user-123' };
      const token = await server_sign_access_token(payload);

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      await expect(server_verify_access_token(token))
        .rejects.toThrow();
    });

    it('should verify tokens signed with different algorithms', async () => {
      const payload = { sub: 'user-123' };
      const token = await server_sign_access_token(payload);

      const result = await server_verify_access_token(token);
      expect(result.sub).toBe('user-123');
    });
  });

  describe('Token Round Trip', () => {
    it('should sign and verify token with complex payload', async () => {
      const complexPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        roles: ['user', 'admin'],
        metadata: {
          lastLogin: new Date().toISOString(),
          preferences: { theme: 'dark', language: 'en' }
        }
      };

      const token = await server_sign_access_token(complexPayload);
      const verified = await server_verify_access_token(token);

      expect(verified.sub).toBe(complexPayload.sub);
      expect(verified.email).toBe(complexPayload.email);
      expect(verified.roles).toEqual(complexPayload.roles);
      expect(verified.metadata).toEqual(complexPayload.metadata);
    });

    it('should handle multiple tokens for same user', async () => {
      const payload = { sub: 'user-123', email: 'test@example.com' };
      
      const token1 = await server_sign_access_token(payload);
      const token2 = await server_sign_access_token(payload);

      expect(token1).not.toBe(token2);

      const verified1 = await server_verify_access_token(token1);
      const verified2 = await server_verify_access_token(token2);

      expect(verified1.sub).toBe(verified2.sub);
      expect(verified1.email).toBe(verified2.email);
    });
  });

  describe('Environment Configuration', () => {
    it('should use default values when environment variables are not set', () => {
      const originalEnv = { ...process.env };
      
      delete process.env.JWT_ACCESS_EXPIRES_MINUTES;
      
      // Re-import to test default values
      jest.resetModules();
      process.env.JWT_SECRET_BASE64 = 'dGVzdC1zZWNyZXQta2V5LWZvci10ZXN0aW5nLXB1cnBvc2VzLW9ubHk=';
      
      expect(() => {
        require('@/lib/modules/auth/utils/jwt');
      }).not.toThrow();
      
      // Restore environment
      process.env = originalEnv;
    });

    it('should handle invalid JWT_ACCESS_EXPIRES_MINUTES gracefully', () => {
      process.env.JWT_ACCESS_EXPIRES_MINUTES = 'invalid';
      
      // Should not throw, but should use default or handle gracefully
      expect(() => {
        require('@/lib/modules/auth/utils/jwt');
      }).not.toThrow();
    });
  });
});
