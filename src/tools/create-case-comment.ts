/**
 * create_case_comment tool definition
 *
 * Tool to add a new comment to a support case for communication with Google Support
 */

import { ToolDefinition } from './types.js';

export const createCaseCommentTool: ToolDefinition = {
  name: 'create_case_comment',
  description: 'Add a new comment to a support case for communication with Google Support.',
  inputSchema: {
    type: 'object',
    properties: {
      parent: {
        type: 'string',
        description:
          'The name of the case to which the comment should be added (e.g., projects/{project_id}/cases/{case_id} or organizations/{org_id}/cases/{case_id})',
      },
      body: {
        type: 'string',
        description: 'The full comment body (maximum 12800 characters)',
      },
    },
    required: ['parent', 'body'],
  },
};
