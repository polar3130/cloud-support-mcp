/**
 * Google Cloud Support API v2 client
 */

import { getAuthHeaders } from './auth.js';
import type { JsonSerializable, ApiRequestBody } from '../types/api-request-types.js';

/**
 * Base URL for Google Cloud Support API
 */
export const SUPPORT_API_BASE_URL = 'https://cloudsupport.googleapis.com';

/**
 * Request body type definition
 *
 * Only allows JSON serializable values, string, or null
 */
export type RequestBody = ApiRequestBody | JsonSerializable | string | null;

/**
 * API request options
 *
 */
export interface ApiRequestOptions {
  readonly method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  readonly body?: RequestBody;
  readonly queryParams?: Readonly<Record<string, string | number | boolean | undefined>>;
}

/**
 * API response type
 *
 */
export interface ApiResponse<TData = unknown> {
  readonly data: TData;
  readonly status: number;
  readonly headers: Headers;
}

/**
 * API error type
 *
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly response?: JsonSerializable | string | null
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Unified HTTP client for Google Cloud Support API v2
 *
 */
export class CloudSupportApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = SUPPORT_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Send request to API endpoint
   *
   * @param endpoint API endpoint (part after /v2)
   * @param options Request options
   * @returns API response
   *
   */
  async request<TData = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<TData>> {
    const { method = 'GET', body, queryParams } = options;

    // Build URL
    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add query parameters
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    try {
      // Get authentication headers
      const authHeaders = await getAuthHeaders();

      // Validate and prepare request body
      let requestBody: string | undefined;
      if (body !== null && body !== undefined) {
        if (typeof body === 'string') {
          requestBody = body;
        } else {
          // Type-safe JSON serialization based on RequestBody type
          if (this.isValidRequestBody(body)) {
            requestBody = JSON.stringify(body);
          } else {
            throw new Error(
              'Invalid request body: must be ApiRequestBody, JsonSerializable, string, or null'
            );
          }
        }
      }

      // Execute request
      const response = await fetch(url.toString(), {
        method,
        headers: authHeaders,
        body: requestBody,
      });

      // Parse response data
      if (response.ok) {
        const responseData = await response.json();

        // Basic validation of response type
        if (typeof responseData !== 'object' || responseData === null) {
          throw new Error('Invalid response format: expected object');
        }

        return {
          data: responseData as TData,
          status: response.status,
          headers: response.headers,
        };
      } else {
        // For error responses, get text
        let errorText = '';
        try {
          errorText = await response.text();
        } catch {
          // Use empty string if text retrieval fails
          errorText = '';
        }

        const errorMessage = errorText
          ? `HTTP ${response.status}: ${response.statusText} - ${errorText}`
          : `HTTP ${response.status}: ${response.statusText}`;

        throw new ApiError(errorMessage, response.status, null);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error(`Request failed: ${error}`);
    }
  }

  /**
   * Send GET request
   *
   */
  async get<TData = unknown>(
    endpoint: string,
    queryParams?: Readonly<Record<string, string | number | boolean | undefined>>
  ): Promise<ApiResponse<TData>> {
    return this.request<TData>(endpoint, { method: 'GET', queryParams });
  }

  /**
   * Send POST request
   *
   */
  async post<TData = unknown>(
    endpoint: string,
    body?: RequestBody,
    queryParams?: Readonly<Record<string, string | number | boolean | undefined>>
  ): Promise<ApiResponse<TData>> {
    return this.request<TData>(endpoint, { method: 'POST', body, queryParams });
  }

  /**
   * Send PATCH request
   *
   */
  async patch<TData = unknown>(
    endpoint: string,
    body?: RequestBody,
    queryParams?: Readonly<Record<string, string | number | boolean | undefined>>
  ): Promise<ApiResponse<TData>> {
    return this.request<TData>(endpoint, { method: 'PATCH', body, queryParams });
  }

  /**
   * Validate request body validity
   *
   * @private
   */
  private isValidRequestBody(body: unknown): body is JsonSerializable {
    if (body === null || body === undefined) {
      return true;
    }

    if (typeof body === 'string' || typeof body === 'number' || typeof body === 'boolean') {
      return true;
    }

    if (Array.isArray(body)) {
      return body.every((item) => this.isValidRequestBody(item));
    }

    if (typeof body === 'object' && body !== null) {
      // Check if it's a plain object (not a class instance)
      if (body.constructor === Object || body.constructor === undefined) {
        return Object.values(body).every((val) => this.isValidRequestBody(val));
      }
    }

    return false;
  }
}

/**
 * Default API client instance
 */
export const apiClient = new CloudSupportApiClient();
