/**
 * ListSupportCasesHandler - list_support_cases tool handler
 *
 * Independent handler responsible for support case list retrieval
 * Inherits from BaseHandler and utilizes common error handling and response format
 */

import { BaseHandler } from './base-handler.js';
import { apiClient } from '../api/index.js';
import { ListSupportCasesArgs, SupportCaseData } from '../types/index.js';

/**
 * Support case list retrieval handler
 */
export class ListSupportCasesHandler extends BaseHandler {
  /**
   * Get support case list
   * @param args Retrieval conditions (parent: parent resource, filter: filter, pageSize: page size, etc.)
   * @returns Support case list
   */
  async handle(args: ListSupportCasesArgs) {
    return this.executeWithErrorHandling('listing support cases', async () => {
      const { parent, filter, pageSize = 50, pageToken } = args;

      // Required field validation
      if (!parent) {
        throw new Error('Required field "parent" is missing');
      }

      // Get current project ID (for logging)
      await this.getCurrentProjectIdWithLogging();

      // Send request using API client
      const endpoint = `/v2beta/${parent}/cases`;
      const queryParams = {
        pageSize,
        filter,
        pageToken,
      };

      const response = await apiClient.get(endpoint, queryParams);
      const data = response.data as {
        cases?: SupportCaseData[];
        nextPageToken?: string;
      };
      const cases = data.cases || [];

      // Maintain complete response data structure (API specification compliant)
      const formattedResponse = {
        cases: cases.map((case_: SupportCaseData) => ({
          // Required fields
          name: case_.name || '',
          displayName: case_.displayName || '',
          description: case_.description || '',
          state: case_.state || '',
          createTime: case_.createTime || '',
          updateTime: case_.updateTime || '',
          creator: case_.creator || {},
          escalated: case_.escalated || false,
          testCase: case_.testCase || false,

          // Optional fields (set only if they exist)
          ...(case_.classification && { classification: case_.classification }),
          ...(case_.timeZone && { timeZone: case_.timeZone }),
          ...(case_.subscriberEmailAddresses && {
            subscriberEmailAddresses: case_.subscriberEmailAddresses,
          }),
          ...(case_.priority && { priority: case_.priority }),
          ...(case_.contactEmail && { contactEmail: case_.contactEmail }),
          ...(case_.languageCode && { languageCode: case_.languageCode }),
        })),
        ...(data.nextPageToken && { nextPageToken: data.nextPageToken }),
        totalCount: cases.length,
      };

      return formattedResponse;
    });
  }
}
