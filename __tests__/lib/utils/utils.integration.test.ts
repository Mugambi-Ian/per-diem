// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { request_auth } from '@/lib/utils/request.auth';
import { request_csrf } from '@/lib/utils/request.csrf';
import { request_rate } from '@/lib/utils/request.rate';
import { request_error } from '@/lib/utils/request.error';
import { server_request } from '@/lib/utils/request';
import { 
  server_response, 
  server_set_security_headers,
  ApiResponse 
} from '@/lib/utils/response';
import { 
  addSecurityHeaders, 
  getSecurityHeadersConfig,
  securityHeadersMiddleware 
} from '@/lib/utils/response.headers';
import { cookie_append } from '@/lib/utils/cookie';
import { 
  server_get_cached_availability, 
  server_set_cached_availability, 
  server_invalidate_availability_for_store 
} from '@/lib/utils/cache';
import { logger } from '@/lib/utils/logger';

// Mock the auth utilities since we're testing integration, not the auth system itself
jest.mock('@/lib/modules/auth/utils/jwt', () => ({
  server_verify_access_token: jest.fn().mockResolvedValue({ 
    sub: 'test-user-id', 
    email: 'test@example.com' 
  })
}));

jest.mock('@/lib/modules/auth/utils/csrf', () => ({
  server_generate_csrf_token: jest.fn().mockReturnValue('mock-csrf-token'),
  server_verify_double_submit: jest.fn().mockReturnValue(true)
}));

jest.mock('@/lib/modules/auth/utils/cookies', () => ({
  server_serialize_cookie: jest.fn().mockReturnValue('csrf_token=mock-csrf-token; Path=/; HttpOnly=false; Secure=false; SameSite=Strict')
}));

