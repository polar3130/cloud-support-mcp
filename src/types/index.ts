/**
 * Type definition module exports
 */

// Common type definitions
export type { Actor, CaseClassification, CaseState, CasePriority } from './common-types.js';

// API data type definitions
export type { SupportCaseData, CommentData, AttachmentData } from './api-types.js';

export type {
  ApiRequestBody,
  CreateSupportCaseRequestBody,
  UpdateSupportCaseRequestBody,
  CreateCaseCommentRequestBody,
  SearchSupportCasesRequestBody,
  SearchCaseClassificationsRequestBody,
  EmptyRequestBody,
  JsonSerializable,
} from './api-request-types.js';

export type {
  ApiResponseData,
  BaseApiResponse,
  ListSupportCasesResponse,
  GetSupportCaseResponse,
  CreateSupportCaseResponse,
  UpdateSupportCaseResponse,
  CloseSupportCaseResponse,
  ListCaseCommentsResponse,
  CreateCaseCommentResponse,
  ListCaseAttachmentsResponse,
  SearchSupportCasesResponse,
  SearchCaseClassificationsResponse,
  ErrorResponse,
} from './api-response-types.js';

export type {
  LogValue,
  LogContext,
  ErrorMetadata as LogErrorMetadata,
  PerformanceMetadata,
  SecureErrorInfo,
  TypedLogEntry,
} from './log-types.js';

// MCP tool argument type definitions
export type {
  ListSupportCasesArgs,
  GetSupportCaseArgs,
  GetCaseCommentsArgs,
  CreateSupportCaseArgs,
  UpdateSupportCaseArgs,
  CloseSupportCaseArgs,
  CreateCaseCommentArgs,
  ListCaseAttachmentsArgs,
  SearchSupportCasesArgs,
  SearchCaseClassificationsArgs,
} from './mcp-types.js';

// Type-safe tool execution system
export type {
  ToolArgumentsMap,
  SupportedToolName,
  ToolArgsFor,
  ToolExecutionResult,
} from './tool-dispatcher.js';

// Error handling system
export type { ErrorMetadata } from './errors.js';
export {
  ErrorCategory,
  ErrorSeverity,
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  ApiClientError,
  TimeoutError,
  ConfigurationError,
  ResourceError,
  GenericError,
  ErrorClassifier,
} from './errors.js';
