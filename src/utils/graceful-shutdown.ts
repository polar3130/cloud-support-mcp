/**
 * Graceful Shutdown Manager
 *
 * Handle SIGTERM and SIGINT signals to safely stop the server
 */

import { logger } from './logger.js';

/**
 * Shutdown handler function type
 */
export type ShutdownHandler = () => Promise<void>;

/**
 * Shutdown reason
 */
export enum ShutdownReason {
  SIGTERM = 'SIGTERM',
  SIGINT = 'SIGINT',
  UNCAUGHT_EXCEPTION = 'UNCAUGHT_EXCEPTION',
  UNHANDLED_REJECTION = 'UNHANDLED_REJECTION',
  MANUAL = 'MANUAL',
}

/**
 * Graceful shutdown manager
 */
export class GracefulShutdownManager {
  private static instance: GracefulShutdownManager;
  private shutdownHandlers: Array<{ name: string; handler: ShutdownHandler; timeout: number }> = [];
  private isShuttingDown = false;
  private shutdownTimeout = 30000; // 30 seconds

  private constructor() {
    this.setupSignalHandlers();
    this.setupProcessErrorHandlers();
  }

  static getInstance(): GracefulShutdownManager {
    if (!GracefulShutdownManager.instance) {
      GracefulShutdownManager.instance = new GracefulShutdownManager();
    }
    return GracefulShutdownManager.instance;
  }

  /**
   * Register shutdown handler
   */
  registerHandler(name: string, handler: ShutdownHandler, timeout: number = 10000): void {
    this.shutdownHandlers.push({ name, handler, timeout });
    logger.debug(`Registered shutdown handler: ${name}`, { timeout });
  }

  /**
   * Set shutdown timeout
   */
  setShutdownTimeout(timeoutMs: number): void {
    this.shutdownTimeout = timeoutMs;
    logger.debug(`Set shutdown timeout: ${timeoutMs}ms`);
  }

  /**
   * Start graceful shutdown
   */
  async shutdown(reason: ShutdownReason = ShutdownReason.MANUAL): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;

    logger.info(`Starting graceful shutdown`, { reason });

    // Set global timeout
    const globalTimeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Shutdown timed out after ${this.shutdownTimeout}ms`));
      }, this.shutdownTimeout);
    });

    try {
      // Execute shutdown handlers in parallel
      const shutdownPromises = this.shutdownHandlers.map(({ name, handler, timeout }) =>
        this.executeHandlerWithTimeout(name, handler, timeout)
      );

      // Wait for all handlers or timeout
      await Promise.race([Promise.all(shutdownPromises), globalTimeoutPromise]);

      logger.info('Graceful shutdown completed successfully', {
        reason,
        handlerCount: this.shutdownHandlers.length,
      });
    } catch (error) {
      logger.error('Error during graceful shutdown', error, { reason });
    } finally {
      // Force exit
      process.exit(
        reason === ShutdownReason.UNCAUGHT_EXCEPTION ||
          reason === ShutdownReason.UNHANDLED_REJECTION
          ? 1
          : 0
      );
    }
  }

  /**
   * Execute handler with timeout
   */
  private async executeHandlerWithTimeout(
    name: string,
    handler: ShutdownHandler,
    timeout: number
  ): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Handler '${name}' timed out after ${timeout}ms`));
      }, timeout);
    });

    try {
      logger.debug(`Executing shutdown handler: ${name}`, { timeout });

      await Promise.race([handler(), timeoutPromise]);

      logger.debug(`Shutdown handler completed: ${name}`);
    } catch (error) {
      logger.error(`Shutdown handler failed: ${name}`, error);
      // Individual handler failures do not stop the entire shutdown
    }
  }

  /**
   * Setup signal handlers
   */
  private setupSignalHandlers(): void {
    // SIGTERM (normal termination signal)
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM signal');
      this.shutdown(ShutdownReason.SIGTERM);
    });

    // SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      logger.info('Received SIGINT signal');
      this.shutdown(ShutdownReason.SIGINT);
    });

    logger.debug('Signal handlers registered (SIGTERM, SIGINT)');
  }

  /**
   * Setup process error handlers
   */
  private setupProcessErrorHandlers(): void {
    // Uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.fatal('Uncaught Exception detected', error, {
        stack: error.stack,
        name: error.name,
      });

      // Critical error, so shutdown immediately
      this.shutdown(ShutdownReason.UNCAUGHT_EXCEPTION);
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      logger.fatal('Unhandled Promise Rejection detected', reason, {
        promise: promise.toString(),
        reason: reason instanceof Error ? reason.message : String(reason),
      });

      // Critical error, so shutdown immediately
      this.shutdown(ShutdownReason.UNHANDLED_REJECTION);
    });

    // Handle warnings
    process.on('warning', (warning: Error) => {
      logger.warn('Process warning', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
        warning: warning,
      });
    });

    logger.debug('Process error handlers registered');
  }

  /**
   * Get current shutdown status
   */
  isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }

  /**
   * Get number of registered handlers
   */
  getHandlerCount(): number {
    return this.shutdownHandlers.length;
  }
}

/**
 * Common shutdown handlers
 */
export class CommonShutdownHandlers {
  /**
   * Graceful shutdown for HTTP server
   */
  static createHttpServerHandler(server: {
    close: (callback?: (err?: Error) => void) => void;
  }): ShutdownHandler {
    return async () => {
      return new Promise<void>((resolve, reject) => {
        logger.info('Closing HTTP server');

        server.close((error: Error | undefined) => {
          if (error) {
            logger.error('Error closing HTTP server', error);
            reject(error);
          } else {
            logger.info('HTTP server closed');
            resolve();
          }
        });
      });
    };
  }

  /**
   * Close database connections
   */
  static createDatabaseHandler(db: { close?: () => Promise<void> | void }): ShutdownHandler {
    return async () => {
      logger.info('Closing database connections');

      try {
        if (db && typeof db.close === 'function') {
          await db.close();
          logger.info('Database connections closed');
        }
      } catch (error) {
        logger.error('Error closing database connections', error);
        throw error;
      }
    };
  }

  /**
   * Flush cache
   */
  static createCacheFlushHandler(cache: { flush?: () => Promise<void> | void }): ShutdownHandler {
    return async () => {
      logger.info('Flushing cache');

      try {
        if (cache && typeof cache.flush === 'function') {
          await cache.flush();
          logger.info('Cache flushed');
        }
      } catch (error) {
        logger.error('Error flushing cache', error);
        throw error;
      }
    };
  }

  /**
   * Wait for pending tasks to complete
   */
  static createTaskCompletionHandler(
    checkPendingTasks: () => number,
    maxWaitTime: number = 10000
  ): ShutdownHandler {
    return async () => {
      logger.info('Waiting for pending tasks to complete');

      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        const pendingTasks = checkPendingTasks();

        if (pendingTasks === 0) {
          logger.info('All pending tasks completed');
          return;
        }

        logger.debug(`Waiting for ${pendingTasks} pending tasks`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const remainingTasks = checkPendingTasks();
      if (remainingTasks > 0) {
        logger.warn(`Shutdown proceeding with ${remainingTasks} pending tasks`);
      }
    };
  }
}

/**
 * Default graceful shutdown manager instance
 */
export const gracefulShutdown = GracefulShutdownManager.getInstance();
