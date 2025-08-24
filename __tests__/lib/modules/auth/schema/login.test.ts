import { describe, it, expect } from '@jest/globals';
import { loginSchema } from '@/lib/modules/auth/schema/login';

describe('Login Schema', () => {
  describe('Valid login data', () => {
    it('should validate complete login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        timezone: 'America/New_York'
      };

      const result = loginSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should validate login data without timezone', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      const result = loginSchema.parse(validData);

      expect(result.email).toBe(validData.email);
      expect(result.password).toBe(validData.password);
      expect(result.timezone).toBeUndefined();
    });

    it('should validate with complex timezone', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        timezone: 'Europe/London'
      };

      const result = loginSchema.parse(validData);

      expect(result.timezone).toBe('Europe/London');
    });
  });

  describe('Email validation', () => {
    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'SecurePass123!'
      };

      expect(() => loginSchema.parse(invalidData))
        .toThrow();
    });

    it('should reject email without domain', () => {
      const invalidData = {
        email: 'test@',
        password: 'SecurePass123!'
      };

      expect(() => loginSchema.parse(invalidData))
        .toThrow();
    });

    it('should reject email without @ symbol', () => {
      const invalidData = {
        email: 'testexample.com',
        password: 'SecurePass123!'
      };

      expect(() => loginSchema.parse(invalidData))
        .toThrow();
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        '123@numbers.com',
        'user@subdomain.example.com'
      ];

      validEmails.forEach(email => {
        const validData = {
          email,
          password: 'SecurePass123!'
        };

        expect(() => loginSchema.parse(validData)).not.toThrow();
      });
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'SecurePass123!'
      };

      expect(() => loginSchema.parse(invalidData))
        .toThrow();
    });

    it('should reject email with only whitespace', () => {
      const invalidData = {
        email: '   ',
        password: 'SecurePass123!'
      };

      expect(() => loginSchema.parse(invalidData))
        .toThrow();
    });
  });

  describe('Password validation', () => {
    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: ''
      };

      expect(() => loginSchema.parse(invalidData))
        .toThrow();
    });

    it('should reject password with only whitespace', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '   '
      };

      expect(() => loginSchema.parse(invalidData))
        .toThrow();
    });

    it('should accept valid strong passwords', () => {
      const validPasswords = [
        'SecurePass123!',
        'MyPassword456@',
        'StrongPass789#',
        'ValidPass321$'
      ];

      validPasswords.forEach(password => {
        const validData = {
          email: 'test@example.com',
          password
        };

        expect(() => loginSchema.parse(validData)).not.toThrow();
      });
    });
  });

  describe('Timezone validation', () => {
    it('should accept valid IANA timezone identifiers', () => {
      const validTimezones = [
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
        'UTC',
        'GMT',
        'America/Los_Angeles',
        'Europe/Paris',
        'Asia/Shanghai'
      ];

      validTimezones.forEach(timezone => {
        const validData = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          timezone
        };

        expect(() => loginSchema.parse(validData)).not.toThrow();
      });
    });

    it('should reject invalid timezone format', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        timezone: 'Invalid/Timezone'
      };

      expect(() => loginSchema.parse(invalidData))
        .toThrow();
    });

    it('should reject timezone with invalid characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        timezone: 'America/New_York!'
      };

      expect(() => loginSchema.parse(invalidData))
        .toThrow();
    });

    it('should reject timezone with spaces', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        timezone: 'America/New York'
      };

      expect(() => loginSchema.parse(invalidData))
        .toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle missing required fields', () => {
      const incompleteData = {
        email: 'test@example.com',
        // Missing password
      };

      expect(() => loginSchema.parse(incompleteData))
        .toThrow();
    });

    it('should handle extra fields gracefully', () => {
      const extraData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        timezone: 'America/New_York',
        extraField: 'should be ignored',
        anotherField: 123,
        rememberMe: true
      };

      const result = loginSchema.parse(extraData);

      expect(result.email).toBe('test@example.com');
      expect(result.password).toBe('SecurePass123!');
      expect(result.timezone).toBe('America/New_York');
      expect((result as any).extraField).toBeUndefined();
      expect((result as any).anotherField).toBeUndefined();
      expect((result as any).rememberMe).toBeUndefined();
    });

    it('should handle null values appropriately', () => {
      const nullData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        timezone: null
      };

      expect(() => loginSchema.parse(nullData))
        .toThrow();
    });

    it('should handle undefined values appropriately', () => {
      const undefinedData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        timezone: undefined
      };

      const result = loginSchema.parse(undefinedData);

      expect(result.email).toBe('test@example.com');
      expect(result.password).toBe('SecurePass123!');
      expect(result.timezone).toBeUndefined();
    });
  });

  describe('Schema structure', () => {
    it('should have correct field types', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        timezone: 'America/New_York'
      };

      const result = loginSchema.parse(validData);

      expect(typeof result.email).toBe('string');
      expect(typeof result.password).toBe('string');
      expect(typeof result.timezone).toBe('string');
    });

    it('should handle whitespace trimming', () => {
      const dataWithWhitespace = {
        email: '  test@example.com  ',
        password: '  SecurePass123!  ',
        timezone: '  America/New_York  '
      };

      const result = loginSchema.parse(dataWithWhitespace);

      expect(result.email).toBe('test@example.com');
      expect(result.password).toBe('SecurePass123!');
      expect(result.timezone).toBe('America/New_York');
    });
  });
});