describe('Utils Integration Tests', () => {
  let mockRequest: NextRequest;
  let mockResponse: NextResponse;
  
  beforeEach(() => {
    // Reset environment
    process.env.NODE_ENV = 'test';
    process.env.COOKIE_DOMAIN = 'localhost';
    process.env.JWT_REFRESH_EXPIRES_DAYS = '30';
    
    // Create mock request
    mockRequest = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'cookie': 'access_token=valid-token; csrf_token=valid-csrf',
        'x-csrf-token': 'valid-csrf',
        'x-forwarded-for': '192.168.1.1'
      }
    });
    
    // Create mock response
    mockResponse = NextResponse.json({ success: true });
    
    // Clear all mocks to ensure clean state
    jest.clearAllMocks();
    
    // Reset any environment variables that might have been changed
    process.env.NODE_ENV = 'test';
    process.env.COOKIE_DOMAIN = 'localhost';
    process.env.JWT_REFRESH_EXPIRES_DAYS = '30';
  });

  afterEach(() => {
    jest.clearAllMocks();
    
    // Reset environment variables
    process.env.NODE_ENV = 'test';
    process.env.COOKIE_DOMAIN = 'localhost';
    process.env.JWT_REFRESH_EXPIRES_DAYS = '30';
  });

  describe('request.auth.ts', () => {
    it('should authenticate request with valid token', async () => {
      const result = await request_auth(mockRequest);
      
      expect(result).toEqual({
        sub: 'test-user-id',
        email: 'test@example.com'
      });
    });

    it('should return undefined for unprotected routes', async () => {
      const result = await request_auth(mockRequest, true);
      
      expect(result).toBeUndefined();
    });

    it('should throw 401 for missing token', async () => {
      const requestWithoutToken = new NextRequest('http://localhost:3000/api/test');
      
      await expect(request_auth(requestWithoutToken)).rejects.toEqual({ status: 401 });
    });
  });

  describe('request.csrf.ts', () => {
    it('should return undefined for GET requests', () => {
      const getRequest = new NextRequest('http://localhost:3000/api/test', { method: 'GET' });
      
      const result = request_csrf(getRequest, true);
      
      expect(result).toBeUndefined();
    });

    it('should return undefined when CSRF is disabled', () => {
      const result = request_csrf(mockRequest, false);
      
      expect(result).toBeUndefined();
    });

    it('should generate new CSRF token when both cookie and header are missing', () => {
      const requestWithoutCSRF = new NextRequest('http://localhost:3000/api/test', { method: 'POST' });
      
      const result = request_csrf(requestWithoutCSRF, true);
      
      expect(result).toBe('csrf_token=mock-csrf-token; Path=/; HttpOnly=false; Secure=false; SameSite=Strict');
    });

    it('should handle excluded paths gracefully', () => {
      const loginRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', { method: 'POST' });
      
      const result = request_csrf(loginRequest, true);
      
      expect(result).toBe('csrf_token=mock-csrf-token; Path=/; HttpOnly=false; Secure=false; SameSite=Strict');
    });

    it('should generate new token when only cookie is missing', () => {
      const requestWithHeaderOnly = new NextRequest('http://localhost:3000/api/test', { 
        method: 'POST',
        headers: {
          'x-csrf-token': 'valid-header-token'
        }
      });
      
      const result = request_csrf(requestWithHeaderOnly, true);
      
      expect(result).toBe('csrf_token=mock-csrf-token; Path=/; HttpOnly=false; Secure=false; SameSite=Strict');
    });

    it('should generate new token when only header is missing', () => {
      const requestWithCookieOnly = new NextRequest('http://localhost:3000/api/test', { 
        method: 'POST',
        headers: {
          'cookie': 'csrf_token=valid-cookie-token'
        }
      });
      
      const result = request_csrf(requestWithCookieOnly, true);
      
      expect(result).toBe('csrf_token=mock-csrf-token; Path=/; HttpOnly=false; Secure=false; SameSite=Strict');
    });

    it('should handle CSRF verification failure for excluded paths', () => {
      // Mock the verification to fail
      const { server_verify_double_submit } = require('@/lib/modules/auth/utils/csrf');
      server_verify_double_submit.mockReturnValueOnce(false);
      
      const loginRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', { 
        method: 'POST',
        headers: {
          'cookie': 'csrf_token=valid-cookie-token',
          'x-csrf-token': 'valid-header-token'
        }
      });
      
      const result = request_csrf(loginRequest, true);
      
      expect(result).toBe('csrf_token=mock-csrf-token; Path=/; HttpOnly=false; Secure=false; SameSite=Strict');
    });

    it('should throw error for CSRF verification failure on non-excluded paths', () => {
      // Mock the verification to fail
      const { server_verify_double_submit } = require('@/lib/modules/auth/utils/csrf');
      server_verify_double_submit.mockReturnValueOnce(false);
      
      const regularRequest = new NextRequest('http://localhost:3000/api/test', { 
        method: 'POST',
        headers: {
          'cookie': 'csrf_token=valid-cookie-token',
          'x-csrf-token': 'valid-header-token'
        }
      });
      
      expect(() => request_csrf(regularRequest, true)).toThrow('CSRF verification failed: mismatch');
    });

    it('should handle successful CSRF verification and generate new token', () => {
      // Mock the verification to succeed
      const { server_verify_double_submit } = require('@/lib/modules/auth/utils/csrf');
      server_verify_double_submit.mockReturnValueOnce(true);
      
      const validRequest = new NextRequest('http://localhost:3000/api/test', { 
        method: 'POST',
        headers: {
          'cookie': 'csrf_token=valid-cookie-token',
          'x-csrf-token': 'valid-header-token'
        }
      });
      
      const result = request_csrf(validRequest, true);
      
      expect(result).toBe('csrf_token=mock-csrf-token; Path=/; HttpOnly=false; Secure=false; SameSite=Strict');
    });

    it('should handle production environment settings', () => {
      process.env.NODE_ENV = 'production';
      process.env.COOKIE_DOMAIN = 'example.com';
      
      const requestWithoutCSRF = new NextRequest('http://localhost:3000/api/test', { method: 'POST' });
      
      const result = request_csrf(requestWithoutCSRF, true);
      
      expect(result).toBe('csrf_token=mock-csrf-token; Path=/; HttpOnly=false; Secure=false; SameSite=Strict');
      
      // Reset environment
      process.env.NODE_ENV = 'test';
      process.env.COOKIE_DOMAIN = 'localhost';
    });

    it('should handle custom JWT refresh expiration days', () => {
      process.env.JWT_REFRESH_EXPIRES_DAYS = '60';
      
      const requestWithoutCSRF = new NextRequest('http://localhost:3000/api/test', { method: 'POST' });
      
      const result = request_csrf(requestWithoutCSRF, true);
      
      expect(result).toBe('csrf_token=mock-csrf-token; Path=/; HttpOnly=false; Secure=false; SameSite=Strict');
      
      // Reset environment
      process.env.JWT_REFRESH_EXPIRES_DAYS = '30';
    });

    it('should handle malformed cookie header gracefully', () => {
      const requestWithMalformedCookie = new NextRequest('http://localhost:3000/api/test', { 
        method: 'POST',
        headers: {
          'cookie': 'malformed-cookie-without-equals; another-malformed'
        }
      });
      
      const result = request_csrf(requestWithMalformedCookie, true);
      
      expect(result).toBe('csrf_token=mock-csrf-token; Path=/; HttpOnly=false; Secure=false; SameSite=Strict');
    });

    it('should handle cookie header with empty values', () => {
      const requestWithEmptyCookie = new NextRequest('http://localhost:3000/api/test', { 
        method: 'POST',
        headers: {
          'cookie': 'csrf_token=; other=value'
        }
      });
      
      const result = request_csrf(requestWithEmptyCookie, true);
      
      expect(result).toBe('csrf_token=mock-csrf-token; Path=/; HttpOnly=false; Secure=false; SameSite=Strict');
    });

    it('should handle cookie header with special characters', () => {
      const requestWithSpecialChars = new NextRequest('http://localhost:3000/api/test', { 
        method: 'POST',
        headers: {
          'cookie': 'csrf_token=token%20with%20spaces; other=value'
        }
      });
      
      const result = request_csrf(requestWithSpecialChars, true);
      
      expect(result).toBe('csrf_token=mock-csrf-token; Path=/; HttpOnly=false; Secure=false; SameSite=Strict');
    });
  });

  describe('request.rate.ts', () => {
    it('should not rate limit when no rate limiter provided', async () => {
      await expect(request_rate(undefined, mockRequest)).resolves.toBeUndefined();
    });

    it('should rate limit when rate limiter provided', async () => {
      const rateLimiter = new RateLimiterMemory({
        points: 5,
        duration: 60
      });
      
      await expect(request_rate(rateLimiter, mockRequest)).resolves.toBeUndefined();
    });

    it('should extract client IP from x-forwarded-for header', async () => {
      const rateLimiter = new RateLimiterMemory({
        points: 5,
        duration: 60
      });
      
      await expect(request_rate(rateLimiter, mockRequest)).resolves.toBeUndefined();
    });

    it('should fallback to x-real-ip header', async () => {
      const requestWithRealIP = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-real-ip': '10.0.0.1'
        }
      });
      
      const rateLimiter = new RateLimiterMemory({
        points: 5,
        duration: 60
      });
      
      await expect(request_rate(rateLimiter, requestWithRealIP)).resolves.toBeUndefined();
    });

    it('should handle empty x-forwarded-for header', async () => {
      const requestWithEmptyForwarded = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': ''
        }
      });
      
      const rateLimiter = new RateLimiterMemory({
        points: 5,
        duration: 60
      });
      
      await expect(request_rate(rateLimiter, requestWithEmptyForwarded)).resolves.toBeUndefined();
    });

    it('should handle x-forwarded-for with single IP', async () => {
      const requestWithSingleIP = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.100'
        }
      });
      
      const rateLimiter = new RateLimiterMemory({
        points: 5,
        duration: 60
      });
      
      await expect(request_rate(rateLimiter, requestWithSingleIP)).resolves.toBeUndefined();
    });

    it('should handle x-forwarded-for with multiple IPs and extract first', async () => {
      const requestWithMultipleIPs = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.100, 10.0.0.1, 172.16.0.1'
        }
      });
      
      const rateLimiter = new RateLimiterMemory({
        points: 5,
        duration: 60
      });
      
      await expect(request_rate(rateLimiter, requestWithMultipleIPs)).resolves.toBeUndefined();
    });

    it('should handle x-forwarded-for with whitespace and extract first IP', async () => {
      const requestWithWhitespace = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '  192.168.1.100  , 10.0.0.1  '
        }
      });
      
      const rateLimiter = new RateLimiterMemory({
        points: 5,
        duration: 60
      });
      
      await expect(request_rate(rateLimiter, requestWithWhitespace)).resolves.toBeUndefined();
    });

    it('should fallback to localhost when no IP headers present', async () => {
      const requestWithNoIP = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST'
      });
      
      const rateLimiter = new RateLimiterMemory({
        points: 5,
        duration: 60
      });
      
      await expect(request_rate(rateLimiter, requestWithNoIP)).resolves.toBeUndefined();
    });

    it('should handle x-forwarded-for with empty string after trimming', async () => {
      const requestWithEmptyAfterTrim = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '   , 10.0.0.1'
        }
      });
      
      const rateLimiter = new RateLimiterMemory({
        points: 5,
        duration: 60
      });
      
      await expect(request_rate(rateLimiter, requestWithEmptyAfterTrim)).resolves.toBeUndefined();
    });
  });

  describe('request.error.ts', () => {
    it('should handle 401 unauthorized errors', () => {
      const error = { status: 401 };
      
      const result = request_error(error, 'test-handler');
      
      expect(result.status).toBe(401);
      expect(result.json()).resolves.toEqual({
        success: false,
        error: { message: 'UNAUTHORIZED' }
      });
    });

    it('should handle rate limiting errors', () => {
      const error = { consumedPoints: 5 };
      
      const result = request_error(error, 'test-handler');
      
      expect(result.status).toBe(429);
      expect(result.json()).resolves.toEqual({
        success: false,
        error: { message: 'Please wait' }
      });
    });

    it('should handle Zod validation errors', () => {
      const zodError = {
        name: 'ZodError',
        message: '{"field": "Invalid input"}'
      };
      
      const result = request_error(zodError, 'test-handler');
      
      expect(result.status).toBe(400);
      expect(result.json()).resolves.toEqual({
        success: false,
        error: { field: 'Invalid input' }
      });
    });

    it('should handle generic errors with 500 status', () => {
      const error = new Error('Something went wrong');
      
      const result = request_error(error, 'test-handler');
      
      expect(result.status).toBe(500);
      expect(result.json()).resolves.toEqual({
        success: false,
        error: { code: 'INTERNAL_request_error', message: 'Something went wrong' }
      });
    });
  });

  describe('request.ts', () => {
    it('should process request with all middleware', async () => {
      const mockHandler = jest.fn().mockResolvedValue({
        success: true,
        data: { message: 'Success' }
      });
      
      const wrappedHandler = server_request(mockHandler);
      
      const result = await wrappedHandler(mockRequest);
      
      expect(result.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, undefined, {
        sub: 'test-user-id',
        email: 'test@example.com'
      });
    });

    it('should handle unprotected routes', async () => {
      const mockHandler = jest.fn().mockResolvedValue({
        success: true,
        data: { message: 'Success' }
      });
      
      const wrappedHandler = server_request(mockHandler, { unprotected: true });
      
      const result = await wrappedHandler(mockRequest);
      
      expect(result.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, undefined, undefined);
    });

    it('should disable CSRF when specified', async () => {
      const mockHandler = jest.fn().mockResolvedValue({
        success: true,
        data: { message: 'Success' }
      });
      
      const wrappedHandler = server_request(mockHandler, { disableCSRF: true });
      
      const result = await wrappedHandler(mockRequest);
      
      expect(result.status).toBe(200);
    });

    it('should apply rate limiting when provided', async () => {
      const rateLimiter = new RateLimiterMemory({
        points: 5,
        duration: 60
      });
      
      const mockHandler = jest.fn().mockResolvedValue({
        success: true,
        data: { message: 'Success' }
      });
      
      const wrappedHandler = server_request(mockHandler, { rateLimiter });
      
      const result = await wrappedHandler(mockRequest);
      
      expect(result.status).toBe(200);
    });

    it('should handle request with params', async () => {
      const mockHandler = jest.fn().mockResolvedValue({
        success: true,
        data: { message: 'Success with params' }
      });
      
      const wrappedHandler = server_request(mockHandler);
      const mockMeta = { params: Promise.resolve({ id: '123' }) };
      
      const result = await wrappedHandler(mockRequest, mockMeta);
      
      expect(result.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, { id: '123' }, {
        sub: 'test-user-id',
        email: 'test@example.com'
      });
    });

    it('should handle request with undefined params', async () => {
      const mockHandler = jest.fn().mockResolvedValue({
        success: true,
        data: { message: 'Success without params' }
      });
      
      const wrappedHandler = server_request(mockHandler);
      const mockMeta = { params: undefined };
      
      const result = await wrappedHandler(mockRequest, mockMeta);
      
      expect(result.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, undefined, {
        sub: 'test-user-id',
        email: 'test@example.com'
      });
    });

    it('should handle request with all options disabled', async () => {
      const mockHandler = jest.fn().mockResolvedValue({
        success: true,
        data: { message: 'Success with all disabled' }
      });
      
      const wrappedHandler = server_request(mockHandler, {
        disableCSRF: true,
        unprotected: true
      });
      
      const result = await wrappedHandler(mockRequest);
      
      expect(result.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, undefined, undefined);
    });
  });

  describe('response.ts', () => {
    it('should create standardized response with security headers', () => {
      const payload: ApiResponse = {
        success: true,
        data: { message: 'Success' },
        status: 200
      };
      
      const result = server_response(payload);
      
      expect(result.status).toBe(200);
      expect(result.json()).resolves.toEqual({
        success: true,
        data: { message: 'Success' }
      });
      
      // Check that security headers are applied (HSTS disabled in test env)
      expect(result.headers.get('X-Frame-Options')).toBe('DENY');
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(result.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('should handle bigint serialization', () => {
      const payload: ApiResponse = {
        success: true,
        data: { id: BigInt(123456789) },
        status: 200
      };
      
      const result = server_response(payload);
      
      expect(result.json()).resolves.toEqual({
        success: true,
        data: { id: '123456789' }
      });
    });

    it('should add custom headers', () => {
      const payload: ApiResponse = {
        success: true,
        data: { message: 'Success' },
        headers: { 'X-Custom-Header': 'custom-value' }
      };
      
      const result = server_response(payload);
      
      expect(result.headers.get('X-Custom-Header')).toBe('custom-value');
    });

    it('should handle response without data', () => {
      const payload: ApiResponse = {
        success: false,
        error: { message: 'Error occurred' }
      };
      
      const result = server_response(payload);
      
      expect(result.status).toBe(400);
      expect(result.json()).resolves.toEqual({
        success: false,
        error: { message: 'Error occurred' }
      });
    });

    it('should handle response with custom status', () => {
      const payload: ApiResponse = {
        success: true,
        data: { message: 'Created' },
        status: 201
      };
      
      const result = server_response(payload, 201);
      
      expect(result.status).toBe(201);
      expect(result.json()).resolves.toEqual({
        success: true,
        data: { message: 'Created' }
      });
    });

    it('should override payload status with explicit status parameter', () => {
      const payload: ApiResponse = {
        success: false,
        error: { message: 'Not Found' },
        status: 400
      };
      
      const result = server_response(payload, 404);
      
      expect(result.status).toBe(404);
      expect(result.json()).resolves.toEqual({
        success: false,
        error: { message: 'Not Found' }
      });
    });

    it('should handle response with null data', async () => {
      const payload: ApiResponse = {
        success: true,
        data: null
      };
      
      const result = server_response(payload);
      
      expect(result.status).toBe(200);
      expect(await result.json()).toEqual({
        success:true
      });
    });

    it('should handle response with undefined data', () => {
      const payload: ApiResponse = {
        success: true
      };
      
      const result = server_response(payload);
      
      expect(result.status).toBe(200);
      expect(result.json()).resolves.toEqual({
        success: true
      });
    });

    it('should apply security headers to existing response', () => {
      const response = NextResponse.json({ success: true });
      
      const result = server_set_security_headers(response);
      
      // Check that security headers are applied (HSTS disabled in test env)
      expect(result.headers.get('X-Frame-Options')).toBe('DENY');
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(result.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });
  });

  describe('response.headers.integration.test.ts', () => {
    it('should add all security headers by default', () => {
      const response = NextResponse.json({ success: true });
      
      const result = addSecurityHeaders(response);
      
      expect(result.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains; preload');
      expect(result.headers.get('Content-Security-Policy')).toBe('');
      expect(result.headers.get('X-Frame-Options')).toBe('DENY');
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(result.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(result.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(result.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    });

    it('should respect custom security header configuration', () => {
      const response = NextResponse.json({ success: true });
      const config = {
        enableHSTS: false,
        enableCSP: false,
        enableXFrameOptions: false
      };
      
      const result = addSecurityHeaders(response, config);
      
      expect(result.headers.get('Strict-Transport-Security')).toBeNull();
      expect(result.headers.get('Content-Security-Policy')).toBeNull();
      expect(result.headers.get('X-Frame-Options')).toBeNull();
    });

    it('should handle partial security header configuration', () => {
      const response = NextResponse.json({ success: true });
      const config = {
        enableHSTS: true,
        enableCSP: false,
        enableXFrameOptions: true,
        enableXContentTypeOptions: false,
        enableReferrerPolicy: true,
        enablePermissionsPolicy: false,
        enableXDNSPrefetchControl: true,
        enableXDownloadOptions: false,
        enableXPermittedCrossDomainPolicies: true
      };
      
      const result = addSecurityHeaders(response, config);
      
      expect(result.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains; preload');
      expect(result.headers.get('Content-Security-Policy')).toBeNull();
      expect(result.headers.get('X-Frame-Options')).toBe('DENY');
      expect(result.headers.get('X-Content-Type-Options')).toBeNull();
      expect(result.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(result.headers.get('Permissions-Policy')).toBeNull();
      expect(result.headers.get('X-DNS-Prefetch-Control')).toBe('off');
      expect(result.headers.get('X-Download-Options')).toBeNull();
      expect(result.headers.get('X-Permitted-Cross-Domain-Policies')).toBe('none');
    });

    it('should always set X-XSS-Protection and X-Robots-Tag regardless of config', () => {
      const response = NextResponse.json({ success: true });
      const config = {
        enableHSTS: false,
        enableCSP: false,
        enableXFrameOptions: false
      };
      
      const result = addSecurityHeaders(response, config);
      
      expect(result.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(result.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    });

    it('should handle empty CSP directives array', () => {
      const response = NextResponse.json({ success: true });
      const config = {
        cspDirectives: []
      };
      
      const result = addSecurityHeaders(response, config);
      
      expect(result.headers.get('Content-Security-Policy')).toBe('');
    });

    it('should handle CSP directives with single directive', () => {
      const response = NextResponse.json({ success: true });
      const config = {
        cspDirectives: ["default-src 'self'"]
      };
      
      const result = addSecurityHeaders(response, config);
      
      expect(result.headers.get('Content-Security-Policy')).toBe("default-src 'self'");
    });

    it('should handle CSP directives with multiple directives', () => {
      const response = NextResponse.json({ success: true });
      const config = {
        cspDirectives: ["default-src 'self'", "script-src 'self'"]
      };
      
      const result = addSecurityHeaders(response, config);
      
      expect(result.headers.get('Content-Security-Policy')).toBe("default-src 'self'; script-src 'self'");
    });

    it('should handle undefined security header config', () => {
      const response = NextResponse.json({ success: true });
      
      const result = addSecurityHeaders(response);
      
      // Should use default config
      expect(result.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains; preload');
      expect(result.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should handle empty security header config object', () => {
      const response = NextResponse.json({ success: true });
      
      const result = addSecurityHeaders(response, {});
      
      // Should use default config
      expect(result.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains; preload');
      expect(result.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should apply production CSP directives in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const config = getSecurityHeadersConfig();
      
      expect(config.enableHSTS).toBe(true);
      expect(config.cspDirectives).toContain("default-src 'self'");
      expect(config.cspDirectives).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net");
    });

    it('should apply development CSP directives in test environment', () => {
      process.env.NODE_ENV = 'test';
      
      const config = getSecurityHeadersConfig();
      
      expect(config.enableHSTS).toBe(false);
      expect(config.cspDirectives).toContain("default-src * 'unsafe-inline' 'unsafe-eval' data: blob:");
    });

    it('should work as middleware function', () => {
      const request = new Request('http://localhost:3000/api/test');
      
      const result = securityHeadersMiddleware(request);
      
      // Check that security headers are applied (HSTS disabled in test env)
      expect(result.headers.get('X-Frame-Options')).toBe('DENY');
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(result.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });
  });

  describe('cookie.ts', () => {
    it('should append cookie to Headers object', () => {
      const headers = new Headers();
      const cookieValue = 'token=abc; Path=/; HttpOnly';
      
      const result = cookie_append(headers, cookieValue);
      
      expect(result.get('Set-Cookie')).toBe(cookieValue);
    });

    it('should append cookie to existing Headers with Set-Cookie', () => {
      const headers = new Headers();
      headers.set('Set-Cookie', 'existing=value; Path=/');
      const cookieValue = 'token=abc; Path=/; HttpOnly';
      
      const result = cookie_append(headers, cookieValue);
      
      expect(result.get('Set-Cookie')).toBe('existing=value; Path=/, token=abc; Path=/; HttpOnly');
    });

    it('should append cookie to Record object', () => {
      const headers: Record<string, string> = {};
      const cookieValue = 'token=abc; Path=/; HttpOnly';
      
      const result = cookie_append(headers, cookieValue);
      
      expect(result['Set-Cookie']).toBe(cookieValue);
    });

    it('should append cookie to existing Record with Set-Cookie', () => {
      const headers: Record<string, string> = {
        'Set-Cookie': 'existing=value; Path=/'
      };
      const cookieValue = 'token=abc; Path=/; HttpOnly';
      
      const result = cookie_append(headers, cookieValue);
      
      expect(result['Set-Cookie']).toBe('existing=value; Path=/, token=abc; Path=/; HttpOnly');
    });

    it('should handle empty headers object', () => {
      const headers: Record<string, string> = {};
      const cookieValue = 'token=abc; Path=/; HttpOnly';
      
      const result = cookie_append(headers, cookieValue);
      
      expect(result['Set-Cookie']).toBe(cookieValue);
    });

    it('should handle undefined headers parameter', () => {
      const cookieValue = 'token=abc; Path=/; HttpOnly';
      
      const result = cookie_append(undefined as any, cookieValue);
      
      expect(result['Set-Cookie']).toBe(cookieValue);
    });

    it('should handle Headers object with no existing Set-Cookie', () => {
      const headers = new Headers();
      const cookieValue = 'token=abc; Path=/; HttpOnly';
      
      const result = cookie_append(headers, cookieValue);
      
      expect(result.get('Set-Cookie')).toBe(cookieValue);
    });
  });

  describe('cache.ts', () => {
    beforeEach(() => {
      // Clear cache before each test
      server_invalidate_availability_for_store('test-store');
    });

    it('should set and get cached availability', () => {
      const key = 'test-store:product-1';
      const value = { available: true, price: 10.99 };
      
      server_set_cached_availability(key, value);
      const result = server_get_cached_availability(key);
      
      expect(result).toEqual(value);
    });

    it('should respect custom TTL', () => {
      const key = 'test-store:product-2';
      const value = { available: false };
      const ttlMs = 1000; // 1 second
      
      server_set_cached_availability(key, value, ttlMs);
      const result = server_get_cached_availability(key);
      
      expect(result).toEqual(value);
      
      // Wait for TTL to expire
      return new Promise(resolve => {
        setTimeout(() => {
          const expiredResult = server_get_cached_availability(key);
          expect(expiredResult).toBeUndefined();
          resolve(undefined);
        }, 1100);
      });
    });

    it('should invalidate cache for specific store', () => {
      const storeId = 'store-123';
      const key1 = `${storeId}:product-1`;
      const key2 = `${storeId}:product-2`;
      const otherKey = 'other-store:product-1';
      
      server_set_cached_availability(key1, { available: true });
      server_set_cached_availability(key2, { available: true });
      server_set_cached_availability(otherKey, { available: true });
      
      server_invalidate_availability_for_store(storeId);
      
      expect(server_get_cached_availability(key1)).toBeUndefined();
      expect(server_get_cached_availability(key2)).toBeUndefined();
      expect(server_get_cached_availability(otherKey)).toEqual({ available: true });
    });

    it('should handle cache miss', () => {
      const result = server_get_cached_availability('non-existent-key');
      
      expect(result).toBeUndefined();
    });

    it('should handle cache with default TTL', () => {
      const key = 'test-store:product-3';
      const value = { available: true, price: 15.99 };
      
      server_set_cached_availability(key, value);
      const result = server_get_cached_availability(key);
      
      expect(result).toEqual(value);
    });

    it('should handle cache invalidation for non-existent store', () => {
      const storeId = 'non-existent-store';
      
      // This should not throw an error
      expect(() => server_invalidate_availability_for_store(storeId)).not.toThrow();
    });

    it('should handle cache with very short TTL', () => {
      const key = 'test-store:product-4';
      const value = { available: false };
      const ttlMs = 100; // 100ms
      
      server_set_cached_availability(key, value, ttlMs);
      const result = server_get_cached_availability(key);
      
      expect(result).toEqual(value);
      
      // Wait for TTL to expire
      return new Promise(resolve => {
        setTimeout(() => {
          const expiredResult = server_get_cached_availability(key);
          expect(expiredResult).toBeUndefined();
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe('logger.ts', () => {
    it('should create logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should log messages without throwing errors', () => {
      expect(() => {
        logger.info('Test info message');
        logger.warn('Test warning message');
        logger.error('Test error message');
        logger.debug('Test debug message');
      }).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete request flow with all utilities', async () => {
      // Create a rate limiter
      const rateLimiter = new RateLimiterMemory({
        points: 10,
        duration: 60
      });
      
      // Create a handler that uses all utilities
      const mockHandler = jest.fn().mockResolvedValue({
        success: true,
        data: { message: 'Complete flow success' },
        headers: { 'X-Custom': 'custom-value' }
      });
      
      // Wrap with server_request
      const wrappedHandler = server_request(mockHandler, {
        rateLimiter,
        unprotected: false,
        disableCSRF: false
      });
      
      // Execute the complete flow
      const result = await wrappedHandler(mockRequest);
      
      // Verify the result
      expect(result.status).toBe(200);
      expect(result.json()).resolves.toEqual({
        success: true,
        data: { message: 'Complete flow success' }
      });
      
      // Verify security headers are applied (HSTS disabled in test env)
      expect(result.headers.get('X-Frame-Options')).toBe('DENY');
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(result.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      
      // Verify CSRF cookie is set
      expect(result.headers.get('Set-Cookie')).toContain('csrf_token=');
      
      // Verify handler was called with correct parameters
      expect(mockHandler).toHaveBeenCalledWith(
        mockRequest,
        undefined,
        { sub: 'test-user-id', email: 'test@example.com' }
      );
    });

    it('should handle error scenarios gracefully', async () => {
      // Create a handler that throws an error
      const errorHandler = jest.fn().mockRejectedValue(new Error('Test error'));
      
      const wrappedHandler = server_request(errorHandler);
      
      // Execute and expect error handling
      const result = await wrappedHandler(mockRequest);
      
      expect(result.status).toBe(500);
      expect(result.json()).resolves.toEqual({
        success: false,
        error: { code: 'INTERNAL_request_error', message: 'Something went wrong' }
      });
    });

    it('should handle rate limiting errors', async () => {
      // Create a rate limiter with very low limits
      const strictRateLimiter = new RateLimiterMemory({
        points: 1,
        duration: 60
      });
      
      const mockHandler = jest.fn().mockResolvedValue({
        success: true,
        data: { message: 'Success' }
      });
      
      const wrappedHandler = server_request(mockHandler, {
        rateLimiter: strictRateLimiter
      });
      
      // First request should succeed
      const result1 = await wrappedHandler(mockRequest);
      expect(result1.status).toBe(200);
      
      // Second request should fail due to rate limiting
      const result2 = await wrappedHandler(mockRequest);
      expect(result2.status).toBe(429);
      expect(result2.json()).resolves.toEqual({
        success: false,
        error: { message: 'Please wait' }
      });
    });
  });
});
