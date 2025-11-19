/**
 * Interceptores de Axios para request/response
 */

import type { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import {
  RateLimitError,
  AuthenticationError,
  ValidationError,
  NetworkError,
  APIError,
  QuotaExceededError,
  TimeoutError,
} from '../errors';
import type { Logger } from '../utils/logger';

export interface InterceptorConfig {
  logger?: Logger;
  onRateLimit?: (error: RateLimitError) => void;
  onAuthError?: (error: AuthenticationError) => void;
  onQuotaExceeded?: (error: QuotaExceededError) => void;
  sanitizeHeaders?: boolean;
}

// CORREGIDO: Extender correctamente InternalAxiosRequestConfig
interface TimedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _requestTime?: number;
  _requestId?: string;
}

export function setupInterceptors(
  axiosInstance: AxiosInstance,
  config: InterceptorConfig = {},
): void {
  const { logger, onRateLimit, onAuthError, onQuotaExceeded, sanitizeHeaders = true } = config;

  // REQUEST INTERCEPTOR
  axiosInstance.interceptors.request.use(
    (requestConfig: InternalAxiosRequestConfig) => {
      const timedConfig = requestConfig as TimedAxiosRequestConfig;

      timedConfig._requestTime = Date.now();

      const requestId = generateRequestId();
      timedConfig._requestId = requestId;

      // CORREGIDO: Verificar que headers existe
      if (!timedConfig.headers) {
        timedConfig.headers = {} as any;
      }
      timedConfig.headers['X-Request-ID'] = requestId;

      logger?.debug('HTTP Request', {
        requestId,
        method: requestConfig.method?.toUpperCase(),
        url: requestConfig.url,
        baseURL: requestConfig.baseURL,
        headers: sanitizeHeaders
          ? sanitizeHeadersForLogging(requestConfig.headers)
          : requestConfig.headers,
      });

      return timedConfig;
    },
    (error: any) => {
      logger?.error('Request setup failed', {
        error: error.message,
        stack: error.stack,
      });
      return Promise.reject(new NetworkError('Failed to setup request', error));
    },
  );

  // RESPONSE INTERCEPTOR
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      const timedConfig = response.config as TimedAxiosRequestConfig;
      const duration = timedConfig._requestTime ? Date.now() - timedConfig._requestTime : undefined;

      const rateLimitInfo = parseRateLimitHeaders(response.headers);

      logger?.debug('HTTP Response', {
        requestId: timedConfig._requestId,
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
        duration: duration ? `${duration}ms` : undefined,
        ...rateLimitInfo,
      });

      if (rateLimitInfo.remaining !== undefined && rateLimitInfo.limit !== undefined) {
        const percentage = (rateLimitInfo.remaining / rateLimitInfo.limit) * 100;
        if (percentage < 20) {
          logger?.warn('Approaching rate limit', {
            remaining: rateLimitInfo.remaining,
            limit: rateLimitInfo.limit,
            percentage: `${percentage.toFixed(1)}%`,
          });
        }
      }

      return response;
    },
    (error: AxiosError) => {
      const timedConfig = error.config as TimedAxiosRequestConfig | undefined;
      const duration = timedConfig?._requestTime
        ? Date.now() - timedConfig._requestTime
        : undefined;

      if (!error.response) {
        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');

        logger?.error('Network error', {
          requestId: timedConfig?._requestId,
          url: error.config?.url,
          code: error.code,
          message: error.message,
          duration: duration ? `${duration}ms` : undefined,
          isTimeout,
        });

        return Promise.reject(
          isTimeout
            ? new TimeoutError('Request timeout', { originalError: error })
            : new NetworkError('Network request failed', {
                code: error.code,
                message: error.message,
                originalError: error,
              }),
        );
      }

      const { status, data, headers } = error.response;
      const errorData = data as any;
      const rateLimitInfo = parseRateLimitHeaders(headers);

      logger?.error('API error response', {
        requestId: timedConfig?._requestId,
        status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: errorData?.message || errorData?.detail,
        duration: duration ? `${duration}ms` : undefined,
        ...rateLimitInfo,
      });

      let typedError;

      switch (status) {
        case 401:
          typedError = new AuthenticationError(
            errorData?.message || errorData?.detail || 'Authentication failed',
            { ...errorData, url: error.config?.url },
          );
          onAuthError?.(typedError);
          break;

        case 403:
          typedError = new AuthenticationError(
            errorData?.message || errorData?.detail || 'Access forbidden',
            { ...errorData, url: error.config?.url },
          );
          onAuthError?.(typedError);
          break;

        case 429:
          const retryAfter = headers['retry-after'] ? parseInt(headers['retry-after']) : undefined;

          typedError = new RateLimitError(
            errorData?.message || errorData?.detail || 'Rate limit exceeded',
            retryAfter,
            {
              limit: rateLimitInfo.limit,
              remaining: rateLimitInfo.remaining,
              reset: rateLimitInfo.reset,
              url: error.config?.url,
            },
          );
          onRateLimit?.(typedError);
          break;

        case 400:
          typedError = new ValidationError(
            errorData?.message || errorData?.detail || 'Validation failed',
            { ...errorData, url: error.config?.url },
          );
          break;

        case 402:
          typedError = new QuotaExceededError(
            errorData?.message || errorData?.detail || 'Quota exceeded',
            { ...errorData, url: error.config?.url },
          );
          onQuotaExceeded?.(typedError);
          break;

        case 404:
          typedError = new APIError(
            errorData?.message || errorData?.detail || 'Resource not found',
            status,
            { ...errorData, url: error.config?.url },
          );
          break;

        case 422:
          typedError = new ValidationError(
            errorData?.message || errorData?.detail || 'Unprocessable entity',
            { ...errorData, url: error.config?.url },
          );
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          typedError = new APIError(
            errorData?.message || errorData?.detail || `Server error: ${status}`,
            status,
            { ...errorData, url: error.config?.url, retryable: true },
          );
          break;

        default:
          typedError = new APIError(
            errorData?.message || errorData?.detail || `API error: ${status}`,
            status,
            { ...errorData, url: error.config?.url },
          );
      }

      return Promise.reject(typedError);
    },
  );
}

