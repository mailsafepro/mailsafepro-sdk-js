/**
 * Configuración por defecto del SDK
 */

export const SDK_VERSION = '1.0.0';
export const SDK_NAME = 'mailsafepro-sdk';
export const USER_AGENT = `${SDK_NAME}/${SDK_VERSION}`;

export const DEFAULT_BASE_URL = 'https://api.mailsafepro.com/v1';

export const DEFAULT_TIMEOUT = 30000;
export const DEFAULT_CONNECT_TIMEOUT = 10000;
export const UPLOAD_TIMEOUT = 120000;

export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_RETRY_DELAY = 500;
export const MAX_RETRY_DELAY = 30000;
export const RETRY_BACKOFF_MULTIPLIER = 2;

export const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

export const RETRY_ERROR_CODES = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ENETUNREACH',
  'ENOTFOUND',
  'EAI_AGAIN',
];

export const DEFAULT_RATE_LIMIT = {
  maxRequestsPerSecond: 10,
  maxConcurrent: 5,
};

export const MAX_BATCH_SIZE = 1000;
export const MIN_BATCH_SIZE = 1;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const SUPPORTED_FILE_TYPES = [
  'text/csv',
  'text/plain',
  'application/json',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const TOKEN_REFRESH_MARGIN_SECONDS = 60;
export const MIN_TOKEN_LIFETIME_SECONDS = 120;

export const DEFAULT_HTTP_HEADERS = {
  'User-Agent': USER_AGENT,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'X-SDK-Version': SDK_VERSION,
};

export const DEFAULT_CACHE_TTL = 300;
export const MAX_CACHE_SIZE = 1000;

export const MAX_EMAIL_LENGTH = 320;
export const MAX_LOCAL_PART_LENGTH = 64;
export const MAX_DOMAIN_LENGTH = 253;
export const MAX_DOMAIN_LABEL_LENGTH = 63;

export const MIN_API_KEY_LENGTH = 20;

export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

export const DEFAULT_HTTP_CONFIG = {
  timeout: DEFAULT_TIMEOUT,
  headers: DEFAULT_HTTP_HEADERS,
  validateStatus: (status: number) => status >= 200 && status < 300,
  maxRedirects: 5,
  maxContentLength: 50 * 1024 * 1024,
};

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  VERIFY_EMAIL: '/auth/verify-email',
  RESET_PASSWORD: '/auth/reset-password',
  VALIDATE_SINGLE: '/email/validate',
  VALIDATE_BATCH: '/email/batch',
  BATCH_UPLOAD: '/email/batch/upload',
  BATCH_STATUS: '/email/batch/:jobId',
  PROFILE: '/account/profile',
  USAGE: '/account/usage',
  API_KEYS: '/account/api-keys',
} as const;

/**
 * Environment detection
 * CORREGIDO: Usar typeof para evitar error de referencia
 */
export const isNode = process?.versions?.node != null;

// CORREGIDO: Verificar si window existe con typeof
export const isBrowser =
  typeof window !== 'undefined' && typeof (window as any).document !== 'undefined';

export const FEATURES = {
  AUTO_RETRY: true,
  RATE_LIMITING: true,
  REQUEST_LOGGING: true,
  RESPONSE_CACHING: false,
  AUTO_TOKEN_REFRESH: true,
  TELEMETRY: false,
} as const;
