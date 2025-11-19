/**
 * Validación de inputs del lado del cliente
 * Previene requests inválidos antes de enviarlos a la API
 */

import { ValidationError, ConfigurationError } from '../errors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_LABEL_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

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
  if (email.length > 320) {
    throw new ValidationError(`Email too long: ${email.length} characters (max 320)`);
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

  if (localPart.length > 64) {
    throw new ValidationError(`Local part too long: ${localPart.length} characters (max 64)`);
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

  if (emails.length > 1000) {
    throw new ValidationError(`Batch size too large: ${emails.length} emails (max 1000)`);
  }

  // Validar cada email y reportar índice en caso de error
  emails.forEach((email, index) => {
    try {
      validateEmail(email);
    } catch (error: any) {
      throw new ValidationError(`Invalid email at index ${index}: ${error.message}`, {
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
  if (trimmed.length > 253) {
    throw new ValidationError(`Domain too long: ${trimmed.length} characters (max 253)`);
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

    if (label.length > 63) {
      throw new ValidationError(
        `Domain label too long: "${label}" (${label.length} characters, max 63)`,
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

  if (apiKey.length < 20) {
    throw new ValidationError('API Key appears to be invalid (too short, minimum 20 characters)');
  }

  // Verificar caracteres válidos
  if (!/^[A-Za-z0-9_\-]+$/.test(apiKey)) {
    throw new ValidationError(
      'API Key contains invalid characters (only alphanumeric, underscore, and hyphen allowed)',
    );
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
