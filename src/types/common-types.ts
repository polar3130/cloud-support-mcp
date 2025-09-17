/**
 * Google Cloud Support API v2 Common Type Definitions
 *
 * Provides basic type definitions used in Google Cloud Support API.
 * Reference: https://cloud.google.com/support/docs/reference/rest/v2/
 */

/**
 * Google Cloud Support API v2 - Actor type definition
 * Reference: https://cloud.google.com/support/docs/reference/rest/v2/Actor
 */
export interface Actor {
  displayName?: string; // Display name (required if email is provided)
  email?: string; // Email address (deprecated, username is recommended)
  googleSupport?: boolean; // Whether this is a Google Support actor (read-only)
  username?: string; // Username (read-only)
}

/**
 * Google Cloud Support API v2 - CaseClassification type definition
 * Reference: https://cloud.google.com/support/docs/reference/rest/v2/caseClassifications
 */
export interface CaseClassification {
  id: string; // Unique classification ID (required when creating a case)
  displayName?: string; // Display name (not static)
}

/**
 * Google Cloud Support API v2 - Case State enumeration
 * Reference: https://cloud.google.com/support/docs/reference/rest/v2/cases
 */
export type CaseState =
  | 'STATE_UNSPECIFIED' // Unknown state
  | 'NEW' // Created but not yet assigned to a support agent
  | 'IN_PROGRESS_GOOGLE_SUPPORT' // Being handled by Google Support
  | 'ACTION_REQUIRED' // Waiting for response from Google
  | 'SOLUTION_PROVIDED' // Solution provided but not yet closed
  | 'CLOSED'; // Case resolved

/**
 * Google Cloud Support API v2 - Case Priority enumeration
 * Reference: https://cloud.google.com/support/docs/reference/rest/v2/cases
 */
export type CasePriority =
  | 'PRIORITY_UNSPECIFIED' // Undefined or not set
  | 'P0' // Extreme impact on production service (service outage)
  | 'P1' // Critical impact on production service (unusable)
  | 'P2' // Serious impact on production service (significantly degraded)
  | 'P3' // Moderate impact on production service (moderately degraded)
  | 'P4'; // General questions or minor issues
