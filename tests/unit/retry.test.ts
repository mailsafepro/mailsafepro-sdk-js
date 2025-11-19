/**
 * Tests para el sistema de retry con exponential backoff
 */

import { withRetry, RetryPolicy, DEFAULT_RETRY_CONFIG } from '../../src/utils/retry';
import { APIError } from '../../src/errors';
import { SilentLogger } from '../../src/utils/logger';

describe('Retry System', () => {
  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(mockFn, DEFAULT_RETRY_CONFIG);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on 500 error', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new APIError('Server error', 500))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 2,
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry on 503 error', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new APIError('Service unavailable', 503))
        .mockRejectedValueOnce(new APIError('Service unavailable', 503))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 3,
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on 400 error', async () => {
      const mockFn = jest.fn().mockRejectedValue(new APIError('Bad request', 400));

      await expect(
        withRetry(mockFn, {
          ...DEFAULT_RETRY_CONFIG,
          maxRetries: 3,
        }),
      ).rejects.toThrow('Bad request');

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new APIError('Server error', 500));

      await expect(
        withRetry(mockFn, {
          ...DEFAULT_RETRY_CONFIG,
          maxRetries: 3,
          initialDelayMs: 10,
        }),
      ).rejects.toThrow('Server error');

      expect(mockFn).toHaveBeenCalledTimes(4);
    });

    it('should apply exponential backoff', async () => {
      const delays: number[] = [];
      const startTimes: number[] = [];

      const mockFn = jest.fn().mockImplementation(() => {
        startTimes.push(Date.now());
        return Promise.reject(new APIError('Server error', 500));
      });

      try {
        await withRetry(mockFn, {
          maxRetries: 3,
          initialDelayMs: 50,
          maxDelayMs: 1000,
          backoffMultiplier: 2,
        });
      } catch (error) {
        // Expected to fail
      }

      // Calcular delays entre intentos
      for (let i = 1; i < startTimes.length; i++) {
        delays.push(startTimes[i] - startTimes[i - 1]);
      }

      // Verificar que tenemos delays y que aumentan
      expect(delays.length).toBeGreaterThan(0);
      if (delays.length > 1) {
        expect(delays[1]).toBeGreaterThanOrEqual(delays[0]);
      }
    });

    it('should call onRetry callback', async () => {
      const onRetry = jest.fn();
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new APIError('Server error', 500))
        .mockResolvedValue('success');

      await withRetry(mockFn, {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 2,
        initialDelayMs: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(APIError), expect.any(Number));
    });

    it('should respect maxDelay', async () => {
      const mockFn = jest.fn().mockRejectedValue(new APIError('Server error', 500));

      const start = Date.now();

      try {
        await withRetry(mockFn, {
          maxRetries: 2,
          initialDelayMs: 5000,
          maxDelayMs: 100,
          backoffMultiplier: 2,
        });
      } catch (error) {
        // Expected
      }

      const duration = Date.now() - start;

      // Con maxDelayMs de 100ms y 2 retries, no debería tardar más de 500ms total
      expect(duration).toBeLessThan(500);
    });

    it('should use logger if provided', async () => {
      const logger = new SilentLogger();
      const loggerInfoSpy = jest.spyOn(logger, 'info');
      const loggerWarnSpy = jest.spyOn(logger, 'warn');

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new APIError('Server error', 500))
        .mockResolvedValue('success');

      await withRetry(mockFn, {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 2,
        initialDelayMs: 10,
        logger,
      });

      // Verificar que se llamó algún método del logger
      const loggerCalled =
        loggerInfoSpy.mock.calls.length > 0 || loggerWarnSpy.mock.calls.length > 0;
      expect(loggerCalled).toBe(true);
    });
  });

  describe('RetryPolicy', () => {
    it('should create policy with default config', () => {
      const policy = new RetryPolicy();

      expect(policy).toBeDefined();
    });

    it('should execute function successfully', async () => {
      const policy = new RetryPolicy();
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await policy.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const policy = new RetryPolicy().withMaxRetries(3).withInitialDelay(10);

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new APIError('Server error', 500))
        .mockResolvedValue('success');

      const result = await policy.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should chain configuration methods', () => {
      const policy = new RetryPolicy()
        .withMaxRetries(5)
        .withInitialDelay(200)
        .withMaxDelay(5000)
        .withBackoffMultiplier(3);

      expect(policy).toBeDefined();
    });

    it('should call onRetry callback', async () => {
      const onRetry = jest.fn();
      const policy = new RetryPolicy().withMaxRetries(2).withInitialDelay(10).onRetry(onRetry);

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new APIError('Server error', 500))
        .mockResolvedValue('success');

      await policy.execute(mockFn);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries in policy', async () => {
      const policy = new RetryPolicy().withMaxRetries(2).withInitialDelay(10);

      const mockFn = jest.fn().mockRejectedValue(new APIError('Server error', 500));

      await expect(policy.execute(mockFn)).rejects.toThrow('Server error');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should handle retry policy execution', async () => {
      const policy = new RetryPolicy().withMaxRetries(3).withInitialDelay(10);

      const mockFn = jest.fn().mockRejectedValue(new APIError('Server error', 500));

      await expect(policy.execute(mockFn)).rejects.toThrow('Server error');

      expect(mockFn).toHaveBeenCalledTimes(4);
    });
  });

  describe('DEFAULT_RETRY_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.initialDelayMs).toBeDefined();
      expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBeDefined();
      expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBe(2);
    });
  });

  describe('Error retry logic', () => {
    it('should retry on 500 error', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new APIError('Server error', 500))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        maxRetries: 2,
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry on 502 error', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new APIError('Bad Gateway', 502))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        maxRetries: 2,
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry on 503 error', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new APIError('Service Unavailable', 503))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        maxRetries: 2,
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 400 error', async () => {
      const mockFn = jest.fn().mockRejectedValue(new APIError('Bad request', 400));

      await expect(withRetry(mockFn, { maxRetries: 2, initialDelayMs: 10 })).rejects.toThrow();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 401 error', async () => {
      const mockFn = jest.fn().mockRejectedValue(new APIError('Unauthorized', 401));

      await expect(withRetry(mockFn, { maxRetries: 2, initialDelayMs: 10 })).rejects.toThrow();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});
