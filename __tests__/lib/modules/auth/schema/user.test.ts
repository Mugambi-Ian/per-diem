import { describe, it, expect } from '@jest/globals';
import { schema_user } from '@/lib/modules/auth/schema/user';
import {DateTime, IANAZone} from "luxon";

describe('User Schema', () => {
  describe('Valid user data', () => {
    it('should validate complete user data', () => {
      const validData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'John Doe',
        timezone: 'America/New_York',
        avocado: true,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      const result = schema_user.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should validate user data without optional fields', () => {
      const validData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'John Doe',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      const result = schema_user.parse(validData);

      expect(result.id).toBe(validData.id);
      expect(result.email).toBe(validData.email);
      expect(result.fullName).toBe(validData.fullName);
      expect(result.timezone).toBeUndefined();
      expect(result.avocado).toBe(true); // Default value
    });

    it('should validate with complex timezone', () => {
      const validData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'John Doe',
        timezone: 'Europe/London',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      const result = schema_user.parse(validData);

      expect(result.timezone).toBe('Europe/London');
    });

    it('should validate with special characters in name', () => {
      const validData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'José María O\'Connor-Smith',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      const result = schema_user.parse(validData);

      expect(result.fullName).toBe('José María O\'Connor-Smith');
    });

    it('should validate with unicode characters', () => {
      const validData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: '李小明',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      const result = schema_user.parse(validData);

      expect(result.fullName).toBe('李小明');
    });

    it('should validate with false avocado value', () => {
      const validData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'John Doe',
        avocado: false,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      const result = schema_user.parse(validData);

      expect(result.avocado).toBe(false);
    });
  });

  describe('ID validation', () => {
    it('should reject empty ID', () => {
      const invalidData = {
        id: '',
        email: 'test@example.com',
        fullName: 'John Doe',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      expect(() => schema_user.parse(invalidData))
        .toThrow();
    });

    it('should reject ID with only whitespace', () => {
      const invalidData = {
        id: '   ',
        email: 'test@example.com',
        fullName: 'John Doe',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      expect(() => schema_user.parse(invalidData))
        .toThrow();
    });

    it('should accept various ID formats', () => {
      const validIds = [
        'user-123',
        'clx1234567890abcdef',
        '1234567890',
        'user_name_123',
        'user@domain.com'
      ];

      validIds.forEach(id => {
        const validData = {
          id,
          email: 'test@example.com',
          fullName: 'John Doe',
          createdAt: new Date('2023-01-01T00:00:00Z'),
          updatedAt: new Date('2023-01-02T00:00:00Z')
        };

        expect(() => schema_user.parse(validData)).not.toThrow();
      });
    });
  });

  describe('Email validation', () => {
    it('should reject invalid email format', () => {
      const invalidData = {
        id: 'user-123',
        email: 'invalid-email',
        fullName: 'John Doe',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      expect(() => schema_user.parse(invalidData))
        .toThrow();
    });

    it('should reject email without domain', () => {
      const invalidData = {
        id: 'user-123',
        email: 'test@',
        fullName: 'John Doe',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      expect(() => schema_user.parse(invalidData))
        .toThrow();
    });

    it('should reject email without @ symbol', () => {
      const invalidData = {
        id: 'user-123',
        email: 'testexample.com',
        fullName: 'John Doe',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      expect(() => schema_user.parse(invalidData))
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
          id: 'user-123',
          email,
          fullName: 'John Doe',
          createdAt: new Date('2023-01-01T00:00:00Z'),
          updatedAt: new Date('2023-01-02T00:00:00Z')
        };

        expect(() => schema_user.parse(validData)).not.toThrow();
      });
    });

    it('should reject empty email', () => {
      const invalidData = {
        id: 'user-123',
        email: '',
        fullName: 'John Doe',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      expect(() => schema_user.parse(invalidData))
        .toThrow();
    });

    it('should reject email with only whitespace', () => {
      const invalidData = {
        id: 'user-123',
        email: '   ',
        fullName: 'John Doe',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      expect(() => schema_user.parse(invalidData))
        .toThrow();
    });
  });

  describe('Full name validation', () => {
    it('should reject empty full name', () => {
      const invalidData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: '',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      expect(() => schema_user.parse(invalidData))
        .toThrow();
    });

    it('should reject full name with only whitespace', () => {
      const invalidData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: '   ',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      expect(() => schema_user.parse(invalidData))
        .toThrow();
    });

    it('should reject very long full name', () => {
      const invalidData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'A'.repeat(256), // Too long
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      expect(() => schema_user.parse(invalidData))
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
          id: 'user-123',
          email: 'test@example.com',
          fullName: name,
          createdAt: new Date('2023-01-01T00:00:00Z'),
          updatedAt: new Date('2023-01-02T00:00:00Z')
        };

        expect(() => schema_user.parse(validData)).not.toThrow();
      });
    });
  });

  describe('Timezone validation', () => {
    it('should accept valid IANA timezone identifiers', () => {
      const validTimezones = [
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney'
      ];

      validTimezones.forEach(timezone => {
        const validData = {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'John Doe',
          timezone,
          createdAt: new Date('2023-01-01T00:00:00Z'),
          updatedAt: new Date('2023-01-02T00:00:00Z')
        };

        expect(() => schema_user.parse(validData)).not.toThrow();
      });
    });

    it('should reject invalid timezone format', () => {
      const invalidData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'John Doe',
        timezone: 'Invalid/Timezone',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      expect(() => schema_user.parse(invalidData))
        .toThrow();
    });

    it('should reject timezone with invalid characters', () => {
      const invalidData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'John Doe',
        timezone: 'America/New_York!',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      expect(() => schema_user.parse(invalidData))
        .toThrow();
    });
  });

  describe('Date validation', () => {
    it('should accept valid Date objects', () => {
      const validData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'John Doe',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      const result = schema_user.parse(validData);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept date strings and convert them', () => {
      const validData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'John Doe',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z'
      };

      const result = schema_user.parse(validData);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should reject invalid date strings', () => {
      const invalidData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'John Doe',
        createdAt: 'invalid-date',
        updatedAt: '2023-01-02T00:00:00Z'
      };

      expect(() => schema_user.parse(invalidData))
        .toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle missing required fields', () => {
      const incompleteData = {
        id: 'user-123',
        email: 'test@example.com',
        // Missing fullName, createdAt, updatedAt
      };

      expect(() => schema_user.parse(incompleteData))
        .toThrow();
    });

    it('should handle extra fields gracefully', () => {
      const extraData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'John Doe',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
        extraField: 'should be ignored',
        anotherField: 123,
        passwordHash: 'hashed-password'
      };

      const result = schema_user.parse(extraData);

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.fullName).toBe('John Doe');
      expect((result as any).extraField).toBeUndefined();
      expect((result as any).anotherField).toBeUndefined();
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should handle null values appropriately', () => {
      const nullData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'John Doe',
        timezone: null,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      expect(() => schema_user.parse(nullData))
        .toThrow();
    });
  });

  describe('Schema structure', () => {
    it('should have correct field types', () => {
      const validData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'John Doe',
        timezone: DateTime.now().zoneName,
        avocado: true,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };
      const result = schema_user.parse(validData);

      expect(typeof result.id).toBe('string');
      expect(typeof result.email).toBe('string');
      expect(typeof result.fullName).toBe('string');
      expect(typeof result.timezone).toBe('string');
      expect(typeof result.avocado).toBe('boolean');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should set default values correctly', () => {
      const minimalData = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'John Doe',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      };

      const result = schema_user.parse(minimalData);

      expect(result.avocado).toBe(true); // Default value
      expect(result.timezone).toBeUndefined();
    });
  });
});
