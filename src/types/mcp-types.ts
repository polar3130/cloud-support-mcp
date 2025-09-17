/**
 * MCP (Model Context Protocol) tool argument type definitions
 *
 * Provides type definitions for arguments used in MCP server tool execution.
 * Compliant with Google Cloud Support API v2 official specifications.
 */

import type { CaseClassification, CasePriority } from './common-types.js';

/**
 * Support case list retrieval argument type
 */
export interface ListSupportCasesArgs {
  parent: string; // Project or organization resource name
  filter?: string; // Filter expression (e.g., "state=OPEN")
  pageSize?: number; // Number of items to retrieve (maximum 100)
  pageToken?: string; // Pagination token
}

/**
 * Individual support case retrieval argument type
 */
export interface GetSupportCaseArgs {
  name: string; // Full resource name of the case
}

/**
 * Case comment retrieval argument type
 */
export interface GetCaseCommentsArgs {
  name: string; // Full resource name of the case
  pageToken?: string; // Pagination token
}

/**
 * Support case creation argument type
 *
 * Compliant with Google Cloud Support API v2 official specifications.
 * Reference: https://cloud.google.com/support/docs/reference/rest/v2/cases/create
 */
export interface CreateSupportCaseArgs {
  parent: string; // Project or organization resource name
  displayName: string; // Short summary of the issue (required)
  description: string; // Detailed description of the issue (required)
  classification: CaseClassification; // Case classification (required)
  priority: CasePriority; // Case priority (required)
  subscriberEmailAddresses?: string[]; // Email addresses to receive update notifications
  testCase?: boolean; // Whether this is an internal API test case
  timeZone?: string; // Time zone (IANA format)
  languageCode?: string; // Support language (BCP 47 language code)
}

/**
 * Support case update argument type
 *
 * Compliant with Google Cloud Support API v2 official specifications.
 * Reference: https://cloud.google.com/support/docs/reference/rest/v2/cases/patch
 */
export interface UpdateSupportCaseArgs {
  name: string; // Full resource name of the case (required)
  updateMask?: string; // Mask for fields to update (comma-separated)
  priority?: CasePriority; // Case priority
  displayName?: string; // Case title
  subscriberEmailAddresses?: string[]; // Email addresses to receive update notifications
}

/**
 * Support case close argument type
 *
 * Compliant with Google Cloud Support API v2 official specifications.
 * Reference: https://cloud.google.com/support/docs/reference/rest/v2/cases/close
 */
export interface CloseSupportCaseArgs {
  name: string; // Full resource name of the case (required)
}

/**
 * Case comment creation argument type
 *
 * Compliant with Google Cloud Support API v2 official specifications.
 * Reference: https://cloud.google.com/support/docs/reference/rest/v2/cases.comments/create
 */
export interface CreateCaseCommentArgs {
  parent: string; // Full resource name of the case (required)
  body: string; // Comment body (required, maximum 12800 characters)
}

/**
 * Case attachment list retrieval argument type
 *
 * Compliant with Google Cloud Support API v2 official specifications.
 * Reference: https://cloud.google.com/support/docs/reference/rest/v2/cases.attachments/list
 */
export interface ListCaseAttachmentsArgs {
  parent: string; // Full resource name of the case (required)
  pageSize?: number; // Number of items to retrieve (maximum 100, default 10)
  pageToken?: string; // Pagination token
}

/**
 * Support case search argument type
 *
 * Compliant with Google Cloud Support API v2 official specifications.
 */
export interface SearchSupportCasesArgs {
  parent: string; // Project or organization resource name
  query?: string; // Search query
  state?: 'OPEN' | 'CLOSED' | 'ALL'; // Case state
  priority?: CasePriority; // Priority
  maxResults?: number; // Maximum number of results
}

/**
 * Case classification search argument type
 *
 * Compliant with Google Cloud Support API v2 official specifications.
 * Reference: https://cloud.google.com/support/docs/reference/rest/v2/caseClassifications/search
 */
export interface SearchCaseClassificationsArgs {
  query?: string; // Filter expression (e.g., 'displayName:"*Compute Engine*"')
  pageSize?: number; // Maximum number of results
  pageToken?: string; // Pagination token
}
