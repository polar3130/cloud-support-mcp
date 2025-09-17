import { BaseHandler } from './base-handler.js';
import type { CreateCaseCommentArgs } from '../types/index.js';
import { apiClient } from '../api/index.js';

/**
 * CommentData - Comment data type in API response
 */
interface CommentData {
  name: string;
  createTime: string;
  creator?: {
    displayName?: string;
    email?: string;
    googleSupport?: boolean;
  };
  body: string;
}

/**
 * CreateCaseCommentHandler - Handler for case comment creation functionality
 *
 * Adds comments to cases in compliance with Google Cloud Support API v2 official specifications
 * and returns created comment information.
 */
export class CreateCaseCommentHandler extends BaseHandler {
  async handle(args: CreateCaseCommentArgs) {
    try {
      // Validate required parameters
      if (!args.parent) {
        throw new Error('parent is required');
      }
      if (args.body === undefined || args.body === null) {
        throw new Error('body is required');
      }

      // Validate body content
      if (args.body.trim() === '') {
        throw new Error('body cannot be empty');
      }

      // Validate body maximum characters (12800 characters)
      if (args.body.length > 12800) {
        throw new Error('body exceeds maximum length of 12800 characters');
      }

      // Validate parent name format
      const parentParts = args.parent.split('/');
      if (
        parentParts.length !== 4 ||
        (parentParts[0] !== 'projects' && parentParts[0] !== 'organizations') ||
        parentParts[2] !== 'cases'
      ) {
        throw new Error(
          'Invalid parent format. Expected: projects/{project_id}/cases/{case_id} or organizations/{org_id}/cases/{case_id}'
        );
      }

      const resourceType = parentParts[0];
      const resourceId = parentParts[1];
      const caseId = parentParts[3];

      // Request body for comment creation
      const requestBody = {
        body: args.body,
      };

      // Send POST request using API client
      const endpoint = `/v2/${resourceType}/${resourceId}/cases/${caseId}/comments`;
      const response = await apiClient.post(endpoint, requestBody);
      const createdComment = response.data as unknown as CommentData;

      // Return comment creation result in MCP response format
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                message: `Comment has been successfully added to case ${args.parent}.`,
                comment: {
                  name: createdComment.name || '',
                  createTime: createdComment.createTime || '',
                  creator: {
                    displayName: createdComment.creator?.displayName || 'Unknown',
                    email: createdComment.creator?.email || '',
                    googleSupport: createdComment.creator?.googleSupport || false,
                  },
                  body: createdComment.body || '',
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
            text: `Error creating case comment: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
}
