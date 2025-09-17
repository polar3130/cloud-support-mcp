import { BaseHandler } from './base-handler.js';
import type { UpdateSupportCaseArgs, SupportCaseData } from '../types/index.js';
import { apiClient } from '../api/index.js';

/**
 * UpdateSupportCaseHandler - Handler for support case update functionality
 *
 * Updates cases in compliance with Google Cloud Support API v2 official specifications
 * and returns updated case information.
 */
export class UpdateSupportCaseHandler extends BaseHandler {
  async handle(args: UpdateSupportCaseArgs) {
    try {
      const { name, updateMask, priority, displayName, subscriberEmailAddresses } = args;

      // Validate required fields
      if (!name) {
        throw new Error('Missing required field: name is required');
      }

      // Set up updateMask
      let queryParams: Record<string, string> = {};
      if (updateMask) {
        queryParams.updateMask = updateMask;
      } else {
        // If updateMask is not specified, update all provided fields
        const fields = [];
        if (priority !== undefined) fields.push('priority');
        if (displayName !== undefined) fields.push('displayName');
        if (subscriberEmailAddresses !== undefined) fields.push('subscriberEmailAddresses');
        if (fields.length > 0) {
          queryParams.updateMask = fields.join(',');
        }
      }

      // Build request body
      const requestBody: Record<string, unknown> = {};
      if (priority !== undefined) requestBody.priority = priority;
      if (displayName !== undefined) requestBody.displayName = displayName;
      if (subscriberEmailAddresses !== undefined)
        requestBody.subscriberEmailAddresses = subscriberEmailAddresses;

      // Send PATCH request using API client
      const endpoint = `/v2/${name}`;
      const response = await apiClient.patch(endpoint, requestBody, queryParams);
      const updatedCase = response.data as SupportCaseData;

      // Return update result in MCP response format
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                message: 'Support case successfully updated',
                case: {
                  name: updatedCase.name || '',
                  displayName: updatedCase.displayName || '',
                  description: updatedCase.description || '',
                  state: updatedCase.state || '',
                  priority: updatedCase.priority || '',
                  classification: updatedCase.classification || {},
                  createTime: updatedCase.createTime || '',
                  updateTime: updatedCase.updateTime || '',
                  creator: updatedCase.creator || {},
                  subscriberEmailAddresses: updatedCase.subscriberEmailAddresses || [],
                  testCase: updatedCase.testCase || false,
                  timeZone: updatedCase.timeZone || '',
                  languageCode: updatedCase.languageCode || '',
                  escalated: updatedCase.escalated || false,
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
            text: `Error updating support case: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
}
