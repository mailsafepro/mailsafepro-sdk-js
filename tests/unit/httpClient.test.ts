/**
 * Tests para HttpClient
 */

import { HttpClient } from '../../src/http/httpClient';
import { SilentLogger } from '../../src/utils/logger';
import { NetworkError, TimeoutError, RateLimitError } from '../../src/errors';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedAxios.create.mockReturnValue({
      request: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      head: jest.fn(),
      options: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    } as any);

    client = new HttpClient({
      baseURL: 'https://api.test.com',
      logger: new SilentLogger(),
      enableRetry: false,
    });
  });

  describe('Constructor', () => {
    it('should create client with default options', () => {
      const defaultClient = new HttpClient({
        baseURL: 'https://api.test.com',
      });

      expect(defaultClient).toBeDefined();
      expect(mockedAxios.create).toHaveBeenCalled();
    });

    it('should create client with custom timeout', () => {
      const clientWithTimeout = new HttpClient({
        baseURL: 'https://api.test.com',
        timeout: 60000,
      });

      expect(clientWithTimeout).toBeDefined();
    });

    it('should create client with rate limiter', () => {
      const clientWithRateLimit = new HttpClient({
        baseURL: 'https://api.test.com',
        rateLimitConfig: {
          maxRequestsPerSecond: 5,
          maxConcurrent: 3,
        },
        logger: new SilentLogger(),
      });

      expect(clientWithRateLimit).toBeDefined();

      const stats = clientWithRateLimit.getRateLimiterStats();
      expect(stats).toBeDefined();
    });

    it('should create client with retry enabled', () => {
      const clientWithRetry = new HttpClient({
        baseURL: 'https://api.test.com',
        enableRetry: true,
        retryConfig: {
          maxRetries: 5,
        },
      });

      expect(clientWithRetry).toBeDefined();
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });
    });

    it('should make GET request', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
        data: { result: 'data' },
      });

      const result = await client.get('/test');

      expect(result).toEqual({ result: 'data' });
    });

    it('should make POST request', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
        data: { created: true },
      });

      const result = await client.post('/test', { name: 'test' });

      expect(result).toEqual({ created: true });
    });

    it('should make PUT request', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
        data: { updated: true },
      });

      const result = await client.put('/test/1', { name: 'updated' });

      expect(result).toEqual({ updated: true });
    });

    it('should make PATCH request', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
        data: { patched: true },
      });

      const result = await client.patch('/test/1', { field: 'value' });

      expect(result).toEqual({ patched: true });
    });

    it('should make DELETE request', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
        data: { deleted: true },
      });

      const result = await client.delete('/test/1');

      expect(result).toEqual({ deleted: true });
    });

    it('should make HEAD request', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
        data: {},
      });

      const result = await client.head('/test');

      expect(result).toBeDefined();
    });

    it('should make OPTIONS request', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
        data: { methods: ['GET', 'POST'] },
      });

      const result = await client.options('/test');

      expect(result).toEqual({ methods: ['GET', 'POST'] });
    });
  });

  describe('Rate Limiter', () => {
    it('should get rate limiter stats', () => {
      const clientWithRateLimit = new HttpClient({
        baseURL: 'https://api.test.com',
        rateLimitConfig: {
          maxRequestsPerSecond: 10,
        },
        logger: new SilentLogger(),
      });

      const stats = clientWithRateLimit.getRateLimiterStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('queueSize');
      expect(stats).toHaveProperty('pendingCount');
    });

    it('should return null for stats when no rate limiter', () => {
      const stats = client.getRateLimiterStats();
      expect(stats).toBeNull();
    });

    it('should clear rate limiter', () => {
      const clientWithRateLimit = new HttpClient({
        baseURL: 'https://api.test.com',
        rateLimitConfig: {
          maxRequestsPerSecond: 10,
        },
        logger: new SilentLogger(),
      });

      expect(() => clientWithRateLimit.clearRateLimiter()).not.toThrow();
    });

    it('should not throw when clearing non-existent rate limiter', () => {
      expect(() => client.clearRateLimiter()).not.toThrow();
    });
  });

  describe('Retry Configuration', () => {
    it('should update retry config', () => {
      expect(() => {
        client.updateRetryConfig({ maxRetries: 5 });
      }).not.toThrow();
    });

    it('should enable/disable retry', () => {
      client.setRetryEnabled(true);
      client.setRetryEnabled(false);

      expect(true).toBe(true); // Should not throw
    });
  });

  describe('Axios Instance', () => {
    it('should get axios instance', () => {
      const axiosInstance = client.getAxiosInstance();
      expect(axiosInstance).toBeDefined();
    });
  });
});
