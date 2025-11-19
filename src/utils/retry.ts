/**
 * Sistema de reintentos con exponential backoff
 * Maneja errores temporales y códigos de estado retryables
 */

import type { Logger } from './logger';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
  retryableErrors?: string[];
  logger?: Logger;
  onRetry?: (attempt: number, error: any, delay: number) => void;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENETUNREACH'],
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const finalConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      const statusCode = error?.response?.status || error?.statusCode;
      const errorCode = error?.code;

      // Log del error
      finalConfig.logger?.debug(`Attempt ${attempt + 1}/${finalConfig.maxRetries + 1} failed`, {
        statusCode,
        errorCode,
        message: error.message,
      });

      // Verificar si el error es retryable
      const isRetryableStatus = statusCode && finalConfig.retryableStatusCodes.includes(statusCode);

      const isRetryableError = errorCode && finalConfig.retryableErrors?.includes(errorCode);

      if (!isRetryableStatus && !isRetryableError) {
        finalConfig.logger?.debug('Error not retryable', {
          statusCode,
          errorCode,
        });
        throw error;
      }

      // No reintentar si es el último intento
      if (attempt === finalConfig.maxRetries) {
        finalConfig.logger?.warn(`Max retries (${finalConfig.maxRetries}) exceeded`, {
          error: error.message,
        });
        break;
      }

      // Calcular delay con exponential backoff
      let delay = Math.min(
        finalConfig.initialDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelayMs,
      );

      // Agregar jitter (variación aleatoria) para evitar thundering herd
      delay = delay * (0.5 + Math.random() * 0.5);

      // Respetar Retry-After header si existe (429 responses)
      const retryAfter = error?.response?.headers?.['retry-after'];
      if (retryAfter) {
        const retryAfterMs = parseInt(retryAfter) * 1000;
        if (!isNaN(retryAfterMs)) {
          delay = Math.min(retryAfterMs, finalConfig.maxDelayMs);
          finalConfig.logger?.info(`Using Retry-After header: ${retryAfter}s`);
        }
      }

      finalConfig.logger?.info(
        `Retry attempt ${attempt + 1}/${finalConfig.maxRetries} after ${Math.round(delay)}ms`,
        { statusCode, errorCode },
      );

      // Callback de retry
      if (finalConfig.onRetry) {
        try {
          finalConfig.onRetry(attempt + 1, error, delay);
        } catch (callbackError) {
          finalConfig.logger?.warn('Retry callback failed', callbackError);
        }
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Clase para configurar reintentos de forma más declarativa
 */
export class RetryPolicy {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  withMaxRetries(maxRetries: number): this {
    this.config.maxRetries = maxRetries;
    return this;
  }

  withInitialDelay(delayMs: number): this {
    this.config.initialDelayMs = delayMs;
    return this;
  }

  withMaxDelay(delayMs: number): this {
    this.config.maxDelayMs = delayMs;
    return this;
  }

  withBackoffMultiplier(multiplier: number): this {
    this.config.backoffMultiplier = multiplier;
    return this;
  }

  withRetryableStatusCodes(codes: number[]): this {
    this.config.retryableStatusCodes = codes;
    return this;
  }

  withLogger(logger: Logger): this {
    this.config.logger = logger;
    return this;
  }

  onRetry(callback: (attempt: number, error: any, delay: number) => void): this {
    this.config.onRetry = callback;
    return this;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return withRetry(fn, this.config);
  }
}
