/**
 * GetSupportCaseHandler - get_support_case tool handler
 *
 * Independent handler responsible for retrieving individual support cases
 * Inherits from BaseHandler to utilize common error handling and response formatting
 */

import { BaseHandler } from './base-handler.js';
import { apiClient } from '../api/index.js';
import { GetSupportCaseArgs, SupportCaseData } from '../types/index.js';

/**
 * Individual support case retrieval handler
 */
export class GetSupportCaseHandler extends BaseHandler {
  /**
   * Retrieve detailed information for the specified support case
   * @param args Case specification (name: full resource name of the case)
   * @returns Detailed information of the support case
   */
  async handle(args: GetSupportCaseArgs) {
    return await this.executeWithErrorHandling('getting support case', async () => {
      const { name } = args;

      // Validate required fields
      if (!name) {
        throw new Error('name parameter is required');
      }

      // Get current project ID (for logging purposes)
      await this.getCurrentProjectIdWithLogging();

      // Send request using API client
      const endpoint = `/v2beta/${name}`;
      const response = await apiClient.get(endpoint);
      const supportCase = response.data as SupportCaseData;

      // Format response data (preserve all fields)
      const formattedCase = {
        name: supportCase.name || '',
        displayName: supportCase.displayName || '',
        description: supportCase.description || '',
        state: supportCase.state || '',
        priority: supportCase.priority || '',
        createTime: supportCase.createTime || '',
        updateTime: supportCase.updateTime || '',
        creator: supportCase.creator || {},
        escalated: supportCase.escalated || false,
        testCase: supportCase.testCase || false,
        contactEmail: supportCase.contactEmail || '',
        classification: supportCase.classification || {},
        // Add fields compliant with official API specification
        timeZone: supportCase.timeZone,
        subscriberEmailAddresses: supportCase.subscriberEmailAddresses || [],
        languageCode: supportCase.languageCode,
      };

      // Return response data (BaseHandler converts to MCP format)
      return formattedCase;
    });
  }
}
