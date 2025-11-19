/**
 * Rate Limiter del lado del cliente
 * Previene errores 429 limitando requests por segundo y concurrencia
 */

import type { Logger } from './logger';

export interface RateLimiterConfig {
  maxRequestsPerSecond: number;
  maxConcurrent?: number;
  logger?: Logger;
}

interface QueuedTask<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

export class RateLimiter {
  private queue: Array<QueuedTask<any>> = [];
  private pending: number = 0;
  private lastRequestTime: number = 0;
  private readonly minInterval: number;
  private readonly maxConcurrent: number;
  private readonly logger?: Logger;
  private processingQueue: boolean = false;

  constructor(config: RateLimiterConfig) {
    this.minInterval = 1000 / config.maxRequestsPerSecond;
    this.maxConcurrent = config.maxConcurrent || 10;
    this.logger = config.logger;

    this.logger?.debug(
      `RateLimiter initialized: ${config.maxRequestsPerSecond} req/s, ` +
        `${this.maxConcurrent} concurrent`,
    );
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: fn,
        resolve,
        reject,
      });

      this.logger?.debug(`Task queued. Queue size: ${this.queue.length}`);
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    // Evitar procesamiento concurrente de la cola
    if (this.processingQueue) {
      return;
    }

    this.processingQueue = true;

    try {
      while (this.queue.length > 0 && this.pending < this.maxConcurrent) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        // Esperar si no ha pasado suficiente tiempo
        if (timeSinceLastRequest < this.minInterval) {
          const waitTime = this.minInterval - timeSinceLastRequest;
          this.logger?.debug(`Rate limit: waiting ${waitTime}ms`);

          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        const task = this.queue.shift();
        if (!task) break;

        this.pending++;
        this.lastRequestTime = Date.now();

        this.logger?.debug(
          `Executing task. Pending: ${this.pending}/${this.maxConcurrent}, ` +
            `Queue: ${this.queue.length}`,
        );

        // Ejecutar la tarea sin esperar
        task
          .execute()
          .then(task.resolve)
          .catch(task.reject)
          .finally(() => {
            this.pending--;
            this.logger?.debug(`Task completed. Pending: ${this.pending}`);

            // Continuar procesando la cola
            if (this.queue.length > 0) {
              this.processQueue();
            }
          });
      }
    } finally {
      this.processingQueue = false;
    }
  }

  clear(): void {
    this.logger?.warn(`Clearing rate limiter queue: ${this.queue.length} tasks dropped`);

    // Rechazar todas las tareas pendientes
    const error = new Error('Rate limiter queue cleared');
    this.queue.forEach(task => task.reject(error));
    this.queue = [];
  }

  get queueSize(): number {
    return this.queue.length;
  }

  get pendingCount(): number {
    return this.pending;
  }

  getStats(): {
    queueSize: number;
    pendingCount: number;
    maxConcurrent: number;
    minInterval: number;
  } {
    return {
      queueSize: this.queue.length,
      pendingCount: this.pending,
      maxConcurrent: this.maxConcurrent,
      minInterval: this.minInterval,
    };
  }
}
