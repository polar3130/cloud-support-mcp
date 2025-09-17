/**
 * Retry Mechanism Implementation
 *
 * Timeout, retry, and circuit breaker functionality
 */

import { BaseError, TimeoutError } from '../types/errors.js';
import { logger } from './logger.js';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  retryableErrors: (error: unknown) => boolean;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitStats {
  state: CircuitState;
  requests: number;
  failures: number;
  successRate: number;
  lastFailureTime: number;
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.metadata.retryable;
  }

  // Network-related errors are generally retryable
  if (
    error instanceof Error &&
    (error.name === 'NetworkError' ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('timeout'))
  ) {
    return true;
  }

  return false;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  jitter: true,
  retryableErrors: isRetryableError,
};

/**
 * Lightweight retry configuration (for fast operations)
 */
export const LIGHT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 2,
  initialDelay: 500, // 0.5 seconds
  maxDelay: 2000, // 2 seconds
  backoffFactor: 1.5,
  jitter: true,
  retryableErrors: isRetryableError,
};

/**
 * Aggressive retry configuration (for critical operations)
 */
export const AGGRESSIVE_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2.5,
  jitter: true,
  retryableErrors: isRetryableError,
};

/**
 * Retry mechanism
 */
export class RetryMechanism {
  /**
   * Execute retry with specified configuration
   */
  static async execute<T>(
    operation: () => Promise<T>,
    operationName: string,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        logger.debug(`Executing operation: ${operationName}`, {
          attempt,
          maxAttempts: config.maxAttempts,
          operationName,
        });

        const result = await operation();

        if (attempt > 1) {
          logger.info(`Operation succeeded after retry: ${operationName}`, {
            attempt,
            operationName,
          });
        }

        return result;
      } catch (error) {
        lastError = error;

        logger.warn(`Operation failed: ${operationName}`, {
          attempt,
          maxAttempts: config.maxAttempts,
          operationName,
          error: error instanceof Error ? error.message : String(error),
          retryable: config.retryableErrors(error),
        });

        // End if this is the last attempt or non-retryable error
        if (attempt === config.maxAttempts || !config.retryableErrors(error)) {
          break;
        }

        // Calculate wait time
        const delay = this.calculateDelay(attempt, config);
        logger.debug(`Waiting before retry: ${operationName}`, {
          delay,
          attempt,
          operationName,
        });

        await this.sleep(delay);
      }
    }

    logger.error(`Operation failed after all retries: ${operationName}`, lastError, {
      attempts: config.maxAttempts,
      operationName,
    });

    throw lastError;
  }

  /**
   * Calculate delay time (exponential backoff + jitter)
   */
  private static calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = Math.min(
      config.initialDelay * Math.pow(config.backoffFactor, attempt - 1),
      config.maxDelay
    );

    if (!config.jitter) {
      return exponentialDelay;
    }

    // Add jitter (±25% randomness)
    const jitterFactor = 0.75 + Math.random() * 0.5; // 0.75 to 1.25
    return Math.floor(exponentialDelay * jitterFactor);
  }

  /**
   * Wait for specified time
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Timeout manager
 */
export class TimeoutManager {
  /**
   * Execute operation with timeout
   */
  static async execute<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`Operation timed out: ${operationName}`, timeoutMs, 'TIMEOUT_001'));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([operation(), timeoutPromise]);
      return result;
    } catch (error) {
      if (error instanceof TimeoutError) {
        logger.warn(`Operation timed out: ${operationName}`, {
          timeoutMs,
          operationName,
        });
      }
      throw error;
    }
  }
}

/**
 * Circuit breaker state
 */
export enum CircuitState {
  CLOSED = 'CLOSED', // Normal state (allows requests)
  OPEN = 'OPEN', // Failure state (rejects requests)
  HALF_OPEN = 'HALF_OPEN', // Recovery verification (allows limited requests)
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures to consider as fault
  recoveryTimeout: number; // Time to wait before attempting recovery (ms)
  monitoringPeriod: number; // Monitoring period (ms)
  minimumRequests: number; // Minimum number of requests
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeout: 60000, // 1 minute
  monitoringPeriod: 10000, // 10 seconds
  minimumRequests: 10,
};

