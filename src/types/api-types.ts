/**
 * Google Cloud Support API v2 Data Type Definitions
 *
 * Defines the response data structures for Google Cloud Support API.
 * Reference: https://cloud.google.com/support/docs/reference/rest/v2/
 */

import type { Actor, CaseClassification, CaseState, CasePriority } from './common-types.js';

/**
 * Google Cloud Support API v2 - Case type definition (compliant with official API)
 * Reference: https://cloud.google.com/support/docs/reference/rest/v2/cases
 */
export interface SupportCaseData {
  name?: string; // Case resource name (identifier)
  displayName?: string; // Short summary of the problem
  description?: string; // Comprehensive description of the problem
  classification?: CaseClassification; // Case classification
  timeZone?: string; // Time zone (IANA format)
  subscriberEmailAddresses?: string[]; // Email addresses to receive update notifications
  state?: CaseState; // Current state of the case (read-only)
  createTime?: string; // Case creation time (RFC 3339, read-only)
  updateTime?: string; // Case last update time (RFC 3339, read-only)
  creator?: Actor; // Case creator
  contactEmail?: string; // Email address for case update notifications (for BYOID)
  escalated?: boolean; // Whether the case has been escalated
  testCase?: boolean; // Whether this is an internal API test case
  languageCode?: string; // Support language (BCP 47 language code)
  priority?: CasePriority; // Case priority
}

/**
 * Google Cloud Support API v2 - Comment type definition
 * Reference: https://cloud.google.com/support/docs/reference/rest/v2/cases.comments
 */
export interface CommentData {
  name?: string; // Comment resource name (read-only)
  createTime?: string; // Comment creation time (RFC 3339, read-only)
  creator?: Actor; // Comment creator (read-only)
  body?: string; // Comment body (maximum 12800 characters)
  plainTextBody?: string; // Plain text body (deprecated, duplicates body)
}

/**
 * Google Cloud Support API v2 - Attachment type definition
 * Reference: https://cloud.google.com/support/docs/reference/rest/v2/Attachment
 */
export interface AttachmentData {
  name?: string; // Attachment resource name (read-only)
  createTime?: string; // Attachment creation time (RFC 3339, read-only)
  creator?: Actor; // Attachment creator (read-only)
  filename?: string; // File name
  mimeType?: string; // MIME type
  sizeBytes?: string; // File size (bytes)
}
