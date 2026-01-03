/**
 * Cliente de validación de emails
 * Maneja validación individual, batch y upload de archivos
 */

import { API_ENDPOINTS, MAX_BATCH_SIZE, UPLOAD_TIMEOUT } from '../config/defaults';
import { ValidationError } from '../errors';
import { HttpClient } from '../http/httpClient';
import type { Logger } from '../utils/logger';
import { validateEmail, validateEmails, validateBatchOptions, validateJobId, sanitizeEmailForLogging } from '../utils/validation';

import type {
  EmailValidationRequest,
  EmailValidationResponse,
  BatchValidationRequest,
  BatchValidationResponse,
  UploadOptions,
  BatchJobStatus,
} from './types';

export interface ValidationClientOptions {
  baseURL: string;
  httpClient?: HttpClient;
  logger?: Logger;
  getAuthHeaders: () => Record<string, string>;
}

export class ValidationClient {
  private baseURL: string;
  private httpClient: HttpClient;
  private logger?: Logger;
  private getAuthHeaders: () => Record<string, string>;

  constructor(options: ValidationClientOptions) {
    this.baseURL = options.baseURL;
    this.logger = options.logger;
    this.getAuthHeaders = options.getAuthHeaders;

    this.httpClient =
      options.httpClient ??
      new HttpClient({
        baseURL: this.baseURL,
        logger: this.logger,
      });

    this.logger?.debug('ValidationClient initialized', {
      baseURL: this.baseURL,
    });
  }

