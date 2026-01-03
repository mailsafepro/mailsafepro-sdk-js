/**
 * Unit tests para funciones de validación
 */

import {
  validateEmail,
  validateEmails,
  validateDomain,
  validateApiKey,
  validateBaseURL,
  validateTimeout,
  validateJobId,
  sanitizeEmailForLogging,
} from '../../src/utils/validation';
import { ValidationError } from '../../src/errors';
import { ConfigurationError } from '../../dist';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        'a@b.co',
      ];

      validEmails.forEach(email => {
        expect(() => validateEmail(email)).not.toThrow();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        '.user@example.com',
        'user.@example.com',
        'user..name@example.com',
      ];

      invalidEmails.forEach(email => {
        expect(() => validateEmail(email)).toThrow(ValidationError);
      });
    });

    it('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      expect(() => validateEmail(longEmail)).toThrow(ValidationError);
    });

    it('should reject emails with whitespace', () => {
      expect(() => validateEmail(' user@example.com')).toThrow(ValidationError);
      expect(() => validateEmail('user@example.com ')).toThrow(ValidationError);
    });
  });

  describe('validateEmails', () => {
    it('should accept array of valid emails', () => {
      const emails = ['user1@example.com', 'user2@example.com'];
      expect(() => validateEmails(emails)).not.toThrow();
    });

    it('should reject non-array input', () => {
      expect(() => validateEmails('not an array' as any)).toThrow(ValidationError);
    });

    it('should reject empty array', () => {
      expect(() => validateEmails([])).toThrow(ValidationError);
    });

    it('should reject array with invalid email', () => {
      const emails = ['valid@example.com', 'invalid'];
      expect(() => validateEmails(emails)).toThrow(ValidationError);
    });

    it('should reject array exceeding max size', () => {
      const emails = Array(1001).fill('user@example.com');
      expect(() => validateEmails(emails)).toThrow(ValidationError);
    });

    it('should reject duplicate emails', () => {
      const emails = ['user@example.com', 'user@example.com'];
      expect(() => validateEmails(emails)).toThrow(ValidationError);
    });
  });

  describe('validateDomain', () => {
    it('should accept valid domains', () => {
      const validDomains = [
        'example.com',
        'subdomain.example.com',
        'example.co.uk',
        'my-domain.com',
      ];

      validDomains.forEach(domain => {
        expect(() => validateDomain(domain)).not.toThrow();
      });
    });

    it('should reject invalid domains', () => {
      const invalidDomains = ['', 'example', '.com', 'example.', '-example.com', 'example-.com'];

      invalidDomains.forEach(domain => {
        expect(() => validateDomain(domain)).toThrow(ValidationError);
      });
    });
  });

  describe('validateApiKey', () => {
    it('should accept valid API keys', () => {
      const validKeys = [
        'a'.repeat(20),
        'sk_test_1234567890abcdefghij',
        'API-KEY-1234567890-ABCDEF',
      ];

      validKeys.forEach(key => {
        expect(() => validateApiKey(key)).not.toThrow();
      });
    });

    it('should reject invalid API keys', () => {
      expect(() => validateApiKey('')).toThrow(ValidationError);
      expect(() => validateApiKey('short')).toThrow(ValidationError);
      expect(() => validateApiKey(' '.repeat(20))).toThrow(ValidationError);
    });
  });

  describe('validateBaseURL', () => {
    it('should accept valid URLs', () => {
      const validURLs = [
        'https://api.example.com',
        'http://localhost:3000',
        'https://api.example.com/v1',
      ];

      validURLs.forEach(url => {
        expect(() => validateBaseURL(url)).not.toThrow();
      });
    });

    it('should reject invalid URLs', () => {
      expect(() => validateBaseURL('not-a-url')).toThrow('Invalid base URL');
      expect(() => validateBaseURL('ftp://example.com')).toThrow('Invalid protocol');
      expect(() => validateBaseURL('javascript:alert(1)')).toThrow('Invalid protocol');
    });

    it('should reject empty string', () => {
      expect(() => validateBaseURL('' as any)).toThrow('Base URL is required');
    });
  });

  describe('validateTimeout', () => {
    it('should accept valid timeout values', () => {
      expect(() => validateTimeout(5000)).not.toThrow();
      expect(() => validateTimeout(30000)).not.toThrow();
      expect(() => validateTimeout(60000)).not.toThrow();
    });

    it('should reject timeout too short', () => {
      expect(() => validateTimeout(500)).toThrow(ValidationError);
      expect(() => validateTimeout(100)).toThrow(ValidationError);
    });

    it('should reject timeout too long', () => {
      expect(() => validateTimeout(400000)).toThrow(ValidationError);
    });

    it('should reject non-number timeout', () => {
      expect(() => validateTimeout('5000' as any)).toThrow(ValidationError);
      expect(() => validateTimeout(NaN)).toThrow(ValidationError);
    });
  });

  describe('validateJobId', () => {
    it('should accept valid job IDs', () => {
      expect(() => validateJobId('job_123')).not.toThrow();
      expect(() => validateJobId('abc-def-123')).not.toThrow();
      expect(() => validateJobId('JOB_ABC_123')).not.toThrow();
    });

    it('should reject empty job ID', () => {
      expect(() => validateJobId('')).toThrow(ValidationError);
      expect(() => validateJobId('   ')).toThrow(ValidationError);
    });

    it('should reject job ID with invalid characters', () => {
      expect(() => validateJobId('job@123')).toThrow(ValidationError);
      expect(() => validateJobId('job 123')).toThrow(ValidationError);
    });

    it('should reject non-string job ID', () => {
      expect(() => validateJobId(123 as any)).toThrow(ValidationError);
      expect(() => validateJobId(null as any)).toThrow(ValidationError);
    });
  });

  describe('sanitizeEmailForLogging', () => {
    it('should mask email local part', () => {
      const result = sanitizeEmailForLogging('john.doe@example.com');
      expect(result).not.toContain('john.doe');
      expect(result).toContain('@example.com');
      expect(result).toContain('*');
    });

    it('should handle short local parts', () => {
      const result = sanitizeEmailForLogging('ab@example.com');
      expect(result).toContain('@example.com');
    });

    it('should handle very short local parts (1-2 chars)', () => {
      const result1 = sanitizeEmailForLogging('a@example.com');
      expect(result1).toContain('@example.com');
      
      const result2 = sanitizeEmailForLogging('ab@example.com');
      expect(result2).toContain('@example.com');
    });

    it('should handle invalid emails', () => {
      expect(sanitizeEmailForLogging('')).toBe('[invalid]');
      expect(sanitizeEmailForLogging('invalid')).toBe('[invalid]');
      expect(sanitizeEmailForLogging(null as any)).toBe('[invalid]');
      expect(sanitizeEmailForLogging(undefined as any)).toBe('[invalid]');
    });

    it('should preserve domain', () => {
      const result = sanitizeEmailForLogging('user@gmail.com');
      expect(result).toContain('@gmail.com');
    });

    it('should handle medium length local parts', () => {
      const result = sanitizeEmailForLogging('john@example.com');
      expect(result).toContain('@example.com');
      expect(result).toContain('*');
    });
  });
});
