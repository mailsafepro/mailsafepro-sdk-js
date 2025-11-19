/**
 * Unit tests para RateLimiter
 */

import { RateLimiter } from '../../src/utils/rateLimiter';
import { SilentLogger } from '../../src/utils/logger';

describe('RateLimiter', () => {
  it('should limit requests per second', async () => {
    const limiter = new RateLimiter({
      maxRequestsPerSecond: 10,
      logger: new SilentLogger(),
    });

    const results: number[] = [];
    const promises = Array(20)
      .fill(0)
      .map(() =>
        limiter.execute(async () => {
          results.push(Date.now());
          return true;
        }),
      );

    await Promise.all(promises);

    // Verificar que los requests se distribuyeron en el tiempo
    const firstTimestamp = results[0];
    const lastTimestamp = results[results.length - 1];
    const duration = lastTimestamp - firstTimestamp;

    // 20 requests a 10 req/s debería tomar al menos 1 segundo
    expect(duration).toBeGreaterThanOrEqual(900);
  });

  it('should respect max concurrent limit', async () => {
    let currentConcurrent = 0;
    let maxConcurrentSeen = 0;

    const limiter = new RateLimiter({
      maxRequestsPerSecond: 100,
      maxConcurrent: 3,
      logger: new SilentLogger(),
    });

    const promises = Array(10)
      .fill(0)
      .map(() =>
        limiter.execute(async () => {
          currentConcurrent++;
          maxConcurrentSeen = Math.max(maxConcurrentSeen, currentConcurrent);

          await new Promise(resolve => setTimeout(resolve, 100));

          currentConcurrent--;
          return true;
        }),
      );

    await Promise.all(promises);

    expect(maxConcurrentSeen).toBeLessThanOrEqual(3);
  });

  it('should clear queue', async () => {
    const limiter = new RateLimiter({
      maxRequestsPerSecond: 1,
      logger: new SilentLogger(),
    });

    const promises = Array(10)
      .fill(0)
      .map(() =>
        limiter.execute(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return true;
        }),
      );

    // Esperar un poco para que se encolen
    await new Promise(resolve => setTimeout(resolve, 50));

    limiter.clear();

    // Los promises deberían rechazarse
    await expect(Promise.all(promises)).rejects.toThrow();
  });

  it('should report queue statistics', () => {
    const limiter = new RateLimiter({
      maxRequestsPerSecond: 10,
      maxConcurrent: 5,
    });

    const stats = limiter.getStats();

    expect(stats).toHaveProperty('queueSize');
    expect(stats).toHaveProperty('pendingCount');
    expect(stats).toHaveProperty('maxConcurrent');
    expect(stats.maxConcurrent).toBe(5);
  });
});
