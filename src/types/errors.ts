/**
 * Error Types and Custom Error Classes
 */

/**
 * Error category definitions
 * Secure error classification following instructions.md
 */
export enum ErrorCategory {
  // Security related
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',

  // External system integration
  NETWORK = 'NETWORK',
  API_CLIENT = 'API_CLIENT',
  TIMEOUT = 'TIMEOUT',

  // Internal system
  CONFIGURATION = 'CONFIGURATION',
  RESOURCE = 'RESOURCE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error severity levels
 * Used for log levels and alert control
 */
export enum ErrorSeverity {
  LOW = 'LOW', // General validation errors
  MEDIUM = 'MEDIUM', // API call failures, temporary issues
  HIGH = 'HIGH', // Authentication/authorization errors, configuration issues
  CRITICAL = 'CRITICAL', // System outage, data corruption risk
}

/**
 * Error metadata
 * Information for structured logging and monitoring
 *
 */
export interface ErrorMetadata {
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly code: string;
  readonly retryable: boolean;
  readonly timestamp: string;
  readonly correlationId?: string;
  readonly context?: import('./log-types.js').LogContext;
}

/**
 * Base custom error class
 * Base class for all application errors
 */
export abstract class BaseError extends Error {
  public readonly metadata: ErrorMetadata;
  public readonly cause?: Error;

  constructor(message: string, metadata: Omit<ErrorMetadata, 'timestamp'>, cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.metadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
    };
    this.cause = cause;

