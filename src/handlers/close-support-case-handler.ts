import { BaseHandler } from './base-handler.js';
import type { CloseSupportCaseArgs, SupportCaseData } from '../types/index.js';
import { apiClient } from '../api/index.js';

/**
 * CloseSupportCaseHandler - Support case close functionality handler
 *
 * Closes cases in compliance with Google Cloud Support API v2 official specification,
 * and returns closed case information.
 */
export class CloseSupportCaseHandler extends BaseHandler {
  async handle(args: CloseSupportCaseArgs) {
    try {
      const { name } = args;

      // Validate required fields
      if (!name) {
        throw new Error('Missing required field: name is required');
      }

      // Send POST request using API client (with :close suffix)
      const endpoint = `/v2/${name}:close`;
      const response = await apiClient.post(endpoint, {});
      const closedCase = response.data as SupportCaseData;

      // Return close result in MCP response format
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                message: 'Support case successfully closed',
                case: {
                  name: closedCase.name || '',
                  displayName: closedCase.displayName || '',
                  description: closedCase.description || '',
                  state: closedCase.state || '',
                  priority: closedCase.priority || '',
                  classification: closedCase.classification || {},
                  createTime: closedCase.createTime || '',
                  updateTime: closedCase.updateTime || '',
                  creator: closedCase.creator || {},
                  subscriberEmailAddresses: closedCase.subscriberEmailAddresses || [],
                  testCase: closedCase.testCase || false,
                  timeZone: closedCase.timeZone || '',
                  languageCode: closedCase.languageCode || '',
                  escalated: closedCase.escalated || false,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      // Error response
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error closing support case: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
}