/**
 * Circuit breaker
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private stats = {
    requests: 0,
    failures: 0,
    lastFailureTime: 0,
    windowStart: Date.now(),
  };

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig = DEFAULT_CIRCUIT_CONFIG
  ) {}

  /**
   * Execute operation with circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.updateState();

    if (this.state === CircuitState.OPEN) {
      throw new Error(`Circuit breaker is OPEN for: ${this.name}`);
    }

    try {
      this.stats.requests++;
      const result = await operation();

      // Handle success
      this.onSuccess();
      return result;
    } catch (error) {
      // Handle failure
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle success
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      logger.info(`Circuit breaker recovering: ${this.name}`);
      this.state = CircuitState.CLOSED;
      this.resetStats();
    }
  }

  /**
   * Handle failure
   */
  private onFailure(): void {
    this.stats.failures++;
    this.stats.lastFailureTime = Date.now();

    const failureRate = this.stats.failures / this.stats.requests;

    if (
      this.stats.failures >= this.config.failureThreshold &&
      this.stats.requests >= this.config.minimumRequests
    ) {
      logger.warn(`Circuit breaker opening: ${this.name}`, {
        failures: this.stats.failures,
        requests: this.stats.requests,
        failureRate,
      });

      this.state = CircuitState.OPEN;
    }
  }

  /**
   * Update state
   */
  private updateState(): void {
    const now = Date.now();

    // Reset statistics if monitoring period has elapsed
    if (now - this.stats.windowStart > this.config.monitoringPeriod) {
      this.resetStats();
    }

    // Attempt recovery from OPEN state
    if (
      this.state === CircuitState.OPEN &&
      now - this.stats.lastFailureTime > this.config.recoveryTimeout
    ) {
      logger.info(`Circuit breaker entering HALF_OPEN: ${this.name}`);
      this.state = CircuitState.HALF_OPEN;
    }
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      requests: 0,
      failures: 0,
      lastFailureTime: 0,
      windowStart: Date.now(),
    };
  }

  /**
   * Get current statistics
   */
  getStats(): CircuitStats {
    return {
      state: this.state,
      requests: this.stats.requests,
      failures: this.stats.failures,
      successRate:
        this.stats.requests > 0
          ? (this.stats.requests - this.stats.failures) / this.stats.requests
          : 0,
      lastFailureTime: this.stats.lastFailureTime,
    };
  }
}

/**
 * Robust operation executor
 *
 * Execution environment that integrates retry, timeout, and circuit breaker
 */
export class RobustExecutor {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  /**
   * Robust execution
   */
  async execute<T>(
    operation: () => Promise<T>,
    config: {
      operationName: string;
      timeoutMs?: number;
      retryConfig?: RetryConfig;
      circuitConfig?: CircuitBreakerConfig;
      enableCircuitBreaker?: boolean;
    }
  ): Promise<T> {
    const {
      operationName,
      timeoutMs = 30000,
      retryConfig = DEFAULT_RETRY_CONFIG,
      circuitConfig = DEFAULT_CIRCUIT_CONFIG,
      enableCircuitBreaker = true,
    } = config;

    // Wrap timeout handling
    const timeoutOperation = () => TimeoutManager.execute(operation, timeoutMs, operationName);

    // Circuit breaker handling
    const finalOperation = enableCircuitBreaker
      ? () => {
          const circuitBreaker = this.getCircuitBreaker(operationName, circuitConfig);
          return circuitBreaker.execute(timeoutOperation);
        }
      : timeoutOperation;

    // Retry handling
    return RetryMechanism.execute(finalOperation, operationName, retryConfig);
  }

  /**
   * Get or create circuit breaker
   */
  private getCircuitBreaker(name: string, config: CircuitBreakerConfig): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(name, config));
    }
    return this.circuitBreakers.get(name)!;
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStats(): Record<string, CircuitStats> {
    const stats: Record<string, CircuitStats> = {};
    for (const [name, breaker] of this.circuitBreakers) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }
}

/**
 * Default robust executor instance
 */
export const robustExecutor = new RobustExecutor();
