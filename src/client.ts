/**
 * Cliente principal de MailSafePro SDK
 */

import { AuthClient } from './auth/authClient';
import type { UserSession } from './auth/types';
import { DEFAULT_BASE_URL, SDK_VERSION } from './config/defaults';
import { ConfigurationError } from './errors';
import { HttpClient } from './http/httpClient';
import type { Logger, LoggerOptions } from './utils/logger';
import { createLogger } from './utils/logger';
import type { RateLimiterConfig } from './utils/rateLimiter';
import { validateApiKey, validateBaseURL } from './utils/validation';
import type {
  EmailValidationRequest,
  EmailValidationResponse,
  BatchValidationRequest,
  BatchValidationResponse,
  UploadOptions,
  BatchJobStatus,
} from './validation/types';
import { ValidationClient } from './validation/validationClient';

// CORREGIDO: Quitar AuthClientOptions y ValidationClientOptions no usados
export interface MailSafeProClientOptions {
  baseURL?: string;
  apiKey?: string;
  logger?: Logger | LoggerOptions;
  timeout?: number;
  maxRetries?: number;
  rateLimitConfig?: RateLimiterConfig;
  autoRefresh?: boolean;
  enableRetry?: boolean;
}

export class MailSafeProClient {
  public readonly version = SDK_VERSION;

  private authClient: AuthClient;
  private validationClient: ValidationClient;
  private httpClient: HttpClient;
  private logger: Logger;
  private baseURL: string;

  constructor(options: MailSafeProClientOptions = {}) {
    this.baseURL = options.baseURL || DEFAULT_BASE_URL;
    validateBaseURL(this.baseURL);

    if (options.apiKey) {
      try {
        validateApiKey(options.apiKey);
      } catch (error: any) {
        throw new ConfigurationError('Invalid API Key', { error: error.message });
      }
    }

    if (options.logger) {
      if ('debug' in options.logger && typeof options.logger.debug === 'function') {
        this.logger = options.logger;
      } else {
        this.logger = createLogger(options.logger as LoggerOptions);
      }
    } else {
      this.logger = createLogger();
    }

    this.logger.info(`Initializing MailSafePro SDK v${SDK_VERSION}`, {
      baseURL: this.baseURL,
      hasApiKey: !!options.apiKey,
    });

    this.httpClient = new HttpClient({
      baseURL: this.baseURL,
      logger: this.logger,
      timeout: options.timeout,
      enableRetry: options.enableRetry ?? true,
      retryConfig: {
        maxRetries: options.maxRetries,
      },
      rateLimitConfig: options.rateLimitConfig,
    });

    this.authClient = new AuthClient({
      baseURL: this.baseURL,
      apiKey: options.apiKey,
      logger: this.logger,
      httpClient: this.httpClient,
      autoRefresh: options.autoRefresh,
    });

    this.validationClient = new ValidationClient({
      baseURL: this.baseURL,
      logger: this.logger,
      getAuthHeaders: () => this.authClient.getAuthHeaders(),
      httpClient: this.httpClient,
    });

    this.logger.info('MailSafePro SDK initialized successfully');
  }

  // ==========================================
  // MÉTODOS DE AUTENTICACIÓN
  // ==========================================

  async login(email: string, password: string): Promise<UserSession> {
    return this.authClient.login(email, password);
  }

  async register(email: string, password: string, name?: string): Promise<UserSession> {
    return this.authClient.register(email, password, name);
  }

  async logout(): Promise<void> {
    return this.authClient.logout();
  }

  async refreshToken(): Promise<UserSession> {
    return this.authClient.refreshToken();
  }

  getSession(): UserSession | null {
    return this.authClient.getSession();
  }

  isAuthenticated(): boolean {
    return this.authClient.isAuthenticated();
  }

  setApiKey(apiKey: string): void {
    this.authClient.setApiKey(apiKey);
  }

  clearApiKey(): void {
    this.authClient.clearApiKey();
  }

  // ==========================================
  // MÉTODOS DE VALIDACIÓN
  // ==========================================

  async validateEmail(request: EmailValidationRequest): Promise<EmailValidationResponse> {
    return this.validationClient.validateEmail(request);
  }

  async batchValidateEmails(request: BatchValidationRequest): Promise<BatchValidationResponse> {
    return this.validationClient.batchValidateEmails(request);
  }

  async uploadFileBatch(
    file: Buffer | Blob | File,
    options?: UploadOptions,
  ): Promise<BatchJobStatus> {
    return this.validationClient.uploadFileBatch(file, options);
  }

  async getBatchStatus(jobId: string): Promise<BatchJobStatus> {
    return this.validationClient.getBatchStatus(jobId);
  }

  async getBatchResults(jobId: string): Promise<BatchValidationResponse> {
    return this.validationClient.getBatchResults(jobId);
  }

  async waitForBatchCompletion(
    jobId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (status: BatchJobStatus) => void;
    },
  ): Promise<BatchValidationResponse> {
    return this.validationClient.waitForBatchCompletion(jobId, options);
  }

  async cancelBatch(jobId: string): Promise<void> {
    return this.validationClient.cancelBatch(jobId);
  }

  async validateEmailsWithRetry(
    emails: string[],
    options?: {
      checkSmtp?: boolean;
      includeRawDns?: boolean;
      maxRetries?: number;
      onProgress?: (completed: number, total: number) => void;
    },
  ): Promise<EmailValidationResponse[]> {
    return this.validationClient.validateEmailsWithRetry(emails, options);
  }

  // ==========================================
  // MÉTODOS DE UTILIDAD
  // ==========================================

  getRateLimiterStats(): ReturnType<HttpClient['getRateLimiterStats']> {
    return this.httpClient.getRateLimiterStats();
  }

  clearRateLimiter(): void {
    this.httpClient.clearRateLimiter();
  }

  setAutoRefresh(enabled: boolean): void {
    this.authClient.setAutoRefresh(enabled);
  }

  getLogger(): Logger {
    return this.logger;
  }

  destroy(): void {
    this.logger.info('Destroying MailSafePro client');
    this.authClient.clearRefreshTimeout();
    this.httpClient.clearRateLimiter();
    this.logger.info('MailSafePro client destroyed');
  }
}
