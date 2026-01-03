/**
 * MailSafePro SDK - Official JavaScript/TypeScript SDK
 * Entry point - exporta todas las clases, tipos e interfaces públicas
 */

// Cliente principal
export { MailSafeProClient } from './client';
export type { MailSafeProClientOptions } from './client';

// Auth
export { AuthClient } from './auth/authClient';
export type { AuthClientOptions } from './auth/authClient';
export type {
  UserSession,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  LoginRequest,
} from './auth/types';

// Validation
export { ValidationClient } from './validation/validationClient';
export type { ValidationClientOptions } from './validation/validationClient';
export type {
  EmailValidationRequest,
  EmailValidationResponse,
  BatchValidationRequest,
  BatchValidationResponse,
  UploadOptions,
  BatchJobStatus,
  ValidationStats,
} from './validation/types';

// HTTP Client
export { HttpClient } from './http/httpClient';
export type { HttpClientConfig } from './http/httpClient';

// Errors
export {
  MailSafeProError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NetworkError,
  APIError,
  QuotaExceededError,
  ConfigurationError,
  TimeoutError,
} from './errors';

// Utilities
export { ConsoleLogger, SilentLogger, MemoryLogger, createLogger } from './utils/logger';
export type { Logger, LoggerOptions } from './utils/logger';

export { RateLimiter } from './utils/rateLimiter';
export type { RateLimiterConfig } from './utils/rateLimiter';

export { withRetry, RetryPolicy } from './utils/retry';
export type { RetryConfig } from './utils/retry';

export {
  validateEmail,
  validateEmails,
  validateDomain,
  validateApiKey,
  validateBaseURL,
  validateBatchOptions,
  validateTimeout,
  validateJobId,
  sanitizeEmailForLogging,
} from './utils/validation';

// Interceptors
export { setupInterceptors, addCustomInterceptor } from './interceptors';
export type { InterceptorConfig } from './interceptors';

// Constants
export {
  SDK_VERSION,
  SDK_NAME,
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT,
  DEFAULT_RATE_LIMIT,
  MAX_BATCH_SIZE,
  API_ENDPOINTS,
} from './config/defaults';
export type { LogLevel } from './config/defaults';

// Re-export common types
export type { AxiosRequestConfig, AxiosResponse } from 'axios';
