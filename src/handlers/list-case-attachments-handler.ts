import { BaseHandler } from './base-handler.js';
import type { ListCaseAttachmentsArgs } from '../types/index.js';
import { apiClient } from '../api/index.js';

/**
 * ListCaseAttachmentsHandler - Case attachment list retrieval functionality handler
 *
 * Retrieves case attachment lists in compliance with Google Cloud Support API v2 official specification,
 * and returns attachment information.
 */
export class ListCaseAttachmentsHandler extends BaseHandler {
  async handle(args: ListCaseAttachmentsArgs) {
    try {
      // Validate required parameters
      if (!args.parent) {
        throw new Error('parent is required');
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

      // Build API endpoint URL
      const endpoint = `/v2/${resourceType}/${resourceId}/cases/${caseId}/attachments`;

      // Build query parameters object
      const queryParamsObj: Record<string, string | number | boolean | undefined> = {};

      if (args.pageSize !== undefined) {
        const limitedPageSize = Math.min(args.pageSize, 100);
        queryParamsObj.pageSize = limitedPageSize;
      }

      if (args.pageToken !== undefined) {
        queryParamsObj.pageToken = args.pageToken;
      }

      // Execute API call
      const response = await apiClient.get(endpoint, queryParamsObj);

      // Return response data
      return this.formatSuccessResponse(response.data);
    } catch (error) {
      return this.formatErrorResponse('An error occurred while retrieving attachment list', error);
    }
  }
}
