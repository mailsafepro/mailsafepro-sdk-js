/**
 * Types para autenticación
 */

export interface UserSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  email: string;
  scopes: string[];
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // en segundos
  email: string;
  scopes: string[];
  token_type?: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetPasswordRequest {
  token: string;
  newPassword: string;
}
