/**
 * Sistema de errores tipados para MailSafePro SDK
 * Proporciona jerarquía completa de errores con información detallada
 */

export class MailSafeProError extends Error {
  public readonly statusCode?: number;
  private _code: string;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(message: string, code: string, statusCode?: number, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this._code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  get code(): string {
    return this._code;
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

export class AuthenticationError extends MailSafeProError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
  }
}

export class RateLimitError extends MailSafeProError {
  public readonly retryAfter?: number;
  public readonly limit?: number;
  public readonly remaining?: number;
  public readonly reset?: Date;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number, details?: any) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, details);
    this.retryAfter = retryAfter;

    if (details) {
      this.limit = details.limit;
      this.remaining = details.remaining;
      this.reset = details.reset ? new Date(details.reset * 1000) : undefined;
    }
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
      limit: this.limit,
      remaining: this.remaining,
      reset: this.reset?.toISOString(),
    };
  }
}

export class ValidationError extends MailSafeProError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class NetworkError extends MailSafeProError {
  public readonly isTimeout: boolean;

  constructor(message: string, details?: any, isTimeout: boolean = false) {
    super(message, 'NETWORK_ERROR', undefined, details);
    this.isTimeout = isTimeout;
  }
}

export class APIError extends MailSafeProError {
  constructor(message: string, statusCode: number, details?: any) {
    super(message, 'API_ERROR', statusCode, details);
  }
}

export class QuotaExceededError extends MailSafeProError {
  public readonly used?: number;
  public readonly limit?: number;

  constructor(message: string = 'Quota exceeded', details?: any) {
    super(message, 'QUOTA_EXCEEDED', 402, details);

    if (details) {
      this.used = details.used;
      this.limit = details.limit;
    }
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      used: this.used,
      limit: this.limit,
    };
  }
}

export class ConfigurationError extends MailSafeProError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', undefined, details);
  }
}

export class TimeoutError extends NetworkError {
  constructor(message: string = 'Request timeout', details?: any) {
    super(message, details, true);
  }
}