function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  return `req_${timestamp}_${randomPart}`;
}

function sanitizeHeadersForLogging(headers: any): Record<string, string> {
  if (!headers) return {};

  const sanitized: Record<string, string> = {};
  const sensitiveKeys = ['authorization', 'x-api-key', 'api-key', 'apikey', 'cookie', 'set-cookie'];

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();

    if (sensitiveKeys.includes(lowerKey)) {
      sanitized[key] = '***REDACTED***';
    } else {
      sanitized[key] = String(value);
    }
  }

  return sanitized;
}

function parseRateLimitHeaders(headers: any): {
  limit?: number;
  remaining?: number;
  reset?: number;
  resetDate?: Date;
} {
  const result: {
    limit?: number;
    remaining?: number;
    reset?: number;
    resetDate?: Date;
  } = {};

  const limitHeader = headers['x-ratelimit-limit'] || headers['ratelimit-limit'];
  const remainingHeader = headers['x-ratelimit-remaining'] || headers['ratelimit-remaining'];
  const resetHeader = headers['x-ratelimit-reset'] || headers['ratelimit-reset'];

  if (limitHeader) {
    result.limit = parseInt(limitHeader);
  }

  if (remainingHeader) {
    result.remaining = parseInt(remainingHeader);
  }

  if (resetHeader) {
    result.reset = parseInt(resetHeader);
    if (!isNaN(result.reset)) {
      result.resetDate = new Date(result.reset * 1000);
    }
  }

  return result;
}

export function addCustomInterceptor(
  axiosInstance: AxiosInstance,
  interceptor: {
    request?: (
      config: InternalAxiosRequestConfig,
    ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
    response?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
    error?: (error: any) => any;
  },
): { eject: () => void } {
  const requestId = interceptor.request
    ? axiosInstance.interceptors.request.use(interceptor.request)
    : undefined;

  const responseId =
    interceptor.response || interceptor.error
      ? axiosInstance.interceptors.response.use(interceptor.response, interceptor.error)
      : undefined;

  return {
    eject: () => {
      if (requestId !== undefined) {
        axiosInstance.interceptors.request.eject(requestId);
      }
      if (responseId !== undefined) {
        axiosInstance.interceptors.response.eject(responseId);
      }
    },
  };
}
