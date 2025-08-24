import { describe, it, expect } from '@jest/globals';
import { server_set_security_headers } from '@/lib/utils/response';
import { NextResponse } from 'next/server';

describe('Response Security Headers Tests', () => {
  describe('server_set_security_headers', () => {
    it('should set all required security headers', () => {
      const response = NextResponse.json({ success: true });
      const secureResponse = server_set_security_headers(response);
      
      expect(secureResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(secureResponse.headers.get('X-Frame-Options')).toBe('DENY');
      expect(secureResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(secureResponse.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(secureResponse.headers.get('Permissions-Policy')).toContain('geolocation=()');
    });

    it('should preserve existing headers', () => {
      const response = NextResponse.json({ success: true });
      response.headers.set('Custom-Header', 'custom-value');
      
      const secureResponse = server_set_security_headers(response);
      
      expect(secureResponse.headers.get('Custom-Header')).toBe('custom-value');
      expect(secureResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should handle HSTS header in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const response = NextResponse.json({ success: true });
      const secureResponse = server_set_security_headers(response);
      
      expect(secureResponse.headers.get('Strict-Transport-Security')).toBe(
        'max-age=31536000; includeSubDomains; preload'
      );
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not set HSTS in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const response = NextResponse.json({ success: true });
      const secureResponse = server_set_security_headers(response);
      
      expect(secureResponse.headers.get('Strict-Transport-Security')).toBeUndefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should set Content-Security-Policy header', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const response = NextResponse.json({ success: true });
      const secureResponse = server_set_security_headers(response);
      
      const csp = secureResponse.headers.get('Content-Security-Policy');
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});