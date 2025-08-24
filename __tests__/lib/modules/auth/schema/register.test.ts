import { describe, it, expect } from '@jest/globals';
import { schema_register } from '@/lib/modules/auth/schema/register';

describe('Register Schema', () => {
  describe('Valid registration data', () => {
    it('should validate complete registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        fullName: 'John Doe',
        timezone: 'America/New_York'
      };

      const result = schema_register.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should validate registration data without timezone', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        fullName: 'John Doe'
      };

      const result = schema_register.parse(validData);

      expect(result.email).toBe(validData.email);
      expect(result.password).toBe(validData.password);
      expect(result.fullName).toBe(validData.fullName);
      expect(result.timezone).toBeUndefined();
    });

    it('should validate with complex timezone', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        fullName: 'John Doe',
        timezone: 'Europe/London'
      };

      const result = schema_register.parse(validData);

      expect(result.timezone).toBe('Europe/London');
    });

    it('should validate with special characters in name', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        fullName: 'José María O\'Connor-Smith',
        timezone: 'America/Los_Angeles'
      };

      const result = schema_register.parse(validData);

      expect(result.fullName).toBe('José María O\'Connor-Smith');
    });

    it('should validate with unicode characters', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        fullName: '李小明',
        timezone: 'Asia/Shanghai'
      };

      const result = schema_register.parse(validData);

      expect(result.fullName).toBe('李小明');
    });
  });

  describe('Email validation', () => {
    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        fullName: 'John Doe'
      };

      expect(() => schema_register.parse(invalidData))
        .toThrow();
    });

    it('should reject email without domain', () => {
      const invalidData = {
        email: 'test@',
        password: 'SecurePassword123!',
        fullName: 'John Doe'
      };

      expect(() => schema_register.parse(invalidData))
        .toThrow();
    });

    it('should reject email without @ symbol', () => {
      const invalidData = {
        email: 'testexample.com',
        password: 'SecurePassword123!',
        fullName: 'John Doe'
      };

      expect(() => schema_register.parse(invalidData))
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
          password: 'SecurePassword123!',
          fullName: 'John Doe'
        };

        expect(() => schema_register.parse(validData)).not.toThrow();
      });
    });
  });

  describe('Password validation', () => {
    it('should reject password shorter than 12 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Short1!',
        fullName: 'John Doe'
      };

      expect(() => schema_register.parse(invalidData))
        .toThrow();
    });

    it('should reject password without uppercase letter', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'lowercase123!',
        fullName: 'John Doe'
      };

      expect(() => schema_register.parse(invalidData))
        .toThrow();
    });

    it('should reject password without lowercase letter', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'UPPERCASE123!',
        fullName: 'John Doe'
      };

      expect(() => schema_register.parse(invalidData))
        .toThrow();
    });

    it('should reject password without number', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'NoNumbers!',
        fullName: 'John Doe'
      };

      expect(() => schema_register.parse(invalidData))
        .toThrow();
    });

    it('should reject password without special character', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'NoSpecialChar123',
        fullName: 'John Doe'
      };

      expect(() => schema_register.parse(invalidData))
        .toThrow();
    });

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'SecurePassword123!',
        'My@Secure#Pass$123',
        'Complex_Password-456',
        'StrongPass789!@#',
        'VerySecurePass123!@#$%'
      ];

      strongPasswords.forEach(password => {
        const validData = {
          email: 'test@example.com',
          password,
          fullName: 'John Doe'
        };

        expect(() => schema_register.parse(validData)).not.toThrow();
      });
    });
  });

  describe('Full name validation', () => {
    it('should reject empty full name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        fullName: ''
      };

      expect(() => schema_register.parse(invalidData))
        .toThrow();
    });

    it('should reject full name with only whitespace', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        fullName: '   '
      };

      expect(() => schema_register.parse(invalidData))
        .toThrow();
    });

    it('should reject very long full name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        fullName: 'A'.repeat(256) // Too long
      };

      expect(() => schema_register.parse(invalidData))
        .toThrow();
    });

    it('should accept valid full names', () => {
      const validNames = [
        'John Doe',
        'Mary Jane Watson',
        'José María García',
        '李小明',
        'O\'Connor-Smith',
        'Jean-Pierre Dupont'
      ];

      validNames.forEach(name => {
        const validData = {
          email: 'test@example.com',
          password: 'SecurePassword123!',
          fullName: name
        };

        expect(() => schema_register.parse(validData)).not.toThrow();
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
        'GMT'
      ];

      validTimezones.forEach(timezone => {
        const validData = {
          email: 'test@example.com',
          password: 'SecurePassword123!',
          fullName: 'John Doe',
          timezone
        };

        expect(() => schema_register.parse(validData)).not.toThrow();
      });
    });

    it('should reject invalid timezone format', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        fullName: 'John Doe',
        timezone: 'Invalid/Timezone'
      };

      expect(() => schema_register.parse(invalidData))
        .toThrow();
    });

    it('should reject timezone with invalid characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        fullName: 'John Doe',
        timezone: 'America/New_York!'
      };

      expect(() => schema_register.parse(invalidData))
        .toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle missing required fields', () => {
      const incompleteData = {
        email: 'test@example.com',
        // Missing password and fullName
      };

      expect(() => schema_register.parse(incompleteData))
        .toThrow();
    });

    it('should handle extra fields gracefully', () => {
      const extraData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        fullName: 'John Doe',
        extraField: 'should be ignored',
        anotherField: 123
      };

      const result = schema_register.parse(extraData);

      expect(result.email).toBe('test@example.com');
      expect(result.password).toBe('SecurePassword123!');
      expect(result.fullName).toBe('John Doe');
      expect((result as any).extraField).toBeUndefined();
      expect((result as any).anotherField).toBeUndefined();
    });

    it('should handle null values appropriately', () => {
      const nullData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        fullName: 'John Doe',
        timezone: null
      };

      expect(() => schema_register.parse(nullData))
        .toThrow();
    });
  });
});