  /**
   * Valida un email individual
   */
  async validateEmail(request: EmailValidationRequest): Promise<EmailValidationResponse> {
    // Validar input
    validateEmail(request.email);

    if (request.checkSmtp !== undefined && typeof request.checkSmtp !== 'boolean') {
      throw new ValidationError('checkSmtp must be a boolean');
    }

    if (request.includeRawDns !== undefined && typeof request.includeRawDns !== 'boolean') {
      throw new ValidationError('includeRawDns must be a boolean');
    }

    // Sanitizar email para logging
    const sanitizedEmail = sanitizeEmailForLogging(request.email);
    
    this.logger?.info(`Validating email: ${sanitizedEmail}`, {
      checkSmtp: request.checkSmtp,
      includeRawDns: request.includeRawDns,
    });

    try {
      const headers = this.getAuthHeaders();
      const response = await this.httpClient.post<EmailValidationResponse>(
        API_ENDPOINTS.VALIDATE_SINGLE,
        request,
        { headers },
      );

      this.logger?.debug('Email validation completed', {
        email: sanitizedEmail,
        valid: response.valid,
        riskScore: response.riskScore,
      });

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger?.error('Email validation failed', {
        email: sanitizedEmail,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Valida múltiples emails en batch
   */
  async batchValidateEmails(request: BatchValidationRequest): Promise<BatchValidationResponse> {
    // Validar inputs
    validateEmails(request.emails);
    validateBatchOptions(request);

    if (request.emails.length > MAX_BATCH_SIZE) {
      throw new ValidationError(
        `Batch size exceeds maximum: ${request.emails.length} > ${MAX_BATCH_SIZE}`,
      );
    }

    this.logger?.info(`Batch validating ${request.emails.length} emails`, {
      checkSmtp: request.checkSmtp,
      includeRawDns: request.includeRawDns,
    });

    try {
      const headers = this.getAuthHeaders();
      const response = await this.httpClient.post<BatchValidationResponse>(
        API_ENDPOINTS.VALIDATE_BATCH,
        request,
        { headers },
      );

      this.logger?.info('Batch validation completed', {
        total: request.emails.length,
        valid: response.validCount,
        invalid: response.invalidCount,
        processingTime: response.processingTime,
      });

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger?.error('Batch validation failed', {
        count: request.emails.length,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Upload de archivo para validación batch
   */
  async uploadFileBatch(
    file: Buffer | Blob | File,
    options?: UploadOptions,
  ): Promise<BatchJobStatus> {
    if (!file) {
      throw new ValidationError('File is required for batch upload');
    }

    // Validar tamaño del archivo si es posible
    const fileSize = file instanceof Buffer ? file.length : (file as Blob).size;
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxFileSize) {
      throw new ValidationError(`File too large: ${fileSize} bytes (max ${maxFileSize} bytes)`);
    }

    this.logger?.info('Uploading file for batch validation', {
      filename: options?.filename,
      contentType: options?.contentType,
      size: fileSize,
    });

    try {
      const headers = {
        ...this.getAuthHeaders(),
      };

      // Crear FormData para el upload
      const formData = new FormData();

      if (file instanceof Buffer) {
        // Node.js Buffer
        const blob = new Blob([file], {
          type: options?.contentType || 'application/octet-stream',
        });
        formData.append('file', blob, options?.filename || 'emails.csv');
      } else {
        // Browser File/Blob
        formData.append('file', file, options?.filename);
      }

      // Agregar opciones adicionales si existen
      if (options?.checkSmtp !== undefined) {
        formData.append('checkSmtp', String(options.checkSmtp));
      }
      if (options?.includeRawDns !== undefined) {
        formData.append('includeRawDns', String(options.includeRawDns));
      }

      const response = await this.httpClient.post<BatchJobStatus>(
        API_ENDPOINTS.BATCH_UPLOAD,
        formData,
        {
          headers,
          timeout: UPLOAD_TIMEOUT,
        },
      );

      this.logger?.info('File uploaded successfully', {
        jobId: response.jobId,
        status: response.status,
      });

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger?.error('File upload failed', {
        filename: options?.filename,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Obtiene el estado de un trabajo batch
   */
  async getBatchStatus(jobId: string): Promise<BatchJobStatus> {
    validateJobId(jobId);

    this.logger?.debug(`Getting batch status for job: ${jobId}`);

    try {
      const headers = this.getAuthHeaders();
      const url = API_ENDPOINTS.BATCH_STATUS.replace(':jobId', jobId);

      const response = await this.httpClient.get<BatchJobStatus>(url, { headers });

      this.logger?.debug('Batch status retrieved', {
        jobId,
        status: response.status,
        progress: response.progress,
      });

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger?.error('Failed to get batch status', {
        jobId,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Obtiene resultados de un trabajo batch completado
   */
  async getBatchResults(jobId: string): Promise<BatchValidationResponse> {
    const status = await this.getBatchStatus(jobId);

    if (status.status !== 'completed') {
      throw new ValidationError(`Batch job not completed yet. Current status: ${status.status}`, {
        jobId,
        status: status.status,
        progress: status.progress,
      });
    }

    if (!status.results) {
      throw new ValidationError('Batch results not available', { jobId });
    }

    return status.results;
  }

  /**
   * Espera a que un trabajo batch se complete y retorna los resultados
   */
  async waitForBatchCompletion(
    jobId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (status: BatchJobStatus) => void;
    },
  ): Promise<BatchValidationResponse> {
    const pollInterval = options?.pollInterval || 2000; // 2 segundos por defecto
    const timeout = options?.timeout || 300000; // 5 minutos por defecto
    const startTime = Date.now();

    this.logger?.info(`Waiting for batch completion: ${jobId}`, {
      pollInterval,
      timeout,
    });

    while (true) {
      // Verificar timeout
      if (Date.now() - startTime > timeout) {
        throw new ValidationError('Batch job timeout: took too long to complete', {
          jobId,
          timeout,
        });
      }

      // Obtener estado
      const status = await this.getBatchStatus(jobId);

      // Callback de progreso
      if (options?.onProgress) {
        try {
          options.onProgress(status);
        } catch (error) {
          this.logger?.warn('Progress callback error', error);
        }
      }

      // Verificar si completó
      if (status.status === 'completed') {
        this.logger?.info(`Batch job completed: ${jobId}`);

        if (!status.results) {
          throw new ValidationError('Batch results not available', { jobId });
        }

        return status.results;
      }

      // Verificar si falló
      if (status.status === 'failed') {
        throw new ValidationError(`Batch job failed: ${status.error || 'Unknown error'}`, {
          jobId,
          status,
        });
      }

      // Esperar antes del siguiente poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * Cancela un trabajo batch en progreso
   */
  async cancelBatch(jobId: string): Promise<void> {
    validateJobId(jobId);

    this.logger?.info(`Cancelling batch job: ${jobId}`);

    try {
      const headers = this.getAuthHeaders();
      const url = `${API_ENDPOINTS.BATCH_STATUS.replace(':jobId', jobId)}/cancel`;

      await this.httpClient.post(url, {}, { headers });

      this.logger?.info(`Batch job cancelled: ${jobId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger?.error('Failed to cancel batch job', {
        jobId,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Valida emails con reintentos automáticos para los que fallen
   */
  async validateEmailsWithRetry(
    emails: string[],
    options?: {
      checkSmtp?: boolean;
      includeRawDns?: boolean;
      maxRetries?: number;
      onProgress?: (completed: number, total: number) => void;
    },
  ): Promise<EmailValidationResponse[]> {
    validateEmails(emails);

    const maxRetries = options?.maxRetries || 3;
    const results: EmailValidationResponse[] = [];
    const failed: Array<{ email: string; attempts: number }> = [];

    this.logger?.info(`Validating ${emails.length} emails with retry`, {
      maxRetries,
    });

    // Primera pasada
    for (let i = 0; i < emails.length; i++) {
      try {
        const result = await this.validateEmail({
          email: emails[i],
          checkSmtp: options?.checkSmtp,
          includeRawDns: options?.includeRawDns,
        });
        results.push(result);
      } catch (error) {
        failed.push({ email: emails[i], attempts: 1 });
      }

      // Callback de progreso
      if (options?.onProgress) {
        options.onProgress(i + 1, emails.length);
      }
    }

    // Reintentar los que fallaron
    while (failed.length > 0) {
      const toRetry = failed.filter(f => f.attempts < maxRetries);

      if (toRetry.length === 0) {
        break;
      }

      this.logger?.info(`Retrying ${toRetry.length} failed emails`);

      const stillFailed: typeof failed = [];

      for (const item of toRetry) {
        try {
          const result = await this.validateEmail({
            email: item.email,
            checkSmtp: options?.checkSmtp,
            includeRawDns: options?.includeRawDns,
          });
          results.push(result);
        } catch (error) {
          stillFailed.push({ email: item.email, attempts: item.attempts + 1 });
        }
      }

      failed.length = 0;
      failed.push(...stillFailed);
    }

    if (failed.length > 0) {
      this.logger?.warn(`${failed.length} emails failed after ${maxRetries} retries`);
    }

    return results;
  }
}
