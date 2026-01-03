/**
 * Validación de inputs del lado del cliente
 * Previene requests inválidos antes de enviarlos a la API
 */

import { ValidationError, ConfigurationError } from '../errors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_LABEL_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
const API_KEY_REGEX = /^[A-Za-z0-9_\-]+$/;

// Constantes de validación
const MAX_EMAIL_LENGTH = 320;
const MAX_LOCAL_PART_LENGTH = 64;
const MAX_DOMAIN_LENGTH = 253;
const MAX_DOMAIN_LABEL_LENGTH = 63;
const MIN_API_KEY_LENGTH = 20;
const MAX_BATCH_SIZE = 1000;
const MIN_TIMEOUT = 1000; // 1 segundo mínimo
const MAX_TIMEOUT = 300000; // 5 minutos máximo

/**
 * Valida formato de email según RFC 5321
 */
export function validateEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required and must be a string');
  }

  // Trim y verificar vacío
  const trimmed = email.trim();
  if (!trimmed) {
    throw new ValidationError('Email cannot be empty');
  }

  if (email !== trimmed) {
    throw new ValidationError('Email contains leading or trailing whitespace', {
      provided: email,
      expected: trimmed,
    });
  }

  // Longitud total máxima (RFC 5321)
  if (email.length > MAX_EMAIL_LENGTH) {
    throw new ValidationError(`Email too long: ${email.length} characters (max ${MAX_EMAIL_LENGTH})`);
  }

  // Verificar estructura básica
  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError('Invalid email format', { email });
  }

  // Validar partes local y dominio
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) {
    throw new ValidationError('Email must contain @ symbol');
  }

  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex + 1);

  // Validar local part (antes del @)
  if (localPart.length === 0) {
    throw new ValidationError('Local part cannot be empty');
  }

  if (localPart.length > MAX_LOCAL_PART_LENGTH) {
    throw new ValidationError(`Local part too long: ${localPart.length} characters (max ${MAX_LOCAL_PART_LENGTH})`);
  }

  // No puede empezar o terminar con punto
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    throw new ValidationError('Local part cannot start or end with a dot');
  }

  // No puede tener puntos consecutivos
  if (localPart.includes('..')) {
    throw new ValidationError('Local part cannot contain consecutive dots');
  }

  // Validar dominio
  validateDomain(domain);
}

/**
 * Valida array de emails
 */
export function validateEmails(emails: string[]): void {
  if (!Array.isArray(emails)) {
    throw new ValidationError('Emails must be an array');
  }

  if (emails.length === 0) {
    throw new ValidationError('Emails array cannot be empty');
  }

  if (emails.length > MAX_BATCH_SIZE) {
    throw new ValidationError(`Batch size too large: ${emails.length} emails (max ${MAX_BATCH_SIZE})`);
  }

  // Validar cada email y reportar índice en caso de error
  emails.forEach((email, index) => {
    try {
      validateEmail(email);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ValidationError(`Invalid email at index ${index}: ${errorMessage}`, {
        index,
        email,
        originalError: error,
      });
    }
  });

  // Verificar duplicados
  const uniqueEmails = new Set(emails.map(e => e.toLowerCase()));
  if (uniqueEmails.size !== emails.length) {
    throw new ValidationError('Duplicate emails found in batch', {
      total: emails.length,
      unique: uniqueEmails.size,
    });
  }
}

/**
 * Valida formato de dominio según RFC 1035
 */
export function validateDomain(domain: string): void {
  if (!domain || typeof domain !== 'string') {
    throw new ValidationError('Domain is required and must be a string');
  }

  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) {
    throw new ValidationError('Domain cannot be empty');
  }

  // Longitud máxima (RFC 1035)
  if (trimmed.length > MAX_DOMAIN_LENGTH) {
    throw new ValidationError(`Domain too long: ${trimmed.length} characters (max ${MAX_DOMAIN_LENGTH})`);
  }

  // Dividir en labels
  const labels = trimmed.split('.');

  if (labels.length < 2) {
    throw new ValidationError('Domain must have at least two labels');
  }

  // Validar cada label
  labels.forEach((label, index) => {
    if (label.length === 0) {
      throw new ValidationError(`Domain label ${index} is empty`);
    }

    if (label.length > MAX_DOMAIN_LABEL_LENGTH) {
      throw new ValidationError(
        `Domain label too long: "${label}" (${label.length} characters, max ${MAX_DOMAIN_LABEL_LENGTH})`,
      );
    }

    if (!DOMAIN_LABEL_REGEX.test(label)) {
      throw new ValidationError(
        `Invalid domain label: "${label}" (must start/end with alphanumeric)`,
      );
    }
  });

  // TLD debe ser alfabético
  const tld = labels[labels.length - 1];
  if (!/^[a-z]+$/.test(tld)) {
    throw new ValidationError(`Invalid TLD: "${tld}" (must be alphabetic only)`);
  }
}

