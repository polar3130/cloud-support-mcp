/**
 * get_case_comments tool definition
 *
 * Tool to retrieve comments and conversation history for a specific support case
 */

import { ToolDefinition } from './types.js';

export const getCaseCommentsTool: ToolDefinition = {
  name: 'get_case_comments',
  description: 'Get comments and conversation history for a specific support case',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description:
          'The full resource name of the case (e.g., projects/{project_id}/cases/{case_id})',
      },
    },
    required: ['name'],
  },
};
