/**
 * Cliente de autenticación
 * Maneja login, logout, refresh de tokens y API keys
 */

import {
  API_ENDPOINTS,
  TOKEN_REFRESH_MARGIN_SECONDS,
  MIN_TOKEN_LIFETIME_SECONDS,
} from '../config/defaults';
import { AuthenticationError, ValidationError } from '../errors';
import { HttpClient } from '../http/httpClient';
import type { Logger } from '../utils/logger';
import { validateEmail, validateApiKey } from '../utils/validation';

import type { UserSession, LoginResponse, RefreshResponse } from './types';

export interface AuthClientOptions {
  baseURL: string;
  httpClient?: HttpClient;
  logger?: Logger;
  apiKey?: string;
  autoRefresh?: boolean;
}

export class AuthClient {
  private baseURL: string;
  private httpClient: HttpClient;
  private logger?: Logger;
  private apiKey?: string;
  private session: UserSession | null = null;
  private refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private autoRefresh: boolean;
  private isRefreshing: boolean = false;

  constructor(options: AuthClientOptions) {
    this.baseURL = options.baseURL;
    this.logger = options.logger;
    this.apiKey = options.apiKey;
    this.autoRefresh = options.autoRefresh ?? true;

    // Validar API key si se proporciona
    if (this.apiKey) {
      try {
        validateApiKey(this.apiKey);
        this.logger?.debug('API Key authentication configured');
      } catch (error: any) {
        this.logger?.warn('Invalid API Key format', error.message);
        throw error;
      }
    }

    this.httpClient =
      options.httpClient ??
      new HttpClient({
        baseURL: this.baseURL,
        logger: this.logger,
      });

    this.logger?.debug('AuthClient initialized', {
      baseURL: this.baseURL,
      hasApiKey: !!this.apiKey,
      autoRefresh: this.autoRefresh,
    });
  }