/**
 * Valida API Key format
 */
export function validateApiKey(apiKey: string): void {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new ValidationError('API Key is required and must be a string');
  }

  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new ValidationError('API Key cannot be empty');
  }

  if (apiKey !== trimmed) {
    throw new ValidationError('API Key contains leading or trailing whitespace');
  }

  if (apiKey.length < MIN_API_KEY_LENGTH) {
    throw new ValidationError(`API Key appears to be invalid (too short, minimum ${MIN_API_KEY_LENGTH} characters)`);
  }

  // Verificar caracteres válidos
  if (!API_KEY_REGEX.test(apiKey)) {
    throw new ValidationError(
      'API Key contains invalid characters (only alphanumeric, underscore, and hyphen allowed)',
    );
  }
}

/**
 * Valida timeout value
 */
export function validateTimeout(timeout: number): void {
  if (typeof timeout !== 'number' || isNaN(timeout)) {
    throw new ValidationError('Timeout must be a valid number');
  }

  if (timeout < MIN_TIMEOUT) {
    throw new ValidationError(`Timeout too short: ${timeout}ms (minimum ${MIN_TIMEOUT}ms)`);
  }

  if (timeout > MAX_TIMEOUT) {
    throw new ValidationError(`Timeout too long: ${timeout}ms (maximum ${MAX_TIMEOUT}ms)`);
  }
}

/**
 * Sanitiza email para logging (oculta parte del local part)
 */
export function sanitizeEmailForLogging(email: string): string {
  if (!email || typeof email !== 'string') {
    return '[invalid]';
  }

  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) {
    return '[invalid]';
  }

  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex + 1);

  if (localPart.length <= 2) {
    return `${'*'.repeat(localPart.length)}@${domain}`;
  }

  const visibleChars = Math.min(2, Math.floor(localPart.length / 3));
  const maskedPart = localPart.substring(0, visibleChars) + '*'.repeat(localPart.length - visibleChars);
  
  return `${maskedPart}@${domain}`;
}

/**
 * Valida job ID format
 */
export function validateJobId(jobId: string): void {
  if (!jobId || typeof jobId !== 'string') {
    throw new ValidationError('Job ID is required and must be a string');
  }

  const trimmed = jobId.trim();
  if (!trimmed) {
    throw new ValidationError('Job ID cannot be empty');
  }

  if (jobId !== trimmed) {
    throw new ValidationError('Job ID contains leading or trailing whitespace');
  }

  // Job IDs típicamente son alfanuméricos con guiones/underscores
  if (!/^[A-Za-z0-9_\-]+$/.test(jobId)) {
    throw new ValidationError('Job ID contains invalid characters');
  }
}

/**
 * Valida Base URL
 */
export function validateBaseURL(baseURL: string): void {
  if (!baseURL || typeof baseURL !== 'string') {
    throw new ConfigurationError('Base URL is required and must be a string');
  }

  const trimmed = baseURL.trim();
  if (!trimmed) {
    throw new ConfigurationError('Base URL cannot be empty');
  }

  try {
    const url = new URL(baseURL);

    // Solo permitir http y https
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new ValidationError(`Invalid protocol: ${url.protocol} (only http and https allowed)`);
    }

    // Verificar que tenga host
    if (!url.host) {
      throw new ValidationError('Base URL must have a valid host');
    }
  } catch (error: any) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ConfigurationError(`Invalid base URL: ${error.message}`, {
      baseURL,
      originalError: error,
    });
  }
}

/**
 * Valida opciones de batch validation
 */
export function validateBatchOptions(options: {
  checkSmtp?: boolean;
  includeRawDns?: boolean;
}): void {
  if (typeof options !== 'object' || options === null) {
    throw new ValidationError('Batch options must be an object');
  }

  if (options.checkSmtp !== undefined && typeof options.checkSmtp !== 'boolean') {
    throw new ValidationError('checkSmtp must be a boolean');
  }

  if (options.includeRawDns !== undefined && typeof options.includeRawDns !== 'boolean') {
    throw new ValidationError('includeRawDns must be a boolean');
  }
}
