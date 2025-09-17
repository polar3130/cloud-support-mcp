/**
 * GetCaseCommentsHandler - get_case_comments tool handler
 *
 * Independent handler responsible for retrieving support case comment history
 * Inherits from BaseHandler to utilize common error handling and response formatting
 */

import { BaseHandler } from './base-handler.js';
import { apiClient } from '../api/index.js';
import { GetCaseCommentsArgs, CommentData } from '../types/index.js';

/**
 * Support case comment history retrieval handler
 */
export class GetCaseCommentsHandler extends BaseHandler {
  /**
   * Retrieve support case comment history
   * @param args Case specification (name: full resource name of the case)
   * @returns List of comment history
   */
  async handle(args: GetCaseCommentsArgs) {
    return await this.executeWithErrorHandling('getting case comments', async () => {
      const { name, pageToken } = args;

      // Validate required fields
      if (!name || !name.trim()) {
        throw new Error('Missing required field: name');
      }

      // Get current project ID (for logging purposes)
      await this.getCurrentProjectIdWithLogging();

      // Send request using API client (using v2 endpoint)
      const endpoint = `/v2/${name}/comments`;
      const queryParams = pageToken ? { pageToken } : {};
      const response = await apiClient.get(endpoint, queryParams);
      const data = response.data as {
        comments?: CommentData[];
        nextPageToken?: string;
      };
      const comments = data.comments || [];

      // Format comment data
      const formattedComments = comments.map((comment: CommentData) => ({
        name: comment.name || '',
        createTime: comment.createTime || '',
        creator: comment.creator?.displayName || comment.creator?.email || '',
        body: comment.body || '',
      }));

      // Return response data (BaseHandler converts to MCP format)
      const result: {
        caseName: string;
        totalComments: number;
        comments: Array<{
          name: string;
          createTime: string;
          creator: string;
          body: string;
        }>;
        nextPageToken?: string;
      } = {
        caseName: name,
        totalComments: formattedComments.length,
        comments: formattedComments,
      };

      // Include nextPageToken if it exists
      if (data.nextPageToken) {
        result.nextPageToken = data.nextPageToken;
      }

      return result;
    });
  }
}
