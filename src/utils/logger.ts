/**
 * Sistema de logging configurable
 * Soporta múltiples niveles y puede ser extendido
 */

import type { LogLevel } from '../config/defaults';
import { LOG_LEVELS } from '../config/defaults';

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  setLevel?(level: LogLevel): void;
}

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  timestamp?: boolean;
  colors?: boolean;
}

export class ConsoleLogger implements Logger {
  private level: number;
  private prefix: string;
  private timestamp: boolean;
  private colors: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = LOG_LEVELS[options.level || 'INFO'];
    this.prefix = options.prefix || '[MailSafePro]';
    this.timestamp = options.timestamp ?? true;
    this.colors = options.colors ?? true;
  }

  setLevel(level: LogLevel): void {
    this.level = LOG_LEVELS[level];
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LOG_LEVELS.DEBUG) {
      this.log('DEBUG', message, args, '\x1b[36m'); // Cyan
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LOG_LEVELS.INFO) {
      this.log('INFO', message, args, '\x1b[32m'); // Green
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LOG_LEVELS.WARN) {
      this.log('WARN', message, args, '\x1b[33m'); // Yellow
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LOG_LEVELS.ERROR) {
      this.log('ERROR', message, args, '\x1b[31m'); // Red
    }
  }

  private log(level: string, message: string, args: any[], color: string): void {
    const reset = '\x1b[0m';
    const timestamp = this.timestamp ? `[${new Date().toISOString()}]` : '';
    const colorCode = this.colors ? color : '';
    const resetCode = this.colors ? reset : '';

    const prefix = `${colorCode}${timestamp} ${this.prefix} [${level}]${resetCode}`;

    if (args.length > 0) {
      // Formatear objetos para mejor legibilidad
      const formattedArgs = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return arg;
          }
        }
        return arg;
      });

      console.log(prefix, message, ...formattedArgs);
    } else {
      console.log(prefix, message);
    }
  }
}

/**
 * Logger silencioso (no imprime nada)
 */
export class SilentLogger implements Logger {
  debug(_message: string, ..._args: any[]): void {
    // Intencionalmente vacío
  }

  info(_message: string, ..._args: any[]): void {
    // Intencionalmente vacío
  }

  warn(_message: string, ..._args: any[]): void {
    // Intencionalmente vacío
  }

  error(_message: string, ..._args: any[]): void {
    // Intencionalmente vacío
  }

  setLevel(_level: LogLevel): void {
    // Intencionalmente vacío
  }
}

/**
 * Logger que guarda logs en array (útil para testing)
 */
export class MemoryLogger implements Logger {
  private logs: Array<{ level: string; message: string; args: any[]; timestamp: Date }> = [];
  private maxLogs: number;

  constructor(maxLogs: number = 1000) {
    this.maxLogs = maxLogs;
  }

  debug(message: string, ...args: any[]): void {
    this.addLog('DEBUG', message, args);
  }

  info(message: string, ...args: any[]): void {
    this.addLog('INFO', message, args);
  }

  warn(message: string, ...args: any[]): void {
    this.addLog('WARN', message, args);
  }

  error(message: string, ...args: any[]): void {
    this.addLog('ERROR', message, args);
  }

  private addLog(level: string, message: string, args: any[]): void {
    this.logs.push({
      level,
      message,
      args,
      timestamp: new Date(),
    });

    // Mantener solo los últimos N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getLogs(): typeof this.logs {
    return [...this.logs];
  }

  getLogsByLevel(level: string): typeof this.logs {
    return this.logs.filter(log => log.level === level);
  }

  clear(): void {
    this.logs = [];
  }

  toString(): string {
    return this.logs
      .map(log => {
        const timestamp = log.timestamp.toISOString();
        const args = log.args.length > 0 ? ` ${JSON.stringify(log.args)}` : '';
        return `[${timestamp}] [${log.level}] ${log.message}${args}`;
      })
      .join('\n');
  }
}

/**
 * Factory para crear logger basado en entorno
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  // En tests, usar logger silencioso por defecto
  if (isTest && !options.level) {
    return new SilentLogger();
  }

  // En producción, nivel WARN por defecto
  if (isProduction && !options.level) {
    return new ConsoleLogger({ ...options, level: 'WARN' });
  }

  // En desarrollo, nivel DEBUG por defecto
  return new ConsoleLogger({ ...options, level: options.level || 'DEBUG' });
}
