/**
 * Cliente HTTP con retry, rate limiting y manejo de errores
 */

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';

import { DEFAULT_HTTP_CONFIG, DEFAULT_TIMEOUT } from '../config/defaults';
import type { InterceptorConfig } from '../interceptors';
import { setupInterceptors } from '../interceptors';
import type { Logger } from '../utils/logger';
import type { RateLimiterConfig } from '../utils/rateLimiter';
import { RateLimiter } from '../utils/rateLimiter';
import type { RetryConfig } from '../utils/retry';
import { withRetry, DEFAULT_RETRY_CONFIG } from '../utils/retry';

// CORREGIDO: Extender AxiosRequestConfig correctamente
export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retryConfig?: Partial<RetryConfig>;
  rateLimitConfig?: RateLimiterConfig;
  enableRetry?: boolean;
  logger?: Logger;
  interceptorConfig?: InterceptorConfig;
  maxRedirects?: number;
  maxContentLength?: number;
  validateStatus?: (status: number) => boolean;
}

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private logger?: Logger;
  private rateLimiter?: RateLimiter;
  private enableRetry: boolean;
  private retryConfig: RetryConfig;

  constructor(config: HttpClientConfig) {
    this.logger = config.logger;
    this.enableRetry = config.enableRetry ?? true;

    // Configuración de retry
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...config.retryConfig,
      logger: this.logger,
    };

    // Setup rate limiter si está configurado
    if (config.rateLimitConfig) {
      this.rateLimiter = new RateLimiter({
        ...config.rateLimitConfig,
        logger: this.logger,
      });
      this.logger?.info('Rate limiter enabled', config.rateLimitConfig);
    }

    // CORREGIDO: Crear configuración de Axios separada
    const axiosConfig: AxiosRequestConfig = {
      baseURL: config.baseURL,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      headers: config.headers || DEFAULT_HTTP_CONFIG.headers,
      maxRedirects: config.maxRedirects || 5,
      maxContentLength: config.maxContentLength || 50 * 1024 * 1024,
      validateStatus: config.validateStatus || ((status: number) => status >= 200 && status < 300),
    };

    this.axiosInstance = axios.create(axiosConfig);

    // Setup interceptors
    setupInterceptors(this.axiosInstance, {
      logger: this.logger,
      ...config.interceptorConfig,
    });

    this.logger?.debug('HttpClient initialized', {
      baseURL: axiosConfig.baseURL,
      timeout: axiosConfig.timeout,
      enableRetry: this.enableRetry,
      hasRateLimiter: !!this.rateLimiter,
    });
  }

  /**
   * Realiza un request HTTP con retry y rate limiting
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const executeRequest = async (): Promise<T> => {
      try {
        const response: AxiosResponse<T> = await this.axiosInstance.request(config);
        return response.data;
      } catch (error: any) {
        throw error;
      }
    };

    // Aplicar rate limiting si está configurado
    const rateLimitedRequest = this.rateLimiter
      ? () => this.rateLimiter!.execute(executeRequest)
      : executeRequest;

    // Aplicar retry logic si está habilitado
    if (this.enableRetry) {
      return withRetry(rateLimitedRequest, this.retryConfig);
    }

    return rateLimitedRequest();
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  async head<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'HEAD', url });
  }

  async options<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'OPTIONS', url });
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  getRateLimiterStats(): ReturnType<RateLimiter['getStats']> | null {
    return this.rateLimiter?.getStats() || null;
  }

  clearRateLimiter(): void {
    this.rateLimiter?.clear();
  }

  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = {
      ...this.retryConfig,
      ...config,
    };
    this.logger?.debug('Retry config updated', this.retryConfig);
  }

  setRetryEnabled(enabled: boolean): void {
    this.enableRetry = enabled;
    this.logger?.debug(`Retry ${enabled ? 'enabled' : 'disabled'}`);
  }
}
