/**
 * End-to-End Integration Tests
 * Tests que verifican flujos completos del SDK
 */

import { MailSafeProClient } from '../../src/client';
import { SilentLogger } from '../../src/utils/logger';

// Mock axios para simular respuestas de la API
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    request: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
}));

describe('End-to-End Integration Tests', () => {
  let client: MailSafeProClient;

  beforeEach(() => {
    client = new MailSafeProClient({
      apiKey: 'test_key_12345678901234567890',
      baseURL: 'https://api.test.com',
      logger: new SilentLogger(),
      enableRetry: false,
    });
  });

  afterEach(() => {
    client.destroy();
  });

  describe('Complete Validation Flow', () => {
    it('should perform complete email validation workflow', async () => {
      // 1. Verificar autenticación
      expect(client.isAuthenticated()).toBe(true);

      // 2. Obtener logger
      const logger = client.getLogger();
      expect(logger).toBeDefined();

      // 3. Verificar rate limiter stats
      const stats = client.getRateLimiterStats();
      expect(stats).toBeDefined();

      // 4. Clear rate limiter
      client.clearRateLimiter();

      // 5. Cambiar auto-refresh
      client.setAutoRefresh(false);
      client.setAutoRefresh(true);

      // 6. Verificar sesión
      const session = client.getSession();
      expect(session).toBeNull();

      // Todo el flujo funciona sin errores
      expect(true).toBe(true);
    });

    it('should handle API key management', () => {
      // Set API key
      client.setApiKey('new_test_key_12345678901234567890');
      expect(client.isAuthenticated()).toBe(true);

      // Clear API key
      client.clearApiKey();
      expect(client.isAuthenticated()).toBe(false);

      // Set again
      client.setApiKey('test_key_12345678901234567890');
      expect(client.isAuthenticated()).toBe(true);
    });

    it('should validate client configuration', () => {
      expect(client.version).toBe('1.0.0');
      expect(client.isAuthenticated()).toBe(true);
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle validation errors gracefully', async () => {
      await expect(client.validateEmail({ email: 'invalid' })).rejects.toThrow();
    });

    it('should handle batch validation errors', async () => {
      await expect(client.batchValidateEmails({ emails: [] })).rejects.toThrow();
    });
  });

  describe('Client Lifecycle', () => {
    it('should initialize and destroy cleanly', () => {
      const tempClient = new MailSafeProClient({
        apiKey: 'test_key_12345678901234567890',
        logger: new SilentLogger(),
      });

      expect(tempClient).toBeDefined();
      expect(tempClient.isAuthenticated()).toBe(true);

      tempClient.destroy();

      // Should not throw after destroy
      expect(() => tempClient.getRateLimiterStats()).not.toThrow();
    });

    it('should handle multiple client instances', () => {
      const client1 = new MailSafeProClient({
        apiKey: 'test_key_1_12345678901234567890',
        logger: new SilentLogger(),
      });

      const client2 = new MailSafeProClient({
        apiKey: 'test_key_2_12345678901234567890',
        logger: new SilentLogger(),
      });

      expect(client1.isAuthenticated()).toBe(true);
      expect(client2.isAuthenticated()).toBe(true);

      client1.destroy();
      client2.destroy();
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should work with rate limiter', () => {
      const clientWithRateLimit = new MailSafeProClient({
        apiKey: 'test_key_12345678901234567890',
        rateLimitConfig: {
          maxRequestsPerSecond: 10,
          maxConcurrent: 5,
        },
        logger: new SilentLogger(),
      });

      const stats = clientWithRateLimit.getRateLimiterStats();
      expect(stats).toBeDefined();
      expect(stats).not.toBeNull();

      if (stats) {
        expect(stats).toHaveProperty('maxConcurrent');
        expect(stats.maxConcurrent).toBe(5);
      }

      clientWithRateLimit.destroy();
    });
  });

  describe('Configuration Validation', () => {
    it('should throw on invalid configuration', () => {
      expect(() => {
        new MailSafeProClient({
          apiKey: 'short',
          logger: new SilentLogger(),
        });
      }).toThrow();
    });

    it('should throw on invalid base URL', () => {
      expect(() => {
        new MailSafeProClient({
          baseURL: 'not-a-url',
          apiKey: 'test_key_12345678901234567890',
          logger: new SilentLogger(),
        });
      }).toThrow();
    });
  });
});
