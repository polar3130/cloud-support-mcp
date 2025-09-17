/**
 * close_support_case tool definition
 *
 * Tool to close an existing support case
 * Once closed, cases cannot be reopened
 */

import { ToolDefinition } from './types.js';

export const closeSupportCaseTool: ToolDefinition = {
  name: 'close_support_case',
  description: 'Close an existing support case. Once closed, the case cannot be reopened.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description:
          'The resource name of the case to close (e.g., projects/{project_id}/cases/{case_id})',
      },
    },
    required: ['name'],
  },
};
