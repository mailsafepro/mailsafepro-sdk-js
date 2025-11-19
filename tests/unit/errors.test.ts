import {
  MailSafeProError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NetworkError,
  APIError,
  QuotaExceededError,
  ConfigurationError,
  TimeoutError,
} from '../../src/errors';

describe('Error Classes', () => {
  describe('MailSafeProError', () => {
    it('should create base error with all properties', () => {
      const error = new MailSafeProError('Test error', 'TEST_ERROR', 500, { extra: 'data' });

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ extra: 'data' });
      expect(error.timestamp).toBeDefined();
    });

    it('should serialize to JSON', () => {
      const error = new MailSafeProError('Test error', 'TEST_ERROR', 500);
      const json = error.toJSON();

      expect(json.name).toBe('MailSafeProError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_ERROR');
      expect(json.statusCode).toBe(500);
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('AuthenticationError', () => {
    it('should create with correct code and status', () => {
      const error = new AuthenticationError('Auth failed');

      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Auth failed');
    });

    it('should use default message', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('Authentication failed');
    });
  });

  describe('RateLimitError', () => {
    it('should include rate limit details', () => {
      const error = new RateLimitError('Rate limited', 60, {
        limit: 100,
        remaining: 0,
        reset: 1234567890,
      });

      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(60);
      expect(error.limit).toBe(100);
      expect(error.remaining).toBe(0);
      expect(error.reset).toBeInstanceOf(Date);
    });

    it('should serialize with rate limit info', () => {
      const error = new RateLimitError('Rate limited', 60, { limit: 100 });
      const json = error.toJSON();

      expect(json.retryAfter).toBe(60);
      expect(json.limit).toBe(100);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError('Connection failed');

      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.statusCode).toBeUndefined();
      expect(error.isTimeout).toBe(false);
    });

    it('should mark as timeout', () => {
      const error = new NetworkError('Timeout', {}, true);
      expect(error.isTimeout).toBe(true);
    });
  });

  describe('TimeoutError', () => {
    it('should extend NetworkError', () => {
      const error = new TimeoutError();

      expect(error).toBeInstanceOf(NetworkError);
      expect(error.isTimeout).toBe(true);
      expect(error.message).toBe('Request timeout');
    });
  });

  describe('QuotaExceededError', () => {
    it('should include quota information', () => {
      const error = new QuotaExceededError('Quota exceeded', {
        used: 1000,
        limit: 1000,
      });

      expect(error.code).toBe('QUOTA_EXCEEDED');
      expect(error.statusCode).toBe(402);
      expect(error.used).toBe(1000);
      expect(error.limit).toBe(1000);
    });
  });

  describe('ConfigurationError', () => {
    it('should create config error', () => {
      const error = new ConfigurationError('Invalid config');

      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.statusCode).toBeUndefined();
    });
  });

  describe('APIError', () => {
    it('should create with custom status code', () => {
      const error = new APIError('Server error', 503);

      expect(error.code).toBe('API_ERROR');
      expect(error.statusCode).toBe(503);
    });
  });
});
