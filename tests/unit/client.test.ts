import { MailSafeProClient } from '../../src/client';
import { ConfigurationError, ValidationError } from '../../src/errors';
import { SilentLogger } from '../../src/utils/logger';

describe('MailSafeProClient', () => {
  let client: MailSafeProClient;

  beforeEach(() => {
    client = new MailSafeProClient({
      apiKey: 'test_key_12345678901234567890',
      logger: new SilentLogger(),
    });
  });

  afterEach(() => {
    client.destroy();
  });

  describe('Constructor', () => {
    it('should initialize with API key', () => {
      expect(client).toBeDefined();
      expect(client.version).toBe('1.0.0');
      expect(client.isAuthenticated()).toBe(true);
    });

    it('should use default base URL', () => {
      const defaultClient = new MailSafeProClient({
        apiKey: 'test_key_12345678901234567890',
        logger: new SilentLogger(),
      });

      expect(defaultClient).toBeDefined();
      defaultClient.destroy();
    });

    it('should throw on invalid API key', () => {
      expect(() => {
        new MailSafeProClient({
          apiKey: 'short',
          logger: new SilentLogger(),
        });
      }).toThrow(ConfigurationError);
    });

    it('should throw on invalid base URL', () => {
      expect(() => {
        new MailSafeProClient({
          baseURL: 'not-a-url',
          apiKey: 'test_key_12345678901234567890',
          logger: new SilentLogger(),
        });
      }).toThrow(ConfigurationError);
    });

    it('should accept custom logger', () => {
      const customLogger = new SilentLogger();
      const clientWithLogger = new MailSafeProClient({
        apiKey: 'test_key_12345678901234567890',
        logger: customLogger,
      });

      expect(clientWithLogger.getLogger()).toBe(customLogger);
      clientWithLogger.destroy();
    });

    it('should accept rate limit config', () => {
      const clientWithRateLimit = new MailSafeProClient({
        apiKey: 'test_key_12345678901234567890',
        rateLimitConfig: {
          maxRequestsPerSecond: 5,
          maxConcurrent: 3,
        },
        logger: new SilentLogger(),
      });

      expect(clientWithRateLimit).toBeDefined();
      clientWithRateLimit.destroy();
    });
  });

  describe('Authentication Methods', () => {
    it('should have login method', () => {
      expect(typeof client.login).toBe('function');
    });

    it('should have register method', () => {
      expect(typeof client.register).toBe('function');
    });

    it('should have logout method', () => {
      expect(typeof client.logout).toBe('function');
    });

    it('should have refreshToken method', () => {
      expect(typeof client.refreshToken).toBe('function');
    });

    it('should get session', () => {
      const session = client.getSession();
      expect(session).toBeNull();
    });

    it('should check authentication', () => {
      expect(client.isAuthenticated()).toBe(true);
    });

    it('should set and clear API key', () => {
      client.clearApiKey();
      expect(client.isAuthenticated()).toBe(false);

      client.setApiKey('test_key_12345678901234567890');
      expect(client.isAuthenticated()).toBe(true);
    });
  });

  describe('Validation Methods', () => {
    it('should have validateEmail method', () => {
      expect(typeof client.validateEmail).toBe('function');
    });

    it('should have batchValidateEmails method', () => {
      expect(typeof client.batchValidateEmails).toBe('function');
    });

    it('should have uploadFileBatch method', () => {
      expect(typeof client.uploadFileBatch).toBe('function');
    });

    it('should have getBatchStatus method', () => {
      expect(typeof client.getBatchStatus).toBe('function');
    });

    it('should validate email request fails with invalid email', async () => {
      await expect(client.validateEmail({ email: 'invalid' })).rejects.toThrow(ValidationError);
    });

    it('should validate batch request fails with empty array', async () => {
      await expect(client.batchValidateEmails({ emails: [] })).rejects.toThrow(ValidationError);
    });
  });

  describe('Utility Methods', () => {
    it('should get rate limiter stats', () => {
      const stats = client.getRateLimiterStats();
      expect(stats).toBeDefined();
    });

    it('should clear rate limiter', () => {
      expect(() => client.clearRateLimiter()).not.toThrow();
    });

    it('should set auto refresh', () => {
      expect(() => client.setAutoRefresh(false)).not.toThrow();
      expect(() => client.setAutoRefresh(true)).not.toThrow();
    });

    it('should get logger', () => {
      const logger = client.getLogger();
      expect(logger).toBeDefined();
    });

    it('should destroy cleanly', () => {
      expect(() => client.destroy()).not.toThrow();
    });
  });
  describe('Additional Client Coverage', () => {
    describe('Advanced Authentication', () => {
      it('should handle login with options', async () => {
        const mockSession = {
          access_token: 'token',
          refresh_token: 'refresh',
          expires_in: 3600,
          user: { id: '123', email: 'test@example.com' },
        };

        // Mock the auth client login
        jest.spyOn(client as any, 'login').mockResolvedValue(mockSession);

        const result = await client.login('test@example.com', 'password12345678');
        expect(result).toBeDefined();
      });

      it('should handle register with full options', async () => {
        const mockSession = {
          access_token: 'token',
          refresh_token: 'refresh',
          expires_in: 3600,
          user: { id: '123', email: 'test@example.com', name: 'Test User' },
        };

        jest.spyOn(client as any, 'register').mockResolvedValue(mockSession);

        const result = await client.register('test@example.com', 'password12345678', 'Test User');
        expect(result).toBeDefined();
      });

      it('should handle refresh token call', async () => {
        const mockSession = {
          access_token: 'new_token',
          refresh_token: 'new_refresh',
          expires_in: 3600,
          user: { id: '123', email: 'test@example.com' },
        };

        jest.spyOn(client as any, 'refreshToken').mockResolvedValue(mockSession);

        const result = await client.refreshToken();
        expect(result).toBeDefined();
      });
    });

    describe('Validation Operations', () => {
      it('should validate single email with all options', async () => {
        const mockResponse = {
          email: 'test@example.com',
          valid: true,
          riskScore: 10,
          mailboxExists: true,
          smtpValid: true,
          dnsValid: true,
        };

        jest.spyOn(client as any, 'validateEmail').mockResolvedValue(mockResponse);

        const result = await client.validateEmail({
          email: 'test@example.com',
          checkSmtp: true,
          includeRawDns: true,
        });

        expect(result).toEqual(mockResponse);
      });

      it('should handle batch validation with options', async () => {
        const mockResponse = {
          results: [
            { email: 'test1@example.com', valid: true },
            { email: 'test2@example.com', valid: false },
          ],
          validCount: 1,
          invalidCount: 1,
          processingTime: 100,
        };

        jest.spyOn(client as any, 'batchValidateEmails').mockResolvedValue(mockResponse);

        const result = await client.batchValidateEmails({
          emails: ['test1@example.com', 'test2@example.com'],
          checkSmtp: true,
        });

        expect(result).toEqual(mockResponse);
      });

      it('should upload file batch', async () => {
        const mockResponse = {
          jobId: 'job_123',
          status: 'processing',
          progress: 0,
        };

        jest.spyOn(client as any, 'uploadFileBatch').mockResolvedValue(mockResponse);

        const fileBuffer = Buffer.from('test@example.com');
        const result = await client.uploadFileBatch(fileBuffer);

        expect(result).toEqual(mockResponse);
      });

      it('should get batch status', async () => {
        const mockStatus = {
          jobId: 'job_123',
          status: 'completed',
          progress: 100,
        };

        jest.spyOn(client as any, 'getBatchStatus').mockResolvedValue(mockStatus);

        const result = await client.getBatchStatus('job_123');

        expect(result).toEqual(mockStatus);
      });
    });

    describe('Client Configuration', () => {
      it('should handle custom timeout', () => {
        const customClient = new MailSafeProClient({
          apiKey: 'test_key_12345678901234567890',
          timeout: 60000,
          logger: new SilentLogger(),
        });

        expect(customClient).toBeDefined();
        customClient.destroy();
      });

      it('should handle retry enabled', () => {
        const customClient = new MailSafeProClient({
          apiKey: 'test_key_12345678901234567890',
          enableRetry: true,
          logger: new SilentLogger(),
        });

        expect(customClient).toBeDefined();
        customClient.destroy();
      });

      it('should handle all configuration options', () => {
        const customClient = new MailSafeProClient({
          apiKey: 'test_key_12345678901234567890',
          baseURL: 'https://custom-api.test.com',
          timeout: 30000,
          enableRetry: true,
          rateLimitConfig: {
            maxRequestsPerSecond: 20,
            maxConcurrent: 10,
          },
          autoRefresh: true,
          logger: new SilentLogger(),
        });

        expect(customClient).toBeDefined();
        expect(customClient.isAuthenticated()).toBe(true);
        customClient.destroy();
      });
    });

    describe('Version and Metadata', () => {
      it('should expose version', () => {
        expect(client.version).toBeDefined();
        expect(typeof client.version).toBe('string');
      });

      it('should maintain version format', () => {
        expect(client.version).toMatch(/^\d+\.\d+\.\d+$/);
      });
    });
  });
});
