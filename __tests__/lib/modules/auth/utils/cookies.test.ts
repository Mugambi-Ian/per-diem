// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, it, expect, beforeEach } from '@jest/globals';
import { server_serialize_cookie } from '@/lib/modules/auth/utils/cookies';

describe('Cookie Utils Tests', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env.NODE_ENV = 'test';
    process.env.COOKIE_DOMAIN = 'localhost';
  });

  describe('server_serialize_cookie', () => {
    it('should serialize a basic cookie', () => {
      const result = server_serialize_cookie('test-cookie', 'test-value');
      
      expect(result).toContain('test-cookie=test-value');
      expect(result).toContain('Path=/');
    });

    it('should include httpOnly when specified', () => {
      const result = server_serialize_cookie('test-cookie', 'test-value', {
        httpOnly: true
      });
      
      expect(result).toContain('HttpOnly');
    });

    it('should include secure when specified', () => {
      const result = server_serialize_cookie('test-cookie', 'test-value', {
        secure: true
      });
      
      expect(result).toContain('Secure');
    });

    it('should include sameSite when specified', () => {
      const result = server_serialize_cookie('test-cookie', 'test-value', {
        sameSite: 'strict'
      });
      
      expect(result).toContain('SameSite=strict');
    });

    it('should include path when specified', () => {
      const result = server_serialize_cookie('test-cookie', 'test-value', {
        path: '/api'
      });
      
      expect(result).toContain('Path=/api');
    });

    it('should include maxAge when specified', () => {
      const result = server_serialize_cookie('test-cookie', 'test-value', {
        maxAge: 3600
      });
      
      expect(result).toContain('Max-Age=3600');
    });

    it('should include domain when specified', () => {
      const result = server_serialize_cookie('test-cookie', 'test-value', {
        domain: 'example.com'
      });
      
      expect(result).toContain('Domain=example.com');
    });

    it('should handle multiple options', () => {
      const result = server_serialize_cookie('test-cookie', 'test-value', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/api',
        maxAge: 7200,
        domain: 'example.com'
      });
      
      expect(result).toContain('test-cookie=test-value');
      expect(result).toContain('HttpOnly');
      expect(result).toContain('Secure');
      expect(result).toContain('SameSite=lax');
      expect(result).toContain('Path=/api');
      expect(result).toContain('Max-Age=7200');
      expect(result).toContain('Domain=example.com');
    });

    it('should handle special characters in value', () => {
      const result = server_serialize_cookie('test-cookie', 'test=value;with;special;chars');
      
      expect(result).toContain('test-cookie=test%3Dvalue%3Bwith%3Bspecial%3Bchars');
    });

    it('should handle empty value', () => {
      const result = server_serialize_cookie('test-cookie', '');
      
      expect(result).toContain('test-cookie=');
    });

    it('should use environment variables for defaults', () => {
      process.env.COOKIE_DOMAIN = 'test.com';
      
      const result = server_serialize_cookie('test-cookie', 'test-value');
      
      expect(result).toContain('test-cookie=test-value');
    });
  });
});
