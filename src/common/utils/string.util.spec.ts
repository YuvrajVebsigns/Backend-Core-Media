import {
  cleanWhitespace,
  toTitleCase,
  cleanEmail,
  cleanPhone,
} from './string.util';

describe('String Utilities', () => {
  describe('cleanWhitespace', () => {
    it('should collapse multiple internal spaces and trim', () => {
      expect(cleanWhitespace('  hello    world  ')).toBe('hello world');
    });

    it('should return empty string for null or undefined or non-string', () => {
      expect(cleanWhitespace(null)).toBe('');
      expect(cleanWhitespace(undefined)).toBe('');
      expect(cleanWhitespace('')).toBe('');
    });
  });

  describe('toTitleCase', () => {
    it('should capitalize first letter of each word and lowercase the rest', () => {
      expect(toTitleCase('ram Kumar')).toBe('Ram Kumar');
      expect(toTitleCase('ram kumar')).toBe('Ram Kumar');
      expect(toTitleCase('RAM KUMAR')).toBe('Ram Kumar');
    });

    it('should handle city names and trim extra spaces', () => {
      expect(toTitleCase('  mumbai  ')).toBe('Mumbai');
      expect(toTitleCase('NEW YORK')).toBe('New York');
      expect(toTitleCase('abu  dhabi')).toBe('Abu Dhabi');
    });

    it('should handle company names', () => {
      expect(toTitleCase('acme   technologies  pvt   ltd')).toBe(
        'Acme Technologies Pvt Ltd',
      );
    });

    it('should handle hyphenated compound words', () => {
      expect(toTitleCase('jean-luc')).toBe('Jean-Luc');
      expect(toTitleCase('winston-salem')).toBe('Winston-Salem');
    });

    it('should return empty string for empty/null inputs', () => {
      expect(toTitleCase(null)).toBe('');
      expect(toTitleCase(undefined)).toBe('');
      expect(toTitleCase('   ')).toBe('');
    });
  });

  describe('cleanEmail', () => {
    it('should trim, remove inner spaces, and lowercase email', () => {
      expect(cleanEmail('  John.Doe@Acme.Com  ')).toBe('john.doe@acme.com');
      expect(cleanEmail(' ram.kumar @ example . com ')).toBe(
        'ram.kumar@example.com',
      );
    });

    it('should return empty string for empty/null inputs', () => {
      expect(cleanEmail(null)).toBe('');
      expect(cleanEmail(undefined)).toBe('');
    });
  });

  describe('cleanPhone', () => {
    it('should trim and collapse multiple spaces', () => {
      expect(cleanPhone('  +91  98765   43210  ')).toBe('+91 98765 43210');
      expect(cleanPhone(' 9876543210 ')).toBe('9876543210');
    });

    it('should return empty string for empty/null inputs', () => {
      expect(cleanPhone(null)).toBe('');
      expect(cleanPhone(undefined)).toBe('');
    });
  });
});
