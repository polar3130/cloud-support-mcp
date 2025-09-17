/**
 * API module exports
 *
 * Provides all Google Cloud Support API related functionality
 * through a unified interface.
 */

// Authentication functionality
export {
  getAccessToken,
  getCurrentProjectId,
  getAuthHeaders,
  getAccessTokenWithMethod,
  AuthMethod,
  type AuthResult,
} from './auth.js';

// API client functionality
export {
  CloudSupportApiClient,
  apiClient,
  ApiError,
  SUPPORT_API_BASE_URL,
  type ApiRequestOptions,
  type ApiResponse,
  type RequestBody,
} from './client.js';
