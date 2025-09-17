import { BaseHandler } from './base-handler.js';
import { apiClient } from '../api/index.js';
import type { CreateSupportCaseArgs } from '../types/index.js';
import type { CreateSupportCaseResponse } from '../types/api-response-types.js';
import type { CreateSupportCaseRequestBody } from '../types/api-request-types.js';

/**
 * CreateSupportCaseHandler
 * Handler responsible for support case creation functionality
 */
export class CreateSupportCaseHandler extends BaseHandler {
  /**
   * Execute support case creation
   * @param args Case creation conditions (parent resource, display name, description, classification, etc.)
   * @returns Created support case information
   */
  async handle(args: CreateSupportCaseArgs) {
    try {
      const {
        parent,
        displayName,
        description,
        classification,
        priority,
        subscriberEmailAddresses,
        testCase,
        timeZone,
        languageCode,
      } = args;

      // Validate required fields
      if (!parent || !displayName || !description || !classification || !priority) {
        throw new Error(
          'Missing required fields: parent, displayName, description, classification, and priority are required'
        );
      }

      // Validate classification.id
      if (!classification.id) {
        throw new Error('Missing required field: classification.id is required');
      }

      // Get current project ID (for logging)
      await this.getCurrentProjectIdWithLogging();

      // Build request body (type-safe)
      const requestBody: CreateSupportCaseRequestBody = {
        displayName,
        description,
        classification,
        priority,
        subscriberEmailAddresses,
        testCase,
        timeZone,
        languageCode,
      };

      // Send POST request using API client (type-safe)
      const endpoint = `/v2/${parent}/cases`;
      const response = await apiClient.post<CreateSupportCaseResponse>(endpoint, requestBody);

      const createdCase = response.data as CreateSupportCaseResponse;

      // Return creation result in MCP response format
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'Support case created successfully',
                case: {
                  name: createdCase.name || '',
                  displayName: createdCase.displayName || '',
                  description: createdCase.description || '',
                  state: createdCase.state || '',
                  priority: createdCase.priority || '',
                  classification: createdCase.classification || {},
                  createTime: createdCase.createTime || '',
                  updateTime: createdCase.updateTime || '',
                  creator: createdCase.creator || {},
                  escalated: createdCase.escalated || false,
                  subscriberEmailAddresses: createdCase.subscriberEmailAddresses || [],
                  testCase: createdCase.testCase || false,
                  timeZone: createdCase.timeZone || '',
                  languageCode: createdCase.languageCode || '',
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      // Use BaseHandler's error handling
      return this.formatErrorResponse('creating support case', error);
    }
  }
}