  /**
   * Login con email y password
   */
  async login(email: string, password: string): Promise<UserSession> {
    // Validar inputs
    validateEmail(email);

    if (!password || typeof password !== 'string') {
      throw new ValidationError('Password is required and must be a string');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    this.logger?.info(`Attempting login for: ${email}`);

    try {
      const response = await this.httpClient.post<LoginResponse>(API_ENDPOINTS.LOGIN, {
        email,
        password,
      });

      const session = this.createSessionFromResponse(response);
      this.session = session;

      this.logger?.info('Login successful', {
        email: session.email,
        expiresAt: session.expiresAt,
        scopes: session.scopes,
      });

      // Programar refresh automático
      if (this.autoRefresh) {
        this.scheduleRefresh(response.expires_in);
      }

      return session;
    } catch (error: any) {
      this.logger?.error('Login failed', {
        email,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Register nuevo usuario
   */
  async register(email: string, password: string, name?: string): Promise<UserSession> {
    // Validar inputs
    validateEmail(email);

    if (!password || typeof password !== 'string') {
      throw new ValidationError('Password is required and must be a string');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    this.logger?.info(`Attempting registration for: ${email}`);

    try {
      const response = await this.httpClient.post<LoginResponse>(API_ENDPOINTS.REGISTER, {
        email,
        password,
        name,
      });

      const session = this.createSessionFromResponse(response);
      this.session = session;

      this.logger?.info('Registration successful', { email: session.email });

      // Programar refresh automático
      if (this.autoRefresh) {
        this.scheduleRefresh(response.expires_in);
      }

      return session;
    } catch (error: any) {
      this.logger?.error('Registration failed', {
        email,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<UserSession> {
    if (!this.session?.refreshToken) {
      throw new AuthenticationError('No refresh token available');
    }

    // Prevenir múltiples refreshes simultáneos
    if (this.isRefreshing) {
      this.logger?.debug('Refresh already in progress, waiting...');

      // Esperar a que termine el refresh en curso
      await new Promise(resolve => setTimeout(resolve, 100));

      if (this.session) {
        return this.session;
      }
      throw new AuthenticationError('Token refresh failed');
    }

    this.isRefreshing = true;
    this.logger?.info('Refreshing access token');

    try {
      const response = await this.httpClient.post<RefreshResponse>(API_ENDPOINTS.REFRESH, {
        refresh_token: this.session.refreshToken,
      });

      const session = this.createSessionFromResponse({
        ...response,
        email: this.session.email,
        scopes: this.session.scopes,
      });

      this.session = session;

      this.logger?.info('Token refreshed successfully', {
        expiresAt: session.expiresAt,
      });

      // Programar próximo refresh
      if (this.autoRefresh) {
        this.scheduleRefresh(response.expires_in);
      }

      return session;
    } catch (error: any) {
      this.logger?.error('Token refresh failed', error.message);

      // Limpiar sesión si el refresh falla
      this.session = null;
      this.clearRefreshTimeout();

      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    if (!this.session && !this.apiKey) {
      this.logger?.warn('Logout called but no active session');
      return;
    }

    this.logger?.info('Logging out');

    try {
      const headers = this.getAuthHeaders();
      await this.httpClient.post(API_ENDPOINTS.LOGOUT, {}, { headers });
    } catch (error: any) {
      this.logger?.warn('Logout request failed', error.message);
      // Continuar limpiando la sesión local incluso si falla
    } finally {
      this.session = null;
      this.clearRefreshTimeout();
      this.logger?.info('Logged out successfully');
    }
  }

  /**
   * Obtiene headers de autenticación
   */
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Preferir API Key si está disponible
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    } else if (this.session?.accessToken) {
      headers['Authorization'] = `Bearer ${this.session.accessToken}`;
    }

    return headers;
  }

  /**
   * Obtiene la sesión actual
   */
  getSession(): UserSession | null {
    return this.session ? { ...this.session } : null;
  }

  /**
   * Verifica si hay una sesión activa y válida
   */
  isAuthenticated(): boolean {
    if (this.apiKey) {
      return true;
    }

    if (!this.session) {
      return false;
    }

    return this.isSessionValid();
  }

  /**
   * Verifica si la sesión actual es válida (no expirada)
   */
  isSessionValid(): boolean {
    if (!this.session) {
      return false;
    }

    const now = new Date();
    const expiresAt = this.session.expiresAt;

    return expiresAt > now;
  }

  /**
   * Obtiene tiempo restante hasta expiración (en segundos)
   */
  getTimeUntilExpiration(): number | null {
    if (!this.session) {
      return null;
    }

    const now = new Date();
    const expiresAt = this.session.expiresAt;
    const diff = expiresAt.getTime() - now.getTime();

    return Math.max(0, Math.floor(diff / 1000));
  }

  /**
   * Establece API Key manualmente
   */
  setApiKey(apiKey: string): void {
    validateApiKey(apiKey);
    this.apiKey = apiKey;
    this.logger?.info('API Key set');
  }

  /**
   * Limpia API Key
   */
  clearApiKey(): void {
    this.apiKey = undefined;
    this.logger?.info('API Key cleared');
  }

  /**
   * Limpia el timeout de refresh
   */
  clearRefreshTimeout(): void {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
      this.logger?.debug('Refresh timeout cleared');
    }
  }

  /**
   * Habilita o deshabilita auto-refresh
   */
  setAutoRefresh(enabled: boolean): void {
    this.autoRefresh = enabled;
    this.logger?.debug(`Auto-refresh ${enabled ? 'enabled' : 'disabled'}`);

    if (!enabled) {
      this.clearRefreshTimeout();
    } else if (this.session) {
      const expiresIn = this.getTimeUntilExpiration();
      if (expiresIn) {
        this.scheduleRefresh(expiresIn);
      }
    }
  }

  /**
   * Crea UserSession desde la respuesta de la API
   */
  private createSessionFromResponse(response: LoginResponse): UserSession {
    const expiresAt = new Date(Date.now() + response.expires_in * 1000);

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt,
      email: response.email,
      scopes: response.scopes || [],
    };
  }

  /**
   * Programa el refresh automático del token
   */
  private scheduleRefresh(expiresInSeconds: number): void {
    this.clearRefreshTimeout();

    // No programar refresh si expira muy pronto
    if (expiresInSeconds < MIN_TOKEN_LIFETIME_SECONDS) {
      this.logger?.warn(`Token expires too soon (${expiresInSeconds}s), skipping auto-refresh`);
      return;
    }

    // Refrescar antes de que expire
    const refreshTime = (expiresInSeconds - TOKEN_REFRESH_MARGIN_SECONDS) * 1000;

    this.logger?.debug(`Scheduling token refresh in ${Math.round(refreshTime / 1000)}s`);

    this.refreshTimeoutId = setTimeout(async () => {
      try {
        await this.refreshToken();
        this.logger?.info('Token auto-refreshed successfully');
      } catch (error: any) {
        this.logger?.error('Auto-refresh failed', error.message);
        this.session = null;
      }
    }, refreshTime);
  }
}
