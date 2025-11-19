/**
 * Integration tests para ValidationClient
 */

import { ValidationClient } from '../../src/validation/validationClient';
import { HttpClient } from '../../src/http/httpClient';
import { SilentLogger } from '../../src/utils/logger';
import { ValidationError } from '../../src/errors';

// Mock HttpClient
jest.mock('../../src/http/httpClient');

describe('ValidationClient', () => {
  let validationClient: ValidationClient;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    } as any;

    validationClient = new ValidationClient({
      baseURL: 'https://api.test.com',
      httpClient: mockHttpClient,
      getAuthHeaders: () => ({ 'X-API-Key': 'test_key' }),
      logger: new SilentLogger(),
    });
  });

  describe('validateEmail', () => {
    it('should validate email successfully', async () => {
      const mockResponse = {
        email: 'test@example.com',
        valid: true,
        riskScore: 10,
        provider: 'gmail',
        mailboxExists: true,
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await validationClient.validateEmail({
        email: 'test@example.com',
        checkSmtp: true,
      });

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/email/validate',
        {
          email: 'test@example.com',
          checkSmtp: true,
        },
        expect.objectContaining({
          headers: { 'X-API-Key': 'test_key' },
        }),
      );
    });

    it('should validate email without SMTP check', async () => {
      const mockResponse = {
        email: 'test@example.com',
        valid: true,
        riskScore: 15,
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await validationClient.validateEmail({
        email: 'test@example.com',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should reject invalid email format', async () => {
      await expect(validationClient.validateEmail({ email: 'invalid' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should handle validation with raw DNS', async () => {
      const mockResponse = {
        email: 'test@example.com',
        valid: true,
        riskScore: 10,
        dnsRecords: {
          mx: ['mx1.example.com'],
        },
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await validationClient.validateEmail({
        email: 'test@example.com',
        includeRawDns: true,
      });

      expect(result.dnsRecords).toBeDefined();
    });
  });

  describe('batchValidateEmails', () => {
    it('should validate batch of emails', async () => {
      const mockResponse = {
        results: [
          { email: 'test1@example.com', valid: true, riskScore: 10 },
          { email: 'test2@example.com', valid: true, riskScore: 15 },
        ],
        validCount: 2,
        invalidCount: 0,
        processingTime: 150,
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await validationClient.batchValidateEmails({
        emails: ['test1@example.com', 'test2@example.com'],
      });

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/email/batch',
        {
          emails: ['test1@example.com', 'test2@example.com'],
        },
        expect.any(Object),
      );
    });

    it('should reject empty email array', async () => {
      await expect(validationClient.batchValidateEmails({ emails: [] })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should reject array exceeding max size', async () => {
      const tooManyEmails = Array(1001)
        .fill(0)
        .map((_, i) => `user${i}@example.com`);

      await expect(validationClient.batchValidateEmails({ emails: tooManyEmails })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should reject duplicate emails', async () => {
      await expect(
        validationClient.batchValidateEmails({
          emails: ['test@example.com', 'test@example.com'],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should validate batch with SMTP check', async () => {
      const mockResponse = {
        results: [{ email: 'test@example.com', valid: true, mailboxExists: true }],
        validCount: 1,
        invalidCount: 0,
        processingTime: 100,
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await validationClient.batchValidateEmails({
        emails: ['test@example.com'],
        checkSmtp: true,
      });

      expect(result.results[0].mailboxExists).toBe(true);
    });
  });

  describe('uploadFileBatch', () => {
    it('should upload file as Buffer', async () => {
      const mockResponse = {
        jobId: 'job_123',
        status: 'processing',
        progress: 0,
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const fileBuffer = Buffer.from('email1@example.com\nemail2@example.com');

      const result = await validationClient.uploadFileBatch(fileBuffer, {
        filename: 'emails.csv',
        contentType: 'text/csv',
      });

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalled();
    });

    it('should upload file with default options', async () => {
      const mockResponse = {
        jobId: 'job_123',
        status: 'processing',
        progress: 0,
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const fileBuffer = Buffer.from('test@example.com');

      const result = await validationClient.uploadFileBatch(fileBuffer);

      expect(result.jobId).toBe('job_123');
    });

    it('should handle Blob upload in browser', async () => {
      const mockResponse = {
        jobId: 'job_456',
        status: 'processing',
        progress: 0,
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      // Mock Blob
      const blob = new Blob(['test@example.com'], { type: 'text/csv' });

      const result = await validationClient.uploadFileBatch(blob, {
        filename: 'emails.csv',
      });

      expect(result.jobId).toBe('job_456');
    });
  });

  describe('getBatchStatus', () => {
    it('should get batch job status', async () => {
      const mockStatus = {
        jobId: 'job_123',
        status: 'completed',
        progress: 100,
        totalEmails: 100,
        processedEmails: 100,
      };

      mockHttpClient.get.mockResolvedValue(mockStatus);

      const result = await validationClient.getBatchStatus('job_123');

      expect(result).toEqual(mockStatus);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/email/batch/job_123', expect.any(Object));
    });

    it('should reject invalid job ID', async () => {
      await expect(validationClient.getBatchStatus('')).rejects.toThrow(ValidationError);
    });
  });

  describe('getBatchResults', () => {
    it('should get batch results when completed', async () => {
      const mockStatus = {
        jobId: 'job_123',
        status: 'completed',
        progress: 100,
        results: {
          results: [
            { email: 'test1@example.com', valid: true, riskScore: 10 },
            { email: 'test2@example.com', valid: false, riskScore: 80 },
          ],
          validCount: 1,
          invalidCount: 1,
          processingTime: 5000,
        },
      };

      mockHttpClient.get.mockResolvedValue(mockStatus);

      const result = await validationClient.getBatchResults('job_123');

      expect(result).toBeDefined();
      expect(result.results).toHaveLength(2);
    });

    it('should throw when batch not completed', async () => {
      const mockStatus = {
        jobId: 'job_123',
        status: 'processing',
        progress: 50,
      };

      mockHttpClient.get.mockResolvedValue(mockStatus);

      await expect(validationClient.getBatchResults('job_123')).rejects.toThrow(ValidationError);
    });
  });

  describe('cancelBatch', () => {
    it('should cancel batch job', async () => {
      mockHttpClient.delete.mockResolvedValue({ success: true });

      await expect(validationClient.cancelBatch('job_123')).resolves.not.toThrow();

      // Si el método existe y se ejecuta sin error, el test pasa
    });

    it('should reject invalid job ID', async () => {
      await expect(validationClient.cancelBatch('')).rejects.toThrow(ValidationError);
    });
  });

  describe('waitForBatchCompletion', () => {
    it('should wait for batch completion', async () => {
      const mockStatus = {
        jobId: 'job_123',
        status: 'completed',
        progress: 100,
        results: {
          results: [{ email: 'test@example.com', valid: true }],
          validCount: 1,
          invalidCount: 0,
          processingTime: 1000,
        },
      };

      mockHttpClient.get.mockResolvedValue(mockStatus);

      const result = await validationClient.waitForBatchCompletion('job_123', {
        pollInterval: 10,
      });

      expect(result).toBeDefined();
      expect(result.results).toHaveLength(1);
    });

    it('should call progress callback', async () => {
      const onProgress = jest.fn();

      const mockStatus = {
        jobId: 'job_123',
        status: 'completed',
        progress: 100,
        results: {
          results: [],
          validCount: 0,
          invalidCount: 0,
          processingTime: 100,
        },
      };

      mockHttpClient.get.mockResolvedValue(mockStatus);

      await validationClient.waitForBatchCompletion('job_123', {
        pollInterval: 10,
        onProgress,
      });

      expect(onProgress).toHaveBeenCalled();
    });

    it('should throw on failed batch', async () => {
      mockHttpClient.get.mockResolvedValue({
        jobId: 'job_123',
        status: 'failed',
        error: 'Processing failed',
      });

      await expect(
        validationClient.waitForBatchCompletion('job_123', { pollInterval: 10 }),
      ).rejects.toThrow('Batch job failed');
    });

    it('should timeout if taking too long', async () => {
      mockHttpClient.get.mockResolvedValue({
        jobId: 'job_123',
        status: 'processing',
        progress: 10,
      });

      await expect(
        validationClient.waitForBatchCompletion('job_123', {
          pollInterval: 10,
          timeout: 100,
        }),
      ).rejects.toThrow('Batch job timeout');
    }, 10000);
  });

  describe('validateEmailsWithRetry', () => {
    it('should validate emails with retry', async () => {
      const mockResponses = [
        { email: 'test1@example.com', valid: true, riskScore: 10 },
        { email: 'test2@example.com', valid: true, riskScore: 15 },
      ];

      mockHttpClient.post
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);

      const results = await validationClient.validateEmailsWithRetry(
        ['test1@example.com', 'test2@example.com'],
        { maxRetries: 3 },
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockResponses[0]);
      expect(results[1]).toEqual(mockResponses[1]);
    });

    it('should call progress callback', async () => {
      const onProgress = jest.fn();

      mockHttpClient.post
        .mockResolvedValueOnce({ email: 'test1@example.com', valid: true })
        .mockResolvedValueOnce({ email: 'test2@example.com', valid: true });

      await validationClient.validateEmailsWithRetry(['test1@example.com', 'test2@example.com'], {
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith(1, 2);
      expect(onProgress).toHaveBeenCalledWith(2, 2);
    });

    it('should retry on failure', async () => {
      mockHttpClient.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ email: 'test@example.com', valid: true });

      const results = await validationClient.validateEmailsWithRetry(['test@example.com'], {
        maxRetries: 2,
      });

      expect(results).toHaveLength(1);
      expect(mockHttpClient.post).toHaveBeenCalledTimes(2);
    });

    it('should continue with other emails if one fails', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Permanent error'));

      const results = await validationClient.validateEmailsWithRetry(['test@example.com'], {
        maxRetries: 1,
      });

      // Debería devolver array vacío o manejar el error
      expect(results).toEqual([]);
    });
  });
});
