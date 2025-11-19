/**
 * Types para validación de emails
 */

export interface EmailValidationRequest {
  email: string;
  checkSmtp?: boolean;
  includeRawDns?: boolean;
  timeout?: number;
}

export interface EmailValidationResponse {
  email: string;
  valid: boolean;
  reputation: number;
  riskScore: number;
  provider?: string;
  mxServer?: string;
  mailboxExists?: boolean;
  disposable?: boolean;
  freeProvider?: boolean;
  roleAccount?: boolean;
  hasCatchAll?: boolean;
  detail?: string;
  reason?: string;
  suggestions?: string[];
  rawDns?: {
    mx?: any[];
    a?: any[];
    txt?: any[];
  };
  validationTime?: number;
  [key: string]: any;
}

export interface BatchValidationRequest {
  emails: string[];
  checkSmtp?: boolean;
  includeRawDns?: boolean;
  async?: boolean;
}

export interface BatchValidationResponse {
  results: EmailValidationResponse[];
  validCount: number;
  invalidCount: number;
  processingTime: number;
  summary?: {
    disposable: number;
    freeProvider: number;
    roleAccount: number;
    [key: string]: any;
  };
}

export interface UploadOptions {
  filename?: string;
  contentType?: string;
  checkSmtp?: boolean;
  includeRawDns?: boolean;
  async?: boolean;
}

export interface BatchJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  totalEmails?: number;
  processedEmails?: number;
  validEmails?: number;
  invalidEmails?: number;
  startedAt?: string;
  completedAt?: string;
  estimatedTimeRemaining?: number;
  results?: BatchValidationResponse;
  error?: string;
  downloadUrl?: string;
}

export interface ValidationStats {
  total: number;
  valid: number;
  invalid: number;
  disposable: number;
  freeProvider: number;
  roleAccount: number;
  catchAll: number;
}
