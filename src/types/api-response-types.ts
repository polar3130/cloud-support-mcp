/**
 * Google Cloud Support API v2 response type definitions
 */

import type { SupportCaseData, CommentData, AttachmentData } from './api-types.js';
import type { CaseClassification } from './common-types.js';

/**
 * Base response type
 *
 * Represents common structure of all API responses
 */
export interface BaseApiResponse {
  readonly _brand?: 'ApiResponse';
}

/**
 * Actual Google Cloud Support API response structure
 *
 * Returns SupportCaseData directly or returns arrays
 */

/**
 * Support case list response
 */
export interface ListSupportCasesResponse extends BaseApiResponse {
  readonly cases?: readonly SupportCaseData[];
  readonly nextPageToken?: string;
  readonly totalSize?: number;
}

/**
 * Individual support case response (returns SupportCaseData directly)
 */
export type GetSupportCaseResponse = SupportCaseData;

/**
 * Support case creation response (returns SupportCaseData directly)
 */
export type CreateSupportCaseResponse = SupportCaseData;

/**
 * Support case update response (returns SupportCaseData directly)
 */
export type UpdateSupportCaseResponse = SupportCaseData;

/**
 * Support case close response (returns SupportCaseData directly)
 */
export type CloseSupportCaseResponse = SupportCaseData;

/**
 * Case comment list response
 */
export interface ListCaseCommentsResponse extends BaseApiResponse {
  readonly comments?: readonly CommentData[];
  readonly nextPageToken?: string;
  readonly totalSize?: number;
}

/**
 * Case comment creation response (returns CommentData directly)
 */
export type CreateCaseCommentResponse = CommentData;

/**
 * Case attachment list response
 */
export interface ListCaseAttachmentsResponse extends BaseApiResponse {
  readonly attachments?: readonly AttachmentData[];
  readonly nextPageToken?: string;
  readonly totalSize?: number;
}

/**
 * Support case search response
 */
export interface SearchSupportCasesResponse extends BaseApiResponse {
  readonly cases?: readonly SupportCaseData[];
  readonly nextPageToken?: string;
  readonly totalSize?: number;
}

/**
 * Case classification search response
 */
export interface SearchCaseClassificationsResponse extends BaseApiResponse {
  readonly caseClassifications?: readonly CaseClassification[];
  readonly nextPageToken?: string;
  readonly totalSize?: number;
}

/**
 * Error response type
 */
export interface ErrorResponse extends BaseApiResponse {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly status: string;
    readonly details?: readonly {
      readonly '@type': string;
      readonly [key: string]: unknown;
    }[];
  };
}

/**
 * API response union type
 *
 * Consolidates all possible response types that may be returned by API operations
 */
export type ApiResponseData =
  | SupportCaseData // Single case operations (create, update, get, close, escalation)
  | CommentData // Comment creation
  | ListSupportCasesResponse
  | ListCaseCommentsResponse
  | ListCaseAttachmentsResponse
  | SearchSupportCasesResponse
  | SearchCaseClassificationsResponse
  | ErrorResponse;

/**
 * Response type guard functions
 */
export const ResponseTypeGuards = {
  /**
   * Check if list response
   */
  isListResponse(
    response: unknown
  ): response is
    | ListSupportCasesResponse
    | ListCaseCommentsResponse
    | ListCaseAttachmentsResponse
    | SearchSupportCasesResponse
    | SearchCaseClassificationsResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      ('cases' in response ||
        'comments' in response ||
        'attachments' in response ||
        'caseClassifications' in response)
    );
  },

  /**
   * Check if error response
   */
  isErrorResponse(response: unknown): response is ErrorResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      'error' in response &&
      typeof (response as Record<string, unknown>).error === 'object'
    );
  },

  /**
   * Check if single case response
   */
  isSupportCaseResponse(response: unknown): response is SupportCaseData {
    return (
      typeof response === 'object' &&
      response !== null &&
      'name' in response &&
      typeof (response as Record<string, unknown>).name === 'string'
    );
  },

  /**
   * Check if comment response
   */
  isCommentResponse(response: unknown): response is CommentData {
    return (
      typeof response === 'object' &&
      response !== null &&
      'body' in response &&
      typeof (response as Record<string, unknown>).body === 'string'
    );
  },
} as const;
