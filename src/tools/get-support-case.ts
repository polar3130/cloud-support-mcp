/**
 * get_support_case tool definition
 *
 * Tool to retrieve detailed information for a specific support case
 */

import { ToolDefinition } from './types.js';

export const getSupportCaseTool: ToolDefinition = {
  name: 'get_support_case',
  description: 'Get detailed information about a specific support case',
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
