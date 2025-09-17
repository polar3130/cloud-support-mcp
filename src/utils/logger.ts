/**
 * Structured Logger Implementation
 */

import { BaseError, ErrorSeverity } from '../types/errors.js';
import type {
  LogContext,
  TypedLogEntry,
  SecureErrorInfo,
  PerformanceMetadata,
} from '../types/log-types.js';
import { LogContextBuilder } from '../types/log-types.js';

/**
 * Log level definitions
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

/**
 * Log entry type for legacy compatibility
 *
 */
interface MutableLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  category?: string;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  context?: LogContext;
  error?: SecureErrorInfo;
  performance?: PerformanceMetadata;
}

/**
 * Read-only log entry type for external exposure
 */
export interface LogEntry extends TypedLogEntry {
  level: LogLevel; // More strict type constraint
}

/**
 * Structured logger
 */
export class StructuredLogger {
  private static instance: StructuredLogger;
  private correlationId: string = '';
  private userId?: string;
  private sessionId?: string;

  private constructor() {}

  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  /**
   * Set correlation ID
   */
  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Set session ID
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Debug log
   *
   */
  debug(message: string, context?: unknown): void {
    const safeContext = LogContextBuilder.create(context);
    this.log(LogLevel.DEBUG, message, safeContext);
  }

  /**
   * Info log
   *
   */
  info(message: string, context?: unknown): void {
    const safeContext = LogContextBuilder.create(context);
    this.log(LogLevel.INFO, message, safeContext);
  }

  /**
   * Warning log
   *
   */
  warn(message: string, context?: unknown): void {
    const safeContext = LogContextBuilder.create(context);
    this.log(LogLevel.WARN, message, safeContext);
  }

  /**
   * Error log
   *
   */
  error(message: string, error?: unknown, context?: unknown): void {
    const safeContext = LogContextBuilder.create(context);
    const entry = this.createLogEntry(LogLevel.ERROR, message, safeContext);

    if (error) {
      if (error instanceof BaseError) {
        (entry as MutableLogEntry).error = {
          name: error.name,
          message: error.message,
          safeMessage: error.getSafeMessage(),
          stack: error.stack,
          metadata: {
            category: error.metadata.category,
            code: error.metadata.code,
            severity: error.metadata.severity,
            retryable: error.metadata.retryable,
            context: LogContextBuilder.create(error.metadata.context),
          },
        };
      } else if (error instanceof Error) {
        (entry as MutableLogEntry).error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else {
        (entry as MutableLogEntry).error = {
          name: 'UnknownError',
          message: String(error),
        };
      }
    }

    this.output(entry);
  }

  /**
   * Fatal error log
   *
   */
  fatal(message: string, error?: unknown, context?: unknown): void {
    const safeContext = LogContextBuilder.create(context);
    const entry = this.createLogEntry(LogLevel.FATAL, message, safeContext);

    if (error) {
      if (error instanceof BaseError) {
        (entry as MutableLogEntry).error = {
          name: error.name,
          message: error.message,
          safeMessage: error.getSafeMessage(),
          stack: error.stack,
          metadata: {
            category: error.metadata.category,
            code: error.metadata.code,
            severity: error.metadata.severity,
            retryable: error.metadata.retryable,
            context: LogContextBuilder.create(error.metadata.context),
          },
        };
      } else if (error instanceof Error) {
        (entry as MutableLogEntry).error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else {
        (entry as MutableLogEntry).error = {
          name: 'UnknownError',
          message: String(error),
        };
      }
    }

    this.output(entry);
  }

  /**
   * Performance log
   *
   */
  performance(operation: string, duration: number, context?: unknown): void {
    const safeContext = LogContextBuilder.create(context);
    const entry = this.createLogEntry(LogLevel.INFO, `Performance: ${operation}`, safeContext);
    (entry as MutableLogEntry).performance = {
      operation,
      duration,
    };
    this.output(entry);
  }

  /**
   * Basic log output
   *
   */
  private log(level: LogLevel, message: string, context: LogContext): void {
    const entry = this.createLogEntry(level, message, context);
    this.output(entry);
  }

  /**
   * Create log entry
   *
   */
  private createLogEntry(level: LogLevel, message: string, context: LogContext): MutableLogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId || undefined,
      userId: this.userId,
      sessionId: this.sessionId,
      context,
    };
  }

  /**
   * Output log
   *
   */
  private output(entry: MutableLogEntry): void {
    // Output destination control based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production environment: structured JSON output to stderr
      console.error(JSON.stringify(entry));
    } else {
      // Development environment: readable format to stderr
      const timestamp = entry.timestamp;
      const level = entry.level.padEnd(5);
      const message = entry.message;
      const correlationId = entry.correlationId ? ` [${entry.correlationId}]` : '';

      console.error(`${timestamp} ${level}${correlationId}: ${message}`);

      if (entry.context) {
        console.error('  Context:', JSON.stringify(entry.context, null, 2));
      }

      if (entry.error) {
        console.error('  Error:', JSON.stringify(entry.error, null, 2));
      }

      if (entry.performance) {
        console.error('  Performance:', JSON.stringify(entry.performance, null, 2));
      }
    }
  }
}

/**
 * Error level mapping
 */
export function mapErrorSeverityToLogLevel(severity: ErrorSeverity): LogLevel {
  switch (severity) {
    case ErrorSeverity.LOW:
      return LogLevel.WARN;
    case ErrorSeverity.MEDIUM:
      return LogLevel.ERROR;
    case ErrorSeverity.HIGH:
      return LogLevel.ERROR;
    case ErrorSeverity.CRITICAL:
      return LogLevel.FATAL;
    default:
      return LogLevel.ERROR;
  }
}

/**
 * Log utility functions
 */
export const logger = StructuredLogger.getInstance();

/**
 * Correlation ID generator
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Performance measurement decorator
 */
export function measurePerformance(operation: string) {
  return function (target: object, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const startTime = Date.now();
      const correlationId = generateCorrelationId();

      logger.setCorrelationId(correlationId);
      logger.info(`Starting operation: ${operation}`, { operation, args: args.length });

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;

        logger.performance(operation, duration, { success: true });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.performance(operation, duration, { success: false });
        logger.error(`Operation failed: ${operation}`, error);

        throw error;
      }
    };

    return descriptor;
  };
}
