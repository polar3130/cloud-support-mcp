/**
 * Google Cloud Support API v2 Request Type Definitions
 */

import type { CaseClassification, CasePriority } from './common-types.js';

/**
 * Base request body type
 *
 * Represents the common structure of API requests
 */
export interface BaseRequestBody {
  readonly _brand?: 'RequestBody';
}

/**
 * Support case creation request body
 */
export interface CreateSupportCaseRequestBody extends BaseRequestBody {
  readonly displayName: string;
  readonly description: string;
  readonly classification: CaseClassification;
  readonly timeZone?: string;
  readonly subscriberEmailAddresses?: readonly string[];
  readonly languageCode?: string;
  readonly priority?: CasePriority;
  readonly testCase?: boolean;
}

/**
 * Support case update request body
 */
export interface UpdateSupportCaseRequestBody extends BaseRequestBody {
  readonly displayName?: string;
  readonly subscriberEmailAddresses?: readonly string[];
  readonly priority?: CasePriority;
}

/**
 * Case comment creation request body
 */
export interface CreateCaseCommentRequestBody extends BaseRequestBody {
  readonly body: string;
}

/**
 * Case search request body (for search queries)
 */
export interface SearchSupportCasesRequestBody extends BaseRequestBody {
  readonly query?: string;
}

/**
 * Classification search request body
 */
export interface SearchCaseClassificationsRequestBody extends BaseRequestBody {
  readonly query?: string;
}

/**
 * Empty request body (for GET/DELETE operations)
 */
export type EmptyRequestBody = Record<string, never>;

/**
 * Union type for request bodies
 *
 * Integrates all request body types available for API operations
 */
export type ApiRequestBody =
  | CreateSupportCaseRequestBody
  | UpdateSupportCaseRequestBody
  | CreateCaseCommentRequestBody
  | SearchSupportCasesRequestBody
  | SearchCaseClassificationsRequestBody
  | EmptyRequestBody;

/**
 * Type for JSON serializable values
 *
 * Strictly defines constraints for values that can be used in API request bodies
 */
export type JsonSerializable =
  | string
  | number
  | boolean
  | null
  | JsonSerializable[]
  | { readonly [key: string]: JsonSerializable };

/**
 * Strict type checker functions
 */
export const RequestBodyValidators = {
  /**
   * Check if request body is JSON serializable
   */
  isJsonSerializable(value: unknown): value is JsonSerializable {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return true;
    }

    if (Array.isArray(value)) {
      return value.every((item) => this.isJsonSerializable(item));
    }

    if (typeof value === 'object' && value !== null) {
      return Object.values(value).every((val) => this.isJsonSerializable(val));
    }

    return false;
  },

  /**
   * Check if value is a valid request body
   */
  isValidRequestBody(value: unknown): value is ApiRequestBody {
    return value !== null && typeof value === 'object' && this.isJsonSerializable(value);
  },
} as const;
