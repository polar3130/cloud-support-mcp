/**
 * Structured log type definitions
 */

/**
 * Types of values that can be used in log context
 *
 * Only permitted types are used to ensure security and type safety
 */
export type LogValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly LogValue[]
  | { readonly [key: string]: LogValue };

/**
 * Log context type
 *
 */
export interface LogContext {
  readonly [key: string]: LogValue;
}

/**
 * Error metadata type
 *
 * Defines the structure of secure error information
 */
export interface ErrorMetadata {
  readonly category?: string;
  readonly code?: string;
  readonly retryable?: boolean;
  readonly severity?: string;
  readonly context?: LogContext;
}

/**
 * Performance information type
 */
export interface PerformanceMetadata {
  readonly duration?: number;
  readonly operation?: string;
  readonly startTime?: number;
  readonly endTime?: number;
  readonly memory?: {
    readonly used?: number;
    readonly peak?: number;
  };
}

/**
 * Secure error log information
 *
 * Safe error representation excluding personal information and sensitive data
 */
export interface SecureErrorInfo {
  readonly name: string;
  readonly message: string;
  readonly safeMessage?: string;
  readonly stack?: string;
  readonly metadata?: ErrorMetadata;
}

/**
 * Strict type definition for structured log entries
 *
 */
export interface TypedLogEntry {
  readonly timestamp: string;
  readonly level: string;
  readonly message: string;
  readonly category?: string;
  readonly correlationId?: string;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly context?: LogContext;
  readonly error?: SecureErrorInfo;
  readonly performance?: PerformanceMetadata;
}

/**
 * Type guard functions for log values
 */
export const LogTypeGuards = {
  /**
   * Check if value is loggable
   */
  isLogValue(value: unknown): value is LogValue {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return true;
    }

    if (Array.isArray(value)) {
      return value.every((item) => this.isLogValue(item));
    }

    if (typeof value === 'object' && value !== null) {
      return Object.values(value).every((val) => this.isLogValue(val));
    }

    return false;
  },

  /**
   * Check if valid log context
   */
  isValidLogContext(value: unknown): value is LogContext {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    return Object.values(value).every((val) => this.isLogValue(val));
  },
} as const;

/**
 * Log context creation helper
 */
export const LogContextBuilder = {
  /**
   * Create safe log context
   */
  create(input: unknown): LogContext {
    if (LogTypeGuards.isValidLogContext(input)) {
      return input;
    }

    // Fallback: safe default value
    return {
      invalidContext: 'Invalid log context provided',
      originalType: typeof input,
    };
  },

  /**
   * Merge multiple contexts
   */
  merge(...contexts: readonly (LogContext | undefined)[]): LogContext {
    const result: Record<string, LogValue> = {};

    for (const context of contexts) {
      if (context) {
        Object.assign(result, context);
      }
    }

    return result;
  },
} as const;