    // Set up stack trace properly
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Generate safe error message for users
   * Removes PII (Personally Identifiable Information) and hides technical details
   */
  public getSafeMessage(): string {
    switch (this.metadata.category) {
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication is required. Please check your credentials.';
      case ErrorCategory.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorCategory.VALIDATION:
        return 'The provided data is invalid. Please check your input.';
      case ErrorCategory.NETWORK:
      case ErrorCategory.TIMEOUT:
        return 'A temporary network issue occurred. Please try again later.';
      case ErrorCategory.API_CLIENT:
        return 'External service is temporarily unavailable. Please try again later.';
      case ErrorCategory.CONFIGURATION:
        return 'System configuration error. Please contact support.';
      case ErrorCategory.RESOURCE:
        return 'Required resource is not available. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }

  /**
   * Serialization for structured logging
   *
   */
  public toLogObject(): import('./log-types.js').LogContext {
    return {
      error: {
        name: this.name,
        message: this.message,
        safeMessage: this.getSafeMessage(),
        metadata: {
          category: this.metadata.category,
          severity: this.metadata.severity,
          code: this.metadata.code,
          retryable: this.metadata.retryable,
          context: this.metadata.context ? JSON.stringify(this.metadata.context) : undefined,
        },
        stack: this.stack,
        cause: this.cause
          ? {
              name: this.cause.name,
              message: this.cause.message,
              stack: this.cause.stack,
            }
          : undefined,
      },
    };
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends BaseError {
  constructor(message: string, code: string = 'AUTH_001', cause?: Error) {
    super(
      message,
      {
        category: ErrorCategory.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        code,
        retryable: false,
      },
      cause
    );
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends BaseError {
  constructor(message: string, code: string = 'AUTHZ_001', cause?: Error) {
    super(
      message,
      {
        category: ErrorCategory.AUTHORIZATION,
        severity: ErrorSeverity.HIGH,
        code,
        retryable: false,
      },
      cause
    );
  }
}

/**
 * Validation error
 */
export class ValidationError extends BaseError {
  constructor(
    message: string,
    code: string = 'VAL_001',
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    const safeContext = context
      ? (Object.fromEntries(
          Object.entries(context).map(([key, value]) => [
            key,
            typeof value === 'object' ? JSON.stringify(value) : String(value),
          ])
        ) as import('./log-types.js').LogContext)
      : undefined;

    super(
      message,
      {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW,
        code,
        retryable: false,
        context: safeContext,
      },
      cause
    );
  }
}

/**
 * Network error
 */
export class NetworkError extends BaseError {
  constructor(message: string, code: string = 'NET_001', cause?: Error) {
    super(
      message,
      {
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        code,
        retryable: true,
      },
      cause
    );
  }
}

/**
 * API client error
 */
export class ApiClientError extends BaseError {
  public readonly statusCode?: number;
  public readonly responseBody?: string;

  constructor(
    message: string,
    statusCode?: number,
    responseBody?: string,
    code: string = 'API_001',
    cause?: Error
  ) {
    super(
      message,
      {
        category: ErrorCategory.API_CLIENT,
        severity: statusCode && statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
        code,
        retryable: statusCode ? statusCode >= 500 || statusCode === 429 : true,
        context: { statusCode, responseBody },
      },
      cause
    );

    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends BaseError {
  constructor(message: string, timeout: number, code: string = 'TIMEOUT_001', cause?: Error) {
    super(
      message,
      {
        category: ErrorCategory.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        code,
        retryable: true,
        context: { timeout },
      },
      cause
    );
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends BaseError {
  constructor(message: string, code: string = 'CONFIG_001', cause?: Error) {
    super(
      message,
      {
        category: ErrorCategory.CONFIGURATION,
        severity: ErrorSeverity.CRITICAL,
        code,
        retryable: false,
      },
      cause
    );
  }
}

/**
 * Resource error
 */
export class ResourceError extends BaseError {
  constructor(message: string, code: string = 'RESOURCE_001', cause?: Error) {
    super(
      message,
      {
        category: ErrorCategory.RESOURCE,
        severity: ErrorSeverity.HIGH,
        code,
        retryable: true,
      },
      cause
    );
  }
}

/**
 * Generic error class
 * For errors that cannot be classified
 */
export class GenericError extends BaseError {
  constructor(
    message: string,
    code: string = 'UNKNOWN_001',
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    const safeContext = context
      ? (Object.fromEntries(
          Object.entries(context).map(([key, value]) => [
            key,
            typeof value === 'object' ? JSON.stringify(value) : String(value),
          ])
        ) as import('./log-types.js').LogContext)
      : undefined;

    super(
      message,
      {
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        code,
        retryable: false,
        context: safeContext,
      },
      cause
    );
  }
}

/**
 * Error classifier
 * Converts external errors to custom errors
 */
export class ErrorClassifier {
  /**
   * Generate custom error from HTTP error response
   */
  static fromHttpResponse(
    statusCode: number,
    statusText: string,
    responseBody?: string,
    originalError?: Error
  ): BaseError {
    const message = `HTTP ${statusCode}: ${statusText}`;

    switch (statusCode) {
      case 401:
        return new AuthenticationError(message, 'HTTP_401', originalError);
      case 403:
        return new AuthorizationError(message, 'HTTP_403', originalError);
      case 400:
      case 422:
        return new ValidationError(
          message,
          `HTTP_${statusCode}`,
          { statusCode, responseBody },
          originalError
        );
      case 429:
        return new ApiClientError(message, statusCode, responseBody, 'HTTP_429', originalError);
      case 408:
      case 504:
        return new TimeoutError(message, 30000, `HTTP_${statusCode}`, originalError);
      case 404:
        return new ResourceError(message, 'HTTP_404', originalError);
      default:
        if (statusCode >= 500) {
          return new ApiClientError(
            message,
            statusCode,
            responseBody,
            `HTTP_${statusCode}`,
            originalError
          );
        } else {
          return new ApiClientError(
            message,
            statusCode,
            responseBody,
            `HTTP_${statusCode}`,
            originalError
          );
        }
    }
  }

  /**
   * Generate custom error from generic JavaScript error
   */
  static fromGenericError(error: unknown, context?: string): BaseError {
    if (error instanceof BaseError) {
      return error;
    }

    let message = 'Unknown error occurred';
    let code = 'UNKNOWN_001';
    let cause: Error | undefined;

    if (error instanceof Error) {
      message = error.message;
      cause = error;

      // Classification by error type
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return new NetworkError(`Network error: ${message}`, 'FETCH_ERROR', cause);
      }
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return new TimeoutError(`Operation timed out: ${message}`, 30000, 'TIMEOUT_ERROR', cause);
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    const contextMessage = context ? `${context}: ${message}` : message;

    return new GenericError(contextMessage, code, { originalError: error, context }, cause);
  }
}

/**
 * Error aggregation and metrics
 */
export interface ErrorMetrics {
  category: ErrorCategory;
  code: string;
  count: number;
  firstOccurrence: string;
  lastOccurrence: string;
}

/**
 * Error collector
 * Error statistics and monitoring
 */
export class ErrorCollector {
  private static instance: ErrorCollector;
  private metrics: Map<string, ErrorMetrics> = new Map();

  private constructor() {}

  static getInstance(): ErrorCollector {
    if (!ErrorCollector.instance) {
      ErrorCollector.instance = new ErrorCollector();
    }
    return ErrorCollector.instance;
  }

  /**
   * Record error occurrence
   */
  recordError(error: BaseError): void {
    const key = `${error.metadata.category}:${error.metadata.code}`;
    const existing = this.metrics.get(key);
    const timestamp = error.metadata.timestamp;

    if (existing) {
      existing.count++;
      existing.lastOccurrence = timestamp;
    } else {
      this.metrics.set(key, {
        category: error.metadata.category,
        code: error.metadata.code,
        count: 1,
        firstOccurrence: timestamp,
        lastOccurrence: timestamp,
      });
    }
  }

  /**
   * Get error statistics
   */
  getMetrics(): ErrorMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.metrics.clear();
  }
}
