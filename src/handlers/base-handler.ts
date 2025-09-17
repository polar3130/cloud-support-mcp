/**
 * Enhanced Base Handler Class for Google Cloud Support MCP Server
 *
 * Provides structured logging, retry functionality, and secure error processing
 */

import { getCurrentProjectId } from '../api/index.js';
import { BaseError, ErrorClassifier, ValidationError, ErrorCollector } from '../types/errors.js';
import { logger, generateCorrelationId } from '../utils/logger.js';
import { robustExecutor, LIGHT_RETRY_CONFIG } from '../utils/retry.js';

/**
 * MCP response format
 */
export interface MCPResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

/**
 * Base class that all handlers should inherit from
 */
export abstract class BaseHandler {
  private readonly errorCollector = ErrorCollector.getInstance();

  constructor() {
    // Generate correlation ID and set it to logger
    const correlationId = generateCorrelationId();
    logger.setCorrelationId(correlationId);
  }

  /**
   * Execute handler with error handling
   * @param operation Operation name (for error messages)
   * @param handler Handler function to execute
   * @returns Result in MCP response format
   */
  protected async executeWithErrorHandling<T>(
    operation: string,
    handler: () => Promise<T>
  ): Promise<MCPResponse> {
    const startTime = Date.now();

    try {
      logger.info(`Starting operation: ${operation}`, { operation });

      // Disable Circuit Breaker in test environments
      const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

      // Robust execution (retry, timeout, circuit breaker)
      const result = await robustExecutor.execute(handler, {
        operationName: operation,
        timeoutMs: 30000,
        retryConfig: LIGHT_RETRY_CONFIG,
        enableCircuitBreaker: !isTestEnvironment, // Disabled in test environments
      });

      const duration = Date.now() - startTime;
      logger.performance(operation, duration, { success: true });

      return this.formatSuccessResponse(result);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.performance(operation, duration, { success: false });

      // Classify error and convert to custom error
      const classifiedError = this.classifyError(error, operation);

      // Record to error statistics
      this.errorCollector.recordError(classifiedError);

      // Output error log
      logger.error(`Operation failed: ${operation}`, classifiedError, {
        operation,
        duration,
        errorCode: classifiedError.metadata.code,
        errorCategory: classifiedError.metadata.category,
      });

      return this.formatErrorResponse(operation, classifiedError);
    }
  }

  /**
   * Input value validation
   * @param data Data to be validated
   * @param rules Validation rules
   * @param operation Operation name
   */
  protected validateInput(
    data: Record<string, unknown>,
    rules: ValidationRule[],
    operation: string
  ): void {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = data[rule.field];

      // Required check
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Additional validation when value exists
      if (value !== undefined && value !== null) {
        // Type check
        if (rule.type && typeof value !== rule.type) {
          errors.push(`${rule.field} must be of type ${rule.type}`);
        }

        // String length check
        if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
          errors.push(`${rule.field} exceeds maximum length of ${rule.maxLength} characters`);
        }

        if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
          errors.push(
            `${rule.field} is shorter than minimum length of ${rule.minLength} characters`
          );
        }

        // Pattern check
        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
          errors.push(`${rule.field} format is invalid`);
        }

        // Custom validation
        if (rule.customValidator) {
          const customError = rule.customValidator(value);
          if (customError) {
            errors.push(`${rule.field}: ${customError}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(
        `Validation failed for ${operation}: ${errors.join(', ')}`,
        'VALIDATION_FAILED',
        { operation, errors, data: this.sanitizeForLogging(data) }
      );
    }

    logger.debug(`Input validation passed for ${operation}`, {
      operation,
      fieldCount: rules.length,
    });
  }

  /**
   * Get current project ID (with logging)
   * Maintained for backward compatibility
   */
  protected async getCurrentProjectIdWithLogging(): Promise<string> {
    return this.getProjectIdSafely();
  }

  /**
   * Safe retrieval of project ID
   */
  protected async getProjectIdSafely(): Promise<string> {
    try {
      const projectId = await getCurrentProjectId();
      logger.debug(`Using project ID: ${projectId} for X-Goog-User-Project header`);
      return projectId;
    } catch (error) {
      const classifiedError = new ValidationError(
        'Failed to retrieve project ID. Please check your gcloud configuration.',
        'PROJECT_ID_ERROR',
        {},
        error instanceof Error ? error : undefined
      );

      logger.error('Project ID retrieval failed', classifiedError);
      throw classifiedError;
    }
  }

  /**
   * Error classification
   */
  private classifyError(error: unknown, operation: string): BaseError {
    if (error instanceof BaseError) {
      return error;
    }

    // API-specific error handling
    if (error instanceof Error && error.name === 'ApiError') {
      const apiError = error as Error & { status?: number; response?: unknown };
      if (apiError.status) {
        // Extract statusText from error message
        const match = error.message.match(/HTTP \d+: ([^-]+)/);
        const statusText = match ? match[1].trim() : 'Unknown';
        return ErrorClassifier.fromHttpResponse(
          apiError.status,
          statusText,
          apiError.response ? JSON.stringify(apiError.response) : undefined,
          error
        );
      }
    }

    // fetch-related errors
    if (error && typeof error === 'object' && 'status' in error) {
      const httpError = error as {
        status: number;
        statusText: string;
        text?: () => Promise<string>;
      };
      return ErrorClassifier.fromHttpResponse(
        httpError.status,
        httpError.statusText,
        undefined,
        error instanceof Error ? error : undefined
      );
    }

    // General errors
    return ErrorClassifier.fromGenericError(error, operation);
  }

  /**
   * Format success response
   */
  protected formatSuccessResponse<T>(result: T): MCPResponse {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
      isError: false,
    };
  }

  /**
   * Format error response in MCP format
   * Use secure error messages to prevent PII leakage
   */
  protected formatErrorResponse(operation: string, error: unknown): MCPResponse {
    // Classify error and convert to BaseError
    const classifiedError = ErrorClassifier.fromGenericError(error, operation);

    // Return only safe messages in production environment
    const userMessage =
      process.env.NODE_ENV === 'production'
        ? classifiedError.getSafeMessage()
        : classifiedError.message;

    // Add original error for debugging
    const debugInfo = error instanceof Error ? error.message : String(error);

    return {
      content: [
        {
          type: 'text',
          text: `Error ${operation}: ${userMessage}\n\nDebug info: ${debugInfo}`,
        },
      ],
      isError: true,
    };
  }

  /**
   * Data sanitization for logging
   */
  private sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Remove PII fields
      if (this.isPIIField(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = '[OBJECT]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Determine PII fields
   */
  private isPIIField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return (
      lowerField.includes('email') ||
      lowerField.includes('token') ||
      lowerField.includes('key') ||
      lowerField.includes('secret') ||
      lowerField.includes('password')
    );
  }
}

/**
 * Validation rule definition
 */
export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object';
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  customValidator?: (value: unknown) => string | null;
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  // Google Cloud project name pattern
  PROJECT_NAME: /^projects\/[a-z0-9\-]+$/,

  // Case name pattern
  CASE_NAME: /^projects\/[a-z0-9\-]+\/cases\/[0-9]+$/,

  // Parent resource name pattern (for cases)
  CASE_PARENT: /^projects\/[a-z0-9\-]+\/cases\/[0-9]+$/,

  // Email address
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Priority
  PRIORITY: /^P[0-4]$/,

  // ISO 8601 date-time format
  ISO_DATETIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
} as const;
