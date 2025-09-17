import { BaseHandler } from './base-handler.js';
import type { SearchCaseClassificationsArgs } from '../types/index.js';
import { apiClient } from '../api/index.js';

/**
 * SearchCaseClassificationsHandler - Case classification search functionality handler
 *
 * Searches support case classification information in compliance with Google Cloud Support API v2 official specification,
 * and returns classification list.
 */
export class SearchCaseClassificationsHandler extends BaseHandler {
  async handle(args: SearchCaseClassificationsArgs) {
    try {
      // Build API endpoint URL
      const url = '/v2/caseClassifications:search';

      // Build query parameters
      const queryParams: Record<string, string | number | boolean | undefined> = {};

      if (args.query !== undefined) {
        queryParams.query = args.query;
      }

      if (args.pageSize !== undefined) {
        queryParams.pageSize = args.pageSize;
      }

      if (args.pageToken !== undefined) {
        queryParams.pageToken = args.pageToken;
      }

      // Execute API call (X-Goog-User-Project is automatically added in authentication processing)
      const response = await apiClient.get(url, queryParams);

      // Return response data
      return this.formatSuccessResponse(response.data);
    } catch (error) {
      return this.formatErrorResponse('Error occurred while searching case classifications', error);
    }
  }
}
