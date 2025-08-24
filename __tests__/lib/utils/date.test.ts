import { describe, it, expect } from '@jest/globals';
import { formatDate, parseDate, isValidDate } from '@/shared/utils/date';

// This is a unit test that will only run when unit tests are selected
describe('Date Utils Unit Tests', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date, 'yyyy-MM-dd');
      expect(formatted).toBe('2024-01-15');
    });

    it('should handle invalid date gracefully', () => {
      const invalidDate = new Date('invalid');
      expect(() => formatDate(invalidDate, 'yyyy-MM-dd')).toThrow();
    });
  });

  describe('parseDate', () => {
    it('should parse valid date string', () => {
      const dateString = '2024-01-15';
      const parsed = parseDate(dateString);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.getFullYear()).toBe(2024);
      expect(parsed.getMonth()).toBe(0); // January is 0
      expect(parsed.getDate()).toBe(15);
    });

    it('should return null for invalid date string', () => {
      const invalidString = 'not-a-date';
      const parsed = parseDate(invalidString);
      expect(parsed).toBeNull();
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid date', () => {
      const validDate = new Date('2024-01-15');
      expect(isValidDate(validDate)).toBe(true);
    });

    it('should return false for invalid date', () => {
      const invalidDate = new Date('invalid');
      expect(isValidDate(invalidDate)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidDate(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidDate(undefined)).toBe(false);
    });
  });
});
